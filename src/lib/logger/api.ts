import { NextRequest } from "next/server";

import { createRequestInfo } from "./request";
import {
  createResponseInfo,
  logRequest,
} from "./request";
import { logger } from "./logger";

import type { RequestInfo } from "./types";

type LogMeta = {
  registry?: string;
  handler?: string;
  operation?: string;
  triesPerMinute?: number;
  blocked?: boolean;
};

export class LoggerApi {
  protected readonly request: RequestInfo;

  constructor(
    request: NextRequest
  ) {
    this.request =
      createRequestInfo(request);
  }

  private messageFromError(
    error: unknown,
    fallback: string
  ) {
    if (
      error instanceof Error &&
      error.message
    ) {
      return error.message;
    }

    return fallback;
  }

  private write(
    status: number,
    options: {
      registry?: string;
      handler?: string;
      operation?: string;
      message?: string;
      rows?: number;
      triesPerMinute?: number;
      blocked?: boolean;
    },
    error?: unknown
  ) {
    const response = createResponseInfo(
      this.request,
      status,
      status < 400
    );

    logRequest({
      request: this.request,
      response,
      registry: options.registry,
      handler: options.handler,
      operation: options.operation,
      triesPerMinute:
        options.triesPerMinute,
      blocked: options.blocked,
      message:
        options.message ??
        (options.rows !== undefined
          ? `${options.rows} row(s) affected.`
          : undefined),
      error,
    });
  }

  ok(options: {
    registry?: string;
    handler?: string;
    operation?: string;
    message?: string;
    rows?: number;
    triesPerMinute?: number;
    blocked?: boolean;
  }) {
    this.write(200, options);
  }

  created(options: {
    registry?: string;
    handler?: string;
    operation?: string;
    message?: string;
    rows?: number;
    triesPerMinute?: number;
    blocked?: boolean;
  }) {
    this.write(201, options);
  }

  updated(options: {
    registry?: string;
    handler?: string;
    operation?: string;
    message?: string;
    rows?: number;
    triesPerMinute?: number;
    blocked?: boolean;
  }) {
    this.write(200, options);
  }

  deleted(options: {
    registry?: string;
    handler?: string;
    operation?: string;
    message?: string;
    triesPerMinute?: number;
    blocked?: boolean;
  }) {
    this.write(204, options);
  }

  rateLimited(options: {
    registry?: string;
    handler?: string;
    operation?: string;
    message?: string;
    triesPerMinute?: number;
  }) {
    this.write(429, {
      ...options,
      blocked: true,
    });
  }

  validation(
    error: unknown,
    meta?: LogMeta
  ) {
    this.write(
      422,
      {
        ...meta,
        message: this.messageFromError(
          error,
          "Validation failed."
        ),
      },
      error
    );
  }

  badRequest(
    error: unknown,
    meta?: LogMeta
  ) {
    this.write(
      400,
      {
        ...meta,
        message: this.messageFromError(
          error,
          "Bad request."
        ),
      },
      error
    );
  }

  notFound(
    message?: string,
    meta?: LogMeta
  ) {
    this.write(404, {
      ...meta,
      message:
        message ??
        "Resource not found.",
    });
  }

  internal(
    error: unknown,
    meta?: LogMeta
  ) {
    this.write(
      500,
      {
        ...meta,
        message: this.messageFromError(
          error,
          "Internal server error."
        ),
      },
      error
    );
  }

  prisma(
    action: string,
    duration: number,
    rows?: number
  ) {
    logger.debug({
      request: this.request,
      handler: "Prisma Client",
      operation: action,
      response: {
        status: 200,
        success: true,
        duration,
      },
      message:
        rows !== undefined
          ? `${rows} row(s) affected.`
          : undefined,
    });
  }
}

export function beginRequest(
  request: NextRequest
) {
  return new LoggerApi(request);
}
