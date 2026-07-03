import test from "node:test";
import assert from "node:assert/strict";

import { NextRequest } from "next/server";

import { detectSource } from "@/lib/logger/detectSource";

function createRequest(
  headers: Record<string, string>
) {
  return new NextRequest(
    "http://localhost:3000/api/test",
    {
      headers,
    }
  );
}

/* -------------------------------------------------------------------------- */
/*                               API Clients                                  */
/* -------------------------------------------------------------------------- */

test("detectSource detects Postman", () => {
  assert.equal(
    detectSource(
      createRequest({
        "user-agent":
          "PostmanRuntime/7.43.0",
      })
    ),
    "POSTMAN"
  );
});

test("detectSource detects Insomnia", () => {
  assert.equal(
    detectSource(
      createRequest({
        "user-agent":
          "Insomnia/2025.1",
      })
    ),
    "INSOMNIA"
  );
});

test("detectSource detects Thunder Client", () => {
  assert.equal(
    detectSource(
      createRequest({
        "user-agent":
          "Thunder Client",
      })
    ),
    "THUNDER_CLIENT"
  );

  assert.equal(
    detectSource(
      createRequest({
        "user-agent":
          "ThunderClient",
      })
    ),
    "THUNDER_CLIENT"
  );
});

test("detectSource detects curl", () => {
  assert.equal(
    detectSource(
      createRequest({
        "user-agent":
          "curl/8.5.0",
      })
    ),
    "CURL"
  );
});

/* -------------------------------------------------------------------------- */
/*                                Services                                    */
/* -------------------------------------------------------------------------- */

test("detectSource detects internal service", () => {
  assert.equal(
    detectSource(
      createRequest({
        "x-requested-with":
          "XMLHttpRequest",
      })
    ),
    "SERVICE"
  );
});

/* -------------------------------------------------------------------------- */
/*                                Frontend                                    */
/* -------------------------------------------------------------------------- */

test("detectSource detects frontend from localhost origin", () => {
  assert.equal(
    detectSource(
      createRequest({
        origin:
          "http://localhost:3000",
      })
    ),
    "FRONTEND"
  );
});

test("detectSource detects frontend from localhost referer", () => {
  assert.equal(
    detectSource(
      createRequest({
        referer:
          "http://localhost:3000/dashboard",
      })
    ),
    "FRONTEND"
  );
});

/* -------------------------------------------------------------------------- */
/*                                 Browser                                    */
/* -------------------------------------------------------------------------- */

test("detectSource detects browser from origin", () => {
  assert.equal(
    detectSource(
      createRequest({
        origin:
          "https://example.com",
      })
    ),
    "BROWSER"
  );
});

test("detectSource detects browser from referer", () => {
  assert.equal(
    detectSource(
      createRequest({
        referer:
          "https://example.com/page",
      })
    ),
    "BROWSER"
  );
});

/* -------------------------------------------------------------------------- */
/*                              Unknown                                       */
/* -------------------------------------------------------------------------- */

test("detectSource returns UNKNOWN", () => {
  assert.equal(
    detectSource(
      createRequest({})
    ),
    "UNKNOWN"
  );
});

/* -------------------------------------------------------------------------- */
/*                             Priority Order                                 */
/* -------------------------------------------------------------------------- */

test("API client has priority over frontend", () => {
  assert.equal(
    detectSource(
      createRequest({
        "user-agent":
          "PostmanRuntime/7.43.0",
        origin:
          "http://localhost:3000",
      })
    ),
    "POSTMAN"
  );
});

test("SERVICE has priority over browser", () => {
  assert.equal(
    detectSource(
      createRequest({
        "x-requested-with":
          "XMLHttpRequest",
        origin:
          "https://example.com",
      })
    ),
    "SERVICE"
  );
});
