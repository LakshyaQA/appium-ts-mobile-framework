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
import { LoginPage } from '../pages/LoginPage.ts';
import { browser, $, expect } from '@wdio/globals';
import testData from './testdata/logindata.json' with { type: 'json' };
import { step } from '../Base/utils/stepHelper.ts';
import { TestTag } from '../testSuite/testTags.ts';
import { setSkipDefaultLogin } from '../Base/utils/sessionHelper.ts';
import { EnvHelper, getLoginCredentials } from '../Base/utils/envHelper.ts';

setSkipDefaultLogin(false);

let loginPage: LoginPage;

describe('Login Flow', () => {
  before(async () => {
    loginPage = new LoginPage();
  });

  it(`${TestTag.SMOKE},${TestTag.REGRESSION} - Login User with valid Credentails`, async function () {
    this.retries(0);

    await step('Navigate to Login Page', async () => {
      await loginPage.navigateToLoginPage();
    });

    await step('Login with valid credentials', async () => {
      await loginPage.login(getLoginCredentials());
    });

    await step('Handle 2FA verification', async () => {
      await loginPage.verifyYourIdentity(testData.loginPageConfig.SecurityCode);
    });

    await step('Handle post-login flows', async () => {
      await loginPage.postloginHandle();
    });

    await step('Verify Dashboard is displayed', async () => {
      await expect(loginPage.dashboard()).toBeDisplayed({ wait: 25000 });
    });

    // await step('Sign out user', async () => {
    //   await loginPage.signOutUser();
    // });
  });

  it(`${TestTag.SMOKE} - Skip verification`, async function () {
    this.retries(0);

    await step('Navigate to Login Page', async () => {
      await loginPage.navigateToLoginPage();
    });

    await step('Login with valid credentials', async () => {
      await loginPage.login(getLoginCredentials());
    });

    await step('Skip verification', async () => {
      await loginPage.skipverification();
    });

    await step('Verify Dashboard is displayed', async () => {
      await expect(loginPage.dashboard()).toBeDisplayed({ wait: 25000 });
    });
  });

  it(`${TestTag.REGRESSION} - Cancel verification`, async function () {
    this.retries(0);

    await step('Navigate to Login Page', async () => {
      await loginPage.navigateToLoginPage();
    });

    await step('Login with valid credentials', async () => {
      await loginPage.login(getLoginCredentials());
    });

    await step('Cancel verification', async () => {
      await loginPage.cancelverification();
    });
  });

  it(`${TestTag.REGRESSION} - Sign Out User`, async function () {
    this.retries(0);

    await step('Navigate to Login Page', async () => {
      await loginPage.navigateToLoginPage();
    });

    await step('Login with valid credentials', async () => {
      await loginPage.login(getLoginCredentials());
    });

    await step('Handle 2FA verification', async () => {
      await loginPage.verifyYourIdentity(testData.loginPageConfig.SecurityCode);
    });

    await step('Handle post-login flows', async () => {
      await loginPage.postloginHandle();
    });

    await step('Sign out user', async () => {
      await loginPage.signOutUser();
    });

    await step('Verify user is logged out', async () => {
      await expect(loginPage.loginText()).toBeDisplayed({ wait: 25000 });
    });
  });
});
