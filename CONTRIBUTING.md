# คู่มือสำหรับคนใน team

โปรเจกต์: Pegasus TCG — React 19 + Vite + Tailwind v4 + shadcn/ui

```bash
pnpm install
pnpm dev      # เปิด http://localhost:5173
pnpm build    # tsc -b && vite build  ← ต้องผ่านก่อน push
pnpm lint
pnpm add [dependency] # for install dep
```

## โครงสร้างโฟลเดอร์

```
src/
  app/
    providers.tsx     QueryClientProvider / Toaster / Tooltip (แทบไม่ต้องแก้)
    router.tsx        ประกอบกลุ่มเส้นทางเข้าด้วยกัน (แทบไม่ต้องแก้)
    routes/
      public.routes.tsx    เส้นทางฝั่งผู้ซื้อ
      auth.routes.tsx      login / register
      admin.routes.tsx     หลังบ้าน admin
      seller.routes.tsx    หลังบ้าน seller
  assets/         รูป/ไฟล์สื่อทั้งหมด แยกเป็นโฟลเดอร์ย่อยตามหมวด เช่น assets/auth/
  components/
    ui/           shadcn — CLI เขียนทับได้ ห้ามแก้เอง
    layout/       โครงหน้า: PublicLayout, DashboardLayout, AuthLayout, Navbar, Footer, AppSidebar
    common/       component กลางที่ใช้ข้าม feature เช่น PagePlaceholder
  features/       งานหลักของแต่ละคนอยู่ที่นี่
    <feature>/
      pages/        หน้าที่ feature นี้เป็นเจ้าของ
      components/   component เฉพาะ feature (สร้างเมื่อต้องใช้จริง)

      ── หรือแบบ "โมดูลต่อหน้า" เมื่อ feature มีหลายหน้าและแต่ละหน้ามีข้อมูลของตัวเอง
         (ตอนนี้ seller ใช้แบบนี้ ดูหัวข้อ "feature ที่มีหลายหน้า" ด้านล่าง)
  hooks/          hook ที่ใช้ร่วมกันทั้งแอป
  lib/
    api/          ชั้นเชื่อม backend — ดูหัวข้อ "ต่อ API" ด้านล่าง
    env.ts        ค่าจาก .env ทั้งหมดอ่านผ่านไฟล์นี้ที่เดียว
    form.ts       แปลง error จาก backend ไปแปะที่ช่องกรอก
    utils.ts, nav-config.ts (เมนู sidebar ของ admin/seller)
  styles/         globals.css — theme token ของ shadcn ทั้งหมด
  main.tsx        entry point
```

## Import ใช้ `@/` เสมอ

`@` ชี้ไปที่ `src/` ใช้ได้กับทุกนามสกุลไฟล์ รวมถึงรูปภาพ

```ts
import { Button } from "@/components/ui/button";
import { PagePlaceholder } from "@/components/common/PagePlaceholder";
import heroImage from "@/assets/auth/register-header.jpg";
```

ถ้าจะเปลี่ยน alias ต้องแก้ให้ตรงกันทั้ง 3 ที่: `vite.config.ts`, `tsconfig.app.json`, `components.json`

## เพิ่มหน้าใหม่

1. สร้างไฟล์ใน `src/features/<ของคุณ>/pages/XxxPage.tsx`
2. เพิ่ม 1 บรรทัดในไฟล์ route ของกลุ่มตัวเอง เช่น `src/app/routes/admin.routes.tsx`

```tsx
// บนสุดของไฟล์
import { AdminUsersPage } from "@/features/admin/pages/AdminUsersPage";

// ใน children
{ path: "users", element: <AdminUsersPage /> },
```

แต่ละกลุ่มมีไฟล์ route ของตัวเอง คนทำ admin กับ seller จึงแก้คนละไฟล์ ไม่ชนกันตอน merge

หน้าที่ยังไม่ได้ทำจะขึ้น `<PagePlaceholder>` พร้อม Figma node id ให้เปิดดูดีไซน์ได้ตรงจุด
พอทำเสร็จให้ลบ `PagePlaceholder` ออกจากไฟล์นั้น

## feature ที่มีหลายหน้า (แบบ seller)

