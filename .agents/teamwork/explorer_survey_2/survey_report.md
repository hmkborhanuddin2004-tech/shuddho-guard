# Comprehensive Survey Report: Pillar 2 (R2 — PureGram Safe Telegram Client)

**Investigator:** Survey Explorer 2  
**Date:** 2026-09-24  
**Project:** Shuddho Guard  
**Target Focus:** Pillar 2 (R2: PureGram — Safe Open-Source Telegram Android Client)  
**Target Repository:** `c:\Users\assdi\Documents\Downloads\shuddho-guard`

---

## 1. Executive Summary

Pillar 2 (R2) mandates establishing a customized, secure build configuration and code modification based on the official Telegram Android repository (`puregram-core/`), delivering:
1. **Permanent purging of global adult channel and bot search**.
2. **Hard-locking sensitive content filter so it cannot be disabled**.
3. **Restricting automatic download of media and files from unknown groups and bots**.
4. **Code integrity and build verification scripts passing cleanly with zero failures via npm/gradle programmatic runners**.

### High-Level Audit Verdict:
- **Global Search Purging:** **PARTIAL (35%)**. Global channel username search in `SearchAdapterHelper.java` is disabled via `if (false)`, keyword filtering is active for 16 words, and channel discovery in `DialogsChannelsAdapter.java` has `if (true) return;`. However, global bot search in `DialogsBotsAdapter.java` is **completely unblocked**, global message search in `DialogsSearchAdapter.java` and `FilteredSearchView.java` is unblocked, and the patch tool `tools/patch-puregram-core.js` is desynchronized and fails on re-run.
- **Sensitive Content Hard-Lock:** **MISSING (0%)**. `MessagesController.java`, `ThemeActivity.java`, and `ChatActivity.java` have zero PureGram modifications. Sensitive content can be enabled in settings and revealed via cell tap in chats.
- **Restricting Auto-Download:** **MISSING (0%)**. `DownloadController.java` is unpatched. Standard Telegram presets automatically download photos and media from non-contacts, unknown groups, and bots.
- **Build & Verification Tooling:** **MISSING (15%)**. `puregram-core` cannot be built directly via Gradle because Git submodules (`TMessagesProj_Modules/media`, `TMessagesProj/jni/*`) are uninitialized, causing `settings.gradle` to fail immediately. Furthermore, there is **no PureGram verification script** in `tools/` and no entry in `package.json` `npm test`.

---

## 2. Codebase Structure & Component Inventory

The repository contains two distinct Android-related directories:

| Component | Path | Purpose | Key Details |
|---|---|---|---|
| **PureGram Core** | `puregram-core/` | Official Telegram Android fork | Android Gradle Plugin 8.13.2, compileSdk 36, NDK 27.2. Contains `TMessagesProj`, `TMessagesProj_App`, etc. |
| **Shuddho Guard Companion App** | `android/` | System Watchdog & Accessibility Screen Guard | `com.shuddho.guard`, compileSdk 34. Houses `TelegramScreenGuardService.kt` (Accessibility watcher) and `BanglishSlangLexicon.kt`. |
| **Architecture Documentation** | `PUREGRAM_ARCHITECTURE.md` | Core specification document (located at repo root) | Details rationale, disabled global search in `SearchAdapterHelper.java`, keyword banlist, and `DialogsChannelsAdapter.java`. |
| **Master Plan** | `OVERNIGHT_MASTER_PLAN.md` | Strategic plan covering the 5 pillars | Refers to Phase 4 (Telegram inspector + Banglish slang lexicon). |
| **Patch Automation Script** | `tools/patch-puregram-core.js` | Node.js script intended to inject modifications into `puregram-core/` | Desynchronized with current working copy state; only covers 2 files. |
| **All-in-One Source Bundle** | `ALL_CODE_BUNDLE.md` | Bundled repository source snapshot | Includes `tools/patch-puregram-core.js` and `PUREGRAM_ARCHITECTURE.md` under section 3. |

---

## 3. Deep-Dive Requirement Analysis

### 3.1 Requirement R2.1: Permanent Purging of Global Adult Channel and Bot Search

