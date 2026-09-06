import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";

import { isAuthenticated } from "@/lib/auth";
import { PortalShell } from "@/components/portal";

export const Route = createFileRoute("/_protected")({
  beforeLoad: () => {
    if (typeof window !== "undefined" && !isAuthenticated()) throw redirect({ to: "/login" });
  },
  component: () => <PortalShell><Outlet /></PortalShell>,
});