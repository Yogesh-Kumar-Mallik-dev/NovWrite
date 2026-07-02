import { NextRequest } from "next/server";

import { buildQuery } from "./query";
import {
  CrudRegistryEntry,
  registry,
} from "./registry";

import {
  created,
  internalServerError,
  notFound,
  ok,
} from "@/lib/api/response";

function getRegistryEntry(
  domain: string
): CrudRegistryEntry | null {
  return registry[domain] ?? null;
}

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

    const entry = getRegistryEntry(domain);

    if (!entry) {
      return notFound("Unknown domain.");
    }

    const query = buildQuery(
      request.nextUrl.searchParams,
      entry
    );

    const [data, total] = await Promise.all([
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
          Math.floor(query.skip / query.take) + 1,
        limit: query.take,
        pages: Math.ceil(total / query.take),
      },
    });
  } catch (error) {
    return internalServerError(error);
  }
}

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

    const entry = getRegistryEntry(domain);

    if (!entry) {
      return notFound("Unknown domain.");
    }

    const body = await request.json();

    const data =
      entry.createSchema.parse(body);

    const createdRecord =
      await entry.model.create({
        data,
      });

    return created(createdRecord);
  } catch (error) {
    return internalServerError(error);
  }
}
