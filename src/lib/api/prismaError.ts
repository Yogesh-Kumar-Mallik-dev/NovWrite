import { Prisma } from "@prisma/client";

import {
  badRequest,
  conflict,
  internalServerError,
  notFound,
} from "./response";

export function handlePrismaError(
  error: Prisma.PrismaClientKnownRequestError
) {
  switch (error.code) {
    case "P2002":
      return conflict(
        "A resource with the same unique field already exists."
      );

    case "P2025":
      return notFound(
        "Requested resource was not found."
      );

    case "P2003":
      return badRequest(
        "Referenced resource does not exist."
      );

    case "P2014":
      return badRequest(
        "This operation would violate a required relation."
      );

    case "P2021":
      return internalServerError(
        error,
        "Database table not found."
      );

    case "P2022":
      return internalServerError(
        error,
        "Database column not found."
      );

    default:
      return internalServerError(error);
  }
}