พอ feature หนึ่งมีหลายหน้า และแต่ละหน้ามีข้อมูล/component ของตัวเอง การเอา type กับ mock
ของทุกหน้าไปกองรวมในไฟล์เดียว (`<feature>.types.ts` / `<feature>.fixture.ts`) จะเริ่มมีปัญหา —
ไฟล์ยาวขึ้นเรื่อย ๆ และคนที่ทำคนละหน้าต้องแก้ไฟล์เดียวกัน ชนกันตอน merge

`features/seller/` จึงแยกเป็น **โมดูลต่อหน้า** แต่ละหน้าจบในโฟลเดอร์ตัวเอง

```
features/seller/
  shared/                    ของที่ ≥2 หน้าใช้ร่วมกันเท่านั้น
    SellerLayout.tsx
    SellerSidebar.tsx
    seller.types.ts          SellerProfile
    seller.api.ts            getSellerProfile()
  shop/                      = 1 หน้า = 1 โมดูล
    SellerShopPage.tsx       ไฟล์ที่ route ชี้มา
    shop.types.ts            type ของหน้านี้
    shop.api.ts              mock + getShopData()  ← จุดต่อ API จริงในอนาคต
    components/              component ที่ใช้เฉพาะหน้านี้
  payout/
    SellerPayoutPage.tsx     หน้าที่ยังเป็น placeholder — ไฟล์เดียวพอ
```

กติกาของแบบนี้

- **เริ่มที่ในโมดูลของหน้านั้นก่อนเสมอ** ย้ายขึ้น `shared/` เฉพาะตอนมีหน้าที่สองใช้จริง
- **ยังไม่ทำหน้านั้น = ยังไม่ต้องสร้าง `types`/`api`/`components`** มีแค่ไฟล์หน้าเพจพอ
- **ไฟล์ในโมดูลเดียวกัน import กันด้วย relative** (`./shop.types`, `./components/InfoCard`)
  ข้ามโมดูลค่อยใช้ `@/features/seller/shared/...` — เห็นแล้วรู้ทันทีว่าอันไหนข้ามขอบเขต
- **ข้อมูลทุกหน้าออกมาจากฟังก์ชันใน `*.api.ts`** วันที่ต่อ backend จริงแก้ข้างในฟังก์ชันนั้น
  component ไม่ต้องแก้เลย

## ต่อ API

backend คือ `pegasus-tcg-api` (Spring Boot) ทุก endpoint อยู่ใต้ `/api/v1`

### เริ่มใช้งาน

```bash
cp .env.example .env.local   # แก้ VITE_API_PROXY_TARGET ถ้า backend ไม่ได้อยู่พอร์ต 8080
pnpm dev
```

ตอน dev ไม่ต้องตั้ง `VITE_API_BASE_URL` — `vite.config.ts` proxy `/api` ไปให้ backend อยู่แล้ว
เบราว์เซอร์จึงเห็นเป็น origin เดียวกัน ไม่ต้องไปยุ่งกับ CORS ฝั่ง backend
ตอน build ขึ้น production ค่อยตั้ง `VITE_API_BASE_URL` เป็น origin จริง

### ยิง request

ใช้ `api` จาก `@/lib/api` อย่างเดียว อย่าเรียก `fetch` เอง เพราะตัวนี้จัดการให้แล้ว
ทั้งการต่อ base URL, แนบ `Authorization`, แกะซอง `ApiResponse` ออกให้เหลือแต่ `data`,
ต่ออายุ access token อัตโนมัติเมื่อเจอ 401 และแปลงทุกความผิดพลาดเป็น `ApiError`

```ts
import { api, type PageResponse } from "@/lib/api";

const product = await api.get<Product>(`/products/${id}`);
const page = await api.get<PageResponse<Product>>("/products", {
  query: { page: 0, size: 20, game: "POKEMON" },   // ค่า null/undefined ถูกตัดทิ้งให้
});
await api.post<Order>("/orders", { items });
```

### วางไฟล์ยังไง

หนึ่ง feature (หรือหนึ่งโมดูลหน้า) มีสองไฟล์ แยกหน้าที่กันชัด ๆ

```
features/catalog/
  catalog.types.ts     รูปร่างข้อมูล — ลอกจาก DTO ฝั่ง backend ให้ตรง
  catalog.api.ts       ยิงไปที่ไหน รับอะไรกลับมา (ฟังก์ชันเปล่า ๆ ไม่มี React)
  catalog.queries.ts   query key + hook ที่ component เรียกใช้
```

