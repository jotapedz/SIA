from datetime import datetime
from pydantic import BaseModel, AwareDatetime, ConfigDict


class HistoricoItem(BaseModel):
    id: int
    occurred_at: datetime
    operation: str
    user_name: str
    report_id: int | None = None
    report_title: str | None = None


class HistoricoResponse(BaseModel):
    items: list[HistoricoItem]
    total: int
    page: int
    page_size: int


class DiscenteDelete(BaseModel):
    model_config = ConfigDict(extra="forbid")
    expected_updated_at: AwareDatetime
