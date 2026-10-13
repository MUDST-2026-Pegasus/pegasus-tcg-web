const refundStatusLabels: Record<string, string> = {
  PENDING: "รอดำเนินการ",
  APPROVED: "อนุมัติแล้ว",
  PROCESSING: "กำลังโอนเงินคืน",
  PROCESSED: "คืนเงินแล้ว",
  REJECTED: "ปฏิเสธคำขอ",
};

const refundMethodLabels: Record<string, string> = {
  BANK_TRANSFER: "โอนเข้าบัญชีธนาคาร",
  MOCK_GATEWAY: "คืนผ่านช่องทางชำระเงิน",
  WALLET: "คืนเข้ากระเป๋าเงิน",
  CASH_ON_DELIVERY: "เก็บเงินปลายทาง",
};

export const refundStatusLabel = (status: string) => refundStatusLabels[status] ?? "สถานะอื่น";
export const refundMethodLabel = (method: string) => refundMethodLabels[method] ?? "ช่องทางอื่น";
