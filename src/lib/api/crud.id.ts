import { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { ZodError } from "zod";

import {
  CrudRegistryEntry,
  registry,
} from "./registry";

import {
  ok,
  noContent,
  notFound,
  tooManyRequests,
  validationError,
  internalServerError,
} from "@/lib/api/response";
import {
  beginRequest,
  LoggerApi,
} from "@/lib/logger";

import { validateObjectId } from "./objectId"

import { handlePrismaError } from "./prismaError";
import { checkRateLimit } from "./rateLimit";
/* -------------------------------------------------------------------------- */
/*                                  Helpers                                   */
/* -------------------------------------------------------------------------- */

function getRegistryEntry(
  domain: string
): CrudRegistryEntry | null {
  return registry[domain] ?? null;
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
/*                                GET BY ID                                   */
/* -------------------------------------------------------------------------- */

export async function handleGetById(
  request: NextRequest,
  {
    params,
  }: {
    params: Promise<{
      domain: string;
      id: string;
    }>;
  }
) {
  const log =
    beginRequest(request);

  const rateLimit =
    checkRateLimit(request);

  if (!rateLimit.allowed) {
    log.rateLimited({
      handler: "Resource Handler",
      operation: "findUnique",
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
    const resolved =
      await params;
    domain = resolved.domain;
    const { id } = resolved;

    const invalid = validateObjectId(id);

    if (invalid) {
      log.badRequest(
        new Error("Invalid ObjectId."),
        {
          registry: domain,
          handler: "Resource Handler",
          operation: "findUnique",
          triesPerMinute:
            rateLimit.triesPerMinute,
          blocked: rateLimit.blocked,
        }
      );
      return invalid;
    }

    const entry =
      getRegistryEntry(domain);

    if (!entry) {
      log.notFound("Unknown domain.", {
        registry: domain,
        handler: "Resource Handler",
        operation: "findUnique",
        triesPerMinute:
          rateLimit.triesPerMinute,
        blocked: rateLimit.blocked,
      });
      return notFound(
        "Unknown domain."
      );
    }

    const record =
      await entry.model.findUnique({
        where: { id },
        include: entry.include,
      });

    if (!record) {
      log.notFound(
        "Resource not found.",
        {
          registry: domain,
          handler: "Resource Handler",
          operation: "findUnique",
          triesPerMinute:
            rateLimit.triesPerMinute,
          blocked: rateLimit.blocked,
        }
      );
      return notFound();
    }

    log.ok({
      registry: domain,
      handler: "Resource Handler",
      operation: "findUnique",
      rows: 1,
      triesPerMinute:
        rateLimit.triesPerMinute,
      blocked: rateLimit.blocked,
    });

    return ok(record);
  } catch (error) {
    return handleApiError(
      error,
      log,
      {
        registry: domain,
        handler: "Resource Handler",
        operation: "findUnique",
        triesPerMinute:
          rateLimit.triesPerMinute,
        blocked: rateLimit.blocked,
      }
    );
  }
}

/* -------------------------------------------------------------------------- */
/*                                   PATCH                                    */
/* -------------------------------------------------------------------------- */

export async function handleUpdate(
  request: NextRequest,
  {
    params,
  }: {
    params: Promise<{
      domain: string;
      id: string;
    }>;
  }
) {
  const log =
    beginRequest(request);

  const rateLimit =
    checkRateLimit(request);

  if (!rateLimit.allowed) {
    log.rateLimited({
      handler: "Resource Handler",
      operation: "update",
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
    const resolved =
      await params;
    domain = resolved.domain;
    const { id } = resolved;

    const invalid =
      validateObjectId(id);

    if (invalid) {
      log.badRequest(
        new Error("Invalid ObjectId."),
        {
          registry: domain,
          handler: "Resource Handler",
          operation: "update",
          triesPerMinute:
            rateLimit.triesPerMinute,
          blocked: rateLimit.blocked,
        }
      );
      return invalid;
    }

    const entry =
      getRegistryEntry(domain);

    if (!entry) {
      log.notFound("Unknown domain.", {
        registry: domain,
        handler: "Resource Handler",
        operation: "update",
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
      entry.updateSchema.parse(
        body
      );

    const record =
      await entry.model.update({
        where: { id },
        data,
      });

    log.updated({
      registry: domain,
      handler: "Resource Handler",
      operation: "update",
      rows: 1,
      triesPerMinute:
        rateLimit.triesPerMinute,
      blocked: rateLimit.blocked,
    });

    return ok(
      record,
      "Resource updated successfully."
    );
  } catch (error) {
    return handleApiError(
      error,
      log,
      {
        registry: domain,
        handler: "Resource Handler",
        operation: "update",
        triesPerMinute:
          rateLimit.triesPerMinute,
        blocked: rateLimit.blocked,
      }
    );
  }
}

/* -------------------------------------------------------------------------- */
/*                                  DELETE                                    */
/* -------------------------------------------------------------------------- */

export async function handleDelete(
  request: NextRequest,
  {
    params,
  }: {
    params: Promise<{
      domain: string;
      id: string;
    }>;
  }
) {
  const log =
    beginRequest(request);

  const rateLimit =
    checkRateLimit(request);

  if (!rateLimit.allowed) {
    log.rateLimited({
      handler: "Resource Handler",
      operation: "delete",
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
    const resolved =
      await params;
    domain = resolved.domain;
    const { id } = resolved;

    const invalid =
      validateObjectId(id);

    if (invalid) {
      log.badRequest(
        new Error("Invalid ObjectId."),
        {
          registry: domain,
          handler: "Resource Handler",
          operation: "delete",
          triesPerMinute:
            rateLimit.triesPerMinute,
          blocked: rateLimit.blocked,
        }
      );
      return invalid;
    }

    const entry =
      getRegistryEntry(domain);

    if (!entry) {
      log.notFound("Unknown domain.", {
        registry: domain,
        handler: "Resource Handler",
        operation: "delete",
        triesPerMinute:
          rateLimit.triesPerMinute,
        blocked: rateLimit.blocked,
      });
      return notFound(
        "Unknown domain."
      );
    }

    await entry.model.delete({
      where: { id },
    });

    log.deleted({
      registry: domain,
      handler: "Resource Handler",
      operation: "delete",
      message:
        "Resource deleted successfully.",
      triesPerMinute:
        rateLimit.triesPerMinute,
      blocked: rateLimit.blocked,
    });

    return noContent();
  } catch (error) {
    return handleApiError(
      error,
      log,
      {
        registry: domain,
        handler: "Resource Handler",
        operation: "delete",
        triesPerMinute:
          rateLimit.triesPerMinute,
        blocked: rateLimit.blocked,
      }
    );
  }
}
