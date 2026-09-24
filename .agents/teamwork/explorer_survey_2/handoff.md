# Handoff Report: Pillar 2 (R2 — PureGram Safe Telegram Client)

**Agent ID:** Explorer Survey 2  
**Parent Agent:** `1568080f-3592-4965-a008-57d3138f1150`  
**Working Directory:** `c:\Users\assdi\Documents\Downloads\shuddho-guard\.agents\teamwork\explorer_survey_2`  
**Target Pillar:** Pillar 2 (R2: PureGram — Safe Open-Source Telegram Android Client)  
**Report Type:** Hard Handoff (Investigation Complete)

---

## 1. Observation

### 1.1 Repository & Code Structure
- **Telegram Android Core Source:** `c:\Users\assdi\Documents\Downloads\shuddho-guard\puregram-core`
- **Companion Android App:** `c:\Users\assdi\Documents\Downloads\shuddho-guard\android` (Package: `com.shuddho.guard`, containing `TelegramScreenGuardService.kt` and `BanglishSlangLexicon.kt`)
- **Documentation:** `c:\Users\assdi\Documents\Downloads\shuddho-guard\PUREGRAM_ARCHITECTURE.md` (Repo root; note `docs/PUREGRAM_ARCHITECTURE.md` does not exist, file is at repository root).

### 1.2 Git State in `puregram-core`
- Running `git status` in `c:\Users\assdi\Documents\Downloads\shuddho-guard\puregram-core`:
  ```
  Changes not staged for commit:
      modified:   TMessagesProj/src/main/java/org/telegram/ui/Adapters/SearchAdapterHelper.java
      modified:   TMessagesProj/src/main/java/org/telegram/ui/Components/DialogsChannelsAdapter.java
  ```
- Running `git diff` in `puregram-core` revealed exact modifications:
  1. `TMessagesProj/src/main/java/org/telegram/ui/Adapters/SearchAdapterHelper.java` lines 42–56 and lines 195–196:
     - `PUREGRAM_BANNED_KEYWORDS` array added (16 words: `"choti", "boudi", "gopon", "viral", "leak", "leaked", "18+", "sex", "porn", "casino", "1xbet", "babu88", "jeetbuzz", "mms", "adult", "nude", "সহবাস"`).
     - `isPureGramBlocked(String q)` method added.
     - Line 195: `if (isPureGramBlocked(query)) { return; }`
     - Line 196: `if (false) { ... TLRPC.TL_contacts_search req ... }` wraps contacts search.
  2. `TMessagesProj/src/main/java/org/telegram/ui/Components/DialogsChannelsAdapter.java` line 253:
     - `/* PUREGRAM_DISABLED: নতুন অপরিচিত চ্যানেল খোঁজা ব্লক */`
     - `if (true) return;` inserted directly before `TLRPC.TL_contacts_search req2 = new TLRPC.TL_contacts_search();`.

### 1.3 Submodules & Build Configuration
- Running `git submodule status` in `puregram-core` revealed 13 uninitialized submodules prefixed with `-`:
  ```
  -022d60202e446ad1287b9fb68e687c8a0760788b TMessagesProj/jni/td
  -2b44a3701a4788e1ef866ddc7f143060a3d196c9 TMessagesProj/jni/third_party/boringssl
  -c822f1f33d30591fdbbf3919662be258f7cfbfc6 TMessagesProj_Modules/media
  ```
- Running Gradle in `puregram-core` via `android\.gradle_dist\gradle-8.2\bin\gradle.bat tasks --dry-run` failed immediately with:
  ```
  FAILURE: Build failed with an exception.
  * Where: Settings file 'puregram-core\settings.gradle' line: 18
  * What went wrong: Could not read script 'puregram-core\TMessagesProj_Modules\media\core_settings.gradle' as it does not exist.
  ```
- In contrast, running Gradle in `android/` (`com.shuddho.guard`) via `android\.gradle_dist\gradle-8.2\bin\gradle.bat test --dry-run` succeeded with exit code 0 (`BUILD SUCCESSFUL in 6s`).

### 1.4 Search Purging Gaps
- In `puregram-core/TMessagesProj/src/main/java/org/telegram/ui/Components/DialogsBotsAdapter.java` lines 281–287:
  ```java
  if (!next) {
      loadingBots = true;
      TLRPC.TL_contacts_search req2 = new TLRPC.TL_contacts_search();
      req2.limit = 30;
      req2.bots = true;
      req2.q = this.query;
      ConnectionsManager.getInstance(currentAccount).sendRequestTyped(req2, ...);
  ```
  This is completely unmodified and unblocked. Users searching under the "Bots" tab can query global bots.
