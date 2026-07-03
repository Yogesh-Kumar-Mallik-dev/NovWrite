import { formatApiLog } from "./formatter";

import {
  ApiLog,
  LogLevel,
} from "./types";

import {
  DEFAULT_LOG_LEVEL,
  LOG_LEVEL_PRIORITY,
} from "./constants";

/* -------------------------------------------------------------------------- */
/*                              Logger Service                                */
/* -------------------------------------------------------------------------- */

export class Logger {
  private level: LogLevel;

  constructor(
    level: LogLevel = DEFAULT_LOG_LEVEL
  ) {
    const env =
      process.env.LOG_LEVEL?.toUpperCase();

    this.level =
      env &&
        env in LOG_LEVEL_PRIORITY
        ? (env as LogLevel)
        : level;
  }

  /* ---------------------------------------------------------------------- */
  /*                               Utilities                                */
  /* ---------------------------------------------------------------------- */

  private enabled(
    level: LogLevel
  ) {
    return (
      LOG_LEVEL_PRIORITY[level] >=
      LOG_LEVEL_PRIORITY[this.level]
    );
  }

  private write(
    level: LogLevel,
    log: Omit<ApiLog, "level">
  ) {
    if (!this.enabled(level)) {
      return;
    }

    console.log(
      formatApiLog({
        ...log,
        level,
      })
    );
  }

  /* ---------------------------------------------------------------------- */
  /*                               Log Levels                               */
  /* ---------------------------------------------------------------------- */

  trace(
    log: Omit<ApiLog, "level">
  ) {
    this.write(
      "TRACE",
      log
    );
  }

  debug(
    log: Omit<ApiLog, "level">
  ) {
    this.write(
      "DEBUG",
      log
    );
  }

  info(
    log: Omit<ApiLog, "level">
  ) {
    this.write(
      "INFO",
      log
    );
  }

  success(
    log: Omit<ApiLog, "level">
  ) {
    this.write(
      "SUCCESS",
      log
    );
  }

  warn(
    log: Omit<ApiLog, "level">
  ) {
    this.write(
      "WARN",
      log
    );
  }

  error(
    log: Omit<ApiLog, "level">
  ) {
    this.write(
      "ERROR",
      log
    );
  }

  fatal(
    log: Omit<ApiLog, "level">
  ) {
    this.write(
      "FATAL",
      log
    );
  }
}

/* -------------------------------------------------------------------------- */
/*                                Singleton                                   */
/* -------------------------------------------------------------------------- */

export const logger =
  new Logger();
