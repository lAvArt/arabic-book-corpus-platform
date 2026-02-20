import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  API_PORT: z.coerce.number().default(4000),
  LOG_LEVEL: z.string().default("info"),
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().min(1),
  SUPABASE_URL: z.string().optional(),
  SUPABASE_ANON_KEY: z.string().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  MINIO_ENDPOINT: z.string().optional()
});

export type ApiEnv = z.infer<typeof envSchema>;

export const env: ApiEnv = envSchema.parse(process.env);
