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
    } as unknown as ReturnType<typeof authQueries.useRegister>);
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

  it('opens legal pages from their links while the agreement checkbox stays separate', async () => {
    const user = userEvent.setup();
    renderWithProviders(<RegisterForm />);

    const terms = screen.getByRole('link', { name: 'Terms of Service' });
    const privacy = screen.getByRole('link', { name: 'Privacy Policy' });
    expect(terms).toHaveAttribute('href', '/terms-of-service');
    expect(privacy).toHaveAttribute('href', '/privacy-policy');
    expect(terms).toHaveAttribute('target', '_blank');
    expect(privacy).toHaveAttribute('target', '_blank');

    const agreement = screen.getByRole('checkbox');
    expect(agreement).not.toBeChecked();
    await user.click(screen.getByText('I agree to the Pegasus'));
    expect(agreement).toBeChecked();
    await user.click(screen.getByText('I agree to the Pegasus'));
    expect(agreement).not.toBeChecked();
  });

  it('toggles password and confirmation independently without submitting', async () => {
    const user = userEvent.setup();
    renderWithProviders(<RegisterForm />);
    const password = screen.getByLabelText(/^password$/i);
    const confirmation = screen.getByLabelText(/^confirm password$/i);
    await user.type(password, 'password123');
    await user.type(confirmation, 'password123');
    expect(password).toHaveAttribute('type', 'password');
    expect(confirmation).toHaveAttribute('type', 'password');
    const toggles = screen.getAllByRole('button', { name: 'Show password' });
    await user.click(toggles[0]);
    expect(password).toHaveAttribute('type', 'text');
    expect(confirmation).toHaveAttribute('type', 'password');
    await user.click(toggles[1]);
    await user.click(toggles[0]);
    expect(password).toHaveAttribute('type', 'password');
    expect(confirmation).toHaveAttribute('type', 'text');
    expect(password).toHaveValue('password123');
    expect(confirmation).toHaveValue('password123');
    expect(screen.queryByText(/Email is required/i)).not.toBeInTheDocument();
    expect(mockMutateAsync).not.toHaveBeenCalled();
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
      tokens: { accessToken: '123', expiresIn: 900 },
      user: { id: '1', username: 'testuser', email: 'test@example.com' }
    });

    renderWithProviders(<RegisterForm />);
    
    await userEvent.type(screen.getByLabelText(/username/i), 'testuser');
    await userEvent.type(screen.getByLabelText(/display name/i), 'Test User');
    await userEvent.type(screen.getByLabelText(/email/i), 'test@example.com');
    
    // Select correct password inputs based on their ids
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
