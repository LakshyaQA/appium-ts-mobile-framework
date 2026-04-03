/**
 * © 2026 Lakshya Sharma (LakshyaQA)
 * Repository: https://github.com/LakshyaQA/appium-ts-mobile-framework
 *
 * PROPRIETARY & CONFIDENTIAL:
 * Unauthorized cloning, modification, or distribution of this Software,
 * in whole or in part, via any medium is strictly prohibited.
 *
 * All rights reserved by Lakshya Sharma.
 */

// @ts-nocheck
/**
 * Custom WDIO reporter — clean, human-readable test output.
 *
 * Per-test:
 *   ▶  Test name (shown when test starts)
 *   ✔ PASS / ✘ FAIL / ○ SKIP  with duration and error summary
 *
 * Final summary:
 *   ══════════════════════════
 *   Test Summary    Duration: 12s
 *   Platform: Android 16.0 on emulator-5554
 *   ══════════════════════════
 *   App Feature Flow
 *     ✔ PASS  Should navigate... (3.2s)
 *   ══════════════════════════
 *    PASSED   1 passed, 0 failed  |  Total: 1
 *
 * Also writes a plain-text copy to logs/spec-summary.txt
 */
import WDIOReporter from '@wdio/reporter';
import fs from 'node:fs';
import path from 'node:path';

