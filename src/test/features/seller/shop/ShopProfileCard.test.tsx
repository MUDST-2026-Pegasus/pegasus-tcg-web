import { afterEach, describe, it, expect, vi } from 'vitest';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/utils';
import { ShopProfileCard } from '@/features/seller/shop/components/ShopProfileCard';
import * as profileApi from '@/features/account/profile.api';
import * as uploadLib from '@/lib/upload';
import { editProfileSchema } from '@/features/account/profile.schema';
import type { AuthUser } from '@/features/auth/auth.types';
vi.mock('@/components/ui/toast', () => ({ toast: { add: vi.fn() } }));
vi.mock('@/lib/upload', async (importOriginal) => ({
  ...await importOriginal<typeof import('@/lib/upload')>(),
  uploadFile: vi.fn(),
}));
const user: AuthUser = { id: 1, username: 'seller', displayName: 'Seller', avatarUrl: 'https://example.com/avatar.jpg', bannerUrl: null, phone: '0812345678', bio: 'Original bio', email: 'seller@example.com', roles: ['SELLER'], status: 'ACTIVE', createdAt: '', lastLoginAt: null };
afterEach(() => vi.restoreAllMocks());

describe('ShopProfileCard', () => {
  it('previews a selected banner, saves its key, and keeps the avatar unchanged', async () => {
    const interaction = userEvent.setup();
    vi.stubGlobal('URL', { ...URL, createObjectURL: vi.fn(() => 'blob:banner'), revokeObjectURL: vi.fn() });
    vi.mocked(uploadLib.uploadFile).mockResolvedValue('banners/new.webp');
    const save = vi.spyOn(profileApi, 'updateProfile').mockResolvedValue({ ...user, bannerUrl: 'https://example.com/new.webp' });
    renderWithProviders(<ShopProfileCard user={user} handlingDays={2} verified stats={null} verification={null}/>);
    await interaction.upload(screen.getByLabelText('อัปโหลดรูปแบนเนอร์ร้าน'), new File(['banner'], 'banner.webp', { type: 'image/webp' }));
    await waitFor(() => expect(screen.getAllByAltText('แบนเนอร์ร้าน Seller')[0]).toHaveAttribute('src', 'blob:banner'));
    await waitFor(() => expect(screen.getByRole('button', { name: 'บันทึกข้อมูลหน้าร้าน' })).toBeEnabled());
    await interaction.click(screen.getByRole('button', { name: 'บันทึกข้อมูลหน้าร้าน' }));
    await waitFor(() => expect(save).toHaveBeenCalledWith(expect.objectContaining({ bannerUrl: 'banners/new.webp' })));
    expect(save.mock.calls[0][0]).not.toHaveProperty('avatarUrl', '');
    vi.unstubAllGlobals();
  });

  it('cancels banner removal and sends an empty key only when removal is saved', async () => {
    const interaction = userEvent.setup();
    const save = vi.spyOn(profileApi, 'updateProfile').mockResolvedValue({ ...user, bannerUrl: null });
    renderWithProviders(<ShopProfileCard user={{ ...user, bannerUrl: 'https://example.com/saved.webp' }} handlingDays={2} verified stats={null} verification={null}/>);
    await interaction.click(screen.getByRole('button', { name: 'ลบรูปแบนเนอร์' }));
    expect(screen.queryByAltText('แบนเนอร์ร้าน Seller')).not.toBeInTheDocument();
    await interaction.click(screen.getByRole('button', { name: 'ยกเลิก' }));
    expect(screen.getAllByAltText('แบนเนอร์ร้าน Seller')).toHaveLength(2);
    await interaction.click(screen.getByRole('button', { name: 'ลบรูปแบนเนอร์' }));
    await interaction.click(screen.getByRole('button', { name: 'บันทึกข้อมูลหน้าร้าน' }));
    await waitFor(() => expect(save).toHaveBeenCalledWith(expect.objectContaining({ bannerUrl: '' })));
  });

  it('keeps the saved banner after an invalid file', async () => {
    renderWithProviders(<ShopProfileCard user={{ ...user, bannerUrl: 'https://example.com/saved.webp' }} handlingDays={2} verified stats={null} verification={null}/>);
    fireEvent.change(screen.getByLabelText('อัปโหลดรูปแบนเนอร์ร้าน'), { target: { files: [new File(['bad'], 'banner.pdf', { type: 'application/pdf' })] } });
    expect(screen.getAllByAltText('แบนเนอร์ร้าน Seller')[0]).toHaveAttribute('src', 'https://example.com/saved.webp');
    expect(screen.getByRole('alert')).toHaveTextContent('ไม่รองรับ');
    expect(screen.getByRole('button', { name: 'บันทึกข้อมูลหน้าร้าน' })).toBeDisabled();
  });
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
  it('renders phone visibility switch with correct default state based on phonePublic', () => {
    const { unmount } = renderWithProviders(
      <ShopProfileCard user={{ ...user, phonePublic: false }} handlingDays={2} verified stats={null} verification={null}/>
    );
    const switchOff = screen.getByRole('switch', { name: 'แสดงเบอร์โทรบนหน้าร้าน' });
    expect(switchOff).not.toBeChecked();
    unmount();

    renderWithProviders(
      <ShopProfileCard user={{ ...user, phonePublic: true }} handlingDays={2} verified stats={null} verification={null}/>
    );
    const switchOn = screen.getByRole('switch', { name: 'แสดงเบอร์โทรบนหน้าร้าน' });
    expect(switchOn).toBeChecked();
  });
  it('switches dynamic label properly between ON and OFF states', async () => {
    renderWithProviders(<ShopProfileCard user={{ ...user, phonePublic: false }} handlingDays={2} verified stats={null} verification={null}/>);
    const interaction = userEvent.setup();
    const toggle = screen.getByRole('switch', { name: 'แสดงเบอร์โทรบนหน้าร้าน' });

    expect(screen.getByText('Private · เฉพาะคุณที่เห็นเบอร์โทรในโปรไฟล์')).toBeInTheDocument();
    expect(screen.queryByText('สาธารณะ · ผู้เข้าชมหน้าร้านมองเห็นเบอร์โทรได้')).not.toBeInTheDocument();

    await interaction.click(toggle);
    expect(screen.getByText('สาธารณะ · ผู้เข้าชมหน้าร้านมองเห็นเบอร์โทรได้')).toBeInTheDocument();
    expect(screen.queryByText('Private · เฉพาะคุณที่เห็นเบอร์โทรในโปรไฟล์')).not.toBeInTheDocument();

    await interaction.click(toggle);
    expect(screen.getByText('Private · เฉพาะคุณที่เห็นเบอร์โทรในโปรไฟล์')).toBeInTheDocument();
    expect(screen.queryByText('สาธารณะ · ผู้เข้าชมหน้าร้านมองเห็นเบอร์โทรได้')).not.toBeInTheDocument();
  });
  it('disables the switch when phone number is empty or whitespace and enables when phone is entered', async () => {
    renderWithProviders(<ShopProfileCard user={{ ...user, phone: null, phonePublic: false }} handlingDays={2} verified stats={null} verification={null}/>);
    const interaction = userEvent.setup();
    const phoneInput = screen.getByLabelText('เบอร์โทรติดต่อ');
    const toggle = screen.getByRole('switch', { name: 'แสดงเบอร์โทรบนหน้าร้าน' });

    // Initially empty -> disabled
    expect(toggle).toHaveAttribute('aria-disabled', 'true');
    expect(toggle).toHaveAttribute('data-disabled');

    // Type whitespace -> still disabled
    await interaction.type(phoneInput, '   ');
    expect(toggle).toHaveAttribute('aria-disabled', 'true');
    expect(toggle).toHaveAttribute('data-disabled');

    // Type valid phone -> enabled
    await interaction.clear(phoneInput);
    await interaction.type(phoneInput, '0812345678');
    expect(toggle).not.toHaveAttribute('aria-disabled', 'true');
    expect(toggle).not.toHaveAttribute('data-disabled');

    // Clear phone -> disabled again
    await interaction.clear(phoneInput);
    expect(toggle).toHaveAttribute('aria-disabled', 'true');
    expect(toggle).toHaveAttribute('data-disabled');
  });
  it('triggers update payload with phonePublic when toggled', async () => {
    const save = vi.spyOn(profileApi, 'updateProfile').mockResolvedValue({ ...user, phonePublic: true });
    renderWithProviders(<ShopProfileCard user={{ ...user, phonePublic: false }} handlingDays={2} verified stats={null} verification={null}/>);
    const interaction = userEvent.setup();

    expect(screen.queryByText("เบอร์โทรศัพท์")).not.toBeInTheDocument();
    const toggle = screen.getByRole('switch', { name: 'แสดงเบอร์โทรบนหน้าร้าน' });
    expect(toggle).not.toBeChecked();

    await interaction.click(toggle);
    expect(toggle).toBeChecked();
    expect(screen.getByText('เบอร์โทรศัพท์ : 0812345678')).toBeInTheDocument();

    await interaction.click(screen.getByRole('button', { name: 'บันทึกข้อมูลหน้าร้าน' }));
    await waitFor(() => expect(save).toHaveBeenCalledWith({ phone: null, avatarUrl: null, phonePublic: true }));
  });
  it('accepts one character names and rejects blank names per backend constraints', () => {
    expect(editProfileSchema.safeParse({ displayName: 'ก', phone: '', bio: '' }).success).toBe(true);
    expect(editProfileSchema.safeParse({ displayName: '  ', phone: '', bio: '' }).success).toBe(false);
  });
});
