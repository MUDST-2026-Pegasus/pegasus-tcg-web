/**
 * ลอกจาก `dto/AdminMetricsViews.java` ของ pegasus-tcg-api ถ้าฝั่งนั้นแก้ ไฟล์นี้ต้องแก้ตาม
 *
 * ค่าดิบทั้งหมด — เงินเป็น number, เดือนเป็น "YYYY-MM", เวลาเป็น ISO string
 * % เปลี่ยนแปลง ข้อความ และความสูงแท่ง sparkline คิดที่ `metrics.format.ts`
 */

/** ทุกช่วงเป็น [from, to) ตัดตามเวลาไทย */
export type MetricsPeriod = {
  month: string;
  from: string;
  to: string;
  previousFrom: string;
  previousTo: string;
};

/** `sparkline` = ยอดรายสัปดาห์ 8 สัปดาห์ เก่าสุดก่อน แท่งสุดท้ายคือสัปดาห์ปัจจุบัน */
export type MoneyStat = {
  value: number;
  previous: number;
  sparkline: number[];
};

export type CountStat = {
  value: number;
  previous: number;
  sparkline: number[];
};

/** ณ ตอนนี้เท่านั้น — สถานะประกาศไม่มีประวัติให้เทียบ จึงไม่มี previous/sparkline */
export type ActiveListingsStat = {
  value: number;
  sellerCount: number;
};

export type CommissionStat = MoneyStat & {
  /** ค่าคอม ÷ ยอดสินค้าที่คิดค่าคอม · `null` เมื่อเดือนนั้นยังไม่มีคำสั่งซื้อสำเร็จ */
  averageRatePercent: number | null;
};

export type OverviewStats = {
  gmv: MoneyStat;
  newSellers: CountStat;
  activeListings: ActiveListingsStat;
  commission: CommissionStat;
};

export type MonthlySales = {
  month: string;
  singles: number;
  sealed: number;
};

export type TopSeller = {
  sellerProfileId: number;
  username: string;
  displayName: string;
  amount: number;
};

/** ชิ้น `others: true` รวมทุกเกมที่เกิน 4 อันดับแรก — `gameId`/`gameName` เป็น null */
export type GameShare = {
  gameId: number | null;
  gameName: string | null;
  amount: number;
  /** ทศนิยม 1 ตำแหน่ง */
  percent: number;
  others: boolean;
};

export type AdminOverview = {
  period: MetricsPeriod;
  stats: OverviewStats;
  monthlySales: MonthlySales[];
  topSellers: TopSeller[];
  gameShare: GameShare[];
};
