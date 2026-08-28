# Recommendations card layout

## Reference and scope

- Visual reference: `C:\Users\bahro\AppData\Local\Temp\codex-clipboard-89c7b870-a771-43dd-acf9-b0725751b548.png`.
- Route: `/recommendations`; detail route: `/explain`.
- Intent: keep recommendation cards equal-sized and scannable. The supplied image is a mobile visual reference; desktop behavior is governed by the existing fixed-card rule.

## Card rules

- Desktop (`min-width: 1024px`): recommendation cards use a fixed `46rem` height.
- Detail/compact cards use `height: auto` and are not forced to the recommendation grid height.
- Card radius: `24px`; card content padding: `24px`; border: `1px solid var(--marketing-border)`.
- Existing surface, shadow, rank, relation badge, and primary accent (`#315fca`) remain unchanged.
- The recommendation card keeps only stable identity data, interest coverage, competition/risk, bookmark, details, and goal actions.
- Variable content—description, career labels, factual evidence, limitations, and matched keywords—belongs to `/explain`.

## Responsive behavior

- Below `1024px`, cards return to natural height so content can reflow.
- Below `640px`, action buttons may wrap; no horizontal overflow should be introduced.
- `/explain` owns the full variable-height information blocks after the compact card.

## Interaction and accessibility

- Existing hover/tap motion remains restrained: card hover uses the existing spring and the CSS surface transition is `220ms`.
- Cluster exam tooltip and existing focus-visible button behavior are preserved.
- The global `prefers-reduced-motion: reduce` rule reduces transitions and animations to near-zero duration.
- Details remain reachable through the existing keyboard-accessible `Подробнее` action; moving content does not remove evidence or limitations.

## Intentional deviation

The screenshot contains a long limitations block inside the card. This implementation intentionally moves that block, the explanation, and evidence to `/explain` so recommendation cards remain equal-sized and comparable.
