# Local Android Testing Prerequisites

To run tests on a local Android emulator, follow these setup steps:

## 1. Java Development Kit (JDK)

- **Install JDK 17 or 21** (e.g., from [Eclipse Adoptium](https://adoptium.net/)).
- Set the `JAVA_HOME` environment variable to your JDK installation path.
- Add `%JAVA_HOME%\bin` to your system `PATH`.

## 2. Android Studio & SDK

- Install [Android Studio](https://developer.android.com/studio).
- Open **SDK Manager** and install:
  - Android SDK Platform (e.g., Android 13 or 14).
  - Android SDK Build-Tools.
  - Android SDK Platform-Tools (which includes `adb`).
  - Android Emulator.
- Set the `ANDROID_HOME` (or `ANDROID_SDK_ROOT`) environment variable to your SDK path (usually
  `C:\Users\<YourUser>\AppData\Local\Android\Sdk`).
- Add these to your system `PATH`:
  - `%ANDROID_HOME%\platform-tools`
  - `%ANDROID_HOME%\emulator`

## 3. Appium Server

- Install Appium globally using npm:

  ```bash
  npm install -g appium
  ```

- Verify installation: `appium -v`

## 4. Appium Driver (UiAutomator2)

- Install the Android driver via Appium:

  ```bash
  appium driver install uiautomator2
  ```

## 5. Android Emulator (AVD)

- In Android Studio, open **Virtual Device Manager**.
- Create a device (e.g., Pixel 7) with a system image matching your testing needs.
- Note the **AVD Name** (e.g., `Test_Phone_API_36.1`).
- Update your `.env` file with `ANDROID_DEVICE_NAME="Your_AVD_Name"`.

## 6. Project Configuration (.env)

- Set `LOCAL_APPIUM=true` in your `.env` file to run against the local emulator.
- Set `APP_ENV=DEV` (or ST/UAT) to select the target environment and credentials.
- If you want to run on BrowserStack, set `LOCAL_APPIUM=false`.

---

## 7. Windows Only: Automated Emulator Positioning (AHK)

This framework features a **Zero-Setup** window positioning system for the Android emulator.

- You do **not** need to install AutoHotkey manually.
- On the first run of `npm run local:android`, the framework will automatically download a portable AHK binary
  and use it to snap the emulator window to the correct coordinates for consistent testing.

---

## Local iOS Testing Prerequisites (Mac Only)

To run iOS tests locally, you **must use a Mac environment**. iOS simulators and the XCUITest driver cannot be
run natively on Windows.

### 1. Xcode & Command Line Tools

- Install **Xcode** from the Mac App Store.
- Once installed, open Xcode and install any prompted additional components.
- Install the Xcode Command Line Tools:

  ```bash
  xcode-select --install
  ```

### 2. Appium XCUITest Driver

- Install Appium (if not already installed):

  ```bash
  npm install -g appium
  ```

- Install the iOS driver (XCUITest) via Appium:

  ```bash
  appium driver install xcuitest
  ```

### 3. iOS Simulator Setup

- Open Xcode, go to **Window > Devices and Simulators**.
- In the **Simulators** tab, ensure you have a standard simulator (e.g., iPhone 15 Pro, iOS 17) downloaded.
- Note the exactly spelt **Device Name** (e.g., `iPhone 15 Pro`).
- Update your `.env` file with `IOS_DEVICE_NAME="iPhone 15 Pro"`.

### 4. Environment & Dependencies for Mac

You may need additional tools for Appium to interact with real devices or simulators:

- Install **Carthage** (used by WebDriverAgent):

  ```bash
  brew install carthage
  ```

- _Optional (but recommended) - Appium Doctor_:

  ```bash
  npm install -g @appium/doctor
  appium-doctor --ios
  ```

  Resolve any mandatory missing dependencies it flags.

### 5. iOS Project Configuration (.env)

- Ensure `LOCAL_APPIUM=true` in your `.env` file.
- Update `LOCAL_IOS_APP_PATH` with the absolute path to your `.app` file (Note: iOS Simulators require `.app`
  files, not `.ipa`).

---

## Running Tests

### Android

- **Local Emulator**: `npm run android:ap`
- **BrowserStack**: `npm run android:bs`
- **BrowserStack Local (Tunnel)**: `npm run local:android`

### iOS

- **Local Simulator (Mac Only)**: `npm run ios:ap`
- **BrowserStack**: `npm run ios:bs`
- **BrowserStack Local (Tunnel)**: `npm run local:ios`
