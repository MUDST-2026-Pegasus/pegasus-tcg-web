import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/utils';
import { RegisterForm } from '@/features/auth/components/RegisterForm';
import * as authQueries from '@/features/auth/auth.queries';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('RegisterForm', () => {
  const mockMutateAsync = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(authQueries, 'useRegister').mockReturnValue({
      mutateAsync: mockMutateAsync,
      isError: false,
      error: null,
    } as any);
  });

  it('renders register form correctly', () => {
    renderWithProviders(<RegisterForm />);
    
    expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/display name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    // Use getAllByLabelText for password as there are multiple password fields
    expect(screen.getAllByLabelText(/password/i).length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: /sign up/i })).toBeInTheDocument();
  });

  it('shows validation errors for empty fields', async () => {
    renderWithProviders(<RegisterForm />);
    
    const submitButton = screen.getByRole('button', { name: /sign up/i });
    await userEvent.click(submitButton);

    // Zod validation messages
    expect(await screen.findByText(/username must be at least 3 characters/i)).toBeInTheDocument();
    expect(await screen.findByText(/Email is required/i)).toBeInTheDocument();
    expect(mockMutateAsync).not.toHaveBeenCalled();
  });

  it('calls register mutation with valid data and navigates on success', async () => {
    mockMutateAsync.mockResolvedValueOnce({
      tokens: { accessToken: '123', refreshToken: '456' },
      user: { id: '1', username: 'testuser', email: 'test@example.com' }
    });

    renderWithProviders(<RegisterForm />);
    
    await userEvent.type(screen.getByLabelText(/username/i), 'testuser');
    await userEvent.type(screen.getByLabelText(/display name/i), 'Test User');
    await userEvent.type(screen.getByLabelText(/email/i), 'test@example.com');
    
    // Select correct password inputs based on their ids
    // Assuming first is the main password, second is confirm (though label for confirm is "Confirm password")
    await userEvent.type(document.getElementById('password') as HTMLInputElement, 'password123');
    await userEvent.type(document.getElementById('confirmPassword') as HTMLInputElement, 'password123');
    
    // Checkbox for terms
    await userEvent.click(document.getElementById('terms') as HTMLInputElement);

    const submitButton = screen.getByRole('button', { name: /sign up/i });
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith({
        username: 'testuser',
        displayName: 'Test User',
        email: 'test@example.com',
        password: 'password123',
      });
    });

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/', { replace: true });
    });
  });
});
