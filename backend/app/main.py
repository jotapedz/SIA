from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import discentes, health, home, me, relatorios
from app.core.config import get_settings


settings = get_settings()
app = FastAPI(title="SIA API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=False,
    allow_methods=["GET", "POST", "PATCH"],
    allow_headers=["Authorization", "Content-Type"],
)

app.include_router(health.router)
app.include_router(me.router)
app.include_router(home.router)
app.include_router(discentes.router)
app.include_router(relatorios.router)
