import { clearToken, getToken, setToken } from "@/lib/auth";

const API_BASE = (import.meta.env["VITE_API_BASE"] ?? "").replace(/\/$/, "");

export type LoginResponse = { access_token: string; token_type?: string };

export type DashboardStats = {
  total_scans?: number;
  compliant_count?: number;
  non_compliant_count?: number;
  compliant?: number;
  non_compliant?: number;
  violations_by_rule?: Record<string, number> | Array<{ rule_ref: string; count: number }>;
};

export type ScanSummary = {
  id: string | number;
  created_at?: string;
  date?: string;
  status?: string;
  violations?: unknown[];
  violation_count?: number;
  product_id?: string;
};

export type ScanViolation = {
  rule_ref?: string;
  field_type?: string;
  description?: string;
  severity?: string;
};

export type ScanDetail = Omit<ScanSummary, "violations"> & {
  image_url?: string;
  uploaded_image_url?: string;
  image?: string;
  extracted_fields?: Array<{
    field_type?: string;
    type?: string;
    value?: string | number | null;
    confidence?: number | null;
  }>;
  violations?: ScanViolation[];
};

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

function endpoint(path: string) {
  if (!API_BASE) throw new ApiError("VITE_API_BASE is not configured.", 0);
  return `${API_BASE}${path}`;
}

async function request<T>(path: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers);
  const token = getToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (!(init.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(endpoint(path), { ...init, headers });
  if (response.status === 401) {
    clearToken();
    if (typeof window !== "undefined" && window.location.pathname !== "/login") {
      window.location.assign("/login");
    }
    throw new ApiError("Your session has expired. Please sign in again.", 401);
  }

  if (!response.ok) {
    let message = `Request failed (${response.status})`;
    try {
      const body = (await response.json()) as { detail?: string; message?: string };
      message = body.detail ?? body.message ?? message;
    } catch {
      // Keep the status-based message when the backend does not return JSON.
    }
    throw new ApiError(message, response.status);
  }

  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

export async function login(email: string, password: string) {
  const body = new URLSearchParams({ username: email, password });
  const response = await fetch(endpoint("/auth/login"), {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!response.ok) {
    let message = "Sign in failed. Check your email and password.";
    try {
      const result = (await response.json()) as { detail?: string };
      message = result.detail ?? message;
    } catch {
      // Use the friendly fallback above.
    }
    throw new ApiError(message, response.status);
  }
  const result = (await response.json()) as LoginResponse;
  setToken(result.access_token);
  return result;
}

export const api = {
  getDashboardStats: () => request<DashboardStats>("/dashboard/stats"),
  getScans: async () => {
    const result = await request<ScanSummary[] | { items?: ScanSummary[]; data?: ScanSummary[] }>("/scans/");
    return Array.isArray(result) ? result : result.items ?? result.data ?? [];
  },
  getScan: (id: string) => request<ScanDetail>(`/scans/${encodeURIComponent(id)}`),
  uploadScan: async (file: File, productId?: string) => {
    const formData = new FormData();
    formData.append("file", file);
    if (productId) formData.append("product_id", productId);
    return request<{ id?: string | number; scan_id?: string | number }>("/scans/upload", {
      method: "POST",
      body: formData,
    });
  },
  downloadReport: async (id: string) => {
    const token = getToken();
    const headers = new Headers();
    if (token) headers.set("Authorization", `Bearer ${token}`);
    const response = await fetch(endpoint(`/reports/${encodeURIComponent(id)}/pdf`), {
      headers,
    });
    if (response.status === 401) {
      clearToken();
      if (typeof window !== "undefined") window.location.assign("/login");
      throw new ApiError("Your session has expired. Please sign in again.", 401);
    }
    if (!response.ok) throw new ApiError("The PDF report could not be downloaded.", response.status);
    return response.blob();
  },
};

export function getMediaUrl(value?: string) {
  if (!value) return undefined;
  if (/^(data:|https?:\/\/|blob:)/i.test(value)) return value;
  return `${API_BASE}/${value.replace(/^\//, "")}`;
}