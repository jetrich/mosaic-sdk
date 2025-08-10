# MosAIc Design Tokens - Extracted from mosaic-site

**Task**: T.200.01.02.01  
**Source**: `/home/jwoltje/src/mosaic-sdk/mosaic-site/`  
**Date**: 2025-07-21  
**Status**: Complete  

## Overview

This document contains the complete design token system extracted from the mosaic-site submodule to ensure style consistency between the local OpenCode TUI webUI and the main mosaicstack.dev website.

## Color System

### Base Colors (CSS Custom Properties)

#### Light Theme (:root)
```css
--background: 0 0% 100%;           /* Pure white background */
--foreground: 240 10% 3.9%;        /* Nearly black text */
--card: 0 0% 100%;                 /* Card background */
--card-foreground: 240 10% 3.9%;   /* Card text */
--popover: 0 0% 100%;              /* Popover background */
--popover-foreground: 240 10% 3.9%; /* Popover text */
--border: 240 5.9% 90%;            /* Border color */
--input: 240 5.9% 90%;             /* Input border */
--ring: 240 5.9% 10%;              /* Focus ring */
--radius: 0.5rem;                  /* Border radius */
```

#### Dark Theme ([data-theme="dark"])
```css
--background: 240 10% 3.9%;        /* Dark background */
--foreground: 0 0% 98%;             /* Light text */
--card: 240 10% 3.9%;              /* Dark card background */
--card-foreground: 0 0% 98%;        /* Light card text */
--popover: 240 10% 3.9%;           /* Dark popover */
--popover-foreground: 0 0% 98%;     /* Light popover text */
--border: 240 3.7% 15.9%;          /* Dark border */
--input: 240 3.7% 15.9%;           /* Dark input border */
--ring: 240 4.9% 83.9%;            /* Light focus ring */
```

### Primary Color Scale
```css
/* Light Theme */
--primary: 240 5.9% 10%;           /* Primary dark */
--primary-foreground: 0 0% 98%;    /* Primary text */
--primary-50: 240 4.8% 95.9%;      /* Lightest */
--primary-100: 240 5.9% 90%;       
--primary-200: 240 5.9% 85%;       
--primary-300: 240 4.9% 83.9%;     
--primary-400: 240 5% 64.9%;       
--primary-500: 240 3.8% 46.1%;     /* Medium */
--primary-600: 240 5.2% 33.9%;     
--primary-700: 240 5.3% 26.1%;     
--primary-800: 240 3.7% 15.9%;     
--primary-900: 240 5.9% 10%;       /* Darkest */
--primary-950: 240 7.3% 8%;        /* Extra dark */

/* Dark Theme - Inverted scale */
--primary: 0 0% 98%;               /* Light primary in dark mode */
--primary-foreground: 240 5.9% 10%; /* Dark text in dark mode */
```

### Secondary Colors
```css
/* Light Theme */
--secondary: 240 4.8% 95.9%;       /* Light gray */
--secondary-foreground: 240 5.9% 10%; /* Dark text */
--muted: 240 4.8% 95.9%;           /* Muted background */
--muted-foreground: 240 3.8% 46.1%; /* Muted text */
--accent: 240 4.8% 95.9%;          /* Accent background */
--accent-foreground: 240 5.9% 10%; /* Accent text */

/* Dark Theme */
--secondary: 240 3.7% 15.9%;       /* Dark gray */
--secondary-foreground: 0 0% 98%;   /* Light text */
--muted: 240 3.7% 15.9%;           /* Dark muted */
--muted-foreground: 240 5% 64.9%;  /* Light muted text */
--accent: 240 3.7% 15.9%;          /* Dark accent */
--accent-foreground: 0 0% 98%;      /* Light accent text */
```

### Semantic Colors

#### Success (Green)
```css
--success-50: hsl(138 76% 97%);
--success-100: hsl(141 84% 93%);
--success-200: hsl(141 79% 85%);
--success-300: hsl(142 77% 73%);
--success-400: hsl(142 69% 58%);
--success-500: hsl(142 76% 36%);    /* Default success */
--success-600: hsl(142 72% 29%);
--success-700: hsl(142 64% 24%);
--success-800: hsl(142 53% 20%);
--success-900: hsl(143 61% 20%);
--success-950: hsl(144 60% 9%);
--success-foreground: hsl(355 0% 100%);
```

#### Warning (Orange/Yellow)
```css
--warning-50: hsl(48 100% 96%);
--warning-100: hsl(48 96% 89%);
--warning-200: hsl(48 97% 77%);
--warning-300: hsl(46 87% 65%);
--warning-400: hsl(43 74% 66%);
--warning-500: hsl(38 92% 50%);     /* Default warning */
--warning-600: hsl(32 95% 44%);
--warning-700: hsl(26 90% 37%);
--warning-800: hsl(23 83% 31%);
--warning-900: hsl(22 78% 26%);
--warning-950: hsl(21 85% 14%);
--warning-foreground: hsl(48 96% 89%);
```