#### Current Observations:
1. **`SearchAdapterHelper.java` (`puregram-core/TMessagesProj/src/main/java/org/telegram/ui/Adapters/SearchAdapterHelper.java`)**:
   - Lines 43–55: Added static banlist and helper:
     ```java
     private static final String[] PUREGRAM_BANNED_KEYWORDS = {
         "choti", "boudi", "gopon", "viral", "leak", "leaked", "18+", "sex", "porn",
         "casino", "1xbet", "babu88", "jeetbuzz", "mms", "adult", "nude", "সহবাস"
     };
     private boolean isPureGramBlocked(String q) {
         if (q == null) return false;
         String lower = q.toLowerCase();
         for (String kw : PUREGRAM_BANNED_KEYWORDS) {
             if (lower.contains(kw)) return true;
         }
         return false;
     }
     ```
   - Lines 195–196:
     ```java
     if (isPureGramBlocked(query)) { return; } // PUREGRAM: ক্ষতিকর কি-ওয়ার্ড ব্লক
     if (false) { // PUREGRAM: গ্লোবাল পাবলিক চ্যানেল সার্চ স্থায়ীভাবে নিষ্ক্রিয়
         if (query.length() > 0) {
             TLRPC.TL_contacts_search req = new TLRPC.TL_contacts_search();
             ...
         }
     }
     ```
     This blocks `TL_contacts_search` inside `SearchAdapterHelper`.

2. **`DialogsChannelsAdapter.java` (`puregram-core/TMessagesProj/src/main/java/org/telegram/ui/Components/DialogsChannelsAdapter.java`)**:
   - Lines 251–254:
     ```java
     loadingChannels = true;
     // PUREGRAM_DISABLED: নতুন অপরিচিত চ্যানেল খোঁজা ব্লক
     if (true) return;
     TLRPC.TL_contacts_search req2 = new TLRPC.TL_contacts_search();
     ```
     This successfully blocks channel discovery in the channels search list.

#### Identified Gaps & Deficiencies:
1. **Bot Search is NOT Purged (`DialogsBotsAdapter.java`)**:
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
     `req2.bots = true` is executed with zero restrictions. Users searching under the "Bots" tab can query, discover, and interact with global adult bots.
2. **Global Message Search Across Public Channels is NOT Purged**:
   - In `DialogsSearchAdapter.java` line 550:
     ```java
     final TLRPC.TL_messages_searchGlobal req = new TLRPC.TL_messages_searchGlobal();
     req.broadcasts_only = (currentMessagesFilter.flags & 2) != 0;
     req.q = query;
     ```
     `TL_messages_searchGlobal` is still triggered when the user types in the main search bar and switches to messages. It queries public messages across all Telegram public channels.
   - In `FilteredSearchView.java` line 665:
     ```java
     final TLRPC.TL_messages_searchGlobal req = new TLRPC.TL_messages_searchGlobal();
     ```
     Users searching across Media, Links, Files, and Audio can still pull global public posts.
   - In `HashtagSearchController.java` line 199:
     ```java
     TLRPC.TL_messages_searchGlobal req = new TLRPC.TL_messages_searchGlobal();
     ```
     Hashtag searches (e.g., `#choti`, `#18+`) send global requests.
3. **Keyword List Discrepancy**:
   - `SearchAdapterHelper.java` has 16 keywords.
   - `BanglishSlangLexicon.kt` (in `android/app`) has 28+ keywords and pattern rules (`xxx`, `xvideos`, `xnxx`, `pornhub`, `hot boudi`, `bhabi choti`, etc.). The two lists are out of sync.
4. **Patch Script Desynchronization (`tools/patch-puregram-core.js`)**:
   - `patch-puregram-core.js` searches for `if (allowUsername) {` to replace it, but `SearchAdapterHelper.java` was already modified to `if (isPureGramBlocked(query)) { return; } if (false) {`.
   - Running `node tools/patch-puregram-core.js` outputs:
     `❌ if (allowUsername) { টার্গেট পাওয়া যায়নি — প্যাচ বাদ।`
   - It also defines `const MARKER = 'PUREGRAM_DISABLED';`, which is absent from `SearchAdapterHelper.java` (it has `PUREGRAM SHIELD` instead).

---

### 3.2 Requirement R2.2: Hard-Locking Sensitive Content Filter

#### Current Observations:
- In `puregram-core`, no modifications exist for sensitive content. `git diff` shows only `SearchAdapterHelper.java` and `DialogsChannelsAdapter.java` have changes.
- The standard Telegram Android codebase controls sensitive content at four distinct points:

