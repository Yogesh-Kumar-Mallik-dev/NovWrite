import test from "node:test";
import assert from "node:assert/strict";

import { NextRequest } from "next/server";

import {
  createRequestInfo,
  createResponseInfo,
} from "@/lib/logger/request";

/* -------------------------------------------------------------------------- */
/*                               Helpers                                      */
/* -------------------------------------------------------------------------- */

function createRequest(
  options?: {
    method?: string;
    path?: string;
    headers?: Record<string, string>;
  }
) {
  return new NextRequest(
    `http://localhost:3000${options?.path ?? "/api/test"}`,
    {
      method: options?.method ?? "GET",
      headers: options?.headers,
    }
  );
}

/* -------------------------------------------------------------------------- */
/*                            createRequestInfo                               */
/* -------------------------------------------------------------------------- */

test(
  "createRequestInfo builds request info",
  () => {
    const userAgent =
      "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36";

    const request = createRequest({
      method: "POST",
      path: "/api/v1/characters",
      headers: {
        "user-agent": userAgent,
        "x-forwarded-for":
          "127.0.0.1",
        origin:
          "http://localhost:3000",
      },
    });

    const info =
      createRequestInfo(request);

    assert.equal(
      info.method,
      "POST"
    );

    assert.equal(
      info.path,
      "/api/v1/characters"
    );

    assert.equal(
      info.ip,
      "127.0.0.1"
    );

    assert.equal(
      info.browser,
      "Chrome"
    );

    assert.equal(
      info.client,
      "Desktop"
    );

    assert.equal(
      info.source,
      "FRONTEND"
    );

    assert.equal(
      info.userAgent,
      userAgent
    );

    assert.equal(
      info.request,
      request
    );

    assert.equal(
      info.id.length,
      8
    );

    assert.ok(
      info.startedAt > 0
    );
  }
);

test(
  "createRequestInfo prefers x-forwarded-for over x-real-ip",
  () => {
    const info =
      createRequestInfo(
        createRequest({
          headers: {
            "x-forwarded-for":
              "1.1.1.1",
            "x-real-ip":
              "2.2.2.2",
          },
        })
      );

    assert.equal(
      info.ip,
      "1.1.1.1"
    );
  }
);

test(
  "createRequestInfo falls back to x-real-ip",
  () => {
    const request = createRequest({
      headers: {
        "x-real-ip":
          "192.168.1.1",
      },
    });

    const info =
      createRequestInfo(request);

    assert.equal(
      info.ip,
      "192.168.1.1"
    );
  }
);

test(
  "createRequestInfo falls back to Unknown ip",
  () => {
    const info =
      createRequestInfo(
        createRequest()
      );

    assert.equal(
      info.ip,
      "Unknown"
    );
  }
);

test(
  "createRequestInfo handles missing user agent",
  () => {
    const info =
      createRequestInfo(
        createRequest()
      );

    assert.equal(
      info.userAgent,
      ""
    );

    assert.equal(
      info.browser,
      "Unknown"
    );

    assert.equal(
      info.client,
      "Unknown"
    );
  }
);

test(
  "createRequestInfo detects API client",
  () => {
    const info =
      createRequestInfo(
        createRequest({
          headers: {
            "user-agent":
              "PostmanRuntime/7.43.0",
          },
        })
      );

    assert.equal(
      info.browser,
      "Postman"
    );

    assert.equal(
      info.client,
      "API Client"
    );

    assert.equal(
      info.source,
      "POSTMAN"
    );
  }
);

/* -------------------------------------------------------------------------- */
/*                           createResponseInfo                               */
/* -------------------------------------------------------------------------- */

test(
  "createResponseInfo builds response",
  () => {
    const request =
      createRequestInfo(
        createRequest()
      );

    const response =
      createResponseInfo(
        request,
        201,
        true,
        1024
      );

    assert.equal(
      response.status,
      201
    );

    assert.equal(
      response.success,
      true
    );

    assert.equal(
      response.size,
      1024
    );

    assert.ok(
      response.duration >= 0
    );
  }
);

test(
  "createResponseInfo supports responses without size",
  () => {
    const request =
      createRequestInfo(
        createRequest()
      );

    const response =
      createResponseInfo(
        request,
        404,
        false
      );

    assert.equal(
      response.status,
      404
    );

    assert.equal(
      response.success,
      false
    );

    assert.equal(
      response.size,
      undefined
    );

    assert.ok(
      response.duration >= 0
    );
  }
);
