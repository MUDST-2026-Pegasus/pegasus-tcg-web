import type { ReactElement, ReactNode } from 'react';
import { render, type RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { TolgeeProvider } from '@tolgee/react';

import type { Language } from '@/lib/i18n';
import { registerErrorTranslator } from '@/lib/i18n/errors';
import { testTolgee } from '@/test/i18n';

export const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
      mutations: {
        retry: false,
      }
    },
  });

export function renderWithProviders(
  ui: ReactElement,
  { route = '/', language = 'th', ...options }: Omit<RenderOptions, 'wrapper'> & { route?: string; language?: Language } = {}
) {
  const testQueryClient = createTestQueryClient();
  window.history.pushState({}, 'Test page', route);

  document.documentElement.lang = language;
  registerErrorTranslator(testTolgee(language));

  const Wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={testQueryClient}>
      <TolgeeProvider tolgee={testTolgee(language)} fallback={null}>
        <MemoryRouter initialEntries={[route]}>{children}</MemoryRouter>
      </TolgeeProvider>
    </QueryClientProvider>
  );

  return render(ui, { wrapper: Wrapper, ...options });
}

export * from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';
