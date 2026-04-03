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
import { browser as driver, $, expect } from '@wdio/globals';
import { scrollToElement } from './swipeGesturesHelper.ts';
import { buildLocatorProxy } from '../BasePage.ts';
import { LoginPage } from '../../pages/LoginPage.ts';
import testData from '../data/testData.json' with { type: 'json' };

export class CommonUtils {
  private locators: Record<string, (...args: any[]) => WebdriverIO.Element>;

  constructor() {
    const isAndroid = driver.isAndroid;
    const Locator = isAndroid
      ? testData.Utilities.commonutils.CommonUtilsLocatorsAndroid
      : testData.Utilities.commonutils.CommonUtilsLocatorsIos;

    this.locators = buildLocatorProxy(Locator);
    // Augment proxy with parameterized helpers without discarding existing keys
    this.locators.monthYearHeader = (month: string, year: string) =>
      $(
        isAndroid
          ? Locator.monthYearHeader.replace('{month}', month).replace('{year}', year)
          : Locator.monthYearHeader,
      );
    this.locators.dateCell = (day: string) =>
      $(isAndroid ? Locator.dateCell.replace('{day}', day) : Locator.dateCell.replace('{day}', day));
  }

  async acceptAuthorization() {
    const acceptAuthorization = this.locators.acceptAuthorizationCheckBox();
    await scrollToElement(acceptAuthorization);
    await acceptAuthorization.click();
  }

  async navigateToHomeScreen() {
    const loginPage = new LoginPage();
    const maxTries = 5;
    let tries = 0;
    let homeVisible = false;

    while (tries < maxTries) {
      homeVisible =
        homeVisible ||
        (await this.locators
          .appHomeBtn()
          .isDisplayed()
          .catch(() => false));
      if (!homeVisible) {
        if (
          await this.locators
            .navigateBackToMenuBtn()
            .isDisplayed()
            .catch(() => false)
        ) {
          await this.locators.navigateBackToMenuBtn().click();
        }
        await driver.pause(1000);
        tries++;
        continue;
      }

      await this.locators.appHomeBtn().click();
      await driver.pause(5000);

      try {
        await loginPage.verifyPromoScreenOrHomeScreenIsVisible();
        break;
      } catch {
        await driver.pause(1000);
      }

      tries++;
    }

    if (tries === maxTries) {
      throw new Error('Unable to navigate back to Home Screen after multiple attempts.');
    }
  }

  async appSettings() {
    await this.locators.appSettingsBtn().click();
    await driver.pause(5000);
  }

