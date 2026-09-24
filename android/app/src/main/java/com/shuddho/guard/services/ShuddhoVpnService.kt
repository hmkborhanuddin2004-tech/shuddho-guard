package com.shuddho.guard.services

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.Intent
import android.content.pm.ServiceInfo
import android.net.VpnService
import android.os.Build
import android.os.ParcelFileDescriptor
import android.util.Log

/**
 * লোকাল অলওয়েজ-অন ভিপিএন ইঞ্জিন।
 * এটি CleanBrowsing এবং Cloudflare Family IPv4 ও IPv6 ডিএনএস দিয়ে ট্রাফিক পরিচালনা করে।
 */
class ShuddhoVpnService : VpnService() {

    companion object {
        private const val TAG = "ShuddhoVpnService"

        @Volatile
        var isShuddhoVpnActive: Boolean = false
            private set

        @Volatile
        var vpnEstablishedTimestamp: Long = 0
            private set

        fun isVpnRunning(): Boolean = isShuddhoVpnActive
    }

    private var vpnInterface: ParcelFileDescriptor? = null
    private var isRunning = false

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        // FIX #14: Android 8+ এ সার্ভিস যাতে কিল না হয় সেজন্য অবিলম্বে Foreground শুরু করা
        createNotificationChannel()
        val notification = createSilentNotification()
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
            startForeground(101, notification, ServiceInfo.FOREGROUND_SERVICE_TYPE_SPECIAL_USE)
        } else {
            startForeground(101, notification)
        }

        if (!isRunning) {
            startVpnTunnel()
        }
        return START_STICKY
    }

    private fun startVpnTunnel() {
        try {
            val builder = Builder()
                .setSession("ShuddhoGuardShield")
                .addAddress("10.1.10.1", 24)
                // ১. ফ্যামিলি ও অ্যাডাল্ট ফিল্টার ডিএনএস (IPv4)
                .addDnsServer("185.228.168.10") // CleanBrowsing Adult Filter
                .addDnsServer("1.1.1.3")         // Cloudflare Family SafeSearch DNS
                // ২. IPv6 ফ্যামিলি ডিএনএস
                .addDnsServer("2606:4700:4700::1113")
                // ৩. রাউটিং (FIX #14: DNS ট্রাফিক রাউটিং নিশ্চিতকরণ)
                .addRoute("185.228.168.10", 32)
                .addRoute("1.1.1.3", 32)
                .setBlocking(true)

            try {
                builder.addRoute("2606:4700:4700::1113", 128)
            } catch (e: Exception) {
                // IPv6 সমর্থন না থাকলে সিস্টেম এড়িয়ে যাবে
            }

            vpnInterface = builder.establish()
            isRunning = true
            isShuddhoVpnActive = true
            vpnEstablishedTimestamp = System.currentTimeMillis()
            Log.i("ShuddhoGuard", "🛡️ লোকাল গার্ড ভিপিএন সফলভাবে সক্রিয় হয়েছে।")

        } catch (e: Exception) {
            Log.e("ShuddhoGuard", "ভিপিএন সংযোগে ত্রুটি: ${e.message}")
        }
    }

    override fun onRevoke() {
        super.onRevoke()
        Log.w("ShuddhoGuard", "⚠️ ভিপিএন পারমিশন প্রত্যাহার করা হয়েছে।")
        vpnInterface?.close()
        vpnInterface = null
        isRunning = false
        isShuddhoVpnActive = false
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                "shuddho_guard_channel",
                "System Background Armor",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                setShowBadge(false)
            }
            val manager = getSystemService(NotificationManager::class.java)
            manager?.createNotificationChannel(channel)
        }
    }

    @Suppress("DEPRECATION")
    private fun createSilentNotification(): Notification {
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            Notification.Builder(this, "shuddho_guard_channel")
                .setContentTitle("Calculator Engine")
                .setContentText("Math core running")
                .setSmallIcon(android.R.drawable.stat_notify_sync_noanim)
                .build()
        } else {
            Notification.Builder(this)
                .setContentTitle("Calculator")
                .build()
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        vpnInterface?.close()
        vpnInterface = null
        isRunning = false
        isShuddhoVpnActive = false
    }
}