#### Error (Red)
```css
--error-50: hsl(0 86% 97%);
--error-100: hsl(0 93% 94%);
--error-200: hsl(0 96% 89%);
--error-300: hsl(0 94% 82%);
--error-400: hsl(0 91% 71%);
--error-500: hsl(0 84% 60%);        /* Default error */
--error-600: hsl(0 72% 51%);
--error-700: hsl(0 74% 42%);
--error-800: hsl(0 70% 35%);
--error-900: hsl(0 63% 31%);
--error-950: hsl(0 75% 15%);
--error-foreground: hsl(0 0% 98%);
```

#### Destructive (System)
```css
/* Light Theme */
--destructive: 0 84.2% 60.2%;       /* Red destructive action */
--destructive-foreground: 0 0% 98%; /* White text */

/* Dark Theme */
--destructive: 0 62.8% 30.6%;       /* Darker red */
--destructive-foreground: 0 0% 98%; /* White text */
```

## Typography

### Font Families
```css
/* Sans Serif Stack */
font-family: 
  'Inter',
  'ui-sans-serif',
  'system-ui',
  '-apple-system',
  'BlinkMacSystemFont',
  'Segoe UI',
  'Roboto',
  'Helvetica Neue',
  'Arial',
  'Noto Sans',
  'sans-serif';

/* Monospace Stack */
font-family:
  'JetBrains Mono',
  'Menlo',
  'Monaco',
  'Consolas',
  'Liberation Mono',
  'Courier New',
  'monospace';
```

### Typography Scale
```css
/* Headings */
h1: @apply text-4xl font-extrabold lg:text-5xl scroll-m-20 tracking-tight;
h2: @apply text-3xl font-semibold scroll-m-20 tracking-tight;
h3: @apply text-2xl font-semibold scroll-m-20 tracking-tight;
h4: @apply text-xl font-semibold scroll-m-20 tracking-tight;

/* Code */
code: @apply relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold;
pre: @apply overflow-x-auto rounded-lg border bg-muted p-4;
```

## Spacing & Layout

### Custom Spacing
```css
'18': '4.5rem',    /* 72px */
'88': '22rem'      /* 352px */
```

### Container Configuration
```css
container: {
  center: true,
  padding: {
    DEFAULT: '1rem',   /* 16px */
    sm: '2rem',        /* 32px */
    lg: '4rem',        /* 64px */
    xl: '5rem',        /* 80px */
    '2xl': '6rem'      /* 96px */
  },
  screens: {
    '2xl': '1400px'
  }
}
```

### Border Radius
```css
--radius: 0.5rem;              /* Base radius: 8px */
lg: 'var(--radius)',           /* 8px */
md: 'calc(var(--radius) - 2px)', /* 6px */
sm: 'calc(var(--radius) - 4px)'  /* 4px */
```

## Responsive Breakpoints

### Screen Sizes
```css
xs: '475px',
sm: '640px',       /* Tailwind default */
md: '768px',       /* Tailwind default */
lg: '1024px',      /* Tailwind default */
xl: '1280px',      /* Tailwind default */
'2xl': '1536px',   /* Tailwind default */
'3xl': '1680px',   /* Custom */
'4xl': '2560px'    /* Custom */
```

## Animation & Effects

### Custom Animations
```css
'fade-in': 'fade-in 0.5s ease-in-out',
'fade-in-up': 'fade-in-up 0.5s ease-out',
'scale-in': 'scale-in 0.3s ease-out',
'slide-in-right': 'slide-in-right 0.3s ease-out',
'bounce-gentle': 'bounce-gentle 2s infinite',
'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
'gradient': 'gradient 15s ease infinite',
'float': 'float 6s ease-in-out infinite',
'glow': 'glow 2s ease-in-out infinite alternate'
```

### Keyframes
```css
@keyframes fade-in {
  0% { opacity: 0; }
  100% { opacity: 1; }
}

@keyframes fade-in-up {
  0% { opacity: 0; transform: translateY(30px); }
  100% { opacity: 1; transform: translateY(0); }
}

@keyframes scale-in {
  0% { transform: scale(0.9); opacity: 0; }
  100% { transform: scale(1); opacity: 1; }
}

@keyframes slide-in-right {
  0% { transform: translateX(100%); opacity: 0; }
  100% { transform: translateX(0); opacity: 1; }
}

@keyframes bounce-gentle {
  0%, 100% { transform: translateY(-5%); }
  50% { transform: translateY(0); }
}

@keyframes gradient {
  0%, 100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
}

@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-20px); }
}

@keyframes glow {
  0% { box-shadow: 0 0 5px rgb(59 130 246 / 0.5); }
  100% { box-shadow: 0 0 20px rgb(59 130 246 / 0.8); }
}
```

