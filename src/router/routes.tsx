import { Suspense } from 'react';
import { RouteObject } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { LoadingState } from '@/components/common/LoadingState';
import { NotFound } from '@/components/common/NotFound';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

import { HomePage } from '@/features/home/HomePage';
import { SearchPage } from '@/features/listings/SearchPage';
import { ListingDetailsPage } from '@/features/listings/ListingDetailsPage';
import { CreateListingPage } from '@/features/listings/CreateListingPage';
import { MyListingsPage } from '@/features/listings/MyListingsPage';
import { MessagesPage } from '@/features/messages/MessagesPage';
import { ProfilePage } from '@/features/profile/ProfilePage';
import { AdminPage } from '@/features/admin/AdminPage';
import { LoginPage } from '@/features/auth/LoginPage';
import { RegisterPage } from '@/features/auth/RegisterPage';
import { ForgotPasswordPage } from '@/features/auth/ForgotPasswordPage';
import { ResetPasswordPage } from '@/features/auth/ResetPasswordPage';
import { AuthCallbackPage } from '@/features/auth/AuthCallbackPage';
import { SuspendedAccountPage } from '@/features/auth/SuspendedAccountPage';
import { AuthProvider } from '@/features/auth/AuthContext';

export const routes: RouteObject[] = [
  {
    path: '/',
    element: (
      <AuthProvider>
        <AppLayout />
      </AuthProvider>
    ),
    children: [
      {
        index: true,
        element: (
          <Suspense fallback={<LoadingState fullPage />}>
            <HomePage />
          </Suspense>
        ),
      },
      {
        path: 'search',
        element: (
          <Suspense fallback={<LoadingState fullPage />}>
            <SearchPage />
          </Suspense>
        ),
      },
      {
        path: 'listings/:id',
        element: (
          <Suspense fallback={<LoadingState fullPage />}>
            <ListingDetailsPage />
          </Suspense>
        ),
      },
      {
        path: 'listings/create',
        element: (
          <ProtectedRoute>
            <Suspense fallback={<LoadingState fullPage />}>
              <CreateListingPage />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      {
        path: 'my-listings',
        element: (
          <ProtectedRoute>
            <Suspense fallback={<LoadingState fullPage />}>
              <MyListingsPage />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      {
        path: 'messages',
        element: (
          <ProtectedRoute>
            <Suspense fallback={<LoadingState fullPage />}>
              <MessagesPage />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      {
        path: 'profile',
        element: (
          <ProtectedRoute>
            <Suspense fallback={<LoadingState fullPage />}>
              <ProfilePage />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      {
        path: 'admin',
        element: (
          <ProtectedRoute requireAdmin>
            <Suspense fallback={<LoadingState fullPage />}>
              <AdminPage />
            </Suspense>
          </ProtectedRoute>
        ),
      },
      {
        path: 'login',
        element: (
          <Suspense fallback={<LoadingState fullPage />}>
            <LoginPage />
          </Suspense>
        ),
      },
      {
        path: 'register',
        element: (
          <Suspense fallback={<LoadingState fullPage />}>
            <RegisterPage />
          </Suspense>
        ),
      },
      {
        path: 'forgot-password',
        element: (
          <Suspense fallback={<LoadingState fullPage />}>
            <ForgotPasswordPage />
          </Suspense>
        ),
      },
      {
        path: 'reset-password',
        element: (
          <Suspense fallback={<LoadingState fullPage />}>
            <ResetPasswordPage />
          </Suspense>
        ),
      },
      {
        path: 'auth/callback',
        element: (
          <Suspense fallback={<LoadingState fullPage />}>
            <AuthCallbackPage />
          </Suspense>
        ),
      },
      {
        path: 'suspended',
        element: (
          <Suspense fallback={<LoadingState fullPage />}>
            <SuspendedAccountPage />
          </Suspense>
        ),
      },
      {
        path: '*',
        element: <NotFound />,
      },
    ],
  },
];
