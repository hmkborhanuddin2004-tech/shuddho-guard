## 2026-09-24T12:22:34Z
You are Worker M4 for the Shuddho Guard project.
Your working directory is: c:\Users\assdi\Documents\Downloads\shuddho-guard\.agents\teamwork\worker_m4
Project root: c:\Users\assdi\Documents\Downloads\shuddho-guard
Parent Conversation ID: 1568080f-3592-4965-a008-57d3138f1150

MANDATORY FIRST STEP: Read the authoritative user request at:
c:\Users\assdi\Documents\Downloads\shuddho-guard\.agents\teamwork\ORIGINAL_REQUEST.md

Also read:
- c:\Users\assdi\Documents\Downloads\shuddho-guard\.agents\teamwork\orchestrator_1\PROJECT.md
- c:\Users\assdi\Documents\Downloads\shuddho-guard\.agents\teamwork\explorer_survey_3\survey_report.md
- c:\Users\assdi\Documents\Downloads\shuddho-guard\.agents\teamwork\explorer_survey_3\handoff.md

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

YOUR WRITE OWNERSHIP:
You have exclusive write ownership of:
- android/
- tools/test-device-admin-watchdog.js
DO NOT modify web-extension/ or puregram-core/ (owned by other milestones).

YOUR MISSION:
Fulfill Requirement R4 (Iron-Clad Anti-Uninstall & VPN Bypass Watchdog) and its Acceptance Criteria:
1. Tooling Restoration:
   - Restore or generate `android/gradle/wrapper/gradle-wrapper.jar` using the portable gradle binary at `android/.gradle_dist/gradle-8.2/bin/gradle.bat` (run `gradle wrapper --gradle-version 8.2` or copy the wrapper jar from gradle distribution) so that `android/gradlew.bat` executes cleanly.
2. Anti-Uninstall Hardening:
   - In `android/app/src/main/java/com/shuddho/guard/receiver/ShuddhoDeviceAdminReceiver.kt`:
     * Ensure `dpm.setUninstallBlocked(adminComponent, context.packageName, true)` is actively set.
     * Enforce restrictions preventing uninstall, safe boot, and user management (`UserManager.DISALLOW_UNINSTALL_APPS`, `DISALLOW_SAFE_BOOT`, `DISALLOW_CONFIG_VPN`).
3. AppInstallWatcher Rogue VPN Enforcement:
   - In `android/app/src/main/java/com/shuddho/guard/receiver/AppInstallWatcher.kt`:
     * Implement real enforcement in `handleDetectedVpn`: invoke `dpm.setPackagesSuspended(adminComponent, arrayOf(packageName), true)` and `dpm.setApplicationHidden(adminComponent, packageName, true)` when a rogue VPN/proxy or package declaring `BIND_VPN_SERVICE` is detected.
     * Add a signature database of popular rogue VPN packages (TurboVPN, SuperVPN, ThunderVPN, Psiphon, Hola, ExpressVPN, NordVPN, etc.).
4. Real-time Network Interface & VPN Watchdog:
   - Implement / update `android/app/src/main/java/com/shuddho/guard/service/NetworkWatchdogService.kt` (and register in `AndroidManifest.xml`):
     * Monitor active network capabilities via `ConnectivityManager.NetworkCallback` listening for `NetworkCapabilities.TRANSPORT_VPN`.
     * Scan `NetworkInterface.getNetworkInterfaces()` periodically for unauthorized virtual/tun/tap/ppp interfaces.
     * Log and actively block or flag any attempt to route traffic around Shuddho Guard.
5. Automated Test Suite:
   - Implement `tools/test-device-admin-watchdog.js` that programmatically tests:
     * Simulated uninstall prevention logic (`setUninstallBlocked`)
     * Simulated rogue VPN package installation detection and suspension via `AppInstallWatcher`
     * Active VPN network interface detection (`TRANSPORT_VPN` / tun interfaces)
     * Policy enforcement verification
6. Build and Verification:
   - Compile Android application using Gradle (`assembleDebug` or `test`) to ensure 0 build errors.
   - Run `node tools/test-device-admin-watchdog.js` and verify it exits with code 0.
7. Deliver:
   - Write `c:\Users\assdi\Documents\Downloads\shuddho-guard\.agents\teamwork\worker_m4\handoff.md`.
   - Send message to parent (`1568080f-3592-4965-a008-57d3138f1150`).
