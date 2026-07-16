# Universal Agent Rules

## Repository discipline

- Before changing code, inspect the current implementation and nearby patterns.
- Do not overwrite or revert user changes unless the user explicitly asks.
- Keep changes scoped to the requested task.
- Prefer small, reviewable files and staged implementation over one large rewrite.
- Preserve existing product semantics unless a plan explicitly changes them.
- When adding scripts or data pipelines, make them repeatable from a single command where practical.
- If a command depends on network access and fails, report the limitation clearly and continue with local inputs when possible.
- For this Windows workspace, prefer PowerShell-compatible commands. If `rg` fails, use `Get-ChildItem` and `Select-String`.

## Verification

- Run the most relevant local verification before declaring work complete.
- For application changes, prefer `npm.cmd run build` as the final gate when feasible.
- For data work, produce counts, quality reports, and examples of problematic rows.
- Do not claim a parser, import, API, or UI flow works until it has been exercised.

## Data integrity

- Do not invent missing data.
- Preserve original source values alongside normalized values.
- Keep source/provenance for every transformed record.
- Put ambiguous, incomplete, conflicting, or low-confidence records into a review report instead of silently publishing them.
- Do not merge records just because they look similar. Distinguish code, institution, campus, city, education level, form, type, language, year, and registration period.

## NCT database work

- Read `new_nct_db/00-stage-overview.md` before any new NCT database task.
- Read the current Stage file before implementing that Stage.
- Stage 1 must create Raw + Staging + parser reports only.
- Stage 2 handles normalization and quality reports.
- Stage 3 handles Core, Search, exports, and product-facing improvements.
- Stage 4 handles Supabase and application integration.
- Do not skip directly to Supabase.
- Do not change `src/data/new_db.json` or `src/data/nct-codes.json` unless the user explicitly asks for replacement after reports are reviewed.
- Treat `src/data/new_db.json` and `src/data/nct-codes.json` as legacy comparison inputs, not as sources of truth.
- Parse NCT PDF tables with coordinate-aware extraction. Plain text extraction may be used for diagnostics only.
- Keep `pdf/11_class_all.pdf` separate from the 2026-2027 full plan unless an official source confirms equivalence; it has been identified as a 2025 remaining-seats / fourth-period document.
- Keep local JSON/CSV exports as intermediate or fallback artifacts until the Supabase release is validated.

## Supabase work

- Use Supabase only when the requested Stage or task explicitly involves it.
- Before implementing Supabase changes, verify current Supabase docs/changelog as required by the Supabase skill.
- Use migrations for committed schema changes.
- Enable RLS for tables exposed through Supabase APIs.
- Public APIs must expose only published NCT releases/read models.
- Raw, Staging, draft releases, field evidence, and review queues must not be publicly readable unless a task explicitly designs admin access.

## Mobile application work

- Before any Android/iOS/mobile task, read `mobile_version_md/AGENTS.md` and follow its required reading order.
- Treat `mobile_version_md/` as the canonical mobile migration plan. Do not create a competing plan elsewhere.
- Implement only the current mobile session. Do not start a later session until the current session gate is verified and recorded.
- The mobile client must be native React Native UI, not a WebView or a packaged copy of the Next.js site.
- Preserve the canonical product flow and keep backend domain logic as the single source of truth.
