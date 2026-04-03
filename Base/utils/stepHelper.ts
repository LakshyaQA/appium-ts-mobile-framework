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
import allure from '@wdio/allure-reporter';
import { browser } from '@wdio/globals';
import { Status } from 'allure-js-commons';
import { markSessionBroken } from './sessionHelper.ts';

// -----------local-------------
// annotateBS is a no-op when running locally against a local Appium server
// -----------browserstack--------------
// Adds a text annotation visible in the BrowserStack session timeline
async function annotateBS(message: string, level: 'info' | 'warn' | 'error' = 'info') {
  if (String(process.env.LOCAL_APPIUM || '').toLowerCase() === 'true') return;
  try {
    if (!browser.sessionId) return;
    // Use browser.execute (not executeScript) — executeScript is not valid in WebdriverIO v9
    await browser.execute(
      `browserstack_executor: {"action": "annotate", "arguments": {"data": ${JSON.stringify(message)}, "level": ${JSON.stringify(level)} }}`,
    );
  } catch {}
}

export async function step(name: string, action: () => Promise<void>) {
  // Print step name in real-time to console with author watermark
  const prefix = `[\x1b[33mAppiumTSMobile-LakshyaQA\x1b[0m]`;
  process.stdout.write(`${prefix}  \x1b[90m→\x1b[0m  ${name}\n`);
  try {
    const allureName = `[AppiumTSMobile-LakshyaQA] ${name}`;
    allure.startStep(allureName);
    await annotateBS(`STEP START: ${name}`, 'info');
    await action();
    allure.endStep(Status.PASSED);
    await annotateBS(`STEP PASS: ${name}`, 'info');
  } catch (error) {
    const screenshot = await browser.takeScreenshot();
    allure.addAttachment(`Failure Screenshot - ${name}`, Buffer.from(screenshot, 'base64'), 'image/png');
    await markBrowserStackSession('failed', `Step failed: ${name}`);
    await annotateBS(`STEP FAIL: ${name} -> ${(error as any)?.message || error}`, 'error');

    markSessionBroken();
    allure.endStep(Status.FAILED);
    throw error;
  }
}

// -----------browserstack--------------
// Marks the BrowserStack session status and attaches session links to the Allure report.
// -----------local-------------
// This function is a no-op when LOCAL_APPIUM=true — safely skips all BS API calls.
export async function markBrowserStackSession(status: 'passed' | 'failed', reason: string) {
  if (String(process.env.LOCAL_APPIUM || '').toLowerCase() === 'true') return;
  if (!browser.sessionId) return;

  // Use browser.execute (not executeScript) — executeScript is not valid in WebdriverIO v9
  try {
    await browser.execute(
      'browserstack_executor: {"action": "setSessionStatus", "arguments": {"status":"' +
        status +
        '","reason":"' +
        reason +
        '"}}',
    );
  } catch {}

  try {
    const sessionDetails: any = await browser.execute(
      'browserstack_executor: {"action": "getSessionDetails"}',
    );
    const buildId = sessionDetails?.build_id;
    const sessionId = browser.sessionId;
    // Attach author tag to Allure report
    allure.addArgument('Framework-Author', 'Lakshya Sharma (@LakshyaQA)');
    allure.addArgument('Engine', 'OmniMobile-LakshyaQA');

    // Attach session ID as plain text
    allure.addAttachment('BrowserStack Session ID', sessionId, 'text/plain');
    // Attach clickable BrowserStack session link
    const url = buildId
      ? `https://app-automate.browserstack.com/dashboard/v2/builds/${buildId}/sessions/${sessionId}/`
      : `https://app-automate.browserstack.com/dashboard/v2/sessions/${sessionId}/`;
    allure.addAttachment('BrowserStack Session Link', url, 'text/uri-list');
  } catch {}
}
