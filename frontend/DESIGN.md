# Design Brief: AgentHire

## Purpose & Context
AI-powered freelancer marketplace for modern hiring. Premium SaaS experience inspired by Stripe, Upwork, Linear. Builds trust through clean, professional design.

## Tone & Aesthetic
Minimal tech, premium, trustworthy. Not brutalist. Not maximalist. Clear hierarchy, purposeful surfaces, refined interactions. Lean toward restraint — productivity tool, not showcase.

## Color Palette

| Token | Light OKLCH | Dark OKLCH | Usage |
|-------|-----------|---------|-------|
| Primary | 0.45 0.15 250 | 0.72 0.15 250 | Main CTAs, navigation, trust |
| Accent | 0.62 0.20 28 | 0.70 0.20 28 | Secondary CTAs, highlights, warmth |
| Destructive | 0.55 0.22 25 | 0.65 0.19 22 | Errors, delete, warnings |
| Background | 0.98 0 0 | 0.12 0 0 | Page canvas |
| Card | 1.0 0 0 | 0.17 0 0 | Elevated surfaces, forms, modals |
| Input | 0.95 0 0 | 0.22 0 0 | Input fields, interactive zones |
| Border | 0.90 0 0 | 0.25 0 0 | Subtle dividers, card edges |
| Muted | 0.93 0 0 | 0.20 0 0 | Disabled, secondary text |
| Foreground | 0.20 0 0 | 0.95 0 0 | Primary text |

## Typography

| Layer | Font | Size | Weight | Use |
|-------|------|------|--------|-----|
| Display | General Sans | 32-48px | 700 | Hero, section titles |
| Heading | General Sans | 24px | 600 | Card titles, page headers |
| Body | DM Sans | 14-16px | 400-500 | Body text, descriptions, labels |
| Caption | DM Sans | 12px | 400 | Helper text, timestamps, metadata |
| Mono | Geist Mono | 12-14px | 400 | Code, IDs, transaction data |

## Elevation & Depth

- **Background**: `bg-background` (flat, no border)
- **Card**: `bg-card` + `border-border` + `shadow-sm` (default hover: `shadow-md`)
- **Modal/Popover**: `bg-card` + `shadow-lg` (lifted above all)
- **Sidebar**: `bg-sidebar` + `border-r border-sidebar-border`
- **Header**: `bg-card` + `border-b border-border` (slight lift from content)

## Structural Zones

| Zone | Background | Border | Elevation | Notes |
|------|-----------|--------|-----------|-------|
| Header/Navbar | `bg-card` | `border-b border-border` | `shadow-sm` | Persistent, user avatar + theme toggle |
| Sidebar | `bg-sidebar` | `border-r border-sidebar-border` | None | Active state: `bg-sidebar-accent`, text: `text-sidebar-accent-foreground` |
| Main Content | `bg-background` | None | None | Page canvas, alternates with card sections |
| Card Section | `bg-card` | `border border-border` | `shadow-sm` | Every freelancer card, form section, modal |
| Footer | `bg-muted/40` | `border-t border-border` | None | Thin divider, low contrast text |

## Component Patterns

- **Buttons**: `btn-primary` (blue CTA), `btn-accent` (warm secondary), `btn-secondary` (muted). All have `hover:opacity-90` + `disabled:opacity-50`. Smooth transitions.
- **Forms**: `input-base` class for all inputs. Focus: `ring-2 ring-ring`. Placeholder: `placeholder-muted-foreground`.
- **Cards**: `.card-elevated` utility — hover shadow lift, smooth transition.
- **Navigation**: Sidebar + top navbar. Active nav items: bold text + `bg-sidebar-accent`.

## Motion & Interaction

- **Transitions**: All interactive elements use `transition-smooth` (0.3s cubic-bezier).
- **Page load**: Cards fade in staggered (100-200ms apart) via Motion library.
- **Button hover**: Opacity 0.9, shadow lift.
- **Focus states**: All inputs/buttons have visible `ring-2 ring-ring` focus ring.
- **Loading**: Button spinners, disabled state opacity 0.5.
- **Toast notifications**: Sonner library, slide-up animation, auto-dismiss.

## Responsive Breakpoints

- **Mobile**: `sm` (< 640px) — single column, full-width cards, collapsed sidebar.
- **Tablet**: `md` (640–1024px) — two-column grid for freelancers, sidebar toggle.
- **Desktop**: `lg` (> 1024px) — three-column grid, persistent sidebar.

## Dark Mode

Intentional dark palette: backgrounds darker (`0.12`), cards elevated (`0.17`), text brighter (`0.95`). Primary color brighter (`0.72`). All contrast maintained AA+.

## Spacing & Rhythm

- **Outer padding**: 1.5rem (24px)
- **Card internal**: 1rem (16px)
- **Between cards**: 1rem gap
- **Typography line height**: 1.5–1.6 for body, 1.2 for headings

## Signature Detail

Cards on hover lift via shadow; no color shift. Sidebar active states use accent background fill, not just text bold. Accent color (warm orange/tan) reserved for secondary CTAs and highlights — primary blue dominates. Consistent rounded corners (`rounded-lg` = 10px).

## Constraints

- No full-page gradients. No rainbow palettes. No bounce animations. No skew/rotation effects. No random opacity changes.
- All colors via CSS variables only. No arbitrary hex or RGB.
- Shadows consistent (3–4 levels: `shadow-sm`, `shadow-md`, `shadow-lg`, `shadow-elevated`).
- Typography fixed to 2 families (display + body). Mono for data only.

