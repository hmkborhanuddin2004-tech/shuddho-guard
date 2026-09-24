# 🛡️ Shuddho Guard — Comprehensive Architectural Survey Report
## Pillar 4 (R4: Iron-Clad Anti-Uninstall & VPN Bypass Watchdog) & Test/Build Infrastructure

**Date**: 2026-09-24  
**Investigator**: Survey Explorer 3  
**Working Directory**: `c:\Users\assdi\Documents\Downloads\shuddho-guard\.agents\teamwork\explorer_survey_3`  
**Project Root**: `c:\Users\assdi\Documents\Downloads\shuddho-guard`  

---

## 1. Executive Summary

An exhaustive investigation of the Shuddho Guard repository was performed focusing on **Pillar 4 (R4: Anti-Uninstall & VPN Bypass Watchdog)**, the **automated test suites**, and the **overall build infrastructure**.

### Key Findings Summary:
1. **Pillar 4 Security Core is Incomplete and Partially Stubbed**:
   - Device Admin receiver (`ShuddhoDeviceAdminReceiver.kt`) and XML policies exist, but device owner restrictions (`DISALLOW_UNINSTALL_APPS`, `DISALLOW_CONFIG_VPN`) are only registered in `onProfileProvisioningComplete`, which does not reliably trigger via standard ADB provisioning. Furthermore, specific per-app protection via `DevicePolicyManager.setUninstallBlocked()` is omitted.
   - `AppInstallWatcher.kt` detects packages with `BIND_VPN_SERVICE`, but **its blocking action is a stub** (lines 56–60 only write a boolean flag to `SharedPreferences` without invoking `dpm.setPackagesSuspended()` or `dpm.setApplicationHidden()`). It also ignores already-installed packages, proxy apps, and packages without service permission declarations.
   - Network interface and proxy watchdog logic is **completely missing** from the Android codebase: zero network callback monitors, zero checks for `NetworkCapabilities.TRANSPORT_VPN`, zero interface enumeration (`tun*`, `wg*`, `ppp*`), and zero system proxy detection.
2. **Build Tooling is Operational via Portable Toolchains, but Gradle Wrapper is Broken**:
   - Portable OpenJDK 17 (`android/.jdk/jdk-17.0.10+7`), Gradle 8.2 (`android/.gradle_dist/gradle-8.2`), and Android SDK 34 (`android/.android-sdk`) are fully in place on disk.
   - Building the APK via portable Gradle (`.\android\.gradle_dist\gradle-8.2\bin\gradle.bat -p android assembleDebug`) works cleanly and produces `app-debug.apk` (5.57 MB) in ~7 seconds.
   - **Critical defect**: `android/gradle/wrapper/gradle-wrapper.jar` is missing from the repository, causing `gradlew.bat` to fail with `Error: Unable to access jarfile ... gradle-wrapper.jar`.
3. **Automated Testing Coverage is Severely Deficient Across the 5 Acceptance Criteria**:
   - `npm test` runs 3 simple node scripts (`test-banglish-filter.js`, `test-trap-detector.js`, `backend/test-backend.js`) which pass, but cover only a fraction of requirements.
   - **AC 1 (Trap-link detection)**: Only partially tested; lacks specific test cases for YouTube, TikTok, and Facebook clickbait patterns and URL shorteners.
   - **AC 2 (PureGram integrity & hard-lock)**: No test or verification script exists; sensitive content hard-lock is not implemented.
   - **AC 3 (Social Media NSFW Blur Benchmark)**: Completely missing automated benchmarks, latency timing (<150ms), and automated CSS overlay assertions.
   - **AC 4 (Device Admin & AppInstallWatcher Watchdog)**: Completely missing automated unit/mock tests or simulation runners for uninstall blocking and rogue VPN package interception.
   - **AC 5 (Unified Clean Test Execution)**: Partial; no integrated npm/gradle runner exists to execute all 5 acceptance criteria in a single clean programmatic invocation.

---

## 2. Pillar 4: Anti-Uninstall & VPN Bypass Watchdog Deep Dive

### 2.1 Android Device Admin & Device Owner Policies

