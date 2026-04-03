import { accessSync } from 'node:fs';
import { execSync } from 'node:child_process';

try {
  accessSync('.git');
  try {
    // Husky v9 installs hooks with `husky` (no args). `husky install` is deprecated.
    execSync('npx husky', { stdio: 'inherit' });
  } catch (err) {
    console.log('Skipping husky setup: git not ready or husky command failed.');
  }
} catch (e) {
  console.log('Skipping husky setup: not a git repository.');
}
