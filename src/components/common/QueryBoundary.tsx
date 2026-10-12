import type { ReactNode } from "react";

import { ErrorState } from "./ErrorState";
import { LoadingState } from "./LoadingState";

/**
 * ส่วนของผลลัพธ์ `useQuery` ที่ boundary ใช้จริง
 * ประกาศเป็นรูปร่างกลาง ๆ เพื่อให้ส่งผลจาก `useQuery` เข้ามาได้ตรง ๆ
 */
export type QueryLike<TData> = {
  data: TData | undefined;
  isPending: boolean;
  isError: boolean;
  error: unknown;
  refetch: () => unknown;
};

type QueryBoundaryProps<TData> = {
  query: QueryLike<TData>;
  /**
   * skeleton ของหน้านั้น ไม่ใส่จะได้ `LoadingState` (spinner กลางจอ)
   * หน้าไหนมี skeleton ที่วางตรงกับ layout จริงอยู่แล้ว ให้ส่งตัวนั้นมา
   */
  loading?: ReactNode;
  errorTitle?: string;
  errorMessage?: string;
  errorRetryLabel?: string;
  /** เช่น `(addresses) => addresses.length === 0` — ไม่ใส่ = ไม่มีสถานะว่าง */
  isEmpty?: (data: TData) => boolean;
  empty?: ReactNode;
  children: (data: TData) => ReactNode;
};

/**
 * รวม loading / error / empty ของหนึ่ง query ไว้ที่เดียว ให้ทุกหน้าหน้าตาเหมือนกัน
 *
 * ```tsx
 * <QueryBoundary
 *   query={addresses}
 *   loading={<AddressBookSkeleton />}
 *   isEmpty={(items) => items.length === 0}
 *   empty={<EmptyState title="ยังไม่มีที่อยู่" />}
 * >
 *   {(items) => items.map((item) => <AddressCard key={item.id} address={item} />)}
 * </QueryBoundary>
 * ```
 *
 * ข้อควรรู้สองข้อ
 * - query ที่ปิดด้วย `enabled: false` จะค้างที่ `isPending` ตลอด อย่าเพิ่งส่งเข้ามา
 *   ให้เช็คเงื่อนไขนั้นก่อนแล้วค่อย render boundary
 * - refetch ที่พังทั้งที่มีข้อมูลเก่าอยู่แล้ว จะยังแสดงข้อมูลเก่าต่อ ไม่ทิ้งของดีไป
 *   หน้าไหนอยากเตือนตอนนั้นด้วย ให้ดู `isFetching` / `isError` เองในหน้านั้น
 */
export function QueryBoundary<TData>({
  query,
  loading,
  errorTitle,
  errorMessage,
  errorRetryLabel,
  isEmpty,
  empty,
  children,
}: QueryBoundaryProps<TData>) {
  if (query.isPending) {
    return <>{loading ?? <LoadingState />}</>;
  }

  if (query.data === undefined) {
    return (
      <ErrorState
        error={query.error}
        title={errorTitle}
        fallbackMessage={errorMessage}
        retryLabel={errorRetryLabel}
        onRetry={() => query.refetch()}
      />
    );
  }

  if (empty && isEmpty?.(query.data)) {
    return <>{empty}</>;
  }

  return <>{children(query.data)}</>;
}
