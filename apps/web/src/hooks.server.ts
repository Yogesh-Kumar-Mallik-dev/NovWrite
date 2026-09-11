import type { Handle } from "@sveltejs/kit";
import type { UserAccount } from "@novwrite/bridge";

function decodeJwtPayload(token: string): any {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const jsonStr = atob(base64);
    return JSON.parse(jsonStr);
  } catch {
    return null;
  }
}

/**
 * Global Server Hook for NovWrite SvelteKit Web Application
 * Handles session resolution from HttpOnly cookies and asset normalization.
 */
export const handle: Handle = async ({ event, resolve }) => {
  // 1. Gracefully handle any relative requests for site.webmanifest from nested subpaths (e.g. /world/site.webmanifest)
  if (
    event.url.pathname.endsWith("/site.webmanifest") &&
    event.url.pathname !== "/site.webmanifest"
  ) {
    return new Response(null, {
      status: 301,
      headers: {
        Location: "/site.webmanifest",
      },
    });
  }

  // 2. Cookie Session Resolution
  const accessToken = event.cookies.get("access_token") || null;
  event.locals.token = accessToken;
  event.locals.user = null;

  if (accessToken) {
    const claims = decodeJwtPayload(accessToken);
    if (claims && (!claims.exp || claims.exp * 1000 > Date.now())) {
      event.locals.user = {
        id: claims.sub || claims.userId || "",
        email: claims.email || "",
        username: claims.username || claims.sub || "Author",
        role: claims.role || "USER",
        isPlatformAdmin: claims.role === "ADMIN" || claims.role === "SUPER_ADMIN",
        mfaEnabled: false,
        accountStatus: "ACTIVE",
        createdAt: new Date(claims.iat ? claims.iat * 1000 : Date.now()).toISOString(),
      } as UserAccount;
    }
  }

  return resolve(event);
};

