package com.shuddho.guard.ui

import android.app.Activity
import android.content.Context
import android.os.Bundle
import android.widget.Button
import android.widget.TextView
import android.widget.Toast
import com.shuddho.guard.R

/**
 * শুদ্ধ গার্ড সিক্রেট ভল্ট ড্যাশবোর্ড
 * শুধুমাত্র গোপন পিন দিয়ে ক্যালকুলেটর আনলক করার পরই এটি দেখা যাবে।
 */
class VaultDashboardActivity : Activity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_vault_dashboard)

        val tvStreak = findViewById<TextView>(R.id.tvStreakDays)
        val tvStatus = findViewById<TextView>(R.id.tvSystemStatus)
        val btnPanic = findViewById<Button>(R.id.btnEmergencyFocus)

        // ডিভাইস ওনার পলিসি এনফোর্সমেন্ট রি-চেক
        com.shuddho.guard.receivers.ShuddhoDeviceAdminReceiver.applyDeviceOwnerRestrictions(this)
        com.shuddho.guard.services.NetworkWatchdogService.startWatchdog(this)

        val prefs = getSharedPreferences("shuddho_shield", Context.MODE_PRIVATE)
        val blockedVpnCount = prefs.getInt(com.shuddho.guard.receivers.AppInstallWatcher.KEY_BLOCKED_PACKAGES_COUNT, 0)
        val bypassAttempts = prefs.getInt(com.shuddho.guard.services.NetworkWatchdogService.KEY_BYPASS_ATTEMPTS, 0)

        tvStatus.text = "🛡️ সিস্টেম স্ট্যাটাস: ১০০% লৌহকঠিন সুরক্ষিত (ব্লককৃত ভিপিএন: $blockedVpnCount, বাইপাস রোধ: $bypassAttempts)"
        tvStreak.text = "১৪ দিন" // ডেমো স্ট্রিক

        btnPanic.setOnClickListener {
            Toast.makeText(this, "ধৈর্য ধরুন। গভীর শ্বাস নিন এবং চোখ বন্ধ করে ৩ বার ইস্তিগফার পড়ুন।", Toast.LENGTH_LONG).show()
        }
    }
}
