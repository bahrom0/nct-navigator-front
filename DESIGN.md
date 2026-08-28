# Recommendations card layout

## Reference and scope

- Visual references: `C:\Users\bahro\AppData\Local\Temp\codex-clipboard-89c7b870-a771-43dd-acf9-b0725751b548.png`, `C:\Users\bahro\AppData\Local\Temp\codex-clipboard-859d41ec-9c6d-4ab4-8671-8b06205e459e.png`, and `C:\Users\bahro\AppData\Local\Temp\codex-clipboard-5534d4ab-c3c5-4093-8095-7d25d6d3d93b.png`.
- Route: `/recommendations`; detail route: `/explain`.
- Intent: keep recommendation cards equal-sized and scannable. The supplied image is a mobile visual reference; desktop behavior is governed by the existing fixed-card rule.

## Card rules

- Desktop (`min-width: 1024px`): recommendation cards use a fixed `46rem` height.
- Detail/compact cards use `height: auto` and are not forced to the recommendation grid height.
- Card radius: `24px`; card content padding: `24px`; border: `1px solid var(--marketing-border)`.
- Existing surface, shadow, rank, relation badge, and primary accent (`#315fca`) remain unchanged.
- The recommendation card keeps only stable identity data, the three highest-scoring interest matches, competition/risk, the AI selection reasoning, bookmark, details, and goal actions.
- Interest coverage is sorted by percentage without mutating the source data. When more than three interests exist, the remaining matches are represented by a bottom fade/blur affordance and are available in the full details section.
- Full variable context—evidence, limitations, matched keywords, and the complete interest list—belongs to `/explain`; the AI selection reasoning is also previewed inline on the recommendation card.

## Interest coverage disclosure

- The compact block renders at most `3` interests, ordered by descending score; equal scores retain source order.
- Evidence text is deliberately omitted from the compact block to keep row height stable.
- If rows are hidden, `.navigator-interest-coverage-fade` is `4.5rem` high, uses a transparent-to-card `linear-gradient`, `backdrop-filter: blur(2px)`, and a centered `2.3rem` circular CTA with the existing marketing CTA gradient.
- The CTA routes to `/explain?code=...&section=coverage`; the detail screen scrolls to `#interest-coverage-details` and renders every interest, percentage, and evidence item.

## AI reasoning disclosure

- The `reasoning` returned with each ranked recommendation is rendered directly below the competition block under `Почему выбрано`.
- The collapsed copy uses `3` lines (`4.5rem` at `1.5rem` line-height). Overflow is detected from the rendered text with `ResizeObserver`, so the behavior follows actual desktop/mobile wrapping.
- Long copy receives a `3rem` transparent-to-card gradient with `2.5px` backdrop blur and a centered `1.9rem` arrow button; there is no hard clipping panel or opaque overlay.
- Clicking the arrow expands the same card in place, keeps the user on `/recommendations`, and changes the desktop card from fixed `46rem` height to `auto` with a `46rem` minimum. A compact collapse control appears after the full copy.

## Responsive behavior

- Below `1024px`, cards return to natural height so content can reflow.
- Below `640px`, action buttons may wrap; no horizontal overflow should be introduced.
- `/explain` owns the full variable-height information blocks after the compact card.

## Interaction and accessibility

- Existing hover/tap motion remains restrained: card hover uses the existing spring and the CSS surface transition is `220ms`.
- Cluster exam tooltip and existing focus-visible button behavior are preserved.
- The global `prefers-reduced-motion: reduce` rule reduces transitions and animations to near-zero duration.
- Details remain reachable through the existing keyboard-accessible `Подробнее` action; moving content does not remove evidence or limitations.
- The coverage CTA is a real button with an explicit accessible label, title, visible focus ring, and smooth scroll fallback; reduced-motion uses the global `prefers-reduced-motion` override.
- The reasoning disclosure uses real buttons with `aria-expanded`, accessible labels, visible focus rings, and remains usable on narrow screens; reduced-motion uses the global `prefers-reduced-motion` override.

## Intentional deviation

The screenshots contain long evidence rows and a partially obscured lower coverage area inside the card. This implementation keeps the same visual cue with a restrained fade/blur and arrow, while moving lower-scoring interests and their evidence to `/explain` so recommendation cards remain equal-sized and comparable.
