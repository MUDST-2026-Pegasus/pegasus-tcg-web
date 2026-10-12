import { api } from "@/lib/api";

import type { Address, AddressPayload } from "./address.types";

/**
 * `/addresses` — สมุดที่อยู่ของผู้ใช้ที่ login อยู่ (`AddressController.java`)
 * ทุก endpoint ผูกกับเจ้าของ token อยู่แล้ว จึงไม่ต้องส่ง userId ไปเอง
 *
 * ไฟล์นี้ไม่มี React — component เรียกผ่าน hook ใน `address.queries.ts`
 */

export function getAddresses(): Promise<Address[]> {
  return api.get<Address[]>("/addresses");
}

export function getAddress(addressId: number): Promise<Address> {
  return api.get<Address>(`/addresses/${addressId}`);
}

export function createAddress(payload: AddressPayload): Promise<Address> {
  return api.post<Address>("/addresses", payload);
}

/** เขียนทับทั้งก้อน — payload ต้องครบทุกฟิลด์ ไม่ใช่เฉพาะที่แก้ */
export function updateAddress(
  addressId: number,
  payload: AddressPayload,
): Promise<Address> {
  return api.put<Address>(`/addresses/${addressId}`, payload);
}

/** ฝั่ง backend เป็น soft delete ออเดอร์เก่าที่ชี้มาที่นี่จึงไม่หายไปด้วย */
export function deleteAddress(addressId: number): Promise<void> {
  return api.delete<void>(`/addresses/${addressId}`);
}
