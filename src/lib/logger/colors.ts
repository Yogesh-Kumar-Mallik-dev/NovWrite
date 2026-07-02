/* -------------------------------------------------------------------------- */
/*                               ANSI Colors                                  */
/* -------------------------------------------------------------------------- */

export const RESET = "\x1b[0m";

export const BOLD = "\x1b[1m";
export const DIM = "\x1b[2m";
export const ITALIC = "\x1b[3m";
export const UNDERLINE = "\x1b[4m";

/* -------------------------------------------------------------------------- */
/*                               Foreground                                   */
/* -------------------------------------------------------------------------- */

export const BLACK = "\x1b[30m";
export const RED = "\x1b[31m";
export const GREEN = "\x1b[32m";
export const YELLOW = "\x1b[33m";
export const BLUE = "\x1b[34m";
export const MAGENTA = "\x1b[35m";
export const CYAN = "\x1b[36m";
export const WHITE = "\x1b[37m";

export const BRIGHT_BLACK = "\x1b[90m";
export const BRIGHT_RED = "\x1b[91m";
export const BRIGHT_GREEN = "\x1b[92m";
export const BRIGHT_YELLOW = "\x1b[93m";
export const BRIGHT_BLUE = "\x1b[94m";
export const BRIGHT_MAGENTA = "\x1b[95m";
export const BRIGHT_CYAN = "\x1b[96m";
export const BRIGHT_WHITE = "\x1b[97m";

/* -------------------------------------------------------------------------- */
/*                               Background                                   */
/* -------------------------------------------------------------------------- */

export const BG_RED = "\x1b[41m";
export const BG_GREEN = "\x1b[42m";
export const BG_YELLOW = "\x1b[43m";
export const BG_BLUE = "\x1b[44m";
export const BG_MAGENTA = "\x1b[45m";
export const BG_CYAN = "\x1b[46m";

export const BG_BRIGHT_RED = "\x1b[101m";
export const BG_BRIGHT_GREEN = "\x1b[102m";
export const BG_BRIGHT_YELLOW = "\x1b[103m";
export const BG_BRIGHT_BLUE = "\x1b[104m";
export const BG_BRIGHT_MAGENTA = "\x1b[105m";
export const BG_BRIGHT_CYAN = "\x1b[106m";

/* -------------------------------------------------------------------------- */
/*                                  Helpers                                   */
/* -------------------------------------------------------------------------- */

export function color(
  text: string,
  ansi: string
) {
  return `${ansi}${text}${RESET}`;
}

export function bold(
  text: string
) {
  return `${BOLD}${text}${RESET}`;
}

export function dim(
  text: string
) {
  return `${DIM}${text}${RESET}`;
}

export function underline(
  text: string
) {
  return `${UNDERLINE}${text}${RESET}`;
}

export function background(
  text: string,
  ansi: string
) {
  return `${ansi}${text}${RESET}`;
}
