import { useQuery } from '@tanstack/react-query';
import { ShieldCheck, Palmtree, CheckCircle2, Circle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/features/auth/auth.queries';
import { financeApi } from '@/features/finance/finance.api';
import { useLatestVerification } from '../application/application.queries';
import { useSellerDashboard } from '../dashboard/dashboard.queries';
import { useSellerProfile } from '../shared/seller.queries';
import { SELLER_STATUS_LABEL, publishBlockedReason } from '../shared/seller.format';
import { ShopOperationsCard } from './components/ShopOperationsCard';
import { ShopProfileCard } from './components/ShopProfileCard';
import { ShippingOptionsCard } from './components/ShippingOptionsCard';
import { ShopCard, ShopError, ShopLoading } from './components/ShopCard';
import { shopApi } from './shop.api';
import { shopKeys } from './shop.queries';
import { maskAccount } from './shop.format';

function VerificationCard() {
  const verification = useLatestVerification();
  const payout = useQuery({ queryKey: ['finance', 'payout-account'], queryFn: financeApi.payoutAccount });
  const v = verification.data;
  const p = payout.data;
  const labels = { SUBMITTED: 'ส่งเอกสารแล้ว', UNDER_REVIEW: 'กำลังตรวจสอบ', APPROVED: 'ยืนยันแล้ว', REJECTED: 'ไม่ผ่านการยืนยัน' };
  return <ShopCard title="การยืนยันตัวตน" action={v && <span className={`rounded-full px-2 py-1 text-[10px] ${v.status === 'APPROVED' ? 'bg-[#e3f4ec] text-emerald-700' : 'bg-muted text-muted-foreground'}`}>{labels[v.status]}</span>}>
    {verification.isPending || payout.isPending ? <ShopLoading/> : <>{verification.isError && <ShopError error={verification.error} retry={() => void verification.refetch()}/>} {payout.isError && <ShopError error={payout.error} retry={() => void payout.refetch()}/>}
    <ul className="space-y-3 text-xs">{[
      { checked: Boolean(v?.legalFirstName && v?.legalLastName), label: 'ชื่อ-นามสกุลตามบัตร' },
      { checked: Boolean(p?.accountNumber), label: p ? `บัญชีธนาคาร · ${p.bankName} ${maskAccount(p.accountNumber)}` : 'บัญชีธนาคาร' },
      { checked: Boolean(v?.bankBookImageKey), label: 'หน้าสมุดบัญชี' },
    ].map(({ checked, label }) => <li key={label} className="flex items-center gap-2">{checked ? <CheckCircle2 className="size-4 shrink-0 text-primary"/> : <Circle className="size-4 shrink-0 text-muted-foreground"/>}{label}</li>)}</ul></>}
  </ShopCard>;
}
function ShopStats() {
  const listings = useQuery({ queryKey: shopKeys.listings, queryFn: shopApi.listings });
  const dashboard = useSellerDashboard();
  return <>{listings.isError && <ShopError error={listings.error} retry={() => void listings.refetch()}/>} {dashboard.isError && <ShopError error={dashboard.error} retry={() => void dashboard.refetch()}/>}<div className="grid grid-cols-3 text-center">{[
    ['คะแนน', dashboard.isPending ? '…' : dashboard.data?.reviews.average == null ? '—' : `${dashboard.data.reviews.average.toFixed(1)} ★`],
    ['รีวิว', dashboard.data?.reviews.count ?? (dashboard.isPending ? '…' : '—')],
    ['สินค้า', listings.data?.totalItems ?? (listings.isPending ? '…' : '—')],
  ].map(([label, value]) => <div key={label}><p className="text-[13px] font-semibold">{value}</p><p className="text-[10px] text-muted-foreground">{label}</p></div>)}</div></>;
}
export function SellerShopPage() {
  const { user } = useAuth();
  const query = useSellerProfile();
  const profile = query.data;
  const Icon = profile?.vacationMode ? Palmtree : ShieldCheck;
  const tone = profile?.status === 'SUSPENDED' || profile?.status === 'REJECTED' ? 'border-red-200 bg-red-50 text-red-700' : profile?.status === 'VERIFIED' ? 'border-[#c7e8e3] bg-[#e7f6f4] text-[#056b61]' : 'border-amber-200 bg-amber-50 text-amber-800';
  return <div className="space-y-6 text-[#090b0c] [&_[data-slot=input]]:rounded-lg [&_[data-slot=input]]:border-border [&_[data-slot=input]]:bg-white [&_[data-slot=textarea]]:rounded-lg [&_[data-slot=textarea]]:border-border [&_[data-slot=textarea]]:bg-white [&_[data-slot=button]]:rounded-md">
    <div className="flex flex-wrap items-center justify-between gap-4"><div><h1 className="text-[26px] font-bold">จัดการร้านค้า</h1><p className="mt-1 text-xs text-muted-foreground">สถานะร้าน การทำงานของร้าน ข้อมูลหน้าร้าน และตัวเลือกการจัดส่ง</p></div>{user?.username && <Button size="sm" variant="outline" render={<a href={`/u/${encodeURIComponent(user.username)}`} target="_blank" rel="noopener noreferrer"/>}>ดูหน้าร้าน</Button>}</div>
    {query.isPending ? <ShopLoading/> : query.isError ? <ShopError error={query.error} retry={() => void query.refetch()}/> : <div className={`flex flex-wrap items-center gap-[14px] rounded-xl border px-5 py-4 ${tone}`}><div className="flex size-10 items-center justify-center rounded-[10px] bg-white"><Icon className="size-5"/></div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h2 className="text-sm font-semibold">{profile?.vacationMode ? 'ปิดร้านชั่วคราว' : profile?.status === 'VERIFIED' ? 'ร้านค้าเปิดใช้งาน' : SELLER_STATUS_LABEL[profile?.status ?? 'NOT_APPLIED']}</h2><span className="rounded bg-white/60 px-2 py-1 text-[10px]">{profile?.status ?? 'NOT_APPLIED'}</span></div><p className="mt-1 text-xs text-muted-foreground">{profile?.suspendedReason || (profile?.vacationMode ? 'ผู้ซื้อจะไม่เห็นสินค้าทั้งร้านจนกว่าจะเปิดร้านอีกครั้ง' : profile?.verifiedAt ? `ยืนยันตัวตนเมื่อ ${new Intl.DateTimeFormat('th-TH', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Bangkok' }).format(new Date(profile.verifiedAt))}` : publishBlockedReason(profile ?? null))}</p>{(profile?.status === 'REJECTED' || !profile) && <Link to="/become-a-seller" className="text-xs underline">ยื่นเอกสารยืนยันตัวตน</Link>}</div><span className="max-w-full rounded-full bg-white px-3 py-1.5 text-xs">{profile?.canPublish ? 'ลงขายสินค้าได้' : publishBlockedReason(profile ?? null)}</span></div>}
    <div className="grid min-w-0 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
      <div className="lg:col-start-1 lg:row-start-1">{profile ? <ShopOperationsCard settings={profile}/> : query.isPending ? <ShopLoading/> : null}</div>
      {user && <ShopProfileCard key={user.id} user={user} handlingDays={profile?.handlingDays ?? null} verified={profile?.status === 'VERIFIED'} stats={<ShopStats/>} verification={<div className="mt-4"><VerificationCard/></div>}/>}
    </div>
    <ShippingOptionsCard canPublish={profile?.canPublish ?? false}/>
  </div>;
}
