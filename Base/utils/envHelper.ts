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
import { scrollToElement } from './swipeGesturesHelper.ts';
import { browser as driver, $ } from '@wdio/globals';
import testData from '../data/testData.json' with { type: 'json' };
import loginData from '../../tests/testdata/logindata.json' with { type: 'json' };
import { BasePage, buildLocatorProxy } from '../BasePage.ts';

type AppEnv = 'DEV' | 'ST' | 'UAT';

function clean(raw?: string): string {
  return (raw || '').trim().replace(/^['"]|['"]$/g, '');
}

export class EnvHelper extends BasePage {
  private locators: Record<string, () => WebdriverIO.Element>;
  private rawLocators: Record<string, string>;

  constructor() {
    super();
    const isAndroid = driver.isAndroid;
    const Locator = isAndroid ? testData.SwitchEnvironment.envAndroid : testData.SwitchEnvironment.envIos;

    this.rawLocators = Locator;
    this.locators = buildLocatorProxy(Locator);
  }
  async switchEnv(): Promise<void> {
    const env_option = this.locators.environmentOptionBtn();
    await scrollToElement(env_option);
    await this.waitAndClick(env_option);

    const envName = this.getSelectedAppEnv();
    if (!envName) return;

    const template = this.rawLocators.env_opt;
    if (!template || !String(template).includes('{ENV}')) {
      throw new Error(
        "SwitchEnvironment.env*.env_opt must exist and include '{ENV}' placeholder in Base/data/testData.json",
      );
    }
    const envSelector = String(template).replaceAll('{ENV}', envName);
    const envEl = await $(envSelector);

    try {
      await scrollToElement(envEl);
    } catch {
      return;
    }
    await driver.pause(600);
    await this.waitAndClick(envEl);
  }

  /**
   * Returns the target app environment name to select on the Environment screen.
   *
   * Set in `.env` as:
   *   APP_ENV=ST
   * or override via process env.
   */
  getSelectedAppEnv(): AppEnv | undefined {
    const raw = clean(process.env.APP_ENV);
    if (!raw) return undefined;

    const allowed: AppEnv[] = ['DEV', 'ST', 'UAT'];
    const match = allowed.find((v) => v.toLowerCase() === raw.toLowerCase());
    return match;
  }
}

/**
 * Maps APP_ENV to the matching LoginCredentials key in logindata.json.
 *   DEV  → CredentialsDev
 *   ST   → CredentialsST
 *   UAT  → CredentialsUAT
 *
 * Falls back to CredentialsDev if APP_ENV is unset or unrecognised.
 */
const envToCredentialKey: Record<string, string> = {
  dev: 'CredentialsDev',
  st: 'CredentialsST',
  uat: 'CredentialsUAT',
};

export function getLoginCredentials(): { email: string; password: string } {
  // Priority 1: LOGIN_EMAIL / LOGIN_PASSWORD from .env (or process env)
  const envEmail = clean(process.env.LOGIN_EMAIL);
  const envPassword = clean(process.env.LOGIN_PASSWORD);

  if (envEmail && envPassword) {
    console.log(`[Credentials] Using .env overrides (LOGIN_EMAIL=${envEmail})`);
    return { email: envEmail, password: envPassword };
  }

  // Priority 2: JSON credentials based on APP_ENV
  const raw = clean(process.env.APP_ENV).toLowerCase();
  const key = envToCredentialKey[raw] || 'CredentialsDev';
  const creds = (loginData.loginPageConfig as any)[key];

  if (!creds) {
    throw new Error(
      `No credentials found for key "${key}" in logindata.json (APP_ENV=${process.env.APP_ENV})`,
    );
  }

  console.log(`[Credentials] APP_ENV=${process.env.APP_ENV} → using ${key} (${creds.email})`);
  return creds;
}
