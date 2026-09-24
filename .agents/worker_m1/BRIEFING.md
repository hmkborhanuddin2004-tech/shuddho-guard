# BRIEFING — 2026-09-23T16:51:00Z

## Mission
Harden and complete the Shuddho Guard web extension (Milestone 1), including warning.html, popup.js linkage, background.js MV3 service worker, manifest.json background registration, extension/ directory mirroring, and verifying all unit tests pass.

## 🔒 My Identity
- Archetype: teamwork_preview_worker
- Roles: implementer, qa, specialist
- Working directory: c:/Users/assdi/Documents/Downloads/shuddho-guard/.agents/worker_m1
- Original parent: 8e00b7af-80d1-4af5-b5ab-2e3318bc770c
- Milestone: Milestone 1 (Web Extension & Trap Interceptor Hardening)

## 🔒 Key Constraints
- Exclusive Write Ownership: `web-extension/` (all files), `extension/` (all files), `.agents/worker_m1/`
- DO NOT touch any files outside these directories.
- DO NOT CHEAT. All implementations must be genuine.
- Test pass requirements: `node tools/test-banglish-filter.js` (7/7) and `node tools/test-trap-detector.js` (4/4).

## Current Parent
- Conversation ID: 8e00b7af-80d1-4af5-b5ab-2e3318bc770c
- Updated: not yet

## Task Summary
- **What to build**:
  1. `web-extension/pages/warning.html` - responsive Bengali warning UI for honey-traps with "Go Back to Safety" and "Report Trap" buttons.
  2. Link `<script src="popup.js"></script>` in `web-extension/popup/popup.html`.
  3. `web-extension/scripts/background.js` - MV3 service worker handling install, badges, periodic sync.
  4. Update `web-extension/manifest.json` with background service worker and MV3 settings.
  5. Mirror `web-extension/` to `extension/`.
  6. Verify unit tests pass.
- **Success criteria**:
  - All files in place and syntactically valid MV3.
  - Tests pass: 7/7 banglish filter, 4/4 trap detector.
- **Interface contracts**: PROJECT.md, ORIGINAL_REQUEST.md
- **Code layout**: `web-extension/` and `extension/`

## Key Decisions Made
- [TBD]

## Artifact Index
- `.agents/worker_m1/progress.md` — Liveness & task progress
- `.agents/worker_m1/handoff.md` — Final handoff report

## Change Tracker
- **Files modified**: None yet
- **Build status**: Not run yet
- **Pending issues**: None

## Quality Status
- **Build/test result**: Pending
- **Lint status**: Pending
- **Tests added/modified**: Pending

## Loaded Skills
- None
