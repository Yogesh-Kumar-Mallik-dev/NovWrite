import { NextRequest } from "next/server";

type RateLimitEntry = {
    windowStart: number;
    tries: number;
};

export type RateLimitResult = {
    allowed: boolean;
    blocked: boolean;
    triesPerMinute: number;
    limitPerMinute: number;
    retryAfterSeconds: number;
};

const WINDOW_MS = 60_000;
const DEFAULT_LIMIT = 60;
const MAX_BUCKETS = 5_000;

const buckets = new Map<
    string,
    RateLimitEntry
>();

function getLimitPerMinute() {
    const value = Number(
        process.env.RATE_LIMIT_PER_MINUTE
    );

    if (
        Number.isFinite(value) &&
        value > 0
    ) {
        return Math.floor(value);
    }

    return DEFAULT_LIMIT;
}

function getClientIp(
    request: NextRequest
) {
    const forwarded =
        request.headers.get(
            "x-forwarded-for"
        ) ?? "";

    if (forwarded) {
        return forwarded
            .split(",")[0]
            .trim();
    }

    return (
        request.headers.get(
            "x-real-ip"
        ) ?? "Unknown"
    );
}

function cleanup(now: number) {
    if (buckets.size <= MAX_BUCKETS) {
        return;
    }

    for (const [key, entry] of buckets) {
        if (
            now - entry.windowStart >
            WINDOW_MS
        ) {
            buckets.delete(key);
        }
    }
}

export function checkRateLimit(
    request: NextRequest
): RateLimitResult {
    const now = Date.now();
    cleanup(now);

    const key = `${request.nextUrl.pathname}:${getClientIp(request)}`;

    const limitPerMinute =
        getLimitPerMinute();

    const current =
        buckets.get(key);

    if (
        !current ||
        now - current.windowStart >=
        WINDOW_MS
    ) {
        buckets.set(key, {
            windowStart: now,
            tries: 1,
        });

        return {
            allowed: true,
            blocked: false,
            triesPerMinute: 1,
            limitPerMinute,
            retryAfterSeconds: 0,
        };
    }

    current.tries += 1;

    const blocked =
        current.tries > limitPerMinute;

    const retryAfterSeconds = blocked
        ? Math.max(
            1,
            Math.ceil(
                (WINDOW_MS -
                    (now -
                        current.windowStart)) /
                1000
            )
        )
        : 0;

    return {
        allowed: !blocked,
        blocked,
        triesPerMinute:
            current.tries,
        limitPerMinute,
        retryAfterSeconds,
    };
}
