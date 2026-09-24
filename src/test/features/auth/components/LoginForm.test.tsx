import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/utils';
import { LoginForm } from '@/features/auth/components/LoginForm';
import * as authQueries from '@/features/auth/auth.queries';

// Mock the react-router-dom useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('LoginForm', () => {
  const mockMutateAsync = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock the useLogin hook
    vi.spyOn(authQueries, 'useLogin').mockReturnValue({
      mutateAsync: mockMutateAsync,
      isError: false,
      error: null,
    } as any);
  });

  it('renders login form correctly', () => {
    renderWithProviders(<LoginForm />);
    
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /log in/i })).toBeInTheDocument();
  });

  it('shows validation errors for empty fields', async () => {
    renderWithProviders(<LoginForm />);
    
    const submitButton = screen.getByRole('button', { name: /log in/i });
    await userEvent.click(submitButton);

    // Schema validation errors from Zod
    expect(await screen.findByText(/email is required/i)).toBeInTheDocument();
    expect(await screen.findByText(/password is required/i)).toBeInTheDocument();
    expect(mockMutateAsync).not.toHaveBeenCalled();
  });

  it('calls login mutation with valid data and navigates on success', async () => {
    mockMutateAsync.mockResolvedValueOnce({
      tokens: { accessToken: '123', refreshToken: '456' },
      user: { id: '1', email: 'test@example.com', name: 'Test' }
    });

    renderWithProviders(<LoginForm />);
    
    await userEvent.type(screen.getByLabelText(/email/i), 'test@example.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'password123');
    
    const submitButton = screen.getByRole('button', { name: /log in/i });
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
    });

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/', { replace: true });
    });
  });

  it('shows API error message on login failure', async () => {
    vi.spyOn(authQueries, 'useLogin').mockReturnValue({
      mutateAsync: mockMutateAsync,
      isError: true,
      error: { status: 401, data: { message: 'Invalid credentials' } },
    } as any);

    renderWithProviders(<LoginForm />);
    
    expect(screen.getByText(/could not sign you in/i)).toBeInTheDocument();
  });
});
