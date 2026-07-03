import test from "node:test";
import assert from "node:assert/strict";

import { NextRequest } from "next/server";

import {
    ok,
    created,
    tooManyRequests,
    noContent,
} from "@/lib/api/response";
import { checkRateLimit } from "@/lib/api/rateLimit";

function requestFor(
    path: string,
    ip: string
) {
    return new NextRequest(
        `http://localhost${path}`,
        {
            headers: {
                "x-forwarded-for": ip,
            },
        }
    );
}

test("ok() returns stable API shape with status 200", async () => {
    const response = ok({
        data: [{ id: "1" }],
        pagination: {
            total: 1,
            page: 1,
            limit: 10,
            pages: 1,
        },
    });

    assert.equal(response.status, 200);

    const body = await response.json();

    assert.equal(body.success, true);
    assert.equal(body.message, "Request successful.");
    assert.deepEqual(body.data, [{ id: "1" }]);
    assert.deepEqual(body.pagination, {
        total: 1,
        page: 1,
        limit: 10,
        pages: 1,
    });
});

test("created() returns status 201 and payload", async () => {
    const response = created({
        id: "abc",
    });

    assert.equal(response.status, 201);

    const body = await response.json();

    assert.equal(body.success, true);
    assert.equal(
        body.message,
        "Resource created successfully."
    );
    assert.deepEqual(body.data, {
        id: "abc",
    });
});

test("tooManyRequests() returns status 429", async () => {
    const response = tooManyRequests(
        "Rate limit exceeded."
    );

    assert.equal(response.status, 429);

    const body = await response.json();

    assert.equal(body.success, false);
    assert.equal(
        body.message,
        "Rate limit exceeded."
    );
});

test("noContent() returns 204 with null body", async () => {
    const response = noContent();

    assert.equal(response.status, 204);

    const text = await response.text();
    assert.equal(text, "");
});

test("checkRateLimit allows until limit and then blocks", () => {
    const previous =
        process.env.RATE_LIMIT_PER_MINUTE;

    process.env.RATE_LIMIT_PER_MINUTE =
        "2";

    try {
        const path =
            "/api/v1/stability-limit";
        const ip =
            `10.0.0.${Math.floor(
                Math.random() * 200 + 1
            )}`;

        const first =
            checkRateLimit(
                requestFor(path, ip)
            );
        const second =
            checkRateLimit(
                requestFor(path, ip)
            );
        const third =
            checkRateLimit(
                requestFor(path, ip)
            );

        assert.equal(first.allowed, true);
        assert.equal(first.blocked, false);
        assert.equal(
            first.triesPerMinute,
            1
        );

        assert.equal(second.allowed, true);
        assert.equal(second.blocked, false);
        assert.equal(
            second.triesPerMinute,
            2
        );

        assert.equal(third.allowed, false);
        assert.equal(third.blocked, true);
        assert.equal(
            third.triesPerMinute,
            3
        );
        assert.ok(
            third.retryAfterSeconds >= 1
        );
    } finally {
        if (
            previous === undefined
        ) {
            delete process.env
                .RATE_LIMIT_PER_MINUTE;
        } else {
            process.env.RATE_LIMIT_PER_MINUTE =
                previous;
        }
    }
});
