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

export async function apiRequest<T>(path: string, accessToken: string, options: RequestInit = {}): Promise<T> {
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
    const safeServiceMessage = response.status === 503 && ["users_unavailable", "user_creation_unconfirmed"].includes(code) ? detailMessage : null;
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
  return response.json() as Promise<T>;
}
