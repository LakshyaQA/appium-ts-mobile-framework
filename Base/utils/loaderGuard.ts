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

import { browser, $ } from '@wdio/globals';

type LoaderGuardOptions = {
  timeoutMs?: number;
  intervalMs?: number;
  selectors?: string[];
};

function parseSelectorListFromEnv(raw: string | undefined): string[] {
  if (!raw) return [];
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * Android-only: waits for a transient loading overlay/spinner to disappear.
 *
 * IMPORTANT: This is intentionally selector-driven (via env or passed selectors),
 * because generic locators like `//android.widget.ImageView` can match normal UI
 * icons/checkboxes and would stall tests.
 */
export async function waitForAndroidLoaderToDisappear(options?: LoaderGuardOptions): Promise<void> {
  if (!browser.isAndroid) return;

  const timeoutMs = options?.timeoutMs ?? Number(process.env.ANDROID_LOADER_TIMEOUT_MS ?? 70000);
  const intervalMs = options?.intervalMs ?? Number(process.env.ANDROID_LOADER_INTERVAL_MS ?? 2000);

  const selectors =
    options?.selectors && options.selectors.length > 0
      ? options.selectors
      : parseSelectorListFromEnv(process.env.ANDROID_LOADER_SELECTOR);

  // Not configured => no-op (safe default)
  if (selectors.length === 0) return;

  for (const sel of selectors) {
    await browser
      .waitUntil(
        async () => {
          // Re-query each poll to avoid stale element references during transitions
          const el = (await $(sel)) as unknown as WebdriverIO.Element;
          const visible = await el.isDisplayed().catch(() => false);
          return !visible;
        },
        {
          timeout: timeoutMs,
          interval: intervalMs,
          timeoutMsg: `Android loader still visible after ${timeoutMs}ms selector=${sel}`,
        },
      )
      .catch(() => {
        // If the selector is invalid or element lookup fails intermittently, don't hard-fail here.
        // The next real UI action will surface a meaningful error if the app is actually stuck.
      });
  }
}
