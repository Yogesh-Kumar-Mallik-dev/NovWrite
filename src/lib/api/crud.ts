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
  validationError,
} from "@/lib/api/response";
import {
  beginRequest,
  LoggerApi,
} from "@/lib/logger";


import { handlePrismaError } from "./prismaError";
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
      }
    );
  }
}
