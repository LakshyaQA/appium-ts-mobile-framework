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
import { AppPage } from '../pages/AppPage.ts';
import { browser, $, expect } from '@wdio/globals';
import testData from './testdata/apptestdata.json' with { type: 'json' };
import { step } from '../Base/utils/stepHelper.ts';
import { TestTag } from '../testSuite/testTags.ts';

// Normally we ensure login is handled globally via beforeTest.
// If this specific suite tests something that doesn't need login, you can disable it:
// import { setSkipDefaultLogin } from '../Base/utils/sessionHelper.ts';
// setSkipDefaultLogin(true);

let appPage: AppPage;

describe('App Feature Flow', () => {
  before(async () => {
    // Initialize your page object here
    appPage = new AppPage();
  });

  // Adding Tags ensures you can filter tests in package.json (e.g. TestTag.SMOKE)
  it('Should navigate and submit app form', async function () {
    this.retries(0); // Optional: Define retries for flakiness

    await step('Click Title', async () => {
      // Calls a method defined in the AppPage.ts
      await appPage.clickGeneralStoreButton();
    });

    await step('Click Select Country', async () => {
      await appPage.clickSelectCountry();
    });
  });
});
