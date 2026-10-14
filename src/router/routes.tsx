import { Suspense } from 'react';
import { RouteObject } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { LoadingState } from '@/components/common/LoadingState';
import { NotFound } from '@/components/common/NotFound';

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

export const routes: RouteObject[] = [
  {
    path: '/',
    element: <AppLayout />,
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
          <Suspense fallback={<LoadingState fullPage />}>
            <CreateListingPage />
          </Suspense>
        ),
      },
      {
        path: 'my-listings',
        element: (
          <Suspense fallback={<LoadingState fullPage />}>
            <MyListingsPage />
          </Suspense>
        ),
      },
      {
        path: 'messages',
        element: (
          <Suspense fallback={<LoadingState fullPage />}>
            <MessagesPage />
          </Suspense>
        ),
      },
      {
        path: 'profile',
        element: (
          <Suspense fallback={<LoadingState fullPage />}>
            <ProfilePage />
          </Suspense>
        ),
      },
      {
        path: 'admin',
        element: (
          <Suspense fallback={<LoadingState fullPage />}>
            <AdminPage />
          </Suspense>
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
        path: '*',
        element: <NotFound />,
      },
    ],
  },
];
