# UI/UX Refactor — Warm Minimal Design

**Date:** 2026-06-14
**Status:** Approved
**Direction:** Warm Minimal — stone/cream neutrals with teal accent, mobile-first

---

## 1. Color System

All colors defined as CSS custom properties in `globals.css`.

| Token | Value | Usage |
|---|---|---|
| `--bg` | `#fafaf9` | Page background (warm off-white) |
| `--bg-card` | `#ffffff` | Card/row backgrounds |
| `--bg-muted` | `#f5f4f2` | Alternating rows, input backgrounds |
| `--border` | `#e7e5e4` | Card borders, dividers |
| `--border-strong` | `#d6d3d1` | Input borders, focused inputs |
| `--text-primary` | `#1c1917` | Headings, amounts, primary text |
| `--text-secondary` | `#57534e` | Labels, secondary text |
| `--text-muted` | `#a8a29e` | Timestamps, placeholders, hints |
| `--accent` | `#0f766e` | Primary CTA, active nav, links |
| `--accent-hover` | `#0d9488` | Hover state for accent |
| `--danger` | `#dc2626` | Delete actions |
| `--danger-hover` | `#b91c1c` | Delete hover state |

### Tailwind v4 Integration

Map CSS variables to Tailwind tokens via `@theme inline`:

```css
@theme inline {
  --color-bg: var(--bg);
  --color-bg-card: var(--bg-card);
  --color-bg-muted: var(--bg-muted);
  --color-border: var(--border);
  --color-border-strong: var(--border-strong);
  --color-text-primary: var(--text-primary);
  --color-text-secondary: var(--text-secondary);
  --color-text-muted: var(--text-muted);
  --color-accent: var(--accent);
  --color-accent-hover: var(--accent-hover);
  --color-danger: var(--danger);
  --color-danger-hover: var(--danger-hover);
}
```

---

## 2. Typography

**Fonts:** Instrument Sans (UI text) + Instrument Serif (page title)

Loaded via `next/font/google`:

```tsx
import { Instrument_Sans, Instrument_Serif } from "next/font/google";

const instrumentSans = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-instrument-sans",
  display: "swap",
});

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-instrument-serif",
  display: "swap",
});
```

- **Page title:** Instrument Serif, ~20px, `--text-primary`
- **Headings:** Instrument Sans, semibold, `--text-primary`
- **Body/labels:** Instrument Sans, regular, `--text-secondary`
- **Amounts:** Instrument Sans, bold, `--text-primary`
- **Muted text:** Instrument Sans, regular, `--text-muted`

---

## 3. Border Radius Scale

| Token | Value | Usage |
|---|---|---|
| `--radius-sm` | `6px` | Chips, small badges |
| `--radius-md` | `8px` | Inputs, small buttons |
| `--radius-lg` | `10px` | Cards, modals, primary buttons |
| `--radius-xl` | `12px` | Large cards, panels |
| `--radius-full` | `9999px` | Pills, avatars |

---

## 4. Spacing & Layout

- **Content max-width:** `max-w-2xl` (~672px) centered
- **Page padding:** `px-4` on mobile, `px-6` on tablet+
- **Card padding:** `p-4` (16px)
- **Row gap:** `gap-2` (8px) between payment rows
- **Section gap:** `gap-4` (16px) between major sections

---

## 5. Payments Listing Page

### Header
- Page title ("Payments") in Instrument Serif, left-aligned
- Record count in muted text on the same line
- Avatar button (top right) — user initials on a muted circle
- Summarize icon button (top right, next to avatar)

### Filter Chips
- When filters are active, show dismissible chips below the header
- Each chip: muted background, `--text-secondary` text, ✕ to remove
- "Clear all" link in `--accent` color when 1+ filters active
- Filter icon button opens bottom sheet

### Filter Bottom Sheet
- Slides up from bottom on mobile
- Fields: Person dropdown, Min/Max amount, Date range (From/To)
- "Apply" teal button, "Cancel" ghost button
- Same warm minimal styling as the rest of the app

### Payment Rows (Zebra)
- Alternating `--bg-card` / `--bg-muted` backgrounds
- Left: decorative dot (muted color) + Name (bold) + Description · Date (muted)
- Right: Amount in bold
- Row height: comfortable touch target (~48px minimum)
- Border radius: `--radius-lg` per row
- No borders between rows — rely on alternating backgrounds

