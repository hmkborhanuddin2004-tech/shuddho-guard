// বাংলা ও ব্যাংলিশ স্ল্যাং ডিটেকশন অ্যালগরিদম ভেরিফিকেশন টেস্ট

const BANGLISH_SLANGS = new Set([
    "choti", "bangla choti", "chotikahini", "chotigolpo",
    "boudi", "deshi boudi", "gopon video", "meye link",
    "leaked video", "deshi viral", "boudir video",
    "chuda", "choda", "magi", "khanki", "bap beti",
    "aunty sex", "bhabi choti", "bhabi sex", "hot boudi",
    "deshi sexy", "bangla sex", "bangla x", "bd viral",
    "telegram leak", "mega leak", "drive link 18+",
    "porn", "xxx", "xvideos", "pornhub", "xhamster", "xnxx"
]);

const SUSPICIOUS_PATTERNS = [
    "choti", "leak", "viral 18", "adult link", "deshi mms",
    "private link", "gopon adda", "18+ link"
];

function isExplicit(text) {
    if (!text) return false;
    const normalized = text.toLowerCase().trim();

    for (const slang of BANGLISH_SLANGS) {
        if (normalized.includes(slang)) return true;
    }
    for (const pattern of SUSPICIOUS_PATTERNS) {
        if (normalized.includes(pattern)) return true;
    }
    return false;
}

const testCases = [
    { input: "deshi boudi viral video telegram link", expected: true },
    { input: "bangla choti golpo pdf download", expected: true },
    { input: "HSC Physics 1st Paper Book by Dr. Shahjahan Tapan", expected: false },
    { input: "Learn Python and Node.js for Beginners", expected: false },
    { input: "gopon video mega drive link", expected: true },
    { input: "Bangladesh Cricket Match Highlights 2026", expected: false },
    { input: "hot boudir choti kahini", expected: true }
];

console.log("=== শুদ্ধ গার্ড (Shuddho Guard) বাংলা/ব্যাংলিশ ফিল্টার টেস্ট ===\n");
let passed = 0;

testCases.forEach((tc, idx) => {
    const result = isExplicit(tc.input);
    const ok = result === tc.expected;
    if (ok) passed++;
    console.log(`[টেস্ট #${idx + 1}] "${tc.input}"`);
    console.log(`- ফলাফল: ${result ? "🚨 ব্লকড (Explicit)" : "✅ নিরাপদ (Clean)"} | স্ট্যাটাস: ${ok ? "PASS" : "FAIL"}\n`);
});

console.log(`মোট টেস্ট: ${testCases.length}, উত্তীর্ণ: ${passed}/${testCases.length}`);
if (passed === testCases.length) {
    console.log("🎯 সব টেস্ট সফলভাবে উত্তীর্ণ হয়েছে!");
} else {
    process.exit(1);
}
