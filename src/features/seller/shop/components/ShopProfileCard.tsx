import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Info, Lock, Eye, BadgeCheck } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/components/ui/toast';
import { useFileUpload } from '@/hooks/use-file-upload';
import type { AuthUser } from '@/features/auth/auth.types';
import { initialsOf } from '@/features/account/account.format';
import { editProfileSchema, toUpdateProfilePayload } from '@/features/account/profile.schema';
import { useUpdateProfile } from '@/features/account/profile.queries';
import { ShopCard, shopFooter } from './ShopCard';
import { translateError, useTranslate } from "@/lib/i18n";

const schema = editProfileSchema.pick({ displayName: true, phone: true }).extend({ phonePublic: z.boolean() });
type ShopProfileValues = z.infer<typeof schema>;
function toForm(user: AuthUser): ShopProfileValues {
  return { displayName: user.displayName ?? '', phone: user.phone ?? '', phonePublic: user.phonePublic ?? false };
}
function ShopAvatar({ name, url, small = false }: { name: string; url: string | null; small?: boolean }) {
  return <Avatar className={small ? 'size-14' : 'size-16'}>
    {url && <AvatarImage src={url} alt={name}/>}
    <AvatarFallback className="bg-teal-600 text-white">{initialsOf(name || '?')}</AvatarFallback>
  </Avatar>;
}
export function ShopProfileCard({ user, handlingDays, verified, stats, verification }: {
  user: AuthUser; handlingDays: number | null; verified: boolean; stats: React.ReactNode; verification: React.ReactNode;
}) {
  "use no memo"; // RHF subscriptions must remain live after reset for subsequent edits.
  const { t } = useTranslate("seller");
  const update = useUpdateProfile();
  const upload = useFileUpload({ purpose: 'AVATAR_IMAGE' });
  const bannerUpload = useFileUpload({ purpose: 'SHOP_BANNER' });
  const [cleared, setCleared] = useState(false);
  const [bannerCleared, setBannerCleared] = useState(false);
  const [failedBannerUrl, setFailedBannerUrl] = useState<string | null>(null);
  const [baseline, setBaseline] = useState(() => toForm(user));
  const form = useForm<ShopProfileValues>({ resolver: zodResolver(schema), defaultValues: baseline });
  const values = useWatch({ control: form.control });
  const item = upload.items[0];
  const bannerItem = bannerUpload.items[0];
  const avatar = cleared ? null : (item?.status !== 'error' ? item?.previewUrl : null) || user.avatarUrl;
  const candidateBanner = bannerCleared ? null : (bannerItem?.status !== 'error' ? bannerItem?.previewUrl : null) || user.bannerUrl;
  const banner = candidateBanner === failedBannerUrl ? null : candidateBanner;
  const name = values.displayName ?? '';
  const phone = values.phone ?? '';
  const phonePublic = values.phonePublic ?? false;
  // Compare only visible editable fields with the last saved values. Hidden account
  // fields must not affect dirty tracking after reset or subsequent edits.
  const changed = {
    displayName: name !== baseline.displayName,
    phone: phone !== baseline.phone,
    phonePublic: phonePublic !== baseline.phonePublic,
  };
  const bannerChanged = (bannerCleared && !!user.bannerUrl) || bannerUpload.objectKeys.length > 0;
  const hasChanges = Object.values(changed).some(Boolean) || cleared || upload.objectKeys.length > 0 || bannerChanged;
  const busy = update.isPending || upload.isUploading || bannerUpload.isUploading;
  const url = `${window.location.origin}/u/${encodeURIComponent(user.username)}`;
  function reset(saved: AuthUser) {
    const next = toForm(saved);
    setBaseline(next);
    form.reset(next);
    upload.clear();
    setCleared(false);
    bannerUpload.clear();
    setBannerCleared(false);
    setFailedBannerUrl(null);
  }
  const save = form.handleSubmit(async (data) => {
    try {
      const payload = toUpdateProfilePayload({ ...data, bio: '' }, {
        dirtyFields: changed, newAvatarKey: upload.objectKeys[0], isAvatarCleared: cleared,
      });
      delete payload.bio;
      if (bannerChanged) payload.bannerUrl = bannerCleared ? '' : bannerUpload.objectKeys[0];
      if (!changed.displayName) delete payload.displayName;
      if (changed.phonePublic) payload.phonePublic = data.phonePublic;
      const saved = await update.mutateAsync(payload);
      reset(saved);
      toast.add({ type: 'success', title: t("shop.profile.saved", "บันทึกข้อมูลหน้าร้านแล้ว") });
    } catch (error) {
      toast.add({ type: 'error', title: translateError(error, t("shop.saveFailed", "บันทึกไม่สำเร็จ")) });
    }
  });
  return <>
    <ShopCard title={t("shop.profile.title", "ข้อมูลหน้าร้าน")} subtitle={t("shop.profile.subtitle", "ผู้ซื้อเห็นข้อมูลนี้ที่หน้าร้านและทุกที่ที่แสดงชื่อของคุณ")}>
      <div className="flex gap-2 rounded-lg bg-[#e8f1fc] px-3 py-2.5 text-[11px] text-[#0058bc]">
        <Info className="size-3.5 shrink-0"/>{t("shop.profile.syncNote", "ใช้ข้อมูลเดียวกับโปรไฟล์บัญชีของคุณ — แก้ที่นี่แล้วชื่อและรูปในโปรไฟล์จะเปลี่ยนตามด้วย")}
      </div>
      <form className="space-y-[18px]" onSubmit={save} noValidate>
        <div className="space-y-2">
          <p className="text-xs font-medium">{t("shop.profile.banner", "รูปแบนเนอร์ร้าน")}</p>
          <div className="relative aspect-[4/1] w-full overflow-hidden rounded-lg bg-gradient-to-r from-[#0B4D94] via-[#083568] to-[#031B38]">
            {banner && <img src={banner} alt={t("shop.profile.bannerAlt", "แบนเนอร์ร้าน {name}", { name: name || user.username })} className="size-full object-cover object-center" onError={() => setFailedBannerUrl(banner)} />}
            {bannerUpload.isUploading && <div role="status" className="absolute inset-0 flex items-center justify-center bg-black/45 text-xs text-white">{t("shop.profile.uploading", "กำลังอัปโหลด…")}</div>}
            {!banner && !bannerUpload.isUploading && <span className="absolute inset-0 flex items-center justify-center text-xs text-white/80">{t("shop.profile.noBanner", "ยังไม่มีรูปแบนเนอร์")}</span>}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <label className="cursor-pointer rounded-md border px-2.5 py-1.5 text-xs">{t("shop.profile.uploadNew", "อัปโหลดรูปใหม่")}
              <input aria-label={t("shop.profile.uploadBanner", "อัปโหลดรูปแบนเนอร์ร้าน")} type="file" accept={bannerUpload.accept} disabled={busy} className="sr-only"
                onChange={(e) => { if (e.target.files?.length) { setBannerCleared(false); bannerUpload.addFiles(e.target.files); } e.target.value = ''; }}/>
            </label>
            <Button type="button" variant="ghost" size="sm" aria-label={t("shop.profile.removeBanner", "ลบรูปแบนเนอร์")} disabled={busy || !banner} onClick={() => { bannerUpload.clear(); setBannerCleared(true); }}>{t("shop.profile.remove", "ลบรูป")}</Button>
            {bannerItem?.status === 'done' && <span className="text-[11px] text-teal-700">{t("shop.profile.unsaved", "รูปใหม่ยังไม่บันทึก")}</span>}
            {bannerCleared && user.bannerUrl && <span className="text-[11px] text-muted-foreground">{t("shop.profile.pendingRemove", "รอบันทึกเพื่อลบรูป")}</span>}
          </div>
          <p className="text-[10px] text-muted-foreground">{t("shop.profile.bannerHint", "{hint} · แนะนำ 1920 × 480 px และวางเนื้อหาสำคัญไว้กลางภาพ", { hint: bannerUpload.hint })}</p>
          {bannerItem?.error && <p role="alert" className="text-xs text-destructive">{bannerItem.error}</p>}
        </div>
        <div className="flex items-center gap-4">
          <ShopAvatar name={name} url={avatar}/>
          <div className="space-y-2">
            <p className="text-xs">{t("shop.profile.avatar", "รูปโปรไฟล์ร้าน")}</p>
            <div className="flex flex-wrap gap-2">
              <label className="cursor-pointer rounded-md border px-2.5 py-1.5 text-xs">{t("shop.profile.uploadNew", "อัปโหลดรูปใหม่")}
                <input aria-label={t("shop.profile.uploadNew", "อัปโหลดรูปใหม่")} type="file" accept={upload.accept} disabled={busy} className="sr-only"
                  onChange={(e) => { if (e.target.files?.length) { setCleared(false); upload.addFiles(e.target.files); } e.target.value = ''; }}/>
              </label>
              <Button type="button" variant="ghost" size="sm" disabled={busy || !avatar} onClick={() => { upload.clear(); setCleared(true); }}>{t("shop.profile.remove", "ลบรูป")}</Button>
            </div>
            <p className="text-[10px] text-muted-foreground">{upload.isUploading ? t("shop.profile.uploading", "กำลังอัปโหลด…") : upload.hint}</p>
          </div>
        </div>
        {item?.error && <p role="alert" className="text-xs text-destructive">{item.error}</p>}
        <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_200px]">
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs"><label htmlFor="shop-name">{t("shop.profile.displayName", "ชื่อที่แสดง")} <span className="text-destructive">*</span></label><span className="text-[10px] text-muted-foreground">{name.length}/100</span></div>
            <Input id="shop-name" maxLength={100} disabled={update.isPending} {...form.register('displayName')}/>
            {form.formState.errors.displayName && <p role="alert" className="text-xs text-destructive">{form.formState.errors.displayName.message}</p>}
          </div>
          <div className="space-y-1.5">
            <label htmlFor="shop-phone" className="text-xs">{t("shop.profile.phone", "เบอร์โทรติดต่อ")}</label>
            <Input id="shop-phone" type="tel" maxLength={20} disabled={update.isPending} {...form.register('phone')}/>
            {form.formState.errors.phone && <p role="alert" className="text-xs text-destructive">{form.formState.errors.phone.message}</p>}
          </div>
        </div>
        <div className="flex items-center justify-between gap-4 rounded-lg border bg-muted/30 p-3">
          <div>
            <label htmlFor="phone-public" className="text-xs font-medium">
              {t("shop.profile.phonePublic", "แสดงเบอร์โทรบนหน้าร้าน")}
            </label>
            <p className="mt-1 text-[11px] text-muted-foreground">
              {phonePublic
                ? t("shop.profile.phonePublicOn", "สาธารณะ · ผู้เข้าชมหน้าร้านมองเห็นเบอร์โทรได้")
                : t("shop.profile.phonePublicOff", "Private · เฉพาะคุณที่เห็นเบอร์โทรในโปรไฟล์")}
            </p>
          </div>
          <Switch
            id="phone-public"
            aria-label={t("shop.profile.phonePublic", "แสดงเบอร์โทรบนหน้าร้าน")}
            checked={phonePublic}
            disabled={busy || !phone.trim()}
            onCheckedChange={(checked) => form.setValue('phonePublic', checked, { shouldDirty: true })}
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="shop-link" className="text-xs">{t("shop.profile.link", "ลิงก์หน้าร้าน")}</label>
          <div className="flex flex-wrap gap-2">
            <div className="flex min-w-0 flex-1 items-center gap-2 rounded-lg border bg-secondary px-3"><Input id="shop-link" readOnly value={url} className="min-w-0 border-0 bg-transparent px-0 text-xs shadow-none"/><Lock className="size-3 shrink-0 text-muted-foreground"/></div>
            <Button type="button" variant="outline" size="sm" onClick={async () => { try { await navigator.clipboard.writeText(url); toast.add({ type: 'success', title: t("shop.profile.linkCopied", "คัดลอกลิงก์แล้ว") }); } catch (error) { toast.add({ type: 'error', title: translateError(error, t("shop.profile.copyFailed", "คัดลอกไม่สำเร็จ")) }); } }}>{t("shop.profile.copyLink", "คัดลอกลิงก์")}</Button>
          </div>
          <p className="text-[10px] text-muted-foreground">{t("shop.profile.linkHint", "แก้ไขไม่ได้ เพราะผูกกับ username ของบัญชี")}</p>
        </div>
        <div className={shopFooter}><Button type="button" variant="ghost" size="sm" onClick={() => reset(user)} disabled={busy}>{t("actions.cancel", "ยกเลิก", { ns: "common" })}</Button><Button type="submit" size="sm" disabled={!hasChanges || busy || item?.status === 'error' || bannerItem?.status === 'error'}>{t("shop.profile.save", "บันทึกข้อมูลหน้าร้าน")}</Button></div>
      </form>
    </ShopCard>
    <div className="min-w-0 lg:col-start-2 lg:row-start-1 lg:row-span-2">
      <p className="mb-4 flex items-center gap-2 text-xs text-muted-foreground"><Eye className="size-4"/>{t("shop.preview.title", "ตัวอย่างหน้าร้านที่ผู้ซื้อเห็น")}</p>
      <div className="overflow-hidden rounded-xl border bg-card"><div className="h-[76px] bg-teal-600">{banner && <img src={banner} alt={t("shop.profile.bannerAlt", "แบนเนอร์ร้าน {name}", { name: name || user.username })} className="size-full object-cover object-center" onError={() => setFailedBannerUrl(banner)} />}</div>
        <div className="space-y-3 px-[18px] pb-[18px]">
          <ShopAvatar name={name} url={avatar} small/>
          <h3 className="flex items-center gap-2 break-all text-base font-bold">{name}{verified && <BadgeCheck className="size-4 shrink-0 text-teal-600"/>}</h3>
          {phonePublic && phone && <p className="text-xs text-muted-foreground">{t("shop.preview.phone", "เบอร์โทรศัพท์ : {phone}", { phone })}</p>}
          {stats}
          <div className="flex flex-wrap gap-1">{[...(handlingDays === null ? [] : [t("shop.preview.handling", "จัดส่งภายใน {days} วัน", { days: handlingDays })]), t("shop.preview.returns", "รับคืน 7 วัน"), t("shop.preview.authentic", "รับประกันของแท้")].map((label) => <span key={label} className="rounded bg-[#e6f4f2] px-1.5 py-1 text-[10px] text-teal-700">{label}</span>)}</div>
        </div>
      </div>{verification}
    </div>
  </>;
}
