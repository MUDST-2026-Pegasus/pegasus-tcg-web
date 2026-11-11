import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/utils';
import errorsTh from '@/i18n/errors/th.json';
import { LoginForm } from '@/features/auth/components/LoginForm';
import { AUTH_ERROR_MESSAGES } from '@/features/auth/auth.errors';
import * as authQueries from '@/features/auth/auth.queries';
import { takePendingClaim } from '@/features/promotions/claim-redirect';
import { ApiError, type ApiErrorCode } from '@/lib/api';

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
  const mockGoogleMutateAsync = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
    delete window.google;
    document
      .querySelectorAll('script[src="https://accounts.google.com/gsi/client"]')
      .forEach((node) => node.remove());

    // Mock the useLogin hook
    vi.spyOn(authQueries, 'useLogin').mockReturnValue({
      mutateAsync: mockMutateAsync,
      reset: vi.fn(),
      isError: false,
      error: null,
    } as unknown as ReturnType<typeof authQueries.useLogin>);

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

  it('renders login form correctly', () => {
    renderWithProviders(<LoginForm />);
    
    expect(screen.getByLabelText("อีเมล")).toBeInTheDocument();
    expect(screen.getByLabelText("รหัสผ่าน")).toBeInTheDocument();
    expect(screen.getByRole('button', { name: "เข้าสู่ระบบ" })).toBeInTheDocument();
  });

  it('toggles with mouse and keyboard without losing the value or selection or submitting', async () => {
    const user = userEvent.setup();
    renderWithProviders(<LoginForm />);
    const input = screen.getByLabelText("รหัสผ่าน") as HTMLInputElement;
    expect(input).toHaveAttribute('type', 'password');
    await user.type(input, 'password123');
    input.setSelectionRange(2, 5, 'backward');
    const toggle = screen.getByRole('button', { name: 'Show password' });
    expect(toggle).toHaveAttribute('type', 'button');
    await user.click(toggle);
    expect(input).toHaveAttribute('type', 'text');
    expect(input).toHaveValue('password123');
    expect(input).toHaveFocus();
    expect([input.selectionStart, input.selectionEnd, input.selectionDirection]).toEqual([2, 5, 'backward']);
    await user.tab();
    expect(toggle).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(input).toHaveAttribute('type', 'password');
    expect([input.selectionStart, input.selectionEnd]).toEqual([2, 5]);
    expect(toggle).toHaveFocus();
    await user.keyboard(' ');
    expect(input).toHaveAttribute('type', 'text');
    expect(screen.queryByText("กรุณากรอกอีเมล")).not.toBeInTheDocument();
    expect(mockMutateAsync).not.toHaveBeenCalled();
  });

  it('shows validation errors for empty fields', async () => {
    renderWithProviders(<LoginForm />);
    
    const submitButton = screen.getByRole('button', { name: "เข้าสู่ระบบ" });
    await userEvent.click(submitButton);

    // Schema validation errors from Zod
    expect(await screen.findByText("กรุณากรอกอีเมล")).toBeInTheDocument();
    expect(await screen.findByText("กรุณากรอกรหัสผ่าน")).toBeInTheDocument();
    expect(mockMutateAsync).not.toHaveBeenCalled();
  });

  it('calls login mutation with valid data and navigates on success', async () => {
    mockMutateAsync.mockResolvedValueOnce({
      tokens: { accessToken: '123', expiresIn: 900 },
      user: { id: '1', email: 'test@example.com', name: 'Test' }
    });

    renderWithProviders(<LoginForm />);
    
    await userEvent.type(screen.getByLabelText("อีเมล"), 'test@example.com');
    await userEvent.type(screen.getByLabelText("รหัสผ่าน"), 'password123');
    
    const submitButton = screen.getByRole('button', { name: "เข้าสู่ระบบ" });
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
    } as unknown as ReturnType<typeof authQueries.useLogin>);

    renderWithProviders(<LoginForm />);
    
    expect(screen.getByText(/เข้าสู่ระบบไม่สำเร็จ/)).toBeInTheDocument();
  });

  it('hides Google button and "หรือ" divider when VITE_GOOGLE_CLIENT_ID is missing', () => {
    vi.stubEnv('VITE_GOOGLE_CLIENT_ID', '');
    renderWithProviders(<LoginForm />);

    expect(screen.queryByTestId('google-signin-button')).not.toBeInTheDocument();
    expect(screen.queryByText("หรือ")).not.toBeInTheDocument();
    expect(screen.getByText(/การดำเนินการต่อถือว่าคุณยอมรับ/)).toBeInTheDocument();
  });

  it('hides Google button and "หรือ" divider when GIS script fails to load', async () => {
    vi.stubEnv('VITE_GOOGLE_CLIENT_ID', 'test-google-client-id');
    renderWithProviders(<LoginForm />);

    const script = document.querySelector(
      'script[src="https://accounts.google.com/gsi/client"]',
    );
    expect(script).not.toBeNull();
    act(() => {
      script?.dispatchEvent(new Event('error'));
    });

    await waitFor(() => {
      expect(screen.queryByTestId('google-signin-button')).not.toBeInTheDocument();
      expect(screen.queryByText("หรือ")).not.toBeInTheDocument();
    });
    expect(screen.getByLabelText("อีเมล")).toBeEnabled();
  });

  it('renders Google Sign-In button with GIS options, consent links, and navigates on success without storing credential', async () => {
    vi.stubEnv('VITE_GOOGLE_CLIENT_ID', 'test-google-client-id');
    let capturedCallback: ((res: { credential?: string }) => void) | undefined;
    const initializeMock = vi.fn(({ callback }) => {
      capturedCallback = callback;
    });
    const renderButtonMock = vi.fn((container: HTMLElement) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.textContent = 'Continue with Google';
      btn.onclick = () => capturedCallback?.({ credential: 'mock-id-token' });
      container.appendChild(btn);
    });

    window.google = {
      accounts: {
        id: {
          initialize: initializeMock,
          renderButton: renderButtonMock,
        },
      },
    };

    mockGoogleMutateAsync.mockResolvedValueOnce({
      tokens: { accessToken: 'access-123', expiresIn: 900 },
      user: { id: 1, email: 'google@example.com', roles: ['BUYER'] },
    });

    renderWithProviders(<LoginForm />, { route: '/login?next=%2Fmarket&claim=42' });

    expect(initializeMock).toHaveBeenCalledWith(
      expect.objectContaining({
        client_id: 'test-google-client-id',
        ux_mode: 'popup',
      }),
    );
    expect(renderButtonMock).toHaveBeenCalledWith(
      expect.any(HTMLElement),
      expect.objectContaining({
        theme: 'outline',
        size: 'large',
        shape: 'rectangular',
        text: 'continue_with',
        width: 400,
      }),
    );

    expect(screen.getByText(/การดำเนินการต่อถือว่าคุณยอมรับ/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'ข้อกำหนดการใช้บริการ' })).toHaveAttribute('href', '/terms-of-service');
    expect(screen.getByRole('link', { name: 'นโยบายความเป็นส่วนตัว' })).toHaveAttribute('href', '/privacy-policy');
    expect(screen.getByText('หรือ')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Continue with Google' }));

    await waitFor(() => {
      expect(mockGoogleMutateAsync).toHaveBeenCalledWith({ credential: 'mock-id-token' });
    });
    expect(takePendingClaim()).toBe(42);
    expect(mockNavigate).toHaveBeenCalledWith('/market', { replace: true });
    expect(window.localStorage.getItem('credential')).toBeNull();
    expect(JSON.stringify(window.localStorage)).not.toContain('mock-id-token');
  });

  it('shows loading state and disables email/password form while Google Sign-In is pending', () => {
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

    renderWithProviders(<LoginForm />);

    expect(screen.getByText('กำลังเข้าสู่ระบบด้วย Google...')).toBeInTheDocument();
    expect(screen.getByLabelText("อีเมล")).toBeDisabled();
    expect(screen.getByLabelText("รหัสผ่าน")).toBeDisabled();
    expect(screen.getByRole('button', { name: "เข้าสู่ระบบ" })).toBeDisabled();
  });

  it.each(
    Object.entries(AUTH_ERROR_MESSAGES) as [
      ApiErrorCode,
      { title: string; description: string },
    ][],
  )('renders ACC-3 alert for error code %s', (code) => {
    const expected = errorsTh.authAlert[code as keyof typeof errorsTh.authAlert];
    vi.spyOn(authQueries, 'useGoogleSignIn').mockReturnValue({
      mutateAsync: mockGoogleMutateAsync,
      reset: vi.fn(),
      isPending: false,
      isError: true,
      error: new ApiError({ status: 400, code, message: 'Server error' }),
    } as unknown as ReturnType<typeof authQueries.useGoogleSignIn>);

    renderWithProviders(<LoginForm />);

    expect(screen.getByText(expected.title)).toBeInTheDocument();
    expect(screen.getByText(expected.description)).toBeInTheDocument();
  });
});
