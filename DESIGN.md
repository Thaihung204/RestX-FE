---
name: RestX
colors:
  # --- Core brand (overridden per tenant at runtime) ---
  primary: "#FF380B"
  on-primary: "#FFFFFF"

  # --- Light Mode Surfaces ---
  background: "#FFFFFF"
  surface: "#F9FAFB"
  surface-card: "#FFFFFF"
  on-surface: "#111111"
  on-surface-variant: "#737373"
  outline: "#E5E7EB"

  # --- Dark Mode Surfaces ---
  background-dark: "#0A0E14"
  surface-dark: "#1A1F2E"
  surface-card-dark: "#151A24"
  on-surface-dark: "#ECECEC"
  on-surface-variant-dark: "#A3A3A3"
  outline-dark: "#2A3040"

  # --- Semantic ---
  error: "#ff4d4f"
  on-error: "#FFFFFF"
  success: "#52c41a"
  on-success: "#FFFFFF"
  warning: "#faad14"
  on-warning: "#111111"

  # --- Accent ---
  gold: "#D4AF37"
  gold-bright: "#FDD835"

  # --- Functional (auto-derived from primary via color-mix) ---
  primary-soft: "color-mix(in srgb, {colors.primary}, transparent 85%)"
  primary-faint: "color-mix(in srgb, {colors.primary}, transparent 94%)"
  primary-glow: "color-mix(in srgb, {colors.primary}, transparent 72%)"
  primary-hover: "color-mix(in srgb, {colors.primary}, black 10%)"
  primary-tint: "color-mix(in srgb, {colors.primary}, white 35%)"

typography:
  display-lg:
    fontFamily: Inter
    fontSize: 36px
    fontWeight: "800"
    lineHeight: 44px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: "700"
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: "700"
    lineHeight: 28px
  title-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: "600"
    lineHeight: 24px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: "400"
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: "400"
    lineHeight: 20px
  body-sm:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: "400"
    lineHeight: 18px
  label-lg:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: "700"
    lineHeight: 20px
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: "600"
    lineHeight: 16px
    letterSpacing: 0.02em
  label-sm:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: "600"
    lineHeight: 14px
    letterSpacing: 0.04em
  caption:
    fontFamily: Inter
    fontSize: 10px
    fontWeight: "500"
    lineHeight: 12px

rounded:
  xs: 0.25rem
  sm: 0.5rem
  DEFAULT: 0.75rem
  md: 1rem
  lg: 1.25rem
  xl: 1.5rem
  full: 9999px

spacing:
  unit: 4px
  xs: 4px
  sm: 8px
  md: 12px
  lg: 16px
  xl: 24px
  2xl: 32px
  3xl: 48px
  section: 40px
  container-padding: 24px
  card-padding: 20px
  card-gap: 16px

