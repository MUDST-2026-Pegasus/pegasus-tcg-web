import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/utils';
import { EditProfileDialog } from '@/features/account/components/EditProfileDialog';
import * as profileQueries from '@/features/account/profile.queries';
import * as uploadLib from '@/lib/upload';
import { toast } from '@/components/ui/toast';
import type { AuthUser } from '@/features/auth/auth.types';

vi.mock('@/components/ui/toast', () => ({
  toast: {
    add: vi.fn(),
  },
}));

vi.mock('@/lib/upload', async (importOriginal) => ({
  ...await importOriginal<typeof import('@/lib/upload')>(),
  uploadFile: vi.fn(),
}));

const mockUser: AuthUser = {
  id: 1,
  username: 'johndoe',
  email: 'john@example.com',
  displayName: 'John Doe',
  roles: ['BUYER'],
  avatarUrl: null, bannerUrl: null,
  phone: null,
  bio: null,
  status: 'ACTIVE',
  createdAt: '2026-01-01T00:00:00Z',
  lastLoginAt: null,
};

describe('EditProfileDialog', () => {
  const mockMutateAsync = vi.fn();
  const mockOnOpenChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(profileQueries, 'useUpdateProfile').mockReturnValue({
      mutateAsync: mockMutateAsync,
      isError: false,
      error: null,
    } as unknown as ReturnType<typeof profileQueries.useUpdateProfile>);
  });

  it('renders form fields with default values, circular avatar uploader, and no Bio', () => {
    renderWithProviders(
      <EditProfileDialog open={true} onOpenChange={mockOnOpenChange} user={mockUser} />
    );
    
    // Circular Avatar uploader & helper caption
    expect(screen.getByRole('button', { name: "เปลี่ยนรูปโปรไฟล์" })).toBeInTheDocument();
    expect(screen.getByText("คลิกที่รูปเพื่อเปลี่ยน · JPG, PNG ไม่เกิน 5MB")).toBeInTheDocument();
    expect(screen.getByText('JD')).toBeInTheDocument();

    // Name field
    const nameInput = screen.getByLabelText("ชื่อ");
    expect(nameInput).toHaveValue('John Doe');

    // Email field (disabled)
    const emailInput = screen.getByLabelText("อีเมล");
    expect(emailInput).toHaveValue('john@example.com');
    expect(emailInput).toBeDisabled();

    // Phone number field
    const phoneInput = screen.getByLabelText("เบอร์โทรศัพท์");
    expect(phoneInput).toHaveValue('');
    expect(phoneInput).toHaveAttribute('placeholder', '(+66) 89-123-4567');

    // Bio field should be removed
    expect(screen.queryByLabelText(/bio/i)).not.toBeInTheDocument();

    // Avatar remove button should not be present
    expect(screen.queryByRole('button', { name: "นำออก" })).not.toBeInTheDocument();
  });

  it('renders existing avatar image when user has avatarUrl', () => {
    renderWithProviders(
      <EditProfileDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        user={{ ...mockUser, avatarUrl: 'https://example.com/avatar.jpg' }}
      />
    );

    const avatarImg = screen.getByRole('img', { name: 'John Doe' });
    expect(avatarImg).toHaveAttribute('src', 'https://example.com/avatar.jpg');
  });

  it('triggers hidden file input when clicking avatar wrapper', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <EditProfileDialog open={true} onOpenChange={mockOnOpenChange} user={mockUser} />
    );

    const fileInput = screen.getByLabelText('อัปโหลดรูปโปรไฟล์');
    const clickSpy = vi.spyOn(fileInput, 'click');

    const avatarButton = screen.getByRole('button', { name: 'เปลี่ยนรูปโปรไฟล์' });
    await user.click(avatarButton);

    expect(clickSpy).toHaveBeenCalled();
  });

  it('previews a valid JPG/PNG file and submits avatarUrl in payload', async () => {
    const user = userEvent.setup();
    vi.stubGlobal('URL', {
      ...URL,
      createObjectURL: vi.fn(() => 'blob:mock-avatar-preview'),
      revokeObjectURL: vi.fn(),
    });
    vi.mocked(uploadLib.uploadFile).mockResolvedValue('avatars/uploaded-key.png');
    mockMutateAsync.mockResolvedValueOnce({});

    renderWithProviders(
      <EditProfileDialog open={true} onOpenChange={mockOnOpenChange} user={mockUser} />
    );

    const fileInput = screen.getByLabelText('อัปโหลดรูปโปรไฟล์');
    const validFile = new File(['valid png bytes'], 'avatar.png', { type: 'image/png' });
    await user.upload(fileInput, validFile);

    // Instant preview is shown
    await waitFor(() => {
      expect(screen.getByRole('img', { name: 'John Doe' })).toHaveAttribute(
        'src',
        'blob:mock-avatar-preview',
      );
    });

    // Save button becomes enabled
    const saveButton = screen.getByRole('button', { name: 'บันทึกการเปลี่ยนแปลง' });
    await waitFor(() => expect(saveButton).toBeEnabled());

    await user.click(saveButton);

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          avatarUrl: 'avatars/uploaded-key.png',
        }),
      );
    });

    expect(mockOnOpenChange).toHaveBeenCalledWith(false);
    vi.unstubAllGlobals();
  });

  it('rejects files larger than 5MB and shows an error toast', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <EditProfileDialog open={true} onOpenChange={mockOnOpenChange} user={mockUser} />
    );

    const fileInput = screen.getByLabelText('อัปโหลดรูปโปรไฟล์');
    const largeFile = new File(['x'], 'large.jpg', { type: 'image/jpeg' });
    Object.defineProperty(largeFile, 'size', { value: 5 * 1024 * 1024 + 1 });

    await user.upload(fileInput, largeFile);

    expect(toast.add).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'error',
        title: 'ขนาดไฟล์ต้องไม่เกิน 5MB',
      }),
    );

    expect(screen.queryByRole('img', { name: 'John Doe' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'บันทึกการเปลี่ยนแปลง' })).toBeDisabled();
  });

  it('rejects files with unsupported format and shows an error toast', async () => {
    renderWithProviders(
      <EditProfileDialog open={true} onOpenChange={mockOnOpenChange} user={mockUser} />
    );

    const fileInput = screen.getByLabelText('อัปโหลดรูปโปรไฟล์');
    const invalidFile = new File(['pdf data'], 'doc.pdf', { type: 'application/pdf' });

    fireEvent.change(fileInput, { target: { files: [invalidFile] } });

    expect(toast.add).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'error',
        title: 'รองรับเฉพาะไฟล์ JPG และ PNG เท่านั้น',
      }),
    );

    expect(screen.queryByRole('img', { name: 'John Doe' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'บันทึกการเปลี่ยนแปลง' })).toBeDisabled();
  });

  it('revokes the created object URL cleanly when unmounting', async () => {
    const user = userEvent.setup();
    const revokeSpy = vi.fn();
    vi.stubGlobal('URL', {
      ...URL,
      createObjectURL: vi.fn(() => 'blob:mock-avatar-preview'),
      revokeObjectURL: revokeSpy,
    });
    vi.mocked(uploadLib.uploadFile).mockResolvedValue('avatars/uploaded-key.png');

    const { unmount } = renderWithProviders(
      <EditProfileDialog open={true} onOpenChange={mockOnOpenChange} user={mockUser} />
    );

    const fileInput = screen.getByLabelText('อัปโหลดรูปโปรไฟล์');
    const validFile = new File(['valid png bytes'], 'avatar.png', { type: 'image/png' });
    await user.upload(fileInput, validFile);

    expect(screen.getByRole('img', { name: 'John Doe' })).toHaveAttribute(
      'src',
      'blob:mock-avatar-preview',
    );

    unmount();

    expect(revokeSpy).toHaveBeenCalledWith('blob:mock-avatar-preview');
    vi.unstubAllGlobals();
  });

  it('falls back to username when displayName is blank', () => {
    renderWithProviders(
      <EditProfileDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        user={{ ...mockUser, displayName: '', username: 'custom_username' }}
      />
    );

    const nameInput = screen.getByLabelText("ชื่อ");
    expect(nameInput).toHaveValue('custom_username');
  });

  it('calls update mutation and closes dialog on success', async () => {
    const user = userEvent.setup();
    mockMutateAsync.mockResolvedValueOnce({});
    
    renderWithProviders(
      <EditProfileDialog open={true} onOpenChange={mockOnOpenChange} user={mockUser} />
    );

    const nameInput = screen.getByLabelText("ชื่อ");
    fireEvent.change(nameInput, { target: { value: 'Jane Doe' } });

    const phoneInput = screen.getByLabelText("เบอร์โทรศัพท์");
    await user.type(phoneInput, '0812345678');

    const saveButton = screen.getByRole('button', { name: "บันทึกการเปลี่ยนแปลง" });
    await user.click(saveButton);

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith({
        displayName: 'Jane Doe',
        phone: '0812345678',
        avatarUrl: null,
        bio: null,
      });
    });

    expect(mockOnOpenChange).toHaveBeenCalledWith(false);
  });

  it('disables save button when form has no changes', () => {
    renderWithProviders(
      <EditProfileDialog open={true} onOpenChange={mockOnOpenChange} user={mockUser} />
    );

    const saveButton = screen.getByRole('button', { name: "บันทึกการเปลี่ยนแปลง" });
    expect(saveButton).toBeDisabled();
  });

  it('displays error alert when mutation fails', () => {
    vi.spyOn(profileQueries, 'useUpdateProfile').mockReturnValue({
      mutateAsync: mockMutateAsync,
      isError: true,
      error: new Error('Network error occurred'),
    } as unknown as ReturnType<typeof profileQueries.useUpdateProfile>);

    renderWithProviders(
      <EditProfileDialog open={true} onOpenChange={mockOnOpenChange} user={mockUser} />
    );

    expect(screen.getByRole('alert')).toHaveTextContent(/network error occurred/i);
  });

  it('renders phone visibility switch under the phone number field', () => {
    renderWithProviders(
      <EditProfileDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        user={{ ...mockUser, phone: '0812345678', phonePublic: false }}
      />
    );

    const phoneInput = screen.getByLabelText("เบอร์โทรศัพท์");
    const switchElement = screen.getByRole('switch', { name: 'แสดงเบอร์โทรบนหน้าร้าน' });

    expect(phoneInput).toBeInTheDocument();
    expect(switchElement).toBeInTheDocument();
    expect(phoneInput.compareDocumentPosition(switchElement) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('toggles label text between ON and OFF states', async () => {
    const user = userEvent.setup();
    const { unmount } = renderWithProviders(
      <EditProfileDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        user={{ ...mockUser, phone: '0812345678', phonePublic: false }}
      />
    );

    const switchElement = screen.getByRole('switch', { name: 'แสดงเบอร์โทรบนหน้าร้าน' });
    expect(switchElement).not.toBeChecked();
    expect(screen.getByText('Private · เฉพาะคุณที่เห็นเบอร์โทรในโปรไฟล์')).toBeInTheDocument();
    expect(screen.queryByText('สาธารณะ · ผู้เข้าชมหน้าร้านมองเห็นเบอร์โทรได้')).not.toBeInTheDocument();

    // Toggle to ON
    await user.click(switchElement);
    expect(switchElement).toBeChecked();
    expect(screen.getByText('สาธารณะ · ผู้เข้าชมหน้าร้านมองเห็นเบอร์โทรได้')).toBeInTheDocument();
    expect(screen.queryByText('Private · เฉพาะคุณที่เห็นเบอร์โทรในโปรไฟล์')).not.toBeInTheDocument();

    // Toggle back to OFF
    await user.click(switchElement);
    expect(switchElement).not.toBeChecked();
    expect(screen.getByText('Private · เฉพาะคุณที่เห็นเบอร์โทรในโปรไฟล์')).toBeInTheDocument();
    expect(screen.queryByText('สาธารณะ · ผู้เข้าชมหน้าร้านมองเห็นเบอร์โทรได้')).not.toBeInTheDocument();

    unmount();

    // Initialize with phonePublic: true
    renderWithProviders(
      <EditProfileDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        user={{ ...mockUser, phone: '0812345678', phonePublic: true }}
      />
    );
    const switchOn = screen.getByRole('switch', { name: 'แสดงเบอร์โทรบนหน้าร้าน' });
    expect(switchOn).toBeChecked();
    expect(screen.getByText('สาธารณะ · ผู้เข้าชมหน้าร้านมองเห็นเบอร์โทรได้')).toBeInTheDocument();
  });

  it('disables the switch when phone number is blank and enables when filled', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <EditProfileDialog open={true} onOpenChange={mockOnOpenChange} user={{ ...mockUser, phone: null }} />
    );

    const phoneInput = screen.getByLabelText("เบอร์โทรศัพท์");
    const switchElement = screen.getByRole('switch', { name: 'แสดงเบอร์โทรบนหน้าร้าน' });

    // Initially blank -> disabled
    expect(switchElement).toHaveAttribute('aria-disabled', 'true');
    expect(switchElement).toHaveAttribute('data-disabled');

    // Clicking while disabled should not toggle switch
    await user.click(switchElement);
    expect(switchElement).not.toBeChecked();

    // Typing whitespace only -> still disabled
    await user.type(phoneInput, '   ');
    expect(switchElement).toHaveAttribute('aria-disabled', 'true');
    expect(switchElement).toHaveAttribute('data-disabled');

    // Entering a phone number -> enabled
    await user.clear(phoneInput);
    await user.type(phoneInput, '0812345678');
    expect(switchElement).not.toHaveAttribute('aria-disabled', 'true');
    expect(switchElement).not.toHaveAttribute('data-disabled');

    // Now clicking toggles the switch
    await user.click(switchElement);
    expect(switchElement).toBeChecked();

    // Clearing the phone number -> disabled again
    await user.clear(phoneInput);
    expect(switchElement).toHaveAttribute('aria-disabled', 'true');
    expect(switchElement).toHaveAttribute('data-disabled');
  });

  it('submits phonePublic in the payload when toggled', async () => {
    const user = userEvent.setup();
    mockMutateAsync.mockResolvedValueOnce({});

    renderWithProviders(
      <EditProfileDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        user={{ ...mockUser, phone: '0812345678', phonePublic: false }}
      />
    );

    const switchElement = screen.getByRole('switch', { name: 'แสดงเบอร์โทรบนหน้าร้าน' });
    await user.click(switchElement);

    const saveButton = screen.getByRole('button', { name: "บันทึกการเปลี่ยนแปลง" });
    expect(saveButton).toBeEnabled();
    await user.click(saveButton);

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith({
        displayName: 'John Doe',
        phone: null,
        avatarUrl: null,
        bio: null,
        phonePublic: true,
      });
    });

    expect(mockOnOpenChange).toHaveBeenCalledWith(false);
  });

  it('submits phonePublic: false when toggled from true to false', async () => {
    const user = userEvent.setup();
    mockMutateAsync.mockResolvedValueOnce({});

    renderWithProviders(
      <EditProfileDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        user={{ ...mockUser, phone: '0812345678', phonePublic: true }}
      />
    );

    const switchElement = screen.getByRole('switch', { name: 'แสดงเบอร์โทรบนหน้าร้าน' });
    expect(switchElement).toBeChecked();
    await user.click(switchElement);

    const saveButton = screen.getByRole('button', { name: "บันทึกการเปลี่ยนแปลง" });
    expect(saveButton).toBeEnabled();
    await user.click(saveButton);

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith({
        displayName: 'John Doe',
        phone: null,
        avatarUrl: null,
        bio: null,
        phonePublic: false,
      });
    });
  });
});
