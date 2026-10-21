import { createServer, IncomingMessage, Server, ServerResponse } from 'http';

/**
 * Local stand-in for the legacy ReqRes API (https://reqres.in/api).
 *
 * Behaviors below were checked against the hosted API and its OpenAPI
 * document. The mock does not add rules that only exist here:
 * - known demo users log in with any non-empty password (the password is not
 *   matched against a single sample value)
 * - there is no bearer-token check on `/api/login`
 * - error codes use the hosted strings (`user not found`, `Missing password`,
 *   `Missing email or username`, `invalid_json`)
 *
 * Promotional `_meta` blocks from the hosted responses are omitted. TRACE is
 * rejected with 405 and a non-JSON body, which is the status the public edge
 * returns; the HTML page itself comes from the CDN and is not copied.
 * `x-api-key` is not required: the anonymous demo accepts calls without it
 * until the daily quota. Live runs still send the key from the test fixture.
 */

type DemoUser = {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  avatar: string;
};

const DEMO_USER_ROWS = [
  ['George', 'Bluth', 'george.bluth'],
  ['Janet', 'Weaver', 'janet.weaver'],
  ['Emma', 'Wong', 'emma.wong'],
  ['Eve', 'Holt', 'eve.holt'],
  ['Charles', 'Morris', 'charles.morris'],
  ['Tracey', 'Ramos', 'tracey.ramos'],
  ['Michael', 'Lawson', 'michael.lawson'],
  ['Lindsay', 'Ferguson', 'lindsay.ferguson'],
  ['Tobias', 'Funke', 'tobias.funke'],
  ['Byron', 'Fields', 'byron.fields'],
  ['George', 'Edwards', 'george.edwards'],
  ['Rachel', 'Howell', 'rachel.howell'],
] as const;

const USERS: DemoUser[] = DEMO_USER_ROWS.map(([firstName, lastName, localPart], index) => {
  const id = index + 1;
  return {
    id,
    email: `${localPart}@reqres.in`,
    first_name: firstName,
    last_name: lastName,
    avatar: `https://reqres.in/img/faces/${id}-image.jpg`,
  };
});

const SUPPORT = {
  url: 'https://reqres.in/#support-heading',
  text: 'To keep ReqRes free, contributions towards server costs are appreciated!',
};

const INVALID_JSON_MESSAGE = 'The request body contains invalid JSON.';

type ParsedBody =
  | { kind: 'empty' }
  | { kind: 'invalid' }
  | { kind: 'json'; value: unknown };

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk: Buffer) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

async function parseBody(req: IncomingMessage): Promise<ParsedBody> {
  const raw = await readBody(req);
  if (raw.trim() === '') return { kind: 'empty' };
  try {
    return { kind: 'json', value: JSON.parse(raw) as unknown };
  } catch {
    return { kind: 'invalid' };
  }
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return null;
}

function stringField(record: Record<string, unknown>, key: string): string {
  const value = record[key];
  return typeof value === 'string' ? value : '';
}

function positiveInt(value: string | null, fallback: number, max?: number): number {
  if (value === null || value.trim() === '') return fallback;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) return fallback;
  return max === undefined ? parsed : Math.min(parsed, max);
}

function sendJson(res: ServerResponse, status: number, body: unknown) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(body));
}

function sendError(res: ServerResponse, status: number, error: string, message?: string) {
  sendJson(res, status, message === undefined ? { error } : { error, message });
}

function sendInvalidJson(res: ServerResponse) {
  sendError(res, 400, 'invalid_json', INVALID_JSON_MESSAGE);
}

function userById(id: number): DemoUser | undefined {
  return USERS.find((user) => user.id === id);
}

function listUsers(page: number, perPage: number) {
  const start = (page - 1) * perPage;
  return {
    page,
    per_page: perPage,
    total: USERS.length,
    total_pages: Math.ceil(USERS.length / perPage),
    data: start >= USERS.length ? [] : USERS.slice(start, start + perPage),
    support: SUPPORT,
  };
}

