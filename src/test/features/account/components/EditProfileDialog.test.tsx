import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
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

  it('renders form fields with default values', () => {
    renderWithProviders(
      <EditProfileDialog open={true} onOpenChange={mockOnOpenChange} user={mockUser} />
    );
    
    // Using string matching for values
    expect(screen.getByLabelText(/display name/i)).toHaveValue('John Doe');
    expect(screen.getByLabelText(/email/i)).toHaveValue('john@example.com');
    expect(screen.getByLabelText(/email/i)).toBeDisabled();
    expect(screen.getByLabelText(/phone number/i)).toHaveValue('');
    expect(screen.getByLabelText(/avatar url/i)).toHaveValue('');
    expect(screen.getByLabelText(/bio/i)).toHaveValue('');
  });

  it('calls update mutation and closes dialog on success', async () => {
    mockMutateAsync.mockResolvedValueOnce({});
    
    renderWithProviders(
      <EditProfileDialog open={true} onOpenChange={mockOnOpenChange} user={mockUser} />
    );

    const nameInput = screen.getByLabelText(/display name/i);
    await userEvent.clear(nameInput);
    await userEvent.type(nameInput, 'Jane Doe');

    const phoneInput = screen.getByLabelText(/phone number/i);
    await userEvent.type(phoneInput, '0812345678');

    const saveButton = screen.getByRole('button', { name: /save changes/i });
    await userEvent.click(saveButton);

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

  it('sends empty avatarUrl to clear avatar when remove is clicked', async () => {
    mockMutateAsync.mockResolvedValueOnce({});
    const userWithAvatar: AuthUser = {
      ...mockUser,
      avatarUrl: 'https://storage.example.com/avatars/me.jpg',
    };

    renderWithProviders(
      <EditProfileDialog open={true} onOpenChange={mockOnOpenChange} user={userWithAvatar} />
    );

    const removeButton = screen.getByRole('button', { name: /remove/i });
    await userEvent.click(removeButton);

    const saveButton = screen.getByRole('button', { name: /save changes/i });
    expect(saveButton).toBeEnabled();
    await userEvent.click(saveButton);

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith({
        displayName: 'John Doe',
        phone: null,
        avatarUrl: '',
        bio: null,
      });
    });
  });

  it('updates bio when bio is changed', async () => {
    mockMutateAsync.mockResolvedValueOnce({});

    renderWithProviders(
      <EditProfileDialog open={true} onOpenChange={mockOnOpenChange} user={mockUser} />
    );

    const bioInput = screen.getByLabelText(/bio/i);
    await userEvent.type(bioInput, 'TCG card collector');

    const saveButton = screen.getByRole('button', { name: /save changes/i });
    expect(saveButton).toBeEnabled();
    await userEvent.click(saveButton);

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith({
        displayName: 'John Doe',
        phone: null,
        avatarUrl: null,
        bio: 'TCG card collector',
      });
    });
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
});
