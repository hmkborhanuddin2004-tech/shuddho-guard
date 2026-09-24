package com.shuddho.guard.receivers

import android.app.admin.DevicePolicyManager
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import android.util.Log
import android.widget.Toast

/**
 * ফোনে কোনো নতুন অ্যাপ ইনস্টল হলেই তার আসল স্বরূপ যাচাই করার রিসিভার।
 * কোনো ভিপিএন বা বাইপাস টুল যদি গেম বা ক্যালকুলেটরের ছদ্মবেশেও আসে, এর মাধ্যমে সাথে সাথে ধরা পড়বে
 * এবং Device Policy Manager দিয়ে তাৎক্ষণিকভাবে অ্যাপটি সাসপেন্ড ও হাইড করা হবে।
 */
class AppInstallWatcher : BroadcastReceiver() {

    companion object {
        private const val TAG = "AppInstallWatcher"
        const val PREFS_NAME = "shuddho_shield"
        const val KEY_BLOCKED_PACKAGES_COUNT = "blocked_vpn_count"
        const val ACTION_ROGUE_VPN_DETECTED = "com.shuddho.guard.action.ROGUE_VPN_DETECTED"
        const val EXTRA_BLOCKED_PACKAGE = "extra_blocked_package"
        const val EXTRA_DETECTION_REASON = "extra_detection_reason"

        // ১. জনপ্রিয় রোগ ভিপিএন ও প্রক্সি প্যাকেজ আইডির সিগনেচার ডাটাবেজ
        val KNOWN_ROGUE_VPN_PACKAGES = setOf(
            // Turbo VPN
            "free.vpn.unblock.proxy.turbovpn",
            "free.vpn.unblock.proxy.turbovpn.lite",
            "com.turbovpn.free",
            "com.turbo.vpn",
            // Super VPN
            "com.free.vpn.super.hotspot.open",
            "com.fast.free.unblock.secure.vpn",
            "com.jrzheng.supervpnfree",
            "com.supervpn.client",
            // Thunder VPN
            "com.thunder.vpn",
            "com.fast.vpn.thunder",
            // Psiphon
            "com.psiphon3",
            "com.psiphon3.subscription",
            "com.ca.psiphon",
            // Hola VPN
            "org.hola",
            "com.hola.vpn",
            "org.holavpn",
            // ExpressVPN
            "com.expressvpn.vpn",
            // NordVPN
            "com.nordvpn.android",
            "co.nordvpn",
            // Surfshark
            "com.surfshark.vpnclient.android",
            // CyberGhost
            "com.cyberghostro.vpn",
            // Touch VPN
            "com.northghost.touchvpn",
            // ProtonVPN
            "com.protonvpn.android",
            // Windscribe
            "com.windscribe.vpn",
            // TunnelBear
            "com.tunnelbear.android",
            // WireGuard & OpenVPN
            "com.wireguard.android",
            "de.blinkt.openvpn",
            "net.openvpn.openvpn",
            "net.openvpn.connect.android",
            // Shadowsocks, V2Ray & Clash
            "com.github.shadowsocks",
            "com.v2ray.ang",
            "com.github.kr328.clash",
            "com.github.kr328.clash.meta",
            // Orbot / Tor
            "org.torproject.android",
            "org.torproject.torbrowser",
            // অন্যান্য জনপ্রিয় বাইপাস টুল
            "com.fast.free.unblock.vpn.secure.proxy",
            "com.kscore.vpn",
            "com.xvpn.zmaster",
            "com.skyvpn.capsule",
            "com.ultrasurf.us",
            "com.lantern.vpn",
            "com.simplexsolutionsinc.vpnunlimited",
            "com.hidemyass.android.vpn",
            "com.pia.android",
            "com.speedify.speedifyandroid",
            "com.adguard.vpn"
        )

        // ২. রোগ প্যাকেজ নামের সাবস্ট্রিং ও কিওয়ার্ড প্যাটার্ন
        val ROGUE_KEYWORD_PATTERNS = listOf(
            Regex("(^|\\.)turbovpn($|\\.)", RegexOption.IGNORE_CASE),
            Regex("(^|\\.)supervpn($|\\.)", RegexOption.IGNORE_CASE),
            Regex("(^|\\.)thundervpn($|\\.)", RegexOption.IGNORE_CASE),
            Regex("(^|\\.)psiphon($|\\.)", RegexOption.IGNORE_CASE),
            Regex("(^|\\.)expressvpn($|\\.)", RegexOption.IGNORE_CASE),
            Regex("(^|\\.)nordvpn($|\\.)", RegexOption.IGNORE_CASE),
            Regex("(^|\\.)surfshark($|\\.)", RegexOption.IGNORE_CASE),
            Regex("(^|\\.)cyberghost($|\\.)", RegexOption.IGNORE_CASE),
            Regex("(^|\\.)wireguard($|\\.)", RegexOption.IGNORE_CASE),
            Regex("(^|\\.)openvpn($|\\.)", RegexOption.IGNORE_CASE),
            Regex("(^|\\.)shadowsocks($|\\.)", RegexOption.IGNORE_CASE),
            Regex("(^|\\.)v2ray($|\\.)", RegexOption.IGNORE_CASE),
            Regex("(^|\\.)clash($|\\.)", RegexOption.IGNORE_CASE),
            Regex("(^|\\.)vpnproxy($|\\.)", RegexOption.IGNORE_CASE),
            Regex("(^|\\.)freevpn($|\\.)", RegexOption.IGNORE_CASE),
            Regex("(^|\\.)fastvpn($|\\.)", RegexOption.IGNORE_CASE),
            Regex("(^|\\.)securevpn($|\\.)", RegexOption.IGNORE_CASE),
            Regex("(^|\\.)unblockvpn($|\\.)", RegexOption.IGNORE_CASE)
        )

        /**
         * প্যাকেজটি রোগ ভিপিএন বা বাইপাস টুল কি না তা যাচাই করার মেথড
         */
        fun isRogueVpnOrProxyPackage(context: Context, packageName: String): Pair<Boolean, String> {
            // নিজস্ব প্যাকেজ সবসময় অনুমোদিত ও সুরক্ষিত
            if (packageName == context.packageName) {
                return Pair(false, "Whitelisted Shuddho Guard Package")
            }

            val lowerPkg = packageName.lowercase()

            // ক. সিগনেচার ডাটাবেজে হুবহু মিল
            if (KNOWN_ROGUE_VPN_PACKAGES.contains(lowerPkg)) {
                return Pair(true, "Matched Known Rogue VPN Signature: $packageName")
            }

            // খ. কি-ওয়ার্ড প্যাটার্ন বিশ্লেষণ
            for (pattern in ROGUE_KEYWORD_PATTERNS) {
                if (pattern.containsMatchIn(lowerPkg)) {
                    return Pair(true, "Matched Rogue VPN Keyword Pattern: ${pattern.pattern}")
                }
            }

            // গ. প্যাকেজ সার্ভিসে BIND_VPN_SERVICE অনুমতি ঘোষণা রয়েছে কি না যাচাই
            try {
                val pm = context.packageManager
                val packageInfo = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                    pm.getPackageInfo(
                        packageName,
                        PackageManager.PackageInfoFlags.of((PackageManager.GET_SERVICES or PackageManager.GET_PERMISSIONS).toLong())
                    )
                } else {
                    @Suppress("DEPRECATION")
                    pm.getPackageInfo(packageName, PackageManager.GET_SERVICES or PackageManager.GET_PERMISSIONS)
                }

                val services = packageInfo.services
                if (services != null) {
                    for (service in services) {
                        if (service.permission == "android.permission.BIND_VPN_SERVICE") {
                            return Pair(true, "Declares BIND_VPN_SERVICE on service: ${service.name}")
                        }
                        val serviceName = service.name.lowercase()
                        if (serviceName.contains("vpnservice") || serviceName.contains("vpntunnel") || serviceName.contains("proxyservice")) {
                            return Pair(true, "Declares VPN tunnel service: ${service.name}")
                        }
                    }
                }
            } catch (e: Exception) {
                // প্যাকেজ আন-ইনস্টল হয়ে গেলে বা রিড অ্যাক্সেস না থাকলে হ্যান্ডেল করা
            }

            return Pair(false, "Safe package")
        }

