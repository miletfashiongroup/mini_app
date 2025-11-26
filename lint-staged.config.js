const path = require('node:path');

const relativeTo = (root, files) =>
  files
    .filter((file) => file.startsWith(`${root}/`))
    .map((file) => path.relative(root, file));

const quote = (files) => files.map((file) => `"${file}"`).join(' ');

const frontendTasks = (files) => {
  const frontendFiles = relativeTo('packages/frontend', files);
  if (!frontendFiles.length) {
    return [];
  }

  const args = quote(frontendFiles);
  return [
    `cd packages/frontend && npx eslint --fix --max-warnings=0 ${args}`,
    `cd packages/frontend && npx prettier --write ${args}`,
  ];
};

const frontendFormatting = (files) => {
  const frontendFiles = relativeTo('packages/frontend', files);
  if (!frontendFiles.length) {
    return [];
  }

  const args = quote(frontendFiles);
  return [`cd packages/frontend && npx prettier --write ${args}`];
};

const backendPython = (files) => {
  const backendFiles = relativeTo('packages/backend', files);
  if (!backendFiles.length) {
    return [];
  }

  const args = quote(backendFiles);
  return [
    `cd packages/backend && poetry run ruff check --fix --force-exclude ${args}`,
  ];
};

module.exports = {
  'packages/frontend/**/*.{ts,tsx}': frontendTasks,
  'packages/frontend/**/*.{js,jsx,json,md,css,scss}': frontendFormatting,
  'packages/backend/**/*.py': backendPython,
};
