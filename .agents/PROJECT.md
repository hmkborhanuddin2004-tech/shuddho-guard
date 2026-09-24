# Project: Shuddho Guard

## Architecture
Shuddho Guard is a multi-platform content protection system tailored for Bangladesh, protecting users from explicit adult content, deceptive honey-trap links on social media (Facebook/Telegram), and DNS bypasses.

### System Components
1. **Chrome Extension (`web-extension/` & `extension/`)**:
   - Manifest V3 architecture with declarativeNetRequest, storage, content scripts, and background service worker.
   - Content scripts (`trap-link-interceptor.js`, `ai-vision-blur.js`) detect suspicious URLs (`t.me/`, shorteners) and adult/Banglish keywords in Facebook/social media feeds, displaying a warning modal.
   - Popup UI (`popup/popup.html`, `popup/popup.js`) displays protection stats and toggle controls.
   - Warning intercept page (`pages/warning.html`).
2. **Android DNS & Safety Filter (`android/`)**:
   - `ShuddhoVpnService`: Routes DNS queries to CleanBrowsing Adult Filter (`185.228.168.10`) and Cloudflare Family DNS (`1.1.1.3` / `2606:4700:4700::1113`).
   - `TelegramScreenGuardService`: Accessibility service blocking access to Private DNS settings.
   - `AppInstallWatcher` & `ShuddhoDeviceAdminReceiver`: Prevents unauthorized VPN uninstallation and tamper.
   - `StealthCalculatorActivity`: Disguised calculator vault with secret PIN unlock (`1234=`).
3. **Windows Host & SafeSearch Blocker (`windows-client/`)**:
   - `shuddho-pc-guard.js`: Node.js daemon enforcing hosts file modifications (`C:\Windows\System32\drivers\etc\hosts`) to block adult domains and redirect Google and Bing to SafeSearch VIPs (`216.239.38.120`, `204.79.197.220`).
   - `install-windows-service.bat`: Administrative elevation detector and installer using Task Scheduler (`schtasks /rl HIGHEST`).
   - `run-silent.vbs`: VBScript wrapper for windowless execution (window style 0).
4. **Cloud Blacklist Sync Server (`backend/`)**:
   - Express server providing `/health`, `/blacklist` (and `/api/v1/blacklist`), `/report` (and `/api/v1/report`), and `/subscription/verify` (and `/api/v1/subscription/verify`).
   - Automated test suite in `backend/test-backend.js`.
5. **Tools & Unified Test Runner (`tools/` & root)**:
   - `tools/test-banglish-filter.js`: 7 automated test cases for Bengali/Banglish explicit slang.
   - `tools/test-trap-detector.js`: 4 automated test cases for Facebook deceptive link interception.
   - Root `package.json` running unified test suites.

---

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | Banglish Slang Detection | Detects 32+ explicit Bengali/Banglish slangs and 8 regex patterns | M1 | tools/test-banglish-filter.js |
| 2 | Honey-Trap Link Interception | Detects suspicious t.me, bit.ly, tinyurl links in social feeds | M1 | tools/test-trap-detector.js |
| 3 | Warning Modal UI | In-page modal intercepting clicks on deceptive links | M1 | web-extension/scripts/trap-link-interceptor.js |
| 4 | Warning Standalone Page | Web accessible warning page (`pages/warning.html`) | M1 | web-extension/manifest.json |
| 5 | Extension Popup UI & Stats | Interactive popup rendering block counts and status | M1 | web-extension/popup/ |
| 6 | Extension Background Worker | MV3 service worker for sync and badge count updates | M1 | web-extension/scripts/background.js |
| 7 | Extension Path Parity | Both `web-extension/` and `extension/` available for test runners | M1 | Survey consensus |
| 8 | Cloud Server Health Check | GET `/health` returning status and uptime | M2 | backend/server.js |
| 9 | Dynamic Blacklist API | GET `/blacklist` and `/api/v1/blacklist` returning domains/keywords | M2 | backend/server.js |
| 10 | User Trap Reporting API | POST `/report` and `/api/v1/report` for reporting malicious links | M2 | backend/server.js |
| 11 | Subscription Verification API | POST `/subscription/verify` for mobile payment verification | M2 | backend/server.js |
| 12 | Route Dual Mounting | Mount root routes alongside `/api/v1/*` | M2 | Survey consensus |
| 13 | Windows Hosts File Modification | Blocks adult domains in System32\drivers\etc\hosts | M3 | windows-client/shuddho-pc-guard.js |
| 14 | Windows SafeSearch Enforcement | Forces Google & Bing SafeSearch VIP redirects in hosts | M3 | windows-client/shuddho-pc-guard.js |
| 15 | Windows Admin Elevation Detection | Batch/PowerShell auto-elevation prompt in installer | M3 | windows-client/install-windows-service.bat |
| 16 | Windows Silent Startup | Runs silently without cmd window via Task Scheduler / VBS | M3 | windows-client/run-silent.vbs |
| 17 | Windows DNS Flush | Flushes DNS cache (`ipconfig /flushdns`) after hosts update | M3 | windows-client/shuddho-pc-guard.js |
| 18 | Android CleanBrowsing Adult DNS | Enforces `185.228.168.10` in VpnService | M4 | android/.../ShuddhoVpnService.kt |
| 19 | Android Cloudflare Family IPv4 DNS | Enforces `1.1.1.3` in VpnService | M4 | android/.../ShuddhoVpnService.kt |
| 20 | Android Cloudflare Family IPv6 DNS | Enforces `2606:4700:4700::1113` in VpnService | M4 | android/.../ShuddhoVpnService.kt |
| 21 | Android Private DNS Tamper Guard | Accessibility service blocking Private DNS bypass | M4 | android/.../TelegramScreenGuardService.kt |
| 22 | Android Stealth Calculator Vault | PIN-protected disguised vault interface (`1234=`) | M4 | android/.../StealthCalculatorActivity.kt |
| 23 | Root Test Automation | Unified `npm test` running all test suites | M5 | Root package.json |
| 24 | E2E Testing Suite (Tiers 1-4) | Comprehensive test suite covering all requirements | M5 | e2e-tests / TEST_READY.md |
| 25 | Adversarial Hardening (Tier 5) | Stress testing and edge case verification | Final | Final Milestone |

