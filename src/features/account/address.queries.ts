import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import * as addressApi from "./address.api";
import type { Address, AddressPayload } from "./address.types";
import { toAddressForm, toAddressPayload } from "./address.schema";

/**
 * query key ต้องรวมทุกค่าที่ทำให้ผลลัพธ์ต่างกัน ที่นี่มีแค่ id
 * เพราะ backend ผูกรายการกับเจ้าของ token ให้อยู่แล้ว
 */
export const addressKeys = {
  all: ["addresses"] as const,
  list: () => [...addressKeys.all, "list"] as const,
  detail: (addressId: number) =>
    [...addressKeys.all, "detail", addressId] as const,
};

export function useAddresses() {
  return useQuery({
    queryKey: addressKeys.list(),
    queryFn: addressApi.getAddresses,
  });
}

export function useAddress(addressId: number) {
  return useQuery({
    queryKey: addressKeys.detail(addressId),
    queryFn: () => addressApi.getAddress(addressId),
  });
}

/**
 * ทุก mutation ล้าง cache ทั้งก้อน `addressKeys.all` ไม่ใช่เฉพาะ `list()`
 * เพราะการตั้ง default หนึ่งใบไปปลด default ของใบอื่นด้วย รายการเดี่ยวที่ cache ไว้
 * จึงเก่าตามไปหมด
 */
function useInvalidateAddresses() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: addressKeys.all });
}

export function useCreateAddress() {
  const invalidate = useInvalidateAddresses();

  return useMutation({
    mutationFn: (payload: AddressPayload) => addressApi.createAddress(payload),
    onSuccess: invalidate,
  });
}

export function useUpdateAddress() {
  const invalidate = useInvalidateAddresses();

  return useMutation({
    mutationFn: ({
      addressId,
      payload,
    }: {
      addressId: number;
      payload: AddressPayload;
    }) => addressApi.updateAddress(addressId, payload),
    onSuccess: invalidate,
  });
}

export function useDeleteAddress() {
  const invalidate = useInvalidateAddresses();

  return useMutation({
    mutationFn: (addressId: number) => addressApi.deleteAddress(addressId),
    onSuccess: invalidate,
  });
}

/**
 * ไม่มี endpoint "ตั้งเป็นค่าเริ่มต้น" แยกต่างหาก — ทำผ่าน `PUT` ที่เขียนทับทั้งก้อน
 * จึงต้องประกอบ payload จากที่อยู่ใบเดิมให้ครบ แล้วเปลี่ยนแค่ธงเดียว
 */
export function useSetDefaultAddress() {
  const invalidate = useInvalidateAddresses();

  return useMutation({
    mutationFn: (address: Address) =>
      addressApi.updateAddress(address.id, {
        ...toAddressPayload(toAddressForm(address), address),
        defaultShipping: true,
      }),
    onSuccess: invalidate,
  });
}
