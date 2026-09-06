import { createFileRoute, redirect } from "@tanstack/react-router";
import { isAuthenticated } from "@/lib/auth";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [{ title: "Legal Metrology Compliance Checker" }, { name: "description", content: "Indian enforcement portal for packaged product label compliance inspections." }, { property: "og:title", content: "Legal Metrology Compliance Checker" }, { property: "og:description", content: "Indian enforcement portal for packaged product label compliance inspections." }] }),
  beforeLoad: () => { throw redirect({ to: typeof window !== "undefined" && isAuthenticated() ? "/dashboard" : "/login" }); },
  component: () => null,
});
