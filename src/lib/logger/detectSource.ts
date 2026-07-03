import { NextRequest } from "next/server";

import { RequestSource } from "./types";

/* -------------------------------------------------------------------------- */
/*                             Source Detection                               */
/* -------------------------------------------------------------------------- */

export function detectSource(
  request: NextRequest
): RequestSource {
  const userAgent =
    request.headers
      .get("user-agent")
      ?.toLowerCase() ?? "";

  const origin =
    request.headers
      .get("origin")
      ?.toLowerCase() ?? "";

  const referer =
    request.headers
      .get("referer")
      ?.toLowerCase() ?? "";

  const xRequestedWith =
    request.headers
      .get("x-requested-with")
      ?.toLowerCase() ?? "";

  const secFetchSite =
    request.headers
      .get("sec-fetch-site")
      ?.toLowerCase() ?? "";

  const secFetchMode =
    request.headers
      .get("sec-fetch-mode")
      ?.toLowerCase() ?? "";

  const secFetchDest =
    request.headers
      .get("sec-fetch-dest")
      ?.toLowerCase() ?? "";

  /* ---------------------------------------------------------------------- */
  /* API Clients                                                            */
  /* ---------------------------------------------------------------------- */

  if (userAgent.includes("postman")) {
    return "POSTMAN";
  }

  if (userAgent.includes("insomnia")) {
    return "INSOMNIA";
  }

  if (
    userAgent.includes("thunder client") ||
    userAgent.includes("thunderclient")
  ) {
    return "THUNDER_CLIENT";
  }

  if (userAgent.includes("curl")) {
    return "CURL";
  }

  /* ---------------------------------------------------------------------- */
  /* Internal Services                                                      */
  /* ---------------------------------------------------------------------- */

  if (
    xRequestedWith === "xmlhttprequest"
  ) {
    return "SERVICE";
  }

  /* ---------------------------------------------------------------------- */
  /* Frontend                                                               */
  /* ---------------------------------------------------------------------- */

  if (
    secFetchSite === "same-origin" ||
    secFetchSite === "same-site"
  ) {
    return "FRONTEND";
  }

  if (
    origin.length > 0 ||
    referer.length > 0
  ) {
    if (
      origin.includes("localhost") ||
      referer.includes("localhost")
    ) {
      return "FRONTEND";
    }

    return "BROWSER";
  }

  if (
    secFetchMode === "navigate" ||
    secFetchDest === "document"
  ) {
    return "BROWSER";
  }

  /* ---------------------------------------------------------------------- */
  /* Unknown                                                                */
  /* ---------------------------------------------------------------------- */

  return "UNKNOWN";
}
