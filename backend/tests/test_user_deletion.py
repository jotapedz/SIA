import os
import sqlite3
import unittest
from datetime import datetime, timezone, timedelta
from types import SimpleNamespace
from unittest.mock import AsyncMock, patch

os.environ.setdefault("SUPABASE_URL", "https://example.invalid")
os.environ.setdefault("SUPABASE_PUBLISHABLE_KEY", "test")
os.environ.setdefault("DATABASE_URL", "postgresql+asyncpg://test:test@localhost/test")

from fastapi import HTTPException
from fastapi.testclient import TestClient
from app.main import app
from app.api.routes import usuarios
from app.dependencies.profile import get_authorized_profile
from app.schemas.usuario import UsuarioDelete
from app.services.relatorios import REPORT_JOINS, VISIBLE_REPORT


NOW = datetime(2026, 11, 1, 12, tzinfo=timezone.utc)
PROFILE = SimpleNamespace(id="00000000-0000-0000-0000-000000000001")


class UserDeletion(unittest.IsolatedAsyncioTestCase):
    async def test_self_deletion_is_rejected(self):
        session = AsyncMock()
        with patch.object(usuarios, "get_usuario_or_404", AsyncMock(return_value=SimpleNamespace(updated_at=NOW))), \
             patch.object(usuarios, "get_profile_id", AsyncMock(return_value=2)):
            with self.assertRaises(HTTPException) as caught:
                await usuarios.excluir_usuario(UsuarioDelete(expected_updated_at=NOW), 2, PROFILE, session)
        self.assertEqual(caught.exception.status_code, 422)
        session.execute.assert_not_awaited()
        session.commit.assert_not_awaited()

    async def test_stale_data_is_rejected(self):
        session = AsyncMock()
        with patch.object(usuarios, "get_usuario_or_404", AsyncMock(return_value=SimpleNamespace(updated_at=NOW + timedelta(seconds=1)))):
            with self.assertRaises(HTTPException) as caught:
                await usuarios.excluir_usuario(UsuarioDelete(expected_updated_at=NOW), 2, PROFILE, session)
        self.assertEqual(caught.exception.status_code, 409)
        session.execute.assert_not_awaited()

    async def test_already_deleted_user_is_not_modified(self):
        session = AsyncMock()
        with patch.object(usuarios, "get_usuario_or_404", AsyncMock(side_effect=HTTPException(status_code=404))):
            with self.assertRaises(HTTPException) as caught:
                await usuarios.excluir_usuario(UsuarioDelete(expected_updated_at=NOW), 2, PROFILE, session)
        self.assertEqual(caught.exception.status_code, 404)
        session.execute.assert_not_awaited()

    async def test_report_and_history_authorship_survive_deletion(self):
        db = sqlite3.connect(":memory:")
        self.addCleanup(db.close)
        db.execute("ATTACH DATABASE ':memory:' AS public")
        db.create_function("clock_timestamp", 0, lambda: NOW.isoformat())
        db.executescript('''
            CREATE TABLE public."Perfil" (id_perfil INTEGER PRIMARY KEY, nome TEXT,
                data_exclusao TEXT, data_atualizacao TEXT, is_active INTEGER, status TEXT, auth_user_id TEXT);
            CREATE TABLE public."Discente" (id_discente INTEGER PRIMARY KEY, nome TEXT, data_exclusao TEXT);
            CREATE TABLE public."Relatório" (id_relatorio INTEGER PRIMARY KEY, id_discente INTEGER, id_autor INTEGER, data_exclusao TEXT);
            CREATE TABLE public."HistoricoAcesso" (id_historico INTEGER PRIMARY KEY, id_perfil INTEGER, acao TEXT);
            INSERT INTO public."Perfil" VALUES (2, 'Autor de teste', NULL, NULL, 1, 'ATIVO', 'auth-preservado');
            INSERT INTO public."Discente" VALUES (3, 'Discente de teste', NULL);
            INSERT INTO public."Relatório" VALUES (4, 3, 2, NULL);
            INSERT INTO public."HistoricoAcesso" VALUES (5, 2, 'Adição de relatório');
        ''')
        session = AsyncMock()
        async def execute(sql, params):
            return db.execute(str(sql), params)
        session.execute.side_effect = execute
        session.commit.side_effect = db.commit
        with patch.object(usuarios, "get_usuario_or_404", AsyncMock(return_value=SimpleNamespace(updated_at=NOW))), \
             patch.object(usuarios, "get_profile_id", AsyncMock(return_value=1)), \
             patch.object(usuarios, "registrar", AsyncMock()) as audit, \
             patch.object(usuarios, "SupabaseAdmin", side_effect=AssertionError("não deve apagar a conta auth")):
            result = await usuarios.excluir_usuario(UsuarioDelete(expected_updated_at=NOW), 2, PROFILE, session)
        self.assertEqual(result, {"deleted": True})
        self.assertEqual(db.execute('SELECT is_active, status, auth_user_id FROM public."Perfil" WHERE id_perfil = 2').fetchone(), (0, "INATIVO", "auth-preservado"))
        self.assertIsNotNone(db.execute('SELECT data_exclusao FROM public."Perfil" WHERE id_perfil = 2').fetchone()[0])
        self.assertEqual(db.execute(f'SELECT r.id_relatorio, p.nome {REPORT_JOINS} WHERE {VISIBLE_REPORT}').fetchall(), [(4, "Autor de teste")])
        self.assertEqual(db.execute('SELECT h.acao, p.nome FROM public."HistoricoAcesso" h JOIN public."Perfil" p ON p.id_perfil = h.id_perfil').fetchall(), [("Adição de relatório", "Autor de teste")])
        self.assertEqual(db.execute('SELECT nome FROM public."Discente"').fetchall(), [("Discente de teste",)])
        audit.assert_awaited_once_with(session, PROFILE, "USUARIO", 2, "Exclusão de usuário", campos=["data_exclusao", "is_active", "status"])
        session.commit.assert_awaited_once()

    async def test_audit_failure_prevents_commit(self):
        session = AsyncMock()
        with patch.object(usuarios, "get_usuario_or_404", AsyncMock(return_value=SimpleNamespace(updated_at=NOW))), \
             patch.object(usuarios, "get_profile_id", AsyncMock(return_value=1)), \
             patch.object(usuarios, "registrar", AsyncMock(side_effect=RuntimeError("audit unavailable"))):
            with self.assertRaises(RuntimeError):
                await usuarios.excluir_usuario(UsuarioDelete(expected_updated_at=NOW), 2, PROFILE, session)
        session.commit.assert_not_awaited()

    async def test_removed_profile_is_denied_even_with_auth_session(self):
        session = AsyncMock()
        session.execute.return_value = SimpleNamespace(mappings=lambda: SimpleNamespace(one_or_none=lambda: None))
        with self.assertRaises(HTTPException) as caught:
            await get_authorized_profile(PROFILE, session)
        self.assertEqual(caught.exception.status_code, 403)
        self.assertIn("data_exclusao IS NULL", str(session.execute.call_args.args[0]))

    def test_deletion_requires_authentication(self):
        response = TestClient(app).post("/v1/usuarios/2/exclusao", json={"expected_updated_at": NOW.isoformat()})
        self.assertEqual(response.status_code, 401)
