# Shuddho Guard — Comprehensive Specification Mining & Repository Audit Report

**Date**: 2026-09-23  
**Auditor**: `survey_miner_1` (teamwork_preview_spec_miner)  
**Target Repository**: `c:/Users/assdi/Documents/Downloads/shuddho-guard`  
**Authoritative Request**: `ORIGINAL_REQUEST.md` (Integrity Mode: development)

---

## 1. Executive Summary

Shuddho Guard (শুদ্ধ গার্ড) is a multi-platform content protection system designed for users in Bangladesh. Its goal is to eradicate access to adult content, honey-traps, and adult Telegram redirect rings via four interconnected pillars:
1. **Bengali/Banglish Linguistic Filter & Honey-Trap Interceptor** (Web Extension & Unit Test Suite).
2. **Android DNS & Safety Filter** (Stealth Calculator launcher, VpnService routing to CleanBrowsing/Cloudflare Family DNS, Telegram screen guard via AccessibilityService, and Device Owner tamper-proofing).
3. **Windows PC Background Daemon** (Hosts file enforcer, Google/Bing SafeSearch redirector, DNS cache flusher, VBS silent startup launcher).
4. **Cloud Blacklist Sync Server** (Node.js/Express backend exposing health checks, dynamic blacklist synchronization, user trap reporting, and mock bKash/Nagad subscription verification).

This audit investigated the entire repository, directly executed and verified all three automated test suites (`tools/test-banglish-filter.js`, `tools/test-trap-detector.js`, and `backend/test-backend.js`), audited every source file across all platforms, and discovered key interface contracts, boundary edge cases, and missing stubs/files.

---

## 2. Automated Test Suites Deep Dive

### 2.1. Suite 1: `tools/test-banglish-filter.js`

- **Purpose**: Verifies detection of obscene, explicit, and leaked video keywords in Bengali written in Roman script (Banglish) as well as international adult terminology.
- **Dependencies & Imports**: None (`fs` or external modules are not imported; the lexicon and algorithm are declared inline).
- **Module Under Test**: `isExplicit(text)`
- **Algorithm & Data Structures**:
  - `BANGLISH_SLANGS` (`Set<string>` of 32 terms):
    - Local slangs: `choti`, `bangla choti`, `chotikahini`, `chotigolpo`, `boudi`, `deshi boudi`, `gopon video`, `meye link`, `leaked video`, `deshi viral`, `boudir video`, `chuda`, `choda`, `magi`, `khanki`, `bap beti`, `aunty sex`, `bhabi choti`, `bhabi sex`, `hot boudi`, `deshi sexy`, `bangla sex`, `bangla x`, `bd viral`, `telegram leak`, `mega leak`, `drive link 18+`.
    - International terms: `porn`, `xxx`, `xvideos`, `pornhub`, `xhamster`, `xnxx`.
  - `SUSPICIOUS_PATTERNS` (`Array<string>` of 8 patterns):
    - `choti`, `leak`, `viral 18`, `adult link`, `deshi mms`, `private link`, `gopon adda`, `18+ link`.
  - Normalization: `text.toLowerCase().trim()`.
  - Substring matching: `normalized.includes(slang)` and `normalized.includes(pattern)`.
- **The 7 Test Cases & Verifications**:
  1. `deshi boudi viral video telegram link` -> Expected: `true` (Observed: `true` | PASS ✅ - matches `deshi boudi`, `boudi`, `viral`)
  2. `bangla choti golpo pdf download` -> Expected: `true` (Observed: `true` | PASS ✅ - matches `choti`, `bangla choti`, `chotigolpo`)
  3. `HSC Physics 1st Paper Book by Dr. Shahjahan Tapan` -> Expected: `false` (Observed: `false` | PASS ✅ - clean academic query)
  4. `Learn Python and Node.js for Beginners` -> Expected: `false` (Observed: `false` | PASS ✅ - clean technical text)
  5. `gopon video mega drive link` -> Expected: `true` (Observed: `true` | PASS ✅ - matches `gopon video`)
  6. `Bangladesh Cricket Match Highlights 2026` -> Expected: `false` (Observed: `false` | PASS ✅ - clean sports query)
  7. `hot boudir choti kahini` -> Expected: `true` (Observed: `true` | PASS ✅ - matches `hot boudi`, `boudi`, `choti`, `chotikahini`)
