import globals from "globals";
import prettier from "eslint-plugin-prettier";
import tseslint from "typescript-eslint";
import pluginUnusedImports from "eslint-plugin-unused-imports";

const eslintConfig = [
  {
    ignores: ["node_modules", "dist", "docs", "openspec/**", "vite.config.ts"],
  },
  ...tseslint.configs.recommended,
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
      },
      globals: {
        ...globals.browser,
        ...globals.es2021,
      },
    },
    plugins: {
      prettier,
      "unused-imports": pluginUnusedImports,
    },
    rules: {
      // 標準のno-unused-varsを無効化
      "no-unused-vars": "off",
      // 未使用importをエラーに
      "unused-imports/no-unused-imports": "error",
      // 未使用変数も警告（先頭が_なら無視）
      "unused-imports/no-unused-vars": [
        "warn",
        {
          vars: "all",
          varsIgnorePattern: "^_",
          args: "after-used",
          argsIgnorePattern: "^_",
        },
      ],

      "prettier/prettier": "error",
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
    },
  },
];


export default eslintConfig;