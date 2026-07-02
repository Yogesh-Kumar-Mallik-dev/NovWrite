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
  validationError,
  internalServerError,
} from "@/lib/api/response";

import { validateObjectId } from "./objectId"

import { handlePrismaError } from "./prismaError";
/* -------------------------------------------------------------------------- */
/*                                  Helpers                                   */
/* -------------------------------------------------------------------------- */

function getRegistryEntry(
  domain: string
): CrudRegistryEntry | null {
  return registry[domain] ?? null;
}

function handleApiError(error: unknown) {
  if (error instanceof ZodError) {
    return validationError(error);
  }

  if (
    error instanceof
    Prisma.PrismaClientKnownRequestError
  ) {
    return handlePrismaError(error);
  }

  return internalServerError(error);
}
/* -------------------------------------------------------------------------- */
/*                                GET BY ID                                   */
/* -------------------------------------------------------------------------- */

export async function handleGetById(
  _request: NextRequest,
  {
    params,
  }: {
    params: Promise<{
      domain: string;
      id: string;
    }>;
  }
) {
  try {
    const { domain, id } = await params;

    const invalid = validateObjectId(id);

    if (invalid) {
      return invalid;
    }

    const entry =
      getRegistryEntry(domain);

    if (!entry) {
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
      return notFound();
    }

    return ok(record);
  } catch (error) {
    return handleApiError(error);
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
  try {
    const { domain, id } =
      await params;

    const invalid =
      validateObjectId(id);

    if (invalid) {
      return invalid;
    }

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
      entry.updateSchema.parse(
        body
      );

    const record =
      await entry.model.update({
        where: { id },
        data,
      });

    return ok(
      record,
      "Resource updated successfully."
    );
  } catch (error) {
    return handleApiError(error);
  }
}

/* -------------------------------------------------------------------------- */
/*                                  DELETE                                    */
/* -------------------------------------------------------------------------- */

export async function handleDelete(
  _request: NextRequest,
  {
    params,
  }: {
    params: Promise<{
      domain: string;
      id: string;
    }>;
  }
) {
  try {
    const { domain, id } =
      await params;

    const invalid =
      validateObjectId(id);

    if (invalid) {
      return invalid;
    }

    const entry =
      getRegistryEntry(domain);

    if (!entry) {
      return notFound(
        "Unknown domain."
      );
    }

    await entry.model.delete({
      where: { id },
    });

    return noContent();
  } catch (error) {
    return handleApiError(error);
  }
}
