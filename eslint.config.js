import { fileURLToPath } from 'url'
import path from 'path'
import tseslint from 'typescript-eslint'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default tseslint.config({
  files: ['src/**/*.ts', 'test/**/*.ts'],
  extends: [tseslint.configs.strictTypeChecked],
  languageOptions: {
    parserOptions: {
      project: './tsconfig.eslint.json',
      tsconfigRootDir: __dirname,
    },
  },
  rules: {
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
  },
})