`catalog.api.ts`

```ts
import { api } from "@/lib/api";
import type { Product } from "./catalog.types";

export function getProduct(id: string): Promise<Product> {
  return api.get<Product>(`/products/${id}`);
}
```

`catalog.queries.ts` — **query key ต้องรวมทุกค่าที่ทำให้ผลลัพธ์ต่างกัน**
ไม่งั้นสินค้าคนละตัวจะใช้ cache ก้อนเดียวกัน

```ts
import { useQuery } from "@tanstack/react-query";
import * as catalogApi from "./catalog.api";

export const catalogKeys = {
  all: ["catalog"] as const,
  detail: (id: string) => [...catalogKeys.all, "detail", id] as const,
};

export function useProduct(id: string) {
  return useQuery({
    queryKey: catalogKeys.detail(id),
    queryFn: () => catalogApi.getProduct(id),
  });
}
```

ในหน้าเพจ

```tsx
const { data: product, isPending, isError, error } = useProduct(productId);

if (isPending) return <Skeleton className="h-96 w-full" />;
if (isError) return <p>{getErrorMessage(error, "โหลดสินค้าไม่สำเร็จ")}</p>;
```

ส่วนที่เขียนข้อมูลใช้ `useMutation` แล้ว `invalidateQueries` คีย์ที่เกี่ยวข้อง

```ts
const queryClient = useQueryClient();
const addToCart = useMutation({
  mutationFn: cartApi.addItem,
  onSuccess: () => queryClient.invalidateQueries({ queryKey: cartKeys.all }),
});
```

> หน้าไหนยังไม่มี endpoint จริง ให้คงไว้เป็น mock ใน `*.api.ts` ตามเดิม
> วันที่ backend เสร็จค่อยเปลี่ยนข้างในฟังก์ชันเป็น `api.get(...)` — component ไม่ต้องแก้

### error

ทุกอย่างที่ออกมาจาก `api.*` เป็น `ApiError` เสมอ มี `status`, `code` (ตรงกับ
`ErrorCode.java`) และ `violations` ของฟิลด์ที่ไม่ผ่าน validation

```ts
import { getErrorMessage, hasErrorCode } from "@/lib/api";

if (hasErrorCode(error, "EMAIL_ALREADY_USED")) { ... }
toast({ description: getErrorMessage(error, "ทำรายการไม่สำเร็จ") });
```

ในฟอร์ม ใช้ `applyApiErrors` จาก `@/lib/form` แปะ error ลงช่องที่ผิดให้อัตโนมัติ
(ดูตัวอย่างเต็มที่ `features/auth/components/RegisterForm.tsx`)

### สถานะ login

```tsx
import { useAuth, useLogout } from "@/features/auth/auth.queries";

const { user, isAuthenticated, isLoading, hasRole } = useAuth();
if (hasRole("SELLER")) { ... }
```

- token เก็บใน localStorage และต่ออายุเองอัตโนมัติ — **ไม่ต้องแตะ token เอง**
- ข้อมูลผู้ใช้อยู่ใน cache ของ TanStack Query อ่านผ่าน `useAuth()` เท่านั้น
- แท็บอื่น login/logout แท็บนี้เห็นตามทันที

หน้าที่ต้อง login ครอบด้วย `RequireAuth` ในไฟล์ route ของกลุ่มตัวเอง

```tsx
// ทั้งกลุ่ม
element: (
  <RequireAuth roles={["ADMIN"]}>
    <DashboardLayout role="ADMIN" groups={adminNav} />
  </RequireAuth>
),

// เฉพาะบางหน้าในกลุ่ม (ดู account/* ใน public.routes.tsx)
{ element: <RequireAuth />, children: [ ... ] },
```

ตอนนี้ `/admin` บังคับ ADMIN, `/seller` บังคับ SELLER และ `/account/*` บังคับว่าต้อง login

### บัญชีสำหรับ dev

สมัครผ่านหน้า `/register` จะได้บทบาท BUYER ถ้าอยากได้ SELLER ด้วยให้ยิงตรง

```bash
curl -X POST http://localhost:8080/api/v1/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"email":"you@example.com","username":"you_dev","displayName":"You","password":"Str0ngPassw0rd!","roles":["BUYER","SELLER"]}'
```

