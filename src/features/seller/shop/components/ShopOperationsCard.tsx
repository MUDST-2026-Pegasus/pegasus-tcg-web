import { ConfirmDialog } from "@/components/common";
import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/components/ui/toast';
import type { ShopSettings } from '../shop.types';
import { shopSettingsSchema } from '../shop.schema';
import { useShopSettings } from '../shop.queries';
import { ShopCard, shopFooter } from './ShopCard';
import { translateError } from "@/lib/i18n";

export function ShopOperationsCard({ settings }: { settings: ShopSettings }) {
  const mutation = useShopSettings();
  const [confirm, setConfirm] = useState(false);
  const form = useForm<ShopSettings>({ resolver: zodResolver(shopSettingsSchema), defaultValues: settings });
  const values = useWatch({ control: form.control });
  const save = form.handleSubmit(async (data) => {
    try { const saved = await mutation.mutateAsync(data); form.reset({ handlingDays: saved.handlingDays, vacationMode: saved.vacationMode, autoAcceptOrders: saved.autoAcceptOrders }); toast.add({ type: 'success', title: 'บันทึกการตั้งค่าแล้ว' }); }
    catch (error) { toast.add({ type: 'error', title: translateError(error, 'บันทึกไม่สำเร็จ') }); }
  });
  const row = 'flex items-center justify-between gap-4 rounded-[9px] border border-muted bg-[#fafbfb] px-[14px] py-3';
  return <ShopCard title="การทำงานของร้าน" subtitle="กำหนดการเปิด-ปิดร้านและระยะเวลาจัดส่ง"><form className="space-y-4" onSubmit={save}>
    <div className={row}><div><label htmlFor="vacation" className="text-xs font-medium">ปิดร้านชั่วคราว</label><p className="mt-1 text-[11px] text-muted-foreground">ซ่อนสินค้าทั้งร้านและปิดการสั่งซื้อ · คำสั่งซื้อที่ชำระเงินแล้วยังต้องจัดส่งตามปกติ</p></div><Switch id="vacation" checked={values.vacationMode} disabled={mutation.isPending} onCheckedChange={(checked) => checked ? setConfirm(true) : form.setValue('vacationMode', false, { shouldDirty: true })}/></div>
    <div className={row}><label htmlFor="handling" className="text-xs font-medium">เวลาเตรียมของ (วันทำการ)</label><Input id="handling" className="w-20" type="number" min={0} max={30} disabled={mutation.isPending} {...form.register('handlingDays', { valueAsNumber: true })}/></div>
    {form.formState.errors.handlingDays && <p role="alert" className="text-xs text-destructive">ระบุจำนวนเต็ม 0–30 วัน</p>}
    <div className={row}><label htmlFor="auto-accept" className="text-xs font-medium">รับออเดอร์อัตโนมัติ</label><Switch id="auto-accept" checked={values.autoAcceptOrders} disabled={mutation.isPending} onCheckedChange={(v) => form.setValue('autoAcceptOrders', v, { shouldDirty: true })}/></div>
    <div className={shopFooter}><Button type="button" variant="ghost" size="sm" disabled={mutation.isPending} onClick={() => form.reset(settings)}>ยกเลิก</Button><Button type="submit" size="sm" disabled={!form.formState.isDirty || mutation.isPending}>บันทึกการตั้งค่า</Button></div>
  </form><ConfirmDialog open={confirm} onOpenChange={setConfirm} title="ปิดร้านชั่วคราว?" description="สินค้าทั้งร้านจะถูกซ่อนเมื่อบันทึกการตั้งค่า คำสั่งซื้อที่ชำระเงินแล้วยังต้องจัดส่งตามปกติ" confirmLabel="ยืนยันปิดร้าน" onConfirm={() => { form.setValue('vacationMode', true, { shouldDirty: true }); setConfirm(false); }} /></ShopCard>;
}
