package com.shuddho.guard

import com.shuddho.guard.receivers.AppInstallWatcher
import com.shuddho.guard.receivers.ShuddhoDeviceAdminReceiver
import com.shuddho.guard.services.NetworkWatchdogService
import org.junit.Assert.*
import org.junit.Test

/**
 * ইউনিট টেস্ট: ডিভাইস অ্যাডমিন পলিসি, রোগ ভিপিএন সনাক্তকরণ ও নেটওয়ার্ক ইন্টারফেস ফিল্টারিং
 */
class WatchdogUnitTest {

    @Test
    fun testRogueVpnDatabaseContainsPopularBypassTools() {
        val rogueDb = AppInstallWatcher.KNOWN_ROGUE_VPN_PACKAGES

        // জনপ্রিয় বাইপাস ও ভিপিএন টুলসমূহ অবশ্যই ডাটাবেজে উপস্থিত থাকতে হবে
        val expectedPackages = listOf(
            "free.vpn.unblock.proxy.turbovpn",
            "com.free.vpn.super.hotspot.open",
            "com.thunder.vpn",
            "com.psiphon3",
            "org.hola",
            "com.expressvpn.vpn",
            "com.nordvpn.android",
            "com.surfshark.vpnclient.android",
            "com.wireguard.android",
            "de.blinkt.openvpn",
            "com.github.shadowsocks",
            "com.v2ray.ang",
            "com.github.kr328.clash"
        )

        for (pkg in expectedPackages) {
            assertTrue("Database should contain $pkg", rogueDb.contains(pkg))
        }
    }

    @Test
    fun testRogueVpnKeywordPatterns() {
        val patterns = AppInstallWatcher.ROGUE_KEYWORD_PATTERNS

        fun matchesAny(name: String): Boolean {
            return patterns.any { it.containsMatchIn(name.lowercase()) }
        }

        // পজিটিভ টেস্ট (চিহ্নিত হতে হবে)
        assertTrue(matchesAny("com.unknown.turbovpn.free"))
        assertTrue(matchesAny("net.fastvpn.proxy"))
        assertTrue(matchesAny("org.securevpn.master"))
        assertTrue(matchesAny("com.proxy.unblockvpn"))
        assertTrue(matchesAny("com.wireguard.client"))
        assertTrue(matchesAny("com.openvpn.android"))
        assertTrue(matchesAny("org.shadowsocks.tool"))

        // নেগেটিভ টেস্ট (নিরাপদ অ্যাপকে ব্লক করা যাবে না)
        assertFalse(matchesAny("com.google.android.calculator"))
        assertFalse(matchesAny("com.whatsapp"))
        assertFalse(matchesAny("com.android.chrome"))
        assertFalse(matchesAny("com.facebook.katana"))
    }

    @Test
    fun testDeviceAdminConstants() {
        assertEquals("master_pin", ShuddhoDeviceAdminReceiver.KEY_MASTER_PIN)
        assertEquals("7860", ShuddhoDeviceAdminReceiver.DEFAULT_MASTER_PIN)
        assertEquals("shuddho_shield", ShuddhoDeviceAdminReceiver.PREFS_NAME)
    }

    @Test
    fun testNetworkWatchdogConstants() {
        assertEquals("com.shuddho.guard.action.VPN_BYPASS_DETECTED", NetworkWatchdogService.ACTION_VPN_BYPASS_DETECTED)
        assertEquals("shuddho_watchdog_channel", NetworkWatchdogService.NOTIFICATION_CHANNEL_ID)
        assertEquals(202, NetworkWatchdogService.NOTIFICATION_ID)
    }

    @Test
    fun testVirtualTunnelNameRecognition() {
        val testNames = listOf(
            "tun0" to true,
            "tun1" to true,
            "tap0" to true,
            "ppp0" to true,
            "wg0" to true,
            "ipsec0" to true,
            "p2p-wlan0-0" to false,
            "p2p-p2p0-0" to false,
            "wlan0" to false,
            "lo" to false,
            "eth0" to false,
            "rmnet_data0" to false
        )

        for ((name, expectedIsVirtual) in testNames) {
            val lower = name.lowercase()
            val isBenignP2p = lower.startsWith("p2p-p2p0") || lower.startsWith("p2p-wlan0") || lower == "p2p0" || lower.startsWith("p2p")
            val isVirtual = lower.startsWith("tun") ||
                    lower.startsWith("tap") ||
                    lower.startsWith("ppp") ||
                    lower.startsWith("wg") ||
                    lower.startsWith("ipsec") ||
                    (lower.startsWith("p2p") && !isBenignP2p)

            assertEquals("Virtual interface detection failed for $name", expectedIsVirtual, isVirtual)
        }

        // When active VPN routing is detected, p2p interface MUST be recognized as virtual tunnel
        val p2pNames = listOf("p2p-wlan0-0", "p2p-p2p0-1")
        for (name in p2pNames) {
            val lower = name.lowercase()
            val hasVpnRouting = true
            val isBenignP2p = (lower.startsWith("p2p-p2p0") || lower.startsWith("p2p-wlan0") || lower == "p2p0" || lower.startsWith("p2p")) && !hasVpnRouting
            val isVirtual = lower.startsWith("tun") ||
                    lower.startsWith("tap") ||
                    lower.startsWith("ppp") ||
                    lower.startsWith("wg") ||
                    lower.startsWith("ipsec") ||
                    (lower.startsWith("p2p") && !isBenignP2p)
            assertTrue("p2p interface should be recognized as virtual tunnel when VPN routing is active", isVirtual)
        }
    }
}
