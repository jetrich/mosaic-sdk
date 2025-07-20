import { Calculator } from '@/components/Calculator';

export default function Home(): JSX.Element {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold mb-8">CI/CD Test Application</h1>
      <p className="text-lg mb-8">React/Next.js CI/CD Validation</p>
      <Calculator />
    </main>
  );
}