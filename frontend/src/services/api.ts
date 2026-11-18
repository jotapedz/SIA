type ValidationIssue = { loc: (string | number)[]; msg: string; type: string };

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly issues: ValidationIssue[] = [],
    public readonly code: string = "",
  ) {
    super(message);
    this.name = "ApiError";
  }
}

const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000").replace(/\/$/, "");

const GET_CACHE_TTL_MS = 30_000;
const GET_CACHE_MAX_ENTRIES = 200;
const getCache = new Map<string, { value: unknown; expiresAt: number }>();
const inflightGet = new Map<string, Promise<unknown>>();

export function invalidateApiCache(): void {
  getCache.clear();
  inflightGet.clear();
}

function withSignal<T>(promise: Promise<T>, signal?: AbortSignal | null): Promise<T> {
  if (!signal) return promise;
  if (signal.aborted) {
    return Promise.reject(new DOMException("The operation was aborted.", "AbortError"));
  }
  return new Promise<T>((resolve, reject) => {
    const onAbort = () => reject(new DOMException("The operation was aborted.", "AbortError"));
    signal.addEventListener("abort", onAbort, { once: true });
    promise.then(
      (value) => {
        signal.removeEventListener("abort", onAbort);
        resolve(value);
      },
      (error) => {
        signal.removeEventListener("abort", onAbort);
        reject(error);
      },
    );
  });
}

export function prefetchApiRequest(path: string, accessToken: string): void {
  if (!accessToken) return;
  void apiRequest(path, accessToken).catch(() => undefined);
}

export async function apiRequest<T>(path: string, accessToken: string, options: RequestInit = {}): Promise<T> {
  const method = (options.method ?? "GET").toUpperCase();
  if (method !== "GET") {
    invalidateApiCache();
    const response = await apiResponse(path, accessToken, options);
    return response.json() as Promise<T>;
  }

  const cacheKey = `${accessToken}::${path}`;
  const now = Date.now();
  const cached = getCache.get(cacheKey);
  if (cached && now < cached.expiresAt) {
    if (options.signal?.aborted) {
      throw new DOMException("The operation was aborted.", "AbortError");
    }
    return cached.value as T;
  }
  if (cached) getCache.delete(cacheKey);

  let shared = inflightGet.get(cacheKey) as Promise<T> | undefined;
  if (!shared) {
    const { signal: _ignoredSignal, ...fetchOptions } = options;
    void _ignoredSignal;
    shared = (async () => {
      const response = await apiResponse(path, accessToken, fetchOptions);
      const data = (await response.json()) as T;
      if (getCache.size >= GET_CACHE_MAX_ENTRIES) {
        const oldestKey = getCache.keys().next().value;
        if (oldestKey !== undefined) getCache.delete(oldestKey);
      }
      getCache.set(cacheKey, { value: data, expiresAt: Date.now() + GET_CACHE_TTL_MS });
      return data;
    })();
    inflightGet.set(cacheKey, shared);
    void shared.finally(() => {
      inflightGet.delete(cacheKey);
    }).catch(() => undefined);
  }

  return withSignal(shared, options.signal);
}

export async function apiDownload(path: string, accessToken: string): Promise<Blob> {
  const response = await apiResponse(path, accessToken);
  return response.blob();
}

async function apiResponse(path: string, accessToken: string, options: RequestInit = {}): Promise<Response> {
  const headers = new Headers(options.headers);
  headers.set("Authorization", `Bearer ${accessToken}`);
  if (options.body) headers.set("Content-Type", "application/json");

  let response: Response;
  try {
    response = await fetch(`${apiBaseUrl}${path}`, { ...options, headers, cache: "no-store" });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") throw error;
    throw new ApiError("Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.", 0);
  }

  if (!response.ok) {
    const body: unknown = await response.json().catch(() => null);
    const detail = body && typeof body === "object" && "detail" in body ? body.detail : null;
    const detailObject = detail && typeof detail === "object" && !Array.isArray(detail) ? detail : null;
    const code = detailObject && "code" in detailObject && typeof detailObject.code === "string" ? detailObject.code : "";
    const detailMessage = detailObject && "message" in detailObject && typeof detailObject.message === "string" ? detailObject.message : null;
    const safeServiceMessage = response.status === 503 && ["users_unavailable", "user_creation_unconfirmed", "photos_unavailable"].includes(code) ? detailMessage : null;
    const issues = Array.isArray(detail)
      ? detail.filter((issue): issue is ValidationIssue =>
          issue && typeof issue === "object" && Array.isArray(issue.loc) && typeof issue.msg === "string")
      : [];
    const message = response.status === 401
      ? "Sua sessão expirou. Entre novamente no sistema."
      : response.status === 403
        ? "Seu perfil não tem acesso autorizado a esta funcionalidade."
        : response.status >= 500
          ? safeServiceMessage || "O servidor não está disponível no momento. Tente novamente em instantes."
          : detailMessage || (typeof detail === "string" ? detail : "Verifique os dados informados e tente novamente.");
    throw new ApiError(message, response.status, issues, code);
  }
  return response;
}