#### Identified Code Artifacts:
- **`android/app/src/main/AndroidManifest.xml`**:
  - Line 17: `<uses-permission android:name="android.permission.MANAGE_DEVICE_ADMINS" />`
  - Lines 82–93:
    ```xml
    <receiver
        android:name=".receivers.ShuddhoDeviceAdminReceiver"
        android:permission="android.permission.BIND_DEVICE_ADMIN"
        android:exported="true">
        <meta-data
            android:name="android.app.device_admin"
            android:resource="@xml/device_admin_policies" />
        <intent-filter>
            <action android:name="android.app.action.DEVICE_ADMIN_ENABLED" />
            <action android:name="android.app.action.PROFILE_PROVISIONING_COMPLETE" />
        </intent-filter>
    </receiver>
    ```
- **`android/app/src/main/res/xml/device_admin_policies.xml`**:
  - Declares `<uses-policies>`: `limit-password`, `watch-login`, `reset-password`, `force-lock`, `wipe-data`, `expire-password`, `encrypted-storage`, `disable-camera`, `disable-keyguard-features`.
- **`android/app/src/main/java/com/shuddho/guard/receivers/ShuddhoDeviceAdminReceiver.kt`**:
  - Lines 53–73:
    ```kotlin
    override fun onProfileProvisioningComplete(context: Context, intent: Intent) {
        super.onProfileProvisioningComplete(context, intent)
        applyDeviceOwnerRestrictions(context)
    }

    private fun applyDeviceOwnerRestrictions(context: Context) {
        val dpm = context.getSystemService(Context.DEVICE_POLICY_SERVICE) as? DevicePolicyManager ?: return
        val adminComponent = getAdminComponentName(context)

        if (dpm.isDeviceOwnerApp(context.packageName)) {
            // ১. অ্যাপ আন-ইনস্টল বন্ধ করা
            dpm.addUserRestriction(adminComponent, UserManager.DISALLOW_UNINSTALL_APPS)
            // ২. থার্ড-পার্টি ভিপিএন কনফিগারেশন বন্ধ করা
            dpm.addUserRestriction(adminComponent, UserManager.DISALLOW_CONFIG_VPN)
            // ৩. সেফ-মুডে বুট করা বন্ধ করা
            dpm.addUserRestriction(adminComponent, UserManager.DISALLOW_SAFE_BOOT)
            // ৪. প্রাইভেট ডিএনএস বা ফ্যাক্টরি রিসেট অনুমতি নিয়ন্ত্রণ
            dpm.addUserRestriction(adminComponent, UserManager.DISALLOW_FACTORY_RESET)
        }
    }
    ```
- **`tools/activate-device-owner.bat`**:
  - Executes `adb shell dpm set-device-owner com.shuddho.guard/.receivers.ShuddhoDeviceAdminReceiver`.
- **`android/app/src/main/java/com/shuddho/guard/services/TelegramScreenGuardService.kt`** (Anti-Tamper Layer):
  - Lines 53–76:
    ```kotlin
    private fun inspectSettingsTampering(rootNode: AccessibilityNodeInfo?) {
        // ...
        for (text in textNodes) {
            val str = text.toString().lowercase()
            if (str.contains("calculator") && (str.contains("force stop") || str.contains("uninstall") || str.contains("disable"))) {
                performGlobalAction(GLOBAL_ACTION_HOME)
                return
            }
            if (str.contains("private dns") || str.contains("প্রাইভেট ডিএনএস")) {
                performGlobalAction(GLOBAL_ACTION_BACK)
                return
            }
        }
    }
    ```

#### Deficiencies & Vulnerabilities Identified:
1. **Restricted Triggering of Device Owner Policies**:
   - `applyDeviceOwnerRestrictions` is invoked **only** inside `onProfileProvisioningComplete(context, intent)`.
   - When provisioned via ADB (`adb shell dpm set-device-owner`), Android does not consistently trigger `ACTION_PROFILE_PROVISIONING_COMPLETE` across Android versions (e.g. Android 10–14).
   - If provisioned via ADB, the restrictions are never applied unless explicitly called on startup or `onEnabled`.
2. **Missing `setUninstallBlocked`**:
   - `UserManager.DISALLOW_UNINSTALL_APPS` prevents uninstallation of *any* app across the device. While secure, enterprise-grade Android Device Policy Manager offers `dpm.setUninstallBlocked(adminComponent, context.packageName, true)` which directly and permanently locks Shuddho Guard against uninstallation regardless of other user management policies.
