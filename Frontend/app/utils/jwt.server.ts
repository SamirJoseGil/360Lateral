export type JwtPayload = { exp?: number; [k: string]: unknown };

export function decodeJwtPayload(token: any) {
  try {
    if (!token || typeof token !== "string") {
      console.error("Invalid token type:", typeof token);
      return null;
    }
    return JSON.parse(atob(token.split(".")[1]));
  } catch (e) {
    console.error("Error decoding JWT payload", e);
    return null;
  }
}

export function isExpired(token: any) {
  if (!token || typeof token !== "string") {
    return true;
  }

  const payload = decodeJwtPayload(token);
  if (!payload) return true;

  const expirationTime = payload.exp! * 1000;
  const now = Date.now();

  return now >= expirationTime;
}
