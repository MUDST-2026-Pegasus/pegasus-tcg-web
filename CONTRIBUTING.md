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
  hooks/          hook ที่ใช้ร่วมกันทั้งแอป
  lib/            utils.ts, nav-config.ts (เมนู sidebar ของ admin/seller)
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

## Layout

route ถูกจัดกลุ่มตาม layout ในไฟล์ `src/app/routes/*.routes.tsx` อยู่แล้ว หน้าใหม่แค่วางไว้ในกลุ่มที่ถูกต้อง
ไม่ต้อง import Navbar/Footer/Sidebar เอง

| Layout            | ใช้กับ                                                                     |
| ----------------- | -------------------------------------------------------------------------- |
| `PublicLayout`    | หน้าฝั่งผู้ซื้อ — Navbar + Footer                                          |
| `DashboardLayout` | admin + seller — Sidebar + topbar + Footer (เมนูมาจาก `lib/nav-config.ts`) |
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
