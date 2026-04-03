import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const HEADER = `/**
 * © 2026 Lakshya Sharma (LakshyaQA)
 * Repository: https://github.com/LakshyaQA/appium-ts-mobile-framework
 * 
 * PROPRIETARY & CONFIDENTIAL:
 * Unauthorized cloning, modification, or distribution of this Software,
 * in whole or in part, via any medium is strictly prohibited.
 * 
 * All rights reserved by Lakshya Sharma.
 */

`;

const OLD_URL = 'https://github.com/LakshyaQA/omnimobile-test-framework';
const NEW_URL = 'https://github.com/LakshyaQA/appium-ts-mobile-framework';

const IGNORE_DIRS = ['node_modules', '.git', 'allure-results', 'logs', 'dist', 'artifacts', '.gemini'];
const EXTENSIONS = ['.ts', '.js'];

function injectHeader(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');

    if (content.includes(OLD_URL)) {
      // Replace old URL with new one
      content = content.replace(new RegExp(OLD_URL, 'g'), NEW_URL);
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`[HEADER] Updated URL in: ${path.relative(rootDir, filePath)}`);
      return;
    }

    if (content.includes('Lakshya Sharma (LakshyaQA)')) {
      // Header already exists and URL is likely correct; skip.
      return;
    }

    const newContent = HEADER + content;
    fs.writeFileSync(filePath, newContent, 'utf8');
    console.log(`[HEADER] Injected: ${path.relative(rootDir, filePath)}`);
  } catch (err) {
    console.error(`[ERROR] Failed to process ${filePath}:`, err);
  }
}

function walkDir(currentPath) {
  const files = fs.readdirSync(currentPath);

  for (const file of files) {
    const fullPath = path.join(currentPath, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      if (!IGNORE_DIRS.includes(file)) {
        walkDir(fullPath);
      }
    } else if (EXTENSIONS.includes(path.extname(file))) {
      injectHeader(fullPath);
    }
  }
}

console.log('🚀 Starting Bulk Header Injection...');
walkDir(rootDir);
console.log('✅ Header Injection Complete.');
