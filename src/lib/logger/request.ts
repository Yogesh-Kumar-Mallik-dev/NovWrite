import { NextRequest } from "next/server";

import { logger } from "./logger";

import { detectSource } from "./detectSource";
import { describeClient } from "./detectClient";

import {
  createRequestId,
  elapsed,
  now,
} from "./utils";

import {
  ApiLog,
  RequestInfo,
  ResponseInfo,
} from "./types";

/* -------------------------------------------------------------------------- */
/*                              Request Builder                               */
/* -------------------------------------------------------------------------- */

export function createRequestInfo(
  request: NextRequest
): RequestInfo {
  const userAgent =
    request.headers.get(
      "user-agent"
    ) ?? "";

  const client =
    describeClient(userAgent);

  return {
    id: createRequestId(),

    method:
      request.method as RequestInfo["method"],

    path:
      request.nextUrl.pathname,

    ip:
      request.headers.get(
        "x-forwarded-for"
      ) ??
      request.headers.get(
        "x-real-ip"
      ) ??
      "Unknown",

    source:
      detectSource(request),

    browser:
      client.browser,

    client:
      client.device,

    userAgent,

    startedAt: now(),

    request,
  };
}

/* -------------------------------------------------------------------------- */
/*                             Response Builder                               */
/* -------------------------------------------------------------------------- */

export function createResponseInfo(
  request: RequestInfo,
  status: number,
  success: boolean,
  size?: number
): ResponseInfo {
  return {
    status,

    success,

    duration: elapsed(
      request.startedAt
    ),

    size,
  };
}

/* -------------------------------------------------------------------------- */
/*                              Request Logger                                */
/* -------------------------------------------------------------------------- */

export function logRequest(
  log: Omit<ApiLog, "level">
) {
  if (
    log.response?.success
  ) {
    logger.success(log);
  } else {
    logger.error(log);
  }
}
