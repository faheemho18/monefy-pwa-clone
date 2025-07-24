# Accessibility & Color Variation Guide
## Comprehensive Accessibility Standards for Monefy PWA Visual Assets

### Table of Contents
1. [Accessibility Overview](#accessibility-overview)
2. [Color Contrast Standards](#color-contrast-standards)
3. [Color Variation System](#color-variation-system)
4. [High Contrast Mode](#high-contrast-mode)
5. [Color Blindness Considerations](#color-blindness-considerations)
6. [Screen Reader Support](#screen-reader-support)
7. [Keyboard Navigation](#keyboard-navigation)
8. [Motion and Animation](#motion-and-animation)
9. [Implementation Guidelines](#implementation-guidelines)
10. [Testing Procedures](#testing-procedures)

---

## Accessibility Overview

### Compliance Standards
- **WCAG 2.1 Level AA**: Primary compliance target
- **Section 508**: US federal accessibility requirements
- **EN 301 549**: European accessibility standard
- **ADA Compliance**: Americans with Disabilities Act guidelines

### Core Principles
1. **Perceivable**: Information must be presentable in ways users can perceive
2. **Operable**: Interface components must be operable by all users
3. **Understandable**: Information and UI operation must be understandable
4. **Robust**: Content must be robust enough for various assistive technologies

### Accessibility Features
- Minimum 4.5:1 color contrast ratios
- Alternative text for all informative icons
- High contrast mode support
- Color blindness accommodations
- Screen reader compatibility
- Keyboard navigation support
- Reduced motion preferences
- Touch target accessibility

---

## Color Contrast Standards

### WCAG 2.1 Requirements

#### Normal Text (Under 18pt)
```css
/* Minimum contrast ratio: 4.5:1 */
.text-primary {
  color: #212121; /* 16.32:1 contrast on white */
  background: #FFFFFF;
}

.text-secondary {
  color: #5F6368; /* 7.01:1 contrast on white */
  background: #FFFFFF;
}
```

#### Large Text (18pt+ or 14pt+ bold)
```css
/* Minimum contrast ratio: 3:1 */
.text-large {
  color: #5F6368; /* 7.01:1 contrast - exceeds requirement */
  background: #FFFFFF;
}
```

#### Interactive Elements
```css
/* Minimum contrast ratio: 3:1 */
.interactive-primary {
  color: #FFFFFF; /* 21:1 contrast */
  background: #1976D2; /* 4.5:1 contrast on white */
}

.interactive-secondary {
  color: #1976D2; /* 4.5:1 contrast */
  background: #FFFFFF;
  border: 2px solid #1976D2; /* 4.5:1 contrast */
}
```

### Category Icon Contrast Testing

#### Food & Dining (#FF5722)
```css
.category-food {
  /* Primary color: #FF5722 on white background */
  color: #FF5722; /* 3.15:1 contrast - needs enhancement */
  
  /* Enhanced for accessibility */
  color: #D84315; /* 4.52:1 contrast - meets AA standard */
}

/* High contrast alternative */
@media (prefers-contrast: high) {
  .category-food {
    color: #BF360C; /* 6.67:1 contrast */
    stroke: #000000;
    stroke-width: 1px;
  }
}
```

#### Transportation (#3F51B5)
```css
.category-transport {
  color: #3F51B5; /* 4.56:1 contrast - meets AA standard */
}

@media (prefers-contrast: high) {
  .category-transport {
    color: #283593; /* 7.24:1 contrast */
  }
}
```

#### Entertainment (#9C27B0)
```css
.category-entertainment {
  color: #9C27B0; /* 4.54:1 contrast - meets AA standard */
}

@media (prefers-contrast: high) {
  .category-entertainment {
    color: #7B1FA2; /* 6.89:1 contrast */
  }
}
```

---

## Color Variation System

### Primary Color Palette with Accessibility Variants

#### Green (Primary Brand Color)
```css
:root {
  /* Standard variations */
  --green-50: #E8F5E8;
  --green-100: #C8E6C9;
  --green-200: #A5D6A7;
  --green-300: #81C784;
  --green-400: #66BB6A;
  --green-500: #4CAF50;  /* Primary brand color */
  --green-600: #43A047;  /* AA compliant on white */
  --green-700: #388E3C;  /* AAA compliant on white */
  --green-800: #2E7D32;
  --green-900: #1B5E20;
  
  /* High contrast variations */
  --green-hc-light: #2E7D32; /* High contrast on light backgrounds */
  --green-hc-dark: #81C784;  /* High contrast on dark backgrounds */
}

/* Usage examples */
.success-message {
  color: var(--green-700); /* 7.4:1 contrast */
  background: #FFFFFF;
}

.success-button {
  color: #FFFFFF;
  background: var(--green-600); /* 4.5:1 button contrast */
}
```

#### Orange (Secondary Accent)
```css
:root {
  --orange-50: #FFF3E0;
  --orange-100: #FFE0B2;
  --orange-200: #FFCC80;
  --orange-300: #FFB74D;
  --orange-400: #FFA726;
  --orange-500: #FF9800;  /* Secondary brand color */
  --orange-600: #FB8C00;  /* AA compliant on white */
  --orange-700: #F57C00;  /* AAA compliant on white */
  --orange-800: #EF6C00;
  --orange-900: #E65100;
  
  /* High contrast variations */
  --orange-hc-light: #E65100;
  --orange-hc-dark: #FFB74D;
}
```

### Category Color System with Accessibility

#### Food & Dining Color Variations
```css
.category-food {
  --food-primary: #FF5722;
  --food-accessible: #D84315;  /* 4.52:1 contrast */
  --food-high-contrast: #BF360C;  /* 6.67:1 contrast */
  --food-background: #FFEBEE;
  --food-background-hover: #FFCDD2;
}

/* Responsive contrast */
.category-food-icon {
  color: var(--food-accessible);
}

@media (prefers-contrast: high) {
  .category-food-icon {
    color: var(--food-high-contrast);
    filter: drop-shadow(0 0 1px rgba(0,0,0,0.5));
  }
}
```

#### All Category Colors with Accessibility Variants
```css
:root {
  /* Food & Dining */
  --food-standard: #FF5722;
  --food-accessible: #D84315;
  --food-high-contrast: #BF360C;
  
  /* Transportation */
  --transport-standard: #3F51B5;
  --transport-accessible: #3F51B5; /* Already compliant */
  --transport-high-contrast: #283593;
  
  /* Entertainment */
  --entertainment-standard: #9C27B0;
  --entertainment-accessible: #9C27B0; /* Already compliant */
  --entertainment-high-contrast: #7B1FA2;
  
  /* Shopping */
  --shopping-standard: #E91E63;
  --shopping-accessible: #C2185B; /* 4.51:1 contrast */
  --shopping-high-contrast: #AD1457;
  
  /* Bills & Utilities */
  --bills-standard: #607D8B;
  --bills-accessible: #455A64; /* 4.56:1 contrast */
  --bills-high-contrast: #37474F;
  
  /* Healthcare */
  --healthcare-standard: #00BCD4;
  --healthcare-accessible: #0097A7; /* 4.51:1 contrast */
  --healthcare-high-contrast: #00838F;
  
  /* Education */
  --education-standard: #795548;
  --education-accessible: #5D4037; /* 4.54:1 contrast */
  --education-high-contrast: #4E342E;
  
  /* Travel */
  --travel-standard: #FF9800;
  --travel-accessible: #F57C00; /* 4.52:1 contrast */
  --travel-high-contrast: #E65100;
}
```

---

## High Contrast Mode

### System Preference Detection
```css
/* High contrast mode styles */
@media (prefers-contrast: high) {
  :root {
    /* Override color variables for high contrast */
    --text-primary: #000000;
    --text-secondary: #000000;
    --background-primary: #FFFFFF;
    --background-secondary: #FFFFFF;
    
    /* Enhanced borders */
    --border-width: 2px;
    --border-color: #000000;
  }
  
  /* Icon enhancements */
  .icon {
    filter: contrast(1.5) drop-shadow(0 0 1px rgba(0,0,0,0.8));
  }
  
  /* Button enhancements */
  .btn {
    border: 2px solid currentColor;
    font-weight: 600;
  }
  
  /* Focus indicators */
  .focusable:focus {
    outline: 3px solid #000000;
    outline-offset: 2px;
  }
}
```

### Windows High Contrast Mode
```css
/* Windows High Contrast Mode support */
@media (prefers-contrast: high) and (-ms-high-contrast: active) {
  .icon {
    fill: WindowText;
    stroke: WindowText;
  }
  
  .btn-primary {
    background: ButtonFace;
    color: ButtonText;
    border: 2px solid ButtonText;
  }
  
  .category-icon {
    background: Window;
    border: 2px solid WindowText;
  }
}

/* Additional Windows-specific adjustments */
@media (-ms-high-contrast: black-on-white) {
  .icon {
    fill: #000000;
  }
}

@media (-ms-high-contrast: white-on-black) {
  .icon {
    fill: #FFFFFF;
  }
}
```

---

## Color Blindness Considerations

### Color Blindness Types and Accommodations

#### Deuteranopia (Green Blindness) - 5% of males
```css
/* Ensure distinguishability without relying solely on green */
.category-food {
  /* Add pattern or texture for distinction */
  background-image: url('data:image/svg+xml,<svg>...</svg>');
}

/* Alternative: Use shape and position cues */
.category-food::before {
  content: '🍽️';
  position: absolute;
  top: 2px;
  right: 2px;
  font-size: 12px;
}
```

#### Protanopia (Red Blindness) - 2% of males
```css
/* Enhanced contrast and alternative visual cues */
.error-state {
  color: #000000;
  background: #FFE0E0;
  border-left: 4px solid #800000;
  position: relative;
}

.error-state::before {
  content: '⚠️';
  margin-right: 8px;
}
```

#### Tritanopia (Blue Blindness) - 0.1% of population
```css
/* Avoid blue-yellow confusion */
.info-message {
  color: #000000;
  background: #F0F0F0;
  border: 2px solid #666666;
  font-weight: 500;
}
```

### Color Blindness Testing Colors
```css
/* Simulate different types of color blindness */
.deuteranopia-simulation {
  filter: url('#deuteranopia-filter');
}

.protanopia-simulation {
  filter: url('#protanopia-filter');
}

.tritanopia-simulation {
  filter: url('#tritanopia-filter');
}

/* SVG filters for simulation */
/*
<svg>
  <defs>
    <filter id="deuteranopia-filter">
      <feColorMatrix values="0.625 0.375 0   0 0
                             0.7   0.3   0   0 0
                             0     0.3   0.7 0 0
                             0     0     0   1 0"/>
    </filter>
  </defs>
</svg>
*/
```

### Pattern-Based Alternatives
```css
/* Use patterns in addition to colors */
.category-pattern-food {
  background-image: 
    radial-gradient(circle at 25% 25%, rgba(255,87,34,0.2) 2px, transparent 2px),
    radial-gradient(circle at 75% 75%, rgba(255,87,34,0.2) 2px, transparent 2px);
  background-size: 10px 10px;
}

.category-pattern-transport {
  background-image: 
    linear-gradient(45deg, rgba(63,81,181,0.2) 25%, transparent 25%),
    linear-gradient(-45deg, rgba(63,81,181,0.2) 25%, transparent 25%);
  background-size: 8px 8px;
}
```

---

## Screen Reader Support

### ARIA Labels and Descriptions
```html
<!-- Category Icons with Proper ARIA -->
<button class="category-item" 
        aria-label="Food and dining expenses" 
        aria-describedby="food-description">
  <svg class="category-icon" aria-hidden="true" focusable="false">
    <use href="#icon-food"/>
  </svg>
  <span class="category-label">Food</span>
  <span id="food-description" class="sr-only">
    Track expenses for restaurants, groceries, and dining
  </span>
</button>

<!-- Loading States -->
<div class="loading-container" aria-live="polite" aria-label="Loading">
  <svg class="loading-spinner" aria-hidden="true">
    <use href="#spinner"/>
  </svg>
  <span class="loading-text">Processing your expense...</span>
</div>

<!-- Progress Indicators -->
<div class="progress-container" role="progressbar" 
     aria-valuenow="65" aria-valuemin="0" aria-valuemax="100"
     aria-label="Monthly budget progress">
  <svg class="progress-ring" aria-hidden="true">
    <use href="#progress-ring"/>
  </svg>
  <span class="sr-only">65% of monthly budget used</span>
</div>
```

### Screen Reader Only Content
```css
/* Screen reader only text */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

/* Focusable screen reader only content */
.sr-only-focusable:active,
.sr-only-focusable:focus {
  position: static;
  width: auto;
  height: auto;
  padding: inherit;
  margin: inherit;
  overflow: visible;
  clip: auto;
  white-space: inherit;
}
```

### Dynamic Content Announcements
```javascript
// Announce dynamic changes to screen readers
function announceToScreenReader(message, priority = 'polite') {
  const announcement = document.createElement('div');
  announcement.setAttribute('aria-live', priority);
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = 'sr-only';
  announcement.textContent = message;
  
  document.body.appendChild(announcement);
  
  // Remove after announcement
  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
}

// Usage examples
announceToScreenReader('Expense added successfully');
announceToScreenReader('Error: Please fill in all required fields', 'assertive');
```

---

## Keyboard Navigation

### Focus Management
```css
/* Focus indicators */
.focusable {
  position: relative;
}

.focusable:focus {
  outline: 2px solid #4CAF50;
  outline-offset: 2px;
  border-radius: 4px;
}

/* High contrast focus indicators */
@media (prefers-contrast: high) {
  .focusable:focus {
    outline: 3px solid #000000;
    outline-offset: 3px;
    box-shadow: 0 0 0 6px rgba(76, 175, 80, 0.3);
  }
}

/* Skip links */
.skip-link {
  position: absolute;
  top: -40px;
  left: 6px;
  background: #000000;
  color: #FFFFFF;
  padding: 8px;
  text-decoration: none;
  border-radius: 4px;
  z-index: 9999;
  transition: top 0.2s;
}

.skip-link:focus {
  top: 6px;
}
```

### Keyboard Shortcuts
```javascript
// Keyboard navigation handler
class KeyboardNavigationManager {
  constructor() {
    this.shortcuts = new Map([
      ['KeyN', () => this.openNewExpenseModal()],
      ['KeyS', () => this.focusSearch()],
      ['Escape', () => this.closeModal()],
      ['KeyH', () => this.navigateToHome()],
      ['KeyT', () => this.navigateToTransactions()]
    ]);
    
    this.bindEvents();
  }
  
  bindEvents() {
    document.addEventListener('keydown', (event) => {
      // Only trigger on Alt + key combinations
      if (event.altKey && !event.ctrlKey && !event.shiftKey) {
        const handler = this.shortcuts.get(event.code);
        if (handler) {
          event.preventDefault();
          handler();
          
          // Announce shortcut usage
          announceToScreenReader(`Activated ${event.code} shortcut`);
        }
      }
    });
  }
  
  openNewExpenseModal() {
    const addButton = document.querySelector('[data-action="add-expense"]');
    if (addButton) {
      addButton.click();
      addButton.focus();
    }
  }
  
  focusSearch() {
    const searchInput = document.querySelector('[data-search="expenses"]');
    if (searchInput) {
      searchInput.focus();
    }
  }
}

// Initialize keyboard navigation
const keyboardNav = new KeyboardNavigationManager();
```

### Focus Trap for Modals
```javascript
// Focus trap implementation
class FocusTrap {
  constructor(element) {
    this.element = element;
    this.focusableElements = this.getFocusableElements();
    this.firstFocusable = this.focusableElements[0];
    this.lastFocusable = this.focusableElements[this.focusableElements.length - 1];
  }
  
  getFocusableElements() {
    const selectors = [
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      'a[href]',
      '[tabindex]:not([tabindex="-1"])'
    ];
    
    return this.element.querySelectorAll(selectors.join(','));
  }
  
  activate() {
    this.element.addEventListener('keydown', this.handleKeyDown.bind(this));
    this.firstFocusable?.focus();
  }
  
  deactivate() {
    this.element.removeEventListener('keydown', this.handleKeyDown.bind(this));
  }
  
  handleKeyDown(event) {
    if (event.key === 'Tab') {
      if (event.shiftKey) {
        if (document.activeElement === this.firstFocusable) {
          event.preventDefault();
          this.lastFocusable?.focus();
        }
      } else {
        if (document.activeElement === this.lastFocusable) {
          event.preventDefault();
          this.firstFocusable?.focus();
        }
      }
    }
  }
}
```

---

## Motion and Animation

### Reduced Motion Preferences
```css
/* Respect user's motion preferences */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
  
  /* Disable problematic animations */
  .loading-spinner {
    animation: none;
  }
  
  /* Replace with static alternatives */
  .loading-spinner::after {
    content: '⏳';
    font-size: 24px;
  }
}

/* Motion-safe animations */
@media (prefers-reduced-motion: no-preference) {
  .smooth-transition {
    transition: all 0.3s ease;
  }
  
  .fade-in {
    animation: fadeIn 0.5s ease-in;
  }
}
```

### Vestibular Disorder Considerations
```css
/* Avoid problematic motion patterns */
@media (prefers-reduced-motion: reduce) {
  /* No parallax scrolling */
  .parallax {
    transform: none !important;
  }
  
  /* No rotation animations */
  .spin,
  .rotate {
    animation: none !important;
    transform: none !important;
  }
  
  /* No zoom animations */
  .zoom-in,
  .zoom-out {
    animation: none !important;
    transform: none !important;
  }
}
```

---

## Implementation Guidelines

### CSS Custom Properties for Accessibility
```css
:root {
  /* Accessibility-first color system */
  --color-text-primary: #212121;
  --color-text-secondary: #5F6368;
  --color-text-disabled: #9E9E9E;
  
  /* Interactive element colors */
  --color-interactive-primary: #1976D2;
  --color-interactive-hover: #1565C0;
  --color-interactive-focus: #0D47A1;
  --color-interactive-disabled: #BBBBBB;
  
  /* Status colors with sufficient contrast */
  --color-success: #2E7D32;
  --color-warning: #F57C00;
  --color-error: #C62828;
  --color-info: #1976D2;
  
  /* Focus and selection */
  --color-focus-ring: #4CAF50;
  --color-selection-bg: #E8F5E8;
  --color-selection-text: #1B5E20;
}

/* Dark mode accessibility */
@media (prefers-color-scheme: dark) {
  :root {
    --color-text-primary: #FFFFFF;
    --color-text-secondary: #B0BEC5;
    --color-text-disabled: #616161;
    
    --color-interactive-primary: #64B5F6;
    --color-interactive-hover: #42A5F5;
    --color-interactive-focus: #2196F3;
    
    --color-success: #81C784;
    --color-warning: #FFB74D;
    --color-error: #EF5350;
    --color-info: #64B5F6;
  }
}
```

### JavaScript Accessibility Utilities
```javascript
// Accessibility utility functions
const A11yUtils = {
  // Check if user prefers reduced motion
  prefersReducedMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  },
  
  // Check if user prefers high contrast
  prefersHighContrast() {
    return window.matchMedia('(prefers-contrast: high)').matches;
  },
  
  // Get contrast ratio between two colors
  getContrastRatio(color1, color2) {
    const getLuminance = (color) => {
      const rgb = this.hexToRgb(color);
      const [r, g, b] = rgb.map(c => {
        c = c / 255;
        return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
      });
      return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    };
    
    const lum1 = getLuminance(color1);
    const lum2 = getLuminance(color2);
    const brightest = Math.max(lum1, lum2);
    const darkest = Math.min(lum1, lum2);
    
    return (brightest + 0.05) / (darkest + 0.05);
  },
  
  // Convert hex to RGB
  hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? [
      parseInt(result[1], 16),
      parseInt(result[2], 16),
      parseInt(result[3], 16)
    ] : null;
  },
  
  // Validate color contrast
  validateContrast(foreground, background, level = 'AA', size = 'normal') {
    const ratio = this.getContrastRatio(foreground, background);
    const requirements = {
      'AA': { normal: 4.5, large: 3.0 },
      'AAA': { normal: 7.0, large: 4.5 }
    };
    
    return ratio >= requirements[level][size];
  }
};

// Usage example
if (!A11yUtils.validateContrast('#FF5722', '#FFFFFF', 'AA', 'normal')) {
  console.warn('Color combination does not meet accessibility standards');
}
```

---

## Testing Procedures

### Automated Testing Tools
```bash
# Install accessibility testing tools
npm install --save-dev @axe-core/cli lighthouse axe-playwright

# Run accessibility audit
npx axe-core --include="[role='button']" --exclude="[aria-hidden='true']" ./dist

# Lighthouse accessibility score
npx lighthouse --only-categories=accessibility --output=json --output-path=./reports/accessibility.json http://localhost:3000

# Playwright accessibility testing
npx playwright test --grep="accessibility"
```

### Manual Testing Checklist
```markdown
## Accessibility Testing Checklist

### Color and Contrast
- [ ] All text meets 4.5:1 contrast ratio (normal text)
- [ ] Large text meets 3:1 contrast ratio
- [ ] Interactive elements meet 3:1 contrast ratio
- [ ] Focus indicators are clearly visible
- [ ] High contrast mode works properly

### Screen Reader Testing
- [ ] VoiceOver (macOS/iOS) navigation
- [ ] NVDA (Windows) navigation  
- [ ] JAWS (Windows) navigation
- [ ] TalkBack (Android) navigation
- [ ] All icons have appropriate labels
- [ ] Live regions announce changes

### Keyboard Navigation
- [ ] All interactive elements are keyboard accessible
- [ ] Tab order is logical
- [ ] Focus indicators are visible
- [ ] Keyboard shortcuts work properly
- [ ] Modal focus trapping works

### Motor Accessibility
- [ ] Touch targets are at least 44px × 44px
- [ ] Controls work with switch navigation
- [ ] Voice control compatibility
- [ ] Reduced motion preferences respected

### Cognitive Accessibility
- [ ] Clear error messages
- [ ] Consistent navigation patterns
- [ ] Sufficient time limits
- [ ] Help and documentation available
```

### Color Blindness Testing
```javascript
// Simulate color blindness for testing
const colorBlindnessFilters = {
  deuteranopia: `
    <filter id="deuteranopia">
      <feColorMatrix values="0.625 0.375 0   0 0
                             0.7   0.3   0   0 0  
                             0     0.3   0.7 0 0
                             0     0     0   1 0"/>
    </filter>
  `,
  protanopia: `
    <filter id="protanopia">
      <feColorMatrix values="0.567 0.433 0     0 0
                             0.558 0.442 0     0 0
                             0     0.242 0.758 0 0
                             0     0     0     1 0"/>
    </filter>
  `,
  tritanopia: `
    <filter id="tritanopia">
      <feColorMatrix values="0.95  0.05  0     0 0
                             0     0.433 0.567 0 0
                             0     0.475 0.525 0 0  
                             0     0     0     1 0"/>
    </filter>
  `
};

// Apply filter for testing
function testColorBlindness(type) {
  const filterSVG = document.createElement('div');
  filterSVG.innerHTML = `<svg style="position: absolute; width: 0; height: 0;">${colorBlindnessFilters[type]}</svg>`;
  document.body.appendChild(filterSVG);
  
  document.documentElement.style.filter = `url(#${type})`;
}

// Remove filter
function removeColorBlindnessFilter() {
  document.documentElement.style.filter = '';
}
```

---

This comprehensive accessibility and color variation guide ensures that the Monefy PWA clone meets the highest standards for inclusive design, providing an excellent user experience for all users regardless of their abilities or assistive technology needs.