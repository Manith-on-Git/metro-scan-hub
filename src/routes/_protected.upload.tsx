import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { FileImage, UploadCloud } from "lucide-react";
import { FormEvent, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api, ApiError } from "@/lib/api";
import { ErrorState, PageFrame, PageIntro } from "@/components/portal";

export const Route = createFileRoute("/_protected/upload")({
  head: () => ({ meta: [{ title: "New Scan · Legal Metrology" }, { name: "description", content: "Upload a packaged product label for a Legal Metrology compliance check." }, { property: "og:title", content: "New Scan · Legal Metrology" }, { property: "og:description", content: "Upload a packaged product label for a Legal Metrology compliance check." }] }),
  component: UploadPage,
});

function UploadPage() {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [productId, setProductId] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); if (!file) { setError("Select a product label image before submitting."); return; } setBusy(true); setError(""); try { const result = await api.uploadScan(file, productId.trim() || undefined); const id = result.id ?? result.scan_id; if (id === undefined) throw new Error("The scan was submitted but no scan id was returned."); await navigate({ to: "/scans/$id", params: { id: String(id) } }); } catch (cause) { setError(cause instanceof ApiError ? cause.message : cause instanceof Error ? cause.message : "Unable to submit the scan."); } finally { setBusy(false); } }
  return <PageFrame><PageIntro eyebrow="Inspection intake" title={<>New<br /><span className="text-orange">scan.</span></>} description="Submit a clear image of the packaged product label. The service will extract declarations and check them against applicable rules." />
    <form onSubmit={submit} className="mt-10 grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
      <div><button type="button" onClick={() => inputRef.current?.click()} className="group flex min-h-[360px] w-full flex-col items-center justify-center border-2 border-dashed border-line-strong bg-surface p-8 text-center transition-colors hover:border-orange hover:bg-orange/5"><span className="grid size-16 place-items-center bg-primary text-primary-foreground transition-transform group-hover:rotate-[-4deg]"><UploadCloud className="size-7" /></span><span className="display-heading mt-7 text-2xl font-bold uppercase">{file ? file.name : "Drop label image or browse"}</span><span className="mt-3 text-sm text-muted-foreground">JPG, PNG, WEBP or HEIC · up to 10 MB</span>{file ? <span className="mt-5 inline-flex items-center gap-2 text-xs font-bold text-success"><FileImage className="size-4" /> Image ready for inspection</span> : null}</button><input ref={inputRef} type="file" accept="image/*" className="sr-only" onChange={(event) => setFile(event.target.files?.[0] ?? null)} /></div>
      <div className="border border-line-strong bg-primary p-7 text-primary-foreground sm:p-9"><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-orange">Inspection details</p><h2 className="display-heading mt-2 text-3xl font-bold uppercase">Identify the product.</h2><p className="mt-4 text-sm leading-6 text-primary-foreground/70">Product ID is optional, but helps link this inspection to an existing record.</p><label className="mt-9 block"><span className="mb-2 block text-[10px] font-bold uppercase tracking-[0.16em] text-primary-foreground/60">Product ID · optional</span><Input value={productId} onChange={(event) => setProductId(event.target.value)} placeholder="e.g. PRO-8842" className="border-primary-foreground/20 bg-primary-foreground/10 text-primary-foreground placeholder:text-primary-foreground/40" /></label>{error ? <div className="mt-5"><ErrorState message={error} /></div> : null}<Button type="submit" variant="secondary" className="mt-8 w-full" disabled={busy}>{busy ? "Submitting scan …" : "Run compliance scan"}</Button></div>
    </form>
  </PageFrame>;
}