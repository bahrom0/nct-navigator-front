# Mobile UX and Design System

## Goal

Create a touch-first application that preserves NCT Navigator semantics without copying the desktop shell into a smaller viewport.

## Navigation rules

- Use native stacks for progressive flows and a bottom tab bar for primary destinations.
- Tabs navigate between sections; they are not action buttons.
- Use a modal or bottom sheet for focused selection/confirmation, not for entire deep flows.
- Android hardware Back and iOS swipe-back must behave predictably.
- Deep links resolve to a valid authenticated/guest state before showing the target screen.
- Preserve drafts when users move backward or the app backgrounds.

## Root destinations

- Home
- Navigator
- Coach
- Community
- Profile

Do not place onboarding, interview or plan generation as permanent tabs. They are stack flows launched from Navigator/Home.

## Component rules

- Build reusable native primitives only after the second real use case is known.
- Use platform-backed controls and Pressable/TextInput/FlatList/SectionList.
- Avoid porting web cards pixel-for-pixel when a simpler mobile pattern communicates better.
- Keep primary actions reachable with one hand where reasonable.
- Do not rely on hover, title tooltips or tiny icon-only targets.
- Use safe areas and keyboard-aware layouts.
- Use native feedback: disabled, pressed, loading, success and failure states.

## Design tokens

Define a small typed token set:

- semantic colors for background/surface/text/border/accent/success/warning/error;
- typography roles rather than per-screen font sizes;
- spacing scale;
- radius scale;
- elevation/shadow conventions per platform;
- motion duration/easing with reduced-motion fallback.

Web and mobile may share product color intent, but mobile tokens must not import CSS variables.

## Loading and errors

- Use real backend stage events for AI progress.
- Show cached content with a stale/offline indicator when safe.
- Preserve user input after recoverable failures.
- A retry must not duplicate a goal, plan or message.
- Maintenance is a first-class global state with last-known read-only content only where policy allows.
- Skeletons should resemble the final mobile layout and not block accessibility focus indefinitely.

## Lists and performance

- Use virtualized lists for recommendations, roadmap items, messages, history and bookmarks.
- Provide stable keys and memoized row boundaries where measurements justify them.
- Do not render the entire NCT catalog or long chat history at once.
- Paginate from the server and preserve scroll position on prepend/reconnect.

## Accessibility

- Every interactive control has an accessible name and state.
- Support screen readers, font scaling and sufficient contrast.
- Do not lock text scaling globally.
- Provide non-color indicators for status.
- Respect reduced motion.
- Test focus order in modals, sheets, auth, onboarding and chat composer.

## Permissions

- Ask for camera/photos/notifications only after the user initiates the related action.
- Explain the benefit before the system prompt when context is not obvious.
- A denied permission must leave a usable fallback path.

## Platform adaptation

- Keep shared product behavior, but allow Android/iOS navigation, actions, share sheets and permission UX to feel native.
- Do not force exact visual parity where platform conventions differ.
- Verify compact and large screens, gesture navigation, cutouts and dynamic text.
