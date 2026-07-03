import {
  Browser,
  ClientType,
} from "./types";

export function detectBrowser(
  userAgent: string
): Browser {
  const ua =
    userAgent.toLowerCase();

  if (ua.includes("postman")) {
    return "Postman";
  }

  if (ua.includes("insomnia")) {
    return "Insomnia";
  }

  if (
    ua.includes("thunder client") ||
    ua.includes("thunderclient")
  ) {
    return "Thunder Client";
  }

  if (ua.includes("curl")) {
    return "curl";
  }

  if (ua.includes("edg/")) {
    return "Edge";
  }

  if (ua.includes("opr/") || ua.includes("opera")) {
    return "Opera";
  }

  if (ua.includes("brave")) {
    return "Brave";
  }

  if (
    ua.includes("firefox")
  ) {
    return "Firefox";
  }

  if (
    ua.includes("safari") &&
    !ua.includes("chrome")
  ) {
    return "Safari";
  }

  if (
    ua.includes("chrome") ||
    ua.includes("chromium")
  ) {
    return "Chrome";
  }

  return "Unknown";
}

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

export function describeClient(
  userAgent: string
) {
  return {
    device:
      detectClientType(
        userAgent
      ),
    browser:
      detectBrowser(userAgent),
  };
}
