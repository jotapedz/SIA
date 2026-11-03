import os
import unittest
from datetime import datetime, timezone, timedelta
from types import SimpleNamespace
from unittest.mock import AsyncMock, patch
from uuid import UUID

os.environ.setdefault("SUPABASE_URL", "https://example.invalid")
os.environ.setdefault("SUPABASE_PUBLISHABLE_KEY", "test")
os.environ.setdefault("DATABASE_URL", "postgresql+asyncpg://test:test@localhost/test")

from fastapi import HTTPException
from fastapi.testclient import TestClient
from app.main import app
from app.api.routes import discentes, relatorios, usuarios
from app.schemas.historico import DiscenteDelete
from app.schemas.usuario import UsuarioUpdate
from app.schemas.relatorio import RelatorioCancel, RelatorioUpdate
from app.services.historico import consultar, registrar
from app.schemas.discente import DiscenteResponse, DiscenteUpdate, FamilyContact
from app.services.discentes import alteracoes_discente


NOW = datetime(2026, 11, 1, 12, tzinfo=timezone.utc)
PROFILE = SimpleNamespace(id=UUID("00000000-0000-0000-0000-000000000001"))


class Workflows(unittest.IsolatedAsyncioTestCase):
    async def test_reading_student_does_not_write_history(self):
        session = AsyncMock()
        student = SimpleNamespace(id=1)
        with patch.object(discentes, "get_discente_or_404", AsyncMock(return_value=student)), \
             patch.object(discentes, "registrar", AsyncMock()) as audit:
            self.assertIs(await discentes.get_discente(1, PROFILE, session), student)
        audit.assert_not_awaited()
        session.execute.assert_not_awaited()
        session.commit.assert_not_awaited()

    async def test_reading_report_does_not_write_history(self):
        session = AsyncMock()
        report = SimpleNamespace(id=1)
        with patch.object(relatorios, "get_relatorio_or_404", AsyncMock(return_value=report)), \
             patch.object(relatorios, "registrar", AsyncMock()) as audit:
            self.assertIs(await relatorios.get_relatorio(1, PROFILE, session), report)
        audit.assert_not_awaited()
        session.execute.assert_not_awaited()
        session.commit.assert_not_awaited()

    async def test_old_read_events_are_excluded_from_history_and_count(self):
        for entity in ("DISCENTE", "RELATORIO"):
            with self.subTest(entity=entity):
                session = AsyncMock()
                session.execute.side_effect = [SimpleNamespace(scalar_one=lambda: 0), SimpleNamespace(mappings=lambda: [])]
                await consultar(session, entity, 1, 1, 10)
                for call in session.execute.call_args_list:
                    sql = str(call.args[0])
                    self.assertIn("lower(btrim(h.acao)) NOT IN", sql)
                    self.assertIn("'consulta de discente'", sql)
                    self.assertIn("'consulta de relatório'", sql)

    async def test_stale_student_cannot_be_deleted(self):
        session = AsyncMock()
        current = SimpleNamespace(updated_at=NOW)
        with patch.object(discentes, "get_discente_or_404", AsyncMock(return_value=current)):
            with self.assertRaises(HTTPException) as caught:
                await discentes.excluir_discente(DiscenteDelete(expected_updated_at=NOW - timedelta(seconds=1)), 1, PROFILE, session)
        self.assertEqual(caught.exception.status_code, 409)
        session.execute.assert_not_awaited()
        session.commit.assert_not_awaited()

    async def test_delete_is_logical_and_audited_before_commit(self):
        session = AsyncMock()
        events = []
        session.execute.side_effect = lambda *a, **k: events.append("update")
        session.commit.side_effect = lambda: events.append("commit")
        async def audit(*args):
            events.append("audit")
        with patch.object(discentes, "get_discente_or_404", AsyncMock(return_value=SimpleNamespace(updated_at=NOW))), \
             patch.object(discentes, "registrar", side_effect=audit):
            result = await discentes.excluir_discente(DiscenteDelete(expected_updated_at=NOW), 1, PROFILE, session)
        self.assertEqual(result, {"deleted": True})
        self.assertEqual(events, ["update", "audit", "commit"])
        sql = str(session.execute.call_args.args[0])
        self.assertIn("data_exclusao", sql)
        self.assertNotIn("DELETE", sql.upper())

    async def test_audit_failure_prevents_delete_commit(self):
        session = AsyncMock()
        with patch.object(discentes, "get_discente_or_404", AsyncMock(return_value=SimpleNamespace(updated_at=NOW))), \
             patch.object(discentes, "registrar", AsyncMock(side_effect=RuntimeError("audit unavailable"))):
            with self.assertRaises(RuntimeError):
                await discentes.excluir_discente(DiscenteDelete(expected_updated_at=NOW), 1, PROFILE, session)
        session.commit.assert_not_awaited()

    async def test_user_cannot_disable_own_access(self):
        session = AsyncMock()
        data = UsuarioUpdate(full_name="Agente", role="AGENTE_ACESSIBILIDADE", status="INATIVO", expected_updated_at=NOW)
        with patch.object(usuarios, "get_usuario_or_404", AsyncMock(return_value=SimpleNamespace(updated_at=NOW))), \
             patch.object(usuarios, "get_profile_id", AsyncMock(return_value=1)):
            with self.assertRaises(HTTPException) as caught:
                await usuarios.update_usuario(data, 1, PROFILE, session)
        self.assertEqual(caught.exception.status_code, 422)
        session.execute.assert_not_awaited()

    async def test_stale_user_update_cannot_overwrite_newer_data(self):
        session = AsyncMock()
        data = UsuarioUpdate(full_name="Agente", role="AGENTE_ACESSIBILIDADE", status="ATIVO", expected_updated_at=NOW)
        with patch.object(usuarios, "get_usuario_or_404", AsyncMock(return_value=SimpleNamespace(updated_at=NOW + timedelta(seconds=1)))):
            with self.assertRaises(HTTPException) as caught:
                await usuarios.update_usuario(data, 2, PROFILE, session)
        self.assertEqual(caught.exception.status_code, 409)
        session.execute.assert_not_awaited()

    async def test_cancelled_report_cannot_be_cancelled_again(self):
        session = AsyncMock()
        with patch.object(relatorios, "get_relatorio_or_404", AsyncMock(return_value=SimpleNamespace(status="CANCELADO", updated_at=NOW))):
            with self.assertRaises(HTTPException) as caught:
                await relatorios.cancel_relatorio(RelatorioCancel(expected_updated_at=NOW), 3, PROFILE, session)
        self.assertEqual(caught.exception.status_code, 409)
        session.execute.assert_not_awaited()

    async def test_history_filters_by_record_and_paginates(self):
        session = AsyncMock()
        count = SimpleNamespace(scalar_one=lambda: 11)
        rows = SimpleNamespace(mappings=lambda: [])
        session.execute.side_effect = [count, rows]
        result = await consultar(session, "RELATORIO", 7, 2, 10)
        sql, params = session.execute.call_args.args
        self.assertIn("lower(h.entidade) IN ('relatorio', 'relatório')", str(sql))
        self.assertEqual(params, {"id": 7, "limit": 10, "offset": 10})
        self.assertEqual(result.total, 11)

    async def test_student_history_excludes_reports_in_results_and_count(self):
        import sqlite3
        db = sqlite3.connect(":memory:")
        self.addCleanup(db.close)
        db.row_factory = sqlite3.Row
        db.create_function("btrim", 1, lambda value: value.strip())
        db.execute("ATTACH DATABASE ':memory:' AS public")
        db.execute('CREATE TABLE public."HistoricoAcesso" (id_historico INTEGER, data_evento TEXT, acao TEXT, id_perfil INTEGER, entidade TEXT, id_registro INTEGER)')
        db.execute('CREATE TABLE public."Perfil" (id_perfil INTEGER, nome TEXT)')
        db.execute('CREATE TABLE public."Relatório" (id_relatorio INTEGER, resumo_demanda TEXT)')
        db.execute('INSERT INTO public."Perfil" VALUES (1, ?)', ('Agente',))
        db.execute('INSERT INTO public."Relatório" VALUES (7, ?)', ('Título atual',))
        db.executemany('INSERT INTO public."HistoricoAcesso" VALUES (?, ?, ?, 1, ?, 7)', [
            (1, NOW.isoformat(), "Edição de status", "Discente"),
            (2, NOW.isoformat(), "Edição de título", "Relatório"),
            (3, NOW.isoformat(), "Consulta de discente", "Discente"),
        ])
        async def execute(query, params):
            rows = db.execute(str(query), params).fetchall()
            return SimpleNamespace(scalar_one=lambda: rows[0][0], mappings=lambda: [dict(row) for row in rows])
        session = SimpleNamespace(execute=execute)
        student_history = await consultar(session, "DISCENTE", 7, 1, 10)
        self.assertEqual(student_history.total, 1)
        self.assertEqual([item.operation for item in student_history.items], ["Edição de status"])
        self.assertIsNone(student_history.items[0].report_title)
        report_history = await consultar(session, "RELATORIO", 7, 1, 10)
        self.assertEqual(report_history.total, 1)
        self.assertEqual(report_history.items[0].operation, "Alteração de relatório")
        self.assertEqual(report_history.items[0].report_title, "Título atual")

    async def test_history_uses_existing_table_without_sensitive_snapshots(self):
        session = AsyncMock()
        with patch("app.services.historico.get_profile_id", AsyncMock(return_value=8)):
            await registrar(session, PROFILE, "RELATORIO", 7, "Edição de relatório")
        sql, params = session.execute.call_args.args
        self.assertIn('public."HistoricoAcesso"', str(sql))
        self.assertNotIn("dados_anteriores", str(sql))
        self.assertNotIn("dados_novos", str(sql))
        self.assertEqual(params, {"entidade": "Relatório", "registro": 7, "operacao": "Edição de relatório", "actor": 8, "campos": None})
        session.commit.assert_not_awaited()


