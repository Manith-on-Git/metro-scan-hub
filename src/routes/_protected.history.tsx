import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowUpDown, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { Input } from "@/components/ui/input";
import { api, ApiError, type ScanSummary } from "@/lib/api";
import { ErrorState, formatDate, LoadingState, PageFrame, PageIntro, scanIsCompliant, StatusBadge } from "@/components/portal";

export const Route = createFileRoute("/_protected/history")({
  head: () => ({ meta: [{ title: "Scan History · Legal Metrology" }, { name: "description", content: "Searchable history of packaged product compliance inspections." }, { property: "og:title", content: "Scan History · Legal Metrology" }, { property: "og:description", content: "Searchable history of packaged product compliance inspections." }] }),
  component: HistoryPage,
});

function HistoryPage() {
  const [scans, setScans] = useState<ScanSummary[] | null>(null);
  const [query, setQuery] = useState("");
  const [ascending, setAscending] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => { api.getScans().then(setScans).catch((cause) => setError(cause instanceof ApiError ? cause.message : "Unable to load scan history.")); }, []);
  const filtered = useMemo(() => (scans ?? []).filter((scan) => `${scan.id} ${scan.product_id ?? ""} ${scan.status ?? ""}`.toLowerCase().includes(query.toLowerCase())).sort((a, b) => { const aDate = new Date(a.created_at ?? a.date ?? "").getTime(); const bDate = new Date(b.created_at ?? b.date ?? "").getTime(); return ascending ? aDate - bDate : bDate - aDate; }), [scans, query, ascending]);
  return <PageFrame><PageIntro eyebrow="Inspection records" title={<>Scan<br /><span className="text-orange">history.</span></>} description="Search every submitted inspection by scan ID, product ID, or status." />{error ? <div className="mt-6"><ErrorState message={error} /></div> : null}{!scans && !error ? <div className="mt-8"><LoadingState label="Loading scan records" /></div> : <section className="mt-10 overflow-hidden border border-line-strong bg-surface"><div className="flex flex-col gap-4 border-b border-line-strong p-4 sm:flex-row sm:items-center sm:justify-between"><div className="relative w-full sm:max-w-sm"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search scans …" className="pl-9" /></div><button type="button" onClick={() => setAscending((value) => !value)} className="inline-flex items-center gap-2 self-start text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground hover:text-foreground">Date <ArrowUpDown className="size-3.5" /></button></div><div className="overflow-x-auto"><table className="w-full min-w-[680px] text-left text-sm"><thead className="bg-surface-deep text-[10px] uppercase tracking-[0.14em] text-muted-foreground"><tr><th className="px-5 py-3 font-bold">Date</th><th className="px-4 py-3 font-bold">Scan ID</th><th className="px-4 py-3 font-bold">Product ID</th><th className="px-4 py-3 font-bold">Status</th><th className="px-4 py-3 text-right font-bold">Violations</th><th className="px-5 py-3 text-right font-bold">Open</th></tr></thead><tbody>{filtered.map((scan) => <tr key={String(scan.id)} className="border-t border-border hover:bg-orange/5"><td className="px-5 py-4 text-muted-foreground">{formatDate(scan.created_at ?? scan.date)}</td><td className="px-4 py-4 font-bold">#{scan.id}</td><td className="px-4 py-4 text-muted-foreground">{scan.product_id ?? "—"}</td><td className="px-4 py-4"><StatusBadge compliant={scanIsCompliant(scan)} /></td><td className="px-4 py-4 text-right font-bold">{scan.violation_count ?? scan.violations?.length ?? 0}</td><td className="px-5 py-4 text-right"><Link to="/scans/$id" params={{ id: String(scan.id) }} className="font-bold underline underline-offset-4">View</Link></td></tr>)}</tbody></table>{filtered.length === 0 ? <p className="p-10 text-center text-sm text-muted-foreground">No scan records match this search.</p> : null}</div></section>}</PageFrame>;
}