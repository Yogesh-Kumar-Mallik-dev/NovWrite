import { ClientType } from "./types"
export function detectClientType(
  userAgent: string
): ClientType {
  const ua = userAgent.toLowerCase();

  /* ---------------------------------------------------------------------- */
  /* API Clients                                                            */
  /* ---------------------------------------------------------------------- */

  if (
    ua.includes("postman") ||
    ua.includes("insomnia") ||
    ua.includes("thunder client") ||
    ua.includes("thunderclient") ||
    ua.includes("curl")
  ) {
    return "API Client";
  }

  /* ---------------------------------------------------------------------- */
  /* Bots                                                                   */
  /* ---------------------------------------------------------------------- */

  if (
    ua.includes("bot") ||
    ua.includes("crawler") ||
    ua.includes("spider")
  ) {
    return "Bot";
  }

  /* ---------------------------------------------------------------------- */
  /* Tablets                                                                */
  /* ---------------------------------------------------------------------- */

  if (
    ua.includes("ipad") ||
    ua.includes("tablet")
  ) {
    return "Tablet";
  }

  /* ---------------------------------------------------------------------- */
  /* Mobile                                                                 */
  /* ---------------------------------------------------------------------- */

  if (
    ua.includes("android") ||
    ua.includes("iphone") ||
    ua.includes("mobile")
  ) {
    return "Mobile";
  }

  /* ---------------------------------------------------------------------- */
  /* Desktop                                                                */
  /* ---------------------------------------------------------------------- */

  if (
    ua.includes("windows") ||
    ua.includes("macintosh") ||
    ua.includes("linux")
  ) {
    return "Desktop";
  }

  return "Unknown";
}