- In `puregram-core/TMessagesProj/src/main/java/org/telegram/ui/Adapters/DialogsSearchAdapter.java` line 550:
  ```java
  final TLRPC.TL_messages_searchGlobal req = new TLRPC.TL_messages_searchGlobal();
  ```
  Global message search across public channels remains unmodified and sends unblocked network requests.
- In `puregram-core/TMessagesProj/src/main/java/org/telegram/ui/FilteredSearchView.java` line 665:
  ```java
  final TLRPC.TL_messages_searchGlobal req = new TLRPC.TL_messages_searchGlobal();
  ```
  Global search across Media, Links, and Files remains unblocked.

### 1.5 Sensitive Content Status
- In `puregram-core/TMessagesProj/src/main/java/org/telegram/messenger/MessagesController.java`:
  - Line 24649: `public void setContentSettings(boolean showSensitiveContent)` (sends `TL_account.setContentSettings` to server).
  - Line 24673: `public boolean showSensitiveContent()` returns `contentSettings.sensitive_enabled` or `ignoreRestrictionReasons.contains("sensitive")`.
  - Zero PureGram modifications exist.
- In `puregram-core/TMessagesProj/src/main/java/org/telegram/ui/ThemeActivity.java`:
  - Line 1318–1349: Dialog and age-verification flow allows user to turn sensitive content ON (`showSensitiveContent = true`).
  - Line 2620: `textCheckCell.setTextAndValueAndCheck(...)` displays setting toggle.
  - Zero PureGram modifications exist.
- In `puregram-core/TMessagesProj/src/main/java/org/telegram/ui/ChatActivity.java`:
  - Line 42096: `didPressRevealSensitiveContent(ChatMessageCell cell)` allows revealing sensitive media.
  - Zero PureGram modifications exist.

### 1.6 Automatic Download Status
- In `puregram-core/TMessagesProj/src/main/java/org/telegram/messenger/DownloadController.java`:
  - Line 609: `public boolean canDownloadMedia(MessageObject messageObject)`
  - Line 652: `public int canDownloadMediaType(MessageObject messageObject)`
  - Line 688: `private int canDownloadMediaInternal(MessageObject message, long overrideSize)`
  - Lines 708–736: Resolves `index` (0 = contacts, 1 = non-contacts/unknown users/bots, 2 = unknown group senders, 3 = channels).
  - Lines 756–762: Evaluates `preset.mask[index]`. By default, presets auto-download media from unknown users, non-contact groups, and bots.
  - Zero PureGram modifications exist.

### 1.7 Verification Scripts & NPM Test Baseline
- Running `npm test` in repo root executes:
  `node tools/test-banglish-filter.js && node tools/test-trap-detector.js && node backend/test-backend.js`
  All 23 tests pass with exit code 0.
- **No test script or verification runner exists for PureGram** in `package.json` or `tools/`.
- `tools/patch-puregram-core.js` attempts to patch `SearchAdapterHelper.java` looking for `if (allowUsername) {` and marker `PUREGRAM_DISABLED`, both of which are absent, causing it to fail if executed.

---

## 2. Logic Chain

1. **Premise 1:** Requirement R2 specifies three functional protections: (a) permanent purging of global adult channel and bot search, (b) hard-locking sensitive content filter, and (c) restricting automatic download from unknown groups and bots.
2. **Observation Step (1.4):** While `SearchAdapterHelper.java` and `DialogsChannelsAdapter.java` have channel search blocks, `DialogsBotsAdapter.java` (line 283) still executes `TL_contacts_search` with `bots = true`, and `DialogsSearchAdapter.java` (line 550) still executes `TL_messages_searchGlobal`.
   - **Deduction:** Global bot and public message search are only partially purged; bot discovery is currently wide open.
3. **Observation Step (1.5):** `MessagesController.java`, `ThemeActivity.java`, and `ChatActivity.java` are untouched in `puregram-core`.
   - **Deduction:** Sensitive content filter hard-locking is completely unimplemented (0%).
