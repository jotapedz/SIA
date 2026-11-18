from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.config import get_settings


_db_url = get_settings().database_url
_connect_args = {"statement_cache_size": 0} if ":6543/" in _db_url or _db_url.endswith(":6543") else {}

engine = create_async_engine(
    _db_url,
    pool_size=10,
    max_overflow=10,
    pool_recycle=300,
    pool_use_lifo=True,
    connect_args=_connect_args,
)
session_factory = async_sessionmaker(engine, expire_on_commit=False)


async def get_db_session() -> AsyncGenerator[AsyncSession, None]:
    async with session_factory() as session:
        yield session
