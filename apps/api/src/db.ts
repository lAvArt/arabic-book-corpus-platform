import { Pool } from "pg";
import { env } from "./config.js";

export const db = new Pool({
  connectionString: env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30_000
});

export async function query<T>(
  text: string,
  values: unknown[] = []
): Promise<T[]> {
  const result = await db.query(text, values);
  return result.rows;
}

export async function closeDb(): Promise<void> {
  await db.end();
}
