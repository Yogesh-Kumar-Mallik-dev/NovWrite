/* -------------------------------------------------------------------------- */
/*                                Public API                                  */
/* -------------------------------------------------------------------------- */

export { logger } from "./logger";

export {
  createRequestInfo,
  createResponseInfo,
  logRequest,
} from "./request";

export {
  logPrisma,
  logPrismaError,
} from "./prisma";

export { renderTree } from "./tree";

/* -------------------------------------------------------------------------- */
/*                                 Utilities                                  */
/* -------------------------------------------------------------------------- */

export {
  createRequestId,
  elapsed,
  now,
  timestamp,
} from "./utils";

/* -------------------------------------------------------------------------- */
/*                                  Types                                     */
/* -------------------------------------------------------------------------- */

export type {
  ApiLog,
  PrismaLog,
  RequestInfo,
  ResponseInfo,
  TreeNode,
  LogLevel,
  Browser,
  ClientType,
  RequestSource,
  OperatingSystem,
} from "./types";

export * from "./api"
