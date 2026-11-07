import { translate, useLanguage } from "@/lib/language";
import type { ReactNode } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { getErrorMessage } from '@/lib/api';

export function ShopCard({ title, subtitle, children, action }: { title: string; subtitle?: string; children: ReactNode; action?: ReactNode }) {
  useLanguage();
  return <section className="min-w-0 space-y-[18px] rounded-xl border border-border bg-card p-5"><div className="flex items-start justify-between gap-3"><div><h2 className="text-[15px] font-semibold">{title}</h2>{subtitle && <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>}</div>{action}</div>{children}</section>;
}
export function ShopError({ error, retry }: { error: unknown; retry: () => void }) {
  useLanguage();
  return <Alert variant="destructive"><AlertDescription>{getErrorMessage(error, translate("โหลดข้อมูลไม่สำเร็จ", "Unable to load data"))}<Button type="button" variant="outline" size="sm" onClick={retry}>{translate("ลองใหม่", "Retry")}</Button></AlertDescription></Alert>;
}
export function ShopLoading() {
  useLanguage(); return <div className="space-y-4" aria-label="กำลังโหลด"><Skeleton className="h-8 w-1/2"/><Skeleton className="h-24 w-full"/><Skeleton className="h-12 w-full"/></div>; }
export const shopFooter = 'flex flex-wrap justify-end gap-2 border-t border-muted pt-[18px]';
