import {
  BOX,
  LEVEL_COLORS,
  METHOD_COLORS,
  getStatusColor,
} from "./constants";

import {
  bold,
  color,
} from "./colors";

import { ApiLog } from "./types";

import {
  formatDuration,
  padRight,
  terminalWidth,
  timestamp,
} from "./utils";

/* -------------------------------------------------------------------------- */
/*                                  Helpers                                   */
/* -------------------------------------------------------------------------- */

const WIDTH = Math.max(
  80,
  terminalWidth()
);

const INNER_WIDTH = WIDTH - 2;

const ANSI_PATTERN =
  /\x1B\[[0-?]*[ -/]*[@-~]/g;

function visibleLength(
  value: string
) {
  return value.replace(
    ANSI_PATTERN,
    ""
  ).length;
}

function fitVisible(
  value: string,
  width: number
) {
  const pad =
    width - visibleLength(value);

  if (pad <= 0) {
    return value;
  }

  return value + " ".repeat(pad);
}

function heapMemoryMb() {
  if (
    typeof process ===
    "undefined" ||
    !process.memoryUsage
  ) {
    return "N/A";
  }

  return `${(
    process.memoryUsage()
      .heapUsed /
    1024 /
    1024
  ).toFixed(2)} MB`;
}

function line(
  left: string,
  fill: string,
  right: string
) {
  return (
    left +
    fill.repeat(INNER_WIDTH) +
    right
  );
}

function row(
  key: string,
  value: string
) {
  const text =
    ` ${padRight(key, 11)}│ ${value}`;

  return (
    BOX.VERTICAL +
    fitVisible(
      text,
      INNER_WIDTH
    ) +
    BOX.VERTICAL
  );
}

function header(
  log: ApiLog
) {
  const method = color(
    padRight(
      log.request.method,
      7
    ),
    METHOD_COLORS[
    log.request.method
    ]
  );

  const level = color(
    padRight(
      log.level,
      9
    ),
    LEVEL_COLORS[log.level]
  );

  const requestId = bold(
    `[${log.request.id}]`
  );

  const path =
    log.request.path;

  const text =
    ` ${level} ${requestId} ${method} ${path}`;

  return (
    BOX.VERTICAL +
    fitVisible(
      text,
      INNER_WIDTH
    ) +
    BOX.VERTICAL
  );
}

function status(
  status: number
) {
  return color(
    `${status}`,
    getStatusColor(status)
  );
}

/* -------------------------------------------------------------------------- */
/*                                Formatter                                   */
/* -------------------------------------------------------------------------- */

export function formatApiLog(
  log: ApiLog
) {
  const rows: string[] = [];

  rows.push(
    line(
      BOX.TOP_LEFT,
      BOX.HORIZONTAL,
      BOX.TOP_RIGHT
    )
  );

  rows.push(header(log));

  rows.push(
    line(
      BOX.T_LEFT,
      BOX.HORIZONTAL,
      BOX.T_RIGHT
    )
  );

  rows.push(
    row(
      "Time",
      timestamp()
    )
  );

  rows.push(
    row(
      "Client",
      `${log.request.browser} (${log.request.client})`
    )
  );

  rows.push(
    row(
      "Source",
      log.request.source
    )
  );

  rows.push(
    row(
      "IP",
      log.request.ip
    )
  );

  if (log.registry) {
    rows.push(
      row(
        "Registry",
        log.registry
      )
    );
  }

  if (log.handler) {
    rows.push(
      row(
        "Handler",
        log.handler
      )
    );
  }

  if (log.operation) {
    rows.push(
      row(
        "Operation",
        log.operation
      )
    );
  }

  if (log.response) {
    rows.push(
      row(
        "Status",
        status(
          log.response.status
        )
      )
    );

    rows.push(
      row(
        "Duration",
        formatDuration(
          log.response
            .duration
        )
      )
    );
  }

  if (log.message) {
    rows.push(
      row(
        "Message",
        log.message
      )
    );
  }

  if (log.error) {
    rows.push(
      row(
        "Error",
        String(log.error)
      )
    );
  }

  rows.push(
    row(
      "Memory",
      heapMemoryMb()
    )
  );

  rows.push(
    line(
      BOX.BOTTOM_LEFT,
      BOX.HORIZONTAL,
      BOX.BOTTOM_RIGHT
    )
  );

  return rows.join("\n");
}
