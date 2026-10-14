import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/utils';
import { ShopOperationsCard } from '@/features/seller/shop/components/ShopOperationsCard';
import { ShippingOptionsCard } from '@/features/seller/shop/components/ShippingOptionsCard';
import { shopApi } from '@/features/seller/shop/shop.api';
import { extraFeeLabel, shippingDays, maskAccount } from '@/features/seller/shop/shop.format';
import { shippingSchema } from '@/features/seller/shop/shop.schema';
import type { ShippingOption } from '@/features/seller/shop/shop.types';
import type { SellerProfile } from '@/features/seller/shared/seller.types';
vi.mock('@/components/ui/toast', () => ({ toast: { add: vi.fn() } }));
const profile: SellerProfile = { id: 1, userId: 1, status: 'VERIFIED', canPublish: true, verifiedAt: null, suspendedReason: null, handlingDays: 2, vacationMode: false, autoAcceptOrders: true, createdAt: '' };
const option: ShippingOption = { id: 1, sellerProfileId: 1, name: 'EMS', carrierCode: 'THAILAND_POST', baseFee: 50, perItemFee: 10, freeThreshold: null, estDaysMin: 1, estDaysMax: 3, active: true, displayOrder: 0 };
beforeEach(() => vi.restoreAllMocks());
describe('shop formatting and validation', () => {
  it('formats actual fees, nullable delivery estimates and masks bank accounts', () => {
    expect(extraFeeLabel(0)).toBe('ไม่คิดเพิ่มต่อใบ');
    expect(extraFeeLabel(5.5)).toBe('+ ฿5.50 ต่อใบถัดไป');
    expect(shippingDays(1, 3)).toBe('1–3 วัน');
    expect(shippingDays(null, null)).toBe('—');
    expect(shippingDays(null, 3)).toBe('ไม่เกิน 3 วัน');
    expect(maskAccount('123-456-7890')).toBe('••••••7890');
    expect(maskAccount('123')).toBe('••••');
  });
  it('rejects invalid fee precision, thresholds and reversed delivery windows', () => {
    expect(shippingSchema.safeParse({ ...option, baseFee: 1.001 }).success).toBe(false);
    expect(shippingSchema.safeParse({ ...option, freeThreshold: 0 }).success).toBe(false);
    expect(shippingSchema.safeParse({ ...option, estDaysMin: 4 }).success).toBe(false);
  });
});
describe('ShopOperationsCard', () => {
  it('sends all three required settings even when only handling days changed', async () => {
    const save = vi.spyOn(shopApi, 'settings').mockResolvedValue({ ...profile, handlingDays: 5 });
    renderWithProviders(<ShopOperationsCard settings={profile}/>);
    const user = userEvent.setup();
    expect(screen.getByRole('button', { name: 'บันทึกการตั้งค่า' })).toBeDisabled();
    await user.clear(screen.getByLabelText('เวลาเตรียมของ (วันทำการ)'));
    await user.type(screen.getByLabelText('เวลาเตรียมของ (วันทำการ)'), '5');
    await user.click(screen.getByRole('button', { name: 'บันทึกการตั้งค่า' }));
    await waitFor(() => expect(save).toHaveBeenCalledWith({ handlingDays: 5, vacationMode: false, autoAcceptOrders: true }, expect.anything()));
  });
  it('requires confirmation before selecting vacation mode', async () => {
    renderWithProviders(<ShopOperationsCard settings={profile}/>);
    const user = userEvent.setup();
    await user.click(screen.getByRole('switch', { name: 'ปิดร้านชั่วคราว' }));
    expect(screen.getByRole('alertdialog')).toBeInTheDocument();
    expect(screen.getByLabelText('ปิดร้านชั่วคราว', { selector: 'input' })).not.toBeChecked();
    await user.click(screen.getByRole('button', { name: 'ยืนยันปิดร้าน' }));
    expect(screen.getByRole('switch', { name: 'ปิดร้านชั่วคราว' })).toBeChecked();
  });
});
describe('ShippingOptionsCard', () => {
  it('deactivates and reactivates with the complete replacement payload', async () => {
    let current = { ...option };
    vi.spyOn(shopApi, 'shipping').mockImplementation(async () => [{ ...current }]);
    const deactivate = vi.spyOn(shopApi, 'deactivate').mockImplementation(async () => { current = { ...current, active: false }; });
    const update = vi.spyOn(shopApi, 'update').mockImplementation(async (_id, body) => { current = { ...current, ...body }; return current; });
    renderWithProviders(<ShippingOptionsCard canPublish/>);
    const user = userEvent.setup();
    await user.click(await screen.findByRole('button', { name: 'ปิดใช้งาน EMS' }));
    await waitFor(() => expect(deactivate).toHaveBeenCalledWith(1));
    await waitFor(() => expect(screen.getByRole('switch', { name: 'เปิดใช้งาน EMS' })).toBeEnabled());
    await user.click(screen.getByRole('switch', { name: 'เปิดใช้งาน EMS' }));
    await waitFor(() => expect(update).toHaveBeenCalledWith(1, { name: 'EMS', carrierCode: 'THAILAND_POST', baseFee: 50, perItemFee: 10, freeThreshold: null, estDaysMin: 1, estDaysMax: 3, active: true, displayOrder: 0 }));
  });
  it('creates a shipping option with real form values', async () => {
    vi.spyOn(shopApi, 'shipping').mockResolvedValue([]);
    const create = vi.spyOn(shopApi, 'create').mockResolvedValue(option);
    renderWithProviders(<ShippingOptionsCard canPublish/>);
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: 'เพิ่มตัวเลือก' }));
    await user.type(screen.getByLabelText('ชื่อตัวเลือก *'), 'ส่งด่วน');
    await user.click(screen.getByRole('button', { name: 'บันทึกตัวเลือก' }));
    await waitFor(() => expect(create).toHaveBeenCalledWith(expect.objectContaining({ name: 'ส่งด่วน', baseFee: 0, perItemFee: 0, freeThreshold: null, active: true })));
  });
});