1. **`MessagesController.java` (`puregram-core/TMessagesProj/src/main/java/org/telegram/messenger/MessagesController.java`)**:
   - Line 24649:
     ```java
     public void setContentSettings(boolean showSensitiveContent) {
         if (contentSettings != null) {
             if (!contentSettings.sensitive_can_change) {
                 return;
             }
             contentSettings.sensitive_enabled = showSensitiveContent;
         }
         ...
         TL_account.setContentSettings req = new TL_account.setContentSettings();
         req.sensitive_enabled = showSensitiveContent;
         getConnectionsManager().sendRequest(req, ...);
     }
     ```
   - Line 24673:
     ```java
     public boolean showSensitiveContent() {
         if (contentSettings != null && System.currentTimeMillis() - contentSettingsLoadedTime < 1000 * 60 * 60) {
             return contentSettings.sensitive_enabled;
         }
         return ignoreRestrictionReasons == null || ignoreRestrictionReasons.contains("sensitive");
     }
     ```
2. **`MessageObject.java` (`puregram-core/TMessagesProj/src/main/java/org/telegram/messenger/MessageObject.java`)**:
   - Line 692:
     ```java
     public boolean isHiddenSensitive() {
         return isSensitive() && !MessagesController.getInstance(currentAccount).showSensitiveContent();
     }
     ```
3. **`ThemeActivity.java` (`puregram-core/TMessagesProj/src/main/java/org/telegram/ui/ThemeActivity.java`)**:
   - Line 1318–1349:
     When `position == sensitiveContentRow`, if `!getMessagesController().showSensitiveContent()`, it shows a confirmation dialog and prompts `verifyAge(...)` to toggle `showSensitiveContent` to `true`.
   - Line 2620:
     ```java
     textCheckCell.setTextAndValueAndCheck(getString(R.string.ShowSensitiveContent), getString(R.string.ShowSensitiveContentInfo), getMessagesController().showSensitiveContent(), true, true);
     ```
4. **`ChatActivity.java` (`puregram-core/TMessagesProj/src/main/java/org/telegram/ui/ChatActivity.java`)**:
   - Line 42096:
     ```java
     public void didPressRevealSensitiveContent(ChatMessageCell cell) {
         if (!getMessagesController().showSensitiveContent()) {
             ...
             alert.setPositiveButton(getString(R.string.MessageShowSensitiveContentButton), (di, w) -> {
                 ...
                 cell.startRevealMedia();
             });
         }
     }
     ```

#### Required Modifications for Hard-Locking:
1. **`MessagesController.java`**:
   - `showSensitiveContent()` must unconditionally return `false`:
     ```java
     public boolean showSensitiveContent() {
         return false; // PUREGRAM: সংবেদনশীল কন্টেন্ট প্রদর্শন চিরতরে হার্ড-লকড (অফ)
     }
     ```
   - `setContentSettings(boolean showSensitiveContent)` must ignore requests to enable sensitive content:
     ```java
     public void setContentSettings(boolean showSensitiveContent) {
         if (showSensitiveContent) return; // PUREGRAM: ফিল্টার নিষ্ক্রিয় করা সম্পূর্ণ নিষিদ্ধ
         ...
     }
     ```
2. **`ThemeActivity.java`**:
   - Prevent the user from toggling `sensitiveContentRow`, or set `sensitiveContentRow = -1` so the setting does not appear, or display an immutable notice: "PureGram-এ সংবেদনশীল কন্টেন্ট ফিল্টার স্থায়ীভাবে সক্রিয় এবং অপরিবর্তনীয়।"
3. **`ChatActivity.java`**:
   - In `didPressRevealSensitiveContent`, immediately return or display a warning banner that sensitive content is permanently disabled by PureGram security policy.

---

### 3.3 Requirement R2.3: Restricting Automatic Download of Media and Files from Unknown Groups and Bots

#### Current Observations:
- In `puregram-core`, no modifications exist in `DownloadController.java`.
- Telegram determines automatic download in `DownloadController.java` (`puregram-core/TMessagesProj/src/main/java/org/telegram/messenger/DownloadController.java`):

