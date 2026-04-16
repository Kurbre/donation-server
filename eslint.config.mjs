import typescriptEslint from 'typescript-eslint'
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended'
import globals from 'globals'

export default typescriptEslint.config(
	// Настройки для TypeScript
	...typescriptEslint.configs.recommended,
	// Настройки Prettier (заменяет старый extends: ['plugin:prettier/recommended'])
	eslintPluginPrettierRecommended,
	{
		languageOptions: {
			globals: {
				...globals.node,
				...globals.jest
			},
			parserOptions: {
				project: 'tsconfig.json',
				tsconfigRootDir: import.meta.dirname // В ESM это замена __dirname
			}
		},
		rules: {
			'no-console': 'warn',
			'prettier/prettier': 'off'
		}
	},
	{
		// Игнорируемые файлы (замена ignorePatterns)
		ignores: ['eslint.config.mjs', 'dist/**', 'node_modules/**']
	}
)
