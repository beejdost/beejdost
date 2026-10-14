import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { routes } from '@/router/routes';
import i18n from '@/i18n/config';

describe('Route Rendering Tests', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('en');
  });

  const renderRoute = (initialPath: string) => {
    const memoryRouter = createMemoryRouter(routes, {
      initialEntries: [initialPath],
    });
    return render(<RouterProvider router={memoryRouter} />);
  };

  it('renders Home page at /', async () => {
    renderRoute('/');
    expect(await screen.findByRole('heading', { level: 1 })).toHaveTextContent(
      /Verified Heritage & Agricultural Seeds/i
    );
    expect(screen.getByRole('link', { name: /Browse Seed Catalog/i })).toBeInTheDocument();
  });

  it('renders Search page at /search', async () => {
    renderRoute('/search');
    expect(await screen.findByRole('heading', { level: 1 })).toHaveTextContent(
      /Search & Filter Seeds/i
    );
    expect(screen.getByPlaceholderText(/Search by crop/i)).toBeInTheDocument();
  });

  it('renders Listing Details page at /listings/:id', async () => {
    renderRoute('/listings/seed-001');
    expect(await screen.findByRole('heading', { level: 1 })).toHaveTextContent(
      /Basmati 370/i
    );
    expect(screen.getByText(/Kallar rice tract/i)).toBeInTheDocument();
  });

  it('redirects unauthenticated user from /listings/create to /login', async () => {
    renderRoute('/listings/create');
    expect(await screen.findByRole('heading', { level: 1 })).toHaveTextContent(
      /Sign In to Beej Dost/i
    );
  });

  it('redirects unauthenticated user from /my-listings to /login', async () => {
    renderRoute('/my-listings');
    expect(await screen.findByRole('heading', { level: 1 })).toHaveTextContent(
      /Sign In to Beej Dost/i
    );
  });

  it('redirects unauthenticated user from /messages to /login', async () => {
    renderRoute('/messages');
    expect(await screen.findByRole('heading', { level: 1 })).toHaveTextContent(
      /Sign In to Beej Dost/i
    );
  });

  it('redirects unauthenticated user from /profile to /login', async () => {
    renderRoute('/profile');
    expect(await screen.findByRole('heading', { level: 1 })).toHaveTextContent(
      /Sign In to Beej Dost/i
    );
  });

  it('redirects unauthenticated user from /admin to /login', async () => {
    renderRoute('/admin');
    expect(await screen.findByRole('heading', { level: 1 })).toHaveTextContent(
      /Sign In to Beej Dost/i
    );
  });

  it('renders Login page at /login', async () => {
    renderRoute('/login');
    expect(await screen.findByRole('heading', { level: 1 })).toHaveTextContent(
      /Sign In to Beej Dost/i
    );
    expect(screen.getByLabelText(/Email Address/i)).toBeInTheDocument();
  });

  it('renders Registration page at /register', async () => {
    renderRoute('/register');
    expect(await screen.findByRole('heading', { level: 1 })).toHaveTextContent(
      /Create Farmer Account/i
    );
    expect(screen.getByLabelText(/Confirm Password/i)).toBeInTheDocument();
  });

  it('renders Forgot Password page at /forgot-password', async () => {
    renderRoute('/forgot-password');
    expect(await screen.findByRole('heading', { level: 1 })).toHaveTextContent(
      /Reset Your Password/i
    );
    expect(screen.getByRole('button', { name: /Send Reset Link/i })).toBeInTheDocument();
  });

  it('renders Suspended Account page at /suspended', async () => {
    renderRoute('/suspended');
    expect(await screen.findByRole('heading', { level: 1 })).toHaveTextContent(
      /Account Suspended/i
    );
    expect(screen.getByText(/support@beejdost.pk/i)).toBeInTheDocument();
  });

  it('renders NotFound component for unknown routes', async () => {
    renderRoute('/some-nonexistent-path-1234');
    expect(await screen.findByText('404')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/Page Not Found/i);
    expect(screen.getByRole('link', { name: /Return Home/i })).toBeInTheDocument();
  });
});
