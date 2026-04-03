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

import testData from '../tests/testdata/logindata.json' with { type: 'json' };
import { browser } from '@wdio/globals';
import { BasePage, buildLocatorProxy } from '../Base/BasePage.ts';
import { scrollToElement } from '../Base/utils/swipeGesturesHelper.ts';
import { handleIOSSystemAlerts } from '../Base/utils/alertsHelper.ts';

class LoginPage extends BasePage {
  private locators: Record<string, () => WebdriverIO.Element>;

  constructor() {
    super();
    const isAndroid = browser.isAndroid;
    const Locator = isAndroid
      ? testData.loginPageConfig.LoginLocatorsAndroid
      : testData.loginPageConfig.LoginLocatorsIos;

    this.locators = buildLocatorProxy(Locator);
  }

  async clickproceed_btn(timeout = 8000) {
    // Splash screen 'PROCEED' button only appear on some launches.
    // Fail fast with 8s timeout if not present.
    await this.locators.proceed_btn().waitForDisplayed({ timeout });
    await this.locators.proceed_btn().click();
  }

  async navigateToLoginPage() {
    // buildLocatorProxy uses $() internally which returns ChainablePromiseElement at runtime,
    // but its declared return type is WebdriverIO.Element. In WDIO v9 these two types have
    // incompatible `elementId` (string vs Promise<string>), making a direct cast impossible.
    // The runtime behavior is correct; suppress this single structural mismatch.
    // @ts-expect-error — WDIO Element/ChainablePromise type mismatch (safe at runtime)
    await scrollToElement(this.locators.letsgo_btn());
    await this.waitAndClick(this.locators.letsgo_btn());
  }

  async login(credentials: { email: string; password: string }) {
    await this.waitAndClick(this.locators.emailField());
    await this.typeValue(this.locators.emailField(), credentials.email);

    await this.waitAndClick(this.locators.passwordField());
    await this.typeValue(this.locators.passwordField(), credentials.password);

    if (browser.isAndroid) {
      await this.hideSystemKeyboard();
      await this.waitAndClick(this.locators.loginBtn());
    } else {
      await this.locators.loginBtn().waitForDisplayed({ timeout: 25000 });
      await this.waitAndClick(this.locators.loginBtn());
    }
  }

  async verifyYourIdentity(securitycode: { otp: string }) {
    await this.waitAndClick(this.locators.sendcode_btn());

    await this.waitAndClick(this.locators.otpField());
    await this.typeValue(this.locators.otpField(), securitycode.otp);
    await this.hideSystemKeyboard();

    //Enable trust devie check box.
    // if (browser.isAndroid) {
    //   await this.hideSystemKeyboard();
    // await this.waitAndClick(this.locators.trustDevice_ckbox());
    // } else {
    // await this.waitAndClick(this.locators.trustDevice_ckbox());
    // }

    await this.waitAndClick(this.locators.confirm_btn());
  }

  async postloginHandle() {
    // Handle any iOS system alerts that may appear after login
    if (browser.isIOS) {
      await handleIOSSystemAlerts();
      await this.clickIfDisplayed(this.locators.ok_btn());
      await browser.pause(1500);
      await this.scrollDownAndUp();
    } else {
      await browser.pause(1500);
      await this.scrollDownAndUp();
    }
  }

  async skipverification() {
    await this.clickIfDisplayed(this.locators.ok_btn(), { timeout: 45000 });
    // BUG FIX: waitAndClick() second param is a number, NOT an options object.
    // Original code passed { timeout: 60000 } (an object) which silently became NaN.
    // @ts-nocheck was hiding this real runtime bug.
    await this.waitAndClick(this.locators.skip_btn(), { timeout: 60000 });
  }

  async cancelverification() {
    await this.waitAndClick(this.locators.sendcode_btn());
    await this.waitAndClick(this.locators.cancel_btn());
  }

  dashboard() {
    return this.locators.dashboard();
  }

  loginText() {
    return this.locators.login_txt();
  }

  async signOutUser() {
    await this.waitAndClick(this.locators.more_btn());
    await this.waitAndClick(this.locators.logout_btn());
    await this.waitAndClick(this.locators.ok_btn());
  }
}

export { LoginPage };
