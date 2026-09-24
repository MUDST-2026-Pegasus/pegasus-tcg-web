import {
  keepPreviousData,
  useMutation,
  useQueries,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import * as verificationApi from "./verification.api";
import type {
  RejectVerificationPayload,
  Verification,
  VerificationStatus,
} from "./verification.types";

/** ทั้งสี่สถานะ เรียงตามลำดับที่โชว์เป็นแท็บ/ช่องสถิติ */
export const VERIFICATION_STATUSES: VerificationStatus[] = [
  "SUBMITTED",
  "UNDER_REVIEW",
  "APPROVED",
  "REJECTED",
];

/**
 * query key ต้องรวมทุกค่าที่ทำให้ผลต่างกัน — ที่นี่คือ status/page/size
 * ทุก mutation ล้างที่ระดับ `queues()` เพราะการตัดสินหนึ่งใบย้ายมันข้ามคิว
 * ตัวเลขสถิติของคิวอื่นจึงเก่าตามไปด้วย
 */
export const verificationKeys = {
  all: ["admin-verifications"] as const,
  queues: () => [...verificationKeys.all, "queue"] as const,
  queue: (status: VerificationStatus, page: number, size: number) =>
    [...verificationKeys.queues(), status, page, size] as const,
  detail: (id: number, status: VerificationStatus) =>
    [...verificationKeys.all, "detail", id, status] as const,
};

/**
 * คิวนี้แอดมินหลายคนใช้พร้อมกัน ดึงใหม่เป็นระยะให้เห็นว่าใบไหนถูกคนอื่นจองไปแล้ว
 * โดยไม่ต้องกดรีเฟรชเอง
 */
const QUEUE_POLL_MS = 30_000;

/** หนึ่งหน้าคิวของสถานะเดียว — ใช้กับแท็บที่เปิดอยู่ */
export function useVerificationQueue(
  status: VerificationStatus,
  page: number,
  size: number,
) {
  return useQuery({
    queryKey: verificationKeys.queue(status, page, size),
    queryFn: () => verificationApi.getVerificationQueue({ status, page, size }),
    // สลับหน้า/แท็บแล้วยังเห็นของเดิมจนกว่าชุดใหม่จะมา ภาพไม่กระพริบ
    placeholderData: keepPreviousData,
    refetchInterval: QUEUE_POLL_MS,
  });
}

export type VerificationCounts = {
  counts: Record<VerificationStatus, number>;
  total: number;
  isPending: boolean;
  isError: boolean;
};

/**
 * จำนวนจริงของแต่ละคิว — ยิง size=1 อ่านแค่ `totalItems` พอ
 * ใช้เติมตัวเลขบนช่องสถิติและ badge ของแต่ละแท็บ
 */
export function useVerificationCounts(): VerificationCounts {
  return useQueries({
    queries: VERIFICATION_STATUSES.map((status) => ({
      queryKey: verificationKeys.queue(status, 0, 1),
      queryFn: () =>
        verificationApi.getVerificationQueue({ status, page: 0, size: 1 }),
      select: (page: { totalItems: number }) => page.totalItems,
      refetchInterval: QUEUE_POLL_MS,
    })),
    combine: (results) => {
      const counts = {} as Record<VerificationStatus, number>;
      VERIFICATION_STATUSES.forEach((status, index) => {
        counts[status] = results[index].data ?? 0;
      });
      return {
        counts,
        total: VERIFICATION_STATUSES.reduce(
          (sum, status) => sum + counts[status],
          0,
        ),
        isPending: results.some((result) => result.isPending),
        isError: results.some((result) => result.isError),
      };
    },
  });
}

/**
 * ดึงใบเดียวใหม่จากคิวของสถานะที่ระบุ — ใช้ตอน signed URL ของรูปหมดอายุ
 * และตอนจองไม่ทัน (ไปหาในคิว UNDER_REVIEW ว่าใครจองไว้)
 * ไม่ cache ผลไว้ ต้องได้ของสดทุกครั้ง
 */
export function useRefetchVerification() {
  const queryClient = useQueryClient();
  return (id: number, status: VerificationStatus) =>
    queryClient.fetchQuery({
      queryKey: verificationKeys.detail(id, status),
      queryFn: () => verificationApi.findVerification(id, status),
      staleTime: 0,
      gcTime: 0,
    });
}

function useInvalidateQueues() {
  const queryClient = useQueryClient();
  return () =>
    queryClient.invalidateQueries({ queryKey: verificationKeys.queues() });
}

/**
 * จองคำขอมาตรวจ ยิงตอนเปิดใบที่ยัง SUBMITTED
 * `onSettled` ล้างคิวทั้งสำเร็จและพลาด — พลาดแปลว่าคนอื่นรับไปก่อน
 * ต้องดึงใหม่ให้ใบนั้นหายจากคิว SUBMITTED
 */
export function useStartReview() {
  const invalidate = useInvalidateQueues();
  return useMutation({
    mutationFn: (verificationId: number) =>
      verificationApi.startReview(verificationId),
    onSettled: invalidate,
  });
}

export function useApproveVerification() {
  const invalidate = useInvalidateQueues();
  return useMutation({
    mutationFn: (verificationId: number) =>
      verificationApi.approveVerification(verificationId),
    onSettled: invalidate,
  });
}

export function useRejectVerification() {
  const invalidate = useInvalidateQueues();
  return useMutation({
    mutationFn: (input: { id: number; payload: RejectVerificationPayload }) =>
      verificationApi.rejectVerification(input.id, input.payload),
    onSettled: invalidate,
  });
}

export type { Verification };
