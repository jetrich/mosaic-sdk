# MosAIc Spacing System

## Design Principles
Our spacing system is based on an 8px grid to ensure consistency, rhythm, and visual harmony across all components and layouts.

## Base Unit
```css
--space-base: 8px; /* Base unit for all spacing calculations */
```

## Spacing Scale

### Core Spacing Tokens
```css
/* Fractional spaces */
--space-0: 0;                           /* 0px */
--space-px: 1px;                        /* 1px */
--space-0.5: calc(var(--space-base) * 0.5);  /* 4px */

/* Linear scale */
--space-1: calc(var(--space-base) * 1);      /* 8px */
--space-1.5: calc(var(--space-base) * 1.5);  /* 12px */
--space-2: calc(var(--space-base) * 2);      /* 16px */
--space-2.5: calc(var(--space-base) * 2.5);  /* 20px */
--space-3: calc(var(--space-base) * 3);      /* 24px */
--space-3.5: calc(var(--space-base) * 3.5);  /* 28px */
--space-4: calc(var(--space-base) * 4);      /* 32px */
--space-5: calc(var(--space-base) * 5);      /* 40px */
--space-6: calc(var(--space-base) * 6);      /* 48px */
--space-7: calc(var(--space-base) * 7);      /* 56px */
--space-8: calc(var(--space-base) * 8);      /* 64px */
--space-9: calc(var(--space-base) * 9);      /* 72px */
--space-10: calc(var(--space-base) * 10);    /* 80px */
--space-11: calc(var(--space-base) * 11);    /* 88px */
--space-12: calc(var(--space-base) * 12);    /* 96px */
--space-14: calc(var(--space-base) * 14);    /* 112px */
--space-16: calc(var(--space-base) * 16);    /* 128px */
--space-20: calc(var(--space-base) * 20);    /* 160px */
--space-24: calc(var(--space-base) * 24);    /* 192px */
--space-28: calc(var(--space-base) * 28);    /* 224px */
--space-32: calc(var(--space-base) * 32);    /* 256px */
```

## Semantic Spacing

### Component Spacing
```css
/* Padding */
--padding-xs: var(--space-1);          /* 8px */
--padding-sm: var(--space-2);          /* 16px */
--padding-md: var(--space-3);          /* 24px */
--padding-lg: var(--space-4);          /* 32px */
--padding-xl: var(--space-6);          /* 48px */
--padding-2xl: var(--space-8);         /* 64px */

/* Margin */
--margin-xs: var(--space-1);           /* 8px */
--margin-sm: var(--space-2);           /* 16px */
--margin-md: var(--space-4);           /* 32px */
--margin-lg: var(--space-6);           /* 48px */
--margin-xl: var(--space-8);           /* 64px */
--margin-2xl: var(--space-12);         /* 96px */

/* Gap (for flexbox/grid) */
--gap-xs: var(--space-1);              /* 8px */
--gap-sm: var(--space-2);              /* 16px */
--gap-md: var(--space-3);              /* 24px */
--gap-lg: var(--space-4);              /* 32px */
--gap-xl: var(--space-6);              /* 48px */
```

### Layout Spacing
```css
/* Section spacing */
--section-padding-mobile: var(--space-6);    /* 48px */
--section-padding-tablet: var(--space-8);    /* 64px */
--section-padding-desktop: var(--space-12);  /* 96px */

/* Container padding */
--container-padding-mobile: var(--space-3);  /* 24px */
--container-padding-tablet: var(--space-4);  /* 32px */
--container-padding-desktop: var(--space-6); /* 48px */

/* Content spacing */
--content-spacing-sm: var(--space-3);        /* 24px */
--content-spacing-md: var(--space-4);        /* 32px */
--content-spacing-lg: var(--space-6);        /* 48px */
```

## Responsive Spacing

### Fluid Spacing
```css
/* Responsive padding using clamp() */
--padding-responsive-sm: clamp(var(--space-2), 3vw, var(--space-3));
--padding-responsive-md: clamp(var(--space-3), 4vw, var(--space-4));
--padding-responsive-lg: clamp(var(--space-4), 5vw, var(--space-6));
--padding-responsive-xl: clamp(var(--space-6), 6vw, var(--space-8));

/* Responsive margin */
--margin-responsive-sm: clamp(var(--space-2), 3vw, var(--space-4));
--margin-responsive-md: clamp(var(--space-4), 4vw, var(--space-6));
--margin-responsive-lg: clamp(var(--space-6), 5vw, var(--space-8));
--margin-responsive-xl: clamp(var(--space-8), 6vw, var(--space-12));
```

## Component Examples

### Buttons
```css
.btn {
  padding: var(--space-1.5) var(--space-3);  /* 12px 24px */
}

.btn-sm {
  padding: var(--space-1) var(--space-2);    /* 8px 16px */
}

.btn-lg {
  padding: var(--space-2) var(--space-4);    /* 16px 32px */
}
```

