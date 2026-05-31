import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { optionsResponse, withApiAuth } from "@/lib/api-public.server";
import {
  CONFIG_PADRAO,
  PARAMETROS_POPULACIONAIS,
  calcularMetricas,
  calcularMetricasSS,
  simularPerfil,
} from "@/lib/pk-engine";

const DoseSchema = z.object({
  diaDose: z.number().min(0).max(3650),
  doseMg: z.number().min(1).max(5000),
  rotulo: z.string().max(80).optional(),
});

const ParamsSchema = z.object({
  ka_rapido: z.number().positive(),
  ka_lento: z.number().positive(),
  frac_rapido: z.number().min(0).max(1),
  ke: z.number().positive(),
  S: z.number().positive(),
}).optional();

const ConfigSchema = z.object({
  passoDias: z.number().min(0.1).max(5),
  horizonteDias: z.number().min(7).max(3650),
}).optional();

const BodySchema = z.object({
  doses: z.array(DoseSchema).min(1).max(60),
  params: ParamsSchema,
  config: ConfigSchema,
});

export const Route = createFileRoute("/api/public/v1/simulate")({
  server: {
    handlers: {
      OPTIONS: async () => optionsResponse(),
      POST: async ({ request }) =>
        withApiAuth(request, "simulate", async (body) => {
          const parsed = BodySchema.parse(body);
          const params = parsed.params ?? PARAMETROS_POPULACIONAIS;
          const config = parsed.config ?? CONFIG_PADRAO;
          const perfil = simularPerfil(parsed.doses, params, config);
          const metricas = calcularMetricas(perfil, parsed.doses);
          const metricasSS = calcularMetricasSS(perfil, parsed.doses);
          return { perfil, metricas, metricasSS };
        }),
    },
  },
});
