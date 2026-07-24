# Web-to-Mobile Screen Map

- Captured: 2026-07-16
- Source: current `src/app/**/page.tsx` routes

## Root mobile navigation

| Mobile destination | Current web sources | Source of truth |
|---|---|---|
| Home | `/dashboard`, selected profile summaries | Backend profile/goal/Coach state |
| Navigator | `/onboarding`, `/categories`, `/analyze`, `/recommendations`, `/interview` | Onboarding draft locally; recommendations/goal/interview on backend |
| Coach | `/coach`, selected `/plan` behavior | Backend goal, plan, roadmap, daily plan and messages |
| Community | `/chat` community surface | Backend user-chat routes and membership |
| Profile | `/dashboard/*`, profile drawer | Backend profile sync and canonical records |

## Progressive native stacks

### Navigator stack

```text
Navigator home
  -> Onboarding
  -> Interest categories
  -> Real analysis progress
  -> Recommendation list/detail
  -> Interview
  -> Plan result
  -> Coach
```

Current web routes:

- `/onboarding`
- `/categories`
- `/analyze`
- `/recommendations`
- `/interview`
- `/plan`
- `/explain`
- `/fit-score`
- `/strategy`

`explain`, `fit-score` and `strategy` should be supporting detail screens, not root tabs.

### Coach stack

- Coach overview
- Roadmap
- Daily plan/todos
- Diagnostic/mini-test
- Coach chat/history
- Task detail

Current web source: `/coach` and `src/components/coach/`.

### Profile stack

| Current route | Native placement |
|---|---|
| `/dashboard/plans` | Profile -> Plans |
| `/dashboard/bookmarks` | Profile -> Bookmarks |
| `/dashboard/interviews` | Profile -> Interviews |
| `/dashboard/history` | Profile -> History |
| `/dashboard/activity` | Profile -> Activity |
| `/dashboard/achievements` | Profile -> Achievements |

### Community stack

- Conversation list
- Conversation detail
- User profile/details
- Media picker/upload flow

Current web source: `/chat`, `src/components/user-chat/` and `src/lib/user-chat/`.

## Web-only for mobile MVP

- `/` landing page
- `/features`
- `/how-it-works`

These remain external web content. Do not copy the marketing shell into the native app.

## Secondary AI tool

`/teacher` becomes a secondary help tool reachable from Coach/Profile context. It is not a root mobile tab and must not create a parallel goal flow.

## Native-only system states

The mobile client also needs screens/states that do not map one-to-one to web pages:

- bootstrap/config error;
- offline/cached content;
- global maintenance;
- auth/deep-link return;
- permission education/denied settings;
- update-required state if introduced later.
