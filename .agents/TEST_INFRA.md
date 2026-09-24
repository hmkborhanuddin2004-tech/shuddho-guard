# E2E Test Infra: Shuddho Guard

## Test Philosophy
- Opaque-box, requirement-driven, multi-platform verification.
- Validates all 4 primary requirements (R1 Chrome Extension, R2 Android DNS/VPN, R3 Windows Hosts/SafeSearch Blocker, R4 Cloud Blacklist Server) and all 6 acceptance criteria.
- Test Methodology: Category-Partition + Boundary Value Analysis + Pairwise Combinations + Real-World Bangladesh Scenarios.

## Feature Inventory & Test Mapping
| # | Feature | Requirement | Tier 1 (Coverage) | Tier 2 (Boundary) | Tier 3 (Cross-Module) | Tier 4 (Real-World) |
|---|---------|-------------|:-----------------:|:-----------------:|:---------------------:|:-------------------:|
| 1 | Banglish Slang Filter | R1, AC1 | 5 | 5 | ✓ | ✓ |
| 2 | Honey-Trap Link Interceptor | R1, AC2 | 5 | 5 | ✓ | ✓ |
| 3 | Chrome Extension MV3 & Assets | R1, AC4 | 5 | 5 | ✓ | ✓ |
| 4 | Cloud Backend API (/health, /blacklist, /report, /subscription) | R4, AC3 | 5 | 5 | ✓ | ✓ |
| 5 | Windows Hosts & Elevation & Silent | R3, AC5 | 5 | 5 | ✓ | ✓ |
| 6 | Android DNS & Safety Filter Spec | R2 | 5 | 5 | ✓ | ✓ |

## Test Architecture
- **Unit Test Runner**: Node.js built-in runner or custom test harnesses in `tools/` and `backend/`.
  - `tools/test-banglish-filter.js` (7 test cases)
  - `tools/test-trap-detector.js` (4 test cases)
  - `backend/test-backend.js` (4 endpoint test cases)
- **E2E Integration Runner**: `e2e/run-all-tests.js` orchestrating:
  - Acceptance Criteria 1: Banglish filter (7/7)
  - Acceptance Criteria 2: Trap detector (4/4)
  - Acceptance Criteria 3: Backend server endpoints (`/health`, `/blacklist`, `/report`, `/subscription/verify`)
  - Acceptance Criteria 4: Extension Manifest V3 schema validity, icon integrity, and script linkage
  - Acceptance Criteria 5: Windows client script elevation check and silent VBS capability
  - Acceptance Criteria 6: Clean organization and presence of all components
- **Tier 4 Scenarios**:
  1. Viral clickbait post on Facebook with shortener link redirecting to adult Telegram channel -> Blocked.
  2. Student searching for HSC academic books / coding tutorials -> Allowed cleanly without false positives.
  3. Windows user visiting explicit domain or searching Google -> Redirected to SafeSearch VIP (216.239.38.120).
  4. User reporting newly discovered malicious link to cloud server -> Stored and available in sync feed.
  5. User entering subscription payment via bKash/Nagad trxId -> Activated for 30 days.

## Coverage Thresholds
- Tier 1: ≥5 per feature area
- Tier 2: ≥5 boundary/edge cases
- Tier 3: Cross-module interactions (e.g. extension reporting trap to backend; backend blacklist syncing to client)
- Tier 4: Real-world Bangladeshi user scenarios
