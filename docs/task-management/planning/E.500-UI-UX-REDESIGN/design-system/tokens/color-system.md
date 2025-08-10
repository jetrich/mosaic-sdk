# MosAIc Color System

## Design Principles
Our color system is built on principles of accessibility, flexibility, and modern aesthetics. It supports both light and dark themes while maintaining WCAG AA compliance.

## Color Tokens

### Base Colors

#### Neutral Scale
```css
--color-neutral-0: #FFFFFF;
--color-neutral-50: #FAFAFA;
--color-neutral-100: #F5F5F5;
--color-neutral-200: #E5E5E5;
--color-neutral-300: #D4D4D4;
--color-neutral-400: #A3A3A3;
--color-neutral-500: #737373;
--color-neutral-600: #525252;
--color-neutral-700: #404040;
--color-neutral-800: #262626;
--color-neutral-900: #171717;
--color-neutral-950: #0A0A0A;
```

#### Primary Colors
```css
/* Blue - Trust, Technology, Reliability */
--color-primary-50: #EFF6FF;
--color-primary-100: #DBEAFE;
--color-primary-200: #BFDBFE;
--color-primary-300: #93BBFD;
--color-primary-400: #60A5FA;
--color-primary-500: #3B82F6;
--color-primary-600: #2563EB;
--color-primary-700: #1D4ED8;
--color-primary-800: #1E40AF;
--color-primary-900: #1E3A8A;
--color-primary-950: #172554;
```

#### Accent Colors
```css
/* Purple - Innovation, AI, Creativity */
--color-accent-50: #FAF5FF;
--color-accent-100: #F3E8FF;
--color-accent-200: #E9D5FF;
--color-accent-300: #D8B4FE;
--color-accent-400: #C084FC;
--color-accent-500: #A855F7;
--color-accent-600: #9333EA;
--color-accent-700: #7C3AED;
--color-accent-800: #6B21A8;
--color-accent-900: #581C87;
--color-accent-950: #3B0764;
```

### Semantic Colors

#### Success
```css
--color-success-50: #F0FDF4;
--color-success-100: #DCFCE7;
--color-success-200: #BBF7D0;
--color-success-300: #86EFAC;
--color-success-400: #4ADE80;
--color-success-500: #22C55E;
--color-success-600: #16A34A;
--color-success-700: #15803D;
--color-success-800: #166534;
--color-success-900: #14532D;
```

#### Warning
```css
--color-warning-50: #FFFBEB;
--color-warning-100: #FEF3C7;
--color-warning-200: #FDE68A;
--color-warning-300: #FCD34D;
--color-warning-400: #FBBF24;
--color-warning-500: #F59E0B;
--color-warning-600: #D97706;
--color-warning-700: #B45309;
--color-warning-800: #92400E;
--color-warning-900: #78350F;
```

#### Error
```css
--color-error-50: #FEF2F2;
--color-error-100: #FEE2E2;
--color-error-200: #FECACA;
--color-error-300: #FCA5A5;
--color-error-400: #F87171;
--color-error-500: #EF4444;
--color-error-600: #DC2626;
--color-error-700: #B91C1C;
--color-error-800: #991B1B;
--color-error-900: #7F1D1D;
```

### Gradient System

#### Primary Gradients
```css
/* Tech Gradient */
--gradient-tech: linear-gradient(135deg, var(--color-primary-600) 0%, var(--color-accent-600) 100%);

/* AI Gradient */
--gradient-ai: linear-gradient(135deg, var(--color-accent-500) 0%, var(--color-accent-700) 50%, var(--color-primary-600) 100%);

/* Success Gradient */
--gradient-success: linear-gradient(135deg, var(--color-success-400) 0%, var(--color-success-600) 100%);

/* Neutral Gradient */
--gradient-neutral: linear-gradient(180deg, var(--color-neutral-50) 0%, var(--color-neutral-100) 100%);
```

