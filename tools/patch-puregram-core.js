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

function backup(file) {
    const bak = file + '.shuddho.bak';
    if (!fs.existsSync(bak) && fs.existsSync(file)) {
        fs.copyFileSync(file, bak);
    }
    return bak;
}

function normalizeEOL(content) {
    return content.replace(/\r\n/g, '\n');
}

function restoreEOL(content, original) {
    if (original.includes('\r\n')) {
        return content.replace(/\n/g, '\r\n');
    }
    return content;
}

console.log('=== পিওর টেলিগ্রাম (PureGram) স্বয়ংক্রিয় প্যাচিং শুরু হচ্ছে ===\n');

// -------------------------------------------------------------
// 1. SearchAdapterHelper.java: Banned Keywords & Global Search Block
// -------------------------------------------------------------
if (!fs.existsSync(SEARCH_HELPER_PATH)) {
    console.error('❌ SearchAdapterHelper.java পাওয়া যায়নি:', SEARCH_HELPER_PATH);
} else {
    backup(SEARCH_HELPER_PATH);
    let original = fs.readFileSync(SEARCH_HELPER_PATH, 'utf8');
    let src = normalizeEOL(original);

    const keywordSnippet = `    // === PUREGRAM SHIELD: গ্লোবাল ১৮+, ক্ষতিকর চ্যানেল ও জুয়া অনুসন্ধান ব্লক ===
    public static final String[] PUREGRAM_BANNED_KEYWORDS = {
        // Banglish Slang Lexicon & Patterns
        "choti", "bangla choti", "chotikahini", "chotigolpo",
        "boudi", "deshi boudi", "gopon video", "meye link",
        "leaked video", "deshi viral", "boudir video",
        "chuda", "choda", "magi", "khanki", "bap beti",
        "aunty sex", "bhabi choti", "bhabi sex", "hot boudi",
        "deshi sexy", "bangla sex", "bangla x", "bd viral",
        "telegram leak", "mega leak", "drive link 18+",
        "porn", "xxx", "xvideos", "pornhub", "xhamster", "xnxx",
        "viral 18", "adult link", "deshi mms", "private link", "gopon adda", "18+ link",
        "gopon", "viral", "leak", "leaked", "18+", "sex", "mms", "adult", "nude", "সহবাস",
        // Gambling & Betting
        "casino", "1xbet", "1win", "babu88", "jeetbuzz", "bet365", "melbet", "krikya", "betting", "gambling"
    };

    public static boolean isPureGramBlocked(String q) {
        if (q == null) return false;
        String lower = q.toLowerCase().trim();
        if (lower.isEmpty()) return false;
        for (String kw : PUREGRAM_BANNED_KEYWORDS) {
            if (lower.contains(kw)) return true;
        }
        return false;
    }`;

    // Replace old/partial keyword definition or insert after class decl
    if (src.includes('public static final String[] PUREGRAM_BANNED_KEYWORDS')) {
        // Already updated keywords
        console.log('✅ SearchAdapterHelper.java: PUREGRAM_BANNED_KEYWORDS ইতোমধ্যে হালনাগাদ করা আছে।');
    } else if (src.includes('private static final String[] PUREGRAM_BANNED_KEYWORDS')) {
        const regexOld = /\/\/ === PUREGRAM SHIELD[\s\S]*?return false;\s*\}/;
        if (regexOld.test(src)) {
            src = src.replace(regexOld, keywordSnippet);
            console.log('✅ SearchAdapterHelper.java: পুরনো PUREGRAM_BANNED_KEYWORDS নতুন লেক্সিকনে আপডেট করা হয়েছে।');
        }
    } else {
        const classDecl = 'public class SearchAdapterHelper {';
        if (src.includes(classDecl)) {
            src = src.replace(classDecl, classDecl + '\n' + keywordSnippet);
            console.log('✅ SearchAdapterHelper.java: PUREGRAM_BANNED_KEYWORDS সংযুক্ত করা হয়েছে।');
        }
    }

    // Ensure search abort and TL_contacts_search disabled
    if (!src.includes('if (isPureGramBlocked(query)) { return; }')) {
        const targetSearch = 'if (allowUsername) {';
        if (src.includes(targetSearch)) {
            src = src.replace(
                targetSearch,
                `if (isPureGramBlocked(query)) { return; }\n        if (false) { // PUREGRAM: গ্লোবাল পাবলিক চ্যানেল সার্চ স্থায়ীভাবে নিষ্ক্রিয়\n            ${targetSearch}`
            );
            console.log('✅ SearchAdapterHelper.java: গ্লোবাল চ্যানেল সার্চ ইন্টারসেপ্ট যুক্ত করা হয়েছে।');
        }
    } else {
        console.log('✅ SearchAdapterHelper.java: গ্লোবাল চ্যানেল সার্চ ইন্টারসেপ্ট ইতোমধ্যে বিদ্যমান।');
    }

    fs.writeFileSync(SEARCH_HELPER_PATH, restoreEOL(src, original), 'utf8');
}

// -------------------------------------------------------------
// 2. DialogsChannelsAdapter.java: Channel Discovery & Search Messages Purge
// -------------------------------------------------------------
if (!fs.existsSync(CHANNELS_ADAPTER_PATH)) {
    console.error('❌ DialogsChannelsAdapter.java পাওয়া যায়নি:', CHANNELS_ADAPTER_PATH);
} else {
    backup(CHANNELS_ADAPTER_PATH);
    let original = fs.readFileSync(CHANNELS_ADAPTER_PATH, 'utf8');
    let src = normalizeEOL(original);

    // 2.1 Block searchMessages (TL_messages_searchGlobal)
    if (!src.includes('// PUREGRAM: Intercept and block global messages search')) {
        const target = 'private void searchMessages(boolean next) {';
        if (src.includes(target)) {
            src = src.replace(
                target,
                `${target}\n        // PUREGRAM: Intercept and block global messages search\n        if (true) return;`
            );
            console.log('✅ DialogsChannelsAdapter.java: searchMessages (TL_messages_searchGlobal) ব্লক করা হয়েছে।');
        }
    } else {
        console.log('✅ DialogsChannelsAdapter.java: searchMessages ইতোমধ্যে ব্লকড।');
    }

    // 2.2 Block channel discovery (TL_contacts_search req2)
    if (!src.includes('// PUREGRAM_DISABLED: নতুন অপরিচিত চ্যানেল খোঁজা ব্লক')) {
        const target = 'TLRPC.TL_contacts_search req2 = new TLRPC.TL_contacts_search();';
        if (src.includes(target)) {
            src = src.replace(
                target,
                `// PUREGRAM_DISABLED: নতুন অপরিচিত চ্যানেল খোঁজা ব্লক\n            if (true) return;\n            ${target}`
            );
            console.log('✅ DialogsChannelsAdapter.java: চ্যানেল ডিসকভারি ব্লক করা হয়েছে।');
        }
    } else {
        console.log('✅ DialogsChannelsAdapter.java: চ্যানেল ডিসকভারি ইতোমধ্যে ব্লকড।');
    }

    fs.writeFileSync(CHANNELS_ADAPTER_PATH, restoreEOL(src, original), 'utf8');
}

// -------------------------------------------------------------
// 3. DialogsBotsAdapter.java: Global Bot Search Purge
// -------------------------------------------------------------
if (!fs.existsSync(BOTS_ADAPTER_PATH)) {
    console.error('❌ DialogsBotsAdapter.java পাওয়া যায়নি:', BOTS_ADAPTER_PATH);
} else {
    backup(BOTS_ADAPTER_PATH);
    let original = fs.readFileSync(BOTS_ADAPTER_PATH, 'utf8');
    let src = normalizeEOL(original);

    // 3.1 Block searchMessages (TL_messages_searchGlobal)
    if (!src.includes('// PUREGRAM: Intercept and block global bot messages search')) {
        const target = 'private void searchMessages(boolean next) {';
        if (src.includes(target)) {
            src = src.replace(
                target,
                `${target}\n        // PUREGRAM: Intercept and block global bot messages search\n        if (true) return;`
            );
            console.log('✅ DialogsBotsAdapter.java: searchMessages (TL_messages_searchGlobal) ব্লক করা হয়েছে।');
        }
    } else {
        console.log('✅ DialogsBotsAdapter.java: searchMessages ইতোমধ্যে ব্লকড।');
    }

    // 3.2 Block bot discovery (TL_contacts_search req2 where req2.bots = true)
    if (!src.includes('// PUREGRAM_DISABLED: Intercept and purge global bot searches')) {
        const target = 'TLRPC.TL_contacts_search req2 = new TLRPC.TL_contacts_search();';
        if (src.includes(target)) {
            src = src.replace(
                target,
                `// PUREGRAM_DISABLED: Intercept and purge global bot searches\n            if (true) return;\n            ${target}`
            );
            console.log('✅ DialogsBotsAdapter.java: গ্লোবাল বট সার্চ পার্জ করা হয়েছে।');
        }
    } else {
        console.log('✅ DialogsBotsAdapter.java: গ্লোবাল বট সার্চ ইতোমধ্যে ব্লকড।');
    }

    fs.writeFileSync(BOTS_ADAPTER_PATH, restoreEOL(src, original), 'utf8');
}

// -------------------------------------------------------------
// 4. DialogsSearchAdapter.java: Block TL_messages_searchGlobal
// -------------------------------------------------------------
if (!fs.existsSync(DIALOGS_SEARCH_PATH)) {
    console.error('❌ DialogsSearchAdapter.java পাওয়া যায়নি:', DIALOGS_SEARCH_PATH);
} else {
    backup(DIALOGS_SEARCH_PATH);
    let original = fs.readFileSync(DIALOGS_SEARCH_PATH, 'utf8');
    let src = normalizeEOL(original);

    if (!src.includes('// PUREGRAM: Intercept and block TLRPC.TL_messages_searchGlobal requests')) {
        const target = 'final TLRPC.TL_messages_searchGlobal req = new TLRPC.TL_messages_searchGlobal();';
        if (src.includes(target)) {
            const blockCode = `// PUREGRAM: Intercept and block TLRPC.TL_messages_searchGlobal requests
        if (true) {
            waitingResponseCount--;
            if (delegate != null) {
                delegate.searchStateChanged(waitingResponseCount > 0, true);
                delegate.runResultsEnterAnimation();
            }
            return;
        }
        ${target}`;
            src = src.replace(target, blockCode);
            console.log('✅ DialogsSearchAdapter.java: TL_messages_searchGlobal ইন্টারসেপ্ট ও ব্লক করা হয়েছে।');
        }
    } else {
        console.log('✅ DialogsSearchAdapter.java: TL_messages_searchGlobal ইতোমধ্যে ব্লকড।');
    }

    fs.writeFileSync(DIALOGS_SEARCH_PATH, restoreEOL(src, original), 'utf8');
}

// -------------------------------------------------------------
// 5. FilteredSearchView.java: Block TL_messages_searchGlobal
// -------------------------------------------------------------
if (!fs.existsSync(FILTERED_SEARCH_PATH)) {
    console.error('❌ FilteredSearchView.java পাওয়া যায়নি:', FILTERED_SEARCH_PATH);
} else {
    backup(FILTERED_SEARCH_PATH);
    let original = fs.readFileSync(FILTERED_SEARCH_PATH, 'utf8');
    let src = normalizeEOL(original);

    if (!src.includes('// PUREGRAM: Intercept and block TLRPC.TL_messages_searchGlobal requests')) {
        const target = 'final TLRPC.TL_messages_searchGlobal req = new TLRPC.TL_messages_searchGlobal();';
        if (src.includes(target)) {
            const blockCode = `// PUREGRAM: Intercept and block TLRPC.TL_messages_searchGlobal requests
                if (true) {
                    isLoading = false;
                    if (emptyView != null) {
                        emptyView.showProgress(false, true);
                    }
                    return;
                }
                ${target}`;
            src = src.replace(target, blockCode);
            console.log('✅ FilteredSearchView.java: TL_messages_searchGlobal ইন্টারসেপ্ট ও ব্লক করা হয়েছে।');
        }
    } else {
        console.log('✅ FilteredSearchView.java: TL_messages_searchGlobal ইতোমধ্যে ব্লকড।');
    }

    fs.writeFileSync(FILTERED_SEARCH_PATH, restoreEOL(src, original), 'utf8');
}

// -------------------------------------------------------------
// 6. MessagesController.java: Sensitive Content Hard-Lock
// -------------------------------------------------------------
if (!fs.existsSync(MESSAGES_CONTROLLER_PATH)) {
    console.error('❌ MessagesController.java পাওয়া যায়নি:', MESSAGES_CONTROLLER_PATH);
} else {
    backup(MESSAGES_CONTROLLER_PATH);
    let original = fs.readFileSync(MESSAGES_CONTROLLER_PATH, 'utf8');
    let src = normalizeEOL(original);

    // 6.1 showSensitiveContent() hard-lock to false
    if (!src.includes('// PUREGRAM: Hard-lock sensitive content to false unconditionally')) {
        const targetMethod = `public boolean showSensitiveContent() {
        if (contentSettings != null && System.currentTimeMillis() - contentSettingsLoadedTime < 1000 * 60 * 60) {
            return contentSettings.sensitive_enabled;
        }
        return ignoreRestrictionReasons == null || ignoreRestrictionReasons.contains("sensitive");
    }`;
        const replacement = `public boolean showSensitiveContent() {
        // PUREGRAM: Hard-lock sensitive content to false unconditionally
        return false;
    }`;
        if (src.includes(targetMethod)) {
            src = src.replace(targetMethod, replacement);
            console.log('✅ MessagesController.java: showSensitiveContent() হার্ড-লকড (unconditionally false)।');
        } else {
            console.warn('⚠️ MessagesController.java: showSensitiveContent টার্গেট ব্লক সরাসরি মেলেনি, অল্টারনেটিভ চেক করা হচ্ছে।');
        }
    } else {
        console.log('✅ MessagesController.java: showSensitiveContent() ইতোমধ্যে হার্ড-লকড।');
    }

    // 6.2 setContentSettings() reject enabling
    if (!src.includes('// PUREGRAM: Sensitive content can NEVER be enabled')) {
        const targetSet = 'public void setContentSettings(boolean showSensitiveContent) {';
        if (src.includes(targetSet)) {
            const setCode = `${targetSet}
        // PUREGRAM: Sensitive content can NEVER be enabled
        if (showSensitiveContent) {
            return;
        }
        if (contentSettings != null) {
            contentSettings.sensitive_enabled = false;
        }
        if (ignoreRestrictionReasons != null) {
            ignoreRestrictionReasons.remove("sensitive");
        }
        if (mainPreferences != null && ignoreRestrictionReasons != null) {
            mainPreferences.edit().putStringSet("ignoreRestrictionReasons", ignoreRestrictionReasons).apply();
        }`;
            src = src.replace(targetSet, setCode);
            console.log('✅ MessagesController.java: setContentSettings() এনাবল রিকোয়েস্ট স্থায়ীভাবে বন্ধ করা হয়েছে।');
        }
    } else {
        console.log('✅ MessagesController.java: setContentSettings() ইতোমধ্যে সুরক্ষিত।');
    }

    // 6.3 Server contentSettings response override
    if (!src.includes('contentSettings.sensitive_enabled = false; // PUREGRAM: Server flag override')) {
        const targetServer = `if (res instanceof TL_account.contentSettings) {
                contentSettings = (TL_account.contentSettings) res;
                contentSettingsLoadedTime = System.currentTimeMillis();
            }`;
        const repServer = `if (res instanceof TL_account.contentSettings) {
                contentSettings = (TL_account.contentSettings) res;
                contentSettings.sensitive_enabled = false; // PUREGRAM: Server flag override
                contentSettingsLoadedTime = System.currentTimeMillis();
            }`;
        if (src.includes(targetServer)) {
            src = src.replace(targetServer, repServer);
            console.log('✅ MessagesController.java: সার্ভার রেসপন্সে sensitive_enabled ফিক্স করা হয়েছে।');
        }
    }

    fs.writeFileSync(MESSAGES_CONTROLLER_PATH, restoreEOL(src, original), 'utf8');
}

// -------------------------------------------------------------
// 7. ThemeActivity.java: Lock/Remove Sensitive Content Toggle Row
// -------------------------------------------------------------
if (!fs.existsSync(THEME_ACTIVITY_PATH)) {
    console.error('❌ ThemeActivity.java পাওয়া যায়নি:', THEME_ACTIVITY_PATH);
} else {
    backup(THEME_ACTIVITY_PATH);
    let original = fs.readFileSync(THEME_ACTIVITY_PATH, 'utf8');
    let src = normalizeEOL(original);

    // 7.1 Remove row allocation
    if (!src.includes('// PUREGRAM: sensitiveContentRow removed and locked')) {
        const targetRow = `TL_account.contentSettings contentSettings = getMessagesController().getContentSettings();
            if (contentSettings != null && contentSettings.sensitive_can_change) {
                sensitiveContentRow = rowCount++;
            }`;
        const repRow = `// PUREGRAM: sensitiveContentRow removed and locked
            sensitiveContentRow = -1;`;
        if (src.includes(targetRow)) {
            src = src.replace(targetRow, repRow);
            console.log('✅ ThemeActivity.java: sensitiveContentRow অপশন সরানো হয়েছে।');
        }
    } else {
        console.log('✅ ThemeActivity.java: sensitiveContentRow ইতোমধ্যে সরানো আছে।');
    }

    // 7.2 Guard onItemClick for sensitiveContentRow
    if (!src.includes('// PUREGRAM: sensitiveContentRow locked')) {
        const targetClick = '} else if (position == sensitiveContentRow) {';
        if (src.includes(targetClick)) {
            src = src.replace(
                targetClick,
                `${targetClick}
                // PUREGRAM: sensitiveContentRow locked
                if (view instanceof TextCheckCell) {
                    ((TextCheckCell) view).setChecked(false);
                }
                if (true) return;`
            );
            console.log('✅ ThemeActivity.java: sensitiveContentRow ক্লিক ইন্টারসেপ্ট যুক্ত করা হয়েছে।');
        }
    } else {
        console.log('✅ ThemeActivity.java: sensitiveContentRow ক্লিক ইতোমধ্যে লকড।');
    }

    fs.writeFileSync(THEME_ACTIVITY_PATH, restoreEOL(src, original), 'utf8');
}

// -------------------------------------------------------------
// 8. ChatActivity.java: Intercept didPressRevealSensitiveContent
// -------------------------------------------------------------
if (!fs.existsSync(CHAT_ACTIVITY_PATH)) {
    console.error('❌ ChatActivity.java পাওয়া যায়নি:', CHAT_ACTIVITY_PATH);
} else {
    backup(CHAT_ACTIVITY_PATH);
    let original = fs.readFileSync(CHAT_ACTIVITY_PATH, 'utf8');
    let src = normalizeEOL(original);

    if (!src.includes('// PUREGRAM: Intercept didPressRevealSensitiveContent')) {
        const targetReveal = `public void didPressRevealSensitiveContent(ChatMessageCell cell) {`;
        if (src.includes(targetReveal)) {
            const repReveal = `${targetReveal}
            // PUREGRAM: Intercept didPressRevealSensitiveContent
            if (true) {
                if (getContext() != null) {
                    try {
                        BulletinFactory.of(ChatActivity.this).createSimpleBulletin(R.raw.error, "PureGram: Sensitive content is permanently locked.").show(true);
                    } catch (Exception e) {
                        // ignore
                    }
                }
                return;
            }`;
            src = src.replace(targetReveal, repReveal);
            console.log('✅ ChatActivity.java: didPressRevealSensitiveContent ইন্টারসেপ্ট করা হয়েছে।');
        }
    } else {
        console.log('✅ ChatActivity.java: didPressRevealSensitiveContent ইতোমধ্যে ইন্টারসেপ্টেড।');
    }

    fs.writeFileSync(CHAT_ACTIVITY_PATH, restoreEOL(src, original), 'utf8');
}

// -------------------------------------------------------------
// 9. DownloadController.java: Restrict Auto-Download for Bots & Unknown Groups
// -------------------------------------------------------------
if (!fs.existsSync(DOWNLOAD_CONTROLLER_PATH)) {
    console.error('❌ DownloadController.java পাওয়া যায়নি:', DOWNLOAD_CONTROLLER_PATH);
} else {
    backup(DOWNLOAD_CONTROLLER_PATH);
    let original = fs.readFileSync(DOWNLOAD_CONTROLLER_PATH, 'utf8');
    let src = normalizeEOL(original);

    const restrictionCheck1 = `        // PUREGRAM: Restrict automatic download of media and files from unknown groups, non-contacts, and bots
        if (peer != null && peer.user_id != 0) {
            TLRPC.User u = getMessagesController().getUser(peer.user_id);
            if (u != null && u.bot) {
                return 0; // PUREGRAM: বট থেকে কোনো অটো-ডাউনলোড হবে না
            }
        }
        if (msg.from_id instanceof TLRPC.TL_peerUser) {
            TLRPC.User sender = getMessagesController().getUser(msg.from_id.user_id);
            if (sender != null && sender.bot) {
                return 0; // PUREGRAM: বট থেকে কোনো অটো-ডাউনলোড হবে না
            }
        }
        if (index == 1 || index == 2) {
            return 0; // PUREGRAM: অপরিচিত গ্রুপ ও নন-কন্টাক্ট থেকে অটো-ডাউনলোড সম্পূর্ণ নিষিদ্ধ
        }`;

    const restrictionCheck2 = `        // PUREGRAM: Restrict automatic download of media and files from unknown groups, non-contacts, and bots
        if (peer != null && peer.user_id != 0) {
            TLRPC.User u = getMessagesController().getUser(peer.user_id);
            if (u != null && u.bot) {
                return 0;
            }
        }
        if (message.from_id instanceof TLRPC.TL_peerUser) {
            TLRPC.User sender = getMessagesController().getUser(message.from_id.user_id);
            if (sender != null && sender.bot) {
                return 0;
            }
        }
        if (index == 1 || index == 2) {
            return 0;
        }`;

    if (!src.includes('// PUREGRAM: Restrict automatic download of media and files from unknown groups, non-contacts, and bots')) {
        // In canDownloadMediaInternal(MessageObject message)
        const target1 = `        } else {\n            index = 1;\n        }\n        Preset preset;\n        int networkType = ApplicationLoader.getAutodownloadNetworkType();`;
        if (src.includes(target1)) {
            const rep1 = `        } else {\n            index = 1;\n        }\n${restrictionCheck1}\n        Preset preset;\n        int networkType = ApplicationLoader.getAutodownloadNetworkType();`;
            src = src.replace(target1, rep1);
            console.log('✅ DownloadController.java: canDownloadMediaInternal(MessageObject) অটো-ডাউনলোড রেস্ট্রিকশন যুক্ত করা হয়েছে।');
        }

        // In canDownloadMediaInternal(MessageObject message, long overrideSize)
        const target2 = `        } else {\n            index = 1;\n        }\n        Preset preset;\n        int networkType = ApplicationLoader.getAutodownloadNetworkType();`;
        if (src.includes(target2)) {
            // Second occurrence
            const rep2 = `        } else {\n            index = 1;\n        }\n${restrictionCheck1}\n        Preset preset;\n        int networkType = ApplicationLoader.getAutodownloadNetworkType();`;
            src = src.replace(target2, rep2);
            console.log('✅ DownloadController.java: canDownloadMediaInternal(MessageObject, long) অটো-ডাউনলোড রেস্ট্রিকশন যুক্ত করা হয়েছে।');
        }

        // In canDownloadMedia(TLRPC.Message message)
        const target3 = `        } else {\n            index = 1;\n        }\n        Preset preset;\n        int networkType = ApplicationLoader.getAutodownloadNetworkType();`;
        if (src.includes(target3)) {
            const rep3 = `        } else {\n            index = 1;\n        }\n${restrictionCheck2}\n        Preset preset;\n        int networkType = ApplicationLoader.getAutodownloadNetworkType();`;
            src = src.replace(target3, rep3);
            console.log('✅ DownloadController.java: canDownloadMedia(TLRPC.Message) অটো-ডাউনলোড রেস্ট্রিকশন যুক্ত করা হয়েছে।');
        }
    } else {
        console.log('✅ DownloadController.java: অটো-ডাউনলোড রেস্ট্রিকশন ইতোমধ্যে বিদ্যমান।');
    }

    fs.writeFileSync(DOWNLOAD_CONTROLLER_PATH, restoreEOL(src, original), 'utf8');
}

console.log('\n=== পিওর টেলিগ্রাম প্যাচিং সফলভাবে সম্পন্ন হয়েছে ===');
