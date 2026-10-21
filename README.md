# Automation Out — API Tests (ReqRes)

Projeto de automação de testes de API com **Playwright** e **TypeScript**, usando a API de exemplo [ReqRes](https://reqres.in/) (`https://reqres.in/api`).  
Cobre cenários **positivos e negativos** (status, headers e corpo), métodos **GET, POST, PUT e DELETE**, e inclui pipeline **CI/CD no GitHub Actions**.

Repositório: [WillRodriguesPereiraQA/Automation_Out](https://github.com/WillRodriguesPereiraQA/Automation_Out)

---

## Estrutura do projeto

```
Automation_Out/
├── .github/workflows/
│   └── api-tests.yml          # Pipeline CI/CD (GitHub Actions)
├── tests/api/
│   ├── api-fixtures.ts        # Contexto HTTP, .env, credenciais ReqRes
│   ├── contracts/
│   │   └── reqres-schemas.ts  # Schemas Zod do contrato público
│   ├── helpers/
│   │   └── response-assertions.ts
│   ├── mock/
│   │   └── reqres-mock-server.ts   # Mock local alinhado à API pública
│   ├── auth.spec.ts           # Login e register (um teste por cenário)
│   ├── users-get.spec.ts      # GET list / detail / 404
│   ├── users-write.spec.ts    # POST, PUT, DELETE
│   ├── validation-negative.spec.ts
│   └── http-methods.spec.ts   # Ex.: TRACE → 405
├── scripts/
│   ├── run-mock-tests.mjs     # Roda testes contra o mock
│   └── ci-job-summary.mjs     # Resumo da execução no CI
├── global-setup.ts            # Sobe o mock quando REQRES_MOCK=1
├── global-teardown.ts
├── playwright.config.ts
├── package.json
├── tsconfig.json
└── .env.example
```

**Fluxo resumido:** cada cenário é um teste Playwright independente. Os specs usam a fixture `apiContext` → chamadas HTTP à ReqRes (ou ao mock em CI/offline) → status, headers e schema Zod em `response-assertions.ts`.

---

## Versões utilizadas

| Ferramenta | Versão |
|------------|--------|
| Node.js (recomendado) | **20.x** (CI usa 20) |
| npm | 10+ |
| @playwright/test | ^1.48.0 |
| TypeScript | ^5.5.0 |
| Zod | ^3.25 |
| ESLint | ^10 |

---

## Pré-requisitos e instalação

1. Instale o [Node.js 20 LTS](https://nodejs.org/).
2. Clone o repositório e entre na pasta do projeto:

```bash
git clone https://github.com/WillRodriguesPereiraQA/Automation_Out.git
cd Automation_Out
```

3. Instale as dependências:

```bash
npm ci
```

4. (Opcional) Variáveis de ambiente para API **live**:

```bash
copy .env.example .env   # Windows
# cp .env.example .env   # Linux/macOS
```

Edite o `.env` se precisar de outra URL, credenciais de login ou `REQRES_API_KEY` da sua conta [app.reqres.in](https://app.reqres.in).

---

## Como executar os testes

### Mock local (recomendado no dia a dia)

Evita limite de requisições da ReqRes e funciona offline. O mock repete o contrato público observado na API: página com 6 usuários e `avatar`, página fora do intervalo com `data` vazio, login de um usuário da base com qualquer senha não vazia, e os erros `user not found`, `Missing password`, `Missing email or username` e `invalid_json`.

```bash
npm run test:api:mock
```

### API ReqRes ao vivo

A suíte completa:

```bash
npm run test:api
```

Smoke representativo (leitura, login, um negativo de autenticação, register e ciclo de escrita). Use quando a API estiver disponível — o demo anônimo tem cota diária baixa por IP:

```bash
npm run test:api:smoke
```

Use credenciais válidas no `.env`. A ReqRes pode exigir header `x-api-key` e impõe limites diários por IP — se falhar com **429**, use o mock ou aguarde o reset do limite.

### Qualidade do código de automação

```bash
npm run check
```

Roda `typecheck` (`tsc --noEmit`) e `lint` (ESLint). O CI executa os dois antes da suíte.

### Comando usado no CI

```bash
set REQRES_MOCK=1    # Windows CMD
# export REQRES_MOCK=1   # Linux/macOS / Git Bash
npm run test:ci
```

---

## Relatório HTML (local)

Após qualquer execução que gere o report:

```bash
npm run report
```

Isso abre o relatório Playwright no navegador.  
O arquivo também fica em:

```
playwright-report/index.html
```

Abra esse `index.html` diretamente se preferir.

Em modo **CI** (`CI=true`), são gerados ainda:

- `test-results/junit.xml`
- `test-results/results.json`

---

## CI/CD (GitHub Actions)

### Quando roda

- **Push** nas branches `main` ou `master`
- **Pull request**
- **Manual:** Actions → **API Tests CI** → **Run workflow**

### O que o pipeline faz

1. `npm ci`
2. `npm run typecheck` e `npm run lint`
3. Suíte completa contra o **mock** (`REQRES_MOCK=1`), ou a suíte **smoke** contra a API real no disparo manual com target `live`
4. Publica resultados JUnit no check **ReqRes API Tests** — cada cenário é um teste separado
5. Gera **Summary** da run (run, branch, commit, suites)
6. Salva **artifacts** por 30 dias:
   - `playwright-report-<número>` — HTML
   - `api-test-results-<número>` — JUnit + JSON

### Onde ver o relatório no GitHub

1. Abra [Actions](https://github.com/WillRodriguesPereiraQA/Automation_Out/actions).
2. Clique em **API Tests CI** → última execução.
3. **Summary** — resumo em markdown.
4. **Artifacts** — baixe `playwright-report-*` e abra `index.html`.
5. No commit/PR — ícone de check **ReqRes API Tests**.

### Testes contra ReqRes live no CI (opcional)

1. No repositório: **Settings → Secrets and variables → Actions**
2. Crie o secret `REQRES_API_KEY` com sua chave da ReqRes
3. **Actions → API Tests CI → Run workflow** → target **live** (executa só os testes `@smoke`)

---

## Scripts npm

| Script | Descrição |
|--------|-----------|
| `npm test` | Todos os testes Playwright |
| `npm run test:api` | Suíte API completa contra ReqRes live |
| `npm run test:api:mock` | Suíte API completa contra mock local |
| `npm run test:api:smoke` | Smoke (`@smoke`) contra o alvo atual (live, ou mock se `REQRES_MOCK=1`) |
| `npm run test:ci` | Suíte completa usada pelo pipeline com mock |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint |
| `npm run check` | Typecheck e lint |
| `npm run report` | Abre o relatório HTML |
| `npm run install:browsers` | Só necessário se no futuro houver testes de UI |

---

