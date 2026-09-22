# UI Audit — CodeQuest MVP

## Summary
The current UI is functional but exhibits clear signals of developer-built / AI-generated design: excessive emoji usage in chrome, over-engineered color system with low semantic clarity, inconsistent visual weight, template-like section headers, and a gamification aesthetic that leans crypto/mobile-game rather than premium learning tool.

## Critical Issues

### Navigation
- Tab bar uses raw emoji (🏠🏆👤) as icons — the single fastest way to signal amateur design
- Tab labels do not align with actual content quality
- No active/inactive state differentiation beyond opacity

### Color System
- Amber `#F59E0B` as primary accent reads as "crypto fintech" or "mobile game gold"
- `colors.accentGlow` (`rgba(245, 158, 11, 0.18)`) creates muddy halos around cards
- No clear semantic mapping: same amber is used for streak, XP, interactive elements, and decorative purposes
- `colors.textMuted` at `#4B5563` is too close to `colors.textSecondary` — no meaningful hierarchy step
- `difficultyColor` is a visual explosion with 5 unrelated colors on the same screen

### Typography
- `letterSpacing: 1.2` + `textTransform: 'uppercase'` on section labels = template/AI-generated
- Weight hierarchy is flat: most text sits at 600–700, few elements use 400/500 for contrast
- `Courier New` is not the native iOS code font — `Menlo` is standard (SF Mono for premium)
- Hero/title font size (36px) jumps too aggressively from body (15px) — missing intermediate steps

### Component Design
- Every card combines `backgroundColor` + `borderWidth` + `borderColor` + `shadowColor` — triple redundancy
- `colors.accentGlow` borders on the daily challenge card communicate "highlighted" but feel garish
- ChallengeCard shows type pill + daily pill + completion checkmark + difficulty + language + XP — too much
- Hearts displayed as 5× ❤️ emoji with opacity fade — looks developer-built
- XPBar animation uses `useNativeDriver: false` correctly, but bar is 8px — too thick to feel refined

### Empty States
- HomeScreen: no empty state for practice list (just nothing)
- No skeleton loaders — content either exists or it doesn't, with only a spinner between
- LeaderboardScreen: "No players yet." — functional but unhelpful

### Gamification
- Streak badge has heavy border, shadow, padding — over-designed for what is essentially a number
- The fire emoji 🔥 changes color based on streak — confusing, most users won't notice
- XP display does not contextualise the number (how far to next level is buried)

### Spacing
- `spacing.md` (16px) is used for both internal card padding and section margins — no distinction
- Content areas pad at `spacing.md` (16px) but this is too tight for mobile home screens
- Gap between cards: `spacing.sm` (8px) — cramped, reduces breathing room

### Accessibility
- No `accessibilityLabel` on any pressable element
- Heart opacity `0.2` for empty hearts may fail WCAG contrast on some backgrounds
- Touch targets are adequate (44px+) but not verified on smallest screens

## What Makes It Feel Amateur
1. Emoji icons in system chrome (tabs, hearts, navigation)
2. `letterSpacing + uppercase` section headers — the single most common AI/template design pattern
3. Every surface has both border AND background AND shadow simultaneously
4. Amber accent is associated with fintech/crypto, not learning tools
5. The XP and gems numbers are displayed without formatting (no thousands separator)
6. The "daily challenge" card glows — real premium apps don't glow, they command attention through hierarchy
7. ChallengeCard has 6 separate visual elements competing for attention
