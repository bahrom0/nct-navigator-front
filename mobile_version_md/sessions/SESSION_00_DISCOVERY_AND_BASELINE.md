# Session 00: Discovery and Baseline

## Goal

Freeze the current product/API behavior and mobile constraints before creating the native client.

## Preconditions

- Read all shared documents and the architecture skill.
- Confirm repository root, branch, worktree and dirty files.
- Do not edit production behavior in this session unless required to produce a safe diagnostic.

## Scope

- Inventory current web screens and map them to mobile destinations.
- Inventory backend endpoints by access type: public, guest, authenticated, admin, streaming and media.
- Trace auth, profile sync, recommendation stream, goal selection, interview, plan and Coach paths.
- Record actual request/response/error examples using local development inputs.
- Record current build commands and baseline results for web/backend.
- Decide provisional application identifiers, deep-link scheme and environment names.
- Identify target Android/iOS versions from product/device evidence; do not guess silently.

## Deliverables

- `mobile_version_md/artifacts/api-inventory.md`
- `mobile_version_md/artifacts/screen-map.md`
- `mobile_version_md/artifacts/baseline-results.md`
- initial entries in `91_DECISION_LOG.md`
- completed handoff

## Verification

- Existing web build passes or its exact pre-existing failure is recorded.
- Backend build passes or its exact pre-existing failure is recorded.
- At least one real request is exercised for health/maintenance, auth session, recommendation stream and protected profile/goal data.
- Each planned native screen has a known source of truth.

## Gate

Session 00 passes only when the API inventory and screen map are complete enough that Session 01 does not need to invent backend behavior.

## Do not

- Create mobile screens.
- Add a second API implementation.
- Change NCT data.
- Decide iOS/Android minimum versions without recording the evidence.
