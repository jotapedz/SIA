from typing import Literal

from pydantic import BaseModel

from app.schemas.profile import ProfileResponse


class FeatureResponse(BaseModel):
    code: str
    title: str
    method: Literal["GET", "POST"]
    endpoint: str


class HomeResponse(BaseModel):
    user: ProfileResponse
    features: list[FeatureResponse]
