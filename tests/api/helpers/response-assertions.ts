import { APIResponse, expect } from '@playwright/test';
import type { ZodType } from 'zod';

export async function expectJsonBody(
  response: APIResponse,
  expectedStatus: number,
): Promise<unknown> {
  expect(response.status(), 'HTTP status').toBe(expectedStatus);
  const contentType = response.headers()['content-type'] ?? '';
  expect(contentType, 'Content-Type header').toContain('application/json');
  return response.json() as Promise<unknown>;
}

export function expectSchema<T>(schema: ZodType<T>, data: unknown): T {
  const parsed = schema.safeParse(data);
  const details = parsed.success
    ? ''
    : parsed.error.issues
        .map((issue) => `${issue.path.join('.') || '(root)'}: ${issue.message}`)
        .join('\n');

  expect(parsed.success, `Schema validation failed:\n${details}`).toBe(true);
  if (!parsed.success) {
    throw new Error('Schema validation failed');
  }
  return parsed.data;
}

export async function expectJsonContract<T>(
  response: APIResponse,
  expectedStatus: number,
  schema: ZodType<T>,
): Promise<T> {
  const body = await expectJsonBody(response, expectedStatus);
  return expectSchema(schema, body);
}

export async function expectNoContent(response: APIResponse) {
  expect(response.status(), 'HTTP status').toBe(204);
  const body = await response.text();
  expect(body, 'response body').toBe('');
}
