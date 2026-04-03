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
import path from 'node:path';
import { execSync, spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
import os from 'node:os';
import { config as sharedConfig } from './wdio.shared.conf.ts';

// reconstruct __dirname for ESM modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// -----------------------------------------------------------
// -----------local-------------
// -----------------------------------------------------------
// Run tests through a local Appium server instead of BrowserStack
const IS_LOCAL_APPIUM = String(process.env.LOCAL_APPIUM || '').toLowerCase() === 'true';

// if running locally we may want to auto-launch an emulator
const startEmulatorIfNeeded = () => {
  try {
    const out = execSync('adb devices').toString();
    const lines = out.trim().split(/\r?\n/);
    const hasDevice = lines.some((l) => l.trim().endsWith('device') && !l.startsWith('List'));

    if (hasDevice) {
      console.log('[WDIO] ✓ device already connected');
      return;
    }

    // no device found, try to launch one
    let emulatorPath: string | undefined;
    const sdkRoot = process.env.ANDROID_SDK_ROOT || process.env.ANDROID_HOME;

    if (sdkRoot) {
      emulatorPath = path.join(sdkRoot, 'emulator', 'emulator.exe');
      if (!fs.existsSync(emulatorPath)) emulatorPath = undefined;
    }

    if (!emulatorPath) {
      const homeDir = process.env.LOCALAPPDATA || '';
      emulatorPath = path.join(homeDir, 'AppData', 'Local', 'Android', 'Sdk', 'emulator', 'emulator.exe');
      if (!fs.existsSync(emulatorPath)) emulatorPath = undefined;
    }

    if (!emulatorPath) {
      console.warn('[WDIO] emulator binary not found');
      return;
    }

    // get AVD name
    let avd: string | undefined;
    try {
      const list = execSync(`"${emulatorPath}" -list-avds`).toString().trim().split(/\r?\n/);
      avd = list[0];
    } catch {}

    if (!avd) {
      console.warn('[WDIO] no AVD found');
      return;
    }

    // Automated AutoHotkey Setup (Enterprise Zero-Setup)
    const ahkDir = path.resolve(__dirname, '../scripts/autohotkey');
    const ahkExe = path.join(ahkDir, 'AutoHotkey.exe');
    const ahkScript = path.resolve(__dirname, '../scripts/fix_emulator_position.ahk');
    if (!fs.existsSync(ahkExe) && process.platform === 'win32') {
      console.log('[WDIO] 🛠️ AutoHotkey missing - performing zero-setup automated download...');
      try {
        if (!fs.existsSync(ahkDir)) fs.mkdirSync(ahkDir, { recursive: true });
        const setupCmd = `powershell -NoProfile -ExecutionPolicy Bypass -Command "$zip='${path.join(os.tmpdir(), 'ahk.zip')}'; $url='https://www.autohotkey.com/download/ahk.zip'; $dest='${ahkDir}'; [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; Invoke-WebRequest -Uri $url -OutFile $zip; Expand-Archive -Path $zip -DestinationPath $dest -Force; Move-Item -Path (Join-Path $dest 'AutoHotkeyU64.exe') -Destination '${ahkExe}' -Force; Remove-Item -Path $zip; Get-ChildItem -Path $dest -Exclude 'AutoHotkey.exe' | Remove-Item -Recurse -Force; [console]::Beep(1000, 200)"`;
        execSync(setupCmd, { stdio: 'inherit', timeout: 60000 });
        console.log('[WDIO] ✓ AutoHotkey setup complete');
      } catch (err) {
        console.warn('[WDIO] ⚠️ AutoHotkey setup failed:', (err as Error).message);
      }
    }

    console.log(`[WDIO] auto-launching emulator: ${avd}`);

    // spawn emulator detached with enterprise flags
    const child = spawn(
      emulatorPath,
      ['-avd', avd, '-no-snapshot-load', '-no-boot-anim', '-no-snapshot-save', '-no-audio'],
      {
        detached: true,
        stdio: 'ignore',
        windowsHide: false,
      },
    );
    child.unref();

    // Trigger AHK positioning script if available
    if (fs.existsSync(ahkExe) && fs.existsSync(ahkScript)) {
      console.log('[WDIO] 📍 triggering AHK positioning script...');
      spawn(ahkExe, [ahkScript], { detached: true, stdio: 'ignore' }).unref();
    }

    // wait up to 120s for device to appear
    console.log('[WDIO] waiting up to 120s for emulator to boot...');
    const startTime = Date.now();
    let found = false;
    while (Date.now() - startTime < 120000) {
      try {
        const devices = execSync('adb devices').toString();
        const hasDevice = devices
          .split(/\r?\n/)
          .some((l) => l.trim().endsWith('device') && !l.startsWith('List'));
        if (hasDevice) {
          const bootCompleted = execSync('adb shell getprop sys.boot_completed', { stdio: 'pipe' })
            .toString()
            .trim();
          if (bootCompleted === '1') {
            console.log('[WDIO] ✓ emulator booted and connected');
            found = true;
            break;
          }
        }
      } catch {}
      const elapsed = Math.round((Date.now() - startTime) / 1000);
      if (elapsed % 10 === 0) console.log(`[WDIO] waiting... ${elapsed}s`);
      const now = Date.now();
      while (Date.now() - now < 2000) {}
    }

    if (!found) {
      console.error('[WDIO] ❌ Emulator did not boot within 120s / remains offline.');
    }
  } catch (e) {
    console.warn('[WDIO] auto-launch failed:', (e as Error).message);
  }
};

// Only auto-launch the emulator in the main WDIO launcher process.
if (IS_LOCAL_APPIUM && !process.env.WDIO_WORKER_ID) {
  startEmulatorIfNeeded();
}

// source of the APK on disk when running locally.
const LOCAL_ANDROID_APP =
  process.env.LOCAL_ANDROID_APP_PATH || path.resolve(__dirname, '../General-Store.apk');

// device name & platform version can be overridden via env
let LOCAL_ANDROID_DEVICE = process.env.ANDROID_DEVICE_NAME || 'emulator-5554';
let LOCAL_ANDROID_PLATFORM = process.env.ANDROID_PLATFORM_VERSION || '16.0';

if (IS_LOCAL_APPIUM && (!LOCAL_ANDROID_DEVICE || !LOCAL_ANDROID_PLATFORM)) {
  try {
    const out = execSync('adb devices -l').toString().trim();
    const first = out.split(/\r?\n/).find((l) => /emulator/.test(l) && /device/.test(l));
    if (first && !LOCAL_ANDROID_DEVICE) LOCAL_ANDROID_DEVICE = first.split(/\s+/)[0];
    if (!LOCAL_ANDROID_PLATFORM && LOCAL_ANDROID_DEVICE) {
      const ver = execSync(`adb -s ${LOCAL_ANDROID_DEVICE} shell getprop ro.build.version.release`)
        .toString()
        .trim();
      if (ver) LOCAL_ANDROID_PLATFORM = ver;
    }
  } catch (e) {}
}

// default fallbacks if still empty
LOCAL_ANDROID_DEVICE = LOCAL_ANDROID_DEVICE || 'emulator-5554';
LOCAL_ANDROID_PLATFORM = LOCAL_ANDROID_PLATFORM || '16.0';

// -----------------------------------------------------------
// -----------browserstack--------------
// -----------------------------------------------------------
const tagEnvA = process.env.TEST_TAGS || '';
const isSmokeA = /smoke/i.test(tagEnvA);
const isRegressionA = /regression/i.test(tagEnvA);
const runPrefixA =
  isSmokeA && isRegressionA
    ? 'smoke+regression run'
    : isSmokeA
      ? 'smoke run'
      : isRegressionA
        ? 'regression run'
        : '';
const baseBuildNameA = process.env.BUILD_NAME || 'Android Build';
const effectiveBuildNameA = runPrefixA ? `${runPrefixA} ${baseBuildNameA}` : baseBuildNameA;

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
          platformName: 'Android',
          'appium:deviceName': LOCAL_ANDROID_DEVICE,
          'appium:platformVersion': LOCAL_ANDROID_PLATFORM,
          'appium:automationName': 'UIAutomator2',
          'appium:app': LOCAL_ANDROID_APP,
          'appium:autoGrantPermissions': true,
          'appium:ignoreHiddenApiPolicyError': true,
        }
      : {
          // -----------browserstack--------------
          platformName: 'Android',
          'appium:deviceName': process.env.BS_DEVICE_NAME || 'Google Pixel 10 Pro',
          'appium:platformVersion': process.env.BS_PLATFORM_VERSION || '16.0',
          'appium:automationName': 'UIAutomator2',
          'appium:app': process.env.BS_ANDROID_APP_URL,
          'appium:bundleId': '', // Update with your app's bundle ID if testing a pre-installed app
          // For pre-installed apps, set via env:
          //'appium:appPackage': process.env.ANDROID_APP_PACKAGE,
          //'appium:appActivity': '.MainActivity', // Used for Pre-Installed apps
          'appium:autoGrantPermissions': true,
          'bstack:options': {
            osVersion: '16.0',
            projectName: process.env.PROJECT_NAME || 'OmniMobile Test Framework',
            buildName: effectiveBuildNameA,
            buildIdentifier: process.env.BUILD_IDENTIFIER || process.env.BUILD_ID || process.env.BUILD_NUMBER,
            realMobile: true,
            debug: true,
            networkLogs: true,
            video: true,
            interactiveDebugging: true,
          },
        },
  ],

  onComplete: async function (exitCode, config, capabilities, results) {
    // -----------local-------------
    const g: any = globalThis as any;
    if (IS_LOCAL_APPIUM && !g.__EMU_SHUTDOWN_DONE) {
      g.__EMU_SHUTDOWN_DONE = true;

      console.log('[WDIO] shutting down emulator...');
      try {
        const dev = String(LOCAL_ANDROID_DEVICE || 'emulator-5554');
        // Use a slightly longer timeout and suppress output
        execSync(`adb -s ${dev} emu kill`, { stdio: 'ignore', timeout: 5000 });
        console.log('[WDIO] ✓ emulator closed');
      } catch (e) {
        if (process.platform === 'win32') {
          try {
            console.log('[WDIO] attempting force-kill...');
            execSync('taskkill /F /IM qemu-system-x86_64.exe /T', { stdio: 'ignore' });
            execSync('taskkill /F /IM emulator.exe /T', { stdio: 'ignore' });
            console.log('[WDIO] ✓ emulator processes force-killed');
          } catch {}
        }
      }
    }

    // -----------browserstack + common--------------
    // Always delegate to shared config's onComplete for BrowserStack + summary report
    if (typeof sharedConfig.onComplete === 'function') {
      await (sharedConfig.onComplete as Function)(exitCode, config, capabilities, results);
    }
  },
};

// Handle Ctrl+C (SIGINT) to ensure emulator cleanup
if (IS_LOCAL_APPIUM) {
  process.on('SIGINT', () => {
    console.log('\n[WDIO] Interrupted! Cleaning up...');
    try {
      const dev = String(LOCAL_ANDROID_DEVICE || 'emulator-5554');
      execSync(`adb -s ${dev} emu kill`, { stdio: 'pipe', timeout: 2000 });
    } catch {}
    if (process.platform === 'win32') {
      try {
        execSync('taskkill /F /IM qemu-system-x86_64.exe /T', { stdio: 'ignore' });
      } catch {}
      try {
        execSync('taskkill /F /IM emulator.exe /T', { stdio: 'ignore' });
      } catch {}
    }
    process.exit(130);
  });
}