#### Dark Mode Gradients
```css
/* Dark Tech Gradient */
--gradient-tech-dark: linear-gradient(135deg, var(--color-primary-500) 0%, var(--color-accent-500) 100%);

/* Dark Surface Gradient */
--gradient-surface-dark: linear-gradient(180deg, var(--color-neutral-900) 0%, var(--color-neutral-950) 100%);
```

## Theme Applications

### Light Theme
```css
:root {
  /* Backgrounds */
  --bg-primary: var(--color-neutral-0);
  --bg-secondary: var(--color-neutral-50);
  --bg-tertiary: var(--color-neutral-100);
  
  /* Text */
  --text-primary: var(--color-neutral-900);
  --text-secondary: var(--color-neutral-700);
  --text-tertiary: var(--color-neutral-500);
  
  /* Borders */
  --border-default: var(--color-neutral-200);
  --border-light: var(--color-neutral-100);
  --border-dark: var(--color-neutral-300);
  
  /* Interactive */
  --interactive-default: var(--color-primary-600);
  --interactive-hover: var(--color-primary-700);
  --interactive-active: var(--color-primary-800);
}
```

### Dark Theme
```css
[data-theme="dark"] {
  /* Backgrounds */
  --bg-primary: var(--color-neutral-950);
  --bg-secondary: var(--color-neutral-900);
  --bg-tertiary: var(--color-neutral-800);
  
  /* Text */
  --text-primary: var(--color-neutral-50);
  --text-secondary: var(--color-neutral-200);
  --text-tertiary: var(--color-neutral-400);
  
  /* Borders */
  --border-default: var(--color-neutral-800);
  --border-light: var(--color-neutral-900);
  --border-dark: var(--color-neutral-700);
  
  /* Interactive */
  --interactive-default: var(--color-primary-500);
  --interactive-hover: var(--color-primary-400);
  --interactive-active: var(--color-primary-600);
}
```

## Usage Guidelines

### Accessibility
- Maintain minimum contrast ratio of 4.5:1 for normal text
- Use 3:1 contrast ratio for large text and UI components
- Test all color combinations with accessibility tools
- Provide sufficient color contrast in both themes

### Best Practices
1. Use semantic colors for their intended purpose
2. Apply gradients sparingly for emphasis
3. Maintain consistency across similar elements
4. Test colors in both light and dark themes
5. Consider color-blind users in design decisions

### Do's and Don'ts

**Do:**
- Use primary colors for main CTAs
- Apply semantic colors consistently
- Test contrast ratios
- Use neutral colors for backgrounds
- Apply gradients for special emphasis

**Don't:**
- Mix semantic colors incorrectly
- Use low contrast combinations
- Override theme variables locally
- Use pure black (#000000) for text
- Apply gradients to small text

## Implementation Examples

### Buttons
```css
.btn-primary {
  background: var(--interactive-default);
  color: var(--color-neutral-0);
}

.btn-primary:hover {
  background: var(--interactive-hover);
}

.btn-gradient {
  background: var(--gradient-tech);
  color: var(--color-neutral-0);
}
```

### Cards
```css
.card {
  background: var(--bg-secondary);
  border: 1px solid var(--border-default);
  color: var(--text-primary);
}

.card-highlighted {
  background: var(--gradient-neutral);
  border: 1px solid var(--color-primary-200);
}
```

### Status Indicators
```css
.status-success {
  color: var(--color-success-600);
  background: var(--color-success-50);
}

.status-error {
  color: var(--color-error-600);
  background: var(--color-error-50);
}
```

## Color Combinations

### Recommended Pairings
1. **Primary Action**: Primary-600 on Neutral-0
2. **Secondary Action**: Neutral-700 on Neutral-100
3. **Success State**: Success-600 on Success-50
4. **Error State**: Error-600 on Error-50
5. **Accent Feature**: Accent-600 on Accent-50

### Gradient Applications
1. **Hero Sections**: Tech gradient with white text
2. **Feature Cards**: Subtle neutral gradient
3. **CTAs**: AI gradient for special promotions
4. **Backgrounds**: Dark surface gradient for sections
5. **Overlays**: Semi-transparent gradient overlays