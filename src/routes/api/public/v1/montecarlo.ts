import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { optionsResponse, withApiAuth } from "@/lib/api-public.server";
import { CONFIG_PADRAO, simularMonteCarlo } from "@/lib/pk-engine";

const DoseSchema = z.object({
  diaDose: z.number().min(0).max(3650),
  doseMg: z.number().min(1).max(5000),
  rotulo: z.string().max(80).optional(),
});

const BodySchema = z.object({
  doses: z.array(DoseSchema).min(1).max(60),
  nSimulacoes: z.number().int().min(10).max(500).default(200),
  config: z.object({
    passoDias: z.number().min(0.5).max(5),
    horizonteDias: z.number().min(7).max(3650),
  }).optional(),
});

export const Route = createFileRoute("/api/public/v1/montecarlo")({
  server: {
    handlers: {
      OPTIONS: async () => optionsResponse(),
      POST: async ({ request }) =>
        withApiAuth(request, "montecarlo", async (body) => {
          const parsed = BodySchema.parse(body);
          const config = parsed.config ?? CONFIG_PADRAO;
          return simularMonteCarlo(parsed.doses, parsed.nSimulacoes, config);
        }),
    },
  },
});
