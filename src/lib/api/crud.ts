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

/* -------------------------------------------------------------------------- */
/*                                  Helpers                                   */
/* -------------------------------------------------------------------------- */

function getRegistryEntry(
  domain: string
): CrudRegistryEntry | null {
  return registry[domain] ?? null;
}

function handleApiError(
  error: unknown
) {
  if (error instanceof ZodError) {
    return validationError(error);
  }

  if (
    error instanceof
    Prisma.PrismaClientKnownRequestError
  ) {
    return internalServerError(error);
  }

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
  try {
    const { domain } = await params;

    const entry =
      getRegistryEntry(domain);

    if (!entry) {
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
    return handleApiError(error);
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
  try {
    const { domain } = await params;

    const entry =
      getRegistryEntry(domain);

    if (!entry) {
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

    return created(
      createdRecord
    );
  } catch (error) {
    return handleApiError(error);
  }
}