4. **Observation Step (1.6):** `DownloadController.java` is untouched. Telegram default presets auto-download media for non-contacts and group messages from non-contacts.
   - **Deduction:** Restricting automatic download of media and files from unknown groups and bots is completely unimplemented (0%).
5. **Observation Step (1.3):** `puregram-core/settings.gradle` requires `TMessagesProj_Modules/media/core_settings.gradle`, which does not exist because submodules are uninitialized. A full native build requires NDK 27.2, SDK 36, and 15+ GB of native dependencies.
   - **Deduction:** Building `puregram-core` directly via `./gradlew assembleDebug` in this sandbox is not viable without multi-gigabyte submodule clones and extensive toolchain setup.
6. **Observation Step (1.7):** Acceptance criteria require:
   - "PureGram source modifications, search restrictions, and sensitive content hard-lock pass code integrity and build verification scripts."
   - "All test scripts pass cleanly with zero failures via npm/gradle programmatic runners."
   - **Deduction:** An automated verification runner (`tools/verify-puregram-integrity.js`) must be created, wired into `package.json`, and verify source rules, regex guards, keyword coverage, and simulated logic for all 3 protections.

---

## 3. Caveats

1. **Offline/Sandbox Native Android Compilation:** Full native compilation of the official Telegram Android APK (`tmessages.49`) requires ~15 GB of C++ toolchains, Clang, NDK 27.2, and uninitialized submodules (`ffmpeg`, `boringssl`, `libvpx`, `webrtc`, etc.). Verification of PureGram must focus on source code integrity, AST/regex pattern validation, patch script idempotency, and automated test runners, rather than building the 80MB full release APK locally.
2. **Dual-Layer Architecture:** Shuddho Guard employs both in-app source modifications (`puregram-core`) and an external accessibility watchdog (`TelegramScreenGuardService.kt` in `android/app`). Both layers should remain consistent and share the full Banglish slang keyword lexicon.

---

## 4. Conclusion

1. **Current State:** Pillar 2 (PureGram) is partially started: global channel search blocking exists in 2 files, but bot search purging, sensitive content hard-locking, auto-download restriction, patch script idempotency, and automated test verification are either incomplete or entirely missing.
2. **Implementation Scope:**
   - Modify `SearchAdapterHelper.java`, `DialogsBotsAdapter.java`, `DialogsSearchAdapter.java`.
   - Modify `MessagesController.java`, `ThemeActivity.java`, `ChatActivity.java`.
   - Modify `DownloadController.java`.
   - Fix and standardize `tools/patch-puregram-core.js`.
   - Implement `tools/verify-puregram-integrity.js` and add `"test:puregram"` to `package.json` `npm test`.

---

## 5. Verification Method

To independently verify the survey findings:

1. **Inspect Modified Files & Git Diffs in PureGram:**
   ```powershell
   cd c:\Users\assdi\Documents\Downloads\shuddho-guard\puregram-core
   git status
   git diff
   ```
2. **Inspect Bot Search Gap in `DialogsBotsAdapter.java`:**
   Inspect lines 281–288 of `puregram-core/TMessagesProj/src/main/java/org/telegram/ui/Components/DialogsBotsAdapter.java`.
3. **Inspect Sensitive Content Logic in `MessagesController.java`:**
   Inspect lines 24649–24679 of `puregram-core/TMessagesProj/src/main/java/org/telegram/messenger/MessagesController.java`.
4. **Inspect Auto-Download Logic in `DownloadController.java`:**
   Inspect lines 708–765 of `puregram-core/TMessagesProj/src/main/java/org/telegram/messenger/DownloadController.java`.
5. **Verify Submodule Missing Settings Error:**
   ```powershell
   $env:JAVA_HOME = "c:\Users\assdi\Documents\Downloads\shuddho-guard\android\.jdk\jdk-17.0.10+7"
   $env:PATH = "$env:JAVA_HOME\bin;$env:PATH"
   c:\Users\assdi\Documents\Downloads\shuddho-guard\android\.gradle_dist\gradle-8.2\bin\gradle.bat tasks --dry-run
   # Fails at settings.gradle:18 on TMessagesProj_Modules/media/core_settings.gradle
   ```
6. **Verify Current NPM Test Baseline:**
   ```powershell
   cd c:\Users\assdi\Documents\Downloads\shuddho-guard
   npm test
   # Passes 23 tests across R1, Lexicon, and Backend; confirms absence of PureGram tests
   ```
