import * as C from "./colors";

import {
  HttpMethod,
  LogLevel,
} from "./types";

/* -------------------------------------------------------------------------- */
/*                                 Log Level                                  */
/* -------------------------------------------------------------------------- */

export const LOG_LEVEL_PRIORITY: Record<
  LogLevel,
  number
> = {
  TRACE: 0,
  DEBUG: 1,
  INFO: 2,
  SUCCESS: 3,
  WARN: 4,
  ERROR: 5,
  FATAL: 6,
};

/* -------------------------------------------------------------------------- */
/*                               Level Colors                                 */
/* -------------------------------------------------------------------------- */

export const LEVEL_COLORS: Record<
  LogLevel,
  string
> = {
  TRACE: C.BRIGHT_BLACK,

  DEBUG: C.BRIGHT_CYAN,

  INFO: C.BRIGHT_BLUE,

  SUCCESS: C.BRIGHT_GREEN,

  WARN: C.BRIGHT_YELLOW,

  ERROR: C.BRIGHT_RED,

  FATAL: C.BG_RED + C.WHITE,
};

/* -------------------------------------------------------------------------- */
/*                              HTTP Methods                                  */
/* -------------------------------------------------------------------------- */

export const METHOD_COLORS: Record<
  HttpMethod,
  string
> = {
  GET: C.GREEN,

  POST: C.BLUE,

  PUT: C.MAGENTA,

  PATCH: C.YELLOW,

  DELETE: C.RED,

  OPTIONS: C.CYAN,

  HEAD: C.WHITE,
};

/* -------------------------------------------------------------------------- */
/*                               HTTP Status                                  */
/* -------------------------------------------------------------------------- */

export const STATUS_COLORS = {
  SUCCESS: C.BRIGHT_GREEN,

  REDIRECT: C.BRIGHT_CYAN,

  CLIENT_ERROR:
    C.BRIGHT_YELLOW,

  SERVER_ERROR:
    C.BRIGHT_RED,
};

export function getStatusColor(
  status: number
) {
  if (status >= 500) {
    return STATUS_COLORS.SERVER_ERROR;
  }

  if (status >= 400) {
    return STATUS_COLORS.CLIENT_ERROR;
  }

  if (status >= 300) {
    return STATUS_COLORS.REDIRECT;
  }

  return STATUS_COLORS.SUCCESS;
}

/* -------------------------------------------------------------------------- */
/*                                   Icons                                    */
/* -------------------------------------------------------------------------- */

export const ICONS = {
  REQUEST: "→",

  RESPONSE: "←",

  SUCCESS: "✓",

  ERROR: "✗",

  WARNING: "⚠",

  INFO: "ℹ",

  DEBUG: "🐞",

  DATABASE: "🗄",

  TIMER: "⏱",

  CLIENT: "🖥",

  SERVER: "🖧",

  ROUTE: "📍",

  HANDLER: "⚙",

  QUERY: "🔍",

  REGISTRY: "📚",

  PRISMA: "◆",

  TRACE: "├",

  LAST: "└",

  BRANCH: "│",
};

/* -------------------------------------------------------------------------- */
/*                             Box Drawing                                    */
/* -------------------------------------------------------------------------- */

export const BOX = {
  TOP_LEFT: "╭",

  TOP_RIGHT: "╮",

  BOTTOM_LEFT: "╰",

  BOTTOM_RIGHT: "╯",

  HORIZONTAL: "─",

  VERTICAL: "│",

  T_LEFT: "├",

  T_RIGHT: "┤",

  CROSS: "┼",
};

/* -------------------------------------------------------------------------- */
/*                            Default Settings                                */
/* -------------------------------------------------------------------------- */

export const DEFAULT_LOG_LEVEL: LogLevel =
  "INFO";

export const DEFAULT_BOX_WIDTH =
  72;

export const DEFAULT_INDENT =
  "  ";
