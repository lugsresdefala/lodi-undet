import { createFileRoute, redirect, Outlet } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated")({
  beforeLoad: async ({ location }) => {
    if (typeof window === "undefined") return;
    const { data } = await supabase.auth.getUser();
    if (!data.user) {
      throw redirect({ to: "/login", search: { redirect: location.href } });
    }
  },
  component: AuthLayout,
});

function AuthLayout() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    supabase.auth.getUser().then(() => setReady(true));
  }, []);
  if (!ready) return <div className="p-8 text-sm text-muted-foreground">Carregando…</div>;
  return <Outlet />;
}
