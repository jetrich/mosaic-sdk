import React from 'react';
import { HomePage, DocumentationPage, DashboardPage, LoginPage } from './pages';

// Simple router component for demonstration
// In production, use React Router or similar
export const Router: React.FC = () => {
  const path = window.location.pathname;

  switch (path) {
    case '/':
      return <HomePage />;
    case '/docs':
    case '/documentation':
      return <DocumentationPage />;
    case '/dashboard':
      return <DashboardPage />;
    case '/login':
      return <LoginPage />;
    default:
      return <HomePage />;
  }
};