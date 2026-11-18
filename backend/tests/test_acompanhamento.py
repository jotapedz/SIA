import base64
import os
import unittest
from datetime import date, timedelta
from types import SimpleNamespace
from unittest.mock import AsyncMock, patch

os.environ.setdefault("SUPABASE_URL", "https://example.invalid")
os.environ.setdefault("SUPABASE_PUBLISHABLE_KEY", "test")
os.environ.setdefault("DATABASE_URL", "postgresql+asyncpg://test:test@localhost/test")

from fastapi import HTTPException
from pydantic import ValidationError
from app.api.routes import acompanhamento
from app.schemas.acompanhamento import RegistroCreate, TermoCreate
from app.services.historico import consultar


class AcompanhamentoValidation(unittest.TestCase):
    def test_blank_description_is_rejected(self):
        with self.assertRaises(ValidationError):
            RegistroCreate(kind="ATENDIMENTO", occurred_on=date.today(), description="   ")

    def test_future_action_is_rejected(self):
        with self.assertRaises(ValidationError):
            RegistroCreate(kind="CONTRIBUICAO", occurred_on=date.today() + timedelta(days=1), description="Ação")

    def test_pdf_signature_is_required(self):
        with self.assertRaises(ValidationError):
            TermoCreate(acknowledged_on=date.today(), file_name="termo.pdf", document_base64=base64.b64encode(b"not-a-pdf").decode())

    def test_invalid_base64_is_rejected(self):
        with self.assertRaises(ValidationError):
            TermoCreate(acknowledged_on=date.today(), file_name="termo.pdf", document_base64="!invalid!")

    def test_path_in_file_name_is_rejected(self):
        with self.assertRaises(ValidationError):
            TermoCreate(acknowledged_on=date.today(), file_name="../termo.pdf", document_base64="JVBERi0xLjQ=")

    def test_pdf_size_is_limited(self):
        with self.assertRaises(ValidationError):
            TermoCreate(acknowledged_on=date.today(), file_name="termo.pdf",
                        document_base64=base64.b64encode(b"%PDF-" + b"x" * (5 * 1024 * 1024)).decode())


class AcompanhamentoWorkflow(unittest.IsolatedAsyncioTestCase):
    async def test_contribution_cannot_reference_another_student(self):
        session = AsyncMock()
        data = RegistroCreate(kind="CONTRIBUICAO", occurred_on=date.today(), description="Ação", report_id=12)
        with patch.object(acompanhamento, "require_discente", AsyncMock()), \
             patch.object(acompanhamento, "get_relatorio_or_404", AsyncMock(return_value=SimpleNamespace(discente_id=2, status="ABERTO"))):
            with self.assertRaises(HTTPException) as caught:
                await acompanhamento.create_registro(data, 1, SimpleNamespace(), session)
        self.assertEqual(caught.exception.status_code, 422)
        session.execute.assert_not_awaited()
        session.commit.assert_not_awaited()

    async def test_cancelled_report_rejects_contribution(self):
        session = AsyncMock()
        data = RegistroCreate(kind="CONTRIBUICAO", occurred_on=date.today(), description="Ação", report_id=12)
        with patch.object(acompanhamento, "require_discente", AsyncMock()), \
             patch.object(acompanhamento, "get_relatorio_or_404", AsyncMock(return_value=SimpleNamespace(discente_id=1, status="CANCELADO"))):
            with self.assertRaises(HTTPException) as caught:
                await acompanhamento.create_registro(data, 1, SimpleNamespace(), session)
        self.assertEqual(caught.exception.status_code, 409)
        session.commit.assert_not_awaited()

    async def test_student_history_includes_report_events_in_count_and_items(self):
        session = AsyncMock()
        session.execute.side_effect = [SimpleNamespace(scalar_one=lambda: 0), SimpleNamespace(mappings=lambda: [])]
        await consultar(session, "DISCENTE", 1, 1, 10)
        for call in session.execute.call_args_list:
            self.assertIn("r.id_discente = :id", str(call.args[0]))
            self.assertEqual(call.args[1]["id"], 1)


if __name__ == "__main__":
    unittest.main()