def student():
    return DiscenteResponse(id=1, full_name="Maria de teste", social_name=None,
        registration_number="123456", course=None, shift="Diurno", status="ATIVO",
        admission_date="2024-02-01", email=None, phone=None, birth_date=None,
        family_contact=None, created_at=NOW, updated_at=NOW)


class Changes(unittest.IsolatedAsyncioTestCase):
    def test_only_modified_fields_generate_events(self):
        current = student()
        updated = current.model_copy(update={"full_name": "Maria Silva", "status": "INATIVO", "updated_at": NOW + timedelta(seconds=1)})
        self.assertEqual(alteracoes_discente(current, updated), [
            ("full_name", "Edição de nome completo"), ("status", "Edição de status"),
        ])

    def test_same_values_and_metadata_changes_do_not_generate_events(self):
        current = student()
        self.assertEqual(alteracoes_discente(current, current.model_copy(update={"updated_at": NOW + timedelta(seconds=1)})), [])

    def test_contact_addition_removal_and_individual_edits(self):
        current = student()
        contact = FamilyContact(full_name="Responsável de teste", relationship="Mãe", phone="85999999999")
        with_contact = current.model_copy(update={"family_contact": contact})
        self.assertEqual(alteracoes_discente(current, with_contact), [("family_contact", "Adição de contato familiar")])
        self.assertEqual(alteracoes_discente(with_contact, current), [("family_contact", "Remoção de contato familiar")])
        edited = with_contact.model_copy(update={"family_contact": contact.model_copy(update={"phone": "85988888888"})})
        self.assertEqual(alteracoes_discente(with_contact, edited), [("family_contact.phone", "Edição de telefone do familiar")])

    async def test_update_records_each_actual_change_before_commit(self):
        current = student()
        updated = current.model_copy(update={"full_name": "Maria Silva", "status": "INATIVO"})
        session = AsyncMock()
        session.execute.return_value = SimpleNamespace(mappings=lambda: SimpleNamespace(one=lambda: {}))
        events = []
        async def audit(*args, **kwargs):
            events.append((args[4], kwargs["campos"]))
        session.commit.side_effect = lambda: events.append("commit")
        with patch.object(discentes, "get_discente_or_404", AsyncMock(return_value=current)), \
             patch.object(discentes, "discente_response", return_value=updated), \
             patch.object(discentes, "registrar", side_effect=audit):
            result = await discentes.update_discente(DiscenteUpdate(full_name="Maria Silva", status="INATIVO", expected_updated_at=NOW), 1, PROFILE, session)
        self.assertIs(result, updated)
        self.assertEqual(events, [("Edição de nome completo", ["full_name"]), ("Edição de status", ["status"]), "commit"])

    async def test_changed_field_metadata_uses_json_without_values(self):
        session = AsyncMock()
        with patch("app.services.historico.get_profile_id", AsyncMock(return_value=8)):
            await registrar(session, PROFILE, "DISCENTE", 1, "Edição de status", campos=["status"])
        sql, params = session.execute.call_args.args
        self.assertIn("campos_afetados", str(sql))
        self.assertEqual(params["campos"], '["status"]')
        self.assertNotIn("dados_anteriores", str(sql))
        self.assertNotIn("dados_novos", str(sql))


