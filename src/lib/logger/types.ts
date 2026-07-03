import { NextRequest } from "next/server";

/* -------------------------------------------------------------------------- */
/*                                 Log Level                                  */
/* -------------------------------------------------------------------------- */

export type LogLevel =
  | "TRACE"
  | "DEBUG"
  | "INFO"
  | "SUCCESS"
  | "WARN"
  | "ERROR"
  | "FATAL";

/* -------------------------------------------------------------------------- */
/*                                HTTP Method                                 */
/* -------------------------------------------------------------------------- */

export type HttpMethod =
  | "GET"
  | "POST"
  | "PUT"
  | "PATCH"
  | "DELETE"
  | "OPTIONS"
  | "HEAD";

/* -------------------------------------------------------------------------- */
/*                              Request Source                                */
/* -------------------------------------------------------------------------- */

export type RequestSource =
  | "FRONTEND"
  | "ADMIN_PANEL"
  | "SERVICE"
  | "POSTMAN"
  | "INSOMNIA"
  | "THUNDER_CLIENT"
  | "CURL"
  | "BROWSER"
  | "UNKNOWN";

/* -------------------------------------------------------------------------- */
/*                               Client Device                                */
/* -------------------------------------------------------------------------- */

export type ClientType =
  | "Desktop"
  | "Mobile"
  | "Tablet"
  | "Bot"
  | "API Client"
  | "Server"
  | "Unknown";

/* -------------------------------------------------------------------------- */
/*                              Client Browser                                */
/* -------------------------------------------------------------------------- */

export type Browser =
  | "Chrome"
  | "Firefox"
  | "Safari"
  | "Edge"
  | "Opera"
  | "Brave"
  | "Postman"
  | "Insomnia"
  | "Thunder Client"
  | "curl"
  | "Unknown";

/* -------------------------------------------------------------------------- */
/*                                 Request                                    */
/* -------------------------------------------------------------------------- */

export interface RequestInfo {
  id: string;

  method: HttpMethod;

  path: string;

  ip: string;

  source: RequestSource;

  browser: Browser;

  client: ClientType;

  userAgent: string;

  startedAt: number;

  request: NextRequest;
}

/* -------------------------------------------------------------------------- */
/*                                  Response                                  */
/* -------------------------------------------------------------------------- */

export interface ResponseInfo {
  status: number;

  duration: number;

  success: boolean;

  size?: number;
}

/* -------------------------------------------------------------------------- */
/*                                 Tree Node                                  */
/* -------------------------------------------------------------------------- */

export interface TreeNode {
  label: string;

  children?: TreeNode[];
}

/* -------------------------------------------------------------------------- */
/*                                  API Log                                   */
/* -------------------------------------------------------------------------- */

export interface ApiLog {
  level: LogLevel;

  request: RequestInfo;

  response?: ResponseInfo;

  handler?: string;

  registry?: string;

  operation?: string;

  message?: string;

  triesPerMinute?: number;

  blocked?: boolean;

  error?: unknown;
}

/* -------------------------------------------------------------------------- */
/*                               Prisma Logging                               */
/* -------------------------------------------------------------------------- */

export interface PrismaLog {
  model: string;

  action: string;

  duration: number;

  rows?: number;

  query?: string;
}

/* -------------------------------------------------------------------------- */
/*                               Logger Options                               */
/* -------------------------------------------------------------------------- */

export interface LoggerOptions {
  colors: boolean;

  timestamps: boolean;

  level: LogLevel;

  pretty: boolean;

  trace: boolean;
}

export type OperatingSystem =
  | "Windows"
  | "Linux"
  | "macOS"
  | "Android"
  | "iOS"
  | "Unknown";
