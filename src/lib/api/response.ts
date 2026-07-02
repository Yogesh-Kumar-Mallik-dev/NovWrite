import { NextResponse } from "next/server";

type ApiResponse<T = unknown> = {
  success: boolean;
  message: string;
  data?: T;
  errors?: unknown;
};

function response<T>(
  status: number,
  success: boolean,
  message: string,
  data?: T,
  errors?: unknown
) {
  return NextResponse.json<ApiResponse<T>>(
    {
      success,
      message,
      ...(data !== undefined && { data }),
      ...(errors !== undefined && { errors }),
    },
    { status }
  );
}

/* -------------------------------------------------------------------------- */
/*                                  Success                                   */
/* -------------------------------------------------------------------------- */

export const ok = <T>(
  data: T,
  message = "Request successful."
) => response(200, true, message, data);

export const created = <T>(
  data: T,
  message = "Resource created successfully."
) => response(201, true, message, data);

export const accepted = (
  message = "Request accepted."
) => response(202, true, message);

export const noContent = () =>
  new NextResponse(null, {
    status: 204,
  });

/* -------------------------------------------------------------------------- */
/*                             Client Errors                                  */
/* -------------------------------------------------------------------------- */

export const badRequest = (
  message = "Bad request.",
  errors?: unknown
) => response(400, false, message, undefined, errors);

export const unauthorized = (
  message = "Authentication required."
) => response(401, false, message);

export const forbidden = (
  message = "Access denied."
) => response(403, false, message);

export const notFound = (
  message = "Resource not found."
) => response(404, false, message);

export const methodNotAllowed = (
  message = "Method not allowed."
) => response(405, false, message);

export const conflict = (
  message = "Resource already exists."
) => response(409, false, message);

export const gone = (
  message = "Resource is no longer available."
) => response(410, false, message);

export const unprocessableEntity = (
  message = "Validation failed.",
  errors?: unknown
) =>
  response(
    422,
    false,
    message,
    undefined,
    errors
  );

export const tooManyRequests = (
  message = "Too many requests."
) => response(429, false, message);

/* -------------------------------------------------------------------------- */
/*                             Server Errors                                  */
/* -------------------------------------------------------------------------- */

export const internalServerError = (
  error?: unknown,
  message = "Internal server error."
) =>
  response(
    500,
    false,
    message,
    undefined,
    process.env.NODE_ENV === "development"
      ? error
      : undefined
  );

export const notImplemented = (
  message = "Not implemented."
) => response(501, false, message);

export const badGateway = (
  message = "Bad gateway."
) => response(502, false, message);

export const serviceUnavailable = (
  message = "Service unavailable."
) => response(503, false, message);

export const gatewayTimeout = (
  message = "Gateway timeout."
) => response(504, false, message);
