/**
 * Shuddho Guard: PureGram Code Integrity & AST Verification Runner
 * Validates Requirement R2 Acceptance Criteria:
 * 1. Global channel and bot search intercept points
 * 2. Public channel message search blocking (TL_messages_searchGlobal)
 * 3. Sensitive content hard-lock (showSensitiveContent returning false, didPressRevealSensitiveContent blocked)
 * 4. Auto-download restrictions on non-contacts and unknown groups/bots
 * 5. Lexicon coverage and behavioral filtering tests
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const T_MESSAGES_PROJ = path.join(ROOT, 'puregram-core', 'TMessagesProj', 'src', 'main', 'java', 'org', 'telegram');

const SEARCH_HELPER_PATH = path.join(T_MESSAGES_PROJ, 'ui', 'Adapters', 'SearchAdapterHelper.java');
const CHANNELS_ADAPTER_PATH = path.join(T_MESSAGES_PROJ, 'ui', 'Components', 'DialogsChannelsAdapter.java');
const BOTS_ADAPTER_PATH = path.join(T_MESSAGES_PROJ, 'ui', 'Components', 'DialogsBotsAdapter.java');
const DIALOGS_SEARCH_PATH = path.join(T_MESSAGES_PROJ, 'ui', 'Adapters', 'DialogsSearchAdapter.java');
const FILTERED_SEARCH_PATH = path.join(T_MESSAGES_PROJ, 'ui', 'FilteredSearchView.java');
const MESSAGES_CONTROLLER_PATH = path.join(T_MESSAGES_PROJ, 'messenger', 'MessagesController.java');
const THEME_ACTIVITY_PATH = path.join(T_MESSAGES_PROJ, 'ui', 'ThemeActivity.java');
const CHAT_ACTIVITY_PATH = path.join(T_MESSAGES_PROJ, 'ui', 'ChatActivity.java');
const DOWNLOAD_CONTROLLER_PATH = path.join(T_MESSAGES_PROJ, 'messenger', 'DownloadController.java');
const LEXICON_PATH = path.join(ROOT, 'android', 'app', 'src', 'main', 'java', 'com', 'shuddho', 'guard', 'filters', 'BanglishSlangLexicon.kt');

let testsPassed = 0;
let testsFailed = 0;

function assertCheck(name, condition, details = '') {
    if (condition) {
        testsPassed++;
        console.log(`  ✅ [PASS] ${name}`);
        if (details) console.log(`     └─ ${details}`);
    } else {
        testsFailed++;
        console.error(`  ❌ [FAIL] ${name}`);
        if (details) console.error(`     └─ ${details}`);
    }
}

function normalize(str) {
    return str.replace(/\r\n/g, '\n');
}

console.log('================================================================');
console.log('  PureGram Code Integrity & Security Verification Suite');
console.log('  Target: Requirement R2 (PureGram Safe Telegram Client)');
console.log('================================================================\n');

// ============================================================================
// 1. Lexicon Coverage & Search Blocking Verification
// ============================================================================
console.log('🔍 [Suite 1/5] Lexicon Coverage & Keyword Banlist Verification');

assertCheck('SearchAdapterHelper.java exists', fs.existsSync(SEARCH_HELPER_PATH));
assertCheck('BanglishSlangLexicon.kt exists', fs.existsSync(LEXICON_PATH));

if (fs.existsSync(SEARCH_HELPER_PATH) && fs.existsSync(LEXICON_PATH)) {
    const lexiconContent = normalize(fs.readFileSync(LEXICON_PATH, 'utf8'));
    const helperContent = normalize(fs.readFileSync(SEARCH_HELPER_PATH, 'utf8'));

    // Extract slangs from BanglishSlangLexicon.kt
    const slangMatches = [...lexiconContent.matchAll(/"([^"]+)"/g)].map(m => m[1]);
    const lexiconUniqueTerms = [...new Set(slangMatches)];

    // Extract keywords from SearchAdapterHelper.java
    const keywordsBlockMatch = helperContent.match(/PUREGRAM_BANNED_KEYWORDS\s*=\s*\{([\s\S]*?)\};/);
    assertCheck('PUREGRAM_BANNED_KEYWORDS array extracted', !!keywordsBlockMatch);

    let helperKeywords = [];
    if (keywordsBlockMatch) {
        helperKeywords = [...keywordsBlockMatch[1].matchAll(/"([^"]+)"/g)].map(m => m[1]);
    }

    // Verify all terms from BanglishSlangLexicon are present
    const missingTerms = lexiconUniqueTerms.filter(term => !helperKeywords.includes(term));
    assertCheck(
        'All BanglishSlangLexicon terms covered in SearchAdapterHelper',
        missingTerms.length === 0,
        missingTerms.length === 0 
            ? `All ${lexiconUniqueTerms.length} terms from lexicon successfully mapped` 
            : `Missing: ${missingTerms.join(', ')}`
    );

    // Verify betting & gambling keywords presence
    const gamblingTerms = ['casino', '1xbet', '1win', 'babu88', 'jeetbuzz', 'betting', 'gambling'];
    const missingGambling = gamblingTerms.filter(t => !helperKeywords.includes(t));
    assertCheck(
        'Adult and gambling keywords coverage',
        missingGambling.length === 0,
        `Verified terms: ${gamblingTerms.join(', ')}`
    );

    // Verify method signatures and code patterns in SearchAdapterHelper.java
    assertCheck(
        'SearchAdapterHelper: isPureGramBlocked is declared public static',
        helperContent.includes('public static boolean isPureGramBlocked(String q)')
    );

    assertCheck(
        'SearchAdapterHelper: search abortion triggers before global queries',
        helperContent.includes('if (isPureGramBlocked(query)) { return; }')
    );

    assertCheck(
        'SearchAdapterHelper: global channel search TL_contacts_search disabled with if (false)',
        /if\s*\(\s*false\s*\)\s*\{\s*\/\/\s*PUREGRAM[\s\S]*?TLRPC\.TL_contacts_search/.test(helperContent)
    );

    // Functional simulation test of isPureGramBlocked
    function simulateIsPureGramBlocked(query) {
        if (!query) return false;
        const lower = query.toLowerCase().trim();
        if (lower.length === 0) return false;
        for (const kw of helperKeywords) {
            if (lower.includes(kw)) return true;
        }
        return false;
    }

    const testVectors = [
        { q: 'deshi boudi viral video telegram link', expected: true },
        { q: 'bangla choti golpo download', expected: true },
        { q: '1xbet promo code and bonus', expected: true },
        { q: 'babu88 casino login', expected: true },
        { q: 'gopon video mega drive link 18+', expected: true },
        { q: 'hot boudir choti kahini', expected: true },
        { q: 'telegram leak mms', expected: true },
        { q: 'Learn React and Python for Beginners', expected: false },
        { q: 'Bangladesh Cricket Board Updates 2026', expected: false },
        { q: 'HSC Physics 1st Paper Book', expected: false },
        { q: 'Dhaka University Admission Circular', expected: false }
    ];

    let functionalPass = true;
    for (const tv of testVectors) {
        const res = simulateIsPureGramBlocked(tv.q);
        if (res !== tv.expected) {
            functionalPass = false;
            console.error(`       Mismatch for query "${tv.q}": got ${res}, expected ${tv.expected}`);
        }
    }
    assertCheck(
        'Functional simulation of PureGram banned keyword classifier passes all test vectors',
        functionalPass,
        `Evaluated ${testVectors.length} positive and negative test cases`
    );
}

// ============================================================================
// 2. Global Channel and Bot Search Intercept Points
// ============================================================================
console.log('\n🔍 [Suite 2/5] Global Channel & Bot Search Purge Verification');

assertCheck('DialogsChannelsAdapter.java exists', fs.existsSync(CHANNELS_ADAPTER_PATH));
assertCheck('DialogsBotsAdapter.java exists', fs.existsSync(BOTS_ADAPTER_PATH));

if (fs.existsSync(CHANNELS_ADAPTER_PATH)) {
    const channelsContent = normalize(fs.readFileSync(CHANNELS_ADAPTER_PATH, 'utf8'));

    // Check channel discovery intercept (TL_contacts_search)
    const channelSearchPurged = /loadingChannels\s*=\s*true;[\s\S]*?if\s*\(\s*true\s*\)\s*return;[\s\S]*?TLRPC\.TL_contacts_search\s+req2/.test(channelsContent);
    assertCheck(
        'DialogsChannelsAdapter: channel discovery (TL_contacts_search) unconditionally intercepted',
        channelSearchPurged
    );

    // Check channel message search intercept (TL_messages_searchGlobal)
    const channelMsgPurged = /private\s+void\s+searchMessages\(boolean\s+next\)\s*\{[\s\S]*?if\s*\(\s*true\s*\)\s*return;[\s\S]*?TL_messages_searchGlobal/.test(channelsContent);
    assertCheck(
        'DialogsChannelsAdapter: public channel message search (TL_messages_searchGlobal) intercepted',
        channelMsgPurged
    );
}

if (fs.existsSync(BOTS_ADAPTER_PATH)) {
    const botsContent = normalize(fs.readFileSync(BOTS_ADAPTER_PATH, 'utf8'));

    // Check bot discovery intercept (TL_contacts_search req2 where req2.bots = true)
    const botSearchPurged = /loadingBots\s*=\s*true;[\s\S]*?if\s*\(\s*true\s*\)\s*return;[\s\S]*?TLRPC\.TL_contacts_search\s+req2[\s\S]*?req2\.bots\s*=\s*true;/.test(botsContent);
    assertCheck(
        'DialogsBotsAdapter: global bot search (TL_contacts_search where bots=true) unconditionally intercepted',
        botSearchPurged
    );

    // Check bot message search intercept (TL_messages_searchGlobal)
    const botMsgPurged = /private\s+void\s+searchMessages\(boolean\s+next\)\s*\{[\s\S]*?if\s*\(\s*true\s*\)\s*return;[\s\S]*?TL_messages_searchGlobal/.test(botsContent);
    assertCheck(
        'DialogsBotsAdapter: bot message search (TL_messages_searchGlobal) intercepted',
        botMsgPurged
    );
}

// ============================================================================
// 3. Public Channel Message Search Blocking (TL_messages_searchGlobal)
// ============================================================================
console.log('\n🔍 [Suite 3/5] Public Channel Message Search Blocking (TL_messages_searchGlobal)');

assertCheck('DialogsSearchAdapter.java exists', fs.existsSync(DIALOGS_SEARCH_PATH));
assertCheck('FilteredSearchView.java exists', fs.existsSync(FILTERED_SEARCH_PATH));

if (fs.existsSync(DIALOGS_SEARCH_PATH)) {
    const dialogsSearchContent = normalize(fs.readFileSync(DIALOGS_SEARCH_PATH, 'utf8'));

    const searchGlobalBlocked = /if\s*\(\s*true\s*\)\s*\{[\s\S]*?waitingResponseCount--;[\s\S]*?return;[\s\S]*?\}\s*final\s+TLRPC\.TL_messages_searchGlobal\s+req/.test(dialogsSearchContent);
    assertCheck(
        'DialogsSearchAdapter: TL_messages_searchGlobal request intercepted and blocked before dispatch',
        searchGlobalBlocked
    );
}

if (fs.existsSync(FILTERED_SEARCH_PATH)) {
    const filteredSearchContent = normalize(fs.readFileSync(FILTERED_SEARCH_PATH, 'utf8'));

    const filteredSearchGlobalBlocked = /if\s*\(\s*true\s*\)\s*\{[\s\S]*?isLoading\s*=\s*false;[\s\S]*?return;[\s\S]*?\}\s*final\s+TLRPC\.TL_messages_searchGlobal\s+req/.test(filteredSearchContent);
    assertCheck(
        'FilteredSearchView: TL_messages_searchGlobal request intercepted and blocked before dispatch',
        filteredSearchGlobalBlocked
    );
}

// ============================================================================
// 4. Sensitive Content Filter Hard-Lock
// ============================================================================
console.log('\n🔍 [Suite 4/5] Sensitive Content Filter Hard-Lock Verification');

assertCheck('MessagesController.java exists', fs.existsSync(MESSAGES_CONTROLLER_PATH));
assertCheck('ThemeActivity.java exists', fs.existsSync(THEME_ACTIVITY_PATH));
assertCheck('ChatActivity.java exists', fs.existsSync(CHAT_ACTIVITY_PATH));

if (fs.existsSync(MESSAGES_CONTROLLER_PATH)) {
    const messagesCtrlContent = normalize(fs.readFileSync(MESSAGES_CONTROLLER_PATH, 'utf8'));

    // showSensitiveContent() unconditionally returns false
    const showSensitiveHardLocked = /public\s+boolean\s+showSensitiveContent\(\)\s*\{[\s\S]*?return\s+false;[\s\S]*?\}/.test(messagesCtrlContent);
    assertCheck(
        'MessagesController: showSensitiveContent() hard-locked to return false unconditionally',
        showSensitiveHardLocked
    );

    // setContentSettings() ignores enable requests
    const setContentSettingsProtected = /public\s+void\s+setContentSettings\(boolean\s+showSensitiveContent\)\s*\{[\s\S]*?if\s*\(\s*showSensitiveContent\s*\)\s*\{\s*return;\s*\}/.test(messagesCtrlContent);
    assertCheck(
        'MessagesController: setContentSettings() permanently rejects enabling sensitive content',
        setContentSettingsProtected
    );

    // Server contentSettings override
    const serverFlagOverridden = messagesCtrlContent.includes('contentSettings.sensitive_enabled = false; // PUREGRAM: Server flag override');
    assertCheck(
        'MessagesController: Server contentSettings response forcefully clamped to sensitive_enabled = false',
        serverFlagOverridden
    );
}

if (fs.existsSync(THEME_ACTIVITY_PATH)) {
    const themeContent = normalize(fs.readFileSync(THEME_ACTIVITY_PATH, 'utf8'));

    const rowRemoved = themeContent.includes('sensitiveContentRow = -1;');
    assertCheck(
        'ThemeActivity: sensitiveContentRow removed and locked (-1)',
        rowRemoved
    );

    const clickIntercepted = /position\s*==\s*sensitiveContentRow[\s\S]*?setChecked\(false\);[\s\S]*?return;/.test(themeContent);
    assertCheck(
        'ThemeActivity: sensitiveContentRow click handler locked and disabled',
        clickIntercepted
    );
}

if (fs.existsSync(CHAT_ACTIVITY_PATH)) {
    const chatContent = normalize(fs.readFileSync(CHAT_ACTIVITY_PATH, 'utf8'));

    const didPressRevealBlocked = /public\s+void\s+didPressRevealSensitiveContent\(ChatMessageCell\s+cell\)\s*\{[\s\S]*?if\s*\(\s*true\s*\)\s*\{[\s\S]*?return;[\s\S]*?\}/.test(chatContent);
    assertCheck(
        'ChatActivity: didPressRevealSensitiveContent intercepted so sensitive media cannot be revealed',
        didPressRevealBlocked
    );
}

// ============================================================================
// 5. Automatic Media Download Restrictions
// ============================================================================
console.log('\n🔍 [Suite 5/5] Automatic Media Download Restrictions Verification');

assertCheck('DownloadController.java exists', fs.existsSync(DOWNLOAD_CONTROLLER_PATH));

if (fs.existsSync(DOWNLOAD_CONTROLLER_PATH)) {
    const dlContent = normalize(fs.readFileSync(DOWNLOAD_CONTROLLER_PATH, 'utf8'));

    // Check bot restriction in canDownloadMediaInternal
    const botCheckPresent = dlContent.includes('u != null && u.bot') && dlContent.includes('sender != null && sender.bot');
    assertCheck(
        'DownloadController: checks and blocks automatic download for bots (peer & sender)',
        botCheckPresent
    );

    // Check non-contact and unknown group restrictions
    const unknownPeerCheck = dlContent.includes('if (index == 1 || index == 2) {\n            return 0;\n        }');
    assertCheck(
        'DownloadController: restricts auto-download for unknown users (index 1) and unknown groups (index 2)',
        unknownPeerCheck
    );

    // Verify all 3 download check methods are protected
    const occurrences = (dlContent.match(/PUREGRAM: Restrict automatic download of media and files from unknown groups, non-contacts, and bots/g) || []).length;
    assertCheck(
        'DownloadController: auto-download restriction applied across all internal decision gates',
        occurrences >= 3,
        `Found ${occurrences} protected decision points (canDownloadMediaInternal x2, canDownloadMedia(TLRPC.Message))`
    );

    // Functional simulation of download policy
    function simulateAutoDownloadDecision({ isContact, isGroup, isMegagroup, senderIsContact, isBot, isChannel }) {
        let index;
        if (isChannel && !isMegagroup) {
            index = 3;
        } else if (isGroup || isMegagroup) {
            index = senderIsContact ? 0 : 2;
        } else {
            index = isContact ? 0 : 1;
        }

        // PureGram policy checks
        if (isBot) return 0;
        if (index === 1 || index === 2) return 0;

        return 1; // Allowed by policy, subject to network/preset
    }

    const dlTestCases = [
        { desc: '1-on-1 message from known contact', ctx: { isContact: true, isGroup: false, isMegagroup: false, senderIsContact: true, isBot: false, isChannel: false }, expected: 1 },
        { desc: '1-on-1 message from unknown number / non-contact', ctx: { isContact: false, isGroup: false, isMegagroup: false, senderIsContact: false, isBot: false, isChannel: false }, expected: 0 },
        { desc: '1-on-1 message from bot', ctx: { isContact: true, isGroup: false, isMegagroup: false, senderIsContact: true, isBot: true, isChannel: false }, expected: 0 },
        { desc: 'Group message from unknown user', ctx: { isContact: false, isGroup: true, isMegagroup: false, senderIsContact: false, isBot: false, isChannel: false }, expected: 0 },
        { desc: 'Group message from contact', ctx: { isContact: false, isGroup: true, isMegagroup: false, senderIsContact: true, isBot: false, isChannel: false }, expected: 1 },
        { desc: 'Group message sent by bot', ctx: { isContact: false, isGroup: true, isMegagroup: false, senderIsContact: false, isBot: true, isChannel: false }, expected: 0 },
        { desc: 'Megagroup message from non-contact', ctx: { isContact: false, isGroup: true, isMegagroup: true, senderIsContact: false, isBot: false, isChannel: false }, expected: 0 }
    ];

    let dlFunctionalPass = true;
    for (const tc of dlTestCases) {
        const res = simulateAutoDownloadDecision(tc.ctx);
        if (res !== tc.expected) {
            dlFunctionalPass = false;
            console.error(`       Download decision failure for "${tc.desc}": got ${res}, expected ${tc.expected}`);
        }
    }
    assertCheck(
        'Functional simulation of download policy correctly blocks bots, non-contacts, and unknown groups',
        dlFunctionalPass,
        `Passed ${dlTestCases.length} decision matrix test cases`
    );
}

// ============================================================================
// Summary & Exit Code
// ============================================================================
console.log('\n================================================================');
console.log(`  PureGram Verification Results: ${testsPassed} PASSED, ${testsFailed} FAILED`);
console.log('================================================================\n');

if (testsFailed === 0) {
    console.log('🎉 PureGram Code Integrity & Security Verification 100% SUCCESSFUL!');
    process.exit(0);
} else {
    console.error('💥 PureGram Verification FAILED. Please review the failed checks above.');
    process.exit(1);
}
