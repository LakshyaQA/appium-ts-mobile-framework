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
import { browser as driver } from '@wdio/globals';
import { LoginPage } from '../../pages/LoginPage.ts';
import testData from '../../tests/testdata/logindata.json' with { type: 'json' };
type Credentials = { email: string; password: string };
import { handleIOSSystemAlerts } from './alertsHelper.ts';
import { EnvHelper, getLoginCredentials } from './envHelper.ts';

//Not using currently but can be useful in future implementations
// const forceLogin =
//   String(process.env.FORCE_LOGIN || '').toLowerCase() === 'true' || process.env.FORCE_LOGIN === '1';

// Flatten login data mapping: support both nested and flat shapes (using imported testData)
// const loginData = (testData as any).loginPageConfig ?? (testData as any);

let sessionIsBroken = false;
let currentUser: Credentials | null = null;
let skipDefaultLogin = false;

function getDefaultLogin(): Credentials {
  return getLoginCredentials();
}

const userMap = {
  EligibleUser: testData.loginPageConfig.EligibleUser,
  NotEligibleUser: testData.loginPageConfig.NotEligibleUser,
  get LoginCredentials() {
    return getLoginCredentials();
  },
};

export function getCurrentUser() {
  return currentUser;
}

export function markSessionBroken() {
  sessionIsBroken = true;
}

export function setSkipDefaultLogin(skip: boolean) {
  skipDefaultLogin = !!skip;
}

// Clears in-memory auth/session tracking. Useful when starting a fresh WDIO session (reloadSession)
// so ensureDefaultLogin doesn't assume an old logged-in state.
export function resetSessionTracking() {
  sessionIsBroken = false;
  currentUser = null;
}
// If error occurs next test should recover session and shouldnt impact due to failure
async function softRestartApp() {
  const isLocal = String(process.env.LOCAL_APPIUM || '').toLowerCase() === 'true';
  if (isLocal) {
    console.log('[Session] Skipping softRestartApp for local emulator run (BrowserStack only).');
    return;
  }

  await driver.pause(2000);

  // Clear app data so the app starts completely fresh (not from the last screen).
  // 'mobile: clearApp' is supported on BrowserStack's Appium and resets all app state.
  const caps: any = (driver as any).capabilities || {};
  let appId;
  if (driver.isAndroid) {
    appId = caps['appium:appPackage'] || caps.appPackage || caps?.app_details?.app_package;
  } else if (driver.isIOS) {
    appId = caps['appium:bundleId'] || caps.bundleId;
  }

  try {
    if (driver.isAndroid) {
      if (appId) {
        await driver.execute('mobile: clearApp', { appId });
      } else {
        await driver.execute('mobile: clearApp', {});
      }
    } else if (driver.isIOS) {
      if (appId) {
        await driver.execute('mobile: clearApp', { bundleId: appId });
      }
    }
  } catch (e) {
    // clearApp may not be supported; continue with closeApp/launchApp
  }

  // Relaunch the app after clearing data
  try {
    if (appId) {
      try {
        await driver.execute('mobile: terminateApp', { appId });
      } catch (e) {} // Ignore if already terminated
      await driver.execute('mobile: activateApp', { appId });
    } else {
      await driver.closeApp();
      await driver.launchApp();
    }
  } catch (e) {
    console.warn('[Session] softRestartApp failed', e);
  }
}

export async function startSession(name?: string) {
  // Just relaunch app cleanly
  await softRestartApp();

  if (name && String(process.env.LOCAL_APPIUM || '').toLowerCase() !== 'true') {
    try {
      await driver.execute(
        'browserstack_executor: {"action": "setSessionName", "arguments": {"name": "' +
          String(name).replace(/"/g, "'") +
          '"}}',
      );
    } catch {}
  }

  if (driver.isIOS) {
    await handleIOSSystemAlerts();
  }
}

export async function switchUser(credentials: Credentials, name?: string) {
  if (currentUser && currentUser.email === credentials.email) return;

  console.log(`[Session] Switching to user: ${credentials.email}`);

  const switchingBetweenDifferentUsers = Boolean(currentUser && currentUser.email !== credentials.email);

  if (switchingBetweenDifferentUsers) {
    // When switching between two distinct users in the same run, the app is often
    // already authenticated and the login UI won't be present. Reset the app so
    // we land on a clean state where LoginPage can find its locators without
    // changing LoginPage.ts or shared config hooks.
    await softRestartApp();

    // Give the app a moment to settle and handle any iOS system alerts
    await driver.pause(1500);
    if (driver.isIOS) {
      await handleIOSSystemAlerts();
    }
  } else {
    // First login in a fresh run (or recovering a broken session)
    await startSession(name);
  }

  const loginPage = new LoginPage();
  if (driver.isIOS) {
    await handleIOSSystemAlerts();
  }
  // await loginPage.clickproceed_btn();
  // const envHelper = new EnvHelper();
  // await envHelper.switchEnv();
  // await loginPage.navigateToLoginPage();
  // await loginPage.login(credentials);
  // await loginPage.verifyPromoScreenOrHomeScreenIsVisible();
  // // // Allow UI to settle, then scroll down and back up before checking notification
  // await driver.pause(1500);
  // await loginPage.scrollDownAndUp();
  // await driver.pause(800);
  // await loginPage.clickCloseNotificationPopUp();

  currentUser = credentials;
  sessionIsBroken = false;
}

export async function switchToUserTag(userTag: keyof typeof userMap) {
  const user = userMap[userTag];
  if (!user) throw new Error(`Unknown user tag: ${userTag}`);
  await switchUser(user);
}

export async function ensureDefaultLogin(name?: string) {
  if (skipDefaultLogin) return;

  if (sessionIsBroken) {
    await softRestartApp();
    sessionIsBroken = false;
    currentUser = null;
  }

  const defaultUser = getDefaultLogin();
  if (!currentUser || currentUser.email !== defaultUser.email) {
    await switchUser(defaultUser, name);
  }
}

// For tests that manage authentication themselves (e.g., login specs)
// recover a broken session without performing any login.
export async function recoverBrokenSessionIfNeeded(name?: string) {
  if (!sessionIsBroken) return;
  await startSession(name);
  sessionIsBroken = false;
  currentUser = null;
}
