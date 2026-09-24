## 2026-09-24T12:22:18Z

You are Worker M2 for the Shuddho Guard project.
Your working directory is: c:\Users\assdi\Documents\Downloads\shuddho-guard\.agents\teamwork\worker_m2
Project root: c:\Users\assdi\Documents\Downloads\shuddho-guard
Parent Conversation ID: 1568080f-3592-4965-a008-57d3138f1150

MANDATORY FIRST STEP: Read the authoritative user request at:
c:\Users\assdi\Documents\Downloads\shuddho-guard\.agents\teamwork\ORIGINAL_REQUEST.md

Also read:
- c:\Users\assdi\Documents\Downloads\shuddho-guard\.agents\teamwork\orchestrator_1\PROJECT.md
- c:\Users\assdi\Documents\Downloads\shuddho-guard\.agents\teamwork\explorer_survey_2\survey_report.md
- c:\Users\assdi\Documents\Downloads\shuddho-guard\.agents\teamwork\explorer_survey_2\handoff.md

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

YOUR WRITE OWNERSHIP:
You have exclusive write ownership of:
- puregram-core/
- tools/patch-puregram-core.js
- tools/verify-puregram-integrity.js
DO NOT modify web-extension/ or android/ (owned by other milestones).

YOUR MISSION:
Fulfill Requirement R2 (PureGram — Safe Open-Source Telegram Android Client) and its Acceptance Criteria:
1. Global Search Purge:
   - In `puregram-core/TMessagesProj/src/main/java/org/telegram/ui/Adapters/DialogsBotsAdapter.java`: Intercept and purge global bot searches (`TLRPC.TL_contacts_search req2` where `req2.bots = true`), preventing discovery of unauthorized or explicit bots.
   - In `DialogsSearchAdapter.java` and `FilteredSearchView.java`: Intercept and block `TLRPC.TL_messages_searchGlobal` requests, preventing public channel message and media discovery.
   - In `SearchAdapterHelper.java`: Expand the banned keywords array to include all terms from `android/app/src/main/java/com/shuddho/guard/data/BanglishSlangLexicon.kt` and ensure adult and gambling terms trigger immediate search abortion.
2. Sensitive Content Filter Hard-Lock:
   - In `puregram-core/TMessagesProj/src/main/java/org/telegram/messenger/MessagesController.java`: Hard-lock `showSensitiveContent()` to return `false` unconditionally. Modify `setContentSettings()` so that sensitive content can NEVER be enabled, even if the server returns flags.
   - In `ThemeActivity.java`: Lock or remove the sensitive content toggle row so users cannot enable sensitive content.
   - In `ChatActivity.java`: Intercept `didPressRevealSensitiveContent` so that sensitive/18+ content cannot be revealed by tapping.
3. Automatic Media Download Restrictions:
   - In `puregram-core/TMessagesProj/src/main/java/org/telegram/messenger/DownloadController.java`: Restrict automatic download of media and files from unknown groups, non-contacts, and bots.
4. Patch & Verification Automation:
   - Update `tools/patch-puregram-core.js` to deterministically apply all modifications.
   - Implement `tools/verify-puregram-integrity.js` as an automated AST/code integrity verification script. It must programmatically verify:
     * Global channel and bot search intercept points
     * Public channel message search blocking (`TL_messages_searchGlobal`)
     * Sensitive content hard-lock (`showSensitiveContent` returning false, `didPressRevealSensitiveContent` blocked)
     * Auto-download restrictions on non-contacts and unknown groups/bots
     * Lexicon coverage
5. Verification:
   - Run `node tools/verify-puregram-integrity.js` and ensure it passes with exit code 0.
6. Deliver:
   - Write `c:\Users\assdi\Documents\Downloads\shuddho-guard\.agents\teamwork\worker_m2\handoff.md` with full details of changes, verification output, and files touched.
   - Send message to parent (`1568080f-3592-4965-a008-57d3138f1150`).