// ── ANSI colours ──────────────────────────────────────────────
const C = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  bgGreen: '\x1b[42m',
  bgRed: '\x1b[41m',
  black: '\x1b[30m',
  white: '\x1b[37m',
};
const stripAnsi = (s) => s.replace(/\x1b\[[0-9;]*m/g, '');

// ── Selector prettifier ───────────────────────────────────────
export function friendlyLocator(selector) {
  if (!selector || selector === '<element>') return 'element';
  const s = String(selector);
  const norm = s.match(/normalize-space\(@text\)\s*=\s*['"]([^'"]+)['"]/);
  if (norm) return `"${norm[1]}"`;
  const txt = s.match(/@text\s*=\s*['"]([^'"]+)['"]/);
  if (txt) return `"${txt[1]}"`;
  const desc = s.match(/@content-desc\s*=\s*['"]([^'"]+)['"]/);
  if (desc) return `"${desc[1]}"`;
  const resId = s.match(/@resource-id=['"][^/'"]*\/([^'"]+)['"]/);
  if (resId) return `id:${resId[1]}`;
  const accId = s.match(/^~(.+)$/);
  if (accId) return `"${accId[1]}"`;
  return s.length > 60 ? s.slice(0, 57) + '...' : s;
}

// ── Error classifier ─────────────────────────────────────────
function classifyError(err) {
  const msg = err?.message || String(err || '');
  if (!msg) return { type: 'Error', detail: 'Unknown error' };

  if (/timed? ?out|timeout|waitFor/i.test(msg)) {
    const sel = msg.match(/selector=['"]([^'"]+)['"]/)?.[1] || msg.match(/for element[^"]*"([^"]+)"/)?.[1];
    const loc = sel ? friendlyLocator(sel) : 'element';
    return { type: 'Timeout', detail: `Element not visible: ${loc}` };
  }
  if (/Expected|expected|Received|received/.test(msg)) {
    const exp = msg.match(/Expected:?\s*["']?([^\n"']+)/)?.[1]?.trim();
    const got = msg.match(/Received:?\s*["']?([^\n"']+)/)?.[1]?.trim();
    return { type: 'Assertion', detail: `Expected: ${exp || '?'} | Got: ${got || '?'}` };
  }
  const first = msg
    .split('\n')
    .find((l) => l.trim())
    .trim();
  return { type: 'Error', detail: first.slice(0, 150) };
}

// ── Reporter ──────────────────────────────────────────────────
export default class SpecSummaryReporter extends WDIOReporter {
  _startedAt = Date.now();
  _cases = [];
  _suite = '';
  _liveLines = [];

  constructor(options) {
    super({ ...options, stdout: true });
  }

  onSuiteStart(suite) {
    if (suite.title) this._suite = suite.title;
  }

  onTestStart(test) {
    const line = `\n  ${C.cyan}▶${C.reset}  ${C.bold}${test.title}${C.reset}`;
    process.stdout.write(line + '\n');
    this._liveLines.push(stripAnsi(line));
  }

  onTestEnd(test) {
    const passed = test.state === 'passed';
    const skipped = test.state === 'skipped' || test.state === 'pending';
    const failed = !passed && !skipped;
    const durS = ((test.duration || 0) / 1000).toFixed(1);

    const icon = failed
      ? `${C.bgRed}${C.white}${C.bold} FAIL ${C.reset}`
      : skipped
        ? `${C.yellow}○ SKIP${C.reset}`
        : `${C.bgGreen}${C.black}${C.bold} PASS ${C.reset}`;

    let errType, errDetail;
    const err = test.error || test.errors?.[0];
    if (failed && err) {
      const c = classifyError(err);
      errType = c.type;
      errDetail = c.detail;
    }

    this._cases.push({
      title: test.title,
      suite: this._suite,
      state: test.state,
      durationMs: test.duration || 0,
      errType,
      errDetail,
    });

    const line = `  ${icon}  ${test.title} ${C.dim}(${durS}s)${C.reset}`;
    process.stdout.write(line + '\n');
    this._liveLines.push(stripAnsi(line));
    if (failed && errType) {
      const errLine = `        ${C.red}${errType}: ${errDetail}${C.reset}`;
      process.stdout.write(errLine + '\n');
      this._liveLines.push(stripAnsi(errLine));
    }
  }

  onRunnerEnd(runner) {
    const totalMs = Date.now() - this._startedAt;
    const caps = runner.capabilities || {};

    // Platform info
    const platform = caps.platformName || '';
    const version =
      caps['appium:platformVersion'] || caps.platformVersion || caps['bstack:options']?.osVersion || '';
    const device = caps['appium:deviceName'] || caps.deviceName || caps['bstack:options']?.deviceName || '';
    const specBase = (runner.specs || []).map((s) => path.basename(s)).join(', ');

    const HR = `${C.bold}${'═'.repeat(60)}${C.reset}`;
    const lines = ['', HR];

    lines.push(
      `${C.bold}  Test Summary${C.reset}   ${C.dim}Duration: ${Math.round(totalMs / 1000)}s${C.reset}`,
    );
    if (platform)
      lines.push(
        `  ${C.dim}Platform: ${platform}${version ? ` ${version}` : ''}${device ? ` on ${device}` : ''}${C.reset}`,
      );
    if (specBase) lines.push(`  ${C.dim}Spec: ${specBase}${C.reset}`);
    lines.push(HR, '');

    // Group by suite
    const bySuite = new Map();
    for (const r of this._cases) {
      const k = r.suite || 'Tests';
      if (!bySuite.has(k)) bySuite.set(k, []);
      bySuite.get(k).push(r);
    }
    for (const [suite, cases] of bySuite) {
      lines.push(`  ${C.cyan}${C.bold}${suite}${C.reset}`);
      for (const r of cases) {
        const p = r.state === 'passed';
        const s = r.state === 'skipped' || r.state === 'pending';
        const f = !p && !s;
        const icon = f
          ? `${C.red}✘ FAIL${C.reset}`
          : s
            ? `${C.yellow}○ SKIP${C.reset}`
            : `${C.green}✔ PASS${C.reset}`;
        lines.push(`    ${icon}  ${r.title} ${C.dim}(${(r.durationMs / 1000).toFixed(1)}s)${C.reset}`);
        if (f && r.errType) lines.push(`           ${C.red}${r.errType}: ${r.errDetail}${C.reset}`);
      }
      lines.push('');
    }

    const total = this._cases.length;
    const passed = this._cases.filter((r) => r.state === 'passed').length;
    const failed = this._cases.filter(
      (r) => r.state !== 'passed' && r.state !== 'skipped' && r.state !== 'pending',
    ).length;
    const skipped = total - passed - failed;

    const badge =
      failed > 0
        ? `${C.bgRed}${C.white}${C.bold} FAILED ${C.reset}`
        : `${C.bgGreen}${C.black}${C.bold} PASSED ${C.reset}`;
    const passStr =
      passed > 0 ? `${C.green}${passed} passed${C.reset}` : `${C.dim}${passed} passed${C.reset}`;
    const failStr = failed > 0 ? `${C.red}${failed} failed${C.reset}` : `${C.dim}${failed} failed${C.reset}`;
    const skipStr =
      skipped > 0 ? `${C.yellow}${skipped} skipped${C.reset}` : `${C.dim}${skipped} skipped${C.reset}`;

    lines.push(`  ${badge}  ${passStr}, ${failStr}, ${skipStr}  ${C.dim}|  Total: ${total}${C.reset}`);
    lines.push(HR, '');

    process.stdout.write(lines.join('\n'));

    // Write plain-text copy to logs with timestamp
    try {
      const isLocal = String(process.env.LOCAL_APPIUM || '').toLowerCase() === 'true';
      const folderName = isLocal ? 'locallogs' : 'bslogs';

      const now = new Date();
      const timestamp =
        now.getFullYear() +
        '-' +
        String(now.getMonth() + 1).padStart(2, '0') +
        '-' +
        String(now.getDate()).padStart(2, '0') +
        '_' +
        String(now.getHours()).padStart(2, '0') +
        '-' +
        String(now.getMinutes()).padStart(2, '0') +
        '-' +
        String(now.getSeconds()).padStart(2, '0');

      const fileName = `run_${timestamp}.txt`;

      const outFile =
        process.env.SPEC_SUMMARY_FILE?.trim() || path.resolve(process.cwd(), 'logs', folderName, fileName);
      const dir = path.dirname(outFile);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

      const plain =
        `Execution Time: ${now.toLocaleString()}\n` +
        `Environment: ${isLocal ? 'Local Emulator' : 'BrowserStack'}\n` +
        `${'='.repeat(60)}\n\n` +
        [...this._liveLines, ...lines.map(stripAnsi)].join('\n') +
        '\n';

      fs.writeFileSync(outFile, plain, 'utf8');
    } catch {
      /* non-fatal */
    }
  }
}
