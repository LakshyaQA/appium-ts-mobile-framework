# Step-by-Step Guide: Creating Cross-Platform Appium Tests 📱

This guide is designed to help you automate new screens and features in the **Appium TS Mobile Framework**
from scratch. Because you are testing on both Android and iOS, this framework uses the **Page Object Model
(POM)** with a smart locator proxy to automatically pick the correct element selectors based on the device
running the test.

Whenever you want to automate a new feature (e.g., a "Checkout" flow), you need to create three core files.

---

## 🏗️ 1. Test Data JSON (`tests/testdata/[name]data.json`)

This file is the single source of truth for both your input data (like strings to type) and your app element
locators (like XPaths). Keeping them here prevents your test code from getting messy.

### How to set up test data

1. Create a `.json` file in `tests/testdata/`. Let's assume you're automating `checkout`, so name it
   `checkoutdata.json`.
2. Define a root object (e.g., `"checkoutConfig"`).
3. Add a section for your actual testing inputs (`"TestData"`).
4. **Crucial:** Add two exact objects named exactly `"AppLocatorsAndroid"` and `"AppLocatorsIos"` (or similar
   names, as long as they are separated by OS).
5. Map exactly the same keys (e.g., `checkout_btn`) to the different XPaths for iOS and Android.

**Example Structure:**

```json
{
  "checkoutConfig": {
    "TestData": { "discountCode": "SAVE20" },
    "AppLocatorsAndroid": {
      "checkout_btn": "//android.widget.Button[@text='CHECKOUT']",
      "discount_input": "//android.widget.EditText[@resource-id='discount']"
    },
    "AppLocatorsIos": {
      "checkout_btn": "(//XCUIElementTypeButton[@name='CHECKOUT'])[last()]",
      "discount_input": "//XCUIElementTypeTextField[@name='discount']"
    }
  }
}
```

---

## 🗺️ 2. Page Object Model (`pages/[Name]Page.ts`)

This file represents the app screen. It contains reusable actions (like `fillDiscount()`), so your tests don't
have to worry about how the clicks happen, only what is happening.

### How to implement the Page Object

1. In `pages/`, create a new class extending `BasePage` (e.g., `CheckoutPage.ts`).
2. Import your newly created JSON data file at the top using `with { type: 'json' }`.
3. In the `constructor()`, check `browser.isAndroid` to decide whether to load the Android or iOS locators
   block from your JSON file.
4. Pass that chosen block into `buildLocatorProxy(...)` and assign it to `this.locators`.
5. Now create functions! Use `this.locators.checkout_btn()` anywhere to dynamically return the native element.
6. Use built-in `<BasePage>` methods like `this.waitAndClick()`, `this.typeValue()`, and
   `this.hideSystemKeyboard()` for rock-solid stability.

**Example Structure:**

```typescript
import testData from '../tests/testdata/checkoutdata.json' with { type: 'json' };
import { browser } from '@wdio/globals';
import { BasePage, buildLocatorProxy } from '../Base/BasePage.ts';

export class CheckoutPage extends BasePage {
  private locators: Record<string, () => WebdriverIO.Element>;

  constructor() {
    super();
    // 1. Pick the correct locators based on the active OS
    const locatorsBlock = browser.isAndroid
      ? testData.checkoutConfig.AppLocatorsAndroid
      : testData.checkoutConfig.AppLocatorsIos;

    // 2. Build the locators proxy
    this.locators = buildLocatorProxy(locatorsBlock);
  }

  // 3. Write your screen actions
  async clickCheckout() {
    await this.waitAndClick(this.locators.checkout_btn());
  }

  async enterDiscount(code: string) {
    await this.typeValue(this.locators.discount_input(), code);
    await this.hideSystemKeyboard(); // Essential for Android
  }

  // Expose the raw Webdriver element for expect() assertions in the spec!
  getCheckoutButtonElement() {
    return this.locators.checkout_btn();
  }
}
```

---

## 🧪 3. The Test Spec (`tests/[name].spec.ts`)

This is the file you run using WebdriverIO. It ties your JSON data and your Page Object together into a linear
test script.

### How to write the Spec file

1. In `tests/`, create `checkout.spec.ts`.
2. Import `browser`, `expect`, your Page class, and the generic `step()` helper from
   `../Base/utils/stepHelper.ts`.
3. Set up a Mocha `describe` block, and initialize the Page class instance in the `before()` block.
4. Write `it` blocks for each test case. (Consider appending `TestTag.SMOKE` so you can grep it later!).
5. Wrap your actions in `await step('description', async () => { ... })` so that they appear cleanly in
   BrowserStack and Allure reports.
6. Use WebdriverIO standard assertions like `await expect(element).toBeDisplayed()`.

**Example Structure:**

```typescript
// @ts-nocheck
import { CheckoutPage } from '../pages/CheckoutPage.ts';
import { browser, expect } from '@wdio/globals';
import testData from './testdata/checkoutdata.json' with { type: 'json' };
import { step } from '../Base/utils/stepHelper.ts';

let checkoutPage: CheckoutPage;

describe('Checkout Flow', () => {
  before(async () => {
    checkoutPage = new CheckoutPage(); // Page object initialized
  });

  it('Should successfully apply discount code', async function () {
    this.retries(0); // Optional: if the test fails immediately, do not retry

    await step('Enter the discount code', async () => {
      const code = testData.checkoutConfig.TestData.discountCode;
      await checkoutPage.enterDiscount(code);
    });

    await step('Verify checkout button becomes visible', async () => {
      await expect(checkoutPage.getCheckoutButtonElement()).toBeDisplayed({ wait: 15000 });
    });

    await step('Proceed to checkout', async () => {
      await checkoutPage.clickCheckout();
    });
  });
});
```

---

## 🚀 Running Your Test

When your three files are complete, you can temporarily instruct the runner to run ONLY your new file by
changing the `APP_ENV` or `package.json` configurations, or relying on `grep` matching your TestTags.

Make sure you run your test against **Appium Inspector** (`npm run android:inspect` in your setup) first to
capture and test those XPaths actively on the device!
