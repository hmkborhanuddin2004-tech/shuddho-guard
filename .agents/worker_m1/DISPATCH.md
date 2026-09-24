# Dispatch Assignment — Worker M1 (Extension & Trap Interceptor)

**Target**: Milestone 1 (Web Extension & Trap Interceptor Hardening)
**Input Files**:
- c:/Users/assdi/Documents/Downloads/shuddho-guard/.agents/ORIGINAL_REQUEST.md
- c:/Users/assdi/Documents/Downloads/shuddho-guard/.agents/PROJECT.md
- c:/Users/assdi/Documents/Downloads/shuddho-guard/.agents/survey_explorer_2/handoff.md
- c:/Users/assdi/Documents/Downloads/shuddho-guard/.agents/survey_miner_1/handoff.md

**Exclusive File Ownership**:
- `web-extension/` (all files)
- `extension/` (all files)

**Tasks**:
1. Read `c:/Users/assdi/Documents/Downloads/shuddho-guard/.agents/ORIGINAL_REQUEST.md` and `PROJECT.md`.
2. Create `web-extension/pages/warning.html` with clean responsive Bengali warning UI explaining honey-trap dangers, with a "Go Back to Safety" button and "Report Trap" button.
3. Link `<script src="popup.js"></script>` at the bottom of `web-extension/popup/popup.html`.
4. Create `web-extension/scripts/background.js` (MV3 service worker) that handles extension installation, badge updates, and periodic sync check.
5. Update `web-extension/manifest.json` to register `"background": { "service_worker": "scripts/background.js", "type": "module" }` and ensure all paths and permissions are valid MV3.
6. Create or synchronize `extension/` as a complete copy/mirror of `web-extension/` so that any tool or test looking for `extension/manifest.json` or `web-extension/manifest.json` finds it.
7. Run and verify unit tests:
   `node tools/test-banglish-filter.js` (must pass 7/7)
   `node tools/test-trap-detector.js` (must pass 4/4)
8. Document all changes and verification in `handoff.md` and report back.

DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

## 2026-09-23T16:50:38Z
Worker M1 assignment received from parent orchestrator.

