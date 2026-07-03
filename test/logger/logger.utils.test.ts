import test from "node:test";
import assert from "node:assert/strict";

import {
  capitalize,
  center,
  createRequestId,
  elapsed,
  formatBytes,
  formatDuration,
  horizontalLine,
  isDevelopment,
  now,
  padLeft,
  padRight,
  terminalWidth,
  truncate,
} from "@/lib/logger/utils";

/* -------------------------------------------------------------------------- */
/*                             Request ID                                     */
/* -------------------------------------------------------------------------- */

test("createRequestId returns 8 uppercase characters", () => {
  const id = createRequestId();

  assert.equal(id.length, 8);

  assert.match(id, /^[A-Z0-9]{8}$/);
});

test("createRequestId generates unique ids", () => {
  const ids = new Set(
    Array.from(
      { length: 100 },
      () => createRequestId()
    )
  );

  assert.equal(ids.size, 100);
});

/* -------------------------------------------------------------------------- */
/*                                Timer                                       */
/* -------------------------------------------------------------------------- */

test("now returns a number", () => {
  assert.equal(
    typeof now(),
    "number"
  );
});

test("elapsed returns non-negative duration", () => {
  const start = now();

  const duration = elapsed(start);

  assert.ok(duration >= 0);
});

/* -------------------------------------------------------------------------- */
/*                           String Helpers                                   */
/* -------------------------------------------------------------------------- */

test("padRight pads string", () => {
  assert.equal(
    padRight("abc", 5),
    "abc  "
  );
});

test("padLeft pads string", () => {
  assert.equal(
    padLeft("abc", 5),
    "  abc"
  );
});

test("center centers string", () => {
  assert.equal(
    center("Hi", 6),
    "  Hi  "
  );
});

test("center returns original when width is smaller", () => {
  assert.equal(
    center("Hello", 3),
    "Hello"
  );
});

test("truncate short strings unchanged", () => {
  assert.equal(
    truncate("Hello", 10),
    "Hello"
  );
});

test("truncate long strings", () => {
  assert.equal(
    truncate("Hello World", 8),
    "Hello..."
  );
});

test("capitalize capitalizes first letter", () => {
  assert.equal(
    capitalize("hello"),
    "Hello"
  );
});

test("capitalize preserves empty string", () => {
  assert.equal(
    capitalize(""),
    ""
  );
});

/* -------------------------------------------------------------------------- */
/*                         Duration Formatting                                */
/* -------------------------------------------------------------------------- */

test("formatDuration formats microseconds", () => {
  assert.equal(
    formatDuration(0.5),
    "500.00µs"
  );
});

test("formatDuration formats milliseconds", () => {
  assert.equal(
    formatDuration(15),
    "15.00ms"
  );
});

test("formatDuration formats seconds", () => {
  assert.equal(
    formatDuration(2500),
    "2.50s"
  );
});

/* -------------------------------------------------------------------------- */
/*                          Byte Formatting                                   */
/* -------------------------------------------------------------------------- */

test("formatBytes formats bytes", () => {
  assert.equal(
    formatBytes(512),
    "512 B"
  );
});

test("formatBytes formats kilobytes", () => {
  assert.equal(
    formatBytes(2048),
    "2.00 KB"
  );
});

test("formatBytes formats megabytes", () => {
  assert.equal(
    formatBytes(
      5 * 1024 * 1024
    ),
    "5.00 MB"
  );
});

/* -------------------------------------------------------------------------- */
/*                          Terminal Helpers                                  */
/* -------------------------------------------------------------------------- */

test("terminalWidth returns positive width", () => {
  assert.ok(
    terminalWidth() > 0
  );
});

test("horizontalLine uses requested width", () => {
  assert.equal(
    horizontalLine(5),
    "─────"
  );
});

test("horizontalLine supports custom characters", () => {
  assert.equal(
    horizontalLine(4, "="),
    "===="
  );
});