- **Execution Result**: Exits with code `0`. 7/7 passed.
- **Architectural Observation**: The lexicon is identically duplicated in Kotlin at `android/app/src/main/java/com/shuddho/guard/filters/BanglishSlangLexicon.kt`. Currently, neither file imports from a shared central JSON/YAML lexicon source.

---

### 2.2. Suite 2: `tools/test-trap-detector.js`

- **Purpose**: Detects deceptive social media honey-traps where clickbait text (often cloaked with religious or scandal titles) tempts users into clicking links leading to adult/leaked Telegram channels or shorteners.
- **Dependencies & Imports**: None (standalone script).
- **Module Under Test**: `isTrapLink(href, contextText)`
- **Algorithm & Data Structures**:
  - `SUSPICIOUS_DOMAINS` (`Array<string>`): `['t.me', 'telegram.me', 'telegram.dog', 'bit.ly', 'tinyurl.com', 'cutt.ly']`.
  - `SUSPICIOUS_KEYWORDS` (`Array<string>`):
    `['choti', 'boudi', 'gopon', 'viral', 'leaked', 'leak', '18+', 'সহবাস', 'বউ ছাড়া', 'গোপন ভিডিও', 'ভিডিও লিংক', 'কমেন্টে লিংক', 'সেক্স', 'চটি', 'মজার ভিডিও', 'গরম খবর', 'জা-কির', 'জাকির নায়েক']`.
  - Dual-Gate Logic:
    1. Gate 1 (Domain Check): Returns `false` immediately if `href` does NOT match any domain in `SUSPICIOUS_DOMAINS`.
    2. Gate 2 (Context & Keyword Check): Checks whether `(href + ' ' + contextText).toLowerCase()` contains any term in `SUSPICIOUS_KEYWORDS`.
- **The 4 Test Cases & Verifications**:
  1. Title/Context: `"বউ ছাড়া যাদের সাথে সহবাস জায়েজ বলেছেন ড. জাকির নায়েক! কমেন্টে পুরো ভিডিওর লিংক দেখুন"`, Href: `"https://t.me/joinchat/XYZ123_leak_video"` -> Expected: `true` (Observed: `true` | PASS ✅ - matches `t.me` domain and keywords `সহবাস`, `বউ ছাড়া`, `জাকির নায়েক`, `leak`, `ভিডিও লিংক`, `কমেন্টে লিংক`).
  2. Title/Context: `"আজকের তাজা খবর জানতে আমাদের অফিসিয়াল চ্যানেলে যুক্ত হোন"`, Href: `"https://t.me/prothomalo_official"` -> Expected: `false` (Observed: `false` | PASS ✅ - legitimate news channel on Telegram, passes Gate 1 but no suspicious keywords in Gate 2).
  3. Title/Context: `"ভাইরাল গোপন ভিডিও দেখতে ক্লিক করুন"`, Href: `"https://bit.ly/deshi-boudi-gopon"` -> Expected: `true` (Observed: `true` | PASS ✅ - matches `bit.ly` shortener and keywords `ভাইরাল`, `গোপন ভিডিও`, `boudi`, `gopon`).
  4. Title/Context: `"বিনামূল্যে পাইথন শিখুন এবং সার্টিফিকেট নিন"`, Href: `"https://bit.ly/free-python-course"` -> Expected: `false` (Observed: `false` | PASS ✅ - legitimate shortener link for coding course).
- **Execution Result**: Exits with code `0`. 4/4 passed.
- **Architectural Observation**: This logic matches the client-side DOM scanner in `web-extension/scripts/trap-link-interceptor.js`, which inspects `anchor.href` combined with the text of the surrounding Facebook comment/post DOM tree.

---

### 2.3. Suite 3: `backend/test-backend.js`

- **Purpose**: Programmatic integration test for the Express cloud backend running on port 4000.
- **Dependencies & Imports**: Node native `http` module and `./server.js`.
- **Execution Mechanism**:
  - Requires `./server.js`, which binds Express to port 4000 (`PORT = process.env.PORT || 4000`).
  - Waits 1,000ms via `setTimeout` for the server socket to listen.
  - Sends asynchronous HTTP requests using Node `http.request`.
