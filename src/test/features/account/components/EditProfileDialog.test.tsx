import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/utils';
import { EditProfileDialog } from '@/features/account/components/EditProfileDialog';
import * as profileQueries from '@/features/account/profile.queries';
import type { AuthUser } from '@/features/auth/auth.types';

const mockUser: AuthUser = {
  id: 1,
  username: 'johndoe',
  email: 'john@example.com',
  displayName: 'John Doe',
  roles: ['BUYER'],
  avatarUrl: null,
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

  it('renders form fields with default values without Avatar or Bio', () => {
    renderWithProviders(
      <EditProfileDialog open={true} onOpenChange={mockOnOpenChange} user={mockUser} />
    );
    
    // Name field
    const nameInput = screen.getByLabelText(/name/i);
    expect(nameInput).toHaveValue('John Doe');

    // Email field (disabled)
    const emailInput = screen.getByLabelText(/email/i);
    expect(emailInput).toHaveValue('john@example.com');
    expect(emailInput).toBeDisabled();

    // Phone number field
    const phoneInput = screen.getByLabelText(/phone number/i);
    expect(phoneInput).toHaveValue('');
    expect(phoneInput).toHaveAttribute('placeholder', '(+66) 89-123-4567');

    // Bio field should be removed
    expect(screen.queryByLabelText(/bio/i)).not.toBeInTheDocument();

    // Avatar upload buttons should be removed
    expect(screen.queryByRole('button', { name: /change photo/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /remove/i })).not.toBeInTheDocument();
  });

  it('falls back to username when displayName is blank', () => {
    renderWithProviders(
      <EditProfileDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        user={{ ...mockUser, displayName: '', username: 'custom_username' }}
      />
    );

    const nameInput = screen.getByLabelText(/name/i);
    expect(nameInput).toHaveValue('custom_username');
  });

  it('calls update mutation and closes dialog on success', async () => {
    const user = userEvent.setup();
    mockMutateAsync.mockResolvedValueOnce({});
    
    renderWithProviders(
      <EditProfileDialog open={true} onOpenChange={mockOnOpenChange} user={mockUser} />
    );

    const nameInput = screen.getByLabelText(/name/i);
    fireEvent.change(nameInput, { target: { value: 'Jane Doe' } });

    const phoneInput = screen.getByLabelText(/phone number/i);
    await user.type(phoneInput, '0812345678');

    const saveButton = screen.getByRole('button', { name: /save changes/i });
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

    const saveButton = screen.getByRole('button', { name: /save changes/i });
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

    const phoneInput = screen.getByLabelText(/phone number/i);
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

    const phoneInput = screen.getByLabelText(/phone number/i);
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

    const saveButton = screen.getByRole('button', { name: /save changes/i });
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

    const saveButton = screen.getByRole('button', { name: /save changes/i });
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
