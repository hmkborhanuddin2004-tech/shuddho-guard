// ফেসবুক ও সোশ্যাল মিডিয়া হানি-ট্র্যাপ ডিটেকশন টেস্ট

const SUSPICIOUS_DOMAINS = ['t.me', 'telegram.me', 'telegram.dog', 'bit.ly', 'tinyurl.com', 'cutt.ly'];
const SUSPICIOUS_KEYWORDS = [
    'choti', 'boudi', 'gopon', 'viral', 'leaked', 'leak', '18+', 'সহবাস',
    'বউ ছাড়া', 'গোপন ভিডিও', 'ভিডিও লিংক', 'কমেন্টে লিংক', 'সেক্স', 'চটি',
    'মজার ভিডিও', 'গরম খবর', 'জা-কির', 'জাকির নায়েক'
];

function isTrapLink(href, contextText) {
    const isDomain = SUSPICIOUS_DOMAINS.some(d => href.toLowerCase().includes(d));
    if (!isDomain) return false;

    const fullText = (href + ' ' + contextText).toLowerCase();
    return SUSPICIOUS_KEYWORDS.some(kw => fullText.includes(kw));
}

const testCases = [
    {
        name: "জাকির নায়েকের ছবি দিয়ে কমেন্টে সহবাস/চটি টেলিগ্রাম লিংক",
        href: "https://t.me/joinchat/XYZ123_leak_video",
        context: "বউ ছাড়া যাদের সাথে সহবাস জায়েজ বলেছেন ড. জাকির নায়েক! কমেন্টে পুরো ভিডিওর লিংক দেখুন",
        expected: true
    },
    {
        name: "সাধারণ প্রথম আলো বা খবরের টেলিগ্রাম চ্যানেল",
        href: "https://t.me/prothomalo_official",
        context: "আজকের তাজা খবর জানতে আমাদের অফিসিয়াল চ্যানেলে যুক্ত হোন",
        expected: false
    },
    {
        name: "শর্টনার দিয়ে লুকানো চটি লিংক",
        href: "https://bit.ly/deshi-boudi-gopon",
        context: "ভাইরাল গোপন ভিডিও দেখতে ক্লিক করুন",
        expected: true
    },
    {
        name: "গুগল ড্রাইভ কোডিং ক্লাস লিংক",
        href: "https://bit.ly/free-python-course",
        context: "বিনামূল্যে পাইথন শিখুন এবং সার্টিফিকেট নিন",
        expected: false
    }
];

console.log("=== শুদ্ধ গার্ড ফেসবুক হানি-ট্র্যাপ ইন্টারসেপ্টর টেস্ট ===\n");
let passed = 0;

testCases.forEach((tc, i) => {
    const result = isTrapLink(tc.href, tc.context);
    const ok = result === tc.expected;
    if (ok) passed++;
    console.log(`[টেস্ট #${i+1}] ${tc.name}`);
    console.log(`- ইনপুট: ${tc.href}`);
    console.log(`- কনটেক্সট: "${tc.context}"`);
    console.log(`- ফলাফল: ${result ? "🚨 ফাঁদ ধরা পড়েছে (BLOCKED)" : "✅ নিরাপদ (ALLOWED)"} | স্ট্যাটাস: ${ok ? "PASS" : "FAIL"}\n`);
});

console.log(`মোট টেস্ট: ${testCases.length}, উত্তীর্ণ: ${passed}/${testCases.length}`);
if (passed === testCases.length) {
    console.log("🎯 হানি-ট্র্যাপ ডিটেকশন টেস্ট সফলভাবে উত্তীর্ণ হয়েছে!");
} else {
    process.exit(1);
}
