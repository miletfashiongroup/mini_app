#!/usr/bin/env node
const shouldSkip =
  process.env.CI === 'true' ||
  process.env.NODE_ENV === 'production' ||
  process.env.HUSKY === '0' ||
  process.env.SKIP_HUSKY === '1';

if (shouldSkip) {
  console.log('[husky] skipping prepare script in CI/production environment');
  process.exit(0);
}

try {
  const husky = require('husky');
  husky.install();
} catch (error) {
  console.warn('[husky] failed to run install, skipping:', error.message);
  process.exit(0);
}