---

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| 1 | Web Extension & Trap Interceptor Hardening | Extension Manifest V3, warning.html, popup.js link, background.js, path parity | none | PLANNED |
| 2 | Cloud Backend Sync Server & Route Aliases | Backend root routes, server script, backend test suite | none | PLANNED |
| 3 | Windows Host & SafeSearch Blocker Hardening | Admin elevation detection, Task Scheduler elevated silent startup, DNS flush | none | PLANNED |
| 4 | Android DNS/VPN Filter & Vault Hardening | Cloudflare IPv6 DNS addition, VpnService routing, vault documentation | none | PLANNED |
| 5 | E2E Testing Track & Root Test Automation | Root package.json, E2E test harness & Tiers 1-4 test suite, TEST_READY.md | none | PLANNED |
| 6 | Final Integration, 100% E2E Pass & Audit | Execute all tests (7/7 banglish, 4/4 trap, 4/4 backend, E2E suite), Forensic Audit | M1, M2, M3, M4, M5 | PLANNED |

---

## Interface Contracts

### Backend API Endpoints
- `GET /health` & `GET /api/v1/health`
  - Response 200: `{ "status": "OK", "service": "Shuddho Guard Cloud Engine", "uptime": number }`
- `GET /blacklist` & `GET /api/v1/blacklist`
  - Response 200: `{ "version": string, "updatedAt": string, "data": { "domains": string[], "telegramChannels": string[], "banglishKeywords": string[] } }`
- `POST /report` & `POST /api/v1/report`
  - Body: `{ "url": string, "category"?: string, "reportedBy"?: string, "platform"?: string }`
  - Response 201: `{ "success": true, "message": string, "reportId": string }`
  - Response 400: `{ "error": string }`
- `POST /subscription/verify` & `POST /api/v1/subscription/verify`
  - Body: `{ "phoneNumber": string, "trxId": string, "amount"?: number }`
  - Response 200: `{ "success": true, "status": "ACTIVE", "tier": "PREMIUM", "expiresAt": string }`
  - Response 400: `{ "error": string }`

### Trap Detector Engine Interface
- `isTrapLink(href: string, contextText: string): boolean`
  - Returns `true` if `href` matches suspicious shorteners or `t.me` and `contextText` contains bait keywords.

### Banglish Filter Engine Interface
- `isExplicit(text: string): boolean`
  - Returns `true` if `text` contains explicit Bengali/Banglish slangs or regex matches.

---

## Code Layout
- `web-extension/`: Chrome Extension Manifest V3 source
- `extension/`: Symlink or mirrored Chrome Extension directory
- `backend/`: Express server, Dockerfile, test-backend.js
- `windows-client/`: Windows hosts blocker daemon, VBS runner, elevation bat scripts
- `android/`: Android Studio project with VpnService, Accessibility guard, and Calculator Vault
- `tools/`: Unit tests (`test-banglish-filter.js`, `test-trap-detector.js`)
- `e2e/`: E2E test suite (Tiers 1-4)
- `.agents/`: Coordination files, metadata, audit reports (NO source code)
