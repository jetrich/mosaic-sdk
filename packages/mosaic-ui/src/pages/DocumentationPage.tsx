import React from 'react';
import { Link } from 'react-router-dom';
import { Navigation, DocumentationLayout, CodePlayground, TerminalWindow, TerminalContent } from '../components';
import './DocumentationPage.css';

const navItems = [
  { label: 'Documentation', href: '/docs', active: true },
  { label: 'Components', href: '/components' },
  { label: 'Examples', href: '/examples' },
  { label: 'GitHub', href: 'https://github.com/mosaic' }
];

const sidebarItems = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    children: [
      { id: 'introduction', title: 'Introduction', href: '/docs/introduction' },
      { id: 'installation', title: 'Installation', href: '/docs/installation', active: true },
      { id: 'quick-start', title: 'Quick Start', href: '/docs/quick-start' },
      { id: 'project-structure', title: 'Project Structure', href: '/docs/project-structure' }
    ]
  },
  {
    id: 'core-concepts',
    title: 'Core Concepts',
    children: [
      { id: 'agents', title: 'AI Agents', href: '/docs/agents' },
      { id: 'orchestration', title: 'Orchestration', href: '/docs/orchestration' },
      { id: 'models', title: 'Model Selection', href: '/docs/models' },
      { id: 'deployments', title: 'Deployments', href: '/docs/deployments' }
    ]
  },
  {
    id: 'api-reference',
    title: 'API Reference',
    children: [
      { id: 'client', title: 'MosAIc Client', href: '/docs/api/client' },
      { id: 'agents-api', title: 'Agents API', href: '/docs/api/agents' },
      { id: 'tasks', title: 'Tasks API', href: '/docs/api/tasks' },
      { id: 'webhooks', title: 'Webhooks', href: '/docs/api/webhooks' }
    ]
  },
  {
    id: 'guides',
    title: 'Guides',
    children: [
      { id: 'authentication', title: 'Authentication', href: '/docs/guides/auth' },
      { id: 'error-handling', title: 'Error Handling', href: '/docs/guides/errors' },
      { id: 'testing', title: 'Testing', href: '/docs/guides/testing' },
      { id: 'best-practices', title: 'Best Practices', href: '/docs/guides/best-practices' }
    ]
  }
];

const breadcrumbs = [
  { label: 'Documentation', href: '/docs' },
  { label: 'Getting Started', href: '/docs/getting-started' },
  { label: 'Installation' }
];

const installCommands = [
  {
    command: 'npm install @mosaic/sdk',
    output: '+ @mosaic/sdk@0.1.0\nadded 142 packages from 89 contributors and audited 284 packages in 3.214s'
  }
];

const configExample = `// mosaic.config.ts
import { defineConfig } from '@mosaic/sdk';

export default defineConfig({
  // Your API key from the MosAIc dashboard
  apiKey: process.env.MOSAIC_API_KEY,
  
  // Environment: 'development' | 'staging' | 'production'
  environment: 'development',
  
  // Default model for agents
  defaultModel: 'claude-3-opus',
  
  // Logging configuration
  logging: {
    level: 'info',
    format: 'json'
  },
  
  // Agent defaults
  agents: {
    timeout: 300000, // 5 minutes
    retries: 3,
    concurrency: 5
  }
});`;

const envExample = `# .env
MOSAIC_API_KEY=your-api-key-here
MOSAIC_ENVIRONMENT=development
MOSAIC_LOG_LEVEL=info`;

