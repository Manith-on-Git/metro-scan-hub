import { clearToken, getToken, setToken } from "@/lib/auth";
import inspectionScanner from "@/assets/inspection-scanner.png";

const API_BASE = (import.meta.env["VITE_API_BASE"] ?? "").replace(/\/$/, "");
export const isDemoMode = !API_BASE;

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

const demoScans: ScanDetail[] = [
  {
    id: "LM-1042",
    created_at: "2026-09-07T08:45:00+05:30",
    status: "COMPLIANT",
    product_id: "PKG-8842",
    violations: [],
    violation_count: 0,
    image_url: inspectionScanner,
    extracted_fields: [
      { field_type: "Product name", value: "Premium Basmati Rice", confidence: 0.98 },
      { field_type: "Net quantity", value: "5 kg", confidence: 0.99 },
      { field_type: "MRP", value: "₹ 725.00", confidence: 0.97 },
      { field_type: "Packaged by", value: "Aarav Foods Pvt. Ltd.", confidence: 0.94 },
      { field_type: "Month / year", value: "08 / 2026", confidence: 0.96 },
    ],
  },
  {
    id: "LM-1041",
    created_at: "2026-09-06T16:20:00+05:30",
    status: "NON-COMPLIANT",
    product_id: "PKG-8819",
    violation_count: 3,
    image_url: inspectionScanner,
    extracted_fields: [
      { field_type: "Product name", value: "Herbal Hair Oil", confidence: 0.95 },
      { field_type: "Net quantity", value: "200 ml", confidence: 0.91 },
      { field_type: "MRP", value: "₹ 180", confidence: 0.88 },
      { field_type: "Manufacturer", value: "Shakti Consumer Products", confidence: 0.84 },
    ],
    violations: [
      {
        rule_ref: "LMR 2011 · 6(1)",
        field_type: "Manufacturer",
        description:
          "Complete address of the manufacturer is not declared on the principal display panel.",
        severity: "major",
      },
      {
        rule_ref: "LMR 2011 · 6(1)",
        field_type: "MRP",
        description: "Maximum retail price does not include the applicable taxes wording.",
        severity: "critical",
      },
      {
        rule_ref: "LMR 2011 · 6(2)",
        field_type: "Month / year",
        description: "Month and year of manufacture could not be verified.",
        severity: "minor",
      },
    ],
  },
  {
    id: "LM-1040",
    created_at: "2026-09-05T11:10:00+05:30",
    status: "COMPLIANT",
    product_id: "PKG-8794",
    violations: [],
    violation_count: 0,
    image_url: inspectionScanner,
    extracted_fields: [
      { field_type: "Product name", value: "Stainless Steel Bottle", confidence: 0.97 },
      { field_type: "Net quantity", value: "1 N", confidence: 0.92 },
      { field_type: "MRP", value: "₹ 499.00", confidence: 0.98 },
      { field_type: "Customer care", value: "1800 200 4400", confidence: 0.89 },
    ],
  },
  {
    id: "LM-1039",
    created_at: "2026-09-04T14:35:00+05:30",
    status: "NON-COMPLIANT",
    product_id: "PKG-8778",
    violation_count: 1,
    image_url: inspectionScanner,
    extracted_fields: [
      { field_type: "Product name", value: "Roasted Salted Peanuts", confidence: 0.93 },
      { field_type: "Net quantity", value: "100 g", confidence: 0.96 },
      { field_type: "MRP", value: "₹ 65", confidence: 0.91 },
    ],
    violations: [
      {
        rule_ref: "LMR 2011 · 6(1)",
        field_type: "Net quantity",
        description: "The unit declaration is not displayed in the prescribed type size.",
        severity: "major",
      },
    ],
  },
];

let demoNextId = 1043;

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
  if (isDemoMode) {
    if (!email.trim() || !password)
      throw new ApiError("Enter an email and password to continue.", 400);
    const result: LoginResponse = { access_token: "demo-officer-token", token_type: "bearer" };
    setToken(result.access_token);
    return result;
  }
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
  getDashboardStats: async () => {
    if (isDemoMode) {
      return {
        total_scans: demoScans.length,
        compliant_count: demoScans.filter((scan) => (scan.violations?.length ?? 0) === 0).length,
        non_compliant_count: demoScans.filter((scan) => (scan.violations?.length ?? 0) > 0).length,
        violations_by_rule: { "LMR 2011 · 6(1)": 3, "LMR 2011 · 6(2)": 1 },
      } satisfies DashboardStats;
    }
    return request<DashboardStats>("/dashboard/stats");
  },
  getScans: async () => {
    if (isDemoMode) return demoScans;
    const result = await request<ScanSummary[] | { items?: ScanSummary[]; data?: ScanSummary[] }>(
      "/scans/",
    );
    return Array.isArray(result) ? result : (result.items ?? result.data ?? []);
  },
  getScan: async (id: string) => {
    if (isDemoMode) {
      const scan = demoScans.find((item) => String(item.id) === id);
      if (!scan) throw new ApiError("The requested demo scan was not found.", 404);
      return scan;
    }
    return request<ScanDetail>(`/scans/${encodeURIComponent(id)}`);
  },
  uploadScan: async (file: File, productId?: string) => {
    if (isDemoMode) {
      const id = `LM-${demoNextId++}`;
      const scan: ScanDetail = {
        id,
        created_at: new Date().toISOString(),
        status: "COMPLIANT",
        violations: [],
        violation_count: 0,
        image_url: URL.createObjectURL(file),
        extracted_fields: [
          {
            field_type: "Product name",
            value: file.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " "),
            confidence: 0.94,
          },
          { field_type: "Net quantity", value: "1 N", confidence: 0.9 },
          { field_type: "MRP", value: "₹ 249.00", confidence: 0.88 },
          {
            field_type: "Packaged by",
            value: "Demo Consumer Products Pvt. Ltd.",
            confidence: 0.86,
          },
        ],
        ...(productId ? { product_id: productId } : {}),
      };
      demoScans.unshift(scan);
      return { id };
    }
    const formData = new FormData();
    formData.append("file", file);
    if (productId) formData.append("product_id", productId);
    return request<{ id?: string | number; scan_id?: string | number }>("/scans/upload", {
      method: "POST",
      body: formData,
    });
  },
  downloadReport: async (id: string) => {
    if (isDemoMode) {
      const scan = demoScans.find((item) => String(item.id) === id);
      if (!scan) throw new ApiError("The requested demo scan was not found.", 404);
      const report = `%PDF-1.4\n1 0 obj<<>>endobj\n2 0 obj<< /Length 94 >>stream\nLegal Metrology Compliance Report\nScan: ${id}\nStatus: ${scan.status}\nendstream\nendobj\ntrailer<<>>\n%%EOF`;
      return new Blob([report], { type: "application/pdf" });
    }
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
    if (!response.ok)
      throw new ApiError("The PDF report could not be downloaded.", response.status);
    return response.blob();
  },
};

export function getMediaUrl(value?: string) {
  if (!value) return undefined;
  if (/^(data:|https?:\/\/|blob:|\/)/i.test(value)) return value;
  if (!API_BASE) return value;
  return `${API_BASE}/${value.replace(/^\//, "")}`;
}
