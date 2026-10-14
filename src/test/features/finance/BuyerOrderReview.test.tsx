import { afterEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/utils';
import { BuyerOrderReview } from '@/features/finance/BuyerOrderReview';
import { afterSalesApi } from '@/features/finance/after-sales.api';
vi.mock('@/components/ui/toast', () => ({ toast: { add: vi.fn() } }));
afterEach(() => vi.restoreAllMocks());
describe('BuyerOrderReview', () => {
  it('submits the chosen stars for the seller order and prevents a duplicate review', async () => {
    vi.spyOn(afterSalesApi, 'myReview').mockResolvedValue(null);
    const create = vi.spyOn(afterSalesApi, 'createReview').mockResolvedValue({ id: 9, sellerOrderId: 41, rating: 4, title: '', comment: 'ส่งเร็ว', visible: true, replyComment: null, createdAt: '', repliedAt: null });
    renderWithProviders(<BuyerOrderReview orderId={41} status="COMPLETED"/>);
    const interaction = userEvent.setup();
    await interaction.click(await screen.findByRole('radio', { name: '4 ดาว' }));
    expect(screen.getByRole('radio', { name: '4 ดาว' })).toBeChecked();
    await interaction.type(screen.getByLabelText('ข้อความรีวิว'), 'ส่งเร็ว');
    await interaction.click(screen.getByRole('button', { name: 'ส่งรีวิว' }));
    await waitFor(() => expect(create).toHaveBeenCalledWith(41, 4, '', 'ส่งเร็ว'));
    expect(await screen.findByText('รีวิวที่ส่งแล้ว')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'ส่งรีวิว' })).not.toBeInTheDocument();
    expect(screen.getByRole('img', { name: '4 จาก 5 ดาว' })).toBeInTheDocument();
  });
  it('does not offer reviews before the seller order is completed', () => {
    const mine = vi.spyOn(afterSalesApi, 'myReview');
    renderWithProviders(<BuyerOrderReview orderId={41} status="DELIVERED"/>);
    expect(screen.queryByRole('radio')).not.toBeInTheDocument();
    expect(mine).not.toHaveBeenCalled();
  });
  it('keeps the comment and selected stars when a submission fails', async () => {
    vi.spyOn(afterSalesApi, 'myReview').mockResolvedValue(null);
    vi.spyOn(afterSalesApi, 'createReview').mockRejectedValue(new Error('Network unavailable'));
    renderWithProviders(<BuyerOrderReview orderId={41} status="COMPLETED"/>);
    const interaction = userEvent.setup();
    await interaction.click(await screen.findByRole('radio', { name: '2 ดาว' }));
    await interaction.type(screen.getByLabelText('ข้อความรีวิว'), 'แพ็กไม่ดี');
    await interaction.click(screen.getByRole('button', { name: 'ส่งรีวิว' }));
    await waitFor(() => expect(screen.getByRole('button', { name: 'ส่งรีวิว' })).toBeEnabled());
    expect(screen.getByLabelText('ข้อความรีวิว')).toHaveValue('แพ็กไม่ดี');
    expect(screen.getByRole('radio', { name: '2 ดาว' })).toBeChecked();
  });
});
