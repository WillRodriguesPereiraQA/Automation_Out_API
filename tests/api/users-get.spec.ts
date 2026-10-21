import { expect, test } from './api-fixtures';
import {
  emptyJsonSchema,
  userListResponseSchema,
  userResponseSchema,
} from './contracts/reqres-schemas';
import { expectJsonContract } from './helpers/response-assertions';

test.describe('Users — GET endpoints', () => {
  test('lists users on the first page', { tag: '@smoke' }, async ({ apiContext }) => {
    const response = await apiContext.get('users', { params: { page: 1 } });
    const body = await expectJsonContract(response, 200, userListResponseSchema);

    expect(body.page).toBe(1);
    expect(body.per_page).toBe(6);
    expect(body.total).toBe(12);
    expect(body.total_pages).toBe(2);
    expect(body.data).toHaveLength(body.per_page);
    expect(body.data[0]).toMatchObject({
      id: 1,
      email: 'george.bluth@reqres.in',
      first_name: 'George',
      last_name: 'Bluth',
    });
  });

  test('returns an empty page past the last page', async ({ apiContext }) => {
    const response = await apiContext.get('users', { params: { page: 99 } });
    const body = await expectJsonContract(response, 200, userListResponseSchema);

    expect(body.page).toBe(99);
    expect(body.total).toBe(12);
    expect(body.total_pages).toBe(2);
    expect(body.data).toEqual([]);
  });

  test('returns an existing user by id', { tag: '@smoke' }, async ({ apiContext }) => {
    const response = await apiContext.get('users/2');
    const body = await expectJsonContract(response, 200, userResponseSchema);

    expect(body.data).toMatchObject({
      id: 2,
      email: 'janet.weaver@reqres.in',
      first_name: 'Janet',
      last_name: 'Weaver',
    });
  });

  test('returns 404 for a user that does not exist', { tag: '@smoke' }, async ({
    apiContext,
  }) => {
    const response = await apiContext.get('users/999');
    await expectJsonContract(response, 404, emptyJsonSchema);
  });
});
