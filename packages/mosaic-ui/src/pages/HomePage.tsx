import React from 'react';
import { Link } from 'react-router-dom';
import { Navigation, TerminalWindow, TerminalContent, CodePlayground } from '../components';
import './HomePage.css';

const navItems = [
  { label: 'Documentation', href: '/docs' },
  { label: 'Components', href: '/components' },
  { label: 'Examples', href: '/examples' },
  { label: 'GitHub', href: 'https://github.com/mosaic' }
];

const heroCommands = [
  {
    command: 'npm install -g @mosaic/cli',
    output: '+ @mosaic/cli@0.1.0\nadded 142 packages in 3.214s'
  },
  {
    command: 'mosaic init my-project',
    output: '✓ Project initialized\n✓ Dependencies installed\n✓ Git repository created\n\n🚀 Ready to build!'
  },
  {
    command: 'cd my-project && mosaic dev',
    output: 'Starting MosAIc development server...\n\n  ➜  Local:   http://localhost:3000\n  ➜  Network: http://192.168.1.5:3000\n\n✨ Server running'
  }
];

const quickStartCode = `import { MosAIc } from '@mosaic/sdk';

// Initialize MosAIc with your configuration
const mosaic = new MosAIc({
  apiKey: process.env.MOSAIC_API_KEY,
  environment: 'development'
});

// Create an AI agent
const agent = await mosaic.createAgent({
  name: 'CodeAssistant',
  capabilities: ['code-generation', 'testing', 'documentation'],
  model: 'claude-3-opus'
});

// Deploy your agent
const result = await agent.execute({
  task: 'Generate a REST API for user management',
  language: 'typescript',
  framework: 'express'
});

console.log('Agent completed:', result.status);`;

const features = [
  {
    icon: '🤖',
    title: 'AI-Powered Development',
    description: 'Leverage cutting-edge AI models to accelerate your development workflow'
  },
  {
    icon: '🚀',
    title: 'Enterprise Ready',
    description: 'Built for scale with robust security, monitoring, and compliance features'
  },
  {
    icon: '⚡',
    title: 'Lightning Fast',
    description: 'Optimized performance with intelligent caching and parallel execution'
  },
  {
    icon: '🔧',
    title: 'Developer First',
    description: 'Intuitive APIs, comprehensive docs, and tools you already know and love'
  },
  {
    icon: '🌐',
    title: 'Multi-Platform',
    description: 'Deploy anywhere - cloud, on-premise, or hybrid environments'
  },
  {
    icon: '📊',
    title: 'Observable',
    description: 'Built-in monitoring, logging, and analytics for complete visibility'
  }
];

export const HomePage: React.FC = () => {
  return (
    <div className="home-page">
      <Navigation 
        items={navItems}
        version="v0.1.0"
        onCommandPalette={() => console.log('Command palette opened')}
      />

      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <h1 className="hero-title">
            Enterprise AI Development
            <span className="hero-title-accent"> Made Simple</span>
          </h1>
          <p className="hero-description">
            MosAIc orchestrates AI agents to build, test, and deploy software at unprecedented speed. 
            Transform your development workflow with intelligent automation.
          </p>
          <div className="hero-actions">
            <button className="btn btn-primary">
              Get Started
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M8.22 2.97a.75.75 0 011.06 0l4.25 4.25a.75.75 0 010 1.06l-4.25 4.25a.75.75 0 01-1.06-1.06l2.97-2.97H3.75a.75.75 0 010-1.5h7.44L8.22 4.03a.75.75 0 010-1.06z"/>
              </svg>
            </button>
            <button className="btn btn-secondary">
              View on GitHub
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/>
              </svg>
            </button>
          </div>
        </div>
        <div className="hero-terminal">
          <TerminalWindow title="Getting Started">
            <TerminalContent commands={heroCommands} animated={true} />
          </TerminalWindow>
        </div>
      </section>

      {/* Quick Start Section */}
      <section className="quick-start">
        <div className="container">
          <h2 className="section-title">Quick Start</h2>
          <p className="section-description">
            Get up and running with MosAIc in minutes. Install the CLI, initialize your project, and start building.
          </p>
          <div className="quick-start-content">
            <CodePlayground 
              initialCode={quickStartCode}
              language="typescript"
              filename="app.ts"
              runnable={true}
            />
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="features">
        <div className="container">
          <h2 className="section-title">Built for Modern Development</h2>
          <p className="section-description">
            Everything you need to build, deploy, and scale AI-powered applications.
          </p>
          <div className="features-grid">
            {features.map((feature, index) => (
              <div key={index} className="feature-card">
                <div className="feature-icon">{feature.icon}</div>
                <h3 className="feature-title">{feature.title}</h3>
                <p className="feature-description">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta">
        <div className="container">
          <div className="cta-content">
            <h2 className="cta-title">Ready to transform your development workflow?</h2>
            <p className="cta-description">
              Join thousands of developers building the future with MosAIc.
            </p>
            <div className="cta-actions">
              <button className="btn btn-primary btn-large">
                Start Building
              </button>
              <Link to="/docs" className="cta-link">
                Read the docs →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-section">
              <h4 className="footer-title">Product</h4>
              <Link to="/features" className="footer-link">Features</Link>
              <Link to="/pricing" className="footer-link">Pricing</Link>
              <Link to="/changelog" className="footer-link">Changelog</Link>
            </div>
            <div className="footer-section">
              <h4 className="footer-title">Resources</h4>
              <Link to="/docs" className="footer-link">Documentation</Link>
              <Link to="/examples" className="footer-link">Examples</Link>
              <Link to="/blog" className="footer-link">Blog</Link>
            </div>
            <div className="footer-section">
              <h4 className="footer-title">Company</h4>
              <Link to="/about" className="footer-link">About</Link>
              <Link to="/careers" className="footer-link">Careers</Link>
              <Link to="/contact" className="footer-link">Contact</Link>
            </div>
            <div className="footer-section">
              <h4 className="footer-title">Legal</h4>
              <Link to="/privacy" className="footer-link">Privacy</Link>
              <Link to="/terms" className="footer-link">Terms</Link>
              <Link to="/security" className="footer-link">Security</Link>
            </div>
          </div>
          <div className="footer-bottom">
            <p className="footer-copyright">© 2025 MosAIc. All rights reserved.</p>
            <div className="footer-social">
              <a href="https://github.com/mosaic" aria-label="GitHub">
                <svg width="20" height="20" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/>
                </svg>
              </a>
              <a href="https://twitter.com/mosaic" aria-label="Twitter">
                <svg width="20" height="20" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M5.026 15c6.038 0 9.341-5.003 9.341-9.334 0-.14 0-.282-.006-.422A6.685 6.685 0 0016 3.542a6.658 6.658 0 01-1.889.518 3.301 3.301 0 001.447-1.817 6.533 6.533 0 01-2.087.793A3.286 3.286 0 007.875 6.03a9.325 9.325 0 01-6.767-3.429 3.289 3.289 0 001.018 4.382A3.323 3.323 0 01.64 6.575v.045a3.288 3.288 0 002.632 3.218 3.203 3.203 0 01-.865.115 3.23 3.23 0 01-.614-.057 3.283 3.283 0 003.067 2.277A6.588 6.588 0 01.78 13.58a6.32 6.32 0 01-.78-.045A9.344 9.344 0 005.026 15z"/>
                </svg>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};