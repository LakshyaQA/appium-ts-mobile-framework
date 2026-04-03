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

// Centralized types for BasePage common helpers only
// Keep runtime-free: type-only imports
import type { ChainablePromiseElement } from 'webdriverio';

// WDIO element-like types used by BasePage helpers
export type ElementLike = WebdriverIO.Element | ChainablePromiseElement;

// A locator can be a selector string, a ready element, or a getter returning an element
export type LocatorInput = string | ElementLike | (() => ElementLike);

// Basic selector primitives used by BasePage
export type Selector = string;
export type SelectorList = string[];

// Common function and option types for BasePage helpers
export type ActionFn = () => Promise<void>;
export interface BaseWaitOptions {
  timeout?: number;
}

// Strategy for advancing carousel slides
export type AdvanceStrategy = 'next' | 'continue' | 'none';

// Generic carousel step description used by BasePage.verifyCarousel
export type CarouselStep = {
  visible?: LocatorInput[];
  actions?: ActionFn[];
  advanceSelectors?: SelectorList;
};

export type CarouselOptions = {
  timeout?: number;
  defaultAdvance?: AdvanceStrategy;
};
