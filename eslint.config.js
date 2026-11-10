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
  'src/features/promotions/**',
  'src/features/account/pages/MyCouponsPage.tsx',
  'src/features/seller/promotions/**',
  'src/features/store/components/StorePromotionStrip.tsx',
  'src/features/cart/components/{CartCodePicker,CheckoutPlatformPromotion,CheckoutPlatformPromotionCard,CheckoutPromotionDialogs,PromotionChangedDialog}.tsx',
  'src/features/admin/components/{AdminPromotion*,Promotion*,ClaimTicketPreview}.tsx',
  'src/features/admin/promotions.*.ts',
  'src/features/admin/pages/AdminPromotion*.tsx',
  // TCG-744 I18N-24 ลดราคา / Flash Sale (namespace sale)
  'src/components/sale/**',
  'src/features/sale/**',
  'src/features/seller/sales/**',
  'src/features/cart/components/CheckoutSaleQuotaDialog.tsx',
  'src/features/admin/components/{AdminSale*,Sale*}.tsx',
  'src/features/admin/sales.*.ts',
  'src/features/admin/pages/AdminSale*.tsx',
  // TCG-745 I18N-25 ประมูล (namespace auction)
  // TCG-553 I18N-13 คืนสินค้า / คืนเงิน / รีวิว
  'src/features/finance/**',
  // TCG-558 I18N-18 admin: ผู้ใช้ อนุมัติผู้ขาย รีวิว ภาพรวม บันทึกกิจกรรม รายงาน
  'src/features/admin/admin.fixture.ts',
  'src/features/admin/audit.format.ts',
  'src/features/admin/components/ActivityLogToolbar.tsx',
  'src/features/admin/components/ActivitySummaryPanel.tsx',
  'src/features/admin/components/AddAdminDialog.tsx',
  'src/features/admin/components/AdminActivityLogContent.tsx',
  'src/features/admin/components/AdminOverviewContent.tsx',
  'src/features/admin/components/AdminReviewsContent.tsx',
  'src/features/admin/components/AdminSellerApprovalContent.tsx',
  'src/features/admin/components/AdminUsersContent.tsx',
  'src/features/admin/components/AdminWeeklyReportContent.tsx',
  'src/features/admin/components/AuditEntrySheet.tsx',
  'src/features/admin/components/BankBookImage.tsx',
  'src/features/admin/components/GameShareChart.tsx',
  'src/features/admin/components/MonthlySalesChart.tsx',
  'src/features/admin/components/RecentActivityCard.tsx',
  'src/features/admin/components/RejectVerificationDialog.tsx',
  'src/features/admin/components/ReviewModerationCard.tsx',
  'src/features/admin/components/ReviewSellerCard.tsx',
  'src/features/admin/components/ReviewStars.tsx',
  'src/features/admin/components/SellerApprovalStats.tsx',
  'src/features/admin/components/SellerDetailPanel.tsx',
  'src/features/admin/components/SellerQueueList.tsx',
  'src/features/admin/components/TopSellersCard.tsx',
  'src/features/admin/components/UserDetailSheet.tsx',
  'src/features/admin/components/UserRolesDialog.tsx',
  'src/features/admin/components/UserStatusDialog.tsx',
  'src/features/admin/components/UsersTable.tsx',
  'src/features/admin/components/UsersToolbar.tsx',
  'src/features/admin/components/WeeklyGameShareChart.tsx',
  'src/features/admin/components/WeeklyReportExportDialog.tsx',
  'src/features/admin/components/WeeklyReportFilters.tsx',
  'src/features/admin/components/WeeklyReportSettingsDialog.tsx',
  'src/features/admin/components/WeeklyReportTable.tsx',
  'src/features/admin/components/WeeklyTrendChart.tsx',
  'src/features/admin/metrics.format.ts',
  'src/features/admin/reviews.format.ts',
  'src/features/admin/users.format.ts',
  'src/features/admin/verification.format.ts',
  'src/features/admin/verification.schema.ts',
  'src/features/admin/weekly-report.format.ts',
  'src/features/admin/weekly-report.schema.ts',
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
