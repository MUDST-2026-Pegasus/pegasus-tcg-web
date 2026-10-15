import { Navigate, useParams } from "react-router-dom";

/** หน้าร้านเดิม /store/:storeId ถูกลบแล้ว — ลิงก์เก่า (เช่นปุ่มในแบนเนอร์หน้าแรก) พาไปหน้าร้านจริงที่ /u/:username */
export function StoreRedirect() {
  const { storeId = "" } = useParams();
  return <Navigate to={`/u/${encodeURIComponent(storeId)}`} replace />;
}