  async selectDate(date?: string) {
    const isAndroid = driver.isAndroid;
    const Locator = isAndroid
      ? testData.Utilities.commonutils.CommonUtilsLocatorsAndroid
      : testData.Utilities.commonutils.CommonUtilsLocatorsIos;
    const target = this.getTargetDateFromInput(date);

    const day = String(target.getDate());
    const year = String(target.getFullYear());
    const monthLong = target.toLocaleString('en-US', { month: 'long' });
    const monthShort = target.toLocaleString('en-US', { month: 'short' });
    const headerSelLong = (Locator.monthYearHeader || '')
      .replace('{month}', monthLong)
      .replace('{year}', year);
    const headerSelShort = (Locator.monthYearHeader || '')
      .replace('{month}', monthShort)
      .replace('{year}', year);
    const headers = [$(headerSelLong), $(headerSelShort)];

    const normalizedDay = day.replace(/^0+/, '');
    const dateCellSel = (Locator.dateCell || '').split('{day}').join(normalizedDay);
    const dateCell = $(dateCellSel);

    const isOnTargetMonth = async () => {
      for (const h of headers) {
        if (await h.isDisplayed().catch(() => false)) return true;
      }
      return false;
    };

    let found = await isOnTargetMonth();

    // Robust navigation: only click arrows if visible; otherwise don't block selection
    for (let i = 0; i < 12 && !found; i++) {
      if (await isOnTargetMonth()) {
        found = true;
        break;
      }
      const nextBtn = Locator.dateNextArrowBtn ? $(Locator.dateNextArrowBtn) : null;
      const prevBtn = (Locator as any).datePrevArrowBtn ? $((Locator as any).datePrevArrowBtn) : null;
      if (nextBtn && (await nextBtn.isDisplayed().catch(() => false))) {
        await nextBtn.click();
        await driver.pause(300);
        continue;
      }
      if (prevBtn && (await prevBtn.isDisplayed().catch(() => false))) {
        await prevBtn.click();
        await driver.pause(300);
        continue;
      }
      // No arrows visible; break to try day-cell fallbacks without failing early
      break;
    }
    // Don't hard-fail on iOS if header not detected; day-cell fallbacks may still work
    if (!found && isAndroid) {
      throw new Error('Unable to navigate to the requested month/year in calendar.');
    }

    try {
      await dateCell.waitForDisplayed({ timeout: 5000 });
      await dateCell.click();
    } catch (err) {
      if (!isAndroid) {
        // If wheel picker is present, use it directly
        const wheels = await $$('//XCUIElementTypePickerWheel');
        if (wheels.length >= 3) {
          const normalizedDay = day.replace(/^0+/, '');
          try {
            await wheels[0].setValue(monthLong);
            await wheels[1].setValue(normalizedDay);
            await wheels[2].setValue(year);
          } catch {
            try {
              await wheels[0].addValue(monthLong);
              await wheels[1].addValue(normalizedDay);
              await wheels[2].addValue(year);
            } catch {}
          }
          await driver.pause(300);
          if (Locator.dateApplyBtn) {
            await $(Locator.dateApplyBtn).click();
          }
          return;
        }

        // iOS day selectors from JSON only
        const iosDay = normalizedDay;
        const templates = testData.Utilities?.commonutils?.selectDatedata?.iosAltSelectors;
        if (!templates || templates.length === 0) {
          throw new Error(
            'selectDate: Missing Utilities.commonutils.selectDatedata.iosAltSelectors in testData.json',
          );
        }
        const altSelectors = templates.map((t: string) => t.split('{day}').join(iosDay));
        let clicked = false;
        for (const sel of altSelectors) {
          const el = $(sel);
          if (await el.isDisplayed().catch(() => false)) {
            await el.click();
            clicked = true;
            break;
          }
        }
        if (!clicked) {
          throw err;
        }
      } else {
        throw err;
      }
    }

    await driver.pause(500);
    if (Locator.dateApplyBtn) {
      await $(Locator.dateApplyBtn).click();
    }
  }

  private getTargetDateFromInput(input?: string): Date {
    const now = new Date();
    if (!input) return now;
    const raw = input.trim().toLowerCase();

    const addDays = (base: Date, days: number) => {
      const d = new Date(base);
      d.setDate(d.getDate() + days);
      return d;
    };

    if (raw === 'today') return now;
    if (raw === 'tomorrow') return addDays(now, 1);
    if (raw === 'day after tomorrow') return addDays(now, 3);

    // Support compound expressions like "tomorrow+N" or "day after tomorrow+N"
    const relPlus = raw.match(/^(today|tomorrow|day\s+after\s+tomorrow)\s*\+\s*(\d+)$/);
    if (relPlus) {
      const base = relPlus[1];
      const extra = parseInt(relPlus[2], 10);
      const baseDays = base === 'today' ? 0 : base === 'tomorrow' ? 1 : 3;
      return addDays(now, baseDays + extra);
    }

    const todayPlus = raw.match(/^today\+(\d+)$/);
    if (todayPlus) return addDays(now, parseInt(todayPlus[1], 10));

    const plusOnly = raw.match(/^\+(\d+)$/);
    if (plusOnly) return addDays(now, parseInt(plusOnly[1], 10));

    const inDays = raw.match(/^in\s+(\d+)\s+days$/);
    if (inDays) return addDays(now, parseInt(inDays[1], 10));

    // Fallback: try explicit format "D Month YYYY"
    const parts = input.split(' ');
    if (parts.length === 3) {
      const [dayStr, monthStr, yearStr] = parts;
      const dayNum = parseInt(dayStr, 10);
      const months = [
        'january',
        'february',
        'march',
        'april',
        'may',
        'june',
        'july',
        'august',
        'september',
        'october',
        'november',
        'december',
      ];
      const mIdx = months.indexOf(monthStr.toLowerCase());
      const yearNum = parseInt(yearStr, 10);
      if (!Number.isNaN(dayNum) && mIdx >= 0 && !Number.isNaN(yearNum)) {
        return new Date(yearNum, mIdx, dayNum);
      }
      // Try letting Date parse natural English if possible
      const tryParsed = new Date(`${monthStr} ${dayStr}, ${yearStr}`);
      if (!Number.isNaN(tryParsed.getTime())) return tryParsed;
    }

    // As a last resort, return today to avoid crashing flows
    return now;
  }

  async selectCurrentDate() {
    const isAndroid = driver.isAndroid;
    const Locator = isAndroid
      ? testData.Utilities.commonutils.CommonUtilsLocatorsAndroid
      : testData.Utilities.commonutils.CommonUtilsLocatorsIos;

    const now = new Date();
    const day = String(now.getDate());
    const year = String(now.getFullYear());
    const monthLong = now.toLocaleString('en-US', { month: 'long' });
    const monthShort = now.toLocaleString('en-US', { month: 'short' });

    const headerSelLong = (Locator.monthYearHeader || '')
      .replace('{month}', monthLong)
      .replace('{year}', year);
    const headerSelShort = (Locator.monthYearHeader || '')
      .replace('{month}', monthShort)
      .replace('{year}', year);
    const headers = [$(headerSelLong), $(headerSelShort)];

    const normalizedDay = day.replace(/^0+/, '');
    const dateCellSel = (Locator.dateCell || '').split('{day}').join(normalizedDay);
    const dateCell = $(dateCellSel);

    const isOnTargetMonth = async () => {
      for (const h of headers) {
        if (await h.isDisplayed().catch(() => false)) return true;
      }
      return false;
    };

    let found = await isOnTargetMonth();

    const hasNext = Boolean(Locator.dateNextArrowBtn);
    const hasPrev = Boolean((Locator as any).datePrevArrowBtn);

    if (!found && hasNext) {
      for (let i = 0; i < 12; i++) {
        if (await isOnTargetMonth()) {
          found = true;
          break;
        }
        await $(Locator.dateNextArrowBtn).click();
        await driver.pause(300);
      }
    }

    if (!found && hasPrev) {
      for (let i = 0; i < 12; i++) {
        if (await isOnTargetMonth()) {
          found = true;
          break;
        }
        await $((Locator as any).datePrevArrowBtn).click();
        await driver.pause(300);
      }
    }

    if (!found) {
      throw new Error('Unable to navigate to the current month/year in calendar.');
    }

    try {
      await dateCell.waitForDisplayed({ timeout: 5000 });
      await dateCell.click();
    } catch (err) {
      if (!isAndroid) {
        const iosDay = normalizedDay;
        const templates = testData.Utilities?.commonutils?.selectDatedata?.iosAltSelectors;
        if (!templates || templates.length === 0) {
          throw new Error(
            'selectCurrentDate: Missing Utilities.commonutils.selectDatedata.iosAltSelectors in testData.json',
          );
        }
        const altSelectors = templates.map((t: string) => t.split('{day}').join(iosDay));
        let clicked = false;
        for (const sel of altSelectors) {
          const el = $(sel);
          if (await el.isDisplayed().catch(() => false)) {
            await el.click();
            clicked = true;
            break;
          }
        }
        if (!clicked) {
          throw err;
        }
      } else {
        throw err;
      }
    }

    await driver.pause(500);
    if (Locator.dateApplyBtn) {
      await $(Locator.dateApplyBtn).click();
    }
  }

  async clickUntilVisible(clickLocator: ChainablePromiseElement, visibleLocator: ChainablePromiseElement) {
    let tries = 0;
    const maxTries = 3;

    while (tries < maxTries) {
      if (await visibleLocator.isDisplayed().catch(() => false)) {
        break;
      }

      await clickLocator.waitForDisplayed({ timeout: 5000 });
      await clickLocator.click();
      await driver.pause(1500);
      tries++;
    }

    // await expect(visibleLocator).toBeDisplayed();
  }

  async clickCheckbox(element: ChainablePromiseElement<WebdriverIO.Element>) {
    await element.waitForDisplayed({ timeout: 5000 });
    if (driver.isIOS) {
      const location = await element.getLocation();
      const size = await element.getSize();
      const tapX = location.x + 20; // slight offset inside checkbox
      const tapY = location.y + Math.floor(size.height / 2);
      await driver.performActions([
        {
          type: 'pointer',
          id: 'finger1',
          parameters: { pointerType: 'touch' },
          actions: [
            { type: 'pointerMove', duration: 0, x: tapX, y: tapY },
            { type: 'pointerDown', button: 0 },
            { type: 'pointerUp', button: 0 },
          ],
        },
      ]);
    } else {
      await element.click();
    }
  }
}
