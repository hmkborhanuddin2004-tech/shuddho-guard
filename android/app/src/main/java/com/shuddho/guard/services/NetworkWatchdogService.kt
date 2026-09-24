package com.shuddho.guard.services

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.Service
import android.app.admin.DevicePolicyManager
import android.content.Context
import android.content.Intent
import android.content.pm.ServiceInfo
import android.net.ConnectivityManager
import android.net.Network
import android.net.NetworkCapabilities
import android.net.NetworkRequest
import android.os.Build
import android.os.Handler
import android.os.IBinder
import android.os.Looper
import android.provider.Settings
import android.util.Log
import android.widget.Toast
import com.shuddho.guard.receivers.ShuddhoDeviceAdminReceiver
import java.net.NetworkInterface
import java.util.concurrent.Executors
import java.util.concurrent.ScheduledExecutorService
import java.util.concurrent.TimeUnit

/**
 * রিয়েল-টাইম নেটওয়ার্ক ইন্টারফেস ও ভিপিএন বাইপাস ওয়াচডগ সার্ভিস।
 * ১. ConnectivityManager.NetworkCallback দিয়ে সক্রিয় নেটওয়ার্কে TRANSPORT_VPN নজরদারি করে।
 * ২. পর্যায়ক্রমিক NetworkInterface স্ক্যানে অনুমোদনহীন ভার্চুয়াল টানেল (tun/tap/ppp/wg) শনাক্ত করে।
 * ৩. প্রক্সি সার্ভার বা বাইপাস রুটের সন্ধান পেলেই সাথে সাথে অ্যালার্ট জারি ও রিকভারি শুরু করে।
 */
class NetworkWatchdogService : Service() {

    companion object {
        private const val TAG = "NetworkWatchdogService"
        const val PREFS_NAME = "shuddho_shield"
        const val KEY_BYPASS_ATTEMPTS = "vpn_bypass_attempts"
        const val KEY_LAST_BYPASS_TIMESTAMP = "last_bypass_timestamp"
        const val KEY_LAST_ROGUE_INTERFACE = "last_rogue_interface"

        const val ACTION_VPN_BYPASS_DETECTED = "com.shuddho.guard.action.VPN_BYPASS_DETECTED"
        const val EXTRA_BYPASS_TYPE = "extra_bypass_type"
        const val EXTRA_BYPASS_DETAILS = "extra_bypass_details"

        const val NOTIFICATION_CHANNEL_ID = "shuddho_watchdog_channel"
        const val NOTIFICATION_ID = 202

        @Volatile
        var isWatchdogRunning: Boolean = false
            private set

        fun startWatchdog(context: Context) {
            val intent = Intent(context, NetworkWatchdogService::class.java)
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                context.startForegroundService(intent)
            } else {
                context.startService(intent)
            }
        }

        fun stopWatchdog(context: Context) {
            context.stopService(Intent(context, NetworkWatchdogService::class.java))
        }

        /**
         * ওয়াই-ফাই ডিরেক্ট বা নিয়ারবাই শেয়ারের ইন্টারফেসে সক্রিয় ভিপিএন/প্রক্সি রাউটিং আছে কি না
         */
        fun isVpnOrProxyRoutingActive(context: Context): Boolean {
            val proxy = scanSystemProxyNow(context)
            if (proxy != null) return true
            try {
                val cm = context.getSystemService(Context.CONNECTIVITY_SERVICE) as? ConnectivityManager
                val activeNetwork = cm?.activeNetwork
                if (activeNetwork != null) {
                    val caps = cm.getNetworkCapabilities(activeNetwork)
                    if (caps != null && caps.hasTransport(NetworkCapabilities.TRANSPORT_VPN)) {
                        return true
                    }
                }
            } catch (e: Exception) {
                Log.e(TAG, "ভিপিএন রাউটিং যাচাইয়ে ত্রুটি: ${e.message}")
            }
            return false
        }

        /**
         * সিস্টেমে সক্রিয় সমস্ত ভার্চুয়াল টানেল বা ভিপিএন ইন্টারফেসের তালিকা পাওয়ার হেল্পার
         */
        fun scanNetworkInterfacesNow(hasVpnRouting: Boolean = false): List<String> {
            val detected = mutableListOf<String>()
            try {
                val interfaces = NetworkInterface.getNetworkInterfaces() ?: return detected
                for (iface in interfaces) {
                    val name = iface.name.lowercase()
                    // Benign local Wi-Fi Direct / Nearby Share (e.g. p2p-p2p0-X, p2p-wlan0-X, p2p0)
                    // do not trigger false positives unless active VPN/proxy routing is detected.
                    val isBenignP2p = (name.startsWith("p2p-p2p0") || name.startsWith("p2p-wlan0") || name == "p2p0" || name.startsWith("p2p")) && !hasVpnRouting
                    val isVirtualTunnel = name.startsWith("tun") ||
                            name.startsWith("tap") ||
                            name.startsWith("ppp") ||
                            name.startsWith("wg") ||
                            name.startsWith("ipsec") ||
                            (name.startsWith("p2p") && !isBenignP2p)

                    if (isVirtualTunnel && iface.isUp) {
                        detected.add(iface.name)
                    }
                }
            } catch (e: Exception) {
                Log.e(TAG, "ইন্টারফেস স্ক্যানে ত্রুটি: ${e.message}")
            }
            return detected
        }

