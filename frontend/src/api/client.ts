import type { APIEnvelope } from "./types";

const BASE_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8100";

export class ApiError extends Error {
  code: string;
  status: number;
  constructor(message: string, code: string, status: number) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

interface ErrorBody {
  success: false;
  error: { code: string; message: string; details: Record<string, string> };
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  let payload: APIEnvelope<T> | ErrorBody | null = null;
  try {
    payload = (await response.json()) as APIEnvelope<T> | ErrorBody;
  } catch {
    throw new ApiError(`HTTP ${response.status}: invalid response`, "NETWORK_ERROR", response.status);
  }
  if (!response.ok || !payload.success) {
    const err = payload as ErrorBody;
    throw new ApiError(err.error?.message || `Request failed with ${response.status}`, err.error?.code || "UNKNOWN", response.status);
  }
  return (payload as APIEnvelope<T>).data;
}

export const api = {
  get: <T>(path: string) => request<T>("GET", path),
  post: <T>(path: string, body?: unknown) => request<T>("POST", path, body),
  put: <T>(path: string, body?: unknown) => request<T>("PUT", path, body),
};

export const PROJECT_ID = "3f2a9c1e-5b7d-4a3f-9c2e-1d4b6a8c0e12";
