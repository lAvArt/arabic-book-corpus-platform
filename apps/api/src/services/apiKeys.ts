import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { query } from "../db.js";

const API_KEY_PREFIX = "ak_live_";
const PREFIX_LENGTH = 12;

function hashKey(rawKey: string): string {
  return createHash("sha256").update(rawKey).digest("hex");
}

export function buildApiKeyPlainText(): { plainText: string; prefix: string; hash: string } {
  const secret = randomBytes(32).toString("base64url");
  const plainText = `${API_KEY_PREFIX}${secret}`;
  const prefix = plainText.slice(0, PREFIX_LENGTH);
  return {
    plainText,
    prefix,
    hash: hashKey(plainText)
  };
}

export async function createApiKeyForUser(params: {
  userId: string;
  name: string;
  expiresAt?: string | null;
}): Promise<{ keyId: string; keyPrefix: string; plainTextKey: string; createdAt: string; expiresAt: string | null }> {
  const material = buildApiKeyPlainText();
  const rows = await query<{
    id: string;
    created_at: string;
    expires_at: string | null;
  }>(
    `
      insert into api_key (owner_user_id, key_name, key_prefix, key_hash, expires_at)
      values ($1, $2, $3, $4, $5)
      returning id, created_at, expires_at
    `,
    [params.userId, params.name, material.prefix, material.hash, params.expiresAt ?? null]
  );

  const [created] = rows;
  return {
    keyId: created.id,
    keyPrefix: material.prefix,
    plainTextKey: material.plainText,
    createdAt: created.created_at,
    expiresAt: created.expires_at
  };
}

export async function rotateApiKey(params: {
  userId: string;
  keyId: string;
}): Promise<{ keyId: string; keyPrefix: string; plainTextKey: string; createdAt: string; expiresAt: string | null } | null> {
  const material = buildApiKeyPlainText();
  const rows = await query<{
    id: string;
    created_at: string;
    expires_at: string | null;
  }>(
    `
      update api_key
      set key_prefix = $1,
          key_hash = $2,
          rotated_at = now(),
          updated_at = now()
      where id = $3 and owner_user_id = $4 and revoked_at is null
      returning id, created_at, expires_at
    `,
    [material.prefix, material.hash, params.keyId, params.userId]
  );
  const rotated = rows[0];
  if (!rotated) return null;
  return {
    keyId: rotated.id,
    keyPrefix: material.prefix,
    plainTextKey: material.plainText,
    createdAt: rotated.created_at,
    expiresAt: rotated.expires_at
  };
}

export async function revokeApiKey(params: { userId: string; keyId: string }): Promise<boolean> {
  const rows = await query<{ id: string }>(
    `
      update api_key
      set revoked_at = now(), updated_at = now()
      where id = $1 and owner_user_id = $2 and revoked_at is null
      returning id
    `,
    [params.keyId, params.userId]
  );
  return Boolean(rows[0]);
}

export async function resolveApiKey(rawApiKey: string): Promise<{ keyId: string; ownerUserId: string } | null> {
  const prefix = rawApiKey.slice(0, PREFIX_LENGTH);
  if (!prefix.startsWith(API_KEY_PREFIX.slice(0, Math.min(API_KEY_PREFIX.length, PREFIX_LENGTH)))) {
    return null;
  }

  const keyRows = await query<{
    id: string;
    owner_user_id: string;
    key_hash: string;
    expires_at: string | null;
    revoked_at: string | null;
  }>(
    `
      select id, owner_user_id, key_hash, expires_at, revoked_at
      from api_key
      where key_prefix = $1
        and revoked_at is null
      limit 10
    `,
    [prefix]
  );

  if (keyRows.length === 0) return null;

  const incomingHash = Buffer.from(hashKey(rawApiKey), "utf8");
  const now = Date.now();
  for (const candidate of keyRows) {
    if (candidate.expires_at && Date.parse(candidate.expires_at) < now) continue;
    const storedHash = Buffer.from(candidate.key_hash, "utf8");
    if (storedHash.length !== incomingHash.length) continue;
    if (timingSafeEqual(storedHash, incomingHash)) {
      return { keyId: candidate.id, ownerUserId: candidate.owner_user_id };
    }
  }

  return null;
}
