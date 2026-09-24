package com.shuddho.guard.receivers

import android.app.admin.DeviceAdminReceiver
import android.app.admin.DevicePolicyManager
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.UserManager
import android.util.Log
import android.widget.Toast

/**
 * ডিভাইস অ্যাডমিনিস্ট্রেটর ও ডিভাইস ওনার রিসিভার।
 * এর মাধ্যমে লৌহকঠিন আন-ইনস্টল প্রতিরোধ, সেফ-বুট নিষ্ক্রিয়করণ ও ভিপিএন বাইপাস গার্ড পরিচালিত হয়।
 */
class ShuddhoDeviceAdminReceiver : DeviceAdminReceiver() {

    companion object {
        private const val TAG = "ShuddhoDeviceAdmin"
        const val PREFS_NAME = "shuddho_shield"
        const val KEY_MASTER_PIN = "master_pin"
        const val DEFAULT_MASTER_PIN = "7860"

        // FIX #15: SDK নামের সাথে ক্ল্যাশ এড়াতে getAdminComponentName হেল্পার
        fun getAdminComponentName(context: Context): ComponentName {
            return ComponentName(context, ShuddhoDeviceAdminReceiver::class.java)
        }

        /**
         * ডিভাইস ওনার পলিসি এনফোর্সমেন্ট (আন-ইনস্টল লক, সেফ বুট বন্ধ, থার্ড পার্টি ভিপিএন বন্ধ)।
         * এটি অনবোর্ডিং, বুট, অ্যাডমিন সক্রিয়করণ কিংবা ওয়াচডগ থেকে যেকোনো সময় কল করা যায়।
         */
        fun applyDeviceOwnerRestrictions(context: Context): Boolean {
            val dpm = context.getSystemService(Context.DEVICE_POLICY_SERVICE) as? DevicePolicyManager ?: return false
            val adminComponent = getAdminComponentName(context)

            var applied = false
            try {
                if (dpm.isDeviceOwnerApp(context.packageName)) {
                    // ১. নির্দিষ্ট প্যাকেজের (Shuddho Guard) আন-ইনস্টল সরাসরি লক করা
                    dpm.setUninstallBlocked(adminComponent, context.packageName, true)
                    Log.i(TAG, "🔒 dpm.setUninstallBlocked(${context.packageName}, true) সক্রিয় করা হয়েছে।")

                    // ২. সিস্টেমব্যাপী অ্যাপ আন-ইনস্টল বন্ধ করা
                    dpm.addUserRestriction(adminComponent, UserManager.DISALLOW_UNINSTALL_APPS)

                    // ৩. থার্ড-পার্টি ভিপিএন কনফিগারেশন বন্ধ করা
                    dpm.addUserRestriction(adminComponent, UserManager.DISALLOW_CONFIG_VPN)

                    // ৪. সেফ-মুডে বুট করা বন্ধ করা (যাতে সেফ মুডে গিয়ে আন-ইনস্টল না করা যায়)
                    dpm.addUserRestriction(adminComponent, UserManager.DISALLOW_SAFE_BOOT)

                    // ৫. ফ্যাক্টরি রিসেট নিয়ন্ত্রণ
                    dpm.addUserRestriction(adminComponent, UserManager.DISALLOW_FACTORY_RESET)

                    // ৬. নতুন ইউজার বা গেস্ট প্রোফাইল তৈরি ও রিমুভ বন্ধ করা
                    dpm.addUserRestriction(adminComponent, UserManager.DISALLOW_ADD_USER)
                    dpm.addUserRestriction(adminComponent, UserManager.DISALLOW_REMOVE_USER)

                    // ৭. লোকাল ভিপিএনকে অলওয়েজ-অন লকডাউন হিসেবে রেজিস্টার করার চেষ্টা
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
                        try {
                            dpm.setAlwaysOnVpnPackage(adminComponent, context.packageName, false)
                        } catch (e: Exception) {
                            Log.w(TAG, "setAlwaysOnVpnPackage নোট: ${e.message}")
                        }
                    }

                    applied = true
                    Log.i(TAG, "🛡️ সমস্ত ডিভাইস ওনার নিষেধাজ্ঞা (Device Owner Policies) সফলভাবে কার্যকর হয়েছে।")
                } else if (dpm.isAdminActive(adminComponent)) {
                    Log.w(TAG, "⚠️ সাধারণ ডিভাইস অ্যাডমিন সক্রিয়, তবে ডিভাইস ওনার নয়। আংশিক সুরক্ষায় চলছে।")
                }
            } catch (e: Exception) {
                Log.e(TAG, "ডিভাইস ওনার নিষেধাজ্ঞা প্রয়োগে ত্রুটি: ${e.message}")
            }
            return applied
        }

