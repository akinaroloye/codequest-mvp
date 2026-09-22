# Design System — CodeQuest

## Design Direction: Precision

CodeQuest redesigned around one word: **Precision**. The feeling that every pixel was considered, every interaction is immediate, every piece of information is exactly where you expect it. This is the quality signal of developer tools like Linear, Vercel, and GitHub — not the exuberance of mobile games or the flash of fintech.

Reference: Linear (layout discipline), Duolingo (gamification restraint), GitHub (developer semantics), Apple HIG (touch targets, typography, motion).

---

## Color System

### Surfaces (layered from dark to light)
| Token | Value | Usage |
|---|---|---|
| `bg` | `#0C0C0F` | App background |
| `surface` | `#131316` | Cards, panels |
| `surfaceHigh` | `#1C1C21` | Elevated cards, inputs |
| `overlay` | `#28282F` | Selected states, hover |

### Borders
| Token | Value | Usage |
|---|---|---|
| `border` | `#222228` | Default separators |
| `borderStrong` | `#34343C` | Emphasised borders |

### Text
| Token | Value | Usage |
|---|---|---|
| `text` | `#F2F2F7` | Primary content |
| `textSub` | `#8E8E93` | Secondary labels, metadata |
| `textMuted` | `#48484F` | Placeholder, disabled |

### Interactive — Indigo
Replaces amber. Indigo reads as intellectual, creative, developer-focused. Used only on interactive elements — buttons, active states, selected indicators.

| Token | Value | Usage |
|---|---|---|
| `accent` | `#7C7CFF` | CTAs, active states |
| `accentSub` | `rgba(124,124,255,0.1)` | Tinted backgrounds |

### Semantic
| Token | Value | Usage |
|---|---|---|
| `success` | `#30D158` | Correct, XP gain |
| `successSub` | `rgba(48,209,88,0.1)` | Success tints |
| `warning` | `#FF9F0A` | Streak ONLY |
| `warningSub` | `rgba(255,159,10,0.1)` | Streak tints |
| `error` | `#FF453A` | Wrong, hearts |
| `errorSub` | `rgba(255,69,58,0.1)` | Error tints |

### Gamification (contextual only)
| Token | Value | Meaning |
|---|---|---|
| `xp` | `#30D158` | Experience points |
| `streak` | `#FF9F0A` | Daily streak fire |
| `gem` | `#BF5AF2` | Premium currency |
| `heart` | `#FF453A` | Lives |

---

## Typography

System font (SF Pro on iOS, Roboto on Android). Code surfaces use Menlo.

### Scale
| Name | Size | Weight | Usage |
|---|---|---|---|
| `hero` | 34px | 700 | Screen titles |
| `title` | 24px | 700 | Section headings |
| `h3` | 20px | 600 | Card titles |
| `body` | 15px | 400 | Body text |
| `bodyMed` | 15px | 500 | Emphasised body |
| `label` | 13px | 500 | Labels, metadata |
| `caption` | 11px | 500 | Tags, badges |

### Code font
Menlo on iOS (native), monospace on Android.

---

## Spacing (4px grid)

```
xs:  4px   — inline gaps, icon padding
sm:  8px   — tight component gaps
md:  12px  — card internal padding top/bottom
base: 16px — standard horizontal padding, card gaps
lg:  20px  — section gaps
xl:  24px  — section padding
2xl: 32px  — between major sections
3xl: 48px  — screen top padding
```

---

## Radius

| Name | Value | Usage |
|---|---|---|
| `xs` | 4px | Badges, tiny chips |
| `sm` | 8px | Inputs, secondary cards |
| `md` | 12px | Standard cards |
| `lg` | 16px | Primary cards, modals |
| `pill` | 999px | Pills, badges |

---

## Component Rules

### Cards
- Use `surface` background. No border by default.
- Add `border` only when there is a semantic reason (selected, error).
- No shadow on cards — use surface elevation (background lightness) instead.
- Exception: the daily challenge card gets a subtle `accent` left border (3px) to signal uniqueness.

### Buttons
- Primary: filled `accent` background, dark text, `radius.md`
- Secondary: `surfaceHigh` background, `text` color
- Destructive: `errorSub` background, `error` text
- No gradients on buttons.

### Section Headers
- Plain `textSub` color, `label` size, `semibold` weight
- NO letterSpacing, NO uppercase — these are the most common AI-design signals
- Simple left-aligned label, no decorative treatment

### Gamification Elements
- Streak: orange dot + number, not a boxed emoji
- XP: green number, shown in context of progress bar
- Hearts: single heart icon + count ("❤ 4"), not a repeated emoji grid
- Level: inline text label, not a badge

### Icons
Ionicons throughout. Outline variant for inactive, filled for active/selected.

---

## Motion Principles

**Use motion to confirm, not to decorate.**

- Card press: `scale(0.97)` + opacity `0.85`, 100ms ease
- Submit: 200ms fade, no bounce
- XP bar: spring animation on mount/change (already implemented, keep)
- Result screen: simple fade-in sequence, no confetti
- Timer warning: color change at 30s, no animation
- Avoid: shake on wrong answer (replaced with border flash), bounce effects, slide-in carousels
