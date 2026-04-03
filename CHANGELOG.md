# Changelog - Appium TS Mobile Framework

All notable changes to this project will be documented in this file. This project is currently in active
modernization and standardization mode.

---

## [2026-04-03] - Framework V1.1 & Visual Documentation

### 🚀 Features & Enhancements

- **Project Rebranding (Final)**: Officially rebranded the framework to **Appium TS Mobile Framework** across
  all configuration files, documentation, and the `SecurityManager`.
- **Enhanced Visual Documentation**:
  - Added **Appium Inspector Execution Screenshot** to `README.md`.
  - Added **Framework Execution Video** to `README.md`.
- **Appium Inspector Optimization**:
  - Improved session visibility by moving the inspection pause to the `before` hook (ensuring an active
    session ID is generated).
  - Added `appium:newCommandTimeout` (3600s) for extended inspection sessions.
- **Reliable Startup & Cleanup**:
  - Consolidated emulator shutdown logic into a unified `shutdownEmulator` utility.
  - Refined `SIGINT` (Ctrl+C) handling to ensure the emulator closes even when the process is interrupted.
- **Zero-Setup AutoHotkey (AHK)**:
  - Implemented automated detection and download of a portable AHK binary.
  - Users no longer need to install AHK manually; the framework handles it on the first run.
- **Reliable Emulator Positioning**:
  - `LOCAL_APPIUM=true`
  - `APP_ENV=DEV` (or ST/UAT)
  - `ANDROID_DEVICE_NAME=Test_Phone_API_36.1` (or your AVD name)
  - Created `scripts/fix_emulator_position.ahk` to snap the emulator window to precise coordinates
    (`1300, 0`).
  - Integrated AHK trigger directly into the WebdriverIO launch lifecycle.
- **Enterprise Emulator Flags**: Updated launch flags to `-no-snapshot-load` and `-no-boot-anim` to ensure
  faster, clean-state boots for every test run.

### 🛠️ Refactoring & Modernization

- **Emulator Launch Sequence**: Stripped out complex, unreliable window-watcher scripts and `ini` pre-writing
  strategies in favor of a lean, robust Node-based spawn logic.
- **Inspection Mode**: Refactored "Appium Inspector Mode" to use the `beforeSession` configuration hook,
  removing the need for a dedicated `pause.spec.ts` file.
- **Directory Organization**: Moved AHK binaries into a dedicated `scripts/autohotkey/` subfolder and cleaned
  up installation junk.

### 💎 Code Quality & Maintenance

- **Linting (ESLint)**: Integrated ESLint with a custom rule to warn (rather than error) on the use of `.only`
  and `.skip` in test files.
- **Formatting (Prettier)**: Applied Prettier globally to ensure consistent code style across the entire
  repository.
- **Git Hooks (Husky)**: Configured Husky and `lint-staged` to automatically run linting and formatting on
  changed files before every commit.

### 🧹 Clean-up

- Deleted redundant positioning data: `.emulator_pos.json`.
- Deleted legacy PowerShell positioning script: `capture_emu_pos.ps1`.
- Deleted specialized "pause" spec: `pause.spec.ts`.

### 📝 Documentation

- **README.md Overhaul**: Complete rewrite featuring an in-depth architecture guide, command tables, and AHK
  implementation details.
- **Zero-Setup Guide**: Updated `pre-req setup.txt` to reflect the new automated environment setup.
