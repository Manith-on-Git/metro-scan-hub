import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight, LockKeyhole } from "lucide-react";
import { FormEvent, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import inspectionScanner from "@/assets/inspection-scanner.png";
import { ApiError, isDemoMode, login } from "@/lib/api";
import { isAuthenticated } from "@/lib/auth";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Officer Sign In · Legal Metrology" }, { name: "description", content: "Secure sign in for the Legal Metrology Compliance Checker." }, { property: "og:title", content: "Officer Sign In · Legal Metrology" }, { property: "og:description", content: "Secure sign in for the Legal Metrology Compliance Checker." }] }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  if (typeof window !== "undefined" && isAuthenticated()) {
    void navigate({ to: "/dashboard", replace: true });
    return null;
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await login(email, password);
      await navigate({ to: "/dashboard", replace: true });
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : "Sign in failed. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="flex items-center justify-between px-6 py-6 lg:px-10">
        <Link to="/login" className="flex items-center gap-3"><span className="grid size-9 place-items-center bg-orange font-display text-sm font-bold text-accent-foreground">LM</span><span className="text-sm font-semibold">Legal Metrology</span></Link>
        <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Officer access</span>
      </header>
      <main className="mx-auto grid min-h-[calc(100vh-104px)] max-w-[1500px] items-center gap-12 px-6 py-10 lg:grid-cols-[1fr_430px] lg:px-20">
        <section className="relative hidden min-h-[560px] overflow-hidden border-y border-line-strong py-10 lg:block">
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-orange">Secure inspection workspace</p>
          <h1 className="display-heading relative z-10 mt-5 max-w-2xl text-7xl font-bold uppercase leading-[0.86]">Labels<br /><span className="text-orange">under</span><br />review.</h1>
          <p className="relative z-10 mt-8 max-w-sm text-sm leading-6 text-muted-foreground">A precise workspace for packaged product label inspections under Indian Legal Metrology requirements.</p>
          <img src={inspectionScanner} alt="" className="pointer-events-none absolute -bottom-16 right-0 w-[58%] max-w-[620px] rotate-[-4deg] object-contain" />
        </section>
        <section className="border border-line-strong bg-surface p-7 shadow-[12px_12px_0_var(--color-primary)] sm:p-10">
          <div className="mb-9 flex items-start justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-orange">Access portal</p><h2 className="display-heading mt-2 text-3xl font-bold uppercase">Sign in</h2></div><LockKeyhole className="size-5 text-muted-foreground" /></div>
          <form className="space-y-5" onSubmit={submit}>
            <label className="block"><span className="mb-2 block text-xs font-bold uppercase tracking-[0.14em]">Email address</span><Input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="officer@department.gov.in" autoComplete="email" required /></label>
            <label className="block"><span className="mb-2 block text-xs font-bold uppercase tracking-[0.14em]">Password</span><Input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Enter your password" autoComplete="current-password" required /></label>
            {error ? <p className="border border-critical/40 bg-critical/10 px-3 py-2 text-sm text-critical">{error}</p> : null}
            <Button type="submit" className="h-11 w-full" disabled={busy}>{busy ? "Signing in …" : "Enter inspection portal"}<ArrowRight /></Button>
          </form>
          {isDemoMode ? <p className="mt-5 border border-orange/40 bg-orange/10 px-3 py-2 text-xs leading-5 text-foreground"><strong>Demo mode active.</strong> Use any email and password to enter the sample portal.</p> : null}
          <p className="mt-8 border-t border-border pt-5 text-xs leading-5 text-muted-foreground">Access is restricted to authorised enforcement officers. All inspection activity is recorded.</p>
        </section>
      </main>
    </div>
  );
}