ส่วน ADMIN ให้ตัวเองผ่านฐานข้อมูลโดยตรง (`app_role.code = 'ADMIN'` คือ id 3)

```bash
docker exec pegasus-tcg-postgres psql -U postgres -d pegasus_tcg \
  -c "INSERT INTO user_role (user_id, role_id) SELECT id, 3 FROM user_account WHERE username = 'you_dev';"
```

บทบาทใหม่จะติดมากับ access token รอบถัดไป — logout แล้ว login ใหม่หนึ่งครั้ง

## Layout

route ถูกจัดกลุ่มตาม layout ในไฟล์ `src/app/routes/*.routes.tsx` อยู่แล้ว หน้าใหม่แค่วางไว้ในกลุ่มที่ถูกต้อง
ไม่ต้อง import Navbar/Footer/Sidebar เอง

| Layout            | ใช้กับ                                                                     |
| ----------------- | -------------------------------------------------------------------------- |
| `PublicLayout`    | หน้าฝั่งผู้ซื้อ — Navbar + Footer                                          |
| `DashboardLayout` | admin — Sidebar + topbar + Footer (เมนูมาจาก `lib/nav-config.ts`)          |
| `SellerLayout`    | seller — โครงเดียวกับ `DashboardLayout` แต่ใช้ `SellerSidebar` ของตัวเอง<br>อยู่ที่ `features/seller/shared/SellerLayout.tsx` |
| `AuthLayout`      | login / register — กลางจอ ไม่มี Navbar                                     |

## ถ้าหน้านั้นต้องเขียน CSS เอง

ไล่จากบนลงล่าง ใช้วิธีแรกที่ทำงานได้ ส่วนใหญ่จบที่ข้อ 1

1. **Tailwind utility ใน `className`** — ครอบคลุมเกือบทุกกรณี
2. **Arbitrary value** เมื่อค่าไม่มีใน scale เช่น `w-[672px]`, `h-[75px]`
3. **ค่าที่คำนวณตอน runtime** ใส่ผ่าน inline style เป็น CSS variable
   ```tsx
   <div
     style={{ "--cols": count } as React.CSSProperties}
     className="grid grid-cols-[repeat(var(--cols),1fr)]"
   />
   ```
4. **CSS Module วางข้างไฟล์ component** เมื่อ Tailwind ทำไม่ได้จริง ๆ
   (`@keyframes` ซับซ้อน, `::-webkit-scrollbar`, `clip-path`, `grid-template-areas` ยาว ๆ)
   ```
   src/features/catalog/pages/
     ProductDetailPage.tsx
     ProductDetailPage.module.css   ← วางข้างกัน
   ```
   ```tsx
   import styles from "./ProductDetailPage.module.css";
   <div className={styles.cardFlip} />;
   ```
   Vite รองรับ `.module.css` อยู่แล้ว ไม่ต้องตั้งค่าเพิ่ม และ class จะถูก scope
   ให้อัตโนมัติ จึงไม่หลุดไปชนหน้าคนอื่น

**ห้ามเขียน CSS ของหน้าใดหน้าหนึ่งลง `src/styles/globals.css`** — เป็นไฟล์กลางที่ทั้ง 8 คน
ใช้ร่วมกัน จะทั้งชนกันตอน merge และสไตล์หลุด scope ไปโดนหน้าอื่น

`globals.css` แก้ได้เฉพาะเรื่อง **theme ระดับทั้งแอป** เท่านั้น (เพิ่ม token ใน `@theme inline`,
สีใน `:root` / `.dark`) และควรแจ้งในกลุ่มก่อน

## กติกา

- **ห้ามแก้ `src/components/ui/*`** — เป็นของ shadcn CLI ถ้าอยากได้สไตล์อื่นให้ override ด้วย `className` ตรงจุดที่ใช้
- **ห้ามแก้ไฟล์ใน `features/` ของคนอื่น**
- **ใช้ semantic token** — `bg-primary`, `text-muted-foreground` ห้าม `bg-[#0069a8]`
- **ฟอร์มใช้ `Field` + `FieldGroup`** จาก `@/components/ui/field` ไม่ใช้ `div` + `space-y-*`
- **ไอคอนใช้ `lucide-react`** ห้ามก๊อป SVG จาก Figma มาแปะ
- **ระยะห่างใช้ `gap-*`** ไม่ใช้ `space-x-*` / `space-y-*`
