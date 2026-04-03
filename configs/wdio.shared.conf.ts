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
import type { Options } from '@wdio/types';
import { browser } from '@wdio/globals';
import path from 'node:path';
import 'dotenv/config';
import { fileURLToPath } from 'node:url';
import {
  ensureDefaultLogin,
  markSessionBroken,
  resetSessionTracking,
  recoverBrokenSessionIfNeeded,
} from '../Base/utils/sessionHelper.ts';
import { handleIOSSystemAlerts } from '../Base/utils/alertsHelper.ts';
import { markBrowserStackSession } from '../Base/utils/stepHelper.ts';
import SpecSummaryReporter from '../Base/reporters/SpecSummaryReporter.ts';

// Toggle: when true, each Mocha `it(...)` runs on a fresh Appium/BrowserStack session.
// Flip this to false if you want to reuse the same session across tests.
const RESET_SESSION_EACH_TEST = true;

// reconstruct __dirname for ESM modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CLEAN = (s?: string) => (s || '').trim().replace(/^['"]|['"]$/g, '');

// -----------------------------------------------------------
// -----------local-------------
// -----------------------------------------------------------
// Run tests through a local Appium server instead of BrowserStack
// Set LOCAL_APPIUM=true on the command line (see package.json scripts)
const IS_LOCAL_APPIUM = String(process.env.LOCAL_APPIUM || '').toLowerCase() === 'true';

// Testing mode: pause after app launches, don't run tests
const PAUSE_FOR_INSPECTION = String(process.env.PAUSE_FOR_INSPECTION || '').toLowerCase() === 'true';

// -----------------------------------------------------------
// -----------browserstack--------------
// -----------------------------------------------------------
// Controlled via env vars in .env or the command line.
// BS_LOCAL=true  -> enable the tunnel when running on BrowserStack
const BS_LOCAL_ENABLED = String(process.env.BS_LOCAL || 'false').toLowerCase() === 'true';
const BS_LOCAL_IDENTIFIER = process.env.BS_LOCAL_IDENTIFIER || undefined;
const BS_FORCE_LOCAL = String(process.env.BS_FORCE_LOCAL || 'false').toLowerCase() === 'true';

