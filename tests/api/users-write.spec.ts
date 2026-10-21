import { expect, test, uniqueUserPayload } from './api-fixtures';
import {
  createdUserResponseSchema,
  updatedUserResponseSchema,
} from './contracts/reqres-schemas';
import {
  expectJsonContract,
  expectNoContent,
} from './helpers/response-assertions';

test.describe('Users — POST, PUT, DELETE', () => {
  test('creates a user', { tag: '@smoke' }, async ({ apiContext }) => {
    const payload = uniqueUserPayload();
    const response = await apiContext.post('users', { data: payload });
    const body = await expectJsonContract(response, 201, createdUserResponseSchema);

    expect(body.name).toBe(payload.name);
    expect(body.job).toBe(payload.job);
  });

  test('updates a user', { tag: '@smoke' }, async ({ apiContext }) => {
    const response = await apiContext.put('users/2', {
      data: { name: 'morpheus', job: 'zion resident' },
    });
    const body = await expectJsonContract(response, 200, updatedUserResponseSchema);

    expect(body.name).toBe('morpheus');
    expect(body.job).toBe('zion resident');
  });

  test('deletes a user', { tag: '@smoke' }, async ({ apiContext }) => {
    const response = await apiContext.delete('users/2');
    await expectNoContent(response);
  });
});
