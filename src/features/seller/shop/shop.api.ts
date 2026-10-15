import { api, type PageResponse } from '@/lib/api';
import type { SellerProfile } from '../shared/seller.types';
import type { ShippingOption, ShippingOptionPayload, ShopSettings } from './shop.types';

const path = '/sellers/me/shipping-options';
export const shopApi = {
  settings: (body: ShopSettings) => api.put<SellerProfile>('/sellers/me/settings', body),
  shipping: () => api.get<ShippingOption[]>(path),
  create: (body: ShippingOptionPayload) => api.post<ShippingOption>(path, body),
  update: (id: number, body: ShippingOptionPayload) => api.put<ShippingOption>(`${path}/${id}`, body),
  deactivate: (id: number) => api.delete<void>(`${path}/${id}`),
  listings: () => api.get<PageResponse<unknown>>('/sellers/me/listings', { query: { size: 1 } }),
};

/** PUT replaces every editable field; never include server-owned identifiers. */
export function shippingPayload(option: ShippingOptionPayload): ShippingOptionPayload {
  const { name, carrierCode, baseFee, perItemFee, freeThreshold, estDaysMin, estDaysMax, active, displayOrder } = option;
  return { name, carrierCode, baseFee, perItemFee, freeThreshold, estDaysMin, estDaysMax, active, displayOrder };
}