### Cards
```css
.card {
  padding: var(--padding-md);                 /* 24px */
  margin-bottom: var(--margin-md);            /* 32px */
}

.card-compact {
  padding: var(--padding-sm);                 /* 16px */
}

.card-spacious {
  padding: var(--padding-lg);                 /* 32px */
}
```

### Forms
```css
.form-group {
  margin-bottom: var(--space-3);              /* 24px */
}

.form-label {
  margin-bottom: var(--space-1);              /* 8px */
}

.form-input {
  padding: var(--space-1.5) var(--space-2);   /* 12px 16px */
}

.form-help-text {
  margin-top: var(--space-0.5);               /* 4px */
}
```

### Grid Layouts
```css
.grid {
  gap: var(--gap-md);                         /* 24px */
}

.grid-tight {
  gap: var(--gap-sm);                         /* 16px */
}

.grid-loose {
  gap: var(--gap-lg);                         /* 32px */
}
```

## Layout Patterns

### Section Spacing
```css
.section {
  padding-top: var(--section-padding-mobile);
  padding-bottom: var(--section-padding-mobile);
}

@media (min-width: 768px) {
  .section {
    padding-top: var(--section-padding-tablet);
    padding-bottom: var(--section-padding-tablet);
  }
}

@media (min-width: 1024px) {
  .section {
    padding-top: var(--section-padding-desktop);
    padding-bottom: var(--section-padding-desktop);
  }
}
```

### Container Spacing
```css
.container {
  padding-left: var(--container-padding-mobile);
  padding-right: var(--container-padding-mobile);
}

@media (min-width: 768px) {
  .container {
    padding-left: var(--container-padding-tablet);
    padding-right: var(--container-padding-tablet);
  }
}

@media (min-width: 1024px) {
  .container {
    padding-left: var(--container-padding-desktop);
    padding-right: var(--container-padding-desktop);
  }
}
```

### Stack Spacing
```css
.stack > * + * {
  margin-top: var(--space-3);                 /* 24px */
}

.stack-sm > * + * {
  margin-top: var(--space-2);                 /* 16px */
}

.stack-lg > * + * {
  margin-top: var(--space-4);                 /* 32px */
}
```

## Utility Classes

### Padding Utilities
```css
.p-0 { padding: var(--space-0); }
.p-1 { padding: var(--space-1); }
.p-2 { padding: var(--space-2); }
.p-3 { padding: var(--space-3); }
.p-4 { padding: var(--space-4); }
.p-5 { padding: var(--space-5); }
.p-6 { padding: var(--space-6); }
.p-8 { padding: var(--space-8); }

/* Directional padding */
.pt-4 { padding-top: var(--space-4); }
.pr-4 { padding-right: var(--space-4); }
.pb-4 { padding-bottom: var(--space-4); }
.pl-4 { padding-left: var(--space-4); }

/* Axis padding */
.px-4 { 
  padding-left: var(--space-4); 
  padding-right: var(--space-4); 
}
.py-4 { 
  padding-top: var(--space-4); 
  padding-bottom: var(--space-4); 
}
```

### Margin Utilities
```css
.m-0 { margin: var(--space-0); }
.m-1 { margin: var(--space-1); }
.m-2 { margin: var(--space-2); }
.m-3 { margin: var(--space-3); }
.m-4 { margin: var(--space-4); }
.m-5 { margin: var(--space-5); }
.m-6 { margin: var(--space-6); }
.m-8 { margin: var(--space-8); }

/* Auto margins */
.mx-auto { 
  margin-left: auto; 
  margin-right: auto; 
}

/* Negative margins */
.-mt-4 { margin-top: calc(var(--space-4) * -1); }
```

### Gap Utilities
```css
.gap-1 { gap: var(--space-1); }
.gap-2 { gap: var(--space-2); }
.gap-3 { gap: var(--space-3); }
.gap-4 { gap: var(--space-4); }
.gap-5 { gap: var(--space-5); }
.gap-6 { gap: var(--space-6); }
.gap-8 { gap: var(--space-8); }
```

## Best Practices

### Do's
1. **Use the 8px grid** - All spacing should be multiples of 8
2. **Be consistent** - Use the same spacing for similar elements
3. **Create rhythm** - Use consistent vertical spacing
4. **Responsive spacing** - Adjust spacing for different screens
5. **Semantic tokens** - Use purpose-based tokens when available

### Don'ts
1. **Avoid arbitrary values** - Don't use random pixel values
2. **Don't mix units** - Stick to the spacing scale
3. **Avoid inline styles** - Use utility classes or components
4. **Don't over-space** - More isn't always better
5. **Don't forget mobile** - Test spacing on small screens

## Accessibility Considerations

### Touch Targets
- Minimum 44x44px for touch targets
- Use adequate padding for interactive elements
- Ensure sufficient spacing between clickable items

### Visual Clarity
- Use spacing to create clear content groups
- Ensure adequate spacing around text
- Provide visual breathing room

### Responsive Design
- Test spacing at all breakpoints
- Ensure content doesn't feel cramped on mobile
- Maintain readability with appropriate spacing