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

/**
 * Dismiss or accept iOS system alerts (like location, camera, or notifications)
 */
import testData from '../data/testData.json' with { type: 'json' };
import { $ } from '@wdio/globals';

// iOS-only handler using predicate template and configured button names
export async function handleIOSSystemAlerts() {
  const cfg = (testData as any)?.Utilities?.alertsHelper?.AlertsHelperIos || {};
  const alertButtons: string[] = cfg.buttonNames || [];
  const predicateTemplate: string =
    cfg.buttonPredicateTemplate ||
    '-ios predicate string:type == "XCUIElementTypeButton" AND name == "{NAME}"';

  for (const btnName of alertButtons) {
    try {
      // @ts-ignore: WDIO global `$` is provided at runtime
      const predicate = predicateTemplate.replace('{NAME}', btnName);
      const button = await $(predicate);
      if (await button.isDisplayed()) {
        await button.click();
        console.log(`Tapped iOS system alert button: ${btnName}`);
        break;
      }
    } catch (err) {}
  }
}
