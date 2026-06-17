---
name: Feline Finance
colors:
  surface: '#fff8f6'
  surface-dim: '#fbd1c4'
  surface-bright: '#fff8f6'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#fff1ed'
  surface-container: '#ffe9e3'
  surface-container-high: '#ffe2da'
  surface-container-highest: '#ffdbd0'
  on-surface: '#2c160e'
  on-surface-variant: '#564337'
  inverse-surface: '#442a22'
  inverse-on-surface: '#ffede8'
  outline: '#897365'
  outline-variant: '#dcc1b1'
  surface-tint: '#944a00'
  primary: '#944a00'
  on-primary: '#ffffff'
  primary-container: '#e67e22'
  on-primary-container: '#502600'
  inverse-primary: '#ffb783'
  secondary: '#645d56'
  on-secondary: '#ffffff'
  secondary-container: '#e8ded5'
  on-secondary-container: '#69615a'
  tertiary: '#615e5b'
  on-tertiary: '#ffffff'
  tertiary-container: '#9c9895'
  on-tertiary-container: '#33312e'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffdcc5'
  primary-fixed-dim: '#ffb783'
  on-primary-fixed: '#301400'
  on-primary-fixed-variant: '#713700'
  secondary-fixed: '#ebe1d8'
  secondary-fixed-dim: '#cfc5bc'
  on-secondary-fixed: '#1f1b16'
  on-secondary-fixed-variant: '#4c463f'
  tertiary-fixed: '#e7e1de'
  tertiary-fixed-dim: '#cbc5c2'
  on-tertiary-fixed: '#1d1b19'
  on-tertiary-fixed-variant: '#494644'
  background: '#fff8f6'
  on-background: '#2c160e'
  surface-variant: '#ffdbd0'
typography:
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
  headline-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Quicksand
    fontSize: 18px
    fontWeight: '500'
    lineHeight: 28px
  body-md:
    fontFamily: Quicksand
    fontSize: 16px
    fontWeight: '500'
    lineHeight: 24px
  body-sm:
    fontFamily: Quicksand
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-lg:
    fontFamily: Quicksand
    fontSize: 14px
    fontWeight: '700'
    lineHeight: 20px
    letterSpacing: 0.05em
  label-sm:
    fontFamily: Quicksand
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
  headline-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 36px
rounded:
  sm: 0.5rem
  DEFAULT: 1rem
  md: 1.5rem
  lg: 2rem
  xl: 3rem
  full: 9999px
spacing:
  base: 8px
  xs: 4px
  sm: 12px
  md: 20px
  lg: 32px
  xl: 48px
  margin-mobile: 20px
  gutter-mobile: 16px
---

## Brand & Style

This design system is built upon the Japanese "Iyashikei" (healing) philosophy, transforming the often-stressful task of bookkeeping into a moment of calm and comfort. The brand personality is empathetic, gentle, and reliable, acting as a supportive companion rather than a rigid tool.

The visual style blends **Minimalism** with **Tactile/Skeuomorphic** touches. It utilizes generous whitespace and a "soft-UI" approach to create a sense of physical softness, evoking the feeling of a cozy home. The interface should feel "squishy" and approachable, using large radii and gentle transitions to ensure the user feels safe and relaxed while managing their finances.

## Colors

The palette is inspired by natural earth tones and sun-drenched interiors. 

**Light Mode:**
- **Primary:** Warm Terracotta (#E67E22) – used for actions and paws.
- **Secondary:** Gentle Sand (#FDF2E9) – used for card backgrounds and secondary containers.
- **Background:** Soft Cream (#FFF9F5) – the primary canvas for the app.
- **Text:** Soft Brown (#5D4037) – provides high legibility without the harshness of pure black.

**Dark Mode:**
- **Primary:** Muted Amber (#D35400) – adjusted for lower light environments.
- **Background:** Deep Navy-Charcoal (#2C3E50) – provides a night-time comfort feel.
- **Secondary:** Deep Sand (#34495E) – for surface elevation.
- **Text:** Soft Warm Grey (#D5D8DC) – to maintain the "healing" softness in the dark.

## Typography

The typography strategy prioritizes friendliness and legibility. **Plus Jakarta Sans** is used for headings to provide a modern, rounded structure that feels optimistic. **Quicksand** is used for body copy and labels; its naturally rounded terminals reinforce the "cat-like" soft aesthetic across all data-heavy views.

Use `headline-lg-mobile` for main dashboard headers on small devices to ensure the text remains inviting and readable without overwhelming the "healing" layout.

## Layout & Spacing

The layout follows a **Fluid Grid** model with generous margins to prevent the UI from feeling cramped. A "safe-and-airy" approach is preferred over information density.

- **Mobile:** 1-column or 2-column card layouts with 20px side margins.
- **Vertical Rhythm:** Use the `md` (20px) spacing unit for vertical gaps between cards to maintain a breathable interface.
- **Padding:** Internal card padding should be a minimum of `md` (20px) to ensure content doesn't touch the very rounded edges of the containers.

## Elevation & Depth

Depth is achieved through **Ambient Shadows** and **Tonal Layers**. Avoid harsh, dark shadows. 

- **Surface Level 1 (Background):** Cream color, flat.
- **Surface Level 2 (Cards):** Sand Beige with a very soft, diffused shadow (`blur: 20px, y: 4, opacity: 0.08, color: #5D4037`).
- **Surface Level 3 (FABs/Modals):** Primary color or Cream with a more pronounced, "floating" shadow (`blur: 30px, y: 10, opacity: 0.12`).
- **Active States:** Elements should "press down" into the surface when tapped, reducing the shadow and slightly scaling down (98%).

## Shapes

The shape language is extremely organic and rounded. 
- **Standard Cards:** Use `rounded-xl` (1.5rem / 24px) to create a soft, pillowy appearance.
- **Buttons and Inputs:** Use `rounded-full` (pill-shaped) to maximize the friendly, approachable feel.
- **Icons:** Use icons with rounded caps and joins. Incorporate subtle cat-ear or paw motifs into custom icon shapes where appropriate.

## Components

### Buttons
Primary buttons are pill-shaped, using the Terracotta Orange background with white or cream text. Use a slight bounce animation on hover/press to evoke a tactile, playful response.

### Cards
Cards are the primary containers for data. They feature a Gentle Sand background with no border, relying on the soft ambient shadow for definition. Headers within cards should use the Soft Brown text color.

### Floating Action Button (FAB)
The FAB for adding new records should be a large, circular button featuring a stylized paw print icon. It sits in the bottom right with a "Level 3" elevation.

### Progress Bars
"Cat-tail" progress bars: The bar itself is thick and rounded. The progress indicator should have a rounded tip, resembling a cat's tail. Use warm gradients (Terracotta to Peach) for the filled state.

### Input Fields
Inputs are pill-shaped with a Soft Cream background and a subtle Sand Beige border. On focus, the border thickens slightly and changes to Terracotta.

### Lists
Lists should be presented as a series of separate soft-cards rather than a single continuous list with dividers, maintaining the "Iyashikei" airy feel.