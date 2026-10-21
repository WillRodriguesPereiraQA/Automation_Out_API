import { REQRES_VALID_LOGIN, expect, test } from './api-fixtures';
import { apiErrorSchema, invalidJsonErrorSchema } from './contracts/reqres-schemas';
import { expectJsonContract } from './helpers/response-assertions';

test.describe('Validation — malformed payloads and missing data', () => {
  test('rejects malformed JSON on login', async ({ apiContext }) => {
    const response = await apiContext.post('login', {
      data: '{ email: broken-json }',
    });
    await expectJsonContract(response, 400, invalidJsonErrorSchema);
  });

  test('rejects malformed JSON when creating a user', async ({ apiContext }) => {
    const response = await apiContext.post('users', {
      data: 'not-valid-json',
    });
    await expectJsonContract(response, 400, invalidJsonErrorSchema);
  });

  test('rejects an empty login body', async ({ apiContext }) => {
    const response = await apiContext.post('login', { data: {} });
    const body = await expectJsonContract(response, 400, apiErrorSchema);
    expect(body.error).toBe('Missing email or username');
  });

  test('rejects register when the email is missing', async ({ apiContext }) => {
    const response = await apiContext.post('register', {
      data: { password: REQRES_VALID_LOGIN.password },
    });
    const body = await expectJsonContract(response, 400, apiErrorSchema);
    expect(body.error).toBe('Missing email or username');
  });
});
