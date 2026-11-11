import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/utils';
import errorsTh from '@/i18n/errors/th.json';
import { RegisterForm } from '@/features/auth/components/RegisterForm';
import { AUTH_ERROR_MESSAGES } from '@/features/auth/auth.errors';
import * as authQueries from '@/features/auth/auth.queries';
import { ApiError, type ApiErrorCode } from '@/lib/api';

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
  const mockGoogleMutateAsync = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
    delete window.google;
    document
      .querySelectorAll('script[src="https://accounts.google.com/gsi/client"]')
      .forEach((node) => node.remove());

    vi.spyOn(authQueries, 'useRegister').mockReturnValue({
      mutateAsync: mockMutateAsync,
      reset: vi.fn(),
      isError: false,
      error: null,
    } as unknown as ReturnType<typeof authQueries.useRegister>);

    vi.spyOn(authQueries, 'useGoogleSignIn').mockReturnValue({
      mutateAsync: mockGoogleMutateAsync,
      reset: vi.fn(),
      isPending: false,
      isError: false,
      error: null,
    } as unknown as ReturnType<typeof authQueries.useGoogleSignIn>);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    delete window.google;
  });

  it('renders register form correctly', () => {
    renderWithProviders(<RegisterForm />);
    
    expect(screen.getByLabelText("ชื่อผู้ใช้")).toBeInTheDocument();
    expect(screen.getByLabelText("ชื่อที่แสดง")).toBeInTheDocument();
    expect(screen.getByLabelText("อีเมล")).toBeInTheDocument();
    // Use getAllByLabelText for password as there are multiple password fields
    expect(screen.getAllByLabelText("รหัสผ่าน").length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: "สมัครสมาชิก" })).toBeInTheDocument();
  });

  it('opens legal pages from their links while the agreement checkbox stays separate', async () => {
    const user = userEvent.setup();
    renderWithProviders(<RegisterForm />);

    const terms = screen.getByRole('link', { name: 'ข้อกำหนดการใช้บริการ' });
    const privacy = screen.getByRole('link', { name: 'นโยบายความเป็นส่วนตัว' });
    expect(terms).toHaveAttribute('href', '/terms-of-service');
    expect(privacy).toHaveAttribute('href', '/privacy-policy');
    expect(terms).toHaveAttribute('target', '_blank');
    expect(privacy).toHaveAttribute('target', '_blank');

    const agreement = screen.getByRole('checkbox');
    expect(agreement).not.toBeChecked();
    await user.click(screen.getByText('ฉันยอมรับ'));
    expect(agreement).toBeChecked();
    await user.click(screen.getByText('ฉันยอมรับ'));
    expect(agreement).not.toBeChecked();
  });

  it('toggles password and confirmation independently without submitting', async () => {
    const user = userEvent.setup();
    renderWithProviders(<RegisterForm />);
    const password = screen.getByLabelText("รหัสผ่าน");
    const confirmation = screen.getByLabelText("ยืนยันรหัสผ่าน");
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
    expect(screen.queryByText("กรุณากรอกอีเมล")).not.toBeInTheDocument();
    expect(mockMutateAsync).not.toHaveBeenCalled();
  });

  it('shows validation errors for empty fields', async () => {
    renderWithProviders(<RegisterForm />);
    
    const submitButton = screen.getByRole('button', { name: "สมัครสมาชิก" });
    await userEvent.click(submitButton);

    // Zod validation messages
    expect(await screen.findByText("ชื่อผู้ใช้ต้องมีอย่างน้อย 3 ตัวอักษร")).toBeInTheDocument();
    expect(await screen.findByText("กรุณากรอกอีเมล")).toBeInTheDocument();
    expect(mockMutateAsync).not.toHaveBeenCalled();
  });

  it('calls register mutation with valid data and navigates on success', async () => {
    mockMutateAsync.mockResolvedValueOnce({
      tokens: { accessToken: '123', expiresIn: 900 },
      user: { id: '1', username: 'testuser', email: 'test@example.com' }
    });

    renderWithProviders(<RegisterForm />);
    
    await userEvent.type(screen.getByLabelText("ชื่อผู้ใช้"), 'testuser');
    await userEvent.type(screen.getByLabelText("ชื่อที่แสดง"), 'Test User');
    await userEvent.type(screen.getByLabelText("อีเมล"), 'test@example.com');
    
    // Select correct password inputs based on their ids
    await userEvent.type(document.getElementById('password') as HTMLInputElement, 'password123');
    await userEvent.type(document.getElementById('confirmPassword') as HTMLInputElement, 'password123');
    
    // Checkbox for terms
    await userEvent.click(document.getElementById('terms') as HTMLInputElement);

    const submitButton = screen.getByRole('button', { name: "สมัครสมาชิก" });
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

  it('shows standard API message and field error when password registration fails with EMAIL_ALREADY_USED', async () => {
    const emailConflict = new ApiError({
      status: 409,
      code: 'EMAIL_ALREADY_USED',
      message: 'Email address is already registered',
    });
    mockMutateAsync.mockRejectedValueOnce(emailConflict);
    vi.spyOn(authQueries, 'useRegister').mockReturnValue({
      mutateAsync: mockMutateAsync,
      reset: vi.fn(),
      isError: true,
      error: emailConflict,
    } as unknown as ReturnType<typeof authQueries.useRegister>);

    renderWithProviders(<RegisterForm />);

    await userEvent.type(screen.getByLabelText("ชื่อผู้ใช้"), 'testuser');
    await userEvent.type(screen.getByLabelText("ชื่อที่แสดง"), 'Test User');
    await userEvent.type(screen.getByLabelText("อีเมล"), 'taken@example.com');
    await userEvent.type(document.getElementById('password') as HTMLInputElement, 'password123');
    await userEvent.type(document.getElementById('confirmPassword') as HTMLInputElement, 'password123');
    await userEvent.click(document.getElementById('terms') as HTMLInputElement);
    await userEvent.click(screen.getByRole('button', { name: "สมัครสมาชิก" }));

    await waitFor(() => {
      expect(screen.getAllByText('Email address is already registered').length).toBeGreaterThanOrEqual(2);
    });
    expect(screen.queryByText("ใช้อีเมลนี้ไม่ได้")).not.toBeInTheDocument();
  });

  it('hides Google button and "หรือ" divider when VITE_GOOGLE_CLIENT_ID is missing', () => {
    vi.stubEnv('VITE_GOOGLE_CLIENT_ID', '');
    renderWithProviders(<RegisterForm />);

    expect(screen.queryByTestId('google-signin-button')).not.toBeInTheDocument();
    expect(screen.queryByText("หรือ")).not.toBeInTheDocument();
  });

  it('renders "หรือ" divider and Google button below the Sign up button without duplicating legal links', async () => {
    vi.stubEnv('VITE_GOOGLE_CLIENT_ID', 'test-google-client-id');
    let capturedCallback: ((res: { credential?: string }) => void) | undefined;
    window.google = {
      accounts: {
        id: {
          initialize: vi.fn(({ callback }) => {
            capturedCallback = callback;
          }),
          renderButton: vi.fn((container: HTMLElement) => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.textContent = 'Continue with Google';
            btn.onclick = () => capturedCallback?.({ credential: 'register-google-id-token' });
            container.appendChild(btn);
          }),
        },
      },
    };

    mockGoogleMutateAsync.mockResolvedValueOnce({
      tokens: { accessToken: 'access-123', expiresIn: 900 },
      user: { id: 2, email: 'newgoogle@example.com', roles: ['BUYER'] },
    });

    renderWithProviders(<RegisterForm />);

    expect(screen.getAllByRole('link', { name: 'ข้อกำหนดการใช้บริการ' })).toHaveLength(1);
    expect(screen.getAllByRole('link', { name: 'นโยบายความเป็นส่วนตัว' })).toHaveLength(1);
    expect(screen.getByText('หรือ')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Continue with Google' }));

    await waitFor(() => {
      expect(mockGoogleMutateAsync).toHaveBeenCalledWith({ credential: 'register-google-id-token' });
    });
    expect(mockNavigate).toHaveBeenCalledWith('/', { replace: true });
  });

  it('disables registration fields while Google Sign-In is pending', () => {
    vi.stubEnv('VITE_GOOGLE_CLIENT_ID', 'test-google-client-id');
    window.google = {
      accounts: {
        id: {
          initialize: vi.fn(),
          renderButton: vi.fn(),
        },
      },
    };

    vi.spyOn(authQueries, 'useGoogleSignIn').mockReturnValue({
      mutateAsync: mockGoogleMutateAsync,
      reset: vi.fn(),
      isPending: true,
      isError: false,
      error: null,
    } as unknown as ReturnType<typeof authQueries.useGoogleSignIn>);

    renderWithProviders(<RegisterForm />);

    expect(screen.getByText('กำลังเข้าสู่ระบบด้วย Google...')).toBeInTheDocument();
    expect(screen.getByLabelText("ชื่อผู้ใช้")).toBeDisabled();
    expect(screen.getByLabelText("ชื่อที่แสดง")).toBeDisabled();
    expect(screen.getByLabelText("อีเมล")).toBeDisabled();
    expect(screen.getByRole('button', { name: "สมัครสมาชิก" })).toBeDisabled();
  });

  it.each(
    Object.entries(AUTH_ERROR_MESSAGES) as [
      ApiErrorCode,
      { title: string; description: string },
    ][],
  )('renders ACC-3 alert on RegisterForm for error code %s', (code) => {
    const expected = errorsTh.authAlert[code as keyof typeof errorsTh.authAlert];
    vi.spyOn(authQueries, 'useGoogleSignIn').mockReturnValue({
      mutateAsync: mockGoogleMutateAsync,
      reset: vi.fn(),
      isPending: false,
      isError: true,
      error: new ApiError({ status: 400, code, message: 'Server error' }),
    } as unknown as ReturnType<typeof authQueries.useGoogleSignIn>);

    renderWithProviders(<RegisterForm />);

    expect(screen.getByText(expected.title)).toBeInTheDocument();
    expect(screen.getByText(expected.description)).toBeInTheDocument();
  });
});
