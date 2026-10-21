import { appendFileSync, existsSync, readFileSync } from 'node:fs';

const summaryPath = process.env.GITHUB_STEP_SUMMARY;
if (!summaryPath) {
  process.exit(0);
}

function readJsonResults() {
  const path = 'test-results/results.json';
  if (!existsSync(path)) return null;
  return JSON.parse(readFileSync(path, 'utf8'));
}

function readJUnitStats() {
  const path = 'test-results/junit.xml';
  if (!existsSync(path)) return null;

  const xml = readFileSync(path, 'utf8');
  const testsuite = xml.match(/<testsuite[^>]*>/);
  if (!testsuite) return null;

  const attr = (name) => {
    const match = testsuite[0].match(new RegExp(`${name}="([^"]*)"`));
    return match?.[1];
  };

  return {
    tests: attr('tests'),
    failures: attr('failures'),
    errors: attr('errors'),
    skipped: attr('skipped'),
    time: attr('time'),
  };
}

function statusIcon(spec) {
  const status =
    spec.ok === true
      ? 'passed'
      : spec.ok === false
        ? 'failed'
        : (spec.tests?.[0]?.results?.at(-1)?.status ?? 'unknown');
  if (status === 'passed') return '✅';
  if (status === 'failed') return '❌';
  if (status === 'skipped') return '⏭️';
  return '⚠️';
}

function appendSuiteTree(suites, lines, prefix = '') {
  for (const suite of suites ?? []) {
    const title = [prefix, suite.title].filter(Boolean).join(' › ');
    if (suite.specs?.length) {
      lines.push(`- **${title}**`);
      for (const spec of suite.specs) {
        lines.push(`  - ${statusIcon(spec)} ${spec.title}`);
      }
    }
    if (suite.suites?.length) {
      appendSuiteTree(suite.suites, lines, title);
    }
  }
}

const stats = readJUnitStats();
const report = readJsonResults();
const target =
  process.env.REQRES_MOCK === '1'
    ? 'Local ReqRes mock (CI default)'
    : 'Live https://reqres.in/api';
const suiteScope = process.env.API_SUITE === 'smoke' ? 'Smoke' : 'Full';

const lines = [
  '## API Tests CI — execution report',
  '',
  '| Field | Value |',
  '| --- | --- |',
  `| Workflow run | #${process.env.GITHUB_RUN_NUMBER ?? 'n/a'} (id ${process.env.GITHUB_RUN_ID ?? 'n/a'}) |`,
  `| Event | ${process.env.GITHUB_EVENT_NAME ?? 'n/a'} |`,
  `| Branch | ${process.env.GITHUB_REF_NAME ?? 'n/a'} |`,
  `| Commit | \`${(process.env.GITHUB_SHA ?? '').slice(0, 7)}\` |`,
  `| Target | ${target} |`,
  `| Suite | ${suiteScope} |`,
  '',
];

if (stats) {
  lines.push(
    '### Aggregated results (JUnit)',
    '',
    '| Metric | Count |',
    '| --- | ---: |',
    `| Total tests | ${stats.tests ?? '0'} |`,
    `| Failures | ${stats.failures ?? '0'} |`,
    `| Errors | ${stats.errors ?? '0'} |`,
    `| Skipped | ${stats.skipped ?? '0'} |`,
    `| Duration (s) | ${stats.time ?? 'n/a'} |`,
    ''
  );
}

if (report?.suites?.length) {
  lines.push('### Suites and scenarios', '');
  appendSuiteTree(report.suites, lines);
  lines.push('');
}

lines.push(
  '### Artifacts',
  '',
  '- **playwright-report-\\<run\\>**: HTML report (download from this workflow run).',
  '- **api-test-results-\\<run\\>**: `junit.xml` and `results.json` for integrations.',
  '',
  '### Local reproduction',
  '',
  '```bash',
  'npm ci',
  'npm run check          # typecheck + lint',
  'npm run test:api:mock  # full suite against the local mock',
  'npm run test:api:smoke # representative smoke against live reqres.in',
  '```',
  ''
);

appendFileSync(summaryPath, lines.join('\n'));
