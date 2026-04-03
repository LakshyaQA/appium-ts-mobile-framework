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

// no
import testData from '../tests/testdata/apptestdata.json' with { type: 'json' };
import { browser } from '@wdio/globals';
import { BasePage, buildLocatorProxy } from '../Base/BasePage.ts';

class AppPage extends BasePage {
  private locators: Record<string, () => WebdriverIO.Element>;

  constructor() {
    super();
    const isAndroid = browser.isAndroid;
    // Load platform-specific locators from the JSON based on the executing platform
    const Locator = isAndroid
      ? testData.appPageConfig.AppLocatorsAndroid
      : testData.appPageConfig.AppLocatorsIos;

    this.locators = buildLocatorProxy(Locator);
  }

  async clickGeneralStoreButton() {
    // await this.locators.generalStoreButton().waitForDisplayed({ timeout });
    await this.waitAndClick(this.locators.generalStoreButton());
  }

  async clickSelectCountry() {
    // await this.locators.select_country_dropdown().waitForDisplayed({ timeout });
    await this.waitAndClick(this.locators.select_country_dropdown());
  }
}

export { AppPage };
