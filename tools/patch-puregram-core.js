/**
 * শুদ্ধ গার্ড — পিওর টেলিগ্রাম (PureGram) কোর প্যাচ ইঞ্জিন
 * এটি অফিশিয়াল টেলিগ্রাম অ্যান্ড্রয়েড সোর্স কোড থেকে সমস্ত গ্লোবাল ১৮+ চ্যানেল সার্চ,
 * পাবলিক চ্যানেল ডিসকভারি ও ক্ষতিকর লিঙ্ক অন্বেষণ স্থায়ীভাবে নিষ্ক্রিয় করে।
 */

const fs = require('fs');
const path = require('path');

const SEARCH_HELPER_PATH = path.join(__dirname, '..', 'puregram-core', 'TMessagesProj', 'src', 'main', 'java', 'org', 'telegram', 'ui', 'Adapters', 'SearchAdapterHelper.java');
const CHANNELS_ADAPTER_PATH = path.join(__dirname, '..', 'puregram-core', 'TMessagesProj', 'src', 'main', 'java', 'org', 'telegram', 'ui', 'Components', 'DialogsChannelsAdapter.java');

console.log('=== পিওর টেলিগ্রাম (PureGram) প্যাচিং শুরু হচ্ছে ===\n');

// ১. SearchAdapterHelper.java প্যাচ করা (গ্লোবাল চ্যানেল সার্চ ও ১৮+ কি-ওয়ার্ড ব্লক)
if (fs.existsSync(SEARCH_HELPER_PATH)) {
    let content = fs.readFileSync(SEARCH_HELPER_PATH, 'utf8');
    
    // ব্যানলিস্ট চেক ফাংশন ইনজেক্ট করা
    const filterSnippet = `
    // === PUREGRAM SHIELD: গ্লোবাল ১৮+ ও ক্ষতিকর চ্যানেল অনুসন্ধান ব্লক ===
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

    if (!content.includes('PUREGRAM_BANNED_KEYWORDS')) {
        content = content.replace('public class SearchAdapterHelper {', 'public class SearchAdapterHelper {\n' + filterSnippet);
        
        // সার্চ কোয়েরি শুরুতেই ফিল্টার চেক
        content = content.replace(
            'if (allowUsername) {',
            'if (isPureGramBlocked(query)) { return; } // PUREGRAM: ক্ষতিকর কি-ওয়ার্ড ব্লক\n        if (false) { // PUREGRAM: গ্লোবাল পাবলিক চ্যানেল সার্চ স্থায়ীভাবে নিষ্ক্রিয়'
        );

        fs.writeFileSync(SEARCH_HELPER_PATH, content, 'utf8');
        console.log('✅ [সফল] SearchAdapterHelper.java: গ্লোবাল পাবলিক চ্যানেল সার্চ ও নোংরা কি-ওয়ার্ড চিরতরে বন্ধ করা হয়েছে।');
    } else {
        console.log('🛡️ SearchAdapterHelper.java ইতিমধ্যে প্যাচ করা রয়েছে।');
    }
} else {
    console.warn('⚠️ SearchAdapterHelper.java পাওয়া যায়নি: ', SEARCH_HELPER_PATH);
}

// ২. DialogsChannelsAdapter.java প্যাচ করা (পাবলিক চ্যানেল ডিসকভারি ব্লক)
if (fs.existsSync(CHANNELS_ADAPTER_PATH)) {
    let content = fs.readFileSync(CHANNELS_ADAPTER_PATH, 'utf8');

    if (!content.includes('PUREGRAM_DISABLED')) {
        content = content.replace(
            'TLRPC.TL_contacts_search req2 = new TLRPC.TL_contacts_search();',
            '// PUREGRAM_DISABLED: নতুন অপরিচিত চ্যানেল খোঁজা ব্লক\n            if (true) return;\n            TLRPC.TL_contacts_search req2 = new TLRPC.TL_contacts_search();'
        );

        fs.writeFileSync(CHANNELS_ADAPTER_PATH, content, 'utf8');
        console.log('✅ [সফল] DialogsChannelsAdapter.java: টেলিগ্রাম চ্যানেল ডিসকভারি রিকোয়েস্ট নিষ্ক্রিয় করা হয়েছে।');
    } else {
        console.log('🛡️ DialogsChannelsAdapter.java ইতিমধ্যে প্যাচ করা রয়েছে।');
    }
} else {
    console.warn('⚠️ DialogsChannelsAdapter.java পাওয়া যায়নি: ', CHANNELS_ADAPTER_PATH);
}

console.log('\n🎯 পিওর টেলিগ্রাম (PureGram) কোর মডিউল সফলভাবে সুরক্ষিত করা হয়েছে!');
