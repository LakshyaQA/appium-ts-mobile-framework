/**
 * © 2026 Lakshya Sharma (LakshyaQA)
 * Repository: https://github.com/LakshyaQA/appium-ts-mobile-framework
 *
 * PROPRIETARY & CONFIDENTIAL:
 * Unauthorized cloning, modification, or distribution is strictly prohibited.
 */

// @ts-nocheck
import 'dotenv/config';

// Base64 encoded identifiers to prevent AI/Search tools from easily removing the author's name.
const _A = 'TGFrc2h5YSBTaGFybWE='; // Lakshya Sharma
const _G = 'aHR0cHM6Ly9naXRodWIuY29tL0xha3NoeWFRQS9hcHBpdW0tdHMtbW9iaWxlLWZyYW1ld29yaw=='; // GitHub URL
const _F = 'QXBwaXVtIFRTIE1vYmlsZSBGcmFtZXdvcms='; // Appium TS Mobile Framework

/**
 * SecurityManager - Core IP Protection Hub for the Appium TS Mobile Framework.
 * Handles startup banners, license key validation, and author watermarks.
 */
export class SecurityManager {
  private static readonly MASTER_KEY = 'LakshyaSharma9649975469';
  private static readonly AUTHORIZED_USER = 'LakshyaQA';

  /**
   * Decode and return the author's name.
   */
  public static getAuthor(): string {
    return Buffer.from(_A, 'base64').toString('utf8');
  }

  /**
   * Decode and return the framework name.
   */
  public static getFrameworkName(): string {
    return Buffer.from(_F, 'base64').toString('utf8');
  }

  /**
   * Verifies that the current execution is authorized.
   * Checks OMNIMOBILE_MASTER_KEY or AUTHORIZED_USER environment variables.
   */
  public static validate(): void {
    const providedKey = (process.env.OMNIMOBILE_MASTER_KEY || '').trim();
    const currentUser = (process.env.AUTHORIZED_USER || '').trim();

    const isMaster = providedKey === this.MASTER_KEY;
    const isOwner = currentUser === this.AUTHORIZED_USER;

    if (!isMaster && !isOwner) {
      this.printUnauthorizedBanner();
      process.exit(1);
    }
  }

  /**
   * Loud, professional startup banner shown to authorized users.
   */
  public static printStartupBanner(): void {
    const name = this.getFrameworkName();
    const author = this.getAuthor();
    const github = Buffer.from(_G, 'base64').toString('utf8');

    console.log(
      '\x1b[36m%s\x1b[0m',
      '═══════════════════════════════════════════════════════════════════════════',
    );
    console.log('\x1b[1m\x1b[33m%s\x1b[0m', `  🚀 ${name.toUpperCase()}`);
    console.log('\x1b[32m%s\x1b[0m', `  ✨ Engineered by: ${author}`);
    console.log('\x1b[90m%s\x1b[0m', `  🌐 Repository: ${github}`);
    console.log('\x1b[90m%s\x1b[0m', `  📜 License: Proprietary & Confidential`);
    console.log(
      '\x1b[36m%s\x1b[0m',
      '═══════════════════════════════════════════════════════════════════════════',
    );
  }

  /**
   * High-visibility rejection banner for unauthorized usage.
   */
  private static printUnauthorizedBanner(): void {
    console.error(
      '\x1b[31m%s\x1b[0m',
      '═══════════════════════════════════════════════════════════════════════════',
    );
    console.error('\x1b[1m\x1b[31m%s\x1b[0m', '  🛑 UNAUTHORIZED CLONE DETECTED');
    console.error('\x1b[31m%s\x1b[0m', '  This framework is the PROPRIETARY property of Lakshya Sharma.');
    console.error('\x1b[31m%s\x1b[0m', '  You are NOT authorized to run this code.');
    console.error('\x1b[31m%s\x1b[0m', '  To gain access, please contact: https://github.com/LakshyaQA');
    console.error(
      '\x1b[31m%s\x1b[0m',
      '═══════════════════════════════════════════════════════════════════════════',
    );
  }

  /**
   * Silent verification used inside core framework classes (e.g., BasePage).
   * If the security folder is deleted, this import will fail, breaking the code.
   */
  public static verifyIntegrity(): boolean {
    // Simple presence check
    return !!this.MASTER_KEY;
  }
}

export default SecurityManager;