1. **Auto-Download Decision Gate**:
   - Line 609: `public boolean canDownloadMedia(MessageObject messageObject)`
   - Line 652: `public int canDownloadMediaType(MessageObject messageObject)`
   - Line 688: `private int canDownloadMediaInternal(MessageObject message, long overrideSize)`
2. **Peer Resolution Logic in `canDownloadMediaInternal` (Lines 708–736)**:
   ```java
   int index;
   TLRPC.Peer peer = msg.peer_id;
   if (peer != null) {
       if (peer.user_id != 0) {
           if (getContactsController().contactsDict.containsKey(peer.user_id)) {
               index = 0; // Known contact (1-on-1)
           } else {
               index = 1; // Non-contact / Unknown user / Bot
           }
       } else if (peer.chat_id != 0) {
           if (msg.from_id instanceof TLRPC.TL_peerUser && getContactsController().contactsDict.containsKey(msg.from_id.user_id)) {
               index = 0; // Group message from known contact
           } else {
               index = 2; // Group message from unknown sender
           }
       } else {
           TLRPC.Chat chat = msg.peer_id.channel_id != 0 ? getMessagesController().getChat(msg.peer_id.channel_id) : null;
           if (ChatObject.isChannel(chat) && chat.megagroup) {
               if (msg.from_id instanceof TLRPC.TL_peerUser && getContactsController().contactsDict.containsKey(msg.from_id.user_id)) {
                   index = 0; // Megagroup message from known contact
               } else {
                   index = 2; // Megagroup message from unknown sender
               }
           } else {
               index = 3; // Channels
           }
       }
   }
   ```
3. **Preset Application (Lines 756–762)**:
   Telegram applies `preset.mask[index]`. By default, presets allow auto-downloading photos and files even when `index == 1` (unknown users/bots) or `index == 2` (unknown group senders).

#### Required Modifications for Restricting Auto-Download:
1. **Bot Detection & Blocking**:
   If the message sender is a bot, reject automatic download unconditionally:
   ```java
   if (peer != null && peer.user_id != 0) {
       TLRPC.User u = getMessagesController().getUser(peer.user_id);
       if (u != null && u.bot) return 0; // PUREGRAM: বট থেকে কোনো অটো-ডাউনলোড হবে না
   }
   if (msg.from_id instanceof TLRPC.TL_peerUser) {
       TLRPC.User sender = getMessagesController().getUser(msg.from_id.user_id);
       if (sender != null && sender.bot) return 0;
   }
   ```
2. **Unknown Groups and Unknown Users Restriction**:
   When `index == 1` (non-contact/unknown user) or `index == 2` (unknown group sender):
   Return `0` (block auto-download). This forces media and files to only be downloaded when the user explicitly clicks/taps on them:
   ```java
   // PUREGRAM: অপরিচিত গ্রুপ ও বট থেকে অটো-ডাউনলোড সম্পূর্ণ নিষিদ্ধ
   if (index == 1 || index == 2) {
       return 0;
   }
   ```

---

### 3.4 Requirement R2.4: Build Configuration, Gradle Setup, and Tooling

#### Observations on `puregram-core` Build Infrastructure:
1. **Gradle Build Files**:
   - `puregram-core/build.gradle`: Android Gradle Plugin 8.13.2, Kotlin 2.1.0.
   - `puregram-core/TMessagesProj/build.gradle`: compileSdkVersion 36, buildToolsVersion '36.0.0', ndkVersion '27.2.12479018', CMake 3.22.1 with native targets `tmessages.49`.
2. **Missing Submodule Build Files (Hard Blocker for Direct Gradle Build)**:
   - `puregram-core/settings.gradle` line 18:
     ```groovy
     apply from: file("TMessagesProj_Modules/media/core_settings.gradle")
     ```
   - Running `gradle` in `puregram-core` immediately fails with:
     ```
     FAILURE: Build failed with an exception.
     * Where: Settings file 'puregram-core\settings.gradle' line: 18
     * What went wrong: Could not read script 'TMessagesProj_Modules\media\core_settings.gradle' as it does not exist.
     ```
   - Git submodule status confirms 13 submodules are uninitialized (`jni/td`, `boringssl`, `dav1d`, `ffmpeg`, `libvpx`, `libyuv`, `openh264`, `xiph/*`, `tlottie`, `jlatexmath`, `TMessagesProj_Modules/media`).
