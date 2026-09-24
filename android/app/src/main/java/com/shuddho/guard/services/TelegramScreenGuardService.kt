package com.shuddho.guard.services

import android.accessibilityservice.AccessibilityService
import android.util.Log
import android.view.accessibility.AccessibilityEvent
import android.view.accessibility.AccessibilityNodeInfo
import com.shuddho.guard.filters.BanglishSlangLexicon

/**
 * রিয়েল-টাইম স্ক্রিন ও সার্চ গার্ড (Accessibility Service)
 * এটি অফিশিয়াল টেলিগ্রামের ভেতরের সার্চ বার ও ক্ষতিকর চ্যানেল পাহারা দেয়
 * এবং ফোনের সেটিংসে গিয়ে গার্ড বন্ধ করার চেষ্টা রুখে দেয়।
 */
class TelegramScreenGuardService : AccessibilityService() {

    override fun onAccessibilityEvent(event: AccessibilityEvent?) {
        if (event == null) return

        val pkgName = event.packageName?.toString() ?: return

        // ১. টেলিগ্রাম নিরীক্ষণ (অফিশিয়াল টেলিগ্রাম ও তার ভ্যারিয়েন্টসমূহ)
        if (pkgName.startsWith("org.telegram") || pkgName.contains("thunderdog")) {
            inspectTelegramContent(rootInActiveWindow)
        }

        // ২. ফোন সেটিংস পাহারা (যাতে কেউ অ্যাপ ফোর্স স্টপ বা পারমিশন অফ করতে না পারে)
        if (pkgName.contains("settings")) {
            inspectSettingsTampering(rootInActiveWindow)
        }
    }

    private fun inspectTelegramContent(rootNode: AccessibilityNodeInfo?) {
        if (rootNode == null) return

        try {
            val textNodes = ArrayList<CharSequence>()
            collectAllTexts(rootNode, textNodes)

            for (text in textNodes) {
                if (BanglishSlangLexicon.isExplicit(text.toString())) {
                    Log.w("ShuddhoGuard", "🚨 টেলিগ্রামে নিষিদ্ধ কন্টেন্ট ধরা পড়েছে: $text")
                    
                    // ০.০১ সেকেন্ডে টেলিগ্রাম বন্ধ করে হোমস্ক্রিনে পাঠিয়ে দেওয়া
                    performGlobalAction(GLOBAL_ACTION_HOME)
                    return
                }
            }
        } finally {
            rootNode.recycle()
        }
    }

    private fun inspectSettingsTampering(rootNode: AccessibilityNodeInfo?) {
        if (rootNode == null) return

        try {
            val textNodes = ArrayList<CharSequence>()
            collectAllTexts(rootNode, textNodes)

            for (text in textNodes) {
                val str = text.toString().lowercase()
                // কেউ যদি সেটিংসে শুদ্ধ গার্ডের ডেটা মুছতে বা পারমিশন অফ করতে যায়
                if (str.contains("calculator") && (str.contains("force stop") || str.contains("uninstall") || str.contains("disable"))) {
                    performGlobalAction(GLOBAL_ACTION_HOME)
                    return
                }
                // প্রাইভেট ডিএনএস সেটিংস পরিবর্তন করার চেষ্টা রুখে দেওয়া
                if (str.contains("private dns") || str.contains("প্রাইভেট ডিএনএস")) {
                    performGlobalAction(GLOBAL_ACTION_BACK)
                    return
                }
            }
        } finally {
            rootNode.recycle()
        }
    }

    private fun collectAllTexts(node: AccessibilityNodeInfo?, outList: MutableList<CharSequence>) {
        if (node == null) return

        node.text?.let { outList.add(it) }
        node.contentDescription?.let { outList.add(it) }

        for (i in 0 until node.childCount) {
            collectAllTexts(node.getChild(i), outList)
        }
    }

    override fun onInterrupt() {
        Log.e("ShuddhoGuard", "অ্যাক্সেসিবিলিটি সার্ভিস বিঘ্নিত হয়েছে")
    }
}