- **The 4 Endpoint Scenarios Tested**:
  1. `GET /health`
     - Expected Status: `200`
     - Response Schema:
       ```json
       {
         "status": "OK",
         "service": "Shuddho Guard Cloud Engine",
         "uptime": 0.0123
       }
       ```
     - Assertion: `health.status === 200` (Observed: PASS ✅)
  2. `GET /api/v1/blacklist`
     - Expected Status: `200`
     - Response Schema:
       ```json
       {
         "success": true,
         "data": {
           "version": "string (e.g. 2026.09.23)",
           "domains": ["chotikahini.com", ...],
           "telegramChannels": ["choti_boudi_leak_18", ...],
           "banglishKeywords": ["choti", "boudi", ...]
         },
         "timestamp": "ISO-8601 string"
       }
       ```
     - Assertion: `blacklist.body.success === true` (Observed: PASS ✅)
  3. `POST /api/v1/report`
     - Request Payload:
       ```json
       {
         "url": "https://t.me/bad_trap_link",
         "title": "ভুয়া জাকির নায়েক ফাঁদ"
       }
       ```
     - Expected Status: `200`
     - Response Schema:
       ```json
       {
         "success": true,
         "message": "ধন্যবাদ! আপনার রিপোর্টটি গৃহীত হয়েছে এবং পর্যালোচনার পর ব্ল্যাকলিস্টে যুক্ত করা হবে।"
       }
       ```
     - Assertion: `report.body.success === true` (Observed: PASS ✅)
  4. `POST /api/v1/subscription/verify`
     - Request Payload:
       ```json
       {
         "phoneNumber": "01711000000",
         "trxId": "9J8K7L6M"
       }
       ```
     - Expected Status: `200`
     - Response Schema:
       ```json
       {
         "success": true,
         "status": "ACTIVE",
         "plan": "PRO_MONTHLY",
         "expiresAt": "ISO-8601 string (current date + 30 days)",
         "message": "অভিনন্দন! আপনার শুদ্ধ গার্ড প্রো সাবস্ক্রিপশন সফলভাবে সক্রিয় হয়েছে।"
       }
       ```
     - Assertion: `sub.body.status === "ACTIVE"` (Observed: PASS ✅)
- **Execution Result**: Exits with code `0`. All 4 tests passed.

---

## 3. Detailed Component & Codebase Survey

### 3.1. Chrome Web Extension (`web-extension/`)

- **Manifest File**: `web-extension/manifest.json` (Manifest V3)
  - `manifest_version`: 3
  - Permissions: `["storage", "declarativeNetRequest"]`
  - Host Permissions: Facebook, Instagram, TikTok, YouTube, Twitter, X.com.
  - Content Scripts:
    - Matches: `*://*.facebook.com/*`, `*://*.instagram.com/*`, `*://*.tiktok.com/*`, `*://*.youtube.com/*`, `*://*.twitter.com/*`, `*://*.x.com/*`.
    - Scripts: `scripts/trap-link-interceptor.js`, `scripts/ai-vision-blur.js`.
    - Run At: `document_idle`.
  - Action Popup: `popup/popup.html`.
  - Icons: `icons/icon16.png`, `icons/icon48.png`, `icons/icon128.png` (present, generated by `tools/create-png-icons.js`) and `icons/icon.svg`.
- **Defects & Anomalies Found**:
  1. **Missing Web Accessible Resource**: `manifest.json` specifies:
     ```json
     "web_accessible_resources": [
       { "resources": ["pages/warning.html"], "matches": ["<all_urls>"] }
     ]
     ```
     However, `web-extension/pages/` is an empty folder (`pages/warning.html` does not exist).
  2. **Popup Script Disconnection**: `web-extension/popup/popup.js` exists and queries `chrome.storage.local` for `blurredCount` and `trapsBlocked`, but `popup/popup.html` lacks `<script src="popup.js"></script>`.

### 3.2. Windows Client (`windows-client/`)