export const config: Options.Testrunner = {
  runner: 'local',
  // Ensure BrowserStack credentials are available early for service hooks
  user: IS_LOCAL_APPIUM ? undefined : CLEAN(process.env.BROWSERSTACK_USERNAME),
  key: IS_LOCAL_APPIUM ? undefined : CLEAN(process.env.BROWSERSTACK_ACCESS_KEY),
  specs: (() => {
    // Priority 0: Pause for inspection mode (skip tests, just launch app)
    if (PAUSE_FOR_INSPECTION) {
      console.log('═══════════════════════════════════════════════════════════');
      console.log('  🔍 APPIUM INSPECTOR MODE ACTIVE');
      console.log('  1. Your app is launching...');
      console.log('  2. Open your browser to: http://localhost:4723/inspector');
      console.log('  3. Once open, click "Select Session" and choose your active session.');
      console.log('  (Close the emulator or press Ctrl+C to exit)');
      console.log('═══════════════════════════════════════════════════════════');
      // Use any existing spec to satisfy WDIO runner requirement;
      // the actual pause happens in the beforeSession hook.
      return [path.resolve(__dirname, '../tests/apptest.spec.ts')];
    }

    // Priority 1: Run a specific test suite file (e.g., for CI/CD)
    const suite = process.env.TEST_SUITE;
    if (suite) {
      return [path.resolve(__dirname, `../${suite}`)];
    }

    // Priority 2: Run specific spec files from environment variable
    const specEnv = (process.env.SPEC_FILES || '').trim();
    if (specEnv && specEnv.length > 0) {
      const files = specEnv
        .split(',')
        .map((f) => f.trim())
        .filter(Boolean)
        .map((f) => path.resolve(__dirname, `../${f}`));
      return files;
    }

    // Default: Fallback for local development
    return [
      // path.resolve(__dirname, '../tests/**/*.spec.ts'),
      // allow grep-filtered discovery across all specs, include explicit core spec
      // path.resolve(__dirname, '../tests/login.spec.ts'),
      path.resolve(__dirname, '../tests/apptest.spec.ts'),
      // path.resolve(__dirname, '../tests/signUp.spec.ts'),
    ];
  })(),
  maxInstances: 1,
  logLevel: 'info',
  logLevels: {
    // Suppress raw webdriver HTTP command logs: INFO webdriver: COMMAND findElement(...)
    webdriver: 'warn',
    // Suppress Appium service startup noise (spawning, PID, log path)
    '@wdio/appium-service': 'warn',
    // Suppress WDIO runner orchestration lifecycle noise
    '@wdio/cli:launcher': 'warn',
    '@wdio/local-runner': 'warn',
    // Suppress Xvfb (not used on Windows anyway)
    '@wdio/xvfb': 'silent',
    '@wdio/xvfb:ProcessFactory': 'silent',
    // BrowserStack service logs
    '@wdio/browserstack-service': 'silent',
    '@wdio/browserstack-service/cli': 'silent',
  },
  bail: 0,
  waitforTimeout: 10000,
  connectionRetryTimeout: 360000,
  connectionRetryCount: 1,

  framework: 'mocha',
  reporters: [
    // 'spec' reporter removed — SpecSummaryReporter below provides cleaner output
    [
      'allure',
      {
        outputDir: 'allure-results',
        disableWebdriverStepsReporting: true,
        disableWebdriverScreenshotsReporting: true,
      },
    ],
    // -----------common--------------
    // Human-readable summary — prints PASS/FAIL with steps and writes logs/spec-summary.txt
    [SpecSummaryReporter, {}],
  ],

  mochaOpts: {
    ui: 'bdd',
    timeout: 360000,
    retries: 0,
    grep: (() => {
      const tagEnv = (process.env.TEST_TAGS || '').trim();
      if (!tagEnv || tagEnv.toLowerCase() === 'all') return undefined;
      return tagEnv;
    })(),
  },

  services: IS_LOCAL_APPIUM
    ? [
        // -----------local-------------
        [
          'appium',
          {
            args: {
              address: '127.0.0.1',
              port: 4723,
              relaxedSecurity: true,
              allowCors: true,
              ...(PAUSE_FOR_INSPECTION ? { usePlugins: 'inspector' } : {}),
            },
            command: 'appium',
          },
        ],
      ]
    : [
        // -----------browserstack--------------
        [
          'browserstack',
          {
            // Local tunnel: controlled by BS_LOCAL_ENABLED flag
            browserstackLocal: BS_LOCAL_ENABLED,
            localIdentifier: BS_LOCAL_IDENTIFIER,

            // Local binary options (only relevant if browserstackLocal=true)
            opts: {
              forceLocal: BS_FORCE_LOCAL,
            },

            // Test Observability remains enabled
            testObservability: true,
            testObservabilityOptions: {
              buildTag: ['mobile', 'ts', 'pom'],
            },
          },
        ],
      ],

  /**
   * Global Hooks
   */

  onPrepare: async function (_config, _capabilities) {
    // 🛡️ Enterprise IP Protection
    const { SecurityManager } = await import('../Base/security/SecurityManager.ts');
    SecurityManager.validate();
    SecurityManager.printStartupBanner();
  },

  beforeSession: async function (config, capabilities, specs) {
    console.log('═══════════════════════════════════════════════════════════');
    console.log('  TEST SESSION STARTING');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`  Worker specs : ${specs?.length || 0}`);
    if (specs && specs.length > 0) {
      specs.forEach((s, i) => console.log(`    ${i + 1}. ${path.basename(s)}`));
    }
    console.log('═══════════════════════════════════════════════════════════');

    if (PAUSE_FOR_INSPECTION) {
      console.log('  🔍 APP LAUNCHED - PAUSED FOR INSPECTION');
      console.log('  You can now manually interact with the app on screen.');
      console.log('  Close the emulator window or press Ctrl+C to exit.');
      console.log('═══════════════════════════════════════════════════════════');

      // Keep session alive indefinitely for inspection
      await new Promise(() => {
        /* never resolves */
      });
    }

    // -----------browserstack--------------
    if (!IS_LOCAL_APPIUM) {
      try {
        const bs = capabilities?.['bstack:options'] || {};
        let computed = bs.sessionName || '';

        const suiteEnv = process.env.TEST_SUITE?.trim();
        const specEnv = process.env.SPEC_FILES?.trim();

        if (!computed) {
          if (suiteEnv) {
            computed = suiteEnv;
          } else if (specEnv) {
            const parts = specEnv
              .split(',')
              .map((f) => f.trim())
              .filter(Boolean);
            computed = parts.length === 1 ? parts[0] : parts.join(',');
          }
        }

        if (computed) {
          bs.sessionName = computed;
          capabilities['bstack:options'] = bs;
          console.log(`[BrowserStack] Session name: ${bs.sessionName}`);
        }
      } catch (err) {
        console.error('[BrowserStack] Error setting session name:', err);
      }
    }
  },

  beforeTest: async function (test) {
    const resetEach = RESET_SESSION_EACH_TEST;
    const g: any = globalThis as any;

    // Track how many tests have executed in this worker.
    g.__TEST_COUNTER = (g.__TEST_COUNTER ?? 0) + 1;
    const testIndex = Number(g.__TEST_COUNTER);

    try {
      // 1. Alert handling (iOS only)
      if (driver.isIOS) {
        await handleIOSSystemAlerts();
      }

      // 2. Clear old state / recover session (Cross-platform)
      await recoverBrokenSessionIfNeeded();

      // 3. Ensure login (if not manually logged in previous test)
      // Note: `ensureDefaultLogin` has internal logic to skip if already on the expected screen.
      await ensureDefaultLogin();

      // -----------browserstack--------------
      if (!IS_LOCAL_APPIUM) {
        try {
          const testTitle = test?.title || 'Unknown Test';
          await browser.execute(
            `browserstack_executor: {"action": "setSessionName", "arguments": {"name": "${testTitle}"}}`,
          );
        } catch {}
      }
    } catch (e) {
      console.warn('[beforeTest] Hook encountered an error', e);
    }
  },

  afterTest: async function (test, _context, { error, result, passed, duration, retries, skipped }) {
    try {
      // 1. Session tracking for reloadSession logic
      if (!passed || error) {
        markSessionBroken();
      }

      // 2. Reporting
      // -----------browserstack--------------
      if (!IS_LOCAL_APPIUM) {
        try {
          if (!skipped) {
            const fullTitle =
              test && typeof (test as any).fullTitle === 'function'
                ? (test as any).fullTitle()
                : (test as any)?.title;
            const reason = String(fullTitle || 'WDIO Test');
            await markBrowserStackSession(passed ? 'passed' : 'failed', reason);
          }
        } catch {}

        // Track sessionId while it's still available for onComplete cleanup
        if (browser.sessionId) {
          (globalThis as any).__LAST_BS_SESSION_ID = browser.sessionId;
        }
      }

      // -----------common--------------
      // Signal to the next beforeTest that we should reloadSession (if enabled)
      (globalThis as any).__HAS_RUN_AT_LEAST_ONE_TEST = true;
    } catch {}
  },

  afterSession: async function (_config, _capabilities) {
    // -----------browserstack--------------
    if (!IS_LOCAL_APPIUM) {
      try {
        console.log('[BrowserStack] Terminating app session...');
        const sessionId = browser.sessionId;
        if (!sessionId) {
          console.log('[BrowserStack] No active session; skipping app termination');
          return;
        }

        // Track the last sessionId so onComplete can stop it via REST API if needed
        (globalThis as any).__LAST_BS_SESSION_ID = sessionId;

        // Mark the session as done on BrowserStack
        try {
          await browser.execute(
            'browserstack_executor: {"action": "setSessionStatus", "arguments": {"status": "done", "reason": "Session completed"}}',
          );
        } catch {}

        // Close the app
        try {
          await browser.closeApp();
        } catch {}

        console.log('[BrowserStack] App terminated and session marked done');
      } catch (e) {
        console.warn('[BrowserStack] Error during app termination', e);
      }
    }
  },

  // Some services (notably BrowserStack Local / observability) can leave open handles,
  // which makes the WDIO CLI hang after printing "Run onComplete hook".
  // Default behavior: force-exit after a short delay. Disable by setting WDIO_FORCE_EXIT=false.
  onComplete: async function (exitCode) {
    // -----------local-------------
    // (Consolidated into platform-specific configs to avoid duplication)

    // -----------browserstack--------------
    try {
      const lastSessionId = (globalThis as any).__LAST_BS_SESSION_ID;
      const bsUser = CLEAN(process.env.BROWSERSTACK_USERNAME);
      const bsKey = CLEAN(process.env.BROWSERSTACK_ACCESS_KEY);
      if (lastSessionId && bsUser && bsKey) {
        console.log(`[BrowserStack] Stopping session ${lastSessionId} via REST API...`);
        try {
          const auth = Buffer.from(`${bsUser}:${bsKey}`).toString('base64');
          const resp = await fetch(
            `https://api-cloud.browserstack.com/app-automate/sessions/${lastSessionId}/stop.json`,
            {
              method: 'PUT',
              headers: { Authorization: `Basic ${auth}` },
            },
          );
          if (resp.ok) {
            console.log(`[BrowserStack] Session ${lastSessionId} STOPPED successfully.`);
          }
        } catch (e) {
          console.warn(`[BrowserStack] Failed to stop session ${lastSessionId} via API.`, e);
        }
      }
    } catch {}

    const forceExit = String(process.env.WDIO_FORCE_EXIT || 'true').toLowerCase() === 'true';
    if (forceExit) {
      setTimeout(() => {
        console.log('\n[WDIO] Force-exiting process...');
        process.exit(exitCode);
      }, 1500);
    }
  },
};
