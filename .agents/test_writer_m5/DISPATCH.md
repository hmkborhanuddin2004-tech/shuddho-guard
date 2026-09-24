# Dispatch Assignment — Test Writer M5 (Root Infrastructure & E2E Testing Suite)

**Target**: Milestone 5 (Root Infrastructure & E2E Testing Track)
**Input Files**:
- c:/Users/assdi/Documents/Downloads/shuddho-guard/.agents/ORIGINAL_REQUEST.md
- c:/Users/assdi/Documents/Downloads/shuddho-guard/.agents/PROJECT.md
- c:/Users/assdi/Documents/Downloads/shuddho-guard/.agents/TEST_INFRA.md
- c:/Users/assdi/Documents/Downloads/shuddho-guard/.agents/survey_miner_1/handoff.md

**Exclusive File Ownership**:
- `package.json` (at workspace root)
- `e2e/` (all files)
- `TEST_READY.md` (at workspace root)

**Tasks**:
1. Read `c:/Users/assdi/Documents/Downloads/shuddho-guard/.agents/ORIGINAL_REQUEST.md`, `PROJECT.md`, and `TEST_INFRA.md`.
2. Create root `package.json` with scripts:
   - `"test"`: `"node e2e/run-all-tests.js"`
   - `"test:banglish"`: `"node tools/test-banglish-filter.js"`
   - `"test:trap"`: `"node tools/test-trap-detector.js"`
   - `"test:backend"`: `"node backend/test-backend.js"`
3. Implement `e2e/run-all-tests.js` executing:
   - Tier 1: Core feature verification (Banglish filter 7/7, Trap detector 4/4, Backend server 4/4).
   - Tier 2: Boundary & corner cases (empty inputs, long strings, Unicode Bengali combinations, malformed URLs).
   - Tier 3: Cross-module interactions (e.g. extension trap reporting matching backend `/report` format, blacklist sync response matching extension storage format).
   - Tier 4: Real-world Bangladeshi user scenarios (HSC book search allowed, Facebook viral clickbait blocked, SafeSearch VIP redirect verified, mobile payment verification).
   - Verifies all 6 Acceptance Criteria from `ORIGINAL_REQUEST.md`:
     * AC1: `tools/test-banglish-filter.js` passes (7/7).
     * AC2: `tools/test-trap-detector.js` passes (4/4).
     * AC3: Backend `/health`, `/blacklist`, `/report`, `/subscription/verify` pass in `backend/test-backend.js`.
     * AC4: Chrome extension manifests validly with Manifest V3 and includes all referenced icons and scripts.
     * AC5: Windows client scripts have admin elevation detection and silent execution capability.
     * AC6: All code and documentation are cleanly organized.
4. Execute `node e2e/run-all-tests.js` and verify all tests pass with exit code 0.
5. Publish `TEST_READY.md` at workspace root detailing test commands, tier breakdown, and test summary.
6. Document all work in `handoff.md` and report back.

DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

## 2026-09-23T16:50:38Z
Dispatched test_writer_m5 for Milestone 5 (Root Infrastructure & E2E Testing Track).
