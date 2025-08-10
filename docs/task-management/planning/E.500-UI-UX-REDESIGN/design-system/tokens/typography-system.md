# MosAIc Typography System

## Design Principles
Our typography system prioritizes readability, hierarchy, and scalability across devices while maintaining a modern, professional aesthetic.

## Font Stack

### Primary Font Family
```css
--font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
```

### Monospace Font Family
```css
--font-mono: 'JetBrains Mono', 'Fira Code', 'Cascadia Code', 'Roboto Mono', 'Courier New', monospace;
```

## Type Scale

### Fluid Typography System
Using clamp() for responsive scaling:

```css
/* Display */
--text-display-xl: clamp(3.5rem, 5vw + 1rem, 5rem);      /* 56-80px */
--text-display-lg: clamp(3rem, 4vw + 1rem, 4.5rem);      /* 48-72px */
--text-display-md: clamp(2.5rem, 3vw + 1rem, 4rem);      /* 40-64px */
--text-display-sm: clamp(2rem, 2.5vw + 0.5rem, 3rem);    /* 32-48px */

/* Headings */
--text-h1: clamp(2rem, 2.5vw + 0.5rem, 3rem);           /* 32-48px */
--text-h2: clamp(1.75rem, 2vw + 0.5rem, 2.5rem);        /* 28-40px */
--text-h3: clamp(1.5rem, 1.5vw + 0.5rem, 2rem);         /* 24-32px */
--text-h4: clamp(1.25rem, 1vw + 0.5rem, 1.5rem);        /* 20-24px */
--text-h5: clamp(1.125rem, 0.5vw + 0.5rem, 1.25rem);    /* 18-20px */
--text-h6: clamp(1rem, 0.5vw + 0.25rem, 1.125rem);      /* 16-18px */

/* Body */
--text-body-lg: clamp(1.125rem, 0.5vw + 0.5rem, 1.25rem); /* 18-20px */
--text-body-md: 1rem;                                      /* 16px */
--text-body-sm: 0.875rem;                                  /* 14px */
--text-body-xs: 0.75rem;                                   /* 12px */

/* UI Text */
--text-button: 0.875rem;                                   /* 14px */
--text-caption: 0.75rem;                                   /* 12px */
--text-overline: 0.75rem;                                  /* 12px */
--text-label: 0.875rem;                                    /* 14px */
```

## Font Weights

```css
--font-weight-thin: 100;
--font-weight-light: 300;
--font-weight-regular: 400;
--font-weight-medium: 500;
--font-weight-semibold: 600;
--font-weight-bold: 700;
--font-weight-extrabold: 800;
--font-weight-black: 900;
```

## Line Heights

```css
--line-height-none: 1;
--line-height-tight: 1.25;
--line-height-snug: 1.375;
--line-height-normal: 1.5;
--line-height-relaxed: 1.625;
--line-height-loose: 2;
```

## Letter Spacing

```css
--letter-spacing-tighter: -0.05em;
--letter-spacing-tight: -0.025em;
--letter-spacing-normal: 0;
--letter-spacing-wide: 0.025em;
--letter-spacing-wider: 0.05em;
--letter-spacing-widest: 0.1em;
```

## Typography Components

### Display Text
```css
.text-display-xl {
  font-size: var(--text-display-xl);
  font-weight: var(--font-weight-black);
  line-height: var(--line-height-none);
  letter-spacing: var(--letter-spacing-tighter);
}

.text-display-lg {
  font-size: var(--text-display-lg);
  font-weight: var(--font-weight-extrabold);
  line-height: var(--line-height-none);
  letter-spacing: var(--letter-spacing-tighter);
}

.text-display-md {
  font-size: var(--text-display-md);
  font-weight: var(--font-weight-bold);
  line-height: var(--line-height-tight);
  letter-spacing: var(--letter-spacing-tight);
}

.text-display-sm {
  font-size: var(--text-display-sm);
  font-weight: var(--font-weight-bold);
  line-height: var(--line-height-tight);
  letter-spacing: var(--letter-spacing-tight);
}
```

### Headings
```css
h1, .h1 {
  font-size: var(--text-h1);
  font-weight: var(--font-weight-bold);
  line-height: var(--line-height-tight);
  letter-spacing: var(--letter-spacing-tight);
}

h2, .h2 {
  font-size: var(--text-h2);
  font-weight: var(--font-weight-semibold);
  line-height: var(--line-height-tight);
  letter-spacing: var(--letter-spacing-tight);
}

h3, .h3 {
  font-size: var(--text-h3);
  font-weight: var(--font-weight-semibold);
  line-height: var(--line-height-snug);
  letter-spacing: var(--letter-spacing-normal);
}

h4, .h4 {
  font-size: var(--text-h4);
  font-weight: var(--font-weight-medium);
  line-height: var(--line-height-snug);
  letter-spacing: var(--letter-spacing-normal);
}

h5, .h5 {
  font-size: var(--text-h5);
  font-weight: var(--font-weight-medium);
  line-height: var(--line-height-normal);
  letter-spacing: var(--letter-spacing-normal);
}

h6, .h6 {
  font-size: var(--text-h6);
  font-weight: var(--font-weight-medium);
  line-height: var(--line-height-normal);
  letter-spacing: var(--letter-spacing-normal);
}
```

