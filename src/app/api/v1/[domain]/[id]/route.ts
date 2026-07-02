import {
  handleDelete,
  handleGetById,
  handleUpdate,
} from "@/lib/api/crud.id";

export const GET = handleGetById;

export const PATCH = handleUpdate;

export const DELETE = handleDelete;
