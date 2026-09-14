/** สถานะของรายการถอนเงิน — ใช้กับ badge ในตารางประวัติ */
export type WithdrawalStatus = "processing" | "success" | "cancelled";

export type BalanceStat = {
  id: string;
  label: string;
  value: string;
};

export type Withdrawal = {
  /** รหัสรายการ เช่น "WD-2569-0812" */
  id: string;
  /** เช่น "10 ส.ค. 2569 · 14:22" */
  requestedAt: string;
  amount: string;
  /** ธนาคารปลายทาง + เลขบัญชีแบบปิดบัง เช่น "กสิกรไทย xxx-x-x1234-5" */
  destination: string;
  status: WithdrawalStatus;
  statusLabel: string;
};

export type SelectOption = { value: string; label: string };

export type PayoutData = {
  title: string;
  subtitle: string;
  actions: {
    downloadSummaryLabel: string;
  };
  balance: {
    label: string;
    amount: string;
    withdrawLabel: string;
    /** แถวตัวเลขย่อยใต้ยอดพร้อมถอน (กำลังดำเนินการ / รอครบกำหนด / ถอนสะสม) */
    stats: BalanceStat[];
    scheduleNote: string;
  };
  bankAccount: {
    title: string;
    statusLabel: string;
    bankName: string;
    accountNumber: string;
    accountNameLabel: string;
    accountName: string;
    changeLabel: string;
    changeNote: string;
  };
  /** dialog "ยืนยันการถอนเงิน" ที่เปิดจากปุ่มถอนเงินในการ์ดยอดเงิน */
  withdraw: {
    title: string;
    description: string;
    amountLabel: string;
    amount: string;
    feeLabel: string;
    /** รายการหัก ใส่เครื่องหมายลบมาแล้ว เช่น "− ฿0.00" */
    fee: string;
    netLabel: string;
    net: string;
    otp: {
      /** เช่น "รหัส OTP ที่ส่งไปยัง 08x-xxx-4821" — component เติม " *" ต่อท้ายเอง */
      label: string;
      length: number;
      /** ต้องรอกี่วินาทีถึงจะกดขอรหัสใหม่ได้ */
      resendAfterSeconds: number;
      /** ข้อความหน้าตัวนับถอยหลัง เช่น "ส่งรหัสใหม่ได้ใน" */
      resendCountdownLabel: string;
      resendLabel: string;
    };
    limitNote: string;
    cancelLabel: string;
    confirmLabel: string;
  };
  history: {
    title: string;
    subtitle: string;
    yearPlaceholder: string;
    yearOptions: SelectOption[];
    exportLabel: string;
    columns: {
      requestedAt: string;
      id: string;
      amount: string;
      destination: string;
      status: string;
      /** ไม่มีหัวคอลัมน์ในดีไซน์ ใช้เป็นข้อความสำหรับ screen reader */
      actions: string;
    };
    viewSlipLabel: string;
    rows: Withdrawal[];
  };
};
