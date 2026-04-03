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

//@ts-nocheck
import type { ChainablePromiseElement } from 'webdriverio';
// import { browser as driver } from '@wdio/globals';

type SwipeRange = { start: number; end: number };
const VERTICAL_SWIPE_RANGES: SwipeRange[] = [
  { start: 0.8, end: 0.2 },
  { start: 0.7, end: 0.3 },
];
const HORIZONTAL_SWIPE_RANGES: SwipeRange[] = [
  { start: 0.8, end: 0.2 },
  { start: 0.7, end: 0.3 },
];

/**
 * Scrolls vertically until the element is visible.
 */
export async function scrollToElement(element: ChainablePromiseElement, maxSwipes = 3) {
  const range = await detectWorkingSwipeRange(VERTICAL_SWIPE_RANGES, 'vertical');
  for (let i = 0; i < maxSwipes && !(await element.isDisplayed()); i++) {
    await bottomToTopSwipe(range);
  }
  for (let i = 0; i < maxSwipes && !(await element.isDisplayed()); i++) {
    await topToBottomSwipe(range);
  }
  if (!(await element.isDisplayed())) {
    throw new Error('Element not found after scrolling');
  }
}

/**
 * Swipes horizontally until the element is visible.
 */
export async function swipeToElement(element: ChainablePromiseElement, maxSwipes = 5) {
  const range = await detectWorkingSwipeRange(HORIZONTAL_SWIPE_RANGES, 'horizontal');
  for (let i = 0; i < maxSwipes && !(await element.isDisplayed()); i++) {
    await rightToLeftSwipe(range);
  }
  for (let i = 0; i < maxSwipes && !(await element.isDisplayed()); i++) {
    await leftToRightSwipe(range);
  }
  if (!(await element.isDisplayed())) {
    throw new Error('Element not found after swiping');
  }
}

/**
 * Swipes from bottom to top of the screen.
 */
export async function bottomToTopSwipe(range: SwipeRange) {
  const { width, height } = await driver.getWindowSize();
  const startX = Math.floor(width / 2);
  await performSwipe(startX, Math.floor(height * range.start), startX, Math.floor(height * range.end), 800);
}

/**
 * Swipes from top to bottom of the screen.
 */
export async function topToBottomSwipe(range: SwipeRange) {
  const { width, height } = await driver.getWindowSize();
  const startX = Math.floor(width / 2);
  await performSwipe(startX, Math.floor(height * range.end), startX, Math.floor(height * range.start), 800);
}

/**
 * Swipes from left to right of the screen.
 */
export async function leftToRightSwipe(range: SwipeRange) {
  const { width, height } = await driver.getWindowSize();
  const startY = Math.floor(height / 2);
  await performSwipe(Math.floor(width * range.end), startY, Math.floor(width * range.start), startY, 800);
}

/**
 * Swipes from right to left of the screen.
 */
export async function rightToLeftSwipe(range: SwipeRange) {
  const { width, height } = await driver.getWindowSize();
  const startY = Math.floor(height / 2);
  await performSwipe(Math.floor(width * range.start), startY, Math.floor(width * range.end), startY, 800);
}

/**
 * Detects which swipe range actually moves the screen.
 */
async function detectWorkingSwipeRange(
  ranges: SwipeRange[],
  direction: 'vertical' | 'horizontal',
): Promise<SwipeRange> {
  const { width, height } = await driver.getWindowSize();
  const before = await driver.getPageSource();
  for (const range of ranges) {
    if (direction === 'vertical') {
      const startX = Math.floor(width / 2);
      await performSwipe(
        startX,
        Math.floor(height * range.start),
        startX,
        Math.floor(height * range.end),
        600,
      );
    } else {
      const startY = Math.floor(height / 2);
      await performSwipe(Math.floor(width * range.start), startY, Math.floor(width * range.end), startY, 600);
    }
    await driver.pause(700);
    if ((await driver.getPageSource()) !== before) return range;
  }
  return ranges[0]; // fallback
}

/**
 * Executes a swipe from (startX, startY) to (endX, endY).
 */
async function performSwipe(startX: number, startY: number, endX: number, endY: number, durationMs: number) {
  await driver.performActions([
    {
      type: 'pointer',
      id: 'finger1',
      parameters: { pointerType: 'touch' },
      actions: [
        { type: 'pointerMove', duration: 0, x: startX, y: startY },
        { type: 'pointerDown', button: 0 },
        { type: 'pause', duration: 100 },
        { type: 'pointerMove', duration: durationMs, x: endX, y: endY },
        { type: 'pointerUp', button: 0 },
      ],
    },
  ]);
  await driver.pause(500);
}

/**
 * Scrolls down until the end of the current view or max swipes reached.
 * Options allow forcing additional swipes even after bottom is hit.
 */
export async function scrollToBottom(
  maxSwipes = 10,
  options?: {
    stableSwipes?: number; // how many unchanged pageSources in a row to consider bottom
    extraSwipes?: number; // perform extra swipes after bottom detected
    force?: boolean; // ignore detection and always swipe maxSwipes times
    useIOSMobileScroll?: boolean; // use iOS-specific mobile: scroll
  },
) {
  const stableNeeded = Math.max(1, Number(options?.stableSwipes ?? 2));
  const extra = Math.max(0, Number(options?.extraSwipes ?? (driver.isIOS ? 1 : 0)));
  const force = Boolean(options?.force);
  const useIOSMobile = Boolean(options?.useIOSMobileScroll && driver.isIOS);

  const range = await detectWorkingSwipeRange(VERTICAL_SWIPE_RANGES, 'vertical');

  if (useIOSMobile) {
    for (let i = 0; i < maxSwipes; i++) {
      try {
        // Scroll down moves viewport toward bottom on iOS
        await driver.execute('mobile: scroll', { direction: 'down' });
      } catch {}
      await driver.pause(400);
    }
    for (let i = 0; i < extra; i++) {
      try {
        await driver.execute('mobile: scroll', { direction: 'down' });
      } catch {}
      await driver.pause(350);
    }
    return;
  }

  if (force) {
    for (let i = 0; i < maxSwipes; i++) {
      await bottomToTopSwipe(range);
      await driver.pause(400);
    }
    for (let i = 0; i < extra; i++) {
      await bottomToTopSwipe(range);
      await driver.pause(350);
    }
    return;
  }

  let lastSource = await driver.getPageSource();
  let unchangedCount = 0;

  for (let i = 0; i < maxSwipes; i++) {
    await bottomToTopSwipe(range);
    await driver.pause(600);
    const current = await driver.getPageSource();
    if (current === lastSource) {
      unchangedCount++;
      if (unchangedCount >= stableNeeded) break; // likely reached bottom
    } else {
      unchangedCount = 0;
      lastSource = current;
    }
  }

  for (let i = 0; i < extra; i++) {
    await bottomToTopSwipe(range);
    await driver.pause(350);
  }
}