def report(**changes):
    return SimpleNamespace(**{
        **dict(id=7, title="Relatório de teste", report_type="ACOMPANHAMENTO", status="ABERTO",
               description="Demanda", activity=None, ongoing_follow_up=None, notes=None,
               adopted_strategy=None, observed_result=None, categories=[], updated_at=NOW),
        **changes,
    })


class ReportChanges(unittest.IsolatedAsyncioTestCase):
    async def test_edit_records_one_generic_event_before_commit(self):
        session = AsyncMock()
        data = RelatorioUpdate(title="Novo título", report_type="ACOMPANHAMENTO", description="Nova demanda", expected_updated_at=NOW)
        events = []
        async def audit(*args, **kwargs):
            self.assertEqual(args[2:], ("RELATORIO", 7, "Alteração de relatório"))
            self.assertEqual(kwargs, {})
            events.append("audit")
        session.commit.side_effect = lambda: events.append("commit")
        with patch.object(relatorios, "get_relatorio_or_404", AsyncMock(side_effect=[report(), report(title="Novo título", description="Nova demanda")])), \
             patch.object(relatorios, "validate_categories", AsyncMock(return_value=[])), \
             patch.object(relatorios, "registrar", side_effect=audit):
            await relatorios.update_relatorio(data, 7, PROFILE, session)
        self.assertEqual(events, ["audit", "commit"])

    async def test_audit_failure_prevents_report_commit(self):
        session = AsyncMock()
        data = RelatorioUpdate(title="Novo título", report_type="ACOMPANHAMENTO", description="Demanda", expected_updated_at=NOW)
        with patch.object(relatorios, "get_relatorio_or_404", AsyncMock(side_effect=[report(), report(title="Novo título")])), \
             patch.object(relatorios, "validate_categories", AsyncMock(return_value=[])), \
             patch.object(relatorios, "registrar", AsyncMock(side_effect=RuntimeError("audit unavailable"))):
            with self.assertRaises(RuntimeError):
                await relatorios.update_relatorio(data, 7, PROFILE, session)
        session.commit.assert_not_awaited()

    async def test_history_identifies_reports_without_matching_student_ids(self):
        session = AsyncMock()
        row = dict(id=10, occurred_at=NOW, operation="Alteração de relatório", user_name="Agente",
                   report_id=7, report_title="Título atual")
        session.execute.side_effect = [SimpleNamespace(scalar_one=lambda: 1), SimpleNamespace(mappings=lambda: [row])]
        result = await consultar(session, "RELATORIO", 7, 1, 10)
        self.assertEqual(result.items[0].report_id, 7)
        self.assertEqual(result.items[0].report_title, "Título atual")
        sql = str(session.execute.call_args.args[0])
        self.assertIn("rel.id_relatorio = h.id_registro", sql)
        self.assertIn("lower(h.entidade) IN ('relatorio', 'relatório')", sql)


class Access(unittest.TestCase):
    def test_new_routes_require_authentication(self):
        client = TestClient(app)
        for path, method, body in [
            ("/v1/discentes/1/historico", "GET", None),
            ("/v1/relatorios/1/historico", "GET", None),
            ("/v1/discentes/1/exclusao", "POST", {"expected_updated_at": NOW.isoformat()}),
            ("/v1/usuarios/1", "PATCH", {"full_name": "Agente", "role": "AGENTE_ACESSIBILIDADE", "status": "ATIVO", "expected_updated_at": NOW.isoformat()}),
        ]:
            with self.subTest(path=path):
                response = client.request(method, path, json=body)
                self.assertEqual(response.status_code, 401)


if __name__ == "__main__":
    unittest.main()
