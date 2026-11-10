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
  'src/features/not-found/**/*.{ts,tsx}',
  // I18N-10 (TCG-550)
  'src/components/layout/**/*.{ts,tsx}',
  'src/components/common/**/*.{ts,tsx}',
  'src/lib/nav-config.ts',
  'src/lib/card-labels.ts',
  'src/lib/condition-description.ts',
  'src/lib/upload/**/*.{ts,tsx}',
  'src/app/routes/**/*.{ts,tsx}',
  'src/features/home/**/*.{ts,tsx}',
  'src/features/about/**/*.{ts,tsx}',
  // I18N-11 (TCG-551)
  'src/features/auth/**/*.{ts,tsx}',
  'src/features/catalog/**/*.{ts,tsx}',
  'src/features/store/**/*.{ts,tsx}',
  'src/features/collection/**/*.{ts,tsx}',
  'src/lib/listing-detail.messages.ts',
  // I18N-16 (TCG-556) — admin: แคตตาล็อก เกม และคุณสมบัติการ์ด
  'src/features/admin/pages/{AdminCatalogPage,AdminCardAttributesPage}.tsx',
  'src/features/admin/{catalog,taxonomy,card-listings}.*.ts',
  'src/features/admin/components/{AdminCatalogContent,AdminCardAttributesContent,AttributeFormDialog,CardAttributesSection,CardSchemaTable,CardSetFormDialog,CardSetTable,CardSetsSection,CategoriesSection,CategoryFormDialog,CategoryTable,ConfirmDeleteDialog,DeleteImageDialog,DeleteProductDialog,FieldTypeBadge,GameAttributeFields,GameAvatar,GameFormDialog,GameInfoCard,GameListPanel,ListingBlockDialog,LogoUploadField,SchemaJsonDialog,VariantFormDialog}.tsx',
  'src/features/admin/components/Catalog*.tsx',
  'src/features/admin/components/taxonomy.styles.ts',
  // I18N-14 (TCG-554)
  'src/features/seller/{shared,dashboard,shop,orders,application,logout}/**/*.{ts,tsx}',
  // I18N-12 (TCG-552)
  'src/features/cart/**/*.{ts,tsx}',
  'src/features/payment/**/*.{ts,tsx}',
  'src/features/account/**/*.{ts,tsx}',
]
// ยังไม่ย้าย: ประมูล (I18N-25), โค้ดร้าน (I18N-23), โปรโมชัน / เซลล์ / ประมูล (TCG-743 / 744 / 745)
const I18N_PENDING = [
  'src/features/catalog/components/ProductAuctionBox.tsx',
  'src/features/store/components/StorePromotionStrip.tsx',
  'src/features/seller/{promotions,sales,auctions}/**/*.{ts,tsx}',
  'src/features/account/pages/MyCouponsPage.tsx',
  'src/features/cart/components/CartCodePicker.tsx',
  'src/features/cart/components/CheckoutPlatformPromotion.tsx',
  'src/features/cart/components/CheckoutPlatformPromotionCard.tsx',
  'src/features/cart/components/CheckoutPromotionDialogs.tsx',
  'src/features/cart/components/PromotionChangedDialog.tsx',
  'src/features/cart/components/CheckoutSaleQuotaDialog.tsx',
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
