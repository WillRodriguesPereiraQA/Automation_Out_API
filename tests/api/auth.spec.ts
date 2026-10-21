import { REQRES_VALID_LOGIN, expect, test } from './api-fixtures';
import {
  apiErrorSchema,
  loginResponseSchema,
  registerResponseSchema,
} from './contracts/reqres-schemas';
import { expectJsonContract } from './helpers/response-assertions';

test.describe('Authentication — POST /login and /register', () => {
  test('logs in with valid credentials', { tag: '@smoke' }, async ({ apiContext }) => {
    const response = await apiContext.post('login', {
      data: REQRES_VALID_LOGIN,
    });
    const body = await expectJsonContract(response, 200, loginResponseSchema);
    expect(body.token.length).toBeGreaterThan(0);
  });

  test('logs in a known demo user with a non-sample password', async ({ apiContext }) => {
    const response = await apiContext.post('login', {
      data: { email: 'janet.weaver@reqres.in', password: 'not-the-sample' },
    });
    await expectJsonContract(response, 200, loginResponseSchema);
  });

  test('rejects login for an unknown user', async ({ apiContext }) => {
    const response = await apiContext.post('login', {
      data: { email: 'unknown.user@example.com', password: 'wrong-password' },
    });
    const body = await expectJsonContract(response, 400, apiErrorSchema);
    expect(body.error).toBe('user not found');
  });

  test('rejects login when the password is missing', { tag: '@smoke' }, async ({
    apiContext,
  }) => {
    const response = await apiContext.post('login', {
      data: { email: REQRES_VALID_LOGIN.email },
    });
    const body = await expectJsonContract(response, 400, apiErrorSchema);
    expect(body.error).toBe('Missing password');
  });

  test('registers with email and password', { tag: '@smoke' }, async ({ apiContext }) => {
    const response = await apiContext.post('register', {
      data: REQRES_VALID_LOGIN,
    });
    const body = await expectJsonContract(response, 200, registerResponseSchema);
    expect(body.id).toBe(4);
  });

  test('rejects register when the password is missing', async ({ apiContext }) => {
    const response = await apiContext.post('register', {
      data: { email: REQRES_VALID_LOGIN.email },
    });
    const body = await expectJsonContract(response, 400, apiErrorSchema);
    expect(body.error).toBe('Missing password');
  });
});
