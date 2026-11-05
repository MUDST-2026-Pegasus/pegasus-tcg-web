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
import { getErrorMessage } from '@/lib/api';
import type { AuthUser } from '@/features/auth/auth.types';
import { initialsOf } from '@/features/account/account.format';
import { editProfileSchema, toUpdateProfilePayload } from '@/features/account/profile.schema';
import { useUpdateProfile } from '@/features/account/profile.queries';
import { ShopCard, shopFooter } from './ShopCard';

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
  const update = useUpdateProfile();
  const upload = useFileUpload({ purpose: 'AVATAR_IMAGE' });
  const [cleared, setCleared] = useState(false);
  const [baseline, setBaseline] = useState(() => toForm(user));
  const form = useForm<ShopProfileValues>({ resolver: zodResolver(schema), defaultValues: baseline });
  const values = useWatch({ control: form.control });
  const item = upload.items[0];
  const avatar = cleared ? null : (item?.status !== 'error' ? item?.previewUrl : null) || user.avatarUrl;
  const name = values.displayName ?? '';
  const phone = values.phone ?? '';
  const phonePublic = values.phonePublic ?? false;
  // Compare only visible editable fields with the last saved values. Hidden account
  // fields must not affect dirty tracking after reset or subsequent edits.
  const changed = { displayName: name !== baseline.displayName, phone: phone !== baseline.phone, phonePublic: phonePublic !== baseline.phonePublic };
  const hasChanges = Object.values(changed).some(Boolean) || cleared || upload.objectKeys.length > 0;
  const busy = update.isPending || upload.isUploading;
  const url = `${window.location.origin}/u/${encodeURIComponent(user.username)}`;
  function reset(saved: AuthUser) {
    const next = toForm(saved);
    setBaseline(next);
    form.reset(next);
    upload.clear();
    setCleared(false);
  }
  const save = form.handleSubmit(async (data) => {
    try {
      const payload = toUpdateProfilePayload({ ...data, bio: '' }, {
        dirtyFields: changed, newAvatarKey: upload.objectKeys[0], isAvatarCleared: cleared,
      });
      delete payload.bio;
      if (!changed.displayName) delete payload.displayName;
      if (changed.phonePublic) payload.phonePublic = data.phonePublic;
      const saved = await update.mutateAsync(payload);
      reset(saved);
      toast.add({ type: 'success', title: 'บันทึกข้อมูลหน้าร้านแล้ว' });
    } catch (error) {
      toast.add({ type: 'error', title: getErrorMessage(error, 'บันทึกไม่สำเร็จ') });
    }
  });
  return <>
    <ShopCard title="ข้อมูลหน้าร้าน" subtitle="ผู้ซื้อเห็นข้อมูลนี้ที่หน้าร้านและทุกที่ที่แสดงชื่อของคุณ">
      <div className="flex gap-2 rounded-lg bg-[#e8f1fc] px-3 py-2.5 text-[11px] text-[#0058bc]">
        <Info className="size-3.5 shrink-0"/>ใช้ข้อมูลเดียวกับโปรไฟล์บัญชีของคุณ — แก้ที่นี่แล้วชื่อและรูปในโปรไฟล์จะเปลี่ยนตามด้วย
      </div>
      <form className="space-y-[18px]" onSubmit={save} noValidate>
        <div className="flex items-center gap-4">
          <ShopAvatar name={name} url={avatar}/>
          <div className="space-y-2">
            <p className="text-xs">รูปโปรไฟล์ร้าน</p>
            <div className="flex flex-wrap gap-2">
              <label className="cursor-pointer rounded-md border px-2.5 py-1.5 text-xs">อัปโหลดรูปใหม่
                <input aria-label="อัปโหลดรูปใหม่" type="file" accept={upload.accept} disabled={busy} className="sr-only"
                  onChange={(e) => { if (e.target.files?.length) { setCleared(false); upload.addFiles(e.target.files); } e.target.value = ''; }}/>
              </label>
              <Button type="button" variant="ghost" size="sm" disabled={busy || !avatar} onClick={() => { upload.clear(); setCleared(true); }}>ลบรูป</Button>
            </div>
            <p className="text-[10px] text-muted-foreground">{upload.isUploading ? 'กำลังอัปโหลด…' : upload.hint}</p>
          </div>
        </div>
        {item?.error && <p role="alert" className="text-xs text-destructive">{item.error}</p>}
        <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_200px]">
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs"><label htmlFor="shop-name">ชื่อที่แสดง <span className="text-destructive">*</span></label><span className="text-[10px] text-muted-foreground">{name.length}/100</span></div>
            <Input id="shop-name" maxLength={100} disabled={update.isPending} {...form.register('displayName')}/>
            {form.formState.errors.displayName && <p role="alert" className="text-xs text-destructive">{form.formState.errors.displayName.message}</p>}
          </div>
          <div className="space-y-1.5">
            <label htmlFor="shop-phone" className="text-xs">เบอร์โทรติดต่อ</label>
            <Input id="shop-phone" type="tel" maxLength={20} disabled={update.isPending} {...form.register('phone')}/>
            {form.formState.errors.phone && <p role="alert" className="text-xs text-destructive">{form.formState.errors.phone.message}</p>}
          </div>
        </div>
        <div className="flex items-center justify-between gap-4 rounded-lg border bg-muted/30 p-3">
          <div><label htmlFor="phone-public" className="text-xs font-medium">แสดงเบอร์โทรบนหน้าร้าน</label><p className="mt-1 text-[11px] text-muted-foreground">{phonePublic ? 'สาธารณะ · ผู้เข้าชมหน้าร้านมองเห็นเบอร์โทรได้' : 'Private · เฉพาะคุณที่เห็นเบอร์โทรในโปรไฟล์'}</p></div>
          <Switch id="phone-public" checked={phonePublic} disabled={update.isPending} onCheckedChange={(checked) => form.setValue('phonePublic', checked, { shouldDirty: true })}/>
        </div>
        <div className="space-y-2">
          <label htmlFor="shop-link" className="text-xs">ลิงก์หน้าร้าน</label>
          <div className="flex flex-wrap gap-2">
            <div className="flex min-w-0 flex-1 items-center gap-2 rounded-lg border bg-secondary px-3"><Input id="shop-link" readOnly value={url} className="min-w-0 border-0 bg-transparent px-0 text-xs shadow-none"/><Lock className="size-3 shrink-0 text-muted-foreground"/></div>
            <Button type="button" variant="outline" size="sm" onClick={async () => { try { await navigator.clipboard.writeText(url); toast.add({ type: 'success', title: 'คัดลอกลิงก์แล้ว' }); } catch (error) { toast.add({ type: 'error', title: getErrorMessage(error, 'คัดลอกไม่สำเร็จ') }); } }}>คัดลอกลิงก์</Button>
          </div>
          <p className="text-[10px] text-muted-foreground">แก้ไขไม่ได้ เพราะผูกกับ username ของบัญชี</p>
        </div>
        <div className={shopFooter}><Button type="button" variant="ghost" size="sm" onClick={() => reset(user)} disabled={busy}>ยกเลิก</Button><Button type="submit" size="sm" disabled={!hasChanges || busy || item?.status === 'error'}>บันทึกข้อมูลหน้าร้าน</Button></div>
      </form>
    </ShopCard>
    <div className="min-w-0 lg:col-start-2 lg:row-start-1 lg:row-span-2">
      <p className="mb-4 flex items-center gap-2 text-xs text-muted-foreground"><Eye className="size-4"/>ตัวอย่างหน้าร้านที่ผู้ซื้อเห็น</p>
      <div className="overflow-hidden rounded-xl border bg-card"><div className="h-[76px] bg-teal-600"/>
        <div className="space-y-3 px-[18px] pb-[18px]">
          <ShopAvatar name={name} url={avatar} small/>
          <h3 className="flex items-center gap-2 break-all text-base font-bold">{name}{verified && <BadgeCheck className="size-4 shrink-0 text-teal-600"/>}</h3>
          {phonePublic && phone && <p className="text-xs text-muted-foreground">Phone number : {phone}</p>}
          {stats}
          <div className="flex flex-wrap gap-1">{[...(handlingDays === null ? [] : ['จัดส่งภายใน ' + handlingDays + ' วัน']), 'รับคืน 7 วัน', 'รับประกันของแท้'].map((label) => <span key={label} className="rounded bg-[#e6f4f2] px-1.5 py-1 text-[10px] text-teal-700">{label}</span>)}</div>
        </div>
      </div>{verification}
    </div>
  </>;
}
