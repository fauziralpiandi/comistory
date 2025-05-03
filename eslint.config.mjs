import tseslint from 'typescript-eslint';
import { fileURLToPath } from 'node:url';

export default tseslint.config({
  files: ['**/*.ts'],
  ignores: ['node_modules/**', 'dist/**'],
  languageOptions: {
    parser: tseslint.parser,
    parserOptions: {
      project: './tsconfig.json',
      tsconfigRootDir: fileURLToPath(new URL('.', import.meta.url)),
    },
  },
});
