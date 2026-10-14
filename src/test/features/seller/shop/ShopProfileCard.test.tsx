import { afterEach, describe, it, expect, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/utils';
import { ShopProfileCard } from '@/features/seller/shop/components/ShopProfileCard';
import * as profileApi from '@/features/account/profile.api';
import { editProfileSchema } from '@/features/account/profile.schema';
import type { AuthUser } from '@/features/auth/auth.types';
vi.mock('@/components/ui/toast', () => ({ toast: { add: vi.fn() } }));
const user: AuthUser = { id: 1, username: 'seller', displayName: 'Seller', avatarUrl: 'https://example.com/avatar.jpg', phone: '0812345678', bio: 'Original bio', email: 'seller@example.com', roles: ['SELLER'], status: 'ACTIVE', createdAt: '', lastLoginAt: null };
afterEach(() => vi.restoreAllMocks());

describe('ShopProfileCard', () => {
  it('previews edits live, clears avatar with empty string and saves only changed fields', async () => {
    const save = vi.spyOn(profileApi, 'updateProfile').mockResolvedValue({ ...user, displayName: 'New name', avatarUrl: null });
    renderWithProviders(<ShopProfileCard user={user} handlingDays={2} verified stats={null} verification={null}/>);
    const interaction = userEvent.setup();
    const name = screen.getByLabelText('ชื่อที่แสดง *');
    await interaction.clear(name);
    await interaction.type(name, 'New name');
    expect(screen.getByRole('heading', { name: 'New name' })).toBeInTheDocument();
    await interaction.click(screen.getByRole('button', { name: 'ลบรูป' }));
    await interaction.click(screen.getByRole('button', { name: 'บันทึกข้อมูลหน้าร้าน' }));
    await waitFor(() => expect(save).toHaveBeenCalledWith({ displayName: 'New name', phone: null, avatarUrl: '' }));
    await waitFor(() => expect(screen.getByRole('button', { name: 'บันทึกข้อมูลหน้าร้าน' })).toBeDisabled());
    vi.restoreAllMocks();
  });
  it('enables saving again after a successful save without refreshing', async () => {
    const save = vi.spyOn(profileApi, 'updateProfile')
      .mockResolvedValueOnce({ ...user, displayName: 'First name' })
      .mockResolvedValueOnce({ ...user, displayName: 'Second name' });
    renderWithProviders(<ShopProfileCard user={user} handlingDays={2} verified stats={null} verification={null}/>);
    const interaction = userEvent.setup();
    const input = screen.getByLabelText('ชื่อที่แสดง *');
    const button = screen.getByRole('button', { name: 'บันทึกข้อมูลหน้าร้าน' });
    await interaction.clear(input);
    await interaction.type(input, 'First name');
    await interaction.click(button);
    await waitFor(() => expect(input).toBeEnabled());
    await waitFor(() => expect(button).toBeDisabled());
    await interaction.clear(input);
    await interaction.type(input, 'Second name');
    expect(input).toHaveValue('Second name');
    expect(screen.getByRole('heading', { name: 'Second name' })).toBeInTheDocument();
    expect(button).toBeEnabled();
    await interaction.click(button);
    await waitFor(() => expect(save).toHaveBeenLastCalledWith({ displayName: 'Second name', phone: null, avatarUrl: null }));
    await waitFor(() => expect(button).toBeDisabled());
  });
  it('keeps phone private by default and saves the public visibility preference', async () => {
    const save = vi.spyOn(profileApi, 'updateProfile').mockResolvedValue({ ...user, phonePublic: true });
    renderWithProviders(<ShopProfileCard user={user} handlingDays={2} verified stats={null} verification={null}/>);
    const interaction = userEvent.setup();
    expect(screen.queryByText(/Phone number/)).not.toBeInTheDocument();
    const toggle = screen.getByRole('switch', { name: 'แสดงเบอร์โทรบนหน้าร้าน' });
    expect(toggle).not.toBeChecked();
    await interaction.click(toggle);
    expect(screen.getByText('Phone number : 0812345678')).toBeInTheDocument();
    await interaction.click(screen.getByRole('button', { name: 'บันทึกข้อมูลหน้าร้าน' }));
    await waitFor(() => expect(save).toHaveBeenCalledWith({ phone: null, avatarUrl: null, phonePublic: true }));
  });  it('accepts one character names and rejects blank names per backend constraints', () => {
    expect(editProfileSchema.safeParse({ displayName: 'ก', phone: '', bio: '' }).success).toBe(true);
    expect(editProfileSchema.safeParse({ displayName: '  ', phone: '', bio: '' }).success).toBe(false);
  });
});
