import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { optionsResponse, withApiAuth } from "@/lib/api-public.server";
import { recomendarIntervalo } from "@/lib/pk-engine";

const BodySchema = z.object({
  doseMg: z.number().min(50).max(2000),
  intervaloDias: z.number().min(7).max(180),
  cmaxObsNgdl: z.number().min(50).max(3000).optional(),
  cminObsNgdl: z.number().min(10).max(3000).optional(),
  cavgAlvoNgdl: z.number().min(200).max(1200).optional(),
});

export const Route = createFileRoute("/api/public/v1/recommend-interval")({
  server: {
    handlers: {
      OPTIONS: async () => optionsResponse(),
      POST: async ({ request }) =>
        withApiAuth(request, "recommend-interval", async (body) => {
          const parsed = BodySchema.parse(body);
          return recomendarIntervalo(parsed);
        }),
    },
  },
});
