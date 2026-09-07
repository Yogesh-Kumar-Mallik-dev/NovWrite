/**
 * @file projectEngine.ts
 * @description Pure functions for Novel Universe Project validation, ID generation, and template scaffolding.
 * Block Standard: BLOCK_WEB_PROJECT_ENGINE_001
 */

export interface ProjectData {
  id: string;
  name: string;
  description?: string;
  genre?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ValidateProjectResult {
  valid: boolean;
  errors: Record<string, string>;
  sanitized?: {
    name: string;
    description: string;
    genre: string;
  };
}

/**
 * Validates project creation and update inputs.
 */
export function validateProjectInput(input: {
  name?: string;
  description?: string;
  genre?: string;
}): ValidateProjectResult {
  const errors: Record<string, string> = {};
  const name = (input.name || "").trim();
  const description = (input.description || "").trim();
  const genre = (input.genre || "").trim() || "General Fiction";

  if (!name) {
    errors.name = "Project name is required and cannot be empty.";
  } else if (name.length > 255) {
    errors.name = "Project name cannot exceed 255 characters.";
  }

  if (description.length > 5000) {
    errors.description = "Project synopsis cannot exceed 5000 characters.";
  }

  if (genre.length > 100) {
    errors.genre = "Genre tag cannot exceed 100 characters.";
  }

  if (Object.keys(errors).length > 0) {
    return { valid: false, errors };
  }

  return {
    valid: true,
    errors: {},
    sanitized: {
      name,
      description,
      genre,
    },
  };
}

/**
 * Generates a unique, collision-resistant project ID with prefix.
 */
export function generateProjectId(): string {
  const timestamp = Date.now().toString(16);
  const rand = Math.random().toString(16).substring(2, 8);
  return `proj-${timestamp}-${rand}`;
}
