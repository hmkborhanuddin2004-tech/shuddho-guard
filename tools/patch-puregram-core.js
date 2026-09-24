const fs   = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SEARCH_HELPER_PATH = path.join(
    ROOT, 'puregram-core', 'TMessagesProj', 'src', 'main', 'java',
    'org', 'telegram', 'ui', 'Adapters', 'SearchAdapterHelper.java'
);
const CHANNELS_ADAPTER_PATH = path.join(
    ROOT, 'puregram-core', 'TMessagesProj', 'src', 'main', 'java',
    'org', 'telegram', 'ui', 'Components', 'DialogsChannelsAdapter.java'
);

const MARKER = 'PUREGRAM_DISABLED';

function backup(file) {
    const bak = file + '.shuddho.bak';
    if (!fs.existsSync(bak)) fs.copyFileSync(file, bak);
    return bak;
}

console.log('=== পিওর টেলিগ্রাম (PureGram) প্যাচিং শুরু হচ্ছে ===\n');

// ---------- SearchAdapterHelper.java ----------
if (!fs.existsSync(SEARCH_HELPER_PATH)) {
    console.error('❌ SearchAdapterHelper.java পাওয়া যায়নি:', SEARCH_HELPER_PATH);
} else {
    let src = fs.readFileSync(SEARCH_HELPER_PATH, 'utf8');

    if (src.includes(MARKER)) {
        console.log('⏭️  SearchAdapterHelper.java আগেই প্যাচ করা — স্কিপ।');
    } else {
        const filterSnippet = `
    /* ${MARKER} */
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
`;

        const classDecl = 'public class SearchAdapterHelper {';
        if (!src.includes(classDecl)) {
            console.error('❌ SearchAdapterHelper.java-এ ক্লাস ডিক্লারেশন পাওয়া যায়নি। Telegram সোর্স বদলে গেছে।');
        } else {
            src = src.replace(classDecl, classDecl + '\n' + filterSnippet);

            const target = 'if (allowUsername) {';
            if (!src.includes(target)) {
                console.error('❌ `if (allowUsername) {` টার্গেট পাওয়া যায়নি — প্যাচ বাদ।');
            } else {
                backup(SEARCH_HELPER_PATH);
                src = src.replace(
                    target,
                    `if (isPureGramBlocked(query)) { return; }\n        ${target}`
                );
                fs.writeFileSync(SEARCH_HELPER_PATH, src, 'utf8');
                console.log('✅ SearchAdapterHelper.java প্যাচ সম্পন্ন। ব্যাকআপ:', backup(SEARCH_HELPER_PATH));
            }
        }
    }
}

// ---------- DialogsChannelsAdapter.java ----------
if (!fs.existsSync(CHANNELS_ADAPTER_PATH)) {
    console.error('❌ DialogsChannelsAdapter.java পাওয়া যায়নি:', CHANNELS_ADAPTER_PATH);
} else {
    let src = fs.readFileSync(CHANNELS_ADAPTER_PATH, 'utf8');
    const target = 'TLRPC.TL_contacts_search req2 = new TLRPC.TL_contacts_search();';

    if (src.includes(MARKER)) {
        console.log('⏭️  DialogsChannelsAdapter.java আগেই প্যাচ করা — স্কিপ।');
    } else if (!src.includes(target)) {
        console.error('❌ টার্গেট লাইন পাওয়া যায়নি — Telegram সোর্স বদলে গেছে।');
    } else {
        backup(CHANNELS_ADAPTER_PATH);
        src = src.replace(target,
            `/* ${MARKER} */\n            if (true) return;\n            ${target}`
        );
        fs.writeFileSync(CHANNELS_ADAPTER_PATH, src, 'utf8');
        console.log('✅ DialogsChannelsAdapter.java প্যাচ সম্পন্ন।');
    }
}

console.log('\n=== প্যাচিং শেষ ===');
