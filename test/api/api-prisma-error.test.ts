import test from "node:test";
import assert from "node:assert/strict";

import { Prisma } from "@prisma/client";

import { handlePrismaError } from "@/lib/api/prismaError";

function createError(
  code: string
) {
  return new Prisma.PrismaClientKnownRequestError(
    "Test error",
    {
      code,
      clientVersion: "test",
    }
  );
}

async function body(
  response: Response
) {
  return response.json();
}

test(
  "handlePrismaError maps P2002 to conflict",
  async () => {
    const response =
      handlePrismaError(
        createError("P2002")
      );

    assert.equal(
      response.status,
      409
    );

    const json =
      await body(response);

    assert.equal(
      json.success,
      false
    );

    assert.equal(
      json.message,
      "A resource with the same unique field already exists."
    );
  }
);

test(
  "handlePrismaError maps P2025 to not found",
  async () => {
    const response =
      handlePrismaError(
        createError("P2025")
      );

    assert.equal(
      response.status,
      404
    );

    const json =
      await body(response);

    assert.equal(
      json.success,
      false
    );

    assert.equal(
      json.message,
      "Requested resource was not found."
    );
  }
);

test(
  "handlePrismaError maps P2003 to bad request",
  async () => {
    const response =
      handlePrismaError(
        createError("P2003")
      );

    assert.equal(
      response.status,
      400
    );

    const json =
      await body(response);

    assert.equal(
      json.success,
      false
    );

    assert.equal(
      json.message,
      "Referenced resource does not exist."
    );
  }
);

test(
  "handlePrismaError maps P2014 to bad request",
  async () => {
    const response =
      handlePrismaError(
        createError("P2014")
      );

    assert.equal(
      response.status,
      400
    );

    const json =
      await body(response);

    assert.equal(
      json.success,
      false
    );

    assert.equal(
      json.message,
      "This operation would violate a required relation."
    );
  }
);

test(
  "handlePrismaError maps P2021 to internal server error",
  async () => {
    const response =
      handlePrismaError(
        createError("P2021")
      );

    assert.equal(
      response.status,
      500
    );

    const json =
      await body(response);

    assert.equal(
      json.success,
      false
    );

    assert.equal(
      json.message,
      "Database table not found."
    );
  }
);

test(
  "handlePrismaError maps P2022 to internal server error",
  async () => {
    const response =
      handlePrismaError(
        createError("P2022")
      );

    assert.equal(
      response.status,
      500
    );

    const json =
      await body(response);

    assert.equal(
      json.success,
      false
    );

    assert.equal(
      json.message,
      "Database column not found."
    );
  }
);

test(
  "handlePrismaError maps unknown Prisma errors to internal server error",
  async () => {
    const response =
      handlePrismaError(
        createError("P9999")
      );

    assert.equal(
      response.status,
      500
    );

    const json =
      await body(response);

    assert.equal(
      json.success,
      false
    );

    assert.equal(
      json.message,
      "Internal server error."
    );
  }
);
