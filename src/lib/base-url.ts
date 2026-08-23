import "server-only";

import { headers } from "next/headers";

/**
 * Resolve the public base URL from the incoming request so share links are
 * correct in every environment (localhost, preview deploys, production).
 */
export async function getBaseUrl(): Promise<string> {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  if (host) {
    const proto = h.get("x-forwarded-proto") ?? "http";
    return `${proto}://${host}`;
  }
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}
