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
import { config as sharedConfig } from './wdio.shared.conf.ts';

// -----------------------------------------------------------
// -----------local-------------
// -----------------------------------------------------------
// Run tests through a local Appium server instead of BrowserStack
const IS_LOCAL_APPIUM = String(process.env.LOCAL_APPIUM || '').toLowerCase() === 'true';
const LOCAL_IOS_APP = process.env.LOCAL_IOS_APP_PATH || '';
const LOCAL_IOS_DEVICE = process.env.IOS_DEVICE_NAME || 'iPhone Simulator';
const LOCAL_IOS_PLATFORM = process.env.IOS_PLATFORM_VERSION || '17.0';
// -----------------------------------------------------------
// -----------browserstack--------------
// -----------------------------------------------------------
const tagEnvI = process.env.TEST_TAGS || '';
const isSmokeI = /smoke/i.test(tagEnvI);
const isRegressionI = /regression/i.test(tagEnvI);
const runPrefixI =
  isSmokeI && isRegressionI
    ? 'smoke+regression run'
    : isSmokeI
      ? 'smoke run'
      : isRegressionI
        ? 'regression run'
        : '';
const baseBuildNameI = process.env.BUILD_NAME || 'iOS Build';
const effectiveBuildNameI = runPrefixI ? `${runPrefixI} ${baseBuildNameI}` : baseBuildNameI;

// -----------------------------------------------------------
// -----------configuration--------------
// -----------------------------------------------------------
export const config = {
  ...sharedConfig,
  user: IS_LOCAL_APPIUM ? undefined : process.env.BROWSERSTACK_USERNAME,
  key: IS_LOCAL_APPIUM ? undefined : process.env.BROWSERSTACK_ACCESS_KEY,
  hostname: IS_LOCAL_APPIUM ? '127.0.0.1' : 'hub.browserstack.com',

  capabilities: [
    IS_LOCAL_APPIUM
      ? {
          // -----------local-------------
          platformName: 'iOS',
          'appium:deviceName': LOCAL_IOS_DEVICE,
          'appium:platformVersion': LOCAL_IOS_PLATFORM,
          'appium:automationName': 'XCUITest',
          'appium:app': LOCAL_IOS_APP,
          'appium:autoAcceptAlerts': true,
          'appium:autoGrantPermissions': true,
        }
      : {
          // -----------browserstack--------------
          platformName: 'iOS',
          'appium:deviceName': process.env.BS_IOS_DEVICE_NAME || 'iPhone 17 Pro',
          'appium:platformVersion': process.env.BS_IOS_PLATFORM_VERSION || '26.2',
          'appium:automationName': 'XCUITest',
          'appium:app': process.env.BS_IOS_APP_URL,
          'appium:bundleId': process.env.IOS_BUNDLE_ID || '',
          'appium:autoAcceptAlerts': true,
          'appium:autoGrantPermissions': true,
          'bstack:options': {
            projectName: process.env.PROJECT_NAME || 'OmniMobile Test Framework',
            buildName: effectiveBuildNameI,
            networkLogs: true,
            video: true,
            interactiveDebugging: true,
          },
        },
  ],
};