### Box Shadows
```css
'glow-sm': '0 0 10px rgb(59 130 246 / 0.3)',
'glow': '0 0 20px rgb(59 130 246 / 0.4)',
'glow-lg': '0 0 30px rgb(59 130 246 / 0.5)',
'inner-glow': 'inset 0 0 10px rgb(59 130 246 / 0.2)'
```

### Backdrop Blur
```css
backdropBlur: {
  xs: '2px'
}
```

## Component Patterns

### Button Variants
```css
/* Base Button Classes */
base: 'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50'

/* Variants */
default: 'bg-primary text-primary-foreground hover:bg-primary/90'
destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground'
secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
ghost: 'hover:bg-accent hover:text-accent-foreground'
link: 'text-primary underline-offset-4 hover:underline'

/* Sizes */
default: 'h-10 px-4 py-2'
sm: 'h-9 rounded-md px-3'
lg: 'h-11 rounded-md px-8'
icon: 'h-10 w-10'
```

### Accessibility Features
```css
/* Focus Styles */
.focus-visible: 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'

/* Selection Styling */
::selection: 'bg-primary/20'
```

### Custom Scrollbars
```css
::-webkit-scrollbar: 'w-2'
::-webkit-scrollbar-track: 'bg-transparent'
::-webkit-scrollbar-thumb: 'bg-border rounded-full'
::-webkit-scrollbar-thumb:hover: 'bg-muted-foreground/20'
```

## Utility Classes

### Content & Layout
```css
html: 'scroll-behavior: smooth'
body: 'bg-background text-foreground'
*: 'border-border'
```

### Print Styles
```css
@media print {
  *: 'text-black bg-white'
}
```

## Typography Configuration
```css
typography: {
  DEFAULT: {
    css: {
      maxWidth: 'none',
      color: 'hsl(var(--foreground))',
      'h1, h2, h3, h4, h5, h6': {
        color: 'hsl(var(--foreground))',
        fontWeight: '600'
      },
      'code': {
        color: 'hsl(var(--primary))',
        backgroundColor: 'hsl(var(--muted))',
        padding: '2px 4px',
        borderRadius: '4px',
        fontSize: '0.875em'
      },
      'pre': {
        backgroundColor: 'hsl(var(--muted))',
        border: '1px solid hsl(var(--border))'
      },
      'blockquote': {
        borderLeftColor: 'hsl(var(--border))',
        color: 'hsl(var(--muted-foreground))'
      },
      'a': {
        color: 'hsl(var(--primary))',
        textDecoration: 'none',
        '&:hover': {
          textDecoration: 'underline'
        }
      }
    }
  }
}
```

## Integration Guidelines

### CSS Custom Properties Usage
All colors should use HSL format with CSS custom properties:
```css
/* ✅ Correct */
color: hsl(var(--primary));
background-color: hsl(var(--card));

/* ❌ Avoid */
color: #000000;
background-color: white;
```

### Dark Mode Implementation
Use `[data-theme="dark"]` attribute selector:
```css
/* Light mode (default) */
:root {
  --primary: 240 5.9% 10%;
}

/* Dark mode */
[data-theme="dark"] {
  --primary: 0 0% 98%;
}
```

### Component Styling Pattern
Use Tailwind classes with design tokens:
```tsx
// ✅ Correct pattern
<button className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-md">
  Button
</button>

// ✅ Also correct with utility function
<button className={cn("bg-primary text-primary-foreground", className)}>
  Button
</button>
```

### Animation Usage
Use predefined animations for consistency:
```css
/* ✅ Use predefined animations */
.fade-in { animation: fade-in 0.5s ease-in-out; }
.glow-effect { box-shadow: var(--glow); }

/* ❌ Avoid custom animations unless necessary */
.custom-animation { animation: custom 1s ease; }
```

## Next Steps

1. **Create OpenCode Theme Configuration**: Use these tokens to create OpenCode-compatible CSS
2. **Web UI Component Library**: Build React components using these design tokens
3. **Terminal Theme Mapping**: Map colors to terminal color scheme for consistency
4. **Documentation**: Create implementation guide for developers

## Implementation Priority

**High Priority (Core Identity)**:
- Color system (primary, secondary, semantic colors)
- Typography (font families, scales)
- Dark/light mode implementation

**Medium Priority (Polish)**:
- Animations and transitions
- Custom shadows and effects
- Responsive breakpoints

**Low Priority (Enhancement)**:
- Custom scrollbars
- Print styles
- Advanced typography features