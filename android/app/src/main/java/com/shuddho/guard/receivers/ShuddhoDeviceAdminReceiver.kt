package com.shuddho.guard.receivers

import android.app.admin.DeviceAdminReceiver
import android.app.admin.DevicePolicyManager
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.os.UserManager
import android.widget.Toast

/**
 * ডিভাইস অ্যাডমিনিস্ট্রেটর ও ডিভাইস ওনার রিসিভার।
 * এর মাধ্যমে আন-ইনস্টল প্রতিরোধ এবং সিস্টেম লকডাউন পরিচালনা করা হয়।
 */
class ShuddhoDeviceAdminReceiver : DeviceAdminReceiver() {

    override fun onEnabled(context: Context, intent: Intent) {
        super.onEnabled(context, intent)
        Toast.makeText(context, "শুদ্ধ গার্ড: ডিভাইস সুরক্ষা প্রাচীর সক্রিয় হয়েছে", Toast.LENGTH_SHORT).show()
    }

    override fun onDisableRequested(context: Context, intent: Intent): CharSequence {
        return "⚠️ সতর্কবার্তা! শুদ্ধ গার্ড নিষ্ক্রিয় করলে সমস্ত সুরক্ষার প্রাচীর ভেঙে যাবে। এটি কি আপনি নিশ্চিত?"
    }

    override fun onDisabled(context: Context, intent: Intent) {
        super.onDisabled(context, intent)
        Toast.makeText(context, "সুরক্ষা নিষ্ক্রিয় করা হয়েছে", Toast.LENGTH_SHORT).show()
    }

    override fun onProfileProvisioningComplete(context: Context, intent: Intent) {
        super.onProfileProvisioningComplete(context, intent)
        // ডিভাইস ওনার (Device Owner) সফলভাবে সক্রিয় হলে লৌহকঠিন বিধি-নিষেধ আরোপ
        applyDeviceOwnerRestrictions(context)
    }

    private fun applyDeviceOwnerRestrictions(context: Context) {
        val dpm = context.getSystemService(Context.DEVICE_POLICY_SERVICE) as? DevicePolicyManager ?: return
        val adminComponent = ComponentName(context, ShuddhoDeviceAdminReceiver::class.java)

        if (dpm.isDeviceOwnerApp(context.packageName)) {
            // ১. অ্যাপ আন-ইনস্টল বন্ধ করা
            dpm.addUserRestriction(adminComponent, UserManager.DISALLOW_UNINSTALL_APPS)
            // ২. থার্ড-পার্টি ভিপিএন কনফিগারেশন বন্ধ করা
            dpm.addUserRestriction(adminComponent, UserManager.DISALLOW_CONFIG_VPN)
            // ৩. সেফ-মুডে বুট করা বন্ধ করা
            dpm.addUserRestriction(adminComponent, UserManager.DISALLOW_SAFE_BOOT)
            // ৪. প্রাইভেট ডিএনএস বা ফ্যাক্টরি রিসেট অনুমতি নিয়ন্ত্রণ
            dpm.addUserRestriction(adminComponent, UserManager.DISALLOW_FACTORY_RESET)
        }
    }
}