- **Files Present**:
  - `shuddho-pc-guard.js`: Node.js background shield modifying `C:\Windows\System32\drivers\etc\hosts`.
    - Maps 12 explicit domains (`pornhub.com`, `xvideos.com`, `xnxx.com`, `xhamster.com`, `chotikahini.com`, `banglachoti.com`, `deshiboudi.com`, `bdchoti.net`) to `0.0.0.0`.
    - Redirects `google.com`, `www.google.com`, `www.google.com.bd` to `216.239.38.120` (forces SafeSearch).
    - Redirects `bing.com`, `www.bing.com` to `204.79.197.220` (forces SafeSearch).
    - Executes `attrib -r -s -h` before editing and `attrib +r +s` after editing.
    - Flushes DNS via `ipconfig /flushdns`.
    - Runs a persistent check every 5 minutes (`300000ms`).
  - `run-silent.vbs`: Uses `WScript.Shell.Run "node ...\shuddho-pc-guard.js", 0, False` to execute Node silently with no window.
  - `install-windows-service.bat`: Installs a startup launcher into `%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup\ShuddhoGuardStartup.vbs` and invokes `run-silent.vbs`.
  - `start-guard.bat`: Interactive test batch runner.
- **Defects & Missing Requirements**:
  - Requirement R3 and Acceptance Criteria require: *"Maintain a background daemon with admin elevation installer that modifies the Windows hosts file to block adult domains, enforce Google SafeSearch IP redirects, and run silently on Windows startup without visible cmd windows... Windows client scripts have admin elevation detection."*
  - Neither `install-windows-service.bat` nor `start-guard.bat` tests for admin elevation (e.g., via `net session >nul 2>&1` or PowerShell elevation). When run by a non-elevated user, editing `System32\drivers\etc\hosts` will fail with an EPERM/Access Denied error.

### 3.3. Android App (`android/`)

- **Package**: `com.shuddho.guard`, compileSdk 34, minSdk 24, targetSdk 34.
- **Key Architecture**:
  - `StealthCalculatorActivity`: Disguised calculator UI (`1234=` master PIN unlocks onboarding or vault).
  - `MasterOnboardingActivity`: 1-click coordinator for Device Admin, VpnService, and Accessibility permissions.
  - `VaultDashboardActivity`: Secret dashboard showing protection stats and emergency Islamic focus ("Astaghfirullah" guidance).
  - `ShuddhoVpnService`: Local VpnService that directs DNS to CleanBrowsing Adult DNS (`185.228.168.10`) and Cloudflare Family SafeSearch DNS (`1.1.1.3`). Runs as a foreground service with a low-priority notification disguised as "Calculator Engine".
  - `TelegramScreenGuardService`: AccessibilityService that monitors `org.telegram` and variants (`thunderdog`), scanning visible UI texts against `BanglishSlangLexicon.isExplicit()`. If explicit content is detected, or if settings tampering is detected (e.g., force stopping "calculator" or accessing "private dns"), it issues `GLOBAL_ACTION_HOME` or `GLOBAL_ACTION_BACK`.
  - `ShuddhoDeviceAdminReceiver`: Enforces `UserManager.DISALLOW_UNINSTALL_APPS`, `DISALLOW_CONFIG_VPN`, `DISALLOW_SAFE_BOOT`, `DISALLOW_FACTORY_RESET`.
  - `AppInstallWatcher`: BroadcastReceiver on `PACKAGE_ADDED` scanning for `BIND_VPN_SERVICE` in newly installed APKs to prevent rogue VPN overrides.
  - `BanglishSlangLexicon.kt`: Kotlin lexicon matching `tools/test-banglish-filter.js`.

### 3.4. Root & Auxiliary Tools

- `tools/activate-device-owner.bat`: Batch script using `adb shell dpm set-device-owner com.shuddho.guard/.receivers.ShuddhoDeviceAdminReceiver`.
- `tools/create-png-icons.js`: Pure Node script using `zlib` to generate valid PNG icon files for the extension.
- `simulator/index.html`: Interactive web simulator for previewing the Stealth Calculator, Facebook feed, blur overlay, trap click alert, and bKash checkout.
- `landing-page/index.html`: Official responsive Bengali landing page presenting Shuddho Guard's features, pricing, and FAQ.
- **Missing Root `package.json`**: There is no root `package.json`. Test runners must be executed individually or via separate scripts.

---

## 4. Features Discovered Table

| # | Category | Feature | Description | Inputs | Outputs | Error Behavior | Discovered Via |
|---|----------|---------|-------------|--------|---------|----------------|----------------|
| 1 | Filter / Lexicon | Banglish Slang Detection | Detects 32 explicit Bengali/Banglish and English adult words | String (`text`) | Boolean (`true` = blocked, `false` = clean) | Returns `false` on null/empty/whitespace | `tools/test-banglish-filter.js` & `BanglishSlangLexicon.kt` |
| 2 | Filter / Lexicon | Suspicious Pattern Matching | Matches 8 adult patterns (e.g. `choti`, `leak`, `18+ link`) | String (`text`) | Boolean (`true` = blocked, `false` = clean) | Returns `false` on null/empty | `tools/test-banglish-filter.js` & `BanglishSlangLexicon.kt` |
| 3 | Trap Detection | Deceptive Honey-Trap Detector | Two-gate check: domain match (t.me, bit.ly, etc.) + context keywords (choti, zakir naik, etc.) | `href` (URL string), `contextText` (string) | Boolean (`true` = trap link blocked, `false` = allowed) | Returns `false` if domain not in `SUSPICIOUS_DOMAINS` | `tools/test-trap-detector.js` & `trap-link-interceptor.js` |
| 4 | Chrome Extension | Trap Warning Modal | Injects full-screen backdrop-blurred modal when suspicious anchor is clicked | User click event on `<a>` tag | Intercepts navigation (`preventDefault`), renders warning modal | Removes modal on click "নিরাপদে ফিরে যান" | `web-extension/scripts/trap-link-interceptor.js` |
| 5 | Chrome Extension | Real-Time AI Skin Tone Blur | Scans `<img>` elements via canvas pixel analysis (RGB/YCbCr heuristic); blurs if skin ratio > 32% | DOM `<img>` elements, dynamic mutations | Adds `.shuddho-blurred-media` CSS filter (blur 35px) + badge | Catches CORS cross-origin image errors silently | `web-extension/scripts/ai-vision-blur.js` |
| 6 | Chrome Extension | Video Shielding | Automatically blurs all `<video>` tags in social media feeds | DOM `<video>` elements | Applies `.shuddho-blurred-media` CSS class | Handled on dynamic DOM insertion | `web-extension/scripts/ai-vision-blur.js` |
| 7 | Chrome Extension | Manifest V3 Icons | Standalone PNG generator creating valid 16x16, 48x48, 128x128 icons | RGB color values `(5, 150, 105)` | PNG binary files in `web-extension/icons/` | Throws on write permission failure | `tools/create-png-icons.js` |
| 8 | Cloud Backend | Health Check Endpoint | Returns service health, uptime, and status 200 for Render / UptimeRobot | `GET /health` | HTTP 200 `{ status: "OK", service: "...", uptime: ... }` | None | `backend/server.js` & `backend/test-backend.js` |
| 9 | Cloud Backend | Dynamic Blacklist Sync | Serves curated domains, Telegram channels, and Banglish keywords | `GET /api/v1/blacklist` | HTTP 200 `{ success: true, data: {...}, timestamp: "..." }` | None | `backend/server.js` & `backend/test-backend.js` |
| 10 | Cloud Backend | Community Trap Reporting | Allows clients to report newly discovered trap links | `POST /api/v1/report` with JSON `{ url, title, reportedBy }` | HTTP 200 `{ success: true, message: "..." }` | Returns HTTP 400 `{ success: false, message: "URL প্রদান করা আবশ্যক" }` if url missing | `backend/server.js` & `backend/test-backend.js` |
| 11 | Cloud Backend | Subscription Verification | Mock bKash/Nagad verification returning 30-day active PRO plan | `POST /api/v1/subscription/verify` with `{ phoneNumber, trxId }` | HTTP 200 `{ success: true, status: "ACTIVE", plan: "PRO_MONTHLY", expiresAt: "..." }` | Returns HTTP 400 if `phoneNumber` or `trxId` missing | `backend/server.js` & `backend/test-backend.js` |
| 12 | Windows Client | Hosts File SafeSearch Enforcer | Appends SafeSearch redirect IPs for Google (216.239.38.120) and Bing (204.79.197.220) to `hosts` | None (runs as daemon) | Writes to `C:\Windows\System32\drivers\etc\hosts` | Catches EPERM/permission error, logs warning | `windows-client/shuddho-pc-guard.js` |
| 13 | Windows Client | Hosts File Adult Domain Blocker | Appends `0.0.0.0 <domain>` for 12 adult domains | None (runs as daemon) | Writes to `hosts` file | Catches permission error | `windows-client/shuddho-pc-guard.js` |
| 14 | Windows Client | Hosts File Anti-Tamper Lock | Strips attributes (`attrib -r -s -h`) before update and re-applies `attrib +r +s` | System command execution | Read-only and system attributes set on hosts file | Throws/catches on execSync failure | `windows-client/shuddho-pc-guard.js` |
| 15 | Windows Client | DNS Cache Flush | Executes `ipconfig /flushdns` whenever hosts file is updated | System command | Flushes Windows DNS resolver cache | Catches error | `windows-client/shuddho-pc-guard.js` |
| 16 | Windows Client | Silent Background Execution | VBScript wrapper to launch Node without visible command prompt | Node script path | Runs process with window style `0` (hidden) | Fails if Node not in PATH | `windows-client/run-silent.vbs` |
| 17 | Windows Client | Windows Startup Persistence | Generates a VBS shortcut in `%APPDATA%\...\Startup` | Batch execution | Writes `ShuddhoGuardStartup.vbs` | Fails if startup directory unwritable | `windows-client/install-windows-service.bat` |
| 18 | Android App | Stealth Calculator UI | Fully functional basic calculator that disguises the app | Keypad button presses | Displays math calculation results | Displays "Error" on malformed math expression | `StealthCalculatorActivity.kt` |
| 19 | Android App | Secret Vault PIN Trigger | Intercepts `1234=` on calculator keypad to open vault | Secret sequence `1234=` | Launches Onboarding or VaultDashboard | Clears display on trigger | `StealthCalculatorActivity.kt` |
| 20 | Android App | 1-Click Master Lockdown | Unified onboarding sequence requesting Device Admin, VPN, and Accessibility | User tap on `btnActivateAll` | Triggers 3 system permission intents, saves `is_enrolled=true` | Falls back to opening settings | `MasterOnboardingActivity.kt` |
| 21 | Android App | Always-On Local VPN DNS Filter | Intercepts all device DNS traffic and routes to CleanBrowsing (`185.228.168.10`) and Cloudflare Family (`1.1.1.3`) | System network traffic | Establishes VPN TUN interface (`10.1.10.1/24`) | Catches exception, logs error | `ShuddhoVpnService.kt` |
| 22 | Android App | Stealth VPN Notification | Disguised foreground notification ("Calculator Engine") on low importance channel | Android lifecycle | Shows notification without disturbing user | Low importance channel prevents intrusive sound | `ShuddhoVpnService.kt` |
| 23 | Android App | Telegram Accessibility Screen Guard | Inspects active window nodes in official Telegram (`org.telegram`) for Banglish slang | Accessibility events | Invokes `performGlobalAction(GLOBAL_ACTION_HOME)` to kill Telegram | Node recycling in `finally` block | `TelegramScreenGuardService.kt` |
| 24 | Android App | Settings Tampering Protection | Detects attempts to force-stop calculator or modify Private DNS in Settings | Accessibility events in `settings` package | Invokes `GLOBAL_ACTION_HOME` or `GLOBAL_ACTION_BACK` | Protects app persistence | `TelegramScreenGuardService.kt` |
| 25 | Android App | Device Administrator & Owner | Enforces `DISALLOW_UNINSTALL_APPS`, `DISALLOW_CONFIG_VPN`, `DISALLOW_SAFE_BOOT`, `DISALLOW_FACTORY_RESET` | DPM provisioning | Restricts user from uninstalling or bypassing | Inactive if not provisioned as Device Owner | `ShuddhoDeviceAdminReceiver.kt` |
| 26 | Android App | Rogue VPN Watcher | Detects newly installed APKs declaring `BIND_VPN_SERVICE` | `Intent.ACTION_PACKAGE_ADDED` | Sets `blocked_pkg_<pkgName>` in shared preferences | Catches package inspection errors | `AppInstallWatcher.kt` |
| 27 | Android App | Emergency Spiritual Panic Focus | Vault dashboard button providing Istighfar reminder for impulse control | Button click `btnEmergencyFocus` | Displays supportive Bengali toast notification | None | `VaultDashboardActivity.kt` |
| 28 | Standalone Tool | ADB Device Owner Enabler | Shell script automating Device Owner setup via ADB | USB debugging + ADB connected | Sets `dpm set-device-owner` | Outputs instructions if Google account exists | `tools/activate-device-owner.bat` |
| 29 | Web Simulator | Interactive System Simulator | Full browser-based mock of Phone, Calculator, Facebook blur, and bKash | Web clicks and input | Renders interactive state and system log | Handles eval errors gracefully | `simulator/index.html` |
| 30 | Landing Page | Public Marketing & Guide Page | Bengali presentation page with feature breakdown, pricing, and FAQ | Web browser visit | HTML5 responsive layout | None | `landing-page/index.html` |

---

## 5. Edge Cases Table

| # | Feature | Input / Condition | Observed Behavior |
|---|---------|-------------------|-------------------|
| 1 | `isExplicit()` | `null` or empty string `""` | Returns `false` cleanly without throwing exceptions. |
| 2 | `isExplicit()` | Mixed case and whitespace: `"   Hot BouDiR Choti   "` | Returns `true` (normalized to lowercase and trimmed). |
| 3 | `isExplicit()` | Legitimate substring collision (e.g. "mega" or "drive" alone) | Returns `false` because patterns are `"mega leak"` or `"drive link 18+"`. |
| 4 | `isTrapLink()` | Non-suspicious domain with suspicious words (e.g. `https://facebook.com/choti`) | Returns `false` because Gate 1 requires `href` to contain a domain from `SUSPICIOUS_DOMAINS`. |
| 5 | `isTrapLink()` | Suspicious domain without suspicious context (e.g. `https://t.me/prothomalo_official`) | Returns `false` because Gate 2 finds no match in `SUSPICIOUS_KEYWORDS`. |
| 6 | `isTrapLink()` | Suspicious keyword embedded inside the URL query string rather than context text | Returns `true` because Gate 2 evaluates `(href + ' ' + contextText).toLowerCase()`. |
| 7 | `POST /api/v1/report` | Missing `url` in JSON body (`{ title: "Test" }`) | Responds with HTTP `400 Bad Request` and `{ success: false, message: "URL প্রদান করা আবশ্যক" }`. |
| 8 | `POST /api/v1/subscription/verify` | Missing `phoneNumber` or `trxId` | Responds with HTTP `400 Bad Request` and `{ success: false, message: "ফোন নম্বর ও ট্রানজেকশন আইডি দিন" }`. |
| 9 | `POST /api/v1/subscription/verify` | Valid payload with arbitrary phone number and transaction ID | Responds with HTTP `200`, `status: "ACTIVE"`, and expiration set exactly to 30 days from current time. |
| 10 | `backend/server.js` | Port collision (e.g. port 4000 already occupied) | Server throws unhandled `EADDRINUSE` exception on startup. |
| 11 | `windows-client/shuddho-pc-guard.js` | Non-admin user running script | Fails with `EPERM` when trying to modify `C:\Windows\System32\drivers\etc\hosts`. |
| 12 | `windows-client/shuddho-pc-guard.js` | Multiple runs / idempotent check | Checks `content.includes(entry)` before appending; does not create duplicate entries in hosts file. |
| 13 | `web-extension/manifest.json` | Web accessible resource `pages/warning.html` | File does not exist on disk; unpacked load in strict Chrome environments can produce a manifest warning. |
| 14 | `web-extension/popup/popup.html` | Popup opened by user | Displays HTML UI, but `popup.js` logic is never executed due to missing `<script>` tag. |
| 15 | `StealthCalculatorActivity` | User types `1234=` | Intercepts `=` press, detects secret PIN match, and routes to Guard console instead of evaluating math. |

---

## 6. Interface Contracts & Schemas

### 6.1. Backend API Specification

#### Endpoint 1: Health Check
- **Route**: `GET /health`
- **Request Headers**: None
- **Response**:
  - Status: `200 OK`
  - Body:
    ```json
    {
      "status": "OK",
      "service": "Shuddho Guard Cloud Engine",
      "uptime": 12.34
    }
    ```

#### Endpoint 2: Blacklist Sync
- **Route**: `GET /api/v1/blacklist`
- **Request Headers**: None
- **Response**:
  - Status: `200 OK`
  - Body:
    ```json
    {
      "success": true,
      "data": {
        "version": "2026.09.23",
        "domains": [
          "chotikahini.com", "banglachoti.com", "deshiboudi.com",
          "bdchoti.net", "viralvideo24.net", "leakbangla.com"
        ],
        "telegramChannels": [
          "choti_boudi_leak_18", "deshi_mms_zone", "viral_video_bd",
          "gopon_link_adda", "adult_bangla_group"
        ],
        "banglishKeywords": [
          "choti", "boudi", "gopon video", "meye link", "deshi viral",
          "bap beti", "hot boudi", "chuda", "choda", "magi", "khanki"
        ]
      },
      "timestamp": "2026-09-23T16:45:00.000Z"
    }
    ```

#### Endpoint 3: Report Trap Link
- **Route**: `POST /api/v1/report`
- **Request Headers**: `Content-Type: application/json`
- **Request Body**:
  ```json
  {
    "url": "https://t.me/example_bad_link",
    "title": "Optional trap title",
    "reportedBy": "Optional reporter identifier"
  }
  ```
- **Responses**:
  - **Success**: Status `200 OK`
    ```json
    {
      "success": true,
      "message": "ধন্যবাদ! আপনার রিপোর্টটি গৃহীত হয়েছে এবং পর্যালোচনার পর ব্ল্যাকলিস্টে যুক্ত করা হবে।"
    }
    ```
  - **Validation Error**: Status `400 Bad Request`
    ```json
    {
      "success": false,
      "message": "URL প্রদান করা আবশ্যক"
    }
    ```

#### Endpoint 4: Subscription Verification
- **Route**: `POST /api/v1/subscription/verify`
- **Request Headers**: `Content-Type: application/json`
- **Request Body**:
  ```json
  {
    "phoneNumber": "01711000000",
    "trxId": "9J8K7L6M",
    "amount": 50
  }
  ```
- **Responses**:
  - **Success**: Status `200 OK`
    ```json
    {
      "success": true,
      "status": "ACTIVE",
      "plan": "PRO_MONTHLY",
      "expiresAt": "2026-10-23T16:45:00.000Z",
      "message": "অভিনন্দন! আপনার শুদ্ধ গার্ড প্রো সাবস্ক্রিপশন সফলভাবে সক্রিয় হয়েছে।"
    }
    ```
  - **Validation Error**: Status `400 Bad Request`
    ```json
    {
      "success": false,
      "message": "ফোন নম্বর ও ট্রানজেকশন আইডি দিন"
    }
    ```

---

## 7. Inventory of Deficiencies & Recommendations for Next Agents

1. **Root `package.json`**:
   - Currently absent in repo root.
   - Recommended: Add root `package.json` with scripts:
     - `"test:banglish": "node tools/test-banglish-filter.js"`
     - `"test:trap": "node tools/test-trap-detector.js"`
     - `"test:backend": "node backend/test-backend.js"`
     - `"test": "node tools/test-banglish-filter.js && node tools/test-trap-detector.js && node backend/test-backend.js"`

2. **Web Extension Missing File**:
   - `web-extension/manifest.json` lists `"resources": ["pages/warning.html"]`, but `pages/warning.html` is missing.
   - Recommended: Create `web-extension/pages/warning.html` with an informative warning UI consistent with `trap-link-interceptor.js`.

3. **Web Extension Popup Script Tag**:
   - `web-extension/popup/popup.html` lacks `<script src="popup.js"></script>`.
   - Recommended: Add `<script src="popup.js"></script>` before `</body>` in `popup.html`.

4. **Windows Client Elevation Checks**:
   - `windows-client/install-windows-service.bat` and `start-guard.bat` do not check for admin elevation before attempting to modify the hosts file.
   - Recommended: Add standard Windows batch admin self-elevation check (e.g., `net session >nul 2>&1 || (powershell -Command "Start-Process '%~f0' -Verb RunAs" & exit /b)`).

5. **Shared Lexicon Source**:
   - Currently, `BANGLISH_SLANGS` and `SUSPICIOUS_PATTERNS` are declared independently in `tools/test-banglish-filter.js`, `BanglishSlangLexicon.kt`, and `backend/server.js`.
   - Consider a shared JSON schema/file if multi-platform synchronization is expanded.
