# Design System (foundation)

Principles: premium, modern, minimal, accessible; no heavy animation or gradients; identical behaviour in RTL and LTR.

## Implemented
Tokens live in `app/globals.css` (Tailwind v4 `@theme`). Primitives in `components/ui/`: Button, Input, Select, Textarea, Label, Field, Card, Badge, Alert, Dialog, Table, Nav, Spinner and the loading / empty / error state components (`states.tsx`). Fonts: Geist (Latin) and Noto Sans Arabic (Arabic and Persian script).

## Rules
- Use logical properties (`ms-*`, `me-*`, `ps-*`, `pe-*`, `text-start`, `border-s`) instead of `left`/`right` so a component works in both directions.
- Text comes from `i18n/` through `t()`; no user-visible literals in components.
- Every control has a visible label, a focus ring and sufficient contrast (target WCAG 2.2 AA; not yet audited).
- Dialogs trap focus and close on Escape; verify this when changing `dialog.tsx`.

## Not done
- Existing pages (`app/**`) still use inline Tailwind classes instead of these primitives (only 2 files import `components/ui`).
- No accessibility audit, no visual regression tests, no dark-mode decision.