async function handleLogin(req: IncomingMessage, res: ServerResponse) {
  const parsed = await parseBody(req);
  if (parsed.kind === 'invalid') {
    sendInvalidJson(res);
    return;
  }

  const record = parsed.kind === 'json' ? asRecord(parsed.value) : {};
  if (!record) {
    sendInvalidJson(res);
    return;
  }

  const email = stringField(record, 'email');
  const password = stringField(record, 'password');
  if (!email) {
    sendError(res, 400, 'Missing email or username');
    return;
  }
  if (!password) {
    sendError(res, 400, 'Missing password');
    return;
  }

  const user = USERS.find((candidate) => candidate.email === email);
  if (!user) {
    sendError(res, 400, 'user not found');
    return;
  }

  sendJson(res, 200, { token: `QpwL5tke4Pnpja7X${user.id}` });
}

async function handleRegister(req: IncomingMessage, res: ServerResponse) {
  const parsed = await parseBody(req);
  if (parsed.kind === 'invalid') {
    sendInvalidJson(res);
    return;
  }

  const record = parsed.kind === 'json' ? asRecord(parsed.value) : {};
  if (!record) {
    sendInvalidJson(res);
    return;
  }

  if (!stringField(record, 'email')) {
    sendError(res, 400, 'Missing email or username');
    return;
  }
  if (!stringField(record, 'password')) {
    sendError(res, 400, 'Missing password');
    return;
  }

  sendJson(res, 200, { id: 4, token: 'QpwL5tke4Pnpja7X4' });
}

async function handleCreateUser(req: IncomingMessage, res: ServerResponse) {
  const parsed = await parseBody(req);
  if (parsed.kind === 'invalid') {
    sendInvalidJson(res);
    return;
  }
  if (parsed.kind === 'empty') {
    sendError(res, 400, 'Empty request body', 'Request body cannot be empty for JSON endpoints');
    return;
  }

  const record = asRecord(parsed.value);
  if (!record) {
    sendInvalidJson(res);
    return;
  }

  sendJson(res, 201, {
    ...record,
    id: String(900 + (Date.now() % 100)),
    createdAt: new Date().toISOString(),
  });
}

async function handleUpdateUser(req: IncomingMessage, res: ServerResponse) {
  const parsed = await parseBody(req);
  if (parsed.kind !== 'json') {
    sendInvalidJson(res);
    return;
  }

  const record = asRecord(parsed.value);
  if (!record) {
    sendInvalidJson(res);
    return;
  }

  sendJson(res, 200, {
    ...record,
    updatedAt: new Date().toISOString(),
  });
}

async function handleRequest(req: IncomingMessage, res: ServerResponse) {
  const url = new URL(req.url ?? '/', 'http://127.0.0.1');
  const path = url.pathname.replace(/\/$/, '') || '/';
  const method = req.method ?? 'GET';

  if (method === 'TRACE') {
    res.writeHead(405);
    res.end();
    return;
  }

  if (method === 'GET' && path === '/api/users') {
    const page = positiveInt(url.searchParams.get('page'), 1);
    const perPage = positiveInt(url.searchParams.get('per_page'), 6, 100);
    sendJson(res, 200, listUsers(page, perPage));
    return;
  }

  const userMatch = path.match(/^\/api\/users\/(\d+)$/);
  if (userMatch) {
    const id = Number(userMatch[1]);

    if (method === 'GET') {
      const user = userById(id);
      if (!user) {
        sendJson(res, 404, {});
        return;
      }
      sendJson(res, 200, { data: user, support: SUPPORT });
      return;
    }

    if (method === 'PUT') {
      await handleUpdateUser(req, res);
      return;
    }

    if (method === 'DELETE') {
      res.writeHead(204);
      res.end();
      return;
    }
  }

  if (method === 'POST' && path === '/api/login') {
    await handleLogin(req, res);
    return;
  }

  if (method === 'POST' && path === '/api/register') {
    await handleRegister(req, res);
    return;
  }

  if (method === 'POST' && path === '/api/users') {
    await handleCreateUser(req, res);
    return;
  }

  sendJson(res, 404, {});
}

export function startReqresMockServer(port: number): Promise<Server> {
  return new Promise((resolve, reject) => {
    const server = createServer((req, res) => {
      void handleRequest(req, res).catch(() => {
        if (!res.headersSent) {
          sendJson(res, 500, { error: 'internal_error' });
        }
      });
    });
    server.once('error', reject);
    server.listen(port, '127.0.0.1', () => resolve(server));
  });
}