3. **Environment & Platform Limitations**:
   - `puregram-core` does not include `gradlew.bat` (only Unix `gradlew`).
   - The portable Android SDK installed in `android/.android-sdk` only contains platform 34 and build-tools 34, whereas `puregram-core` requires SDK 36 and NDK 27.2.
   - A full native C++ compilation of Telegram Android requires 15+ GB of SDK/NDK/tools and extensive build time.
4. **Companion App (`android/`) Build Status**:
   - In contrast, the companion app in `android/` (`com.shuddho.guard`) compiles cleanly with JDK 17 and Gradle 8.2 (`gradle-8.2\bin\gradle.bat tasks` and `test --dry-run` both succeed in 5–6 seconds).

---

### 3.5 Requirement R2.5: Code Integrity and Build Verification Scripts

#### Observations on Test & Verification State:
1. **Existing Test Suite (`package.json`)**:
   ```json
   "scripts": {
     "test": "node tools/test-banglish-filter.js && node tools/test-trap-detector.js && node backend/test-backend.js",
     "test:banglish": "node tools/test-banglish-filter.js",
     "test:trap": "node tools/test-trap-detector.js",
     "test:backend": "node backend/test-backend.js"
   }
   ```
   - `npm test` runs 3 scripts: `test-banglish-filter.js` (7 tests), `test-trap-detector.js` (10 tests), and `backend/test-backend.js` (6 tests). All 23 tests pass.
   - **Crucial Gap:** There is **NO PureGram test runner** in `package.json`!
2. **Missing Verification Tooling**:
   - There is no automated script to verify that PureGram source code contains the required modifications.
   - The acceptance criteria explicitly state:
     `- [ ] PureGram source modifications, search restrictions, and sensitive content hard-lock pass code integrity and build verification scripts.`
     `- [ ] All test scripts pass cleanly with zero failures via npm/gradle programmatic runners.`
   - To satisfy this criterion, a dedicated verification script (e.g. `tools/verify-puregram-integrity.js`) must be authored and integrated into `package.json`.

---

## 4. Synthesis Matrix: Implemented vs Partial vs Missing

| Feature / Requirement | Target File(s) | Status | Details / Failure Mode |
|---|---|---|---|
| **Global Channel Search Purging** | `SearchAdapterHelper.java` | **Partial** | Line 196 disables `TL_contacts_search`, line 195 checks banned keywords. BUT keyword list has only 16 entries vs 28+ in lexicon. |
| **Channel Discovery Blocking** | `DialogsChannelsAdapter.java` | **Implemented** | Line 253 adds `if (true) return;` before `TL_contacts_search req2`. |
| **Global Bot Search Purging** | `DialogsBotsAdapter.java` | **MISSING** | Line 283 `TL_contacts_search req2` with `req2.bots = true` is unblocked. |
| **Global Post/Message Search Purging** | `DialogsSearchAdapter.java`, `FilteredSearchView.java` | **MISSING** | `TL_messages_searchGlobal` requests remain unblocked in search tabs. |
| **Sensitive Content Hard-Lock** | `MessagesController.java` | **MISSING** | `showSensitiveContent()` still returns true/server setting; `setContentSettings` still accepts true. |
| **Sensitive Settings UI Lock** | `ThemeActivity.java` | **MISSING** | `sensitiveContentRow` toggle is clickable and can be enabled. |
| **Sensitive Media Reveal Lock** | `ChatActivity.java` | **MISSING** | `didPressRevealSensitiveContent()` allows revealing sensitive media. |
| **Auto-Download Restriction: Unknown Groups** | `DownloadController.java` | **MISSING** | Presets still download media when `index == 2` (unknown group sender). |
| **Auto-Download Restriction: Bots** | `DownloadController.java` | **MISSING** | Presets still download media when `index == 1` or sender is a bot. |
| **Patcher Script Idempotency** | `tools/patch-puregram-core.js` | **Broken** | Fails on re-run because target `if (allowUsername) {` and marker `PUREGRAM_DISABLED` are missing. |
| **PureGram Code Integrity Verification Script** | `tools/verify-puregram-integrity.js` | **MISSING** | Does not exist; no programmatic verification of PureGram rules. |
| **PureGram Test Integration** | `package.json` (`npm test`) | **MISSING** | `npm test` does not execute any PureGram integrity tests. |

---

## 5. Architectural Recommendations & Concrete Implementation Plan

For the subsequent implementation phase, the following steps are required:

### Step 1: Update and Complete PureGram Source Modifications
1. **`SearchAdapterHelper.java`**:
   - Update `PUREGRAM_BANNED_KEYWORDS` to match `BanglishSlangLexicon.kt` completely.
   - Maintain the `isPureGramBlocked(query)` and `if (false)` guard.
2. **`DialogsBotsAdapter.java`**:
   - In `searchBotsInternal` line 282, insert:
     ```java
     // PUREGRAM_DISABLED: নতুন অপরিচিত বট খোঁজা ব্লক
     if (true) return;
     ```
3. **`DialogsSearchAdapter.java`**:
   - In `searchMessagesInternal` line 549, guard against banned keywords and global public search:
     ```java
     if (SearchAdapterHelper.isPureGramBlocked(query)) return;
     ```
4. **`MessagesController.java`**:
   - In `showSensitiveContent()` line 24673, force `return false;`.
   - In `setContentSettings(boolean showSensitiveContent)` line 24649, add `if (showSensitiveContent) return;`.
5. **`ThemeActivity.java`**:
   - Lock `sensitiveContentRow` so it cannot be toggled to `true`.
6. **`ChatActivity.java`**:
   - In `didPressRevealSensitiveContent(ChatMessageCell cell)`, block revealing sensitive content.
7. **`DownloadController.java`**:
   - In `canDownloadMediaInternal` line 737, block auto-download for unknown users, groups with unknown senders, and bots:
     ```java
     // PUREGRAM: অপরিচিত গ্রুপ ও বট থেকে অটো-ডাউনলোড নিষিদ্ধ
     if (index == 1 || index == 2) {
         return 0;
     }
     if (peer != null && peer.user_id != 0) {
         TLRPC.User u = getMessagesController().getUser(peer.user_id);
         if (u != null && u.bot) return 0;
     }
     ```

### Step 2: Fix and Standardize `tools/patch-puregram-core.js`
- Rewrite `tools/patch-puregram-core.js` to:
  1. Be 100% idempotent (safe to run multiple times without duplicating or corrupting code).
  2. Use standard markers (`/* PUREGRAM_SHIELD_START */` ... `/* PUREGRAM_SHIELD_END */`).
  3. Patch all 6 key files: `SearchAdapterHelper.java`, `DialogsChannelsAdapter.java`, `DialogsBotsAdapter.java`, `MessagesController.java`, `ThemeActivity.java`, `DownloadController.java`.
  4. Create `.shuddho.bak` backups.

### Step 3: Implement Automated Verification Script (`tools/verify-puregram-integrity.js`)
- Create `tools/verify-puregram-integrity.js` that:
  1. Inspects the actual source files in `puregram-core/TMessagesProj/`.
  2. Verifies presence and syntax of:
     - Global adult channel search purge in `SearchAdapterHelper.java` and `DialogsChannelsAdapter.java`.
     - Global bot search purge in `DialogsBotsAdapter.java`.
     - Sensitive content hard-lock (`showSensitiveContent() { return false; }`) in `MessagesController.java`.
     - Sensitive toggle lock in `ThemeActivity.java`.
     - Auto-download restrictions on unknown groups and bots in `DownloadController.java`.
  3. Executes a mock/simulated AST/logic verification test suite verifying that banned keywords are intercepted and auto-download index rules behave as expected.
  4. Exits with code 0 on pass, code 1 on failure.

### Step 4: Integrate into `package.json`
- Add `"test:puregram": "node tools/verify-puregram-integrity.js"`.
- Update `"test"` in `package.json`:
  ```json
  "test": "node tools/test-banglish-filter.js && node tools/test-trap-detector.js && node backend/test-backend.js && node tools/verify-puregram-integrity.js"
  ```
- Run `npm test` and verify that all test suites pass with zero failures.

---

## 6. Conclusion
PureGram represents a critical defensive layer within the Shuddho Guard architecture. The baseline investigation proves that while the concept and initial search blocking in `SearchAdapterHelper` and `DialogsChannelsAdapter` exist, critical security requirements (bot search purging, sensitive content hard-locking, auto-download restriction, and automated verification runners) remain to be implemented. The concrete file paths, method signatures, line numbers, and patch specifications identified in this survey provide an exact, turnkey blueprint for the implementation phase.
