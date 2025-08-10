# Agent Handoff: Frontend Implementation - Developer-Focused UI

## Mission Briefing
**From**: Tech Lead Tony  
**To**: FE-FRONTEND-FIONA (Senior Frontend Engineer)  
**Date**: 2025-01-23  
**Epic**: E.500 - MosAIc Site UI/UX Redesign  
**Features**: F.500.06, F.500.07, F.500.08  

## Project Context
The Developer-Focused design (Prototype 4) has been selected as the official MosAIc styling standard. Your mission is to implement this terminal-inspired, code-first interface that will transform MosAIc into a premium developer platform.

## Design Resources
- **Selected Design**: `/docs/task-management/planning/E.500-UI-UX-REDESIGN/implementation/selected-design/`
- **Design Standard**: `/docs/task-management/planning/E.500-UI-UX-REDESIGN/DESIGN-STANDARD.md`
- **UPP Breakdown**: `/docs/task-management/planning/E.500-UI-UX-REDESIGN/UPP-DECOMPOSITION.md`
- **Original Prototype**: `/docs/task-management/planning/E.500-UI-UX-REDESIGN/prototypes/prototype-4/`

## Phase 1 Tasks: Foundation (Days 1-3)

### F.500.06: Design System Implementation

#### Immediate Actions:
1. **Read the design documentation**:
   ```bash
   cd /home/jwoltje/src/mosaic-sdk
   cat docs/task-management/planning/E.500-UI-UX-REDESIGN/prototypes/prototype-4/design-notes.md
   cat docs/task-management/planning/E.500-UI-UX-REDESIGN/prototypes/prototype-4/index.html
   cat docs/task-management/planning/E.500-UI-UX-REDESIGN/prototypes/prototype-4/styles.css
   ```

2. **Set up the frontend workspace**:
   ```bash
   # Create frontend directory structure
   mkdir -p packages/mosaic-ui/{src/{components,styles,layouts,utils},public}
   cd packages/mosaic-ui
   ```

3. **Initialize the project**:
   ```bash
   npm init -y
   npm install --save-dev vite @vitejs/plugin-react typescript
   npm install react react-dom @radix-ui/themes
   npx shadcn-ui@latest init
   ```

### Story S.500.06.01: Design Token Extraction
Complete these atomic tasks in order:

#### A.500.06.01.01.01.01: Create colors.css with CSS variables (30 min)
```css
/* packages/mosaic-ui/src/styles/colors.css */
:root {
  /* GitHub Dark Mode Inspired */
  --color-bg-primary: #0d1117;
  --color-bg-secondary: #161b22;
  --color-bg-tertiary: #1f2428;
  
  /* Text Colors */
  --color-text-primary: #c9d1d9;
  --color-text-secondary: #8b949e;
  --color-text-tertiary: #6e7681;
  
  /* Terminal Colors */
  --color-accent-green: #3fb950;
  --color-accent-blue: #58a6ff;
  --color-accent-red: #f85149;
  --color-accent-yellow: #d29922;
  
  /* Syntax Highlighting */
  --color-syntax-keyword: #ff7b72;
  --color-syntax-string: #a5d6ff;
  --color-syntax-function: #d2a8ff;
  --color-syntax-comment: #8b949e;
  --color-syntax-number: #79c0ff;
}
```

#### A.500.06.01.01.02.01: Set up JetBrains Mono font loading (30 min)
```css
/* packages/mosaic-ui/src/styles/typography.css */
@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500;600;700&display=swap');
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

:root {
  --font-mono: 'JetBrains Mono', 'SF Mono', 'Monaco', 'Consolas', monospace;
  --font-sans: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  
  /* Type Scale */
  --text-xs: 0.75rem;
  --text-sm: 0.875rem;
  --text-base: 1rem;
  --text-lg: 1.125rem;
  --text-xl: 1.25rem;
  --text-2xl: 1.5rem;
  --text-3xl: 1.875rem;
  --text-4xl: 2.25rem;
}
```

### Story S.500.06.02: Component Library Setup

#### Configure shadcn/ui with dark theme:
```typescript
// packages/mosaic-ui/src/lib/utils.ts
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// packages/mosaic-ui/tailwind.config.js
module.exports = {
  darkMode: ["class"],
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "var(--color-bg-primary)",
        foreground: "var(--color-text-primary)",
        primary: {
          DEFAULT: "var(--color-accent-blue)",
          foreground: "var(--color-bg-primary)",
        },
        terminal: {
          green: "var(--color-accent-green)",
          red: "var(--color-accent-red)",
          yellow: "var(--color-accent-yellow)",
        },
      },
      fontFamily: {
        mono: ["var(--font-mono)"],
        sans: ["var(--font-sans)"],
      },
    },
  },
}
```

## Phase 2 Tasks: Core Components (Days 4-7)

### F.500.07: Core Component Development

Focus on creating these essential components:

1. **Terminal Window Component** (S.500.07.01)
   - macOS-style window chrome
   - Command execution animation
   - Syntax highlighting
   - Copy functionality

2. **Code Block Component** (S.500.07.02)
   - Multi-language support
   - Line numbers toggle
   - Copy button overlay
   - Horizontal scroll

3. **Navigation Component** (S.500.07.03)
   - Monospace logo with cursor
   - Command palette ready
   - Keyboard shortcuts
   - Mobile responsive

4. **Documentation Layout** (S.500.07.04)
   - Sidebar navigation
   - Search functionality
   - Table of contents
   - Breadcrumbs

## Technical Requirements

### Stack Integration
- React 18+ with TypeScript
- Vite for build tooling
- shadcn/ui components
- Tailwind CSS with custom config
- CSS-in-JS for dynamic styles

### Performance Targets
- First Contentful Paint < 1.5s
- Time to Interactive < 3s
- Lighthouse score > 90
- Bundle size < 150KB gzipped

### Quality Standards
- TypeScript strict mode
- ESLint with zero errors
- 100% keyboard navigable
- WCAG 2.1 AA compliant
- Cross-browser support (Chrome, Firefox, Safari, Edge)

## Development Workflow

1. **Create components in isolation**:
   ```bash
   # Start Storybook
   npm run storybook
   
   # Create new component
   npx shadcn-ui@latest add [component]
   ```

2. **Test as you build**:
   ```bash
   # Run tests
   npm test
   
   # Check accessibility
   npm run test:a11y
   ```

3. **Document everything**:
   - Component props and usage
   - Design decisions
   - Performance considerations
   - Accessibility features

## Success Criteria
- All components match Prototype 4 exactly
- Design tokens properly extracted and used
- Component library fully documented
- Storybook stories for all components
- Performance metrics achieved
- Accessibility audit passed

## Communication Protocol
- Update task status in real-time
- Document blockers immediately
- Create handoff notes for next phase
- Test components thoroughly before marking complete

## Resources
- Design inspiration: GitHub, VS Code, Terminal.app
- Component library: shadcn/ui documentation
- Accessibility: WCAG guidelines
- Performance: Web Vitals documentation

Begin with reading the design documentation and setting up the workspace. Focus on atomic tasks and complete them one by one. Good luck, Fiona!