### Bottom Action
- Full-width teal button: "+ Add Payment"
- Fixed at bottom or inline at end of list (desktop: inline, mobile: fixed)

### Pagination
- Page info text (muted), prev/next buttons
- Current page highlighted with accent background

---

## 6. Add/Edit Payment Modal

### Layout: Stepped / Sectioned
- **Section 1 — "Who paid?"**: Toggle pills for each person. Selected pill uses accent background + white text. Others use muted background.
- **Section 2 — "How much?"**: Amount input (× 1000 VND) with live formatted preview below in accent color showing "= X,XXX VND"
- **Section 3 — "Details"**: Description textarea (optional) + Payment date datetime-local input

### Buttons
- Cancel: ghost style (`--bg-muted` background, `--text-secondary` text)
- Save: teal filled (`--accent` background, white text)
- Close (✕) button in top right corner

### Modal Container
- Background: `--bg-card`
- Border: 1px `--border`
- Border radius: `--radius-xl`
- Padding: `p-5`
- Max width: `max-w-md`
- Backdrop: semi-transparent warm overlay (`bg-stone-900/20 backdrop-blur-sm`)

---

## 7. Delete Confirmation Modal

- Compact modal (`max-w-sm`)
- Shows: Person name + Amount summary
- Cancel (ghost) + Delete (danger red) buttons
- Same modal container styling as Add/Edit modal

---

## 8. Summarize Modal

- Period selector: Month dropdown + Year input at the top
- Total Spent card: large amount display
- Per Person card: individual totals
- Spending Breakdown table: Person / Paid / Diff (green/red coloring)
- Transfer Summary table: who pays whom
- Loading and error states with appropriate styling

---

## 9. Navigation

### Bottom Tab Bar
- 3 tabs: Payments (⊞), Summary (⊟), Profile (☺)
- Active tab: accent color icon + label
- Inactive: muted color
- Fixed at bottom of viewport
- Safe area padding for iOS home indicator

### User Avatar Menu
- Moves from top-right header to Profile tab
- Avatar circle with user initials
- Dropdown: Sign Out option

---

## 10. Component Inventory

### Button — Primary
- Background: `--accent`, text: white
- Hover: `--accent-hover`
- Border radius: `--radius-lg`
- Height: 44px (touch-friendly)
- Font: Instrument Sans, semibold

### Button — Ghost
- Background: `--bg-muted`, text: `--text-secondary`
- Hover: `--border` background
- Border radius: `--radius-lg`
- Height: 44px

### Button — Danger
- Background: `--danger`, text: white
- Hover: `--danger-hover`
- Same dimensions as Primary

### Input / Select / Textarea
- Background: `--bg-muted`
- Border: 1px `--border-strong`
- Border radius: `--radius-md`
- Focus: ring 2px `--accent`
- Padding: `py-2.5 px-3`
- Font: Instrument Sans, 13px

### Modal
- Background: `--bg-card`
- Border: 1px `--border`
- Border radius: `--radius-xl`
- Backdrop: `bg-stone-900/20 backdrop-blur-sm`

### Chip (Filter)
- Background: `--bg-muted`
- Text: `--text-secondary`
- Border radius: `--radius-full`
- Padding: `py-1 px-3`
- Font: 11px, semibold

### Payment Row
- Border radius: `--radius-lg`
- Padding: `p-3.5`
- Min height: 48px
- Flex layout: dot + content (flex-1) + amount

---

## 11. Responsive Strategy

- **Mobile (< 640px):** Single column, zebra rows, bottom tab bar, bottom-fixed Add button
- **Tablet (640px+):** Slightly wider content, same layout
- **Desktop (1024px+):** Centered content at `max-w-2xl`, comfortable reading width

---

## 12. Implementation Notes

1. Replace all `slate-*` color references with the new warm minimal tokens
2. Replace Geist Sans/Mono with Instrument Sans + Instrument Serif
3. Replace dark slate backgrounds (`bg-slate-900`, `bg-slate-800`) with warm equivalents
4. Extract reusable button/input/modal styles into shared CSS classes or a `globals.css` base
5. The `globals.css` becomes the design token file — add all tokens there
6. Consider creating a `src/components/ui/` directory for base components (Button, Input, Modal base)
7. The bottom tab bar should be a layout-level component in `layout.tsx`
8. Filter bottom sheet can reuse the Modal component with a different max-width and slide-up animation
