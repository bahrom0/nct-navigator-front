# NCT database Stage 1

Stage 1 creates immutable local snapshots, coordinate-derived PDF staging rows, and parser reports. It does not normalize Core data, write to Supabase, or modify product-facing legacy JSON files.

```powershell
npm.cmd run nct:stage1
```

To attempt official HTML snapshots as well:

```powershell
npm.cmd run nct:stage1 -- --fetch-html
```

If online sources are unavailable, their status and error are retained in `data/reports/ntc/source_inventory.json`, while local PDF processing continues.

## Stage 2

Stage 2 reads the immutable Stage 1 staging output and creates a draft Core, explicit reference dictionaries, field-level evidence, review queues, a Khujand report, a quality report, and comparison-only legacy reports.

```powershell
npm.cmd run nct:stage2
npm.cmd run nct:stage2:verify
```

The output is marked `draft_not_published`. Stage 2 does not update product JSON, publish an export, or connect to Supabase.

## Stage 3

Stage 3 publishes only clean Stage 2 rows into versioned local Core releases, JSON/CSV exports, search documents, and non-official derived taxonomy/profession mappings.

```powershell
npm.cmd run nct:stage3
npm.cmd run nct:stage3:verify
```

The server-only adapter is `src/lib/db/published-nct.ts`. It can load and search the published export and resolve source evidence, but the existing product search is intentionally not switched automatically. Supabase and application cutover remain Stage 4 work.
