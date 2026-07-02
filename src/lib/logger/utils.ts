import { DEFAULT_BOX_WIDTH } from "./constants";

/* -------------------------------------------------------------------------- */
/*                               Request ID                                   */
/* -------------------------------------------------------------------------- */

export function createRequestId() {
  const id =
    globalThis.crypto?.randomUUID?.() ??
    `${Date.now()}${Math.random()}`;

  return id
    .replace(/-/g, "")
    .slice(0, 8)
    .toUpperCase();
}

/* -------------------------------------------------------------------------- */
/*                                   Timer                                    */
/* -------------------------------------------------------------------------- */

export function now() {
  return performance.now();
}

export function elapsed(
  startedAt: number
) {
  return performance.now() - startedAt;
}

/* -------------------------------------------------------------------------- */
/*                              Date & Time                                   */
/* -------------------------------------------------------------------------- */

export function timestamp() {
  return new Date().toLocaleString(
    "en-IN",
    {
      hour12: false,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }
  );
}

/* -------------------------------------------------------------------------- */
/*                              String Helpers                                */
/* -------------------------------------------------------------------------- */

export function padRight(
  value: string,
  length: number
) {
  return value.padEnd(length);
}

export function padLeft(
  value: string,
  length: number
) {
  return value.padStart(length);
}

export function center(
  value: string,
  width: number
) {
  const padding = Math.max(
    0,
    width - value.length
  );

  const left = Math.floor(
    padding / 2
  );

  const right =
    padding - left;

  return (
    " ".repeat(left) +
    value +
    " ".repeat(right)
  );
}

export function truncate(
  value: string,
  maxLength: number
) {
  if (
    value.length <= maxLength
  ) {
    return value;
  }

  return (
    value.slice(
      0,
      maxLength - 3
    ) + "..."
  );
}

/* -------------------------------------------------------------------------- */
/*                              Time Formatting                               */
/* -------------------------------------------------------------------------- */

export function formatDuration(
  ms: number
) {
  if (ms < 1) {
    return `${(
      ms * 1000
    ).toFixed(2)}µs`;
  }

  if (ms < 1000) {
    return `${ms.toFixed(
      2
    )}ms`;
  }

  return `${(
    ms / 1000
  ).toFixed(2)}s`;
}

/* -------------------------------------------------------------------------- */
/*                              Byte Formatting                               */
/* -------------------------------------------------------------------------- */

export function formatBytes(
  bytes: number
) {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(
      bytes / 1024
    ).toFixed(2)} KB`;
  }

  return `${(
    bytes /
    1024 /
    1024
  ).toFixed(2)} MB`;
}

/* -------------------------------------------------------------------------- */
/*                             Terminal Helpers                               */
/* -------------------------------------------------------------------------- */

export function terminalWidth() {
  if (
    typeof process ===
    "undefined"
  ) {
    return DEFAULT_BOX_WIDTH;
  }

  return (
    process.stdout.columns ??
    DEFAULT_BOX_WIDTH
  );
}

export function horizontalLine(
  width = terminalWidth(),
  character = "─"
) {
  return character.repeat(width);
}

/* -------------------------------------------------------------------------- */
/*                                Misc Helpers                                */
/* -------------------------------------------------------------------------- */

export function capitalize(
  value: string
) {
  if (!value.length) {
    return value;
  }

  return (
    value[0].toUpperCase() +
    value.slice(1)
  );
}

export function isDevelopment() {
  return (
    process.env.NODE_ENV ===
    "development"
  );
}
