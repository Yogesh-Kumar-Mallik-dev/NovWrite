import { NextRequest } from "next/server";

import { createRequestInfo } from "./request";

import type { RequestInfo } from "./types";

export class LoggerApi {
  protected readonly request: RequestInfo;

  constructor(
    request: NextRequest
  ) {
    this.request =
      createRequestInfo(request);
  }

  ok(options: {
    registry?: string;
    handler?: string;
    operation?: string;
    message?: string;
    rows?: number;
  }) { }

  created(options: {
    registry?: string;
    handler?: string;
    operation?: string;
    message?: string;
    rows?: number;
  }) { }

  updated(options: {
    registry?: string;
    handler?: string;
    operation?: string;
    message?: string;
    rows?: number;
  }) { }

  deleted(options: {
    registry?: string;
    handler?: string;
    operation?: string;
    message?: string;
  }) { }

  validation(error: unknown) { }

  badRequest(error: unknown) { }

  notFound(message?: string) { }

  internal(error: unknown) { }

  prisma(
    action: string,
    duration: number,
    rows?: number
  ) { }
}

export function beginRequest(
  request: NextRequest
) {
  return new LoggerApi(request);
}
