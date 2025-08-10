import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import { HomePage, DocumentationPage, ApiReferencePage, DashboardPage, LoginPage } from '../pages';
import { NotFoundPage } from '../pages/NotFoundPage';
import { ErrorBoundary } from '../components/ErrorBoundary';

// Route configuration
export const router = createBrowserRouter([
  {
    path: '/',
    element: <HomePage />,
    errorElement: <ErrorBoundary />,
  },
  {
    path: '/docs',
    element: <DocumentationPage />,
    errorElement: <ErrorBoundary />,
  },
  {
    path: '/docs/api',
    element: <ApiReferencePage />,
    errorElement: <ErrorBoundary />,
  },
  {
    path: '/documentation',
    element: <Navigate to="/docs" replace />,
  },
  {
    path: '/dashboard',
    element: <DashboardPage />,
    errorElement: <ErrorBoundary />,
  },
  {
    path: '/login',
    element: <LoginPage />,
    errorElement: <ErrorBoundary />,
  },
  {
    path: '/components',
    element: <Navigate to="/docs" replace />,
  },
  {
    path: '/examples',
    element: <Navigate to="/docs" replace />,
  },
  {
    path: '/github',
    loader: () => {
      window.location.href = 'https://github.com/mosaic';
      return null;
    },
    element: <div>Redirecting to GitHub...</div>,
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
]);

// Router Provider Component
export function AppRouter() {
  return <RouterProvider router={router} />;
}