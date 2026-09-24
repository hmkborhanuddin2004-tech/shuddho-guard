# Dispatch Assignment — Worker M2 (Cloud Backend Sync Server)

**Target**: Milestone 2 (Cloud Backend Sync Server & Route Aliases)
**Input Files**:
- c:/Users/assdi/Documents/Downloads/shuddho-guard/.agents/ORIGINAL_REQUEST.md
- c:/Users/assdi/Documents/Downloads/shuddho-guard/.agents/PROJECT.md
- c:/Users/assdi/Documents/Downloads/shuddho-guard/.agents/survey_explorer_3/handoff.md

**Exclusive File Ownership**:
- `backend/` (all files)

**Tasks**:
1. Read `c:/Users/assdi/Documents/Downloads/shuddho-guard/.agents/ORIGINAL_REQUEST.md` and `PROJECT.md`.
2. Inspect `backend/server.js` and `backend/package.json`.
3. Add root route aliases alongside existing `/api/v1/*` routes:
   - `GET /blacklist` (same handler as `GET /api/v1/blacklist`)
   - `POST /report` (same handler as `POST /api/v1/report`)
   - `POST /subscription/verify` (same handler as `POST /api/v1/subscription/verify`)
   - Ensure `GET /health` continues to respond 200.
4. Add `"test": "node test-backend.js"` to `backend/package.json`.
5. Run automated test suite:
   `node backend/test-backend.js` (must pass 4/4)
6. Add additional automated checks in `backend/test-backend.js` (or separate test) verifying both `/api/v1/*` and root `/*` endpoints respond correctly.
7. Document all changes and verification in `handoff.md` and report back.

DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

## 2026-09-23T16:50:38Z
You are worker_m2, a teamwork_preview_worker for Shuddho Guard.
Your working directory is: c:/Users/assdi/Documents/Downloads/shuddho-guard/.agents/worker_m2
Project root: c:/Users/assdi/Documents/Downloads/shuddho-guard
Authoritative User Request: c:/Users/assdi/Documents/Downloads/shuddho-guard/.agents/ORIGINAL_REQUEST.md
Master Project Specification: c:/Users/assdi/Documents/Downloads/shuddho-guard/.agents/PROJECT.md
Your assignment is in: c:/Users/assdi/Documents/Downloads/shuddho-guard/.agents/worker_m2/DISPATCH.md

Exclusive Write Ownership:
- `backend/` (all files)
DO NOT touch any files outside this directory.

Tasks:
1. Read ORIGINAL_REQUEST.md and PROJECT.md.
2. Read survey findings in c:/Users/assdi/Documents/Downloads/shuddho-guard/.agents/survey_explorer_3/handoff.md.
3. Inspect `backend/server.js` and `backend/package.json`.
4. Add root route aliases alongside existing `/api/v1/*` routes:
   - `GET /blacklist` (same handler as `GET /api/v1/blacklist`)
   - `POST /report` (same handler as `POST /api/v1/report`)
   - `POST /subscription/verify` (same handler as `POST /api/v1/subscription/verify`)
   - Ensure `GET /health` continues to respond 200.
5. Add `"test": "node test-backend.js"` to `backend/package.json`.
6. Run `node backend/test-backend.js` and ensure all 4 test cases pass with exit code 0.
7. Add checks in `backend/test-backend.js` (or verify) to confirm that both `/api/v1/*` and root `/*` endpoints respond correctly.
8. Write `handoff.md` in your working directory documenting changes and test results.
9. Send a message to your parent orchestrator when complete.