        /**
         * সিস্টেমে ইতিমধ্যে ইনস্টল থাকা সব অ্যাপ স্ক্যান করে রোগ ভিপিএন ব্লক করা
         */
        fun scanAndEnforceAllInstalledPackages(context: Context): List<String> {
            val blocked = mutableListOf<String>()
            try {
                val pm = context.packageManager
                val installedPackages = pm.getInstalledPackages(PackageManager.GET_SERVICES)
                for (pkg in installedPackages) {
                    val pkgName = pkg.packageName
                    if (pkgName == context.packageName) continue
                    val (isRogue, reason) = isRogueVpnOrProxyPackage(context, pkgName)
                    if (isRogue) {
                        Log.w(TAG, "🔍 ব্যাকগ্রাউন্ড স্ক্যানে রোগ ভিপিএন চিহ্নিত: $pkgName ($reason)")
                        handleDetectedVpn(context, pkgName, reason)
                        blocked.add(pkgName)
                    }
                }
            } catch (e: Exception) {
                Log.e(TAG, "ইনস্টলড প্যাকেজ স্ক্যানে ত্রুটি: ${e.message}")
            }
            return blocked
        }

        /**
         * চিহ্নিত রোগ ভিপিএন বা বাইপাস টুলের বিরুদ্ধে তাৎক্ষণিক শাস্তিমূলক ব্যবস্থা প্রয়োগ
         * ১. dpm.setPackagesSuspended(adminComponent, arrayOf(packageName), true)
         * ২. dpm.setApplicationHidden(adminComponent, packageName, true)
         * ৩. অডিট হিস্টোরি ও ব্রডকাস্ট অ্যালার্ট
         */
        fun handleDetectedVpn(context: Context, packageName: String, reason: String = "Rogue VPN bypass tool"): Boolean {
            Log.w(TAG, "🚨 [ENFORCEMENT] রোগ ভিপিএন সনাক্ত হয়েছে: $packageName | কারণ: $reason")

            // ১. স্টেট ও অডিট হিস্টোরি সংরক্ষণ
            val sharedPrefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            val currentCount = sharedPrefs.getInt(KEY_BLOCKED_PACKAGES_COUNT, 0)
            sharedPrefs.edit()
                .putBoolean("blocked_pkg_$packageName", true)
                .putString("blocked_reason_$packageName", reason)
                .putLong("blocked_time_$packageName", System.currentTimeMillis())
                .putInt(KEY_BLOCKED_PACKAGES_COUNT, currentCount + 1)
                .apply()

            var enforcementSuccess = false

            // ২. Device Policy Manager এর মাধ্যমে সাসপেনশন ও হাইডিং
            val dpm = context.getSystemService(Context.DEVICE_POLICY_SERVICE) as? DevicePolicyManager
            val adminComponent = ShuddhoDeviceAdminReceiver.getAdminComponentName(context)

            if (dpm != null && dpm.isDeviceOwnerApp(context.packageName)) {
                try {
                    // ক. অ্যাপ সাসপেন্ড করা (আইকন ধূসর হয়ে যাবে এবং ওপেন করার চেষ্টা বন্ধ হবে)
                    val unhandled = dpm.setPackagesSuspended(adminComponent, arrayOf(packageName), true)
                    if (unhandled.isEmpty()) {
                        Log.i(TAG, "✅ [SUCCESS] dpm.setPackagesSuspended($packageName, true) সফল হয়েছে।")
                        enforcementSuccess = true
                    } else {
                        Log.w(TAG, "⚠️ setPackagesSuspended আংশিক ব্যর্থ: ${unhandled.joinToString()}")
                    }
                } catch (e: Exception) {
                    Log.e(TAG, "setPackagesSuspended ব্যর্থ: ${e.message}")
                }

                try {
                    // খ. অ্যাপকে লঞ্চার ও সিস্টেম অ্যাপ তালিকা থেকে সম্পূর্ণরূপে লুকিয়ে ফেলা
                    val hiddenSuccess = dpm.setApplicationHidden(adminComponent, packageName, true)
                    Log.i(TAG, "✅ [SUCCESS] dpm.setApplicationHidden($packageName, true) = $hiddenSuccess")
                    if (hiddenSuccess) {
                        enforcementSuccess = true
                    }
                } catch (e: Exception) {
                    Log.e(TAG, "setApplicationHidden ব্যর্থ: ${e.message}")
                }
            } else {
                Log.w(TAG, "⚠️ Device Owner সক্রিয় না থাকায় সরাসরি সাসপেন্ড করা সম্ভব হয়নি; লোকাল ব্লকলিস্টে নথিভুক্ত রাখা হলো।")
            }

            // ৩. নোটিফিকেশন / সতর্কবার্তা ব্রডকাস্ট পাঠানো
            try {
                val broadcastIntent = Intent(ACTION_ROGUE_VPN_DETECTED).apply {
                    putExtra(EXTRA_BLOCKED_PACKAGE, packageName)
                    putExtra(EXTRA_DETECTION_REASON, reason)
                    setPackage(context.packageName)
                }
                context.sendBroadcast(broadcastIntent)
            } catch (e: Exception) {
                // ব্রডকাস্ট এরর হ্যান্ডেল করা
            }

            try {
                Toast.makeText(
                    context,
                    "⚠️ শুদ্ধ গার্ড: বিপজ্জনক ভিপিএন ($packageName) ব্লক ও সাসপেন্ড করা হয়েছে!",
                    Toast.LENGTH_LONG
                ).show()
            } catch (e: Exception) {
                // ব্যাকগ্রাউন্ড থ্রেডে টোস্টে এরর হতে পারে
            }

            return enforcementSuccess
        }
    }

    override fun onReceive(context: Context, intent: Intent) {
        val action = intent.action
        if (action == Intent.ACTION_PACKAGE_ADDED || action == Intent.ACTION_PACKAGE_REPLACED) {
            val data = intent.data ?: return
            val packageName = data.schemeSpecificPart ?: return

            Log.d(TAG, "নতুন ইনস্টল বা আপডেট হওয়া প্যাকেজ নিরীক্ষণ করা হচ্ছে: $packageName")
            val (isRogue, reason) = isRogueVpnOrProxyPackage(context, packageName)
            if (isRogue) {
                Log.w(TAG, "⚠️ বিপজ্জনক ছদ্মবেশী ভিপিএন শনাক্ত হয়েছে: $packageName ($reason)")
                handleDetectedVpn(context, packageName, reason)
            }
        } else if (action == Intent.ACTION_BOOT_COMPLETED) {
            Log.i(TAG, "সিস্টেম রিবুট সম্পন্ন: সমস্ত ইনস্টলকৃত প্যাকেজ স্বয়ংক্রিয়ভাবে স্ক্যান করা হচ্ছে...")
            scanAndEnforceAllInstalledPackages(context)
        }
    }
}
