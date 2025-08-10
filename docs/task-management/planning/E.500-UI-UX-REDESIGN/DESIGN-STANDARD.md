# MosAIc Official Design Standard: Developer-Focused Theme

## Executive Summary
**Effective Date**: 2025-01-23  
**Design Standard**: Developer-Focused (Prototype 4)  
**Status**: OFFICIAL STANDARD  

The Developer-Focused design has been selected as the official styling standard for all MosAIc interfaces, establishing a terminal-inspired, code-first aesthetic that resonates with our developer audience.

## Core Design Principles

### 1. Terminal-First Aesthetic
- Dark mode by default (#0d1117 background)
- Monospace typography (JetBrains Mono)
- Command-line inspired interactions
- Terminal window components

### 2. Code-Centric Presentation
- Syntax highlighting using familiar IDE colors
- Code examples prominently featured
- API documentation format
- Copy-to-clipboard functionality

### 3. Developer Psychology
- Familiar patterns from daily tools
- Keyboard-first navigation
- Performance metrics visible
- Minimal visual friction

## Official Color Palette

### Primary Colors
```css
--color-bg-primary: #0d1117;        /* GitHub dark background */
--color-text-primary: #c9d1d9;      /* Primary text */
--color-accent-green: #3fb950;      /* Terminal green */
--color-accent-blue: #58a6ff;       /* Link blue */
```

### Syntax Highlighting
```css
--color-syntax-keyword: #ff7b72;    /* Keywords */
--color-syntax-string: #a5d6ff;     /* Strings */
--color-syntax-function: #d2a8ff;   /* Functions */
--color-syntax-comment: #8b949e;    /* Comments */
```

## Typography System

### Font Stack
```css
--font-mono: 'JetBrains Mono', 'SF Mono', 'Monaco', 'Consolas', monospace;
--font-sans: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
```

### Type Scale
- Base: 14px (matching IDE defaults)
- Code blocks: 14px
- Headings: 1.5rem - 2.5rem
- Body text: 1rem

## Component Standards

### Terminal Windows
- macOS-style window chrome
- Animated command execution
- Syntax-appropriate coloring
- Blinking cursor animation

### Code Blocks
- Language indicators
- Line numbers optional
- Copy button overlay
- Horizontal scroll for overflow

### Navigation
- Monospace logo with cursor
- Version indicator
- Keyboard shortcuts visible
- Command palette ready

## Implementation Requirements

### Technical Stack Integration
- Must work with shadcn/ui components
- Dark mode as primary theme
- Light mode as accessibility option
- React/Next.js compatible

### Performance Standards
- CSS-based syntax highlighting
- Lazy-loaded code examples
- Optimized font loading
- < 3s page load time

### Accessibility
- WCAG 2.1 AA compliance
- High contrast ratios (7:1 minimum)
- Keyboard navigation complete
- Screen reader optimized

## Usage Guidelines

### When to Apply
- All MosAIc web interfaces
- Documentation sites
- Dashboard applications
- Marketing pages
- Tool interfaces

### Component Library
All new components must follow:
1. Terminal-inspired aesthetics
2. Monospace typography for technical content
3. Dark theme primary
4. Keyboard navigation support
5. Performance-first implementation

## Migration Timeline

### Phase 1: Core Implementation (Week 1)
- Design token extraction
- Component library setup
- Base template creation

### Phase 2: Primary Pages (Week 2)
- Homepage redesign
- Documentation migration
- Dashboard updates

### Phase 3: Full Rollout (Week 3-4)
- All interfaces updated
- Legacy cleanup
- Performance optimization

## Governance

### Design Approval Process
1. All designs must align with Developer-Focused theme
2. New components require design review
3. Deviations need explicit approval
4. Maintain consistency across products

### Version Control
- Design system v1.0.0
- Semantic versioning for updates
- Breaking changes require migration guide
- Backwards compatibility when possible

## Resources

### Design Assets
- Location: `/docs/task-management/planning/E.500-UI-UX-REDESIGN/`
- Prototype: `/prototypes/prototype-4/`
- Implementation: `/implementation/selected-design/`

### Component Examples
- Terminal window component
- Code block with highlighting
- Navigation with command palette
- API documentation layout

## Success Metrics

### Adoption Targets
- 100% of new development
- 50% migration by Q2 2025
- Full migration by Q3 2025

### Quality Metrics
- Page load < 3 seconds
- Accessibility score > 95
- Developer satisfaction > 4.5/5
- Zero critical design bugs

---

This design standard establishes MosAIc as the developer's choice for AI orchestration, with an interface that feels like a natural extension of their development environment.