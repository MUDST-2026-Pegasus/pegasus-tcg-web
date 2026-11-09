import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

/*
 * ห้ามข้อความไทย hardcode — ใส่ผ่าน t("key", "ข้อความเดิม") แทน [TCG-549]
 * เปิดทีละโฟลเดอร์: การ์ดย้ายข้อความ (I18N-10 ถึง 19) เพิ่ม path ของตัวเองใน I18N_GUARDED
 */
const I18N_GUARDED = [
  'src/lib/i18n/**/*.{ts,tsx}',
  'src/components/layout/Navbar.tsx',
  'src/features/not-found/**/*.{ts,tsx}',
]
const THAI = '/[\\u0E00-\\u0E7F]/'
// default ของ t() (อาร์กิวเมนต์ใด ๆ ของ t / errorText) ยกเว้นไว้ — นอกนั้นเจอไทยแล้ว error
const T_CALL = "CallExpression[callee.name=/^(t|errorText)$/]"
const thaiMessage = 'ข้อความไทย hardcode — ใช้ t("<page>.<section>.<element>", "ข้อความเดิม") (ดู CONTRIBUTING: ข้อความ / หลายภาษา)'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
    },
  },
  {
    files: ['src/test/**/*.{ts,tsx}'],
    rules: {
      'react-refresh/only-export-components': 'off',
    },
  },
  {
    files: ['src/components/ui/**/*.{ts,tsx}', 'src/hooks/use-mobile.ts'],
    rules: {
      'react-refresh/only-export-components': 'off',
      'react-hooks/set-state-in-effect': 'off',
    },
  },
  {
    files: I18N_GUARDED,
    rules: {
      'no-restricted-syntax': [
        'error',
        { selector: `JSXText[value=${THAI}]`, message: thaiMessage },
        { selector: `Literal[value=${THAI}]:not(${T_CALL} > Literal)`, message: thaiMessage },
        { selector: `TemplateElement[value.raw=${THAI}]:not(${T_CALL} > TemplateLiteral > TemplateElement)`, message: thaiMessage },
      ],
    },
  },
])
