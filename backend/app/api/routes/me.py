from fastapi import APIRouter, Depends
from app.dependencies.profile import get_authorized_profile
from app.schemas.profile import ProfileResponse


router = APIRouter(prefix="/v1", tags=["auth"])


@router.get("/me", response_model=ProfileResponse)
async def get_me(
    profile: ProfileResponse = Depends(get_authorized_profile),
) -> ProfileResponse:
    return profile
