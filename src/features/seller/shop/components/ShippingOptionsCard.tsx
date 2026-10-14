import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowUp, ArrowDown, Pencil, EyeOff, Plus, Lock, Truck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { toast } from '@/components/ui/toast';
import { getErrorMessage } from '@/lib/api';
import { CARRIER_OPTIONS } from '../../shared/carriers';
import { formatBaht } from '../../shared/seller.format';
import { shopApi, shippingPayload } from '../shop.api';
import { useShippingOptions, shopKeys } from '../shop.queries';
import { shippingSchema } from '../shop.schema';
import { extraFeeLabel, shippingDays } from '../shop.format';
import type { ShippingOption, ShippingOptionPayload } from '../shop.types';
import { ShopCard, ShopLoading, ShopError, shopFooter } from './ShopCard';

const blank: ShippingOptionPayload = { name: '', carrierCode: '', baseFee: 0, perItemFee: 0, freeThreshold: null, estDaysMin: null, estDaysMax: null, active: true, displayOrder: 0 };
export function ShippingOptionsCard({ canPublish }: { canPublish: boolean }) {
  const query = useShippingOptions();
  const client = useQueryClient();
  const [editing, setEditing] = useState<ShippingOption | 'new' | null>(null);
  const mutation = useMutation({
    mutationFn: async (action: { type: 'toggle'; option: ShippingOption } | { type: 'reorder'; options: ShippingOption[]; changed: ShippingOption[] }) => {
      if (action.type === 'toggle') return action.option.active ? shopApi.deactivate(action.option.id) : shopApi.update(action.option.id, { ...shippingPayload(action.option), active: true });
      // Sequential writes reflect the endpoint contract. Refetch reconciles partial success.
      for (const option of action.changed) await shopApi.update(option.id, shippingPayload(option));
    },
    onMutate: async (action) => {
      await client.cancelQueries({ queryKey: shopKeys.shipping });
      const previous = client.getQueryData<ShippingOption[]>(shopKeys.shipping);
      client.setQueryData(shopKeys.shipping, action.type === 'reorder' ? action.options : previous?.map((o) => o.id === action.option.id ? { ...o, active: !o.active } : o));
      return { previous };
    },
    onError: (error, _action, context) => { client.setQueryData(shopKeys.shipping, context?.previous); toast.add({ type: 'error', title: getErrorMessage(error, 'บันทึกตัวเลือกไม่สำเร็จ') }); },
    onSuccess: () => { toast.add({ type: 'success', title: 'บันทึกตัวเลือกการจัดส่งแล้ว' }); },
    onSettled: () => client.invalidateQueries({ queryKey: shopKeys.shipping }),
  });
  const options = [...(query.data ?? [])].sort((a, b) => a.displayOrder - b.displayOrder || a.id - b.id);
  function move(index: number, direction: number) {
    const next = [...options];
    [next[index], next[index + direction]] = [next[index + direction], next[index]];
    const ordered = next.map((o, i) => ({ ...o, displayOrder: i }));
    const changed = ordered.filter((o) => options.find((old) => old.id === o.id)?.displayOrder !== o.displayOrder);
    mutation.mutate({ type: 'reorder', options: ordered, changed });
  }
  return <ShopCard title="ตัวเลือกการจัดส่ง" subtitle="ผู้ซื้อเลือกได้ตอนชำระเงิน · ลำดับที่แสดงเรียงตามที่ตั้งค่า · ปิดใช้งานแล้วไม่แสดงต่อผู้ซื้อ" action={<Button size="sm" disabled={!canPublish || mutation.isPending} onClick={() => setEditing('new')}><Plus className="size-3"/>เพิ่มตัวเลือก</Button>}>
    {query.isPending ? <ShopLoading/> : query.isError ? <ShopError error={query.error} retry={() => void query.refetch()}/> : !options.length ? <div className="flex flex-col items-center gap-2 py-10 text-muted-foreground"><Truck className="size-8"/><p className="text-sm">ยังไม่มีตัวเลือกการจัดส่ง</p></div> : <div className="max-w-full overflow-x-auto rounded-lg"><table className="w-full min-w-[800px] text-left text-xs"><thead className="bg-[#fafbfb] text-[11px] text-muted-foreground"><tr>{['ลำดับ', 'ชื่อ / ผู้ให้บริการ', 'ค่าส่ง', 'ส่งฟรีเมื่อยอดถึง', 'ระยะเวลา', 'เปิดใช้งาน', 'จัดการ'].map((h) => <th key={h} className="px-3 py-2 font-normal">{h}</th>)}</tr></thead><tbody>{options.map((option, index) => <tr key={option.id} className={`border-b border-[#eef1f2] last:border-0 ${option.active ? '' : 'text-muted-foreground'}`}>
      <td className="px-1 py-3"><div className="flex"><Button aria-label={`เลื่อน ${option.name} ขึ้น`} variant="ghost" size="icon-sm" disabled={index === 0 || mutation.isPending} onClick={() => move(index, -1)}><ArrowUp className="size-3"/></Button><Button aria-label={`เลื่อน ${option.name} ลง`} variant="ghost" size="icon-sm" disabled={index === options.length - 1 || mutation.isPending} onClick={() => move(index, 1)}><ArrowDown className="size-3"/></Button></div></td>
      <td className="px-3 py-4"><p className="font-semibold">{option.name} {!option.active && <span className="ml-1 rounded bg-muted px-1 py-0.5 text-[10px] font-normal">ปิดใช้งาน</span>}</p><p className="mt-1 text-[10px] text-muted-foreground">{option.carrierCode || '—'}</p></td>
      <td className="px-3 py-4"><p className="font-semibold">{formatBaht(option.baseFee)}</p><p className="mt-1 text-[10px] text-muted-foreground">{extraFeeLabel(option.perItemFee)}</p></td><td className={`px-3 py-4 ${option.active && option.freeThreshold !== null ? 'font-medium text-emerald-700' : ''}`}>{option.freeThreshold === null ? '—' : formatBaht(option.freeThreshold)}</td><td className="px-3 py-4">{shippingDays(option.estDaysMin, option.estDaysMax)}</td>
      <td className="px-3 py-4"><Switch aria-label={`เปิดใช้งาน ${option.name}`} checked={option.active} disabled={mutation.isPending} onCheckedChange={() => mutation.mutate({ type: 'toggle', option })}/></td><td className="px-3 py-4"><div className="flex"><Button aria-label={`แก้ไข ${option.name}`} variant="ghost" size="icon-sm" disabled={mutation.isPending} onClick={() => setEditing(option)}><Pencil className="size-3.5"/></Button><Button aria-label={`ปิดใช้งาน ${option.name}`} variant="ghost" size="icon-sm" disabled={!option.active || mutation.isPending} onClick={() => mutation.mutate({ type: 'toggle', option })}><EyeOff className="size-3.5"/></Button></div></td>
    </tr>)}</tbody></table></div>}
    <p className="flex gap-2 text-[11px] text-muted-foreground"><Lock className="size-3 shrink-0"/>เพิ่มตัวเลือกใหม่ได้เฉพาะร้านที่ยืนยันตัวตนแล้ว (VERIFIED) · ไอคอนรูปตาคือปิดใช้งาน ระบบไม่ได้ลบจริง</p>
    <Dialog open={editing !== null} onOpenChange={(open) => { if (!open) setEditing(null); }}><DialogContent className="sm:max-w-lg"><DialogHeader><DialogTitle>{editing === 'new' ? 'เพิ่มตัวเลือกการจัดส่ง' : 'แก้ไขตัวเลือกการจัดส่ง'}</DialogTitle><DialogDescription>กำหนดค่าจัดส่งและระยะเวลาที่ผู้ซื้อจะเห็น</DialogDescription></DialogHeader>{editing && <ShippingForm key={editing === 'new' ? 'new' : editing.id} option={editing === 'new' ? { ...blank, displayOrder: Math.min(32767, Math.max(-1, ...options.map((o) => o.displayOrder)) + 1) } : editing} id={editing === 'new' ? undefined : editing.id} onClose={() => setEditing(null)}/>}</DialogContent></Dialog>
  </ShopCard>;
}
function ShippingForm({ option, id, onClose }: { option: ShippingOptionPayload; id?: number; onClose: () => void }) {
  const client = useQueryClient();
  const form = useForm<ShippingOptionPayload>({ resolver: zodResolver(shippingSchema), defaultValues: option });
  const save = form.handleSubmit(async (values) => {
    try { if (id === undefined) await shopApi.create(values); else await shopApi.update(id, values); await client.invalidateQueries({ queryKey: shopKeys.shipping }); toast.add({ type: 'success', title: 'บันทึกตัวเลือกการจัดส่งแล้ว' }); onClose(); }
    catch (error) { toast.add({ type: 'error', title: getErrorMessage(error, 'บันทึกไม่สำเร็จ') }); }
  });
  const numbers = [{ key: 'baseFee', label: 'ค่าส่งเริ่มต้น (บาท)', nullable: false }, { key: 'perItemFee', label: 'ต่อใบถัดไป (บาท)', nullable: false }, { key: 'freeThreshold', label: 'ส่งฟรีเมื่อยอดถึง (บาท)', nullable: true }, { key: 'estDaysMin', label: 'ระยะเวลาต่ำสุด (วัน)', nullable: true }, { key: 'estDaysMax', label: 'ระยะเวลาสูงสุด (วัน)', nullable: true }] as const;
  return <form className="space-y-4" onSubmit={save} noValidate><fieldset disabled={form.formState.isSubmitting} className="space-y-4"><div><label htmlFor="shipping-name" className="text-xs">ชื่อตัวเลือก *</label><Input id="shipping-name" maxLength={100} {...form.register('name')}/></div><div><label htmlFor="carrier" className="text-xs">ผู้ให้บริการ</label><Controller name="carrierCode" control={form.control} render={({ field }) => {
        const carriers = [
          { value: '', label: 'ไม่ระบุ' },
          ...(option.carrierCode && !CARRIER_OPTIONS.some((c) => c.value === option.carrierCode)
            ? [{ value: option.carrierCode, label: option.carrierCode }] : []),
          ...CARRIER_OPTIONS,
        ];
        return <Select items={carriers} value={field.value ?? ''} onValueChange={field.onChange} disabled={form.formState.isSubmitting}>
          <SelectTrigger id="carrier" ref={field.ref} onBlur={field.onBlur} className="w-full rounded-3xl">
            <SelectValue/>
          </SelectTrigger>
          <SelectContent alignItemWithTrigger={false} sideOffset={6} className="rounded-3xl">
            <SelectGroup>{carriers.map((carrier) => <SelectItem key={carrier.value} value={carrier.value}>{carrier.label}</SelectItem>)}</SelectGroup>
          </SelectContent>
        </Select>;
      }}/></div><div className="grid grid-cols-2 gap-4">{numbers.map(({ key, label, nullable }) => <div key={key}><label htmlFor={key} className="text-xs">{label}</label><Input id={key} type="number" min={key === 'freeThreshold' ? 0.01 : 0} step={key.startsWith('estDays') ? 1 : 0.01} {...form.register(key, { setValueAs: (v: string) => nullable && (v === '' || v == null) ? null : v === '' ? NaN : Number(v) })}/></div>)}</div>{Object.entries(form.formState.errors).map(([key, error]) => <p key={key} role="alert" className="text-xs text-destructive">{error.message}</p>)}</fieldset><div className={shopFooter}><Button variant="ghost" type="button" disabled={form.formState.isSubmitting} onClick={onClose}>ยกเลิก</Button><Button type="submit" disabled={form.formState.isSubmitting}>บันทึกตัวเลือก</Button></div></form>;
}
