import type { SellerProfile } from '../shared/seller.types';

export type ShopSettings = Pick<SellerProfile, 'handlingDays' | 'vacationMode' | 'autoAcceptOrders'>;
export type ShippingOptionPayload = {
  name: string;
  carrierCode: string | null;
  baseFee: number;
  perItemFee: number;
  freeThreshold: number | null;
  estDaysMin: number | null;
  estDaysMax: number | null;
  active: boolean;
  displayOrder: number;
};
export type ShippingOption = ShippingOptionPayload & { id: number; sellerProfileId: number };
