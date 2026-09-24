package com.shuddho.guard.receivers

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.util.Log

/**
 * ফোনে কোনো নতুন অ্যাপ ইনস্টল হলেই তার আসল স্বরূপ যাচাই করার রিসিভার।
 * কোনো ভিপিএন যদি গেম বা ক্যালকুলেটরের ছদ্মবেশেও আসে, এর মাধ্যমে সাথে সাথে ধরা পড়বে।
 */
class AppInstallWatcher : BroadcastReceiver() {

    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action == Intent.Action_PACKAGE_ADDED) {
            val data = intent.data ?: return
            val packageName = data.schemeSpecificPart ?: return

            Log.d("ShuddhoGuard", "নতুন ইনস্টল হওয়া প্যাকেজ নিরীক্ষণ করা হচ্ছে: $packageName")
            checkIfVpnOrBypassTool(context, packageName)
        }
    }

    private fun checkIfVpnOrBypassTool(context: Context, packageName: String) {
        try {
            val pm = context.packageManager
            val packageInfo = pm.getPackageInfo(
                packageName,
                PackageManager.GET_SERVICES or PackageManager.GET_PERMISSIONS
            )

            // ১. ভিপিএন সার্ভিসের উপস্থিতি যাচাই (BIND_VPN_SERVICE)
            val services = packageInfo.services
            var isVpn = false
            if (services != null) {
                for (service in services) {
                    if (service.permission == "android.permission.BIND_VPN_SERVICE") {
                        isVpn = true
                        break
                    }
                }
            }

            // ২. পরিচিত ভিপিএন পারমিশন থাকলে চিহ্নিতকরণ
            if (isVpn) {
                Log.w("ShuddhoGuard", "⚠️ বিপজ্জনক ছদ্মবেশী ভিপিএন শনাক্ত হয়েছে: $packageName")
                // এখানে অ্যাপটির বিরুদ্ধে তাৎক্ষণিক ডিফেন্স কার্যকর হবে
                handleDetectedVpn(context, packageName)
            }
        } catch (e: Exception) {
            Log.e("ShuddhoGuard", "প্যাকেজ স্ক্যানে ত্রুটি: ${e.message}")
        }
    }

    private fun handleDetectedVpn(context: Context, packageName: String) {
        // Device Owner সক্রিয় থাকলে সরাসরি এই প্যাকেজটিকে সাসপেন্ড বা ব্লক করে দেওয়া হবে
        val sharedPrefs = context.getSharedPreferences("shuddho_shield", Context.MODE_PRIVATE)
        sharedPrefs.edit().putBoolean("blocked_pkg_$packageName", true).apply()
    }
}
