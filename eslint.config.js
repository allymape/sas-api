/** @type {import('eslint').FlatConfig} */
const typescriptPlugin = require("@typescript-eslint/eslint-plugin");
const typescriptParser = require("@typescript-eslint/parser");
const nodePlugin = require("eslint-plugin-node");

const baseConfig = {
  rules: {
    "no-unused-vars": ["warn"],
    "no-console": "off",
  },
};

const typescriptConfig = {
  files: ["*.ts", "*.tsx"], // Apply these rules to TypeScript files
  parser: typescriptParser,
  plugins: {
    "@typescript-eslint": typescriptPlugin,
  },
  rules: {
    ...baseConfig.rules,
    // Additional TypeScript-specific rules can be added here
  },
};

const javascriptConfig = {
  files: ["*.js"], // Apply these rules to JavaScript files
  plugins: {
    node: nodePlugin,
  },
  rules: {
    ...baseConfig.rules,
    // Additional JavaScript-specific rules can be added here
  },
};

const config = [typescriptConfig, javascriptConfig];

module.exports = config;