3. **Absence of Administrative PIN/Authorization Challenge**:
   - Requirement R4 states: *"ensuring the application cannot be uninstalled without administrative authorization or a device flash."*
   - Currently, if the app is locked with `DISALLOW_UNINSTALL_APPS`, there is no in-app administrative authorization routine (e.g. In `VaultDashboardActivity`) allowing an authorized guardian/user to enter the master PIN or obtain an unlock key to permit uninstallation.
4. **Onboarding Mismatch**:
   - `MasterOnboardingActivity.kt` requests standard Device Admin (`DevicePolicyManager.ACTION_ADD_DEVICE_ADMIN`). Standard Device Admin without Device Owner status does **not** have permissions to invoke `UserManager.DISALLOW_UNINSTALL_APPS` or `DISALLOW_CONFIG_VPN` (throws a `SecurityException` if attempted). The UI provides no fallback or clear guidance when running as a non-Device-Owner admin.

---

### 2.2 `AppInstallWatcher` Implementation & Rogue Package Interception

#### Identified Code Artifacts:
- **`android/app/src/main/AndroidManifest.xml`**:
  - Line 14: `<uses-permission android:name="android.permission.QUERY_ALL_PACKAGES" />`
  - Lines 96–103:
    ```xml
    <receiver
        android:name=".receivers.AppInstallWatcher"
        android:exported="true">
        <intent-filter>
            <action android:name="android.intent.action.PACKAGE_ADDED" />
            <data android:scheme="package" />
        </intent-filter>
    </receiver>
    ```
- **`android/app/src/main/java/com/shuddho/guard/receivers/AppInstallWatcher.kt`**:
  - Lines 25–61:
    ```kotlin
    private fun checkIfVpnOrBypassTool(context: Context, packageName: String) {
        try {
            val pm = context.packageManager
            val packageInfo = pm.getPackageInfo(
                packageName,
                PackageManager.GET_SERVICES or PackageManager.GET_PERMISSIONS
            )

            val services = packageInfo.services
            var isVpn = false
            if (services != null) {
                for (service in services) {
                    if (service.permission == "android.permission.BIND_VPN_SERVICE") {
                        isVpn = true
                        break
                    }
                }
            }

            if (isVpn) {
                Log.w("ShuddhoGuard", "⚠️ বিপজ্জনক ছদ্মবেশী ভিপিএন শনাক্ত হয়েছে: $packageName")
                handleDetectedVpn(context, packageName)
            }
        } catch (e: Exception) {
            Log.e("ShuddhoGuard", "প্যাকেজ স্ক্যানে ত্রুটি: ${e.message}")
        }
    }

    private fun handleDetectedVpn(context: Context, packageName: String) {
        val sharedPrefs = context.getSharedPreferences("shuddho_shield", Context.MODE_PRIVATE)
        sharedPrefs.edit().putBoolean("blocked_pkg_$packageName", true).apply()
    }
    ```

#### Critical Gaps & Incomplete Logic:
1. **Execution Stub (Zero Blocking Action)**:
   - `handleDetectedVpn` only writes `blocked_pkg_$packageName = true` to `SharedPreferences`. It performs **no enforcement action**.
   - With Device Owner privileges, the receiver should immediately call:
     - `dpm.setPackagesSuspended(adminComponent, arrayOf(packageName), true)` to disable execution and gray out the app icon.
     - `dpm.setApplicationHidden(adminComponent, packageName, true)` to completely hide the rogue app.
     - Or trigger silent uninstallation via `PackageInstaller`.
   - Without Device Owner privileges, it should at least alert the user, trigger a persistent foreground warning notification, or use accessibility to prevent opening.
2. **Narrow Inspection Scope**:
   - `AppInstallWatcher` only inspects newly added packages when `ACTION_PACKAGE_ADDED` fires.
   - It **does not scan already-installed apps** when Shuddho Guard is installed or booted.
   - It only checks if a service declares `android.permission.BIND_VPN_SERVICE` as its service permission attribute. However:
     - Rogue VPNs or proxies can declare the action `android.net.VpnService` within an `<intent-filter>` without setting the explicit attribute.
     - SOCKS5/HTTP proxy tools (Psiphon, Orbot, Shadowsocks, V2ray, Clash, Lantern, HTTP Custom) often run background proxies without creating a native Android `VpnService` interface.
     - A blacklist / signature lexicon of known bypass packages and keywords (e.g. `vpn`, `proxy`, `tunnel`, `shadowsocks`, `wireguard`, `openvpn`, `v2ray`, `clash`, `turbovpn`, `supervpn`, `nordvpn`, `expressvpn`) is missing.

---

### 2.3 Network Interface, VPN & Proxy Detection and Blocking

#### Identified Code Artifacts:
- **`android/app/src/main/java/com/shuddho/guard/services/ShuddhoVpnService.kt`**:
  - Lines 38–66: Implements a local VPN engine that configures DNS servers (`185.228.168.10`, `1.1.1.3`, `2606:4700:4700::1113`) to enforce SafeSearch and adult content blocking.

#### Critical Gaps in Bypass Watchdog:
1. **No Active Network Watchdog Service**:
   - In Android, only one `VpnService` can be active at any time. When a third-party VPN is launched by the user, Android calls `ShuddhoVpnService.onRevoke()`.
   - Currently, `onRevoke()` in `ShuddhoVpnService.kt` (lines 68–74) simply logs a warning and closes the interface:
     ```kotlin
     override fun onRevoke() {
         super.onRevoke()
         Log.w("ShuddhoGuard", "⚠️ ভিপিএন পারমিশন প্রত্যাহার করা হয়েছে।")
         vpnInterface?.close()
         vpnInterface = null
         isRunning = false
     }
     ```
   - There is no recovery watchdog, no auto-re-establishment loop, and no alert or emergency lockdown when the protection VPN is detached.
2. **Missing Network Interface Enumeration**:
   - There is no routine checking `java.net.NetworkInterface.getNetworkInterfaces()` to detect unauthorized tunnel adapters (`tun*`, `tap*`, `ppp*`, `p2p*`, `wg*`).
3. **Missing ConnectivityManager Capabilities Check**:
   - No `ConnectivityManager.NetworkCallback` or `getActiveNetwork()` inspection checking for `NetworkCapabilities.TRANSPORT_VPN` belonging to external packages.
4. **Missing Proxy Detection**:
   - No inspection of system HTTP/HTTPS proxy properties (`http.proxyHost`, `http.proxyPort`), `ProxySelector.getDefault()`, or `Settings.Global.HTTP_PROXY`.
5. **Missing Device Policy Enforcement for VPN**:
   - Device Owner apps can set `dpm.setAlwaysOnVpnPackage(adminComponent, context.packageName, true /* lockdown */)`. When lockdown is enabled, the Android OS natively blocks all network traffic if the Shuddho VPN is not running and prevents any other app from establishing a VPN!
   - This API call is currently completely absent.

---

## 3. Test and Build Infrastructure Deep Dive

### 3.1 Project Structure & Existing Runners

```
shuddho-guard/
├── .agents/                    # Agent metadata & reports
├── android/                    # Android Kotlin Project
│   ├── .android-sdk/           # Portable Android SDK (API 34, Build Tools 34.0.0) [EXISTS]
│   ├── .gradle_dist/           # Portable Gradle 8.2 distribution [EXISTS]
│   ├── .jdk/                   # Portable OpenJDK 17.0.10+7 [EXISTS]
│   ├── app/                    # App module
│   │   ├── build.gradle        # App Gradle configuration (compileSdk 34, minSdk 24)
│   │   └── src/main/           # Android source code (NO test/ or androidTest/ directories)
│   ├── build.gradle            # Root Gradle configuration
│   ├── gradlew.bat             # Gradle wrapper batch (BROKEN: missing wrapper jar)
│   └── local.properties        # Configured to local .android-sdk
├── backend/                    # Node.js backend server
│   ├── server.js               # Cloud API (port 4000)
│   └── test-backend.js         # HTTP API integration test
├── puregram-core/              # Fork of Telegram Android client (TMessagesProj)
├── tools/                      # Setup & testing scripts
│   ├── activate-device-owner.bat
│   ├── build-apk.yml
│   ├── build-bundle.js
│   ├── create-png-icons.js
│   ├── patch-puregram-core.js
│   ├── setup-portable-gradle.js
│   ├── setup-portable-jdk.js
│   ├── setup-portable-sdk.js
│   ├── test-banglish-filter.js # Lexicon test script
│   └── test-trap-detector.js   # Link filter test script
├── web-extension/              # Chrome Web Extension (Manifest V3)
│   ├── manifest.json
│   ├── popup/
│   └── scripts/
│       ├── ai-vision-blur.js
│       ├── background.js
│       └── trap-link-interceptor.js
├── windows-client/             # Windows native protection scripts
├── package.json                # Project root npm scripts
└── README.md
```

### 3.2 Root `package.json` Test Scripts

In `package.json`:
```json
"scripts": {
  "test": "node tools/test-banglish-filter.js && node tools/test-trap-detector.js && node backend/test-backend.js",
  "test:banglish": "node tools/test-banglish-filter.js",
  "test:trap": "node tools/test-trap-detector.js",
  "test:backend": "node backend/test-backend.js",
  "start:backend": "node backend/server.js",
  "start:pc": "node windows-client/shuddho-pc-guard.js"
}
```

#### Test Execution Verification:
All three currently registered scripts run and pass cleanly:
1. `node tools/test-banglish-filter.js`: 7/7 tests pass (testing Banglish explicit terms vs educational/sports clean text).
2. `node tools/test-trap-detector.js`: 10/10 tests pass (testing 1xBet, t.me channels, adult links, shorteners, false positives for `1windows.com` and `at.me`).
3. `node backend/test-backend.js`: 6/6 endpoints pass (`/health`, `/blacklist`, `/report`, `/subscription/verify`, `/api/v1/health`, `/api/v1/blacklist`).

### 3.3 Gradle Build & Test Execution Status

1. **Gradle Wrapper Status**:
   - `gradlew.bat` in `android/` fails:
     ```
     Error: Unable to access jarfile C:\Users\assdi\Documents\Downloads\shuddho-guard\android\\gradle\wrapper\gradle-wrapper.jar
     ```
   - Cause: `gradle-wrapper.jar` was never committed or generated into `android/gradle/wrapper/`.
2. **Portable Gradle Direct Execution**:
   - Using the installed portable distribution:
     ```powershell
     $env:JAVA_HOME="c:\Users\assdi\Documents\Downloads\shuddho-guard\android\.jdk\jdk-17.0.10+7"
     $env:ANDROID_HOME="c:\Users\assdi\Documents\Downloads\shuddho-guard\android\.android-sdk"
     .\android\.gradle_dist\gradle-8.2\bin\gradle.bat -p android assembleDebug
     ```
   - **Result**: `BUILD SUCCESSFUL in 7s` — produces `android/app/build/outputs/apk/debug/app-debug.apk` (5,574,888 bytes).
3. **Gradle Unit Test Execution**:
   - Executing `.\android\.gradle_dist\gradle-8.2\bin\gradle.bat -p android test`:
     - `> Task :app:compileDebugUnitTestKotlin NO-SOURCE`
     - `> Task :app:testDebugUnitTest NO-SOURCE`
     - `BUILD SUCCESSFUL in 17s`
   - **Result**: There are **zero** unit test classes in the Android module (`src/test` does not exist).

---

## 4. Evaluation of the 5 Acceptance Criteria

