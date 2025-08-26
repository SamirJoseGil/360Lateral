// app/utils/jwt.server.ts
export type JwtPayload = { exp?: number; [k: string]: unknown };

export function decodeJwtPayload(token: string | null): JwtPayload | null {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  try {
    const json = Buffer.from(parts[1].replace(/-/g, "+").replace(/_/g, "/"), "base64").toString(
      "utf8",
    );
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export function isExpired(token: string | null, skewSeconds = 10): boolean {
  const payload = decodeJwtPayload(token);
  if (!payload?.exp) return true;
  const now = Math.floor(Date.now() / 1000);
  return payload.exp <= now + skewSeconds;
}
