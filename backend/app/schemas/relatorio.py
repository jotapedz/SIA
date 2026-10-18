from datetime import datetime
from enum import Enum
from typing import Annotated

from pydantic import AwareDatetime, BaseModel, ConfigDict, Field, StringConstraints, field_validator, model_validator


Title = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=200)]
Description = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=20000)]
Activity = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=5000)]
FollowUp = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=20000)]
Notes = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=5000)]
CategoryDetail = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=255)]


class ReportType(str, Enum):
    CADASTRO = "CADASTRO"
    ACOMPANHAMENTO = "ACOMPANHAMENTO"
    ACOES_SUCESSO = "ACOES_SUCESSO"
    RECURSOS_ACESSIBILIDADE = "RECURSOS_ACESSIBILIDADE"
    BARREIRAS = "BARREIRAS"
    OBSERVACOES = "OBSERVACOES"


class CategorySelection(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)
    category_id: int = Field(ge=1, le=9223372036854775807)
    detail: CategoryDetail | None = None

    @field_validator("detail", mode="before")
    @classmethod
    def empty_detail_as_none(cls, value: object) -> object:
        return None if isinstance(value, str) and not value.strip() else value


class CategoriaResponse(BaseModel):
    id: int
    code: str | None
    name: str
    group: str
    section: str | None
    order: int
    requires_detail: bool


class RelatorioCategoriaResponse(CategoriaResponse):
    detail: str | None


class RelatorioCreate(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    title: Title
    # Preserva o contrato anterior, que criava apenas acompanhamentos.
    report_type: ReportType = ReportType.ACOMPANHAMENTO
    description: Description | None = None
    activity: Activity | None = None
    ongoing_follow_up: FollowUp | None = None
    notes: Notes | None = None
    adopted_strategy: Description | None = None
    observed_result: Description | None = None
    categories: list[CategorySelection] = Field(default_factory=list, max_length=100)

    @field_validator("description", "activity", "ongoing_follow_up", "notes", "adopted_strategy", "observed_result", mode="before")
    @classmethod
    def empty_optional_text_as_none(cls, value: object) -> object:
        return None if isinstance(value, str) and not value.strip() else value

    @field_validator("report_type", mode="before")
    @classmethod
    def normalize_type(cls, value: object) -> object:
        return value.strip().upper() if isinstance(value, str) else value

    @model_validator(mode="after")
    def validate_report_fields(self) -> "RelatorioCreate":
        allowed = {
            ReportType.CADASTRO: {"categories"},
            ReportType.ACOMPANHAMENTO: {"description", "activity", "ongoing_follow_up", "notes"},
            ReportType.ACOES_SUCESSO: {"description", "adopted_strategy", "observed_result", "notes"},
            ReportType.RECURSOS_ACESSIBILIDADE: {"description", "notes"},
            ReportType.BARREIRAS: {"description", "notes"},
            ReportType.OBSERVACOES: {"notes"},
        }[self.report_type]
        for field in self.model_fields_set - allowed - {"title", "report_type", "expected_updated_at"}:
            if getattr(self, field) not in (None, []):
                raise ValueError(f"O campo {field} não pertence a este tipo de relatório.")
        required = []
        if self.report_type not in (ReportType.CADASTRO, ReportType.OBSERVACOES):
            required.append(("description", "a descrição do relatório"))
        if self.report_type == ReportType.ACOES_SUCESSO:
            required.extend([("adopted_strategy", "a ação ou estratégia adotada"), ("observed_result", "o resultado observado")])
        if self.report_type == ReportType.OBSERVACOES:
            required.append(("notes", "a observação"))
        for field, label in required:
            if getattr(self, field) is None:
                raise ValueError(f"Informe {label}.")
        ids = [item.category_id for item in self.categories]
        if len(ids) != len(set(ids)):
            raise ValueError("Não repita uma categoria no mesmo relatório.")
        return self


class RelatorioUpdate(RelatorioCreate):
    report_type: ReportType
    expected_updated_at: AwareDatetime


class RelatorioCancel(BaseModel):
    model_config = ConfigDict(extra="forbid")
    expected_updated_at: AwareDatetime


class RelatorioSummary(BaseModel):
    id: int
    discente_id: int
    discente_name: str
    discente_social_name: str | None
    title: str
    description_excerpt: str
    report_type: str | None
    status: str
    author_id: int
    author_name: str
    opened_at: datetime
    closed_at: datetime | None
    updated_at: datetime


class RelatorioResponse(RelatorioSummary):
    description: str
    activity: str | None
    ongoing_follow_up: str | None
    notes: str | None
    adopted_strategy: str | None
    observed_result: str | None
    categories: list[RelatorioCategoriaResponse] = Field(default_factory=list)
    cancelled_at: datetime | None = None
    cancelled_by: int | None = None


class RelatorioListResponse(BaseModel):
    items: list[RelatorioSummary]
    total: int
    page: int
    page_size: int
