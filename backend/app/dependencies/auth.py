import asyncio
import base64
import hashlib
import json
import time
from dataclasses import dataclass
from typing import Any
from uuid import UUID

import httpx
from fastapi import HTTPException, Security, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.core.config import get_settings
from app.core.http import get_http_client

try:
    import jwt
    from jwt import PyJWK
    from jwt.exceptions import PyJWTError
except ImportError:  # pragma: no cover - fallback gracioso caso PyJWT não esteja instalado
    jwt = None  # type: ignore[assignment]
    PyJWK = None  # type: ignore[assignment,misc]
    PyJWTError = Exception  # type: ignore[assignment,misc]


bearer_scheme = HTTPBearer(auto_error=False)

_TOKEN_CACHE_TTL_SECONDS = 60.0
_TOKEN_CACHE_MAX_SIZE = 512
_JWKS_TTL_SECONDS = 600.0
_ASYMMETRIC_ALGS = {"ES256", "RS256", "EdDSA"}

_token_cache: dict[str, tuple["CurrentUser", float]] = {}
_inflight_verifications: dict[tuple[int, str], asyncio.Task["CurrentUser"]] = {}
_jwks_cache: tuple[str, float, dict[str, Any]] | None = None


@dataclass(frozen=True)
class CurrentUser:
    id: UUID
    email: str


def _b64url_json(segment: str) -> dict[str, Any] | None:
    try:
        padded = segment + "=" * (-len(segment) % 4)
        data = json.loads(base64.urlsafe_b64decode(padded.encode("ascii")))
        return data if isinstance(data, dict) else None
    except (ValueError, UnicodeDecodeError):
        return None


def _cache_token(token_hash: str, user: CurrentUser, exp: float | None, ttl: float) -> None:
    now = time.time()
    deadline = min(exp, now + ttl) if exp is not None else now + ttl
    if deadline <= now:
        return
    if len(_token_cache) >= _TOKEN_CACHE_MAX_SIZE:
        expired = [k for k, (_, exp_at) in _token_cache.items() if exp_at <= now]
        for k in expired:
            _token_cache.pop(k, None)
        if len(_token_cache) >= _TOKEN_CACHE_MAX_SIZE:
            _token_cache.pop(next(iter(_token_cache)), None)
    _token_cache[token_hash] = (user, deadline)


async def warmup_jwks() -> None:
    settings = get_settings()
    if settings.supabase_url.endswith(".invalid"):
        return
    await _get_jwks(settings.supabase_url, settings.supabase_publishable_key)


async def _get_jwks(supabase_url: str, publishable_key: str) -> dict[str, Any]:
    global _jwks_cache
    now = time.monotonic()
    base = supabase_url.rstrip("/")
    if _jwks_cache is not None and _jwks_cache[0] == base and now < _jwks_cache[1]:
        return _jwks_cache[2]
    try:
        response = await get_http_client().get(
            f"{base}/auth/v1/.well-known/jwks.json",
            headers={"apikey": publishable_key},
            timeout=5.0,
        )
        if response.status_code == status.HTTP_200_OK:
            body = response.json()
            keys = {
                item["kid"]: item
                for item in body.get("keys", [])
                if isinstance(item, dict) and isinstance(item.get("kid"), str)
            }
            _jwks_cache = (base, now + _JWKS_TTL_SECONDS, keys)
            return keys
    except (httpx.HTTPError, ValueError, KeyError, TypeError):
        pass
    _jwks_cache = (base, now + 60.0, {})
    return {}


async def _verify_with_jwks(
    token: str, header: dict[str, Any], supabase_url: str, publishable_key: str
) -> tuple[CurrentUser, float | None] | None:
    if jwt is None or PyJWK is None:
        return None
    alg = header.get("alg")
    kid = header.get("kid")
    if alg not in _ASYMMETRIC_ALGS or not isinstance(kid, str):
        return None
    keys = await _get_jwks(supabase_url, publishable_key)
    jwk_data = keys.get(kid)
    if jwk_data is None:
        return None
    try:
        signing_key = PyJWK.from_dict(jwk_data).key
        claims = jwt.decode(
            token,
            signing_key,
            algorithms=[alg],
            issuer=f"{supabase_url.rstrip('/')}/auth/v1",
            options={"verify_aud": False, "require": ["sub", "exp"]},
        )
        email = claims.get("email")
        if not isinstance(email, str) or not email:
            return None
        exp = float(claims["exp"]) if isinstance(claims.get("exp"), (int, float)) else None
        return CurrentUser(id=UUID(str(claims["sub"])), email=email), exp
    except (PyJWTError, ValueError, KeyError, TypeError) as error:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido ou expirado.",
        ) from error


async def _fetch_remote_user(token: str, supabase_url: str, publishable_key: str) -> CurrentUser:
    try:
        response = await get_http_client().get(
            f"{supabase_url.rstrip('/')}/auth/v1/user",
            headers={
                "apikey": publishable_key,
                "Authorization": f"Bearer {token}",
            },
            timeout=10.0,
        )
    except httpx.HTTPError as error:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Não foi possível validar a sessão.",
        ) from error

    if response.status_code != status.HTTP_200_OK:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido ou expirado.",
        )

    user = response.json()
    try:
        return CurrentUser(id=UUID(user["id"]), email=user["email"])
    except (KeyError, ValueError, TypeError) as error:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token inválido.") from error


async def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Security(bearer_scheme),
) -> CurrentUser:
    if credentials is None or credentials.scheme.lower() != "bearer":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token ausente.")

    token = credentials.credentials
    parts = token.split(".")
    header: dict[str, Any] | None = None
    exp: float | None = None
    if len(parts) == 3:
        header = _b64url_json(parts[0])
        payload = _b64url_json(parts[1])
        if payload is not None and isinstance(payload.get("exp"), (int, float)):
            exp = float(payload["exp"])
            if exp <= time.time():
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Token inválido ou expirado.",
                )

    token_hash = hashlib.sha256(token.encode("utf-8")).hexdigest()
    cached = _token_cache.get(token_hash)
    if cached is not None:
        cached_user, expires_at = cached
        if time.time() < expires_at:
            return cached_user
        _token_cache.pop(token_hash, None)

    settings = get_settings()
    if header is not None and not settings.supabase_url.endswith(".invalid"):
        verified = await _verify_with_jwks(
            token, header, settings.supabase_url, settings.supabase_publishable_key
        )
        if verified is not None:
            user, verified_exp = verified
            _cache_token(token_hash, user, verified_exp, ttl=300.0)
            return user

    loop = asyncio.get_running_loop()
    inflight_key = (id(loop), token_hash)
    task = _inflight_verifications.get(inflight_key)
    if task is None:
        async def _run() -> CurrentUser:
            user = await _fetch_remote_user(
                token, settings.supabase_url, settings.supabase_publishable_key
            )
            _cache_token(token_hash, user, exp, ttl=_TOKEN_CACHE_TTL_SECONDS)
            return user

        task = asyncio.create_task(_run())
        _inflight_verifications[inflight_key] = task
        try:
            return await task
        finally:
            _inflight_verifications.pop(inflight_key, None)
    return await task
