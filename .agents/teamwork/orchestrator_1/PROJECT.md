# Project: Shuddho Guard Ecosystem

## Architecture
Shuddho Guard consists of four core defense pillars protecting users from digital harms across web browsers, social media, messaging, and system-level Android OS:
1. **Web Extension (`web-extension/` and `extension/`)**:
   - `trap-link-interceptor.js`: Intercepts malicious, betting (1xBet, 1win, Babu88, Melbet, Betway, 22 brands), adult, and Telegram trap links, unwrapping platform redirect shims on YouTube, Facebook, Instagram, and TikTok (up to 10 levels with multi-pass decode).
   - `ai-vision-blur.js`: Real-time on-device visual safety classifier blurring explicit/revealing media with <1.72ms latency (P99 0.52ms), tamper-watchdog MutationObserver, and applying verifiable CSS overlays (`.shuddho-blurred-media`, `.shuddho-shield-badge`).
   - `background.js` & `popup/`: Event routing, blocking counters synchronization (`trapsBlocked`, `mediaBlurred`, `blurredCount`), and user controls.
2. **PureGram Android Client (`puregram-core/`)**:
   - Hardened Telegram Android fork with purged global channel and bot search, hard-locked sensitive content filters (un-toggleable, tap-to-reveal disabled), and restricted automatic media downloads from unknown groups/bots.
3. **Android Device Watchdog (`android/`)**:
   - Device Administration & Device Owner policies locking uninstallation (`dpm.setUninstallBlocked`).
   - `AppInstallWatcher.kt` actively detecting and suspending rogue VPN and proxy applications (`dpm.setPackagesSuspended`, `dpm.setApplicationHidden`).
   - Network watchdog (`NetworkWatchdogService.kt`) monitoring active network interfaces and `TRANSPORT_VPN` bypasses while distinguishing benign Wi-Fi Direct.
4. **Automated Verification Harness (`tools/`, `package.json`, Gradle)**:
   - Programmatic test runners covering trap-link platform patterns, PureGram AST/code integrity, NSFW synthetic benchmark (<150ms latency), and Device Admin watchdog simulation. Unified in `tools/run-all-tests.js`.

## Feature Inventory
| # | Feature | Description | Milestone | Source | Status |
|---|---------|-------------|-----------|--------|--------|
| 1 | F1.1 | Recursive platform redirect unwrapping (YouTube, Facebook, Instagram, TikTok) | M1 | Survey O2 | DONE |
| 2 | F1.2 | Betting brand regex hardening (1xBet, 1win, Babu88 variants, prefixes/suffixes) | M1 | Survey O3 | DONE |
| 3 | F1.3 | Adult, gambling, and Telegram trap redirect list detection | M1 | Survey O2 | DONE |
| 4 | F1.4 | In-page trap alert modal and navigation interception | M1 | Survey O1 | DONE |
| 5 | F1.5 | Extension messaging and storage counter synchronization (`blurredCount`, `trapsBlocked`) | M1 | Survey O9 | DONE |
| 6 | F2.1 | Global channel and public search purge in PureGram | M2 | Survey O1 | DONE |
| 7 | F2.2 | Global bot search purge in `DialogsBotsAdapter.java` | M2 | Survey O1 | DONE |
| 8 | F2.3 | Sensitive content filter hard-lock in `MessagesController`, `ThemeActivity`, and `ChatActivity` | M2 | Survey O2 | DONE |
| 9 | F2.4 | Restrict auto-download of media from unknown groups/bots in `DownloadController.java` | M2 | Survey O3 | DONE |
| 10 | F2.5 | PureGram code integrity verification script (`tools/verify-puregram-integrity.js`) | M2 | Survey O5 | DONE |
| 11 | F3.1 | Lightweight on-device visual safety classifier with <150ms latency | M3 | Survey O5 | DONE |
| 12 | F3.2 | Cross-origin image handling to eliminate canvas taint errors | M3 | Survey O6 | DONE |
| 13 | F3.3 | Video frame inspection & removal of blanket 100% video blur | M3 | Survey O7 | DONE |
| 14 | F3.4 | Verifiable CSS blur and shield badge overlay application | M3 | Survey O8 | DONE |
| 15 | F3.5 | Synthetic image benchmark suite (`tools/test-nsfw-blur-engine.js`) asserting <150ms latency | M3 | Survey O8 | DONE |
| 16 | F4.1 | Device Admin & Device Owner uninstall protection (`setUninstallBlocked`) | M4 | Survey O5 | DONE |
| 17 | F4.2 | `AppInstallWatcher` enforcement (`setPackagesSuspended`, `setApplicationHidden`) | M4 | Survey O4 | DONE |
| 18 | F4.3 | Active network interface and VPN/proxy bypass watchdog | M4 | Survey O6 | DONE |
| 19 | F4.4 | Gradle wrapper jar restoration (`android/gradle/wrapper/gradle-wrapper.jar`) | M4 | Survey O1 | DONE |
| 20 | F4.5 | Device Admin & Watchdog automated test harness (`tools/test-device-admin-watchdog.js`) | M4 | Survey O7 | DONE |
| 21 | F5.1 | Comprehensive E2E test suite and programmatic runners passing all 5 acceptance criteria | M5 | ORIGINAL_REQUEST | DONE |
| 22 | F6.1 | Final Acceptance Verification & Adversarial Coverage Hardening | M6 | ORIGINAL_REQUEST | DONE |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| 1 | M1: Trap-Link Interceptor | F1.1, F1.2, F1.3, F1.4, F1.5 | none | DONE |
| 2 | M2: PureGram Safe Client | F2.1, F2.2, F2.3, F2.4, F2.5 | none | DONE |
| 3 | M3: AI NSFW Blur Engine | F3.1, F3.2, F3.3, F3.4, F3.5 | none | DONE |
| 4 | M4: Watchdog & Device Admin | F4.1, F4.2, F4.3, F4.4, F4.5 | none | DONE |
| 5 | M5: E2E Testing Suite | Test infra, Tier 1-4 suites for all pillars | M1, M2, M3, M4 | DONE |
| 6 | M6: Final Verification & Audit | 100% E2E test pass & adversarial coverage hardening | M5 | DONE |

## Interface Contracts
### Web Extension ↔ Browser Pages
- Content script injects `#shuddho-trap-modal` or intercepts `click` events on links with risk assessment `{ isHarmful: boolean, reason: string, matchedPattern: string, targetUrl: string, unwrappedUrl: string }`.
- Blur engine applies `.shuddho-blurred-media` and `.shuddho-shield-badge` (with interactive user toggle and tamper watchdog).
- Chrome runtime messaging: Action names `trap_blocked` and `media_blurred`; storage keys `trapsBlocked`, `mediaBlurred`, `blurredCount`.

### PureGram Core ↔ Telegram Client
- `SearchAdapterHelper`: `TL_contacts_search` permanently disabled with `if (false)` and public channel queries filtered against `BanglishSlangLexicon` + gambling/adult lexicons.
- `DialogsBotsAdapter`: `TL_contacts_search` with `bots = true` intercepted with `if (true) return;`.
- `MessagesController`: `showSensitiveContent()` returns `false` unconditionally; `setContentSettings()` rejects enable requests.
- `ThemeActivity`: Sensitive content toggle row removed (`sensitiveContentRow = -1`) and click handler intercepts with `if (true) return;`.
- `ChatActivity`: `didPressRevealSensitiveContent` blocked with security notification bulletin.
- `DownloadController`: `canDownloadMediaInternal` for non-contacts/unknown groups/bots strictly returns `0`.

### Android Watchdog ↔ OS Device Policy
- `ShuddhoDeviceAdminReceiver`: Calls `dpm.setUninstallBlocked(adminComponent, packageName, true)` on startup and restricts uninstallation, safe boot, and user management.
- `AppInstallWatcher`: Calls `dpm.setPackagesSuspended(adminComponent, arrayOf(packageName), true)` and `dpm.setApplicationHidden` upon detecting rogue VPNs or `BIND_VPN_SERVICE`.
- `NetworkWatchdogService`: Registers `ConnectivityManager.NetworkCallback` listening for `NetworkCapabilities.TRANSPORT_VPN` and audits network interfaces while distinguishing benign Wi-Fi Direct.

## Code Layout
- `web-extension/` and `extension/` (100% SHA-256 synced):
  - `manifest.json`: Web extension manifest V3
  - `scripts/trap-link-interceptor.js`: Trap-link detection logic
  - `scripts/ai-vision-blur.js`: On-device AI NSFW vision classification & blur
  - `scripts/background.js`: Service worker
  - `popup/`: Popup UI
  - `pages/`: Warning page
- `puregram-core/`:
  - `TMessagesProj/src/main/java/org/telegram/ui/`: Java source modifications for search, sensitive filter, download restrictions
  - `tools/patch-puregram-core.js`: Deterministic source patching utility
- `android/`:
  - `app/src/main/java/com/shuddho/guard/receiver/AppInstallWatcher.kt`: Install & VPN watchdog
  - `app/src/main/java/com/shuddho/guard/receiver/ShuddhoDeviceAdminReceiver.kt`: Device Admin policies
  - `app/src/main/java/com/shuddho/guard/service/NetworkWatchdogService.kt`: Interface & proxy monitoring
  - `gradle/wrapper/gradle-wrapper.jar`: Gradle wrapper binary
- `tools/`:
  - `test-trap-detector.js`: Automated tests for trap-link detection (35 tests)
  - `verify-puregram-integrity.js`: PureGram source integrity & AST verification (33 tests)
  - `test-nsfw-blur-engine.js`: Synthetic benchmark (<150ms) and overlay test suite (33 tests)
  - `test-device-admin-watchdog.js`: Simulated uninstall and rogue VPN blocking test suite (74 tests)
  - `test-banglish-filter.js`: Banglish slang and keyword test suite (7 tests)
  - `run-all-tests.js`: Programmatic master runner (188 tests)
