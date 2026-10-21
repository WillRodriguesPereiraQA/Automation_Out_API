import { z } from 'zod';

/**
 * Contract checks for the legacy ReqRes surface (`/api/users`, `/api/login`,
 * `/api/register`). Shapes follow the public OpenAPI components, with two
 * behaviors taken from the live API when the spec is looser or inaccurate:
 * - successful payloads may include extra `support` / `_meta` fields
 * - `GET /users/{id}` for an unknown id returns `{}` (not an error object)
 * Extra properties are allowed so the same schemas pass against the mock and
 * the hosted API.
 */

export const legacyUserSchema = z
  .object({
    id: z.number().int(),
    email: z.string().email(),
    first_name: z.string().min(1),
    last_name: z.string().min(1),
    avatar: z.string().url(),
  })
  .passthrough();

export const userListResponseSchema = z
  .object({
    page: z.number().int(),
    per_page: z.number().int().positive(),
    total: z.number().int().nonnegative(),
    total_pages: z.number().int().positive(),
    data: z.array(legacyUserSchema),
  })
  .passthrough();

export const userResponseSchema = z
  .object({
    data: legacyUserSchema,
  })
  .passthrough();

export const emptyJsonSchema = z.object({}).strict();

export const loginResponseSchema = z
  .object({
    token: z.string().min(1),
  })
  .passthrough();

export const registerResponseSchema = z
  .object({
    id: z.number().int(),
    token: z.string().min(1),
  })
  .passthrough();

export const createdUserResponseSchema = z
  .object({
    name: z.string(),
    job: z.string(),
    id: z.string().min(1),
    createdAt: z.string().datetime(),
  })
  .passthrough();

export const updatedUserResponseSchema = z
  .object({
    name: z.string(),
    job: z.string(),
    updatedAt: z.string().datetime(),
  })
  .passthrough();

export const apiErrorSchema = z
  .object({
    error: z.string().min(1),
  })
  .passthrough();

export const invalidJsonErrorSchema = z
  .object({
    error: z.literal('invalid_json'),
    message: z.string().min(1),
  })
  .passthrough();
