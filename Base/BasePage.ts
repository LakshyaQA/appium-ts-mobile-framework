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

import { browser as driver, $, expect } from '@wdio/globals';
import type { ChainablePromiseElement } from 'webdriverio';
import { scrollToElement, bottomToTopSwipe, topToBottomSwipe } from '../Base/utils/swipeGesturesHelper.ts';
import type { CarouselStep, CarouselOptions } from './types.js';
import SecurityManager from './security/SecurityManager.ts';
import rawTestData from './data/testData.json' with { type: 'json' };

/**
 * Converts a raw mobile XPath / selector into a short human-readable label.
 * Used for console logging so engineers see plain English instead of raw XPath.
 */
function friendlyLocator(selector: string | undefined): string {
  if (!selector || selector === '<element>') return 'element';
  const s = String(selector);
  const norm = s.match(/normalize-space\(@text\)\s*=\s*['"](.*?)['"]/);
  if (norm) return `"${norm[1]}"`;
  const txt = s.match(/@text\s*=\s*['"](.*?)['"]/);
  if (txt) return `"${txt[1]}"`;
  const desc = s.match(/@content-desc\s*=\s*['"](.*?)['"]/);
  if (desc) return `"${desc[1]}"`;
  const resId = s.match(/@resource-id=['"'][^/'"]*\/([^'"]+)['"]/);
  if (resId) return `id:${resId[1]}`;
  const accId = s.match(/^~(.+)$/);
  if (accId) return `"${accId[1]}"`;
  return s.length > 60 ? s.slice(0, 57) + '...' : s;
}

// Narrow the JSON shape once to avoid repetitive `as any` casts
type BasePageJson = {
  basePageConfig: {
    baseLocatorsAndroid: { continueSelectors: string[]; nextSelectors: string[]; clickclosebtn: string[] };
    baseLocatorsIos: { continueSelectors: string[]; nextSelectors: string[]; clickclosebtn: string[] };
    notificationSelectorsAndroid: string[];
    notificationSelectorsIos: string[];
    hideSystemKeyboarddata?: { xpaths: string[] };
  };
};
const testData = rawTestData as unknown as BasePageJson;

// @ts-nocheck
export class BasePage {
  constructor() {
    // 🛡️ Security Integrity Check
    // If the security module is missing or tampered with, this call (and import) will fail.
    SecurityManager.verifyIntegrity();
  }

  public get isAndroid(): boolean {
    return !!driver?.isAndroid;
  }

  private get baseLocators() {
    return this.isAndroid
      ? testData.basePageConfig.baseLocatorsAndroid
      : testData.basePageConfig.baseLocatorsIos;
  }

  private get notificationSelectors(): string[] {
    return this.isAndroid
      ? testData.basePageConfig.notificationSelectorsAndroid
      : testData.basePageConfig.notificationSelectorsIos;
  }

  /**
   * Tap at (offsetX, offsetY) relative to an anchor element.
   * - Anchor can be: selector string, element getter function, or an element itself.
   * - Origin can be element 'center' (default) or 'topLeft'.
   * - Offsets are in pixels from the chosen origin.
   */
  async tapRelativeTo(
    anchor:
      | string
      | (() => WebdriverIO.Element | ChainablePromiseElement)
      | WebdriverIO.Element
      | ChainablePromiseElement,
    offsetX: number,
    offsetY: number,
    options?: {
      origin?: 'center' | 'topLeft';
      waitTimeout?: number;
      scrollIntoView?: boolean;
      unit?: 'px' | 'percent';
      debug?: boolean;
      pressDurationMs?: number;
      screenshotName?: string;
    },
  ) {
    const origin = options?.origin ?? 'center';
    const waitTimeout = options?.waitTimeout ?? 10000;
    const doScroll = options?.scrollIntoView ?? true;
    const unit = options?.unit ?? 'px';
    const pressDurationMs = Math.max(1, options?.pressDurationMs ?? 120);

    // Resolve anchor to an element
    let el: WebdriverIO.Element;
    if (typeof anchor === 'string') {
      el = (await $(anchor)) as unknown as WebdriverIO.Element;
    } else if (typeof anchor === 'function') {
      el = anchor() as unknown as WebdriverIO.Element;
    } else {
      el = anchor as WebdriverIO.Element;
    }

    try {
      if (doScroll) {
        try {
          await scrollToElement(el as unknown as ChainablePromiseElement);
        } catch {}
      }
      await el.waitForDisplayed({ timeout: waitTimeout });
    } catch (e) {
      throw new Error(`tapRelativeTo: anchor element not displayed: ${String(e)}`);
    }

    const loc = await el.getLocation();
    const size = await el.getSize();

    const baseX = origin === 'center' ? Math.round(loc.x + size.width / 2) : Math.round(loc.x);
    const baseY = origin === 'center' ? Math.round(loc.y + size.height / 2) : Math.round(loc.y);

    // Convert offsets if using percent relative to element size
    const toPixels = (val: number, dim: number) => {
      if (unit === 'percent') {
        // Accept values in [0..1] as fraction, or [0..100] as percentage
        const fraction = Math.abs(val) > 1 ? val / 100 : val;
        return Math.round(fraction * dim) * Math.sign(val);
      }
      return Math.round(val);
    };

    const dx = toPixels(offsetX, size.width);
    const dy = toPixels(offsetY, size.height);

    let tapX = baseX + dx;
    let tapY = baseY + dy;

    // Clamp to viewport to avoid out-of-bounds taps
    try {
      const { width, height } = await driver.getWindowSize();
      tapX = Math.max(1, Math.min(width - 1, tapX));
      tapY = Math.max(1, Math.min(height - 1, tapY));
    } catch {}

    if (options?.debug) {
      console.log(
        `[tapRelativeTo] origin=${origin}, unit=${unit}, base=(${baseX},${baseY}), offset=(${offsetX},${offsetY}), resolved=(${tapX},${tapY}), size=(${size.width}x${size.height})`,
      );
      try {
        const name = options?.screenshotName ?? `tap_${Date.now()}_${tapX}_${tapY}`;
        await driver.saveScreenshot(`./logs/${name}.png`);
      } catch {}
    }

    await driver.performActions([
      {
        type: 'pointer',
        id: 'finger1',
        parameters: { pointerType: 'touch' },
        actions: [
          { type: 'pointerMove', duration: 0, x: tapX, y: tapY },
          { type: 'pointerDown', button: 0 },
          { type: 'pause', duration: pressDurationMs },
          { type: 'pointerUp', button: 0 },
        ],
      },
    ] as any);
    try {
      await driver.releaseActions?.();
    } catch {}
  }

  /**
   * Convenience wrapper to tap using percent offsets relative to element size.
   * Example: percentX=0.5, percentY=0.5 => center; -0.25 => 25% left/up from origin.
   */
  async tapRelativePercent(
    anchor:
      | string
      | (() => WebdriverIO.Element | ChainablePromiseElement)
      | WebdriverIO.Element
      | ChainablePromiseElement,
    percentX: number,
    percentY: number,
    options?: {
      origin?: 'center' | 'topLeft';
      waitTimeout?: number;
      scrollIntoView?: boolean;
      debug?: boolean;
      pressDurationMs?: number;
      screenshotName?: string;
    },
  ) {
    return this.tapRelativeTo(anchor, percentX, percentY, { ...options, unit: 'percent' });
  }

  /**
   * Tap at an absolute screen coordinate measured from the screen origin (0,0).
   * - Use unit 'px' for raw pixels (default) or 'percent' to scale across devices.
   * - Percent values accept either 0..1 (fraction) or 0..100 (percentage).
   */
  async tapAtScreen(
    x: number,
    y: number,
    options?: {
      unit?: 'px' | 'percent';
      debug?: boolean;
      pressDurationMs?: number;
      screenshotName?: string;
    },
  ) {
    const unit = options?.unit ?? 'px';
    const pressDurationMs = Math.max(1, options?.pressDurationMs ?? 120);

    const { width, height } = await driver.getWindowSize();

    const toPixelsAbs = (val: number, dim: number) => {
      if (unit === 'percent') {
        const fraction = Math.abs(val) > 1 ? val / 100 : val; // 10 => 10%, 0.1 => 10%
        return Math.round(fraction * dim) * Math.sign(val);
      }
      return Math.round(val);
    };

    let tapX = toPixelsAbs(x, width);
    let tapY = toPixelsAbs(y, height);

    // Clamp into safe bounds
    tapX = Math.max(1, Math.min(width - 1, tapX));
    tapY = Math.max(1, Math.min(height - 1, tapY));

    if (options?.debug) {
      console.log(`[tapAtScreen] unit=${unit}, window=(${width}x${height}), resolved=(${tapX},${tapY})`);
      try {
        const name = options?.screenshotName ?? `tap_screen_${Date.now()}_${tapX}_${tapY}`;
        await driver.saveScreenshot(`./logs/${name}.png`);
      } catch {}
    }

    await driver.performActions([
      {
        type: 'pointer',
        id: 'finger1',
        parameters: { pointerType: 'touch' },
        actions: [
          { type: 'pointerMove', duration: 0, x: tapX, y: tapY },
          { type: 'pointerDown', button: 0 },
          { type: 'pause', duration: pressDurationMs },
          { type: 'pointerUp', button: 0 },
        ],
      },
    ] as any);
    try {
      await driver.releaseActions?.();
    } catch {}
  }

  /**
   * Attempt to click an element if it becomes visible within the timeout.
   * If the element never appears, the step is silently skipped — no error is thrown.
   * Useful for dismissing ghost pop-ups or optional dialogs.
   *
   * @returns `true` if the element was found and clicked, `false` if skipped.
   */
  async clickIfDisplayed(el: WebdriverIO.Element, options?: { timeout?: number }): Promise<boolean> {
    const timeout = options?.timeout ?? 45000;
    let target: any = el as any;
    try {
      if (target && typeof target.then === 'function') target = await target;
    } catch {}

    try {
      await target.waitForDisplayed({ timeout });
      await target.click();
      return true;
    } catch {
      // Element did not appear within timeout — skip silently
      return false;
    }
  }
  async waitAndClick(el: WebdriverIO.Element, options?: { timeout?: number }) {
    // Resolve ChainablePromiseElement (thenable) so selector is a real string
    let target: any = el as any;
    try {
      if (target && typeof target.then === 'function') target = await target;
    } catch {}

    // WDIO elements from `$()` can have a thenable `selector` (prints as [object Promise] if stringified)
    let selector: any = target?.selector;
    try {
      if (selector && typeof selector.then === 'function') selector = await selector;
    } catch {}
    const selectorStr = selector ? String(selector) : '<element>';
    const elementId = target?.elementId ? String(target.elementId) : '';

    // Plain-English tap log
    const prefix = `[\x1b[33mOmniMobile-LakshyaQA\x1b[0m]`;
    process.stdout.write(`${prefix}       \x1b[90m↳ Tapping: ${friendlyLocator(selectorStr)}\x1b[0m\n`);

    // Use explicit timeout if provided, otherwise fall back to WDIO's global waitforTimeout
    const resolvedTimeout = options?.timeout ?? (driver as any).options?.waitforTimeout ?? 10000;
    await target.waitForDisplayed({
      timeout: resolvedTimeout,
      timeoutMsg: `Element not visible after ${resolvedTimeout}ms — selector: ${selectorStr}${elementId ? ` (elementId=${elementId})` : ''}`,
    });
    await expect(target).toBeDisplayed();
    await target.click();
  }

  async typeValue(el: WebdriverIO.Element, value: string, timeout = 10000) {
    let target: any = el as any;
    try {
      if (target && typeof target.then === 'function') target = await target;
    } catch {}

    let selector: any = target?.selector;
    try {
      if (selector && typeof selector.then === 'function') selector = await selector;
    } catch {}
    const selectorStr = selector ? String(selector) : '<element>';

    // Plain-English type log (mask long values)
    const display = value.length > 30 ? value.slice(0, 30) + '...' : value;
    const prefix = `[\x1b[33mOmniMobile-LakshyaQA\x1b[0m]`;
    process.stdout.write(
      `${prefix}       \x1b[90m↳ Typing into: ${friendlyLocator(selectorStr)} = "${display}"\x1b[0m\n`,
    );

    await target.waitForDisplayed({
      timeout,
      timeoutMsg: `Element not visible within ${timeout}ms selector=${selectorStr}`,
    });
    await expect(target).toBeDisplayed();
    // await el.clearValue();
    await this.addValueSlow(target, value, 120);
    // await el.setValue(value);
  }

  // Types into a field:
  // - iOS: slowly via addValue per character (helps with autocomplete/pickers)
  // - Android: default to setValue for speed and stability (can force slow via options.forceSlow)
  async addValueSlow(
    el: WebdriverIO.Element,
    value: string,
    delayMs = 120,
    options?: { clear?: boolean; timeout?: number; forceSlow?: boolean },
  ) {
    const timeout = options?.timeout ?? 10000;
    await el.waitForDisplayed({ timeout });
    if (options?.clear) {
      try {
        await el.clearValue();
      } catch {}
    }
    if (this.isAndroid && !options?.forceSlow) {
      await el.setValue(value);
      return;
    }
    for (const ch of value) {
      await el.addValue(ch);
      await driver.pause(delayMs);
    }
  }

  // Alias to match requested name; delegates to addValueSlow
  async addvlaue(el: WebdriverIO.Element, value: string, delayMs = 120) {
    await this.addValueSlow(el, value, delayMs);
  }

  async scrollAndClick(el: WebdriverIO.Element, timeout: number) {
    await scrollToElement(el as unknown as ChainablePromiseElement);
    await this.waitAndClick(el, { timeout });
  }

  async scrollAndAssertVisible(el: WebdriverIO.Element, timeout = 10000) {
    await scrollToElement(el as unknown as ChainablePromiseElement);
    await el.waitForDisplayed({ timeout });
    await expect(el).toBeDisplayed();
  }

  async waitForEitherVisible(
    aGetter: () => WebdriverIO.Element | ChainablePromiseElement,
    bGetter: () => WebdriverIO.Element | ChainablePromiseElement,
    timeout = 60000,
  ): Promise<'a' | 'b'> {
    const a = aGetter() as unknown as WebdriverIO.Element;
    const b = bGetter() as unknown as WebdriverIO.Element;
    await driver.waitUntil(
      async () => {
        const aVisible = await a.isDisplayed().catch(() => false);
        const bVisible = await b.isDisplayed().catch(() => false);
        return aVisible || bVisible;
      },
      { timeout, timeoutMsg: 'Neither element visible within timeout' },
    );
    const aVisible = await a.isDisplayed().catch(() => false);
    return aVisible ? 'a' : 'b';
  }

  async clickContinue(timeout = 10000) {
    const selectors = this.baseLocators.continueSelectors;
    const el = await this.findFirstEnabledBySelectors(selectors, timeout);
    if (!el) throw new Error('Continue button not found');
    await el.click();
  }
  //clickTwice
  async clickTwice(el: WebdriverIO.Element | ChainablePromiseElement, delayMs = 1200, timeout = 10000) {
    const target = el as unknown as WebdriverIO.Element;
    await target.waitForDisplayed({ timeout });
    await target.click();
    await driver.pause(delayMs);
    await target.click();
  }

  async clickCloseNotificationPopUp(timeout = 1000) {
    // Only attempt to close if a Notification element is visible
    const hasNotification = await this.isNotificationVisible(Math.min(timeout, 2000));
    if (!hasNotification) {
      return; // silently ignore when no notification is present
    }

    const selectors = this.baseLocators.clickclosebtn;
    const el = await this.findFirstEnabledBySelectors(selectors, timeout);
    if (!el) {
      return; // no close button found; ignore to avoid failing the test
    }
    await el.click();
  }

  async clickNext(timeout = 10000) {
    const selectors = this.baseLocators.nextSelectors;
    const el = await this.findFirstEnabledBySelectors(selectors, timeout);
    if (!el) throw new Error('Next button not found');
    await el.click();
  }

  async clickPrimaryOrFallback(
    primary: () => WebdriverIO.Element | ChainablePromiseElement,
    fallbackSelectors: string[],
    timeout = 10000,
    screenshotName?: string,
  ) {
    let target: WebdriverIO.Element | null = null;
    try {
      const el = primary() as unknown as WebdriverIO.Element;
      await el.waitForDisplayed({ timeout });
      if (await el.isEnabled()) target = el;
    } catch {}

    if (!target) {
      target = await this.findFirstEnabledBySelectors(fallbackSelectors, timeout);
    }

    if (!target) {
      if (screenshotName) {
        await driver.saveScreenshot(`./logs/${screenshotName}_${Date.now()}.png`);
      }
      throw new Error('No clickable element found for provided primary/fallbacks');
    }

    await target.click();
  }

  async typeAndAdvance(
    el: WebdriverIO.Element,
    value: string,
    advance: 'auto' | 'return' | 'next' | 'continue' | 'none' = 'auto',
    timeout = 10000,
  ) {
    await this.typeValue(el, value, timeout);
    let strategy = advance;
    if (advance === 'auto') {
      strategy = this.isAndroid ? 'continue' : 'return';
    }
    if (strategy === 'none') return;
    if (strategy === 'return') {
      await driver.keys('Return');
      return;
    }
    if (strategy === 'next') {
      await this.clickNext(timeout);
      return;
    }
    if (strategy === 'continue') {
      await this.clickContinue(timeout);
      return;
    }
  }

  async findFirstEnabledBySelectors(
    selectors: string[],
    timeout = 10000,
  ): Promise<WebdriverIO.Element | null> {
    for (const sel of selectors) {
      const el = (await $(sel)) as unknown as WebdriverIO.Element;
      try {
        // Attempt to bring element into view on iOS where buttons can be offscreen
        if (!this.isAndroid) {
          try {
            await scrollToElement(el as unknown as any, 4);
          } catch {}
        }
        await el.waitForDisplayed({ timeout });
        if (await el.isEnabled()) return el;
      } catch {
        // try next
      }
    }
    return null;
  }

  // Performs a quick scroll down and back up to simulate user activity
  async scrollDownAndUp() {
    try {
      const range = { start: 0.8, end: 0.2 };
      await bottomToTopSwipe(range);
      await topToBottomSwipe(range);
    } catch {
      // ignore scroll errors
    }
  }

  // Hide the on-screen keyboard across platforms
  async hideSystemKeyboard(postHidePauseMs = 300) {
    try {
      if (this.isAndroid) {
        // Prefer the native Appium command first; keycodes are fallbacks and can have side-effects.
        try {
          await driver.hideKeyboard();
          await driver.pause(postHidePauseMs);
          return;
        } catch {}

        // If the driver supports it, avoid pressing keys when keyboard is not shown.
        let keyboardShown: boolean | undefined = undefined;
        try {
          const fn = (driver as any).isKeyboardShown;
          if (typeof fn === 'function') keyboardShown = await fn.call(driver);
        } catch {}
        if (keyboardShown === false) {
          await driver.pause(postHidePauseMs);
          return;
        }

        // Fallback 1: ESCAPE typically dismisses the keyboard without submitting forms.
        try {
          await driver.pressKeyCode(111); // KEYCODE_ESCAPE
          await driver.pause(postHidePauseMs);
          return;
        } catch {}

        // Fallback 2 (last resort): ENTER may submit forms / advance focus; use only if needed.
        await driver.pressKeyCode(66); // KEYCODE_ENTER
        await driver.pause(postHidePauseMs);
        return;
      }

      // iOS: progressively attempt multiple strategies with visibility checks
      const isKeyboardVisible = async () => {
        try {
          const kb = await $('//XCUIElementTypeKeyboard');
          return await kb.isDisplayed();
        } catch {
          return false;
        }
      };

      let visible = await isKeyboardVisible();
      //Comented some Strategy for now as it is creating issue in hiding keyboard on iOS
      // // Strategy 1: tapOutside (Appium)
      // if (visible) {
      //   try {
      //     // @ts-ignore Appium extra args
      //     await (driver as any).hideKeyboard('tapOutside');
      //     await driver.pause(200);
      //   } catch {}
      //   visible = await isKeyboardVisible();
      // }

      // Strategy 2: pressKey variants commonly present on iOS keyboards
      if (visible) {
        const keys = ['Done', 'Go', 'Search'];
        for (const key of keys) {
          try {
            // @ts-ignore Appium extra args
            await (driver as any).hideKeyboard('pressKey', key);
            await driver.pause(200);
            visible = await isKeyboardVisible();
            if (!visible) break;
          } catch {}
        }
      }

      // Strategy 3: directly tap the toolbar Done button (JSON-driven only)
      // if (visible) {
      //   const candidates = testData.basePageConfig.hideSystemKeyboarddata?.xpaths;
      //   if (!candidates || candidates.length === 0) {
      //     throw new Error(
      //       'hideSystemKeyboard: Missing basePageConfig.hideSystemKeyboarddata.xpaths in testData.json',
      //     );
      //   }
      //   for (const sel of candidates) {
      //     try {
      //       const el: any = await $(sel);
      //       await el.waitForDisplayed({ timeout: 800 });
      //       if (await el.isEnabled()) {
      //         await el.click();
      //         await driver.pause(200);
      //         break;
      //       }
      //     } catch {}
      //   }
      //   visible = await isKeyboardVisible();
      // }

      // Strategy 4: generic hide + key fallbacks
      if (visible) {
        try {
          await driver.hideKeyboard();
        } catch {}
        try {
          await driver.keys('Return');
        } catch {}
        await driver.pause(150);
        visible = await isKeyboardVisible();
      }

      //   // Strategy 5: tap the safe area near the top center to blur focus
      //   if (visible) {
      //     try {
      //       const { width } = await driver.getWindowSize();
      //       const x = Math.floor(width / 2);
      //       const y = 30; // safe area
      //       await driver.performActions([
      //         {
      //           type: 'pointer',
      //           id: 'finger1',
      //           parameters: { pointerType: 'touch' },
      //           actions: [
      //             { type: 'pointerMove', duration: 0, x, y },
      //             { type: 'pointerDown', button: 0 },
      //             { type: 'pause', duration: 120 },
      //             { type: 'pointerUp', button: 0 },
      //           ],
      //         },
      //       ] as any);
      //       await driver.releaseActions?.();
      //     } catch {}
      //   }

      await driver.pause(postHidePauseMs);
    } catch {
      // ignore if keyboard not present or command not supported
    }
  }

  // Detects whether a notification banner/dialog is visible by looking for common text markers
  async isNotificationVisible(timeout = 1000): Promise<boolean> {
    const selectors = this.notificationSelectors;

    for (const sel of selectors) {
      try {
        const el = (await $(sel)) as unknown as WebdriverIO.Element;
        await el.waitForDisplayed({ timeout });
        return true;
      } catch {
        // try next selector
      }
    }
    return false;
  }

  /**
   * Runs a series of click attempts (actions) in order until the target element becomes visible.
   * Each action should return true if it performed a click, false otherwise.
   * After every successful click, the method briefly waits and checks the target.
   */
  async advanceUntilVisible(
    actions: Array<() => Promise<boolean>>,
    targetGetter: () => WebdriverIO.Element | ChainablePromiseElement,
    options?: { perActionPauseMs?: number; checkTimeoutMs?: number; finalAssertTimeoutMs?: number },
  ) {
    const perPause = Math.max(0, options?.perActionPauseMs ?? 400);
    const checkTimeout = Math.max(1, options?.checkTimeoutMs ?? 1500);
    const finalAssertTimeout = Math.max(checkTimeout, options?.finalAssertTimeoutMs ?? 5000);

    const tryCheckTarget = async () => {
      try {
        const target = targetGetter() as unknown as WebdriverIO.Element;
        await target.waitForDisplayed({ timeout: checkTimeout });
        return true;
      } catch {
        return false;
      }
    };

    for (const act of actions) {
      let clicked = false;
      try {
        clicked = await act();
      } catch {
        clicked = false;
      }
      if (!clicked) continue;
      if (perPause) await driver.pause(perPause);
      if (await tryCheckTarget()) return;
    }

    // Final assertion to surface a clear failure if none of the candidates worked
    const target = targetGetter() as unknown as WebdriverIO.Element;
    await target.waitForDisplayed({ timeout: finalAssertTimeout });
    await expect(target).toBeDisplayed();
  }

  // Generic carousel verifier: assert visibility, run actions, then advance
  async verifyCarousel(steps: CarouselStep[], options?: CarouselOptions) {
    const timeout = options?.timeout ?? 10000;
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      if (step.visible?.length) {
        for (const loc of step.visible) {
          const el: any =
            typeof loc === 'string'
              ? $(loc)
              : typeof loc === 'function'
                ? (loc as () => any)()
                : (loc as any);
          await el.waitForDisplayed({ timeout });
          await expect(el).toBeDisplayed();
        }
      }

      if (step.actions?.length) {
        for (const action of step.actions) {
          await action();
        }
      }

      // Advance except after the last step
      if (i < steps.length - 1) {
        if (step.advanceSelectors?.length) {
          const el = await this.findFirstEnabledBySelectors(step.advanceSelectors, timeout);
          if (el) {
            await el.click();
            continue;
          }
        }
        const strategy = options?.defaultAdvance ?? 'next';
        if (strategy === 'none') {
          // No automatic advancement; assume actions handled progression
        } else if (strategy === 'next') {
          await this.clickNext(timeout);
        } else {
          await this.clickContinue(timeout);
        }
      }
    }
  }
}

/**
 * Dynamically exposes JSON locator keys as callable getters returning WebdriverIO.Element.
 * Keeps your existing calling convention: this.locators.someKey()
 *
 * Smart matching:
 * - Exact match first (rawLocators[prop])
 * - Then case-insensitive, punctuation-insensitive match
 *   e.g. "carasouelFirstPageHeading" will match "CarasouelfirstPageHeading"
 */
export function buildLocatorProxy(rawLocators: Record<string, string>) {
  if (!rawLocators || typeof rawLocators !== 'object') {
    throw new Error('buildLocatorProxy expected a plain object of string selectors');
  }

  const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');

  // Precompute a normalized lookup map for fuzzy matching
  const normalizedMap = new Map<string, string>(); // normalizedKey -> originalKey
  for (const key of Object.keys(rawLocators)) {
    const n = normalize(key);
    // Prefer first occurrence; if conflicts exist, getter will still fallback to original raw key error
    if (!normalizedMap.has(n)) normalizedMap.set(n, key);
  }

  function resolveKey(propKey: string): string | undefined {
    if (propKey in rawLocators) return propKey;
    const n = normalize(propKey);
    return normalizedMap.get(n);
  }

  return new Proxy(
    {},
    {
      get(_target, prop: string) {
        const key = resolveKey(String(prop));
        if (!key) {
          const available = Object.keys(rawLocators).sort().join(', ');
          throw new Error(`Locator "${String(prop)}" not found. Available keys: ${available}`);
        }
        const selector = rawLocators[key];
        if (typeof selector !== 'string') {
          throw new Error(`Locator value for "${key}" is not a string selector`);
        }
        return () => $(selector);
      },
    },
  ) as Record<string, () => WebdriverIO.Element>;
}

export default BasePage;
