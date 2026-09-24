// সর্বজনীন ক্ষতিকর লিঙ্ক (জুয়া, ক্যাসিনো, পর্নোগ্রাফি, হানি-ট্র্যাপ) ডিটেকশন টেস্ট

const GAMBLING_DOMAINS = [
    '1xbet', 'melbet', 'bet365', 'babu88', 'jeetbuzz', 'mostbet', 'parimatch',
    'crazytime', 'linebet', 'betway', 'krikya', 'bajilive', 'crickex', 'betwinner',
    '22bet', '1win', 'megapari', 'dafabet', 'stake.com', 'bc.game', 'shillongteer'
];
const GAMBLING_KEYWORDS = [
    '1xbet', 'melbet', 'babu88', 'jeetbuzz', 'mostbet', 'parimatch', 'casino', 'ক্যাসিনো',
    'জুয়া', 'জুয়া', 'বাজি', 'বেটিং', 'টাকা ইনকাম লিংক', 'ডিপোজিট বোনাস', 'প্রেডিকশন গ্রুপ',
    'aviator', 'crazy time', 'রুলেট', 'তিন পাত্তি', 'betting link', 'betting tips'
];
const ADULT_DOMAINS = [
    'pornhub.com', 'xvideos.com', 'xnxx.com', 'xhamster.com', 'stripchat.com', 'bongacams.com',
    'chotikahini.com', 'banglachoti.com', 'deshiboudi.com', 'bdchoti.net', 'redwap.me', 'spankbang.com',
    'brazzers.com', 'chaturbate.com', 'onlyfans.com'
];
const ADULT_KEYWORDS = [
    'choti', 'boudi', 'gopon', 'viral video', 'leaked', 'leak', '18+', 'সহবাস',
    'বউ ছাড়া', 'বউ ছাড়া', 'গোপন ভিডিও', 'ভিডিও লিংক', 'কমেন্টে লিংক', 'সেক্স', 'চটি গল্প',
    'হট ভিডিও', 'নগ্ন', 'ক্যাম স্ক্যান্ডাল', 'এমএমএস', 'mms', 'ভাইরাল লিংক'
];
const TELEGRAM_DOMAINS = ['t.me', 'telegram.me', 'telegram.dog'];
const SHORTENER_DOMAINS = ['bit.ly', 'tinyurl.com', 'cutt.ly', 'is.gd', 't.co', 'rb.gy', 'shorturl.at'];

function extractHostname(rawUrl) {
    if (!rawUrl) return '';
    try {
        const u = new URL(rawUrl);
        return (u.hostname || '').toLowerCase();
    } catch (e) {
        return '';
    }
}

function hostMatches(hostname, pattern) {
    if (!hostname || !pattern) return false;
    hostname = hostname.toLowerCase().trim();
    pattern = pattern.toLowerCase().trim();

    if (hostname === pattern || hostname.endsWith('.' + pattern)) {
        return true;
    }

    if (!pattern.includes('.')) {
        const labels = hostname.split('.');
        for (const label of labels) {
            if (label === pattern) return true;
            if (label.startsWith(pattern + '-') || label.startsWith(pattern + '_')) return true;
            const digitsRegex = new RegExp(`^${pattern}[0-9]+$`);
            if (digitsRegex.test(label)) return true;
        }
    }

    return false;
}

function analyzeLink(href, contextText) {
    const hostname = extractHostname(href);
    const full = (href + ' ' + contextText).toLowerCase();

    const isTelegramDomain = TELEGRAM_DOMAINS.some(d => hostMatches(hostname, d));
    const isShortener = SHORTENER_DOMAINS.some(d => hostMatches(hostname, d));
    const isGamblingDomain = GAMBLING_DOMAINS.some(d => hostMatches(hostname, d));
    const hasGamblingKeywords = GAMBLING_KEYWORDS.some(kw => full.includes(kw));

    const isAdultDomain = ADULT_DOMAINS.some(d => hostMatches(hostname, d));
    const hasAdultKeywords = ADULT_KEYWORDS.some(kw => full.includes(kw));

    // ১. জুয়া ও ক্যাসিনো
    if (isGamblingDomain || (hasGamblingKeywords && (isShortener || isTelegramDomain))) {
        return { blocked: true, category: 'জুয়া ও ক্যাসিনো' };
    }

    // ২. পর্নোগ্রাফি ও চটি (FIX #12: hasAdultKeywords সক্রিয়)
    if (isAdultDomain || (hasAdultKeywords && (isShortener || isTelegramDomain || href.includes('video') || href.includes('watch')))) {
        return { blocked: true, category: 'পর্নোগ্রাফি ও চটি' };
    }

    // ৩. টেলিগ্রাম হানি-ট্র্যাপ
    if (isTelegramDomain) {
        const hasTrapSlug = ['leak', 'choti', 'boudi', 'viral', '18plus', 'casino', 'betting'].some(s => href.toLowerCase().includes(s));
        if (hasTrapSlug || hasAdultKeywords || hasGamblingKeywords) {
            return { blocked: true, category: 'টেলিগ্রাম ফাঁদ' };
        }
    }

    // ৪. শর্টনার দিয়ে লুকানো ক্ষতিকর লিংক
    if (isShortener && (hasAdultKeywords || hasGamblingKeywords)) {
        return { blocked: true, category: 'লুকানো ক্ষতিকর লিংক' };
    }

    return { blocked: false, category: 'নিরাপদ' };
}

const testCases = [
    {
        name: "অনলাইন জুয়া/ক্যাসিনো সাইট (1xBet / Babu88)",
        href: "https://1xbet-bangladesh.com/register?promo=freebonus",
        context: "আজই একাউন্ট খুলুন এবং ১০০% ডিপোজিট বোনাস নিন",
        expectedBlocked: true
    },
    {
        name: "টেলিগ্রাম ক্যাসিনো ও বাজি প্রেডিকশন গ্রুপ",
        href: "https://t.me/joinchat/babu88_crazytime_signals",
        context: "ক্যাসিনো এভিয়েটর গেম হ্যাক ও সিগন্যাল পেতে জয়েন করুন",
        expectedBlocked: true
    },
    {
        name: "পর্নোগ্রাফি ওয়েবসাইট লিংক (xvideos / banglachoti)",
        href: "https://www.xvideos.com/video12345",
        context: "অ্যাডাল্ট ভিডিও সাইট",
        expectedBlocked: true
    },
    {
        name: "ক্লিকবেট পোস্টের কমেন্টে টেলিগ্রাম হানি-ট্র্যাপ লিংক",
        href: "https://t.me/joinchat/XYZ123_leak_video",
        context: "সম্মানিত ব্যক্তির ছবি দিয়ে ভুয়া পোস্ট: কমেন্টে পুরো গোপন ভিডিওর লিংক দেখুন",
        expectedBlocked: true
    },
    {
        name: "শর্টনার দিয়ে লুকানো চটি লিংক",
        href: "https://bit.ly/deshi-boudi-gopon",
        context: "ভাইরাল গোপন ভিডিও দেখতে ক্লিক করুন",
        expectedBlocked: true
    },
    {
        name: "স্বাভাবিক খবরের টেলিগ্রাম চ্যানেল (প্রথম আলো)",
        href: "https://t.me/prothomalo_official",
        context: "আজকের তাজা খবর জানতে আমাদের অফিসিয়াল চ্যানেলে যুক্ত হোন",
        expectedBlocked: false
    },
    {
        name: "শিক্ষণীয় পাইথন প্রোগ্রামিং কোর্স লিংক",
        href: "https://bit.ly/free-python-course",
        context: "বিনামূল্যে পাইথন শিখুন এবং সার্টিফিকেট নিন",
        expectedBlocked: false
    },
    {
        name: "FIX #11: 1windows.com ফলস পজিটিভ টেস্ট (নিরাপদ থাকা আবশ্যক)",
        href: "https://1windows.com/downloads/setup.exe",
        context: "ডাউনলোড করুন উইন্ডোজ ইউটিলিটি",
        expectedBlocked: false
    },
    {
        name: "FIX #11: at.me ডোমেইন ফলস পজিটিভ টেস্ট (t.me নয়)",
        href: "https://at.me/profile/johndoe",
        context: "ব্যক্তিগত পোর্টফোলিও",
        expectedBlocked: false
    },
    {
        name: "FIX #12: অজানা সাইটে অ্যাডাল্ট কী-ওয়ার্ড সহ ট্র্যাপ লিংক",
        href: "https://unknown-suspicious-server.xyz/watch?video=9988",
        context: "গোপন ভিডিও ফাঁস হয়েছে কমেন্টে লিংক দেখুন",
        expectedBlocked: true
    }
];

console.log("=== শুদ্ধ গার্ড সর্বজনীন ক্ষতিকর লিঙ্ক ফিল্টারিং টেস্ট ===\n");
let passed = 0;

testCases.forEach((tc, i) => {
    const res = analyzeLink(tc.href, tc.context);
    const ok = res.blocked === tc.expectedBlocked;
    if (ok) passed++;
    console.log(`[টেস্ট #${i+1}] ${tc.name}`);
    console.log(`- লিঙ্ক: ${tc.href}`);
    console.log(`- ধরন: ${res.category}`);
    console.log(`- সিদ্ধান্ত: ${res.blocked ? "🚨 ব্লকড (BLOCKED)" : "✅ নিরাপদ (ALLOWED)"} | স্ট্যাটাস: ${ok ? "PASS" : "FAIL"}\n`);
});

console.log(`মোট টেস্ট: ${testCases.length}, উত্তীর্ণ: ${passed}/${testCases.length}`);
if (passed === testCases.length) {
    console.log("🎯 সর্বজনীন ক্ষতিকর লিঙ্ক ফিল্টারিং টেস্ট সফলভাবে উত্তীর্ণ হয়েছে!");
} else {
    process.exit(1);
}
