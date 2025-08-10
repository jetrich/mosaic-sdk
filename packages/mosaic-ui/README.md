# MosAIc UI - Developer-Focused Design System

A modern, terminal-inspired UI component library built for the MosAIc platform. This design system implements the official Developer-Focused theme (Prototype 4) with a focus on developer experience, dark mode aesthetics, and code-first presentation.

## 🎨 Design Philosophy

- **Terminal-First**: Inspired by developer tools and terminal aesthetics
- **Dark Mode Native**: GitHub dark mode color palette
- **Code-Centric**: Syntax highlighting and monospace typography
- **Keyboard-Driven**: Command palette and keyboard shortcuts
- **Performance-Focused**: Optimized for developer workflows

## 📦 Components

### Core Components
- **TerminalWindow**: macOS-style terminal with animated command execution
- **CodeBlock**: Syntax-highlighted code display with copy functionality
- **Navigation**: Terminal-inspired navigation with command palette
- **DocumentationLayout**: Professional documentation layout with sidebar and TOC

### Page Templates
- **HomePage**: Landing page with hero terminal and feature grid
- **DocumentationPage**: Full documentation layout with examples
- **DashboardPage**: Agent monitoring and metrics dashboard
- **LoginPage**: Authentication with terminal alternative

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## 🛠️ Technology Stack

- React 18 with TypeScript
- Vite for lightning-fast builds
- Tailwind CSS with custom configuration
- shadcn/ui components
- CSS variables for theming

## 🎯 Design Tokens

### Colors
```css
--color-bg-primary: #0d1117;      /* GitHub dark background */
--color-text-primary: #c9d1d9;    /* Primary text */
--color-accent-green: #3fb950;    /* Terminal green */
--color-accent-blue: #58a6ff;     /* Link blue */
```

### Typography
```css
--font-mono: 'JetBrains Mono';    /* Code and terminal */
--font-sans: 'Inter';             /* UI text */
```

## 📐 Usage Examples

### Terminal Window
```tsx
import { TerminalWindow, TerminalContent } from '@mosaic/ui';

<TerminalWindow title="Demo">
  <TerminalContent 
    commands={[
      { command: 'npm install', output: 'Success!' }
    ]} 
  />
</TerminalWindow>
```

### Code Block
```tsx
import { CodeBlock } from '@mosaic/ui';

<CodeBlock
  code="const mosaic = new MosAIc();"
  language="typescript"
  filename="example.ts"
/>
```

## 🏗️ Project Structure

```
packages/mosaic-ui/
├── src/
│   ├── components/      # Reusable components
│   ├── pages/          # Page templates
│   ├── styles/         # Global styles and tokens
│   └── App.tsx         # Main app component
├── package.json
└── README.md
```

## 🚦 Development Status

### ✅ Phase 1: Foundation - COMPLETE
- Design token extraction
- Build system setup
- shadcn/ui integration

### ✅ Phase 2: Core Components - COMPLETE
- Terminal Window Component
- Code Block Component
- Navigation Component
- Documentation Layout

### ✅ Phase 3: Page Templates - COMPLETE
- Homepage with hero section
- Documentation page layout
- Dashboard for monitoring
- Login/authentication page

### 🔄 Phase 4: Polish & Optimization - IN PROGRESS
- Performance optimization
- Accessibility audit
- Cross-browser testing
- Production build

## 📊 Performance Targets

- First Contentful Paint: <1.5s
- Time to Interactive: <3s
- Lighthouse Score: >90
- Bundle Size: <150KB gzipped

## 🌐 Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## 📄 License

Part of the MosAIc SDK - see root LICENSE file for details.