import { badRequest } from "./response";

const objectIdRegex =
  /^[a-f\d]{24}$/i;

export function validateObjectId(
  id: string
) {
  if (!objectIdRegex.test(id)) {
    return badRequest(
      "Invalid ObjectId."
    );
  }

  return null;
}
