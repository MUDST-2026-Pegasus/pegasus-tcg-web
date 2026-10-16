/**
 * รีวิวผู้ขายฝั่งแอดมิน — ลอกจาก `ReviewRepository.AdminReview` และ `FinanceViews.Review`
 * ถ้าฝั่งนั้นแก้ ไฟล์นี้ต้องแก้ตาม
 */

/** `GET /admin/reviews?username=` — รวมรีวิวที่ถูกซ่อน เรียงใหม่ไปเก่า */
export type AdminReview = {
  id: number;
  sellerOrderId: number;
  rating: number;
  title: string | null;
  comment: string;
  replyComment: string | null;
  visible: boolean;
  createdAt: string;
  reviewerUsername: string;
  /** presigned GET อายุสั้น ห้ามเก็บ — `null` = ผู้รีวิวไม่มีรูปโปรไฟล์ */
  reviewerAvatarUrl: string | null;
};

/** `PUT /admin/reviews/{id}/visibility` คืนรีวิวหลังเปลี่ยน */
export type ReviewRecord = {
  id: number;
  sellerOrderId: number;
  rating: number;
  title: string | null;
  comment: string;
  replyComment: string | null;
  visible: boolean;
  createdAt: string;
  repliedAt: string | null;
};

/** `GET /u/{username}` — ใช้แค่ชื่อร้านบนการ์ดคะแนน */
export type ReviewSellerProfile = {
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
};
