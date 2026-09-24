package com.shuddho.guard.ui

import android.app.Activity
import android.app.admin.DevicePolicyManager
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.net.VpnService
import android.os.Bundle
import android.provider.Settings
import android.widget.Button
import android.widget.Toast
import com.shuddho.guard.R
import com.shuddho.guard.receivers.ShuddhoDeviceAdminReceiver
import com.shuddho.guard.services.ShuddhoVpnService

/**
 * ওয়ান-ক্লিক মাস্টার অনবোর্ডিং (Digital Armor Setup)
 * ব্যবহারকারী একবার সব শর্তে একমত হয়ে "সক্রিয় করুন" বাটনে চাপ দিলেই
 * সমস্ত সিস্টেম সিকিউরিটি এক ক্লিকে লক হয়ে যাবে।
 */
class MasterOnboardingActivity : Activity() {

    private val REQUEST_VPN = 101
    private val REQUEST_DEVICE_ADMIN = 102

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_master_onboarding)

        findViewById<Button>(R.id.btnActivateAll).setOnClickListener {
            startOneClickLockdown()
        }
    }

    private fun startOneClickLockdown() {
        // ১. ডিভাইস অ্যাডমিন পারমিশন রিকোয়েস্ট
        val adminComponent = ShuddhoDeviceAdminReceiver.getAdminComponentName(this)
        val dpm = getSystemService(Context.DEVICE_POLICY_SERVICE) as DevicePolicyManager
        if (!dpm.isAdminActive(adminComponent)) {
            val intent = Intent(DevicePolicyManager.ACTION_ADD_DEVICE_ADMIN).apply {
                putExtra(DevicePolicyManager.EXTRA_DEVICE_ADMIN, adminComponent)
                putExtra(DevicePolicyManager.EXTRA_ADD_EXPLANATION, getString(R.string.admin_description))
            }
            startActivityForResult(intent, REQUEST_DEVICE_ADMIN)
        }

        // ২. লোকাল গার্ড ভিপিএন প্রস্তুতি
        val vpnIntent = VpnService.prepare(this)
        if (vpnIntent != null) {
            startActivityForResult(vpnIntent, REQUEST_VPN)
        } else {
            startService(Intent(this, ShuddhoVpnService::class.java))
        }

        // ৩. এক্সেসিবিলিটি সেটিংসের শর্টকাট (যদি চালু না থাকে)
        Toast.makeText(this, "সিস্টেম সক্রিয় হচ্ছে... এক্সেসিবিলিটি গার্ড অন করুন", Toast.LENGTH_LONG).show()
        val accIntent = Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS)
        startActivity(accIntent)

        // ৪. সফলভাবে তালিকাভুক্ত হিসেবে চিহ্নিতকরণ
        val prefs = getSharedPreferences("shuddho_shield", Context.MODE_PRIVATE)
        prefs.edit().putBoolean("is_enrolled", true).apply()

        finish()
    }

    override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
        super.onActivityResult(requestCode, resultCode, data)
        if (requestCode == REQUEST_VPN && resultCode == RESULT_OK) {
            startService(Intent(this, ShuddhoVpnService::class.java))
        }
    }
}
