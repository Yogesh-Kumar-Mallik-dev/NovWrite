import test from "node:test";
import assert from "node:assert/strict";

import { getPagination } from "@/lib/api/pagination";

function params(
  values: Record<string, string>
) {
  return new URLSearchParams(values);
}

test(
  "getPagination returns default pagination when no query parameters are provided",
  () => {
    const pagination =
      getPagination(
        new URLSearchParams()
      );

    assert.deepEqual(
      pagination,
      {
        page: 1,
        limit: 10,
        skip: 0,
      }
    );
  }
);

test(
  "getPagination calculates skip correctly for page two",
  () => {
    const pagination =
      getPagination(
        params({
          page: "2",
          limit: "10",
        })
      );

    assert.deepEqual(
      pagination,
      {
        page: 2,
        limit: 10,
        skip: 10,
      }
    );
  }
);

test(
  "getPagination calculates skip correctly for arbitrary page and limit",
  () => {
    const pagination =
      getPagination(
        params({
          page: "5",
          limit: "25",
        })
      );

    assert.deepEqual(
      pagination,
      {
        page: 5,
        limit: 25,
        skip: 100,
      }
    );
  }
);

test(
  "getPagination coerces numeric strings into numbers",
  () => {
    const pagination =
      getPagination(
        params({
          page: "3",
          limit: "15",
        })
      );

    assert.equal(
      typeof pagination.page,
      "number"
    );

    assert.equal(
      typeof pagination.limit,
      "number"
    );
  }
);

test(
  "getPagination rejects page values less than one",
  () => {
    assert.throws(() =>
      getPagination(
        params({
          page: "0",
        })
      )
    );
  }
);

test(
  "getPagination rejects limit values less than one",
  () => {
    assert.throws(() =>
      getPagination(
        params({
          limit: "0",
        })
      )
    );
  }
);

test(
  "getPagination rejects limit values greater than one hundred",
  () => {
    assert.throws(() =>
      getPagination(
        params({
          limit: "101",
        })
      )
    );
  }
);

test(
  "getPagination rejects non numeric page values",
  () => {
    assert.throws(() =>
      getPagination(
        params({
          page: "abc",
        })
      )
    );
  }
);

test(
  "getPagination rejects non numeric limit values",
  () => {
    assert.throws(() =>
      getPagination(
        params({
          limit: "xyz",
        })
      )
    );
  }
);