### Body Text
```css
.text-body-lg {
  font-size: var(--text-body-lg);
  font-weight: var(--font-weight-regular);
  line-height: var(--line-height-relaxed);
}

.text-body-md {
  font-size: var(--text-body-md);
  font-weight: var(--font-weight-regular);
  line-height: var(--line-height-normal);
}

.text-body-sm {
  font-size: var(--text-body-sm);
  font-weight: var(--font-weight-regular);
  line-height: var(--line-height-normal);
}

.text-body-xs {
  font-size: var(--text-body-xs);
  font-weight: var(--font-weight-regular);
  line-height: var(--line-height-normal);
}
```

### UI Text
```css
.text-button {
  font-size: var(--text-button);
  font-weight: var(--font-weight-medium);
  line-height: var(--line-height-normal);
  letter-spacing: var(--letter-spacing-wide);
  text-transform: none;
}

.text-caption {
  font-size: var(--text-caption);
  font-weight: var(--font-weight-regular);
  line-height: var(--line-height-normal);
  letter-spacing: var(--letter-spacing-normal);
}

.text-overline {
  font-size: var(--text-overline);
  font-weight: var(--font-weight-semibold);
  line-height: var(--line-height-normal);
  letter-spacing: var(--letter-spacing-widest);
  text-transform: uppercase;
}

.text-label {
  font-size: var(--text-label);
  font-weight: var(--font-weight-medium);
  line-height: var(--line-height-normal);
  letter-spacing: var(--letter-spacing-normal);
}
```

### Code Text
```css
.text-code {
  font-family: var(--font-mono);
  font-size: 0.875em;
  font-weight: var(--font-weight-regular);
  letter-spacing: var(--letter-spacing-normal);
}

.text-code-inline {
  font-family: var(--font-mono);
  font-size: 0.875em;
  padding: 0.125rem 0.375rem;
  background: var(--bg-tertiary);
  border-radius: 0.25rem;
}
```

## Responsive Typography

### Mobile Optimizations
```css
@media (max-width: 640px) {
  body {
    font-size: 16px; /* Prevent zoom on iOS */
  }
  
  /* Adjust line heights for mobile */
  h1, h2, h3 {
    line-height: var(--line-height-snug);
  }
  
  p {
    line-height: var(--line-height-relaxed);
  }
}
```

### Desktop Enhancements
```css
@media (min-width: 1024px) {
  /* Optimal reading line length */
  .prose {
    max-width: 65ch;
  }
  
  /* Increased paragraph spacing */
  .prose p {
    margin-bottom: 1.5rem;
  }
}
```

## Usage Guidelines

### Hierarchy Best Practices
1. **One H1 per page** - Main page title
2. **Logical nesting** - Don't skip heading levels
3. **Consistent sizing** - Use the type scale
4. **Clear differentiation** - Weight + size changes
5. **Purposeful emphasis** - Bold/italic sparingly

### Readability Guidelines
1. **Line length**: 45-75 characters ideal
2. **Line height**: 1.5x for body text
3. **Paragraph spacing**: 1.5rem minimum
4. **Font size**: 16px minimum for body
5. **Contrast**: WCAG AA compliance

### Performance Optimization
1. **Font loading**: Use font-display: swap
2. **Subset fonts**: Include only needed characters
3. **Variable fonts**: Reduce file count
4. **Local fonts**: Fallback to system fonts
5. **Preload**: Critical font files

## Implementation Examples

### Article Layout
```html
<article class="prose">
  <h1 class="h1">Article Title</h1>
  <p class="text-body-lg">Lead paragraph with larger text for emphasis.</p>
  <h2 class="h2">Section Heading</h2>
  <p class="text-body-md">Regular body text with optimal readability.</p>
  <blockquote class="text-body-lg">
    Important quote with increased size.
  </blockquote>
</article>
```

### UI Components
```html
<!-- Button -->
<button class="text-button">
  Click Me
</button>

<!-- Form Label -->
<label class="text-label">
  Email Address
</label>

<!-- Caption -->
<figcaption class="text-caption">
  Image description
</figcaption>

<!-- Code Block -->
<pre><code class="text-code">
function example() {
  return "Hello World";
}
</code></pre>
```

### Marketing Section
```html
<section>
  <h1 class="text-display-lg">
    Transform Your Development
  </h1>
  <p class="text-body-lg">
    Build faster with AI-powered tools.
  </p>
  <span class="text-overline">Coming Soon</span>
</section>
```

## Accessibility Considerations

### Font Size
- Minimum 16px for body text
- User-scalable up to 200%
- Relative units (rem/em) preferred

### Line Spacing
- Minimum 1.5x line height
- Increased spacing for dyslexia support
- Adequate paragraph spacing

### Font Choice
- Clear letterforms
- Distinct character shapes
- Good x-height ratio
- Wide character spacing option

### Contrast
- WCAG AA minimum (4.5:1)
- WCAG AAA preferred (7:1)
- Test with color blindness simulators
- Avoid color-only emphasis