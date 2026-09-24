# Handoff Report — Survey Explorer 3
## Focus: Pillar 4 (R4: Anti-Uninstall & VPN Bypass Watchdog) & Test/Build Infrastructure

**Date**: 2026-09-24  
**Agent**: Survey Explorer 3 (`.agents/teamwork/explorer_survey_3`)  
**Parent**: `1568080f-3592-4965-a008-57d3138f1150`  
**Handoff Type**: Hard (Investigation complete)  

---

### 1. Observation

1. **Gradle Wrapper Failure**:
   - Running `.\gradlew.bat --version` inside `android/` failed with:
     ```
     Error: Unable to access jarfile C:\Users\assdi\Documents\Downloads\shuddho-guard\android\\gradle\wrapper\gradle-wrapper.jar
     ```
   - Inspecting `android/gradle/wrapper/` revealed only `gradle-wrapper.properties` (250 bytes); `gradle-wrapper.jar` does not exist on disk.
2. **Direct Portable Gradle Build**:
   - Executed:
     ```powershell
     $env:JAVA_HOME="c:\Users\assdi\Documents\Downloads\shuddho-guard\android\.jdk\jdk-17.0.10+7"
     $env:ANDROID_HOME="c:\Users\assdi\Documents\Downloads\shuddho-guard\android\.android-sdk"
     .\android\.gradle_dist\gradle-8.2\bin\gradle.bat -p android assembleDebug
     ```
   - Result: Exited with code 0 (`BUILD SUCCESSFUL in 7s`), producing `android/app/build/outputs/apk/debug/app-debug.apk` (5,574,888 bytes).
3. **Android Test Execution**:
   - Executed:
     ```powershell
     .\android\.gradle_dist\gradle-8.2\bin\gradle.bat -p android test
     ```
   - Result: Exited with code 0, but logged:
     ```
     > Task :app:compileDebugUnitTestKotlin NO-SOURCE
     > Task :app:compileDebugUnitTestJavaWithJavac NO-SOURCE
     > Task :app:testDebugUnitTest NO-SOURCE
     > Task :app:testReleaseUnitTest NO-SOURCE
     ```
     Directory search confirmed no `src/test/` or `src/androidTest/` directory exists under `android/app/`.
4. **`AppInstallWatcher.kt` (Lines 46–60)**:
   - Observed code:
     ```kotlin
     if (isVpn) {
         Log.w("ShuddhoGuard", "⚠️ বিপজ্জনক ছদ্মবেশী ভিপিএন শনাক্ত হয়েছে: $packageName")
         // এখানে অ্যাপটির বিরুদ্ধে তাৎক্ষণিক ডিফেন্স কার্যকর হবে
         handleDetectedVpn(context, packageName)
     }
     ...
     private fun handleDetectedVpn(context: Context, packageName: String) {
         // Device Owner সক্রিয় থাকলে সরাসরি এই প্যাকেজটিকে সাসপেন্ড বা ব্লক করে দেওয়া হবে
         val sharedPrefs = context.getSharedPreferences("shuddho_shield", Context.MODE_PRIVATE)
         sharedPrefs.edit().putBoolean("blocked_pkg_$packageName", true).apply()
     }
     ```
   - Zero DevicePolicyManager (`setPackagesSuspended`, `setApplicationHidden`) calls are made.
5. **`ShuddhoDeviceAdminReceiver.kt` (Lines 53–73)**:
   - Observed that `applyDeviceOwnerRestrictions(context)` is only called inside `onProfileProvisioningComplete(context: Context, intent: Intent)`:
     ```kotlin
     override fun onProfileProvisioningComplete(context: Context, intent: Intent) {
         super.onProfileProvisioningComplete(context, intent)
         applyDeviceOwnerRestrictions(context)
     }
     ```
   - `dpm.setUninstallBlocked(adminComponent, context.packageName, true)` is absent.
   - `dpm.setAlwaysOnVpnPackage(adminComponent, context.packageName, true)` is absent.
6. **Network Interface and Proxy Monitoring**:
   - `grep_search` across `android/` for `NetworkCapabilities`, `NetworkInterface`, `ConnectivityManager`, `ProxyInfo`, and `proxy` returned 0 results.
   - `ShuddhoVpnService.kt` lines 68–74:
     ```kotlin
     override fun onRevoke() {
         super.onRevoke()
         Log.w("ShuddhoGuard", "⚠️ ভিপিএন পারমিশন প্রত্যাহার করা হয়েছে।")
         vpnInterface?.close()
         vpnInterface = null
         isRunning = false
     }
     ```
7. **Existing Test Suites**:
   - Root `package.json` scripts:
     `"test": "node tools/test-banglish-filter.js && node tools/test-trap-detector.js && node backend/test-backend.js"`
   - Executing `node tools/test-banglish-filter.js`: 7/7 passed.
   - Executing `node tools/test-trap-detector.js`: 10/10 passed.
   - Executing `node backend/test-backend.js`: 6/6 passed.
   - Zero test suites exist for AC 2 (PureGram integrity/hard-lock), AC 3 (NSFW blur <150ms benchmark & CSS overlay), or AC 4 (Device Admin & AppInstallWatcher simulated uninstalls & rogue VPN blocking).

---

### 2. Logic Chain

1. **Premise 1 (Tooling)**: Based on Observation 1 and 2, while the portable toolchains (JDK 17, Gradle 8.2, Android SDK 34) function properly and can build the debug APK, `gradlew.bat` cannot run because `gradle-wrapper.jar` was omitted. Any automated CI or developer command invoking `./gradlew` or `gradlew.bat` will fail unless the wrapper jar is restored or commands use the portable Gradle binary directly.
2. **Premise 2 (Unit Testing Vacuum in Android)**: Based on Observation 3, Gradle reports `NO-SOURCE` for test tasks. There are zero unit tests asserting Device Admin policies, broadcast receivers, or VPN service behavior.
3. **Premise 3 (Incomplete Enforcement in Pillar 4)**:
   - Based on Observation 4, `AppInstallWatcher.kt` identifies packages declaring `BIND_VPN_SERVICE`, but its reaction is confined to saving a flag in `SharedPreferences`. It neither blocks nor suspends nor uninstalls the detected application.
   - Based on Observation 5, Device Owner restrictions are gated entirely behind `onProfileProvisioningComplete`, which does not reliably fire during standard ADB provisioning (`adb shell dpm set-device-owner`). Furthermore, the app does not invoke `setUninstallBlocked` to specifically safeguard itself against removal.
   - Based on Observation 6, the Android layer completely lacks runtime network interface and proxy watchdog logic. When a bypass VPN is initiated by a user, `ShuddhoVpnService` simply revokes itself without counter-measures or restoration.
4. **Premise 4 (Acceptance Criteria Gaps)**:
   - Based on Observation 7, the existing automated tests in `package.json` only address Banglish slang filtering, 10 general link patterns, and basic backend endpoints.
   - AC 1 is only partially covered (missing YouTube, TikTok, and Facebook clickbait fixtures).
   - AC 2, AC 3, and AC 4 have no automated test scripts or benchmarks whatsoever.
   - AC 5 cannot be met until all 5 criteria have dedicated programmatic test suites that pass cleanly.

---

### 3. Caveats

1. Native C++ / JNI build tasks in `puregram-core/TMessagesProj/jni/` were not compiled; only Java/Kotlin source layers and JavaScript patch scripts were surveyed.
2. ADB physical device interaction could not be executed directly in this environment, as no active physical Android device was connected over USB (`adb devices` was not invoked with hardware attached). However, static code analysis and offline Gradle compilation provided full visibility.
3. No code modifications were made during this investigation, strictly preserving read-only survey discipline.

---

### 4. Conclusion

The foundational scaffolding for Pillar 4 and project build infrastructure is in place, but requires targeted engineering to become fully operational and pass all 5 acceptance criteria:
1. **Infrastructure**: Restore `gradle-wrapper.jar` in `android/gradle/wrapper/` so standard Gradle wrapper commands execute cleanly.
2. **Pillar 4 Hardening**:
   - Wire real enforcement into `AppInstallWatcher.kt` via `DevicePolicyManager.setPackagesSuspended()` and `setApplicationHidden()`.
   - Add a known rogue VPN/proxy signature list and scanning of pre-existing installed packages.
   - Invoke `applyDeviceOwnerRestrictions()` and `dpm.setUninstallBlocked()` on app startup/enablement.
   - Add active network interface monitoring (`ConnectivityManager.NetworkCallback` and interface scanning) to detect and block third-party VPN tunnels and proxies.
3. **Automated Testing Suite Creation**:
   - Expand `tools/test-trap-detector.js` with YouTube, TikTok, and Facebook clickbait patterns (AC 1).
   - Create `tools/test-puregram-integrity.js` verifying search purges and sensitive content lock (AC 2).
   - Create `tools/test-nsfw-blur-engine.js` benchmarking classification latency (<150ms) and asserting DOM/CSS overlay behavior (AC 3).
   - Create `tools/test-device-admin-watchdog.js` and/or Android JUnit tests verifying uninstall blocking and rogue VPN suspension (AC 4).
   - Unify all test suites under `npm test` / `npm run test:all` to pass with exit code 0 (AC 5).

---

### 5. Verification Method

To independently reproduce and verify the findings:
1. **Verify Gradle Wrapper failure**:
   Run: `cd android && .\gradlew.bat --version`
   *Expected result*: `Error: Unable to access jarfile ... gradle-wrapper.jar`.
2. **Verify Portable Gradle APK build**:
   Run:
   ```powershell
   $env:JAVA_HOME="c:\Users\assdi\Documents\Downloads\shuddho-guard\android\.jdk\jdk-17.0.10+7"; .\android\.gradle_dist\gradle-8.2\bin\gradle.bat -p android assembleDebug
   ```
   *Expected result*: `BUILD SUCCESSFUL` in under 10 seconds.
3. **Verify Android Unit Test absence**:
   Run:
   ```powershell
   $env:JAVA_HOME="c:\Users\assdi\Documents\Downloads\shuddho-guard\android\.jdk\jdk-17.0.10+7"; .\android\.gradle_dist\gradle-8.2\bin\gradle.bat -p android test
   ```
   *Expected result*: `compileDebugUnitTestKotlin NO-SOURCE`, `testDebugUnitTest NO-SOURCE`.
4. **Verify Existing Tests**:
   Run: `npm test`
   *Expected result*: Passes 7 Banglish tests, 10 link filter tests, and 6 backend tests.
5. **Inspect Detailed Survey Report**:
   Read `c:\Users\assdi\Documents\Downloads\shuddho-guard\.agents\teamwork\explorer_survey_3\survey_report.md`.
