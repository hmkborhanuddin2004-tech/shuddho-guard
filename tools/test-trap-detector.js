// সর্বজনীন ক্ষতিকর লিঙ্ক (জুয়া, ক্যাসিনো, পর্নোগ্রাফি, প্ল্যাটফর্ম রিডাইরেক্ট, টেলিগ্রাম ফাঁদ) ডিটেকশন টেস্ট
// উৎপাদন কোড (Production Code) সরাসরি ইমপোর্ট করে টেস্ট করা হচ্ছে
const path = require('path');
const interceptor = require(path.join(__dirname, '../web-extension/scripts/trap-link-interceptor.js'));

const {
    analyzeLink,
    unwrapUrl,
    extractHostname,
    hostMatches,
    isBettingBrandMatch,
    isTelegramTrapLink
} = interceptor;

console.log("=== শুদ্ধ গার্ড সর্বজনীন ক্ষতিকর লিঙ্ক ও প্ল্যাটফর্ম রিডাইরেক্ট ফিল্টারিং টেস্ট ===\n");

const testSuites = [
    // ১. YouTube প্ল্যাটফর্ম র‍্যাপড লিঙ্ক ও ক্লিকবেট বেটিং টেস্ট
    {
        name: "YouTube: redirect?q= জুয়া সাইট (1xBet মিরর)",
        href: "https://www.youtube.com/redirect?event=video_description&redir_token=XYZ123&q=https%3A%2F%2Fbd-1xbet.com%2Fregister",
        context: "ভিডিওর ডেসক্রিপশনে স্পন্সরড বোনাস লিঙ্ক",
        expectedBlocked: true,
        suite: "YouTube Platform Wrappers"
    },
    {
        name: "YouTube: redirect?q= টেলিগ্রাম বাজি সিগন্যাল গ্রুপ",
        href: "https://m.youtube.com/redirect?q=https%3A%2F%2Ft.me%2Fjoinchat%2Fbabu88_crazytime_signals",
        context: "কমেন্টে পিন করা বাজি প্রেডিকশন চ্যানেল",
        expectedBlocked: true,
        suite: "YouTube Platform Wrappers"
    },
    {
        name: "YouTube: নিরাপদ উইকিপিডিয়া লিঙ্ক রিডাইরেক্ট (ফলস পজিটিভ নয়)",
        href: "https://www.youtube.com/redirect?q=https%3A%2F%2Fen.wikipedia.org%2Fwiki%2FCybersecurity",
        context: "তথ্যসূত্রের জন্য উইকিপিডিয়া পেজ দেখুন",
        expectedBlocked: false,
        suite: "YouTube Platform Wrappers"
    },
    {
        name: "YouTube: সরাসরি সাধারণ ইউটিউব ভিডিও লিঙ্ক",
        href: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        context: "শিক্ষণীয় ভিডিও টিউটোরিয়াল",
        expectedBlocked: false,
        suite: "YouTube Platform Wrappers"
    },

    // ২. Facebook Link Shim unwrapping ও ফাঁদ ডিটেকশন
    {
        name: "Facebook: l.facebook.com Link Shim জুয়া সাইট (1win মিরর)",
        href: "https://l.facebook.com/l.php?u=https%3A%2F%2F1winbd.com%2Fcasino&h=AT1m_fake_hash",
        context: "পোস্টে দেওয়া ডিপোজিট বোনাস বাজি সাইট",
        expectedBlocked: true,
        suite: "Facebook Link Shim"
    },
    {
        name: "Facebook: flx/warn রিডাইরেক্ট চটি শর্টনার লিঙ্ক",
        href: "https://facebook.com/flx/warn/?u=https%3A%2F%2Fbit.ly%2Fdeshi-boudi-gopon",
        context: "ভাইরাল গোপন ভিডিও দেখতে ক্লিক করুন",
        expectedBlocked: true,
        suite: "Facebook Link Shim"
    },
    {
        name: "Facebook: l.facebook.com নিরাপদ বিবিসি নিউজ লিঙ্ক",
        href: "https://l.facebook.com/l.php?u=https%3A%2F%2Fwww.bbc.com%2Fnews",
        context: "আন্তর্জাতিক সংবাদ বিবিসি বাংলা",
        expectedBlocked: false,
        suite: "Facebook Link Shim"
    },

    // ৩. Instagram redirect shim unwrapping
    {
        name: "Instagram: l.instagram.com রিডাইরেক্ট বাজি সাইট (Babu88 Live)",
        href: "https://l.instagram.com/?u=https%3A%2F%2Fbabu88live.com%2Fpromotions",
        context: "ইনস্টাগ্রাম বায়োর স্পন্সর লিঙ্ক",
        expectedBlocked: true,
        suite: "Instagram Redirect Shim"
    },
    {
        name: "Instagram: l.instagram.com রিডাইরেক্ট ক্ষতিকর অ্যাডাল্ট সাইট",
        href: "https://l.instagram.com/?u=https%3A%2F%2Fdeshiboudi.com",
        context: "কমেন্টে আপত্তিকর চটি সাইটের সংযোগ",
        expectedBlocked: true,
        suite: "Instagram Redirect Shim"
    },
    {
        name: "Instagram: l.instagram.com নিরাপদ গিটহাব লিঙ্ক",
        href: "https://l.instagram.com/?u=https%3A%2F%2Fgithub.com%2Ftorvalds%2Flinux",
        context: "লিনাক্স কার্নেল ওপেন সোর্স সোর্স কোড",
        expectedBlocked: false,
        suite: "Instagram Redirect Shim"
    },

    // ৪. TikTok প্রতারণামূলক লিঙ্ক ও লিঙ্ক শর্টনার
    {
        name: "TikTok: tiktok.com/link/v2 প্রতারণামূলক বেটিং অ্যাড",
        href: "https://www.tiktok.com/link/v2?target=https%3A%2F%2F1xbet-mobi.com",
        context: "টিকটক স্পন্সরড ভিডিওর ক্লিকবেট বাটন",
        expectedBlocked: true,
        suite: "TikTok Deceptive Links"
    },
    {
        name: "TikTok: tiktok.com/link/v2 শর্টনার দিয়ে লুকানো টেলিগ্রাম ফাঁদ",
        href: "https://www.tiktok.com/link/v2?target=https%3A%2F%2Ft.me%2Fjoinchat%2FXYZ123_leak_video",
        context: "টিকটক কমেন্টে ফাঁস হওয়া গোপন ভিডিও লিংক",
        expectedBlocked: true,
        suite: "TikTok Deceptive Links"
    },
    {
        name: "TikTok: বহুতল নেস্টেড রিডাইরেক্ট (YouTube -> FB Shim -> 1win-pro)",
        href: "https://www.youtube.com/redirect?q=https%3A%2F%2Fl.facebook.com%2Fl.php%3Fu%3Dhttps%253A%252F%252F1win-pro.com",
        context: "নেস্টেড রিডাইরেক্ট চেইনে লুকানো বাজি সাইট",
        expectedBlocked: true,
        suite: "TikTok Deceptive Links"
    },

    // ৫. প্রত্যক্ষ ও মিরর বেটিং ডোমেইন (1xBet, 1win, Babu88 ভ্যারিয়েন্ট)
    {
        name: "বেটিং ব্র্যান্ড 1xBet: সাবডোমেইন ও প্রিফিক্স মিরর (bd-1xbet.com)",
        href: "https://bd-1xbet.com/sports",
        context: "১০০% ওয়েলকাম বোনাস",
        expectedBlocked: true,
        suite: "Betting Brand Variants"
    },
    {
        name: "বেটিং ব্র্যান্ড 1xBet: মোবাইল মিরর (1xbet-mobi.com)",
        href: "https://1xbet-mobi.com/live",
        context: "লাইভ ক্যাসিনো ও স্পোর্টস বেটিং",
        expectedBlocked: true,
        suite: "Betting Brand Variants"
    },
    {
        name: "বেটিং ব্র্যান্ড 1win: প্রিফিক্স/সাফিক্স মিরর (1winbd.com)",
        href: "https://1winbd.com/registration",
        context: "এভিয়েটর ও লাকি জেট গেম খেলুন",
        expectedBlocked: true,
        suite: "Betting Brand Variants"
    },
    {
        name: "বেটিং ব্র্যান্ড 1win: হাইফেন সাফিক্স (1win-pro.com)",
        href: "https://1win-pro.com/casino",
        context: "প্রো বেটিং অপশন",
        expectedBlocked: true,
        suite: "Betting Brand Variants"
    },
    {
        name: "বেটিং ব্র্যান্ড Babu88: সাফিক্স মিরর (babu88live.com)",
        href: "https://babu88live.com/bd",
        context: "ক্রিকেট বাজি ও লাইভ ক্যাসিনো",
        expectedBlocked: true,
        suite: "Betting Brand Variants"
    },
    {
        name: "বেটিং ব্র্যান্ড Babu88: হাইফেন প্রিফিক্স/সাফিক্স (babu88-bd.com)",
        href: "https://babu88-bd.com/login",
        context: "বাবু৮৮ অফিসিয়াল লগইন লিংক",
        expectedBlocked: true,
        suite: "Betting Brand Variants"
    },
    {
        name: "বেটিং ব্র্যান্ড Melbet: প্রিফিক্স মিরর (bd-melbet.com)",
        href: "https://bd-melbet.com/register",
        context: "মেলবেট নতুন একাউন্ট বোনাস",
        expectedBlocked: true,
        suite: "Betting Brand Variants"
    },
    {
        name: "বেটিং ব্র্যান্ড Betway: হাইফেন ভ্যারিয়েন্ট (betway-bd.com)",
        href: "https://betway-bd.com/cricket",
        context: "অনলাইন ক্রিকেট বাজি",
        expectedBlocked: true,
        suite: "Betting Brand Variants"
    },
    {
        name: "বেটিং ব্র্যান্ড Parimatch: লাইভ সাফিক্স (parimatchlive.com)",
        href: "https://parimatchlive.com/games",
        context: "প্যারিম্যাচ অনলাইন গেমিং",
        expectedBlocked: true,
        suite: "Betting Brand Variants"
    },

    // ৬. টেলিগ্রাম ক্ষতিকর ফাঁদ ও ইনভাইট চেইন
    {
        name: "টেলিগ্রাম: ইনভাইট লিংক t.me/+... অ্যাডাল্ট কনটেক্সট ফাঁদ",
        href: "https://t.me/+aBcDeFg12345",
        context: "সম্মানিত ব্যক্তির গোপন ভিডিও ফাঁস হয়েছে কমেন্টে পুরো লিংক দেখুন",
        expectedBlocked: true,
        suite: "Telegram Honey-Traps"
    },
    {
        name: "টেলিগ্রাম: ইনভাইট লিংক t.me/joinchat/... বাজি সিগন্যাল ফাঁদ",
        href: "https://t.me/joinchat/babu88_crazytime_signals",
        context: "ক্যাসিনো এভিয়েটর গেম হ্যাক ও সিগন্যাল পেতে জয়েন করুন",
        expectedBlocked: true,
        suite: "Telegram Honey-Traps"
    },
    {
        name: "টেলিগ্রাম: ইউআরএল পাথে ট্র্যাপ স্লাগ (XYZ_leak_video)",
        href: "https://t.me/XYZ123_leak_video",
        context: "ভাইরাল ভিডিও দেখতে চ্যানেল সাবস্ক্রাইব করুন",
        expectedBlocked: true,
        suite: "Telegram Honey-Traps"
    },
    {
        name: "টেলিগ্রাম: ইউআরএল পাথে চটি স্লাগ (bangla_choti_golpo_18)",
        href: "https://t.me/bangla_choti_golpo_18",
        context: "চটি গল্পের নতুন আপডেট পেতে যুক্ত হোন",
        expectedBlocked: true,
        suite: "Telegram Honey-Traps"
    },
    {
        name: "টেলিগ্রাম: সাধারণ সংবাদ চ্যানেল (prothomalo_official) — নিরাপদ",
        href: "https://t.me/prothomalo_official",
        context: "আজকের তাজা খবর জানতে আমাদের অফিসিয়াল চ্যানেলে যুক্ত হোন",
        expectedBlocked: false,
        suite: "Telegram Honey-Traps"
    },

    // ৭. সাধারণ অ্যাডাল্ট ডোমেইন ও শর্টনার
    {
        name: "অ্যাডাল্ট ডোমেইন: xvideos সরাসরি লিংক",
        href: "https://www.xvideos.com/video12345",
        context: "পর্নোগ্রাফি ভিডিও সাইট",
        expectedBlocked: true,
        suite: "Adult Domains & Shorteners"
    },
    {
        name: "অ্যাডাল্ট ডোমেইন: banglachoti সরাসরি লিংক",
        href: "https://banglachoti.com/story/1",
        context: "অনলাইন চটি সাইট",
        expectedBlocked: true,
        suite: "Adult Domains & Shorteners"
    },
    {
        name: "শর্টনার: bit.ly এর মাধ্যমে লুকানো চটি লিংক",
        href: "https://bit.ly/deshi-boudi-gopon",
        context: "ভাইরাল গোপন ভিডিও দেখতে ক্লিক করুন",
        expectedBlocked: true,
        suite: "Adult Domains & Shorteners"
    },

    // ৮. ফলস পজিটিভ প্রতিরোধ (Safe Platform URLs)
    {
        name: "ফলস পজিটিভ টেস্ট: 1windows.com (1win নয়, নিরাপদ উইন্ডোজ সফটওয়্যার)",
        href: "https://1windows.com/downloads/setup.exe",
        context: "ডাউনলোড করুন উইন্ডোজ ইউটিলিটি",
        expectedBlocked: false,
        suite: "False Positive Prevention"
    },
    {
        name: "ফলস পজিটিভ টেস্ট: at.me (t.me নয়, নিরাপদ পোর্টফোলিও)",
        href: "https://at.me/profile/johndoe",
        context: "ব্যক্তিগত পোর্টফোলিও ওয়েবসাইট",
        expectedBlocked: false,
        suite: "False Positive Prevention"
    },
    {
        name: "ফলস পজিটিভ টেস্ট: শিক্ষণীয় পাইথন কোর্স শর্টনার",
        href: "https://bit.ly/free-python-course",
        context: "বিনামূল্যে পাইথন শিখুন এবং সার্টিফিকেট নিন",
        expectedBlocked: false,
        suite: "False Positive Prevention"
    },
    {
        name: "ফলস পজিটিভ টেস্ট: উইকিপিডিয়া বাংলাদেশ নিবন্ধ",
        href: "https://en.wikipedia.org/wiki/Bangladesh",
        context: "বাংলাদেশের ভূগোল ও ইতিহাস সম্পর্কিত তথ্যকোষ",
        expectedBlocked: false,
        suite: "False Positive Prevention"
    },
    {
        name: "ফলস পজিটিভ টেস্ট: অফিসিয়াল ফেসবুক পেজ",
        href: "https://www.facebook.com/prothomalo",
        context: "প্রথম আলো পত্রিকার ফেসবুক পেজ",
        expectedBlocked: false,
        suite: "False Positive Prevention"
    }
];

let totalCount = testSuites.length;
let passedCount = 0;
let currentSuite = "";

testSuites.forEach((tc, index) => {
    if (tc.suite !== currentSuite) {
        currentSuite = tc.suite;
        console.log(`\n--- [Suite: ${currentSuite}] ---`);
    }

    const res = analyzeLink(tc.href, tc.context);
    const passed = (res.blocked === tc.expectedBlocked) && (res.isHarmful === tc.expectedBlocked);
    if (passed) passedCount++;

    const statusBadge = passed ? "PASS ✅" : "FAIL ❌";
    const decisionBadge = res.blocked ? "🚨 ব্লকড (BLOCKED)" : "✅ নিরাপদ (ALLOWED)";

    console.log(`[টেস্ট #${index + 1}] ${tc.name}`);
    console.log(`- ইনপুট লিঙ্ক: ${tc.href}`);
    if (res.unwrappedUrl && res.unwrappedUrl !== tc.href) {
        console.log(`- আনর‍্যাপড গন্তব্য: ${res.unwrappedUrl}`);
    }
    console.log(`- সিদ্ধান্ত: ${decisionBadge} (প্রত্যাশিত: ${tc.expectedBlocked ? "BLOCKED" : "ALLOWED"}) | স্ট্যাটাস: ${statusBadge}`);
    if (!passed) {
        console.error(`  ⚠️ অমিল বিবরণ: বিভাগ = ${res.category}, বিবরণ = ${res.description}`);
    }
});

console.log("\n========================================================");
console.log(`মোট টেস্ট: ${totalCount}, উত্তীর্ণ: ${passedCount}/${totalCount}`);

if (passedCount === totalCount) {
    console.log("🎯 সর্বজনীন ক্ষতিকর লিঙ্ক, প্ল্যাটফর্ম রিডাইরেক্ট ও বেটিং ভ্যারিয়েন্ট টেস্ট সফলভাবে ১০০% উত্তীর্ণ হয়েছে!");
    process.exit(0);
} else {
    console.error("❌ কিছু টেস্ট ব্যর্থ হয়েছে। দয়া করে কোড পরীক্ষা করুন।");
    process.exit(1);
}