        /**
         * সিস্টেমে অনুমোদনহীন এইচটিটিপি/এইচটিটিপিএস প্রক্সি সক্রিয় কি না তা নিরীক্ষণ
         */
        fun scanSystemProxyNow(context: Context): String? {
            try {
                val host = System.getProperty("http.proxyHost")
                val port = System.getProperty("http.proxyPort")
                if (!host.isNullOrEmpty() && !port.isNullOrEmpty()) {
                    return "$host:$port"
                }

                val globalProxy = Settings.Global.getString(context.contentResolver, Settings.Global.HTTP_PROXY)
                if (!globalProxy.isNullOrEmpty() && globalProxy != ":0") {
                    return globalProxy
                }
            } catch (e: Exception) {
                Log.e(TAG, "প্রক্সি স্ক্যানে ত্রুটি: ${e.message}")
            }
            return null
        }

        /**
         * বর্তমানে কোনো অনুমোদনহীন ভিপিএন বা বাইপাস চলছে কি না তাৎক্ষণিক টেস্ট
         */
        fun isVpnBypassActive(context: Context): Boolean {
            // ১. প্রক্সি বাইপাস পরীক্ষা
            val proxy = scanSystemProxyNow(context)
            if (proxy != null) return true

            // ২. ইন্টারফেস টানেল বাইপাস পরীক্ষা (বেনাইন p2p ইন্টারফেস বাদ দেওয়া হবে যদি না ভিপিএন রাউটিং সক্রিয় থাকে)
            val hasVpnRouting = isVpnOrProxyRoutingActive(context)
            val interfaces = scanNetworkInterfacesNow(hasVpnRouting)
            if (interfaces.isEmpty()) return false

            // যদি নিজস্ব ভিপিএন সক্রিয় থাকে এবং কেবল ১টি অনুমোদিত tun ইন্টারফেস থাকে
            if (ShuddhoVpnService.isShuddhoVpnActive && interfaces.size == 1 && interfaces[0].lowercase().startsWith("tun")) {
                return false
            }
            return true
        }
    }

    private var connectivityManager: ConnectivityManager? = null
    private var vpnNetworkCallback: ConnectivityManager.NetworkCallback? = null
    private var scheduledExecutor: ScheduledExecutorService? = null
    private val mainHandler = Handler(Looper.getMainLooper())

    override fun onCreate() {
        super.onCreate()
        Log.i(TAG, "🛡️ NetworkWatchdogService তৈরি হচ্ছে...")
        createNotificationChannel()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        val notification = createSilentNotification()
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
            startForeground(NOTIFICATION_ID, notification, ServiceInfo.FOREGROUND_SERVICE_TYPE_SPECIAL_USE)
        } else {
            startForeground(NOTIFICATION_ID, notification)
        }

        isWatchdogRunning = true

        registerVpnNetworkCallback()
        startPeriodicInterfaceAudit()

        Log.i(TAG, "✅ NetworkWatchdogService ওয়াচডগ সক্রিয় ও প্রস্তুত।")
        return START_STICKY
    }

    /**
     * ConnectivityManager এর মাধ্যমে সক্রিয় TRANSPORT_VPN নজরদারি
     */
    private fun registerVpnNetworkCallback() {
        if (vpnNetworkCallback != null) return

        try {
            connectivityManager = getSystemService(Context.CONNECTIVITY_SERVICE) as? ConnectivityManager
            val request = NetworkRequest.Builder()
                .addTransportType(NetworkCapabilities.TRANSPORT_VPN)
                .build()

            val callback = object : ConnectivityManager.NetworkCallback() {
                override fun onAvailable(network: Network) {
                    super.onAvailable(network)
                    Log.d(TAG, "📡 ভিপিএন নেটওয়ার্ক সক্রিয় হয়েছে: $network")
                    verifyVpnIntegrity(network)
                }

                override fun onCapabilitiesChanged(network: Network, networkCapabilities: NetworkCapabilities) {
                    super.onCapabilitiesChanged(network, networkCapabilities)
                    if (networkCapabilities.hasTransport(NetworkCapabilities.TRANSPORT_VPN)) {
                        verifyVpnIntegrity(network)
                    }
                }

                override fun onLost(network: Network) {
                    super.onLost(network)
                    Log.d(TAG, "📡 ভিপিএন নেটওয়ার্ক বিচ্ছিন্ন হয়েছে: $network")
                }
            }

            connectivityManager?.registerNetworkCallback(request, callback)
            vpnNetworkCallback = callback
            Log.i(TAG, "📡 ConnectivityManager TRANSPORT_VPN কলব্যাক সফলভাবে নিবন্ধিত।")
        } catch (e: Exception) {
            Log.e(TAG, "NetworkCallback নিবন্ধনে ত্রুটি: ${e.message}")
        }
    }

    /**
     * ভিপিএন নেটওয়ার্কটি নিজস্ব Shuddho Guard কি না তা নিশ্চিত করা
     */
    private fun verifyVpnIntegrity(network: Network) {
        val isOurVpnActive = ShuddhoVpnService.isShuddhoVpnActive

        if (!isOurVpnActive) {
            // আমাদের নিজস্ব ভিপিএন বন্ধ, অথচ ডিভাইসে TRANSPORT_VPN চালু — এটি নিশ্চিত বাইপাস!
            Log.w(TAG, "🚨 [ALERT] অনুমোদনহীন বহিরাগত ভিপিএন নেটওয়ার্ক শনাক্ত! নেটওয়ার্ক: $network")
            handleBypassDetected("UNAUTHORIZED_VPN_TRANSPORT", "Active VPN network while ShuddhoVpnService is dormant: $network")
        } else {
            Log.i(TAG, "🛡️ Shuddho Guard অনুমোদিত ভিপিএন ট্রাফিক নিরাপদভাবে চলছে।")
        }
    }

    /**
     * প্রতি ৩ সেকেন্ড পর পর সিস্টেম লেভেলের ইন্টারফেস ও প্রক্সি স্ক্যান
     */
    private fun startPeriodicInterfaceAudit() {
        if (scheduledExecutor != null && !scheduledExecutor!!.isShutdown) return

        scheduledExecutor = Executors.newSingleThreadScheduledExecutor()
        scheduledExecutor?.scheduleWithFixedDelay({
            try {
                auditNetworkInterfaces()
                auditSystemProxy()
            } catch (e: Exception) {
                Log.e(TAG, "পর্যায়ক্রমিক অডিটে ত্রুটি: ${e.message}")
            }
        }, 1, 3, TimeUnit.SECONDS)
    }

    /**
     * NetworkInterface স্ক্যান ও অনুমোদনহীন টানেল যাচাই
     */
    private fun auditNetworkInterfaces() {
        val hasVpnRouting = isVpnOrProxyRoutingActive(this)
        val activeInterfaces = scanNetworkInterfacesNow(hasVpnRouting)
        val isOurVpn = ShuddhoVpnService.isShuddhoVpnActive

        // অনুমোদনহীন ইন্টারফেস সনাক্তকরণ
        var foundRogue: String? = null
        for (ifaceName in activeInterfaces) {
            val lower = ifaceName.lowercase()
            val isShuddhoTun = isOurVpn && (lower == "tun0" || lower.startsWith("tun"))
            if (!isShuddhoTun) {
                foundRogue = ifaceName
                break
            }
        }

        // যদি কোনো নন-tun ইন্টারফেস না থাকে, কিন্তু একাধিক tun ইন্টারফেস চলে অথবা শুদ্ধ গার্ড ভিপিএন অফ থাকে
        if (foundRogue == null) {
            if (!isOurVpn && activeInterfaces.isNotEmpty()) {
                foundRogue = activeInterfaces.first()
            } else if (activeInterfaces.size > 1) {
                foundRogue = activeInterfaces.firstOrNull { it.lowercase() != "tun0" } ?: activeInterfaces.last()
            }
        }

        if (foundRogue != null) {
            Log.w(TAG, "🚨 [ALERT] অবৈধ ভার্চুয়াল নেটওয়ার্ক ইন্টারফেস শনাক্ত: $foundRogue")
            handleBypassDetected("ROGUE_NETWORK_INTERFACE", "Unauthorized active tunnel interface: $foundRogue")
        }
    }

    /**
     * সিস্টেম প্রক্সি অডিট
     */
    private fun auditSystemProxy() {
        val proxy = scanSystemProxyNow(this)
        if (proxy != null) {
            Log.w(TAG, "🚨 [ALERT] অনুমোদনহীন সিস্টেম প্রক্সি সক্রিয়: $proxy")
            handleBypassDetected("UNAUTHORIZED_PROXY", "System HTTP proxy detected: $proxy")
        }
    }

    /**
     * বাইপাস সনাক্তকরণে তাৎক্ষণিক প্রতিরোধ ও রিকভারি কার্যকর করা
     */
    private fun handleBypassDetected(type: String, details: String) {
        // ১. অডিট হিস্টোরি ও কাউন্টার আপডেট
        val sharedPrefs = getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        val attempts = sharedPrefs.getInt(KEY_BYPASS_ATTEMPTS, 0)
        sharedPrefs.edit()
            .putInt(KEY_BYPASS_ATTEMPTS, attempts + 1)
            .putLong(KEY_LAST_BYPASS_TIMESTAMP, System.currentTimeMillis())
            .putString(KEY_LAST_ROGUE_INTERFACE, details)
            .apply()

        // ২. ব্রডকাস্ট বার্তা প্রদান
        try {
            val intent = Intent(ACTION_VPN_BYPASS_DETECTED).apply {
                putExtra(EXTRA_BYPASS_TYPE, type)
                putExtra(EXTRA_BYPASS_DETAILS, details)
                setPackage(packageName)
            }
            sendBroadcast(intent)
        } catch (e: Exception) {
            // ব্রডকাস্ট এরর ইগনোর
        }

        // ৩. ডিভাইস ওনার থাকলে সর্বদা সক্রিয় ভিপিএন (Always-on VPN) রি-এনফোর্স করা
        try {
            val dpm = getSystemService(Context.DEVICE_POLICY_SERVICE) as? DevicePolicyManager
            val adminComponent = ShuddhoDeviceAdminReceiver.getAdminComponentName(this)
            if (dpm != null && dpm.isDeviceOwnerApp(packageName)) {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
                    dpm.setAlwaysOnVpnPackage(adminComponent, packageName, true /* lockdown */)
                    Log.i(TAG, "🔒 Always-on VPN লকডাউন পুনঃকার্যকর করা হয়েছে।")
                }
            }
        } catch (e: Exception) {
            Log.e(TAG, "Always-on VPN প্রয়োগে ত্রুটি: ${e.message}")
        }

        // ৪. নিজস্ব লোকাল ভিপিএন স্বয়ংক্রিয়ভাবে পুনরায় চালু করে ট্রাফিক পুনুরুদ্ধার
        try {
            val vpnIntent = Intent(this, ShuddhoVpnService::class.java)
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                startForegroundService(vpnIntent)
            } else {
                startService(vpnIntent)
            }
            Log.i(TAG, "🔄 শুদ্ধ গার্ড ভিপিএন টানেল পুনঃস্থাপন কমান্ড প্রেরিত হয়েছে।")
        } catch (e: Exception) {
            Log.e(TAG, "ভিপিএন রিস্টার্ট ত্রুটি: ${e.message}")
        }

        // ৫. ইউজারকে সতর্ক করতে টোস্ট প্রদর্শন
        mainHandler.post {
            try {
                Toast.makeText(
                    applicationContext,
                    "⚠️ সতর্কবার্তা: অনুমোদনহীন ভিপিএন বা বাইপাস প্রতিরোধ করা হয়েছে!",
                    Toast.LENGTH_LONG
                ).show()
            } catch (e: Exception) {
                // টোস্ট ব্যর্থ হলে অগ্রাহ্য
            }
        }
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                NOTIFICATION_CHANNEL_ID,
                "Network Watchdog Service",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                setShowBadge(false)
                description = "Continuous network interface and VPN bypass monitoring"
            }
            val manager = getSystemService(NotificationManager::class.java)
            manager?.createNotificationChannel(channel)
        }
    }

    @Suppress("DEPRECATION")
    private fun createSilentNotification(): Notification {
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            Notification.Builder(this, NOTIFICATION_CHANNEL_ID)
                .setContentTitle("System Network Armor")
                .setContentText("Continuous VPN bypass watchdog active")
                .setSmallIcon(android.R.drawable.stat_notify_sync_noanim)
                .build()
        } else {
            Notification.Builder(this)
                .setContentTitle("Network Armor")
                .build()
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        isWatchdogRunning = false

        try {
            vpnNetworkCallback?.let { connectivityManager?.unregisterNetworkCallback(it) }
            vpnNetworkCallback = null
        } catch (e: Exception) {
            Log.e(TAG, "NetworkCallback আন-রেজিস্ট্রেশনে ত্রুটি: ${e.message}")
        }

        scheduledExecutor?.shutdownNow()
        scheduledExecutor = null
        Log.i(TAG, "🛑 NetworkWatchdogService বন্ধ হয়েছে।")
    }

    override fun onBind(intent: Intent?): IBinder? = null
}
