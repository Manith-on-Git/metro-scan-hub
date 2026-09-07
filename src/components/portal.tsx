import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { ArrowUpRight, BarChart3, ClipboardList, LogOut, ScanLine } from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { clearToken } from "@/lib/auth";

const navigation = [
  { label: "Dashboard", to: "/dashboard", icon: BarChart3 },
  { label: "New Scan", to: "/upload", icon: ScanLine },
  { label: "History", to: "/history", icon: ClipboardList },
] as const;

export function PortalShell({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (state) => state.location.pathname });

  function logout() {
    clearToken();
    navigate({ to: "/login", replace: true });
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex min-h-20 max-w-[1500px] items-center justify-between gap-8 px-6 lg:px-10">
          <Link to="/dashboard" className="flex items-center gap-3" aria-label="Legal Metrology dashboard">
            <span className="grid size-9 place-items-center bg-orange font-display text-sm font-bold text-accent-foreground">LM</span>
            <span className="hidden text-sm font-semibold sm:block">Legal Metrology</span>
          </Link>
          <nav className="hidden items-center gap-1 rounded-md bg-surface-deep p-1 md:flex" aria-label="Primary navigation">
            {navigation.map(({ label, to }) => (
              <Link
                key={to}
                to={to}
                className={`rounded px-4 py-2 text-xs font-semibold transition-colors ${pathname === to || (to === "/dashboard" && pathname === "/") ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-surface hover:text-foreground"}`}
              >
                {label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-xs font-semibold">Enforcement Officer</p>
              <p className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">India · LM Portal</p>
            </div>
            <Button variant="outline" size="sm" onClick={logout} aria-label="Logout">
              <LogOut />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </div>
        <nav className="mx-auto flex max-w-[1500px] gap-1 overflow-x-auto px-6 pb-3 md:hidden" aria-label="Mobile navigation">
          {navigation.map(({ label, to, icon: Icon }) => (
            <Link key={to} to={to} className={`flex shrink-0 items-center gap-2 rounded px-3 py-2 text-xs font-semibold ${pathname === to ? "bg-primary text-primary-foreground" : "bg-surface-deep text-muted-foreground"}`}>
              <Icon className="size-3.5" /> {label}
            </Link>
          ))}
        </nav>
      </header>
      <main>{children}</main>
      <footer className="mx-auto flex max-w-[1500px] items-center justify-between px-6 py-8 text-[10px] uppercase tracking-[0.16em] text-muted-foreground lg:px-10">
        <span>Government enforcement workspace</span>
        <span>Legal Metrology · India <ArrowUpRight className="ml-1 inline size-3" /></span>
      </footer>
    </div>
  );
}

export function PageIntro({ eyebrow, title, description, action }: { eyebrow: string; title: ReactNode; description?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col gap-5 border-b border-line-strong pb-7 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.22em] text-orange">{eyebrow}</p>
        <h1 className="display-heading max-w-3xl text-4xl font-bold uppercase leading-[0.95] sm:text-6xl">{title}</h1>
        {description ? <p className="mt-4 max-w-xl text-sm leading-6 text-muted-foreground">{description}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

export function PageFrame({ children }: { children: ReactNode }) {
  return <div className="mx-auto max-w-[1500px] px-6 py-8 lg:px-10 lg:py-12">{children}</div>;
}

export function LoadingState({ label = "Loading inspection data" }: { label?: string }) {
  return <div className="flex min-h-64 items-center justify-center border border-dashed border-border text-xs uppercase tracking-[0.16em] text-muted-foreground">{label} …</div>;
}

export function ErrorState({ message }: { message: string }) {
  return <div className="border border-critical/40 bg-critical/10 px-4 py-3 text-sm text-critical">{message}</div>;
}

export function StatusBadge({ compliant }: { compliant: boolean }) {
  return <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.12em] ${compliant ? "bg-success/15 text-success" : "bg-critical/15 text-critical"}`}><span className={`size-1.5 rounded-full ${compliant ? "bg-success" : "bg-critical"}`} />{compliant ? "Compliant" : "Non-compliant"}</span>;
}

export function formatDate(value?: string) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(date);
}

export function scanIsCompliant(scan: { violations?: unknown[]; status?: string }) {
  return (scan.violations?.length ?? 0) === 0 && !/non[- ]?compliant|fail|violation/i.test(scan.status ?? "");
}