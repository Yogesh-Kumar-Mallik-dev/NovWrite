import { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { ZodError } from "zod";

import { buildQuery } from "./query";
import {
  CrudRegistryEntry,
  registry,
} from "./registry";

import {
  ok,
  created,
  internalServerError,
  notFound,
  tooManyRequests,
  validationError,
} from "@/lib/api/response";
import {
  beginRequest,
  LoggerApi,
} from "@/lib/logger";


import { handlePrismaError } from "./prismaError";
import { checkRateLimit } from "./rateLimit";
/* -------------------------------------------------------------------------- */
/*                                  Helpers                                   */
/* -------------------------------------------------------------------------- */

function getRegistryEntry(
  domain: string
): CrudRegistryEntry | null {
  return registry[domain as keyof typeof registry] ?? null;
}

function handleApiError(
  error: unknown,
  log: LoggerApi,
  context: {
    registry?: string;
    handler: string;
    operation: string;
    triesPerMinute?: number;
    blocked?: boolean;
  }
) {
  if (error instanceof ZodError) {
    log.validation(error, context);
    return validationError(error);
  }

  if (
    error instanceof
    Prisma.PrismaClientKnownRequestError
  ) {
    const response =
      handlePrismaError(error);

    if (response.status >= 500) {
      log.internal(error, context);
      return response;
    }

    if (response.status === 404) {
      log.notFound(
        "Requested resource was not found.",
        context
      );
      return response;
    }

    log.badRequest(error, context);

    return response;
  }

  log.internal(error, context);

  return internalServerError(error);
}

/* -------------------------------------------------------------------------- */
/*                              Collection GET                                */
/* -------------------------------------------------------------------------- */

export async function handleGetCollection(
  request: NextRequest,
  {
    params,
  }: {
    params: Promise<{
      domain: string;
    }>;
  }
) {
  const log =
    beginRequest(request);

  const rateLimit =
    checkRateLimit(request);

  if (!rateLimit.allowed) {
    log.rateLimited({
      handler: "Collection Handler",
      operation: "findMany+count",
      triesPerMinute:
        rateLimit.triesPerMinute,
      message: `Rate limit exceeded (${rateLimit.limitPerMinute}/min). Retry in ${rateLimit.retryAfterSeconds}s.`,
    });

    return tooManyRequests(
      `Rate limit exceeded (${rateLimit.limitPerMinute}/min).`
    );
  }

  let domain: string | undefined;

  try {
    ({ domain } = await params);


    const entry =
      getRegistryEntry(domain);

    if (!entry) {
      log.notFound("Unknown domain.", {
        registry: domain,
        handler: "Collection Handler",
        operation: "findMany+count",
        triesPerMinute:
          rateLimit.triesPerMinute,
        blocked: rateLimit.blocked,
      });
      return notFound(
        "Unknown domain."
      );
    }

    const query = buildQuery(
      request.nextUrl.searchParams,
      entry
    );

    const [data, total] =
      await Promise.all([
        entry.model.findMany(query),
        entry.model.count({
          where: query.where,
        }),
      ]);

    log.ok({
      registry: domain,
      handler: "Collection Handler",
      operation: "findMany+count",
      rows: data.length,
      triesPerMinute:
        rateLimit.triesPerMinute,
      blocked: rateLimit.blocked,
    });

    return ok({
      data,
      pagination: {
        total,
        page:
          query.skip /
          query.take +
          1,
        limit: query.take,
        pages: Math.ceil(
          total / query.take
        ),
      },
    });
  } catch (error) {
    return handleApiError(
      error,
      log,
      {
        registry: domain,
        handler:
          "Collection Handler",
        operation:
          "findMany+count",
        triesPerMinute:
          rateLimit.triesPerMinute,
        blocked: rateLimit.blocked,
      }
    );
  }
}

/* -------------------------------------------------------------------------- */
/*                              Collection POST                               */
/* -------------------------------------------------------------------------- */

export async function handleCreate(
  request: NextRequest,
  {
    params,
  }: {
    params: Promise<{
      domain: string;
    }>;
  }
) {
  const log =
    beginRequest(request);

  const rateLimit =
    checkRateLimit(request);

  if (!rateLimit.allowed) {
    log.rateLimited({
      handler: "Collection Handler",
      operation: "create",
      triesPerMinute:
        rateLimit.triesPerMinute,
      message: `Rate limit exceeded (${rateLimit.limitPerMinute}/min). Retry in ${rateLimit.retryAfterSeconds}s.`,
    });

    return tooManyRequests(
      `Rate limit exceeded (${rateLimit.limitPerMinute}/min).`
    );
  }

  let domain: string | undefined;

  try {
    ({ domain } = await params);

    const entry =
      getRegistryEntry(domain);

    if (!entry) {
      log.notFound("Unknown domain.", {
        registry: domain,
        handler: "Collection Handler",
        operation: "create",
        triesPerMinute:
          rateLimit.triesPerMinute,
        blocked: rateLimit.blocked,
      });
      return notFound(
        "Unknown domain."
      );
    }

    const body =
      await request.json();

    const data =
      entry.createSchema.parse(
        body
      );

    const createdRecord =
      await entry.model.create({
        data,
      });

    log.created({
      registry: domain,
      handler: "Collection Handler",
      operation: "create",
      rows: 1,
      triesPerMinute:
        rateLimit.triesPerMinute,
      blocked: rateLimit.blocked,
    });

    return created(
      createdRecord
    );
  } catch (error) {
    return handleApiError(
      error,
      log,
      {
        registry: domain,
        handler:
          "Collection Handler",
        operation: "create",
        triesPerMinute:
          rateLimit.triesPerMinute,
        blocked: rateLimit.blocked,
      }
    );
  }
}
