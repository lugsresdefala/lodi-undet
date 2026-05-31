import { createFileRoute } from "@tanstack/react-router";
import { CORS_HEADERS, jsonResponse, optionsResponse } from "@/lib/api-public.server";

export const Route = createFileRoute("/api/public/v1/health")({
  server: {
    handlers: {
      OPTIONS: async () => optionsResponse(),
      GET: async () => {
        return jsonResponse({
          ok: true,
          service: "lodi-t API",
          version: "v1",
          timestamp: new Date().toISOString(),
        });
      },
    },
  },
});

// Silence unused warning for types
void CORS_HEADERS;
