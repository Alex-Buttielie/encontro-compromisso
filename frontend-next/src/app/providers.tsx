'use client';

import { useState, type ReactNode } from 'react';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v15-appRouter';
import { Provider as ReduxProvider } from 'react-redux';
import { QueryClientProvider } from '@tanstack/react-query';
import { ThemeModeProvider } from '@/contexts/ThemeContext';
import { store } from '@/store';
import { createQueryClient } from '@/lib/queryClient';
import { AuthProvider } from '@/contexts/AuthContext';
import { ToastProvider } from '@/contexts/ToastContext';
import { ErrorDialogProvider } from '@/contexts/ErrorDialogContext';
import { SocketProvider } from '@/contexts/SocketContext';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { OnboardingTour } from '@/components/OnboardingTour';
import '@/i18n';

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => createQueryClient());

  return (
    <AppRouterCacheProvider>
      <ThemeModeProvider>
        <ErrorBoundary>
          <ReduxProvider store={store}>
            <QueryClientProvider client={queryClient}>
              <AuthProvider>
                <ToastProvider>
                  <ErrorDialogProvider>
                    <SocketProvider>
                      <OnboardingTour />
                      {children}
                    </SocketProvider>
                  </ErrorDialogProvider>
                </ToastProvider>
              </AuthProvider>
            </QueryClientProvider>
          </ReduxProvider>
        </ErrorBoundary>
      </ThemeModeProvider>
    </AppRouterCacheProvider>
  );
}