export const DocumentationPage: React.FC = () => {
  return (
    <div className="docs-page">
      <Navigation 
        items={navItems}
        version="v0.1.0"
        onCommandPalette={() => console.log('Command palette opened')}
      />

      <DocumentationLayout
        sidebar={sidebarItems}
        breadcrumbs={breadcrumbs}
        currentVersion="v0.1.0"
        versions={['v0.1.0', 'v0.0.9', 'v0.0.8']}
      >
        <article className="docs-article">
          <h1>Installation</h1>
          <p className="docs-lead">
            Get up and running with MosAIc in your project. This guide will walk you through 
            installation, configuration, and your first agent deployment.
          </p>

          <section data-section="requirements">
            <h2>Requirements</h2>
            <p>Before you begin, make sure you have the following installed:</p>
            <ul>
              <li>Node.js 18.0 or later</li>
              <li>npm 7.0 or later (or yarn, pnpm)</li>
              <li>Git for version control</li>
            </ul>
          </section>

          <section data-section="installation">
            <h2>Installation</h2>
            <p>Install MosAIc SDK using your preferred package manager:</p>
            
            <h3>Using npm</h3>
            <TerminalWindow title="npm">
              <TerminalContent commands={installCommands} animated={false} />
            </TerminalWindow>

            <h3>Using yarn</h3>
            <TerminalWindow title="yarn">
              <TerminalContent 
                commands={[{ command: 'yarn add @mosaic/sdk' }]} 
                animated={false} 
              />
            </TerminalWindow>

            <h3>Using pnpm</h3>
            <TerminalWindow title="pnpm">
              <TerminalContent 
                commands={[{ command: 'pnpm add @mosaic/sdk' }]} 
                animated={false} 
              />
            </TerminalWindow>
          </section>

          <section data-section="configuration">
            <h2>Configuration</h2>
            <p>
              Create a <code>mosaic.config.ts</code> file in your project root to configure MosAIc:
            </p>
            
            <CodePlayground
              initialCode={configExample}
              language="typescript"
              filename="mosaic.config.ts"
              runnable={false}
            />

            <h3>Environment Variables</h3>
            <p>
              For security, store sensitive configuration in environment variables. Create a 
              <code>.env</code> file in your project root:
            </p>
            
            <CodePlayground
              initialCode={envExample}
              language="bash"
              filename=".env"
              runnable={false}
            />

            <div className="docs-callout docs-callout-warning">
              <div className="docs-callout-icon">⚠️</div>
              <div className="docs-callout-content">
                <p className="docs-callout-title">Security Note</p>
                <p>
                  Never commit your <code>.env</code> file to version control. Add it to your 
                  <code>.gitignore</code> file to prevent accidental exposure of your API keys.
                </p>
              </div>
            </div>
          </section>

          <section data-section="verify">
            <h2>Verify Installation</h2>
            <p>
              To verify that MosAIc is installed correctly, create a simple test file:
            </p>

            <CodePlayground
              initialCode={`import { MosAIc } from '@mosaic/sdk';

async function testConnection() {
  const mosaic = new MosAIc();
  
  try {
    const status = await mosaic.getStatus();
    console.log('✅ MosAIc connected:', status);
  } catch (error) {
    console.error('❌ Connection failed:', error);
  }
}

testConnection();`}
              language="typescript"
              filename="test-connection.ts"
              runnable={true}
            />

            <p>Run the test:</p>
            <TerminalWindow>
              <TerminalContent 
                commands={[
                  { 
                    command: 'npx tsx test-connection.ts',
                    output: '✅ MosAIc connected: { status: "operational", version: "0.1.0" }'
                  }
                ]} 
                animated={false} 
              />
            </TerminalWindow>
          </section>

          <section data-section="next-steps">
            <h2>Next Steps</h2>
            <p>
              Now that you have MosAIc installed and configured, you're ready to create your 
              first AI agent:
            </p>
            
            <div className="docs-cards">
              <Link to="/docs/quick-start" className="docs-card">
                <h3>Quick Start Guide</h3>
                <p>Create your first AI agent in 5 minutes</p>
                <span className="docs-card-arrow">→</span>
              </Link>
              <Link to="/docs/agents" className="docs-card">
                <h3>Understanding Agents</h3>
                <p>Learn about agent capabilities and configuration</p>
                <span className="docs-card-arrow">→</span>
              </Link>
              <Link to="/docs/examples" className="docs-card">
                <h3>Examples</h3>
                <p>Explore real-world use cases and patterns</p>
                <span className="docs-card-arrow">→</span>
              </Link>
            </div>
          </section>

          <section className="docs-footer">
            <div className="docs-pagination">
              <Link to="/docs/introduction" className="docs-pagination-prev">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M7.78 12.53a.75.75 0 01-1.06 0L2.47 8.28a.75.75 0 010-1.06l4.25-4.25a.75.75 0 011.06 1.06L4.81 7h7.44a.75.75 0 010 1.5H4.81l2.97 2.97a.75.75 0 010 1.06z"/>
                </svg>
                <span>Introduction</span>
              </Link>
              <Link to="/docs/quick-start" className="docs-pagination-next">
                <span>Quick Start</span>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M8.22 2.97a.75.75 0 011.06 0l4.25 4.25a.75.75 0 010 1.06l-4.25 4.25a.75.75 0 01-1.06-1.06l2.97-2.97H3.75a.75.75 0 010-1.5h7.44L8.22 4.03a.75.75 0 010-1.06z"/>
                </svg>
              </Link>
            </div>
          </section>
        </article>
      </DocumentationLayout>
    </div>
  );
};