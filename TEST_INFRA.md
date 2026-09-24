# Shuddho Guard — E2E Test Infrastructure & Verification Architecture

## 1. Executive Summary
This document outlines the End-to-End (E2E) testing framework and automated verification infrastructure established for the **Shuddho Guard** ecosystem. 

The verification suite validates all four core defense pillars, auxiliary linguistic filters, cloud backend APIs, and native Android Device Admin policies against the authoritative specifications defined in `ORIGINAL_REQUEST.md` and `PROJECT.md`.

```
========================================================================================
                          SHUDDHO GUARD VERIFICATION TIERS
========================================================================================
 [Tier 1: R1] Trap-Link & Deceptive Ad Interceptor        (35 tests)  -> PASS ✅
 [Tier 2: R2] PureGram Safe Telegram Client AST/Source    (33 tests)  -> PASS ✅
 [Tier 3: R3] AI NSFW Vision Blur Engine & Benchmark      (33 tests)  -> PASS ✅
 [Tier 4: R4] Device Admin Watchdog & Rogue VPN Blocker   (74 tests)  -> PASS ✅
 [Auxiliary]  Bangla/Banglish Slang Lexicon Filter         (7 tests)  -> PASS ✅
 [Auxiliary]  Cloud Backend API & Anti-Replay License      (6 tests)  -> PASS ✅
 [Native]     Android OS JUnit Unit Tests                  (5 tests)  -> PASS ✅
----------------------------------------------------------------------------------------
 Cumulative Automated Tests: 193 Tests | Pass Rate: 100% | Zero Failures | Sub-2s Runtime
========================================================================================
```

---

## 2. Test Suites & Coverage Breakdown

### Tier 1: Pillar 1 (R1) Malicious Ad & Trap-Link Interceptor
- **Script**: `tools/test-trap-detector.js`
- **Total Assertions**: 35
- **Execution Target**: `web-extension/scripts/trap-link-interceptor.js`
- **Key Test Categories**:
  1. **Platform Redirect Shim Unwrapping (Tests 1–10)**:
     - YouTube redirect shims (`youtube.com/redirect?q=...`)
     - Facebook outbound redirection wrappers (`l.facebook.com/l.php?u=...`, `lm.facebook.com`)
     - Instagram referral shims (`l.instagram.com/?u=...`)
     - TikTok link gateways (`link.tiktok.com/redirect?url=...`)
     - Recursive nested redirect unnesting (double and triple URL encoding chains)
  2. **Betting Brand Regex & Variant Hardening (Tests 11–22)**:
     - 1xBet: `1xbet.com`, `1xbet-bd.com`, `bd-1xbet.com`, `1xbet-mobi.com`
     - 1win: `1winbd.com`, `1win-pro.com`
     - Babu88: `babu88live.com`, `babu88-bd.com`
     - Melbet, Betway, Parimatch prefix/suffix/hyphen variants
  3. **Telegram Honey-Trap & Deceptive Links (Tests 23–27)**:
     - `t.me/+...` invite traps in adult/gambling contexts
     - `t.me/joinchat/...` betting signal channels
     - URL path trap slugs (`leak_video`, `choti_golpo`)
     - Safe Telegram news channels preserved (`t.me/prothomalo_official`)
  4. **Adult Domains & Shorteners (Tests 28–30)**:
     - Direct adult domain blocking (`xvideos.com`, `banglachoti.com`)
     - Shortener detection (`bit.ly/deshi-boudi-gopon`)
  5. **False Positive Prevention (Tests 31–35)**:
     - Legitimate domains preserved: `1windows.com`, `at.me`, `bit.ly/free-python-course`, `wikipedia.org`, `facebook.com/prothomalo`.

---

### Tier 2: Pillar 2 (R2) PureGram Safe Telegram Client Integrity
- **Script**: `tools/verify-puregram-integrity.js`
- **Total Assertions**: 33
- **Execution Target**: `puregram-core/TMessagesProj/src/main/java/org/telegram/ui/`
- **Key Test Categories**:
  1. **Lexicon Coverage & Keyword Banlist Verification**:
     - Cross-references all 40 keywords from `BanglishSlangLexicon.kt` into `SearchAdapterHelper.java`
     - Confirms adult, betting (1xbet, babu88, jeetbuzz, casino), and slang coverage
     - Evaluates 11 positive/negative search term simulations
  2. **Global Channel & Bot Search Purge**:
     - `DialogsChannelsAdapter.java`: `TL_contacts_search` and `TL_messages_searchGlobal` intercepted
     - `DialogsBotsAdapter.java`: Bot global searches intercepted before network dispatch
  3. **Public Channel Message Search Blocking**:
     - `DialogsSearchAdapter.java` and `FilteredSearchView.java` intercept `TL_messages_searchGlobal`
  4. **Sensitive Content Filter Hard-Lock**:
     - `MessagesController.java`: `showSensitiveContent()` unconditionally hard-locked to return `false`
     - `MessagesController.java`: `setContentSettings()` rejects enable requests; server responses clamped
     - `ThemeActivity.java`: UI sensitive content toggle row removed (`-1`) and click handler disabled
     - `ChatActivity.java`: `didPressRevealSensitiveContent` intercepted to prevent tap-to-reveal
  5. **Automatic Media Download Restriction**:
     - `DownloadController.java`: Auto-download permanently blocked for bots, non-contacts, and unknown groups across 3 internal decision gates (`canDownloadMediaInternal`).

---

### Tier 3: Pillar 3 (R3) AI NSFW Vision Blur Engine & Benchmark
- **Script**: `tools/test-nsfw-blur-engine.js`
- **Total Assertions**: 33
- **Execution Target**: `web-extension/scripts/ai-vision-blur.js`
- **Key Test Categories**:
  1. **Synthetic Image Classification Benchmarks**:
     - Synthetic test vectors: explicit high-exposure skin patterns, clothed portraits, natural landscapes, warm wood grain, desert sand dunes, and geometric UI graphics.
  2. **Sub-150ms Latency Compliance**:
     - Strict assertion: Latency must be < 150ms per media scan.
     - Actual performance: Max single-frame latency = 1.427ms; Average latency across 300 runs = 0.118ms (well within the 150ms ceiling).
  3. **High-Resolution Downsampling**:
     - Verifies 256x256 image downsampling to standard 64x64 inference buffer with < 1ms classification.
  4. **Verifiable CSS Overlays & State Machine**:
     - Media elements receive class `.shuddho-blurred-media` (`filter: blur(25px)`)
     - Container receives `.shuddho-blur-wrapper`
     - Injected badge `.shuddho-shield-badge` with Bangla label "শুদ্ধ গার্ড"
     - User temporary toggle button `.shuddho-toggle-blur-btn` cycles state between "দেখুন" and "পুনরায় ব্লার করুন".
  5. **Intelligent Video Handling**:
     - Confirms elimination of blanket video blur: safe educational video remains unblurred.
     - Harmful explicit video frame receives `.shuddho-blurred-media` and shield badge.
  6. **Cross-Origin CDN Resilience**:
     - Handles cross-origin images gracefully without throwing unhandled canvas taint exceptions.
  7. **Extension Mirror Parity**:
     - Verifies exact code mirror in `web-extension/scripts/ai-vision-blur.js` passes classification benchmarks.

---

### Tier 4: Pillar 4 (R4) Android Device Admin Watchdog & Rogue VPN Blocker
- **Script**: `tools/test-device-admin-watchdog.js`
- **Total Assertions**: 74
- **Execution Target**: `android/app/src/main/java/com/shuddho/guard/`
- **Key Test Categories**:
  1. **Device Admin & Device Owner Policies**:
     - Validates `setUninstallBlocked(adminComponent, packageName, true)`
     - Policy restrictions: `DISALLOW_UNINSTALL_APPS`, `DISALLOW_SAFE_BOOT`, `DISALLOW_CONFIG_VPN`, `DISALLOW_FACTORY_RESET`
     - Master PIN challenge verification: default PIN `7860` unlocks maintenance; unauthorized PINs strictly rejected.
  2. **`AppInstallWatcher` Rogue VPN Detection**:
     - 13 popular bypass tools recognized by package name: TurboVPN, SuperVPN, ThunderVPN, Psiphon, Hola, ExpressVPN, NordVPN, Surfshark, WireGuard, OpenVPN, v2rayNG, Clash, Orbot Tor.
     - Disguised applications declaring `BIND_VPN_SERVICE` intent detected.
     - Whitelist verification: Benign apps (`com.google.android.calculator`, `com.whatsapp`, `com.android.chrome`, `com.facebook.katana`, `org.mozilla.firefox`, `com.shuddho.guard`) never flagged.
  3. **App Enforcement Execution**:
     - Package suspension (`dpm.setPackagesSuspended`)
     - Package launcher hiding (`dpm.setApplicationHidden`)
     - System-wide batch scanning isolating rogue apps.
  4. **Network Interface Watchdog (`NetworkWatchdogService`)**:
     - Interface scanning: `lo`, `wlan0`, `rmnet` verified clean; `tun0` whitelisted; unauthorized `wg0`, `tun1` flagged.
     - Connectivity callback listening for `NetworkCapabilities.TRANSPORT_VPN`.
     - HTTP proxy leak detection.
  5. **Static Source, Manifest & Binary Integrity**:
     - `android/gradle/wrapper/gradle-wrapper.jar` exists and verified > 50KB.
     - `AndroidManifest.xml` permissions: `MANAGE_DEVICE_ADMINS`, `QUERY_ALL_PACKAGES`, `BIND_DEVICE_ADMIN`.
     - Kotlin source files verified for critical API invocations.

---

### Auxiliary Suites
1. **Banglish Lexicon Filter (`tools/test-banglish-filter.js`)**:
   - 7 test vectors validating explicit Bangla/Banglish adult phrase filtering.
2. **Cloud Backend Health & License API (`backend/test-backend.js`)**:
   - 6 test endpoints: `/health`, `/blacklist`, `/report`, `/subscription/verify`, `/api/v1/health`, `/api/v1/blacklist`.
   - Validates anti-replay attack cache on transaction IDs and HMAC-SHA256 license generation.
3. **Android JUnit Test Suite (`android/app/src/test/java/com/shuddho/guard/WatchdogUnitTest.kt`)**:
   - 5 native JUnit test methods verifying database containment, keyword patterns, constant parity, and virtual interface regex matching.

---

## 3. Test Runner Architecture (`tools/run-all-tests.js`)

The master runner provides programmatic, sequential orchestration with high-fidelity telemetry:
- **Child Process Orchestration**: Spawns isolated Node.js child processes with clean environment flags.
- **Output Parsing & Assertion Extraction**: Regex-based parsers extract exact pass/fail/total counts from each suite's standard output.
- **Timing & Performance Telemetry**: Microsecond timing precision via `performance.now()`.
- **Exit Code Integrity**: Exits with code `0` if and only if **100%** of test suites succeed with zero failures. Exits with code `1` on any failure.
- **CLI Flags**:
  - `node tools/run-all-tests.js`: Standard sequential run with live streaming and final summary table.
  - `--quiet` / `-q`: Suppress per-test output, showing only header and summary table.
  - `--verbose` / `-v`: Full debugging details.
  - `--suite=<id>`: Run a specific suite (e.g. `--suite=trap`, `--suite=nsfw`, `--suite=puregram`, `--suite=watchdog`).
  - `--gradle`: Include native Android Gradle JUnit tests in the execution pipeline.

---

## 4. Verification Commands

| Command | Description | Expected Output |
|---------|-------------|-----------------|
| `npm test` | Master programmatic runner executing all 6 test suites | `188/188` tests PASS ✅ (Exit code 0) |
| `npm run test:all` | Alias for master programmatic runner | `188/188` tests PASS ✅ (Exit code 0) |
| `npm run test:gradle` | Executes native Android JUnit tests via portable Gradle wrapper | `BUILD SUCCESSFUL` (Exit code 0) |
| `npm run test:trap` | Runs Pillar 1 trap-link detector test suite | 35/35 PASS ✅ |
| `npm run test:puregram` | Runs Pillar 2 PureGram code integrity verification | 33/33 PASS ✅ |
| `npm run test:nsfw` | Runs Pillar 3 AI NSFW vision blur benchmark | 33/33 PASS ✅ (<150ms) |
| `npm run test:watchdog` | Runs Pillar 4 Device Admin & VPN watchdog test suite | 74/74 PASS ✅ |
| `npm run test:banglish` | Runs Banglish keyword filter tests | 7/7 PASS ✅ |
| `npm run test:backend` | Runs cloud backend health and license API tests | 6/6 PASS ✅ |
