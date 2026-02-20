import { query } from "../db.js";

interface PolicyRow {
  id: string;
  requests_per_minute: number;
  requests_per_day: number;
}

async function getPolicyForKey(keyId: string): Promise<PolicyRow | null> {
  const rows = await query<PolicyRow>(
    `
      select rp.id, rp.requests_per_minute, rp.requests_per_day
      from api_key k
      left join rate_limit_policy rp on rp.id = k.rate_limit_policy_id
      where k.id = $1
      limit 1
    `,
    [keyId]
  );
  if (rows[0]) return rows[0];

  const fallback = await query<PolicyRow>(
    `
      select id, requests_per_minute, requests_per_day
      from rate_limit_policy
      where policy_name = 'default-free'
      limit 1
    `
  );
  return fallback[0] ?? null;
}

export async function enforceDailyRateLimit(keyId: string): Promise<boolean> {
  const policy = await getPolicyForKey(keyId);
  if (!policy) return true;

  const rows = await query<{ request_count: number }>(
    `
      select request_count
      from api_key_usage_daily
      where api_key_id = $1 and usage_date = current_date
      limit 1
    `,
    [keyId]
  );

  const currentCount = rows[0]?.request_count ?? 0;
  if (currentCount >= policy.requests_per_day) return false;

  await query(
    `
      insert into api_key_usage_daily (api_key_id, usage_date, request_count, last_request_at)
      values ($1, current_date, 1, now())
      on conflict (api_key_id, usage_date)
      do update set
        request_count = api_key_usage_daily.request_count + 1,
        last_request_at = now()
    `,
    [keyId]
  );

  return true;
}