components:
  # --- Cards ---
  card-standard:
    backgroundColor: "{colors.surface-card}"
    rounded: "{rounded.md}"
    padding: "{spacing.card-padding}"
    borderColor: "{colors.outline}"
    borderWidth: 1px
  card-glass:
    backgroundColor: "color-mix(in srgb, {colors.surface-card}, transparent 8%)"
    rounded: "{rounded.lg}"
    padding: "{spacing.xl}"
    borderColor: "{colors.outline}"
    borderWidth: 1px
  card-stat:
    backgroundColor: "{colors.surface-card}"
    rounded: "{rounded.md}"
    padding: "{spacing.card-padding}"
    borderColor: "{colors.outline}"
    borderWidth: 1px

  # --- Buttons ---
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.label-lg}"
    rounded: "{rounded.sm}"
    height: 40px
    padding: 0 20px
  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"
  button-text:
    backgroundColor: transparent
    textColor: "{colors.on-surface-variant}"
    typography: "{typography.label-md}"
    rounded: "{rounded.sm}"
    padding: 6px 12px
  button-text-hover:
    backgroundColor: "{colors.primary-faint}"
    textColor: "{colors.primary}"

  # --- Inputs ---
  input-field:
    backgroundColor: "{colors.surface-card}"
    textColor: "{colors.on-surface}"
    typography: "{typography.body-md}"
    rounded: "{rounded.DEFAULT}"
    padding: 8px 12px
    height: 40px
    borderColor: "{colors.outline}"
    borderWidth: 1px

  # --- Status Badges ---
  badge-active:
    backgroundColor: "color-mix(in srgb, {colors.success}, transparent 85%)"
    textColor: "{colors.success}"
    typography: "{typography.label-sm}"
    rounded: "{rounded.full}"
    padding: 2px 10px
  badge-danger:
    backgroundColor: "color-mix(in srgb, {colors.error}, transparent 85%)"
    textColor: "{colors.error}"
    typography: "{typography.label-sm}"
    rounded: "{rounded.full}"
    padding: 2px 10px
  badge-warning:
    backgroundColor: "color-mix(in srgb, {colors.warning}, transparent 85%)"
    textColor: "{colors.warning}"
    typography: "{typography.label-sm}"
    rounded: "{rounded.full}"
    padding: 2px 10px

  # --- Modal ---
  modal-overlay:
    backgroundColor: "color-mix(in srgb, black, transparent 60%)"
  modal-content:
    backgroundColor: "{colors.background}"
    rounded: "{rounded.lg}"
    borderColor: "{colors.outline}"
    borderWidth: 1px
    padding: 0

  # --- Chart Tooltip ---
  chart-tooltip:
    backgroundColor: "{colors.surface-card}"
    rounded: "{rounded.DEFAULT}"
    borderColor: "{colors.outline}"
    borderWidth: 1px
    padding: 10px 14px

  # --- KPI Card ---
  kpi-card:
    backgroundColor: "{colors.surface-card}"
    rounded: "{rounded.md}"
    padding: "{spacing.card-padding}"
    borderColor: "{colors.outline}"
    borderWidth: 1px
    accentHeight: 3px
---

## Brand & Style

RestX is a **multi-tenant restaurant management platform**. The design system must be fully theme-adaptive: every tenant can configure their own `--primary` brand color, and the entire UI recalculates from that single seed value using CSS `color-mix()`. The personality is **professional, clean, and data-dense** — built for restaurant operators who need to absorb information quickly without visual fatigue.

The design language follows a **Tonal Layering** approach rather than flat design. Surfaces stack at different luminance levels (background → surface → card) to create implicit hierarchy without heavy borders. In dark mode, surfaces shift to deep navy-charcoal tones, and the primary color brightens slightly via `color-mix(white)` to maintain contrast.

The emotional tone is **efficient and trustworthy** — a tool operators rely on during peak hours. Animations are kept under 300ms. Decorative elements are minimal; visual richness comes from the interplay of the tenant's brand color against neutral surfaces.

## Colors

The color architecture is **seed-based**. A single `--primary` hex value (default `#FF380B`, a warm vermilion) flows through `color-mix()` to generate an entire functional palette at runtime:

- **Primary Soft / Faint / Glow:** Increasingly transparent tints for backgrounds, hover states, and decorative glows. Generated via `color-mix(in srgb, primary, transparent N%)`.
- **Primary Hover:** Darkened 10% with black for pressed/hover states.
- **Primary Tint:** Lightened 35% with white for dark-mode text accents.

Surface colors follow a strict **three-tier model**:
1. **Background** — the page canvas (`#FFFFFF` light / `#0A0E14` dark).
2. **Surface** — content regions and sidebars (`#F9FAFB` / `#1A1F2E`).
3. **Card** — elevated containers (`#FFFFFF` / `#151A24`).

Semantic colors (error red, success green, warning amber) each generate their own `-soft` and `-border` variants via the same `color-mix()` pattern, ensuring consistency across all severity levels.

A premium **gold accent** (`#D4AF37`) is reserved for loyalty points and VIP indicators.

## Typography

The platform uses **Inter** as its sole typeface. Inter's large x-height and open apertures make it ideal for dense data tables and small-label dashboards viewed under varying lighting conditions.

- **Display / Headlines:** Used sparingly for dashboard hero sections and page titles. Weight 700–800 with negative letter-spacing for visual density.
- **Body:** 14px is the default body size, optimized for table cells and form labels. 16px is used for primary content paragraphs.
- **Labels:** 11–12px in weight 600 with slight letter-spacing (0.02–0.04em) for KPI cards, chart legends, and status badges.
- **Caption:** 10px for timestamps, secondary metadata, and chart axis labels.

Font smoothing is set to antialiased on all platforms to keep strokes thin and crisp against both light and dark backgrounds.