| # | Acceptance Criterion | Current Status | Existing Coverage & Assets | Identified Gaps & Deficiencies | Required Next Steps |
|---|----------------------|----------------|----------------------------|--------------------------------|---------------------|
| **AC 1** | **Trap-link detection engine passes automated test suite covering YouTube, TikTok, and Facebook clickbait patterns and URL shorteners** | **PARTIAL** | `tools/test-trap-detector.js` (10 tests), `web-extension/scripts/trap-link-interceptor.js` | Test cases lack explicit YouTube clickbait/shorts URLs, TikTok profile redirect chains, and Facebook sponsored post formats. The test script duplicates code rather than testing the real interceptor module. | Expand `test-trap-detector.js` to include YouTube, TikTok, and Facebook specific fixtures and URL shortener chains; export/import shared detector logic. |
| **AC 2** | **PureGram source modifications, search restrictions, and sensitive content hard-lock pass code integrity and build verification scripts** | **MISSING / INCOMPLETE** | `tools/patch-puregram-core.js`, `puregram-core/` files (`SearchAdapterHelper.java`, `DialogsChannelsAdapter.java`) | No automated integrity or verification test exists. Sensitive content filter hard-lock (`sensitive_content` lock) is not implemented in PureGram. Unknown group/bot media auto-download restrictions are not implemented. | Implement sensitive content filter hard-lock in PureGram; create automated verification script `tools/test-puregram-integrity.js` and add to test runner. |
| **AC 3** | **Social media NSFW blur engine passes automated synthetic image benchmarks with <150ms classification latency and verifiable CSS/view overlay application** | **MISSING** | `web-extension/scripts/ai-vision-blur.js`, `simulator/index.html` (manual UI only) | No automated synthetic image benchmark exists. Latency (<150ms) is not programmatically measured. CSS class and DOM overlay insertion are not verified via automated unit/integration tests. | Create automated test suite `tools/test-nsfw-blur-engine.js` using synthetic pixel buffers / test images, measuring execution timing (<150ms) and verifying DOM mutations and CSS rules. |
| **AC 4** | **Android Device Admin policies and `AppInstallWatcher` successfully detect and block simulated uninstalls and rogue VPN packages** | **MISSING / UNTESTED** | `ShuddhoDeviceAdminReceiver.kt`, `AppInstallWatcher.kt` | `AppInstallWatcher` only logs to SharedPreferences without actual package suspension/hiding. Zero automated simulation or JVM unit tests exist. No tests for uninstall prevention or rogue package handling. | 1. Implement actual package suspension/blocking in `AppInstallWatcher` and add `setUninstallBlocked` to admin receiver.<br>2. Add JVM/Node simulation test suite `tools/test-device-admin-watchdog.js` and/or Android JUnit tests in `android/app/src/test/`. |
| **AC 5** | **All test scripts pass cleanly with zero failures via npm/gradle programmatic runners** | **PARTIAL** | `npm test` runs 3 scripts; `gradle test` runs but has `NO-SOURCE` | `npm test` only covers 3 legacy files; AC 1–4 are not all covered. `gradlew.bat` is broken due to missing jar. No programmatic master runner runs both npm and gradle tests in a single command. | 1. Generate/restore `gradle-wrapper.jar`.<br>2. Create a unified programmatic test runner (e.g. `npm run test:all` or `tools/run-all-tests.js`) that invokes all test suites across all 5 ACs and completes with code 0. |

---

## 5. Component Inventory: Implemented, Partial, and Missing

### Implemented Components (Functional):
1. **Core Slang & Link Analysis Engine**:
   - `android/app/src/main/java/com/shuddho/guard/filters/BanglishSlangLexicon.kt`
   - `tools/test-banglish-filter.js`
   - `tools/test-trap-detector.js`
   - `web-extension/scripts/trap-link-interceptor.js`
2. **Backend API & Service**:
   - `backend/server.js` (endpoints `/health`, `/blacklist`, `/report`, `/subscription/verify`, `/api/v1/*`)
   - `backend/test-backend.js`
3. **Android Application Skeleton & Local DNS VPN**:
   - `android/app/src/main/AndroidManifest.xml`
   - `android/app/src/main/java/com/shuddho/guard/services/ShuddhoVpnService.kt`
   - `android/app/src/main/java/com/shuddho/guard/ui/StealthCalculatorActivity.kt`
   - `android/app/src/main/java/com/shuddho/guard/ui/MasterOnboardingActivity.kt`
   - `android/app/src/main/java/com/shuddho/guard/ui/VaultDashboardActivity.kt`
   - Successful build of `app-debug.apk` via portable Gradle & JDK.
4. **Accessibility-Based Tamper Mitigation**:
   - `android/app/src/main/java/com/shuddho/guard/services/TelegramScreenGuardService.kt` (blocks Telegram slang searches and settings tampering via HOME/BACK injection).
5. **Windows Native Security Engine**:
   - `windows-client/shuddho-pc-guard.js`
   - `windows-client/shuddho-pc-engine.ps1` (Hosts file protection, SafeSearch enforcement, DNS adapter config).

