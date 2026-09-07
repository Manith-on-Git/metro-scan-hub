import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, FilePlus2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import inspectionScanner from "@/assets/inspection-scanner.png";
import { api, type DashboardStats, type ScanSummary, ApiError } from "@/lib/api";
import { ErrorState, formatDate, LoadingState, PageFrame, PageIntro, scanIsCompliant, StatusBadge } from "@/components/portal";

export const Route = createFileRoute("/_protected/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard · Legal Metrology" }, { name: "description", content: "Compliance inspection overview for Legal Metrology officers." }, { property: "og:title", content: "Dashboard · Legal Metrology" }, { property: "og:description", content: "Compliance inspection overview for Legal Metrology officers." }] }),
  component: DashboardPage,
});

function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [scans, setScans] = useState<ScanSummary[]>([]);
  const [error, setError] = useState("");
  useEffect(() => { Promise.all([api.getDashboardStats(), api.getScans()]).then(([nextStats, nextScans]) => { setStats(nextStats); setScans(nextScans); }).catch((cause) => setError(cause instanceof ApiError ? cause.message : "Unable to load dashboard data.")); }, []);
  const rules = useMemo(() => { const value = stats?.violations_by_rule; const list = Array.isArray(value) ? value.map((item) => [item.rule_ref, item.count] as const) : Object.entries(value ?? {}); return list.sort((a, b) => b[1] - a[1]).slice(0, 6); }, [stats]);
  const compliant = stats?.compliant_count ?? stats?.compliant ?? scans.filter(scanIsCompliant).length;
  const nonCompliant = stats?.non_compliant_count ?? stats?.non_compliant ?? Math.max((stats?.total_scans ?? scans.length) - compliant, 0);
  const total = stats?.total_scans ?? compliant + nonCompliant;
  const maxRule = Math.max(...rules.map(([, count]) => count), 1);

  if (!stats && !error) return <PageFrame><LoadingState label="Loading dashboard" /></PageFrame>;
  return <PageFrame><PageIntro eyebrow="Inspection overview" title={<>Compliance<br /><span className="text-orange">dashboard.</span></>} description="A live view of packaged product label inspections and rule-level findings." action={<Button asChild><Link to="/upload"><FilePlus2 /> New scan</Link></Button>} />
    {error ? <div className="mt-6"><ErrorState message={error} /></div> : null}
    <div className="mt-8 grid gap-4 sm:grid-cols-3">
      <StatCard label="Total scans" value={total} detail="All recorded inspections" />
      <StatCard label="Compliant" value={compliant} detail={`${total ? Math.round((compliant / total) * 100) : 0}% pass rate`} tone="success" />
      <StatCard label="Non-compliant" value={nonCompliant} detail="Requires enforcement review" tone="critical" />
    </div>
    <div className="mt-8 grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
      <Card className="rounded-none border-line-strong bg-surface shadow-none"><CardContent className="p-6 sm:p-8"><div className="flex items-end justify-between border-b border-border pb-4"><div><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-orange">Rule reference</p><h2 className="display-heading mt-1 text-2xl font-bold uppercase">Violations by rule</h2></div><span className="text-xs text-muted-foreground">Count</span></div><div className="mt-8 space-y-5">{rules.length ? rules.map(([rule, count]) => <div key={rule}><div className="mb-2 flex justify-between gap-4 text-xs"><span className="font-semibold">{rule}</span><span className="font-bold text-muted-foreground">{count}</span></div><div className="h-3 bg-surface-deep"><div className="h-full bg-primary" style={{ width: `${(count / maxRule) * 100}%` }} /></div></div>) : <p className="text-sm text-muted-foreground">No rule-level violations recorded.</p>}</div></CardContent></Card>
       <Card className="rounded-none border-line-strong bg-primary text-primary-foreground shadow-none"><CardContent className="flex h-full flex-col p-6 sm:p-8"><div><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-orange">Workflow</p><h2 className="display-heading mt-2 text-3xl font-bold uppercase">Scan a label.<br />Know the risk.</h2><p className="mt-4 max-w-xs text-sm leading-6 text-primary-foreground/70">Upload a packaged product image and receive extracted fields, rule references, and severity-ranked findings.</p></div><img src={inspectionScanner} alt="Inspection scanner" className="mx-auto my-3 h-36 w-full object-contain" /><Button asChild variant="secondary" className="mt-auto w-full"><Link to="/upload">Start new inspection <ArrowRight /></Link></Button></CardContent></Card>
    </div>
    <section className="mt-8"><div className="mb-4 flex items-end justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-orange">Latest records</p><h2 className="display-heading mt-1 text-2xl font-bold uppercase">Recent scans</h2></div><Link to="/history" className="text-xs font-bold uppercase tracking-[0.12em] underline underline-offset-4">View all <ArrowRight className="ml-1 inline size-3" /></Link></div><div className="overflow-hidden border border-line-strong bg-surface"><table className="w-full text-left text-sm"><thead className="bg-surface-deep text-[10px] uppercase tracking-[0.14em] text-muted-foreground"><tr><th className="px-4 py-3 font-bold">Scan</th><th className="px-4 py-3 font-bold">Date</th><th className="px-4 py-3 font-bold">Status</th><th className="px-4 py-3 text-right font-bold">Findings</th></tr></thead><tbody>{scans.slice(0, 5).map((scan) => <tr key={String(scan.id)} className="border-t border-border"><td className="px-4 py-3"><Link to="/scans/$id" params={{ id: String(scan.id) }} className="font-bold underline underline-offset-4">#{scan.id}</Link></td><td className="px-4 py-3 text-muted-foreground">{formatDate(scan.created_at ?? scan.date)}</td><td className="px-4 py-3"><StatusBadge compliant={scanIsCompliant(scan)} /></td><td className="px-4 py-3 text-right font-bold">{scan.violation_count ?? scan.violations?.length ?? 0}</td></tr>)}</tbody></table></div></section>
  </PageFrame>;
}

function StatCard({ label, value, detail, tone = "default" }: { label: string; value: number; detail: string; tone?: "default" | "success" | "critical" }) { return <Card className="rounded-none border-line-strong bg-surface shadow-none"><CardContent className="p-5"><div className="flex items-center justify-between"><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">{label}</p><span className={`size-2 rounded-full ${tone === "success" ? "bg-success" : tone === "critical" ? "bg-critical" : "bg-orange"}`} /></div><p className={`display-heading mt-3 text-5xl font-bold ${tone === "success" ? "text-success" : tone === "critical" ? "text-critical" : "text-foreground"}`}>{value.toLocaleString("en-IN")}</p><p className="mt-2 text-xs text-muted-foreground">{detail}</p></CardContent></Card>; }