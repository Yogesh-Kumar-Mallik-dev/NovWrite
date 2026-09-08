import type { Handle } from "@sveltejs/kit";

/**
 * Global Server Hook for NovWrite SvelteKit Web Application
 * Handles asset normalization and fallback routing for nested relative manifest requests.
 */
export const handle: Handle = async ({ event, resolve }) => {
  // Gracefully handle any relative requests for site.webmanifest from nested subpaths (e.g. /world/site.webmanifest)
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

  return resolve(event);
};