## Layout & Spacing

The layout follows a **sidebar + content** model for admin and staff views, and a **full-bleed card** model for customer-facing menu and reservation flows.

- **Base Unit:** 4px. All spacing values are multiples of 4px.
- **Card Padding:** 20px internally, with 16px gaps between sibling cards.
- **Section Margin:** 40px vertical separation between major dashboard sections.
- **Container Padding:** 24px on desktop, reducing to 16px on mobile.

Tables and data-dense views use compact `8px` vertical cell padding. Hero sections use generous `32–48px` padding to create breathing room.

The grid collapses responsively:
- **Desktop:** 4-column KPI grids, 2-column chart layouts.
- **Tablet:** 2-column KPIs, single-column charts.
- **Mobile:** Single-column everything with stacked cards.

## Elevation & Depth

Depth is expressed through **surface luminance shifts** and **soft ambient shadows** rather than harsh drop shadows.

- **Level 0 (Background):** Page canvas, no shadow.
- **Level 1 (Surface):** Subtle `4px` blur, `8%` opacity shadow. Used for sidebar, table wrappers.
- **Level 2 (Card):** `12px` blur, `12%` opacity. Standard stat cards and form panels.
- **Level 3 (Elevated):** `24px` blur, `12%` opacity. Dropdowns, modals, floating action panels.
- **Level 4 (Overlay):** `40px` blur, `15%` opacity. Full-screen modal overlays.

In dark mode, shadow opacity increases (30%→50%) because the dark background absorbs light, making subtle shadows invisible at lower opacities.

Glass effects (`backdrop-filter: blur`) are used selectively on hero banners and stat cards to create a frosted-glass overlay over background patterns. The glass background uses `color-mix(in srgb, card, transparent 8%)` — never fully opaque.

## Shapes

The shape language is **softly rounded** — approachable without being playful.

- **Cards & Containers:** `1rem` (16px) radius for standard cards. Hero sections and modals use `1.25rem` (20px).
- **Buttons:** `0.5rem` (8px) radius — structured and tappable, not pill-shaped.
- **Inputs:** `0.75rem` (12px) radius — slightly softer than buttons to distinguish interactive from editable.
- **Badges & Pills:** `9999px` (fully rounded) for status indicators, plan labels, and notification counts.
- **Chart Cards:** `1rem` radius to match standard cards but feel self-contained.
- **Avatar Initials:** `0.75rem` radius — squircle shape that distinguishes them from circular user photos.

### Cards & Stat Panels

Standard cards use a `1px` solid border in `--outline` color with no visible shadow at rest. On hover, a soft `4px 20px` shadow fades in alongside a `translateY(-2px)` micro-lift. KPI cards feature a `3px` colored accent bar at the top edge — the accent color indicates the metric category (primary for revenue, green for growth, orange for warnings).

### Buttons & Interactive Elements

Primary buttons are solid `--primary` fill with white text. Ghost/text buttons use transparent backgrounds with `--text-muted` color that shifts to `--primary` on hover with a faint `primary-faint` background fill. All transitions use `200–250ms ease` timing.

### Modals & Overlays

Modals use a `1.25rem` border-radius and sit on the `--background` surface (not `--card`) to create visual separation. The overlay is `black 40%` opacity. Modal headers feature a colored avatar squircle (initial letter on `--primary` background) alongside the title and subtitle.

### Data Visualization

Charts (Recharts-based) use the tenant's `--primary` color as the dominant data series stroke. Secondary series use orange (`#f97316`) for discounts or red (`#ef4444`) for cancellations. Grid lines and axis labels use `--border` and `--text-muted` respectively. Tooltips are themed cards with the `--card` background, `--border` border, and a diffused shadow — they never appear as plain white boxes.

Chart legends are custom-rendered below the chart area with small colored dots and `label-sm` typography, separated from the chart by a `1px --border` top border.

### Multi-Tenant Theming

The entire UI is driven by CSS custom properties. When a tenant loads, JavaScript injects their configured `--primary` color onto `:root`, and `color-mix()` automatically recalculates all derivative tokens (soft, faint, glow, hover, tint). Dark mode is toggled via `[data-theme="dark"]` attribute on the root element, which swaps surface/card/text/shadow values. No component uses hardcoded hex colors for primary brand elements — everything references `var(--primary)` or its derivatives.
