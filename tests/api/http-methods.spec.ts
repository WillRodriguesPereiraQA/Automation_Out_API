import { expect, test } from './api-fixtures';

test.describe('HTTP methods — unsupported verbs', () => {
  test('rejects TRACE on a user resource', async ({ apiContext }) => {
    const response = await apiContext.fetch('users/2', { method: 'TRACE' });
    expect(response.status()).toBe(405);
    const contentType = response.headers()['content-type'] ?? '';
    expect(contentType).not.toContain('application/json');
  });

  test('returns a JSON content type for GET', async ({ apiContext }) => {
    const response = await apiContext.get('users/2');
    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toContain('application/json');
  });
});