### Partial Components (Requiring Hardening & Fixes):
1. **Device Admin & Device Owner Policies**:
   - `ShuddhoDeviceAdminReceiver.kt`: Needs invocation of `applyDeviceOwnerRestrictions()` outside `onProfileProvisioningComplete`, inclusion of `setUninstallBlocked()`, and an administrative password challenge path.
2. **`AppInstallWatcher`**:
   - `AppInstallWatcher.kt`: Needs actual DevicePolicyManager suspension/hiding (`setPackagesSuspended`, `setApplicationHidden`) instead of dummy SharedPreferences storage; needs package signature and keyword heuristic scanning.
3. **PureGram Modification Script**:
   - `tools/patch-puregram-core.js`: Patches search helper and channel adapter, but lacks sensitive content filter hard-lock and media auto-download restriction.
4. **Web Extension NSFW Blur Engine**:
   - `web-extension/scripts/ai-vision-blur.js`: Has DOM mutation observer and skin tone heuristic, but lacks automated test harness and latency verification.

### Missing Components (Must be Implemented to Pass Criteria):
1. **Network Interface & Proxy Watchdog**:
   - Continuous network monitor service in Android checking for `NetworkCapabilities.TRANSPORT_VPN`, unauthorized `tun*` interfaces, and active system proxies.
   - Enforcement of `dpm.setAlwaysOnVpnPackage(adminComponent, packageName, true)`.
2. **Automated Test Suites**:
   - `tools/test-nsfw-blur-engine.js`: Synthetic image latency benchmark (<150ms) and CSS overlay verification (AC 3).
   - `tools/test-puregram-integrity.js`: Verifies PureGram source patches, search restrictions, and sensitive content hard-lock (AC 2).
   - `tools/test-device-admin-watchdog.js` or JVM unit test: Verifies Device Admin policies, simulated uninstalls, and rogue VPN package detection/blocking (AC 4).
   - Expanded `tools/test-trap-detector.js`: Comprehensive coverage for YouTube, TikTok, and Facebook clickbait patterns and URL shorteners (AC 1).
3. **Gradle Wrapper Binary**:
   - `android/gradle/wrapper/gradle-wrapper.jar` missing, blocking standard `./gradlew` execution.
4. **Master Programmatic Test Runner**:
   - Integrated npm script (`npm run test:all`) that runs all tests and builds with zero failures (AC 5).

---

## 6. Recommendations & Implementation Roadmap

1. **Immediate Infrastructure Restoration**:
   - Generate `gradle-wrapper.jar` via `gradle wrapper` so standard `gradlew.bat` commands function in CI and developer environments.
2. **Pillar 4 Enforcement Hardening**:
   - Update `ShuddhoDeviceAdminReceiver.kt`:
     - Apply restrictions when `isDeviceOwnerApp` is detected on `onEnabled` or app startup.
     - Call `dpm.setUninstallBlocked(adminComponent, packageName, true)`.
     - Implement `dpm.setAlwaysOnVpnPackage(adminComponent, packageName, true)`.
   - Update `AppInstallWatcher.kt`:
     - When a rogue VPN/proxy package is detected, call `dpm.setPackagesSuspended(adminComponent, arrayOf(packageName), true)` and `dpm.setApplicationHidden(adminComponent, packageName, true)`.
     - Add signature list of known VPN/proxy package prefixes (`org.torproject.android`, `com.wireguard.android`, `de.blinkt.openvpn`, `com.v2ray.ang`, `com.github.kr328.clash`, `com.northghost.touchvpn`, `free.vpn.unblock.proxy.turbovpn`, etc.).
     - Add on-boot scan of all installed packages (`pm.getInstalledPackages()`).
   - Add Network & Proxy Watchdog component in Android:
     - Register `ConnectivityManager.NetworkCallback` to detect rogue VPN connections and re-assert Shuddho VPN dominance.
3. **Automated Test Suite Expansion**:
   - Create synthetic image benchmark script (`test-nsfw-blur-engine.js`) verifying <150ms classification and CSS overlay injection.
   - Create PureGram integrity check script (`test-puregram-integrity.js`) validating search purges and sensitive content lock.
   - Create Watchdog simulator script (`test-device-admin-watchdog.js`) verifying uninstall protection logic and package suspension logic.
   - Wire all tests into root `package.json` under `"test"` and `"test:all"`.