        /**
         * আন-ইনস্টল ব্লক স্ট্যাটাস পরীক্ষা
         */
        fun isUninstallBlocked(context: Context): Boolean {
            val dpm = context.getSystemService(Context.DEVICE_POLICY_SERVICE) as? DevicePolicyManager ?: return false
            val adminComponent = getAdminComponentName(context)
            return try {
                if (dpm.isDeviceOwnerApp(context.packageName)) {
                    dpm.isUninstallBlocked(adminComponent, context.packageName)
                } else false
            } catch (e: Exception) {
                false
            }
        }

        /**
         * অভিভাবক বা অ্যাডমিনের অনুমোদনে সাময়িকভাবে আন-ইনস্টল পারমিশন উন্মুক্ত করা
         */
        fun unlockForAdministrativeMaintenance(context: Context, masterPin: String): Boolean {
            val sharedPrefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            val savedPin = sharedPrefs.getString(KEY_MASTER_PIN, DEFAULT_MASTER_PIN) ?: DEFAULT_MASTER_PIN

            if (masterPin == savedPin) {
                val dpm = context.getSystemService(Context.DEVICE_POLICY_SERVICE) as? DevicePolicyManager ?: return false
                val adminComponent = getAdminComponentName(context)
                try {
                    if (dpm.isDeviceOwnerApp(context.packageName)) {
                        dpm.setUninstallBlocked(adminComponent, context.packageName, false)
                        dpm.clearUserRestriction(adminComponent, UserManager.DISALLOW_UNINSTALL_APPS)
                        dpm.clearUserRestriction(adminComponent, UserManager.DISALLOW_CONFIG_VPN)
                        dpm.clearUserRestriction(adminComponent, UserManager.DISALLOW_SAFE_BOOT)
                    }
                    Log.w(TAG, "🔓 প্রশাসনিক পিন যাচাই সফল: আন-ইনস্টল ও ভিপিএন সুরক্ষা সাময়িকভাবে উন্মুক্ত করা হয়েছে।")
                    return true
                } catch (e: Exception) {
                    Log.e(TAG, "আনলক ত্রুটি: ${e.message}")
                    return false
                }
            }
            Log.w(TAG, "❌ ভুল পিন দিয়ে সুরক্ষার প্রাচীর ভাঙার চেষ্টা!")
            return false
        }
    }

    override fun onEnabled(context: Context, intent: Intent) {
        super.onEnabled(context, intent)
        Log.i(TAG, "ডিভাইস অ্যাডমিন সক্রিয় হয়েছে।")
        // সক্রিয় হওয়ামাত্রই পলিসি চেক ও অ্যাপ্লাই করা
        applyDeviceOwnerRestrictions(context)
        Toast.makeText(context, "শুদ্ধ গার্ড: ডিভাইস সুরক্ষা প্রাচীর সক্রিয় হয়েছে", Toast.LENGTH_SHORT).show()
    }

    override fun onDisableRequested(context: Context, intent: Intent): CharSequence {
        return "⚠️ সতর্কবার্তা! শুদ্ধ গার্ড নিষ্ক্রিয় করলে সমস্ত সুরক্ষার প্রাচীর ভেঙে যাবে। এটি কি আপনি নিশ্চিত?"
    }

    // FIX #15: নিষ্ক্রিয় করা হলে সমস্ত আরোপিত রেস্ট্রিকশন প্রত্যাহার করা যাতে ডিভাইস আটকে না থাকে
    override fun onDisabled(context: Context, intent: Intent) {
        super.onDisabled(context, intent)
        val dpm = context.getSystemService(Context.DEVICE_POLICY_SERVICE) as? DevicePolicyManager
        val adminComponent = getAdminComponentName(context)

        try {
            if (dpm != null && dpm.isDeviceOwnerApp(context.packageName)) {
                dpm.setUninstallBlocked(adminComponent, context.packageName, false)
                dpm.clearUserRestriction(adminComponent, UserManager.DISALLOW_UNINSTALL_APPS)
                dpm.clearUserRestriction(adminComponent, UserManager.DISALLOW_CONFIG_VPN)
                dpm.clearUserRestriction(adminComponent, UserManager.DISALLOW_SAFE_BOOT)
                dpm.clearUserRestriction(adminComponent, UserManager.DISALLOW_FACTORY_RESET)
                dpm.clearUserRestriction(adminComponent, UserManager.DISALLOW_ADD_USER)
                dpm.clearUserRestriction(adminComponent, UserManager.DISALLOW_REMOVE_USER)
            }
        } catch (e: Exception) {
            Log.e(TAG, "অনুমতি প্রত্যাহারে ত্রুটি: ${e.message}")
        }

        Toast.makeText(context, "শুদ্ধ গার্ড: ডিভাইস সুরক্ষা নিষ্ক্রিয় করা হয়েছে", Toast.LENGTH_SHORT).show()
    }

    override fun onProfileProvisioningComplete(context: Context, intent: Intent) {
        super.onProfileProvisioningComplete(context, intent)
        // ডিভাইস ওনার (Device Owner) সফলভাবে সক্রিয় হলে লৌহকঠিন বিধি-নিষেধ আরোপ
        applyDeviceOwnerRestrictions(context)
    }
}
