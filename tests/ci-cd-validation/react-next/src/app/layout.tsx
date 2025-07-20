import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'CI/CD Test App',
  description: 'React/Next.js application for CI/CD validation',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}): JSX.Element {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}