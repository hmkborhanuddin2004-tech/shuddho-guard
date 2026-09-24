package com.shuddho.guard.filters

/**
 * বাংলা ও ব্যাংলিশ (Banglish) ভাষার বিশেষ লেক্সিকন
 * আন্তর্জাতিক কোনো ব্লকার যা বুঝতে পারে না, কিন্তু বাংলাদেশে সর্বাধিক ব্যবহৃত হয়।
 */
object BanglishSlangLexicon {

    // রোমান হরফে লেখা বাংলা অশ্লীল ও চটি কি-ওয়ার্ড
    private val BANGLISH_SLANGS = setOf(
        "choti", "bangla choti", "chotikahini", "chotigolpo",
        "boudi", "deshi boudi", "gopon video", "meye link",
        "leaked video", "deshi viral", "boudir video",
        "chuda", "choda", "magi", "khanki", "bap beti",
        "aunty sex", "bhabi choti", "bhabi sex", "hot boudi",
        "deshi sexy", "bangla sex", "bangla x", "bd viral",
        "telegram leak", "mega leak", "drive link 18+",
        "porn", "xxx", "xvideos", "pornhub", "xhamster", "xnxx"
    )

    // নিষিদ্ধ টেলিগ্রাম চ্যানেল বা বটের নাম প্যাটার্ন
    private val SUSPICIOUS_PATTERNS = listOf(
        "choti", "leak", "viral 18", "adult link", "deshi mms",
        "private link", "gopon adda", "18+ link"
    )

    /**
     * কোনো টেক্সট বা সার্চ কি-ওয়ার্ড নিষিদ্ধ কি না তা অত্যন্ত দ্রুত যাচাই করে
     */
    fun isExplicit(text: String?): Boolean {
        if (text.isNullOrBlank()) return false
        val normalized = text.lowercase().trim()

        // ১. সরাসরি সেটের সাথে দ্রুত চেক
        for (slang in BANGLISH_SLANGS) {
            if (normalized.contains(slang)) {
                return true
            }
        }

        // ২. প্যাটার্ন চেক
        for (pattern in SUSPICIOUS_PATTERNS) {
            if (normalized.contains(pattern)) {
                return true
            }
        }

        return false
    }
}
