import asyncio
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from app.api.routes import acompanhamento, discentes, health, home, me, relatorios, usuarios
from app.core.config import get_settings
from app.core.database import engine
from app.core.http import close_http_client
from app.dependencies.auth import warmup_jwks


settings = get_settings()


async def _warmup_connections() -> None:
    if settings.supabase_url.endswith(".invalid"):
        return

    async def _warm_db() -> None:
        try:
            async with engine.connect() as conn:
                await conn.execute(text("SELECT 1"))
        except Exception:
            pass

    await asyncio.gather(warmup_jwks(), _warm_db(), _warm_db(), return_exceptions=True)


@asynccontextmanager
async def lifespan(_: FastAPI):
    warmup_task = asyncio.create_task(_warmup_connections())
    try:
        yield
    finally:
        warmup_task.cancel()
        await close_http_client()
        await engine.dispose()


app = FastAPI(title="SIA API", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=False,
    allow_methods=["GET", "POST", "PATCH", "PUT"],
    allow_headers=["Authorization", "Content-Type"],
)

app.include_router(health.router)
app.include_router(me.router)
app.include_router(home.router)
app.include_router(discentes.router)
app.include_router(relatorios.router)
app.include_router(usuarios.router)
app.include_router(acompanhamento.router)
