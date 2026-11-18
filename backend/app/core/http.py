import asyncio

import httpx


_client: httpx.AsyncClient | None = None
_client_loop: asyncio.AbstractEventLoop | None = None


def get_http_client() -> httpx.AsyncClient:
    global _client, _client_loop
    loop = asyncio.get_running_loop()
    if _client is None or _client.is_closed or _client_loop is not loop:
        _client = httpx.AsyncClient(
            timeout=httpx.Timeout(20.0, connect=10.0),
            limits=httpx.Limits(
                max_keepalive_connections=20,
                max_connections=50,
                keepalive_expiry=60.0,
            ),
        )
        _client_loop = loop
    return _client


async def close_http_client() -> None:
    global _client, _client_loop
    client = _client
    _client = None
    _client_loop = None
    if client is not None and not client.is_closed:
        await client.aclose()
