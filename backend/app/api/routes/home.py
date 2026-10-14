from fastapi import APIRouter, Depends

from app.dependencies.profile import get_authorized_profile
from app.schemas.home import FeatureResponse, HomeResponse
from app.schemas.profile import ProfileResponse


router = APIRouter(prefix="/v1", tags=["home"])


@router.get(
    "/home",
    response_model=HomeResponse,
    summary="Dados da tela inicial (RF03)",
    responses={
        401: {"description": "Token ausente ou inválido"},
        403: {"description": "Perfil sem acesso autorizado"},
    },
)
async def get_home(
    profile: ProfileResponse = Depends(get_authorized_profile),
) -> HomeResponse:
    return HomeResponse(
        user=profile,
        features=[
            FeatureResponse(
                code="RF03",
                title="Listar discentes",
                method="GET",
                endpoint="/v1/discentes",
            ),
            FeatureResponse(
                code="RF04",
                title="Cadastrar discente",
                method="POST",
                endpoint="/v1/discentes",
            )
        ],
    )
