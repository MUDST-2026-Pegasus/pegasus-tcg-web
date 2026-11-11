import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

/*
 * ห้ามข้อความไทย hardcode — ใส่ผ่าน t("key", "ข้อความเดิม") แทน [TCG-549]
 * guard ทั้ง src — I18N_PENDING คือไฟล์ที่ยังไม่ย้าย แยกเป็นบล็อกต่อการ์ด
 * การ์ดที่ย้ายเสร็จลบเฉพาะบรรทัด path ในบล็อกตัวเอง เก็บบรรทัด comment ไว้ (กันการ์ดที่ทำพร้อมกัน conflict)
 */
const I18N_GUARDED = ['src/**/*.{ts,tsx}']
// ยังไม่ย้าย: ประมูล (I18N-25), โค้ดร้าน (I18N-23), โปรโมชัน / เซลล์ / ประมูล (TCG-743 / 744 / 745)
const I18N_PENDING = [
  'src/test/**',
  'src/components/ui/**',
  // TCG-743 I18N-23 โปรโมชัน / โค้ดส่วนลด (namespace promotions)
  // TCG-744 I18N-24 ลดราคา / Flash Sale (namespace sale)
  // TCG-745 I18N-25 ประมูล (namespace auction)
  // TCG-553 I18N-13 คืนสินค้า / คืนเงิน / รีวิว
  // TCG-558 I18N-18 admin: ผู้ใช้ อนุมัติผู้ขาย รีวิว ภาพรวม บันทึกกิจกรรม รายงาน
  // ยังไม่มีการ์ด
  'src/hooks/use-file-upload.ts',
  // จบรายการ
]
const THAI = '/[\\u0E00-\\u0E7F]/'
// default ของ t() (อาร์กิวเมนต์ใด ๆ ของ t / errorText / errorMessage / msg / translate) ยกเว้นไว้ — นอกนั้นเจอไทยแล้ว error
const T_CALL = "CallExpression[callee.name=/^(t|errorText|errorMessage|msg|translate)$/]"
const thaiMessage = 'ข้อความไทย hardcode — ใช้ t("<page>.<section>.<element>", "ข้อความเดิม") (ดู CONTRIBUTING: ข้อความ / หลายภาษา)'

export default defineConfig([
  globalIgnores(['dist', 'coverage', 'test-results', '.vitest']),
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
    ignores: I18N_PENDING,
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
