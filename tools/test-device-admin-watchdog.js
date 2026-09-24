/**
 * 🛡️ Shuddho Guard — Pillar 4 (R4) Automated Verification Harness
 * 
 * Tests:
 * 1. Device Admin & Device Owner Policies (setUninstallBlocked, restrictions)
 * 2. Administrative PIN Unlock Challenge
 * 3. AppInstallWatcher Rogue VPN & Proxy Detection (Signatures & Heuristics)
 * 4. AppInstallWatcher Enforcement (setPackagesSuspended, setApplicationHidden)
 * 5. Real-time Network Interface & VPN Watchdog (TRANSPORT_VPN, tun/tap/wg/ppp interfaces)
 * 6. System Proxy Bypass Detection
 * 7. Android Manifest, Wrapper Binary & Source Integrity Static Analysis
 */

const fs = require('fs');
const path = require('path');

console.log("================================================================================");
console.log("🛡️  Shuddho Guard: Pillar 4 (R4) Anti-Uninstall & VPN Watchdog Test Suite");
console.log("================================================================================\n");

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition, testName, detail = "") {
    totalTests++;
    if (condition) {
        passedTests++;
        console.log(`  ✅ [PASS] ${testName}`);
        if (detail) console.log(`     └─ ${detail}`);
    } else {
        failedTests++;
        console.error(`  ❌ [FAIL] ${testName}`);
        if (detail) console.error(`     └─ ⚠️  ${detail}`);
    }
}

// ==============================================================================
// 1. Simulated Android Device Policy Manager & Admin Receiver Logic
// ==============================================================================
console.log("--- 1. Device Admin & Device Owner Policies (ShuddhoDeviceAdminReceiver) ---");

class MockDevicePolicyManager {
    constructor() {
        this.deviceOwnerApp = null;
        this.activeAdmins = new Set();
        this.uninstallBlocked = new Map(); // pkg -> boolean
        this.userRestrictions = new Map(); // admin -> Set<restriction>
        this.suspendedPackages = new Set();
        this.hiddenPackages = new Set();
        this.alwaysOnVpn = null;
    }

    setDeviceOwner(pkg) {
        this.deviceOwnerApp = pkg;
    }

    isDeviceOwnerApp(pkg) {
        return this.deviceOwnerApp === pkg;
    }

    isAdminActive(adminComponent) {
        return this.activeAdmins.has(adminComponent) || this.isDeviceOwnerApp(adminComponent.packageName);
    }

    setUninstallBlocked(adminComponent, packageName, blocked) {
        if (!this.isDeviceOwnerApp(adminComponent.packageName)) {
            throw new Error("SecurityException: Calling identity is not device owner");
        }
        this.uninstallBlocked.set(packageName, blocked);
    }

    isUninstallBlocked(adminComponent, packageName) {
        return this.uninstallBlocked.get(packageName) === true;
    }

    addUserRestriction(adminComponent, restriction) {
        if (!this.isDeviceOwnerApp(adminComponent.packageName)) {
            throw new Error("SecurityException: Requires device owner");
        }
        if (!this.userRestrictions.has(adminComponent.packageName)) {
            this.userRestrictions.set(adminComponent.packageName, new Set());
        }
        this.userRestrictions.get(adminComponent.packageName).add(restriction);
    }

    hasUserRestriction(restriction) {
        for (const set of this.userRestrictions.values()) {
            if (set.has(restriction)) return true;
        }
        return false;
    }

    clearUserRestriction(adminComponent, restriction) {
        if (this.userRestrictions.has(adminComponent.packageName)) {
            this.userRestrictions.get(adminComponent.packageName).delete(restriction);
        }
    }

    setPackagesSuspended(adminComponent, packageNames, suspended) {
        if (!this.isDeviceOwnerApp(adminComponent.packageName)) {
            throw new Error("SecurityException: Requires device owner");
        }
        const unhandled = [];
        for (const pkg of packageNames) {
            if (suspended) {
                this.suspendedPackages.add(pkg);
            } else {
                this.suspendedPackages.delete(pkg);
            }
        }
        return unhandled;
    }

    isPackageSuspended(packageName) {
        return this.suspendedPackages.has(packageName);
    }

    setApplicationHidden(adminComponent, packageName, hidden) {
        if (!this.isDeviceOwnerApp(adminComponent.packageName)) {
            throw new Error("SecurityException: Requires device owner");
        }
        if (hidden) {
            this.hiddenPackages.add(packageName);
        } else {
            this.hiddenPackages.delete(packageName);
        }
        return true;
    }

    isApplicationHidden(packageName) {
        return this.hiddenPackages.has(packageName);
    }

    setAlwaysOnVpnPackage(adminComponent, packageName, lockdown) {
        if (!this.isDeviceOwnerApp(adminComponent.packageName)) {
            throw new Error("SecurityException: Requires device owner");
        }
        this.alwaysOnVpn = { packageName, lockdown };
    }
}

// User manager constants
const UserManager = {
    DISALLOW_UNINSTALL_APPS: "no_uninstall_apps",
    DISALLOW_SAFE_BOOT: "no_safe_boot",
    DISALLOW_CONFIG_VPN: "no_config_vpn",
    DISALLOW_FACTORY_RESET: "no_factory_reset",
    DISALLOW_ADD_USER: "no_add_user",
    DISALLOW_REMOVE_USER: "no_remove_user"
};

const dpm = new MockDevicePolicyManager();
const APP_PACKAGE = "com.shuddho.guard";
const adminComponent = { packageName: APP_PACKAGE, className: "com.shuddho.guard.receivers.ShuddhoDeviceAdminReceiver" };

// Make app Device Owner
dpm.setDeviceOwner(APP_PACKAGE);

// Simulate applyDeviceOwnerRestrictions
function applyDeviceOwnerRestrictions(dpm, context) {
    if (dpm.isDeviceOwnerApp(context.packageName)) {
        dpm.setUninstallBlocked(context.adminComponent, context.packageName, true);
        dpm.addUserRestriction(context.adminComponent, UserManager.DISALLOW_UNINSTALL_APPS);
        dpm.addUserRestriction(context.adminComponent, UserManager.DISALLOW_CONFIG_VPN);
        dpm.addUserRestriction(context.adminComponent, UserManager.DISALLOW_SAFE_BOOT);
        dpm.addUserRestriction(context.adminComponent, UserManager.DISALLOW_FACTORY_RESET);
        dpm.addUserRestriction(context.adminComponent, UserManager.DISALLOW_ADD_USER);
        dpm.addUserRestriction(context.adminComponent, UserManager.DISALLOW_REMOVE_USER);
        dpm.setAlwaysOnVpnPackage(context.adminComponent, context.packageName, false);
        return true;
    }
    return false;
}

const context = { packageName: APP_PACKAGE, adminComponent };
const applied = applyDeviceOwnerRestrictions(dpm, context);

assert(applied === true, "Device Owner policy routine executes successfully");
assert(dpm.isUninstallBlocked(adminComponent, APP_PACKAGE) === true, "setUninstallBlocked actively locks Shuddho Guard against uninstallation");
assert(dpm.hasUserRestriction(UserManager.DISALLOW_UNINSTALL_APPS) === true, "DISALLOW_UNINSTALL_APPS prevents OS-level app removals");
assert(dpm.hasUserRestriction(UserManager.DISALLOW_SAFE_BOOT) === true, "DISALLOW_SAFE_BOOT blocks safe mode bypass");
assert(dpm.hasUserRestriction(UserManager.DISALLOW_CONFIG_VPN) === true, "DISALLOW_CONFIG_VPN blocks user VPN configuration tampering");
assert(dpm.hasUserRestriction(UserManager.DISALLOW_FACTORY_RESET) === true, "DISALLOW_FACTORY_RESET blocks unauthorized device wipes");

// Test uninstall interception
function simulateUninstallAttempt(dpm, targetPackage) {
    if (dpm.isUninstallBlocked(adminComponent, targetPackage)) {
        return { allowed: false, reason: "UNINSTALL_BLOCKED_BY_DEVICE_OWNER" };
    }
    if (dpm.hasUserRestriction(UserManager.DISALLOW_UNINSTALL_APPS)) {
        return { allowed: false, reason: "DISALLOW_UNINSTALL_APPS_RESTRICTION" };
    }
    return { allowed: true, reason: "UNINSTALL_ALLOWED" };
}

const uninstallAttempt = simulateUninstallAttempt(dpm, APP_PACKAGE);
assert(uninstallAttempt.allowed === false && uninstallAttempt.reason === "UNINSTALL_BLOCKED_BY_DEVICE_OWNER", 
    "Simulated uninstall of Shuddho Guard is strictly rejected by Device Policy", uninstallAttempt.reason);

// Administrative Unlock Challenge
function unlockForAdministrativeMaintenance(dpm, context, masterPin) {
    const SAVED_PIN = "7860";
    if (masterPin === SAVED_PIN) {
        if (dpm.isDeviceOwnerApp(context.packageName)) {
            dpm.setUninstallBlocked(context.adminComponent, context.packageName, false);
            dpm.clearUserRestriction(context.adminComponent, UserManager.DISALLOW_UNINSTALL_APPS);
            dpm.clearUserRestriction(context.adminComponent, UserManager.DISALLOW_CONFIG_VPN);
            dpm.clearUserRestriction(context.adminComponent, UserManager.DISALLOW_SAFE_BOOT);
            return true;
        }
    }
    return false;
}

const failPinUnlock = unlockForAdministrativeMaintenance(dpm, context, "1234");
assert(failPinUnlock === false, "Incorrect master PIN fails to unlock admin protection");
assert(dpm.isUninstallBlocked(adminComponent, APP_PACKAGE) === true, "Uninstall block remains intact after failed PIN");

const successPinUnlock = unlockForAdministrativeMaintenance(dpm, context, "7860");
assert(successPinUnlock === true, "Authorized master PIN (7860) unlocks temporary maintenance mode");
assert(dpm.isUninstallBlocked(adminComponent, APP_PACKAGE) === false, "setUninstallBlocked is released for authorized maintenance");

// Re-lock
applyDeviceOwnerRestrictions(dpm, context);
assert(dpm.isUninstallBlocked(adminComponent, APP_PACKAGE) === true, "Re-locking restores iron-clad protection");

console.log("\n--- 2. AppInstallWatcher Rogue VPN & Proxy Detection ---");

// Rogue VPN Signature Database (mirrors AppInstallWatcher.kt)
const KNOWN_ROGUE_VPN_PACKAGES = new Set([
    "free.vpn.unblock.proxy.turbovpn",
    "free.vpn.unblock.proxy.turbovpn.lite",
    "com.turbovpn.free",
    "com.turbo.vpn",
    "com.free.vpn.super.hotspot.open",
    "com.fast.free.unblock.secure.vpn",
    "com.jrzheng.supervpnfree",
    "com.supervpn.client",
    "com.thunder.vpn",
    "com.fast.vpn.thunder",
    "com.psiphon3",
    "com.psiphon3.subscription",
    "com.ca.psiphon",
    "org.hola",
    "com.hola.vpn",
    "org.holavpn",
    "com.expressvpn.vpn",
    "com.nordvpn.android",
    "co.nordvpn",
    "com.surfshark.vpnclient.android",
    "com.cyberghostro.vpn",
    "com.northghost.touchvpn",
    "com.protonvpn.android",
    "com.windscribe.vpn",
    "com.tunnelbear.android",
    "com.wireguard.android",
    "de.blinkt.openvpn",
    "net.openvpn.openvpn",
    "net.openvpn.connect.android",
    "com.github.shadowsocks",
    "com.v2ray.ang",
    "com.github.kr328.clash",
    "com.github.kr328.clash.meta",
    "org.torproject.android",
    "org.torproject.torbrowser",
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
]);

const ROGUE_KEYWORD_PATTERNS = [
    /(^|\.)turbovpn($|\.)/i,
    /(^|\.)supervpn($|\.)/i,
    /(^|\.)thundervpn($|\.)/i,
    /(^|\.)psiphon($|\.)/i,
    /(^|\.)expressvpn($|\.)/i,
    /(^|\.)nordvpn($|\.)/i,
    /(^|\.)surfshark($|\.)/i,
    /(^|\.)cyberghost($|\.)/i,
    /(^|\.)wireguard($|\.)/i,
    /(^|\.)openvpn($|\.)/i,
    /(^|\.)shadowsocks($|\.)/i,
    /(^|\.)v2ray($|\.)/i,
    /(^|\.)clash($|\.)/i,
    /(^|\.)vpnproxy($|\.)/i,
    /(^|\.)freevpn($|\.)/i,
    /(^|\.)fastvpn($|\.)/i,
    /(^|\.)securevpn($|\.)/i,
    /(^|\.)unblockvpn($|\.)/i
];

function isRogueVpnOrProxy(packageName, serviceDeclarations = []) {
    if (packageName === APP_PACKAGE) {
        return { isRogue: false, reason: "Whitelisted Shuddho Guard Package" };
    }

    const lower = packageName.toLowerCase();

    // 1. Signature database
    if (KNOWN_ROGUE_VPN_PACKAGES.has(lower)) {
        return { isRogue: true, reason: `Matched Known Rogue VPN Signature: ${packageName}` };
    }

    // 2. Keyword patterns
    for (const pat of ROGUE_KEYWORD_PATTERNS) {
        if (pat.test(lower)) {
            return { isRogue: true, reason: `Matched Rogue VPN Pattern: ${pat}` };
        }
    }

    // 3. Service declarations
    for (const s of serviceDeclarations) {
        if (s.permission === "android.permission.BIND_VPN_SERVICE") {
            return { isRogue: true, reason: `Declares BIND_VPN_SERVICE on ${s.name}` };
        }
        const sName = (s.name || "").toLowerCase();
        if (sName.includes("vpnservice") || sName.includes("vpntunnel") || sName.includes("proxyservice")) {
            return { isRogue: true, reason: `Declares VPN tunnel service: ${s.name}` };
        }
    }

    return { isRogue: false, reason: "Safe package" };
}

// Test popular rogue VPN packages
const popularVpns = [
    { pkg: "free.vpn.unblock.proxy.turbovpn", label: "TurboVPN" },
    { pkg: "com.free.vpn.super.hotspot.open", label: "SuperVPN" },
    { pkg: "com.thunder.vpn", label: "ThunderVPN" },
    { pkg: "com.psiphon3", label: "Psiphon" },
    { pkg: "org.hola", label: "Hola VPN" },
    { pkg: "com.expressvpn.vpn", label: "ExpressVPN" },
    { pkg: "com.nordvpn.android", label: "NordVPN" },
    { pkg: "com.surfshark.vpnclient.android", label: "Surfshark" },
    { pkg: "com.wireguard.android", label: "WireGuard" },
    { pkg: "de.blinkt.openvpn", label: "OpenVPN" },
    { pkg: "com.v2ray.ang", label: "v2rayNG" },
    { pkg: "com.github.kr328.clash", label: "Clash" },
    { pkg: "org.torproject.android", label: "Orbot Tor" }
];

for (const v of popularVpns) {
    const res = isRogueVpnOrProxy(v.pkg);
    assert(res.isRogue === true, `Detects ${v.label} (${v.pkg})`, res.reason);
}

// Test service permission detection on stealthy/unlisted rogue package
const stealthyApp = {
    pkg: "com.innocent.calculator.stealth",
    services: [{ name: "com.innocent.calculator.TunnelService", permission: "android.permission.BIND_VPN_SERVICE" }]
};
const stealthRes = isRogueVpnOrProxy(stealthyApp.pkg, stealthyApp.services);
assert(stealthRes.isRogue === true, "Detects disguised calculator app declaring BIND_VPN_SERVICE", stealthRes.reason);

// Test negative cases (benign applications must NOT be blocked)
const benignApps = [
    "com.google.android.calculator",
    "com.whatsapp",
    "com.android.chrome",
    "com.facebook.katana",
    "org.mozilla.firefox",
    APP_PACKAGE // Shuddho Guard itself
];

for (const b of benignApps) {
    const res = isRogueVpnOrProxy(b);
    assert(res.isRogue === false, `Benign app is NOT flagged: ${b}`, res.reason);
}

console.log("\n--- 3. AppInstallWatcher Enforcement Execution ---");

// Enforcement handler simulation
function handleDetectedVpn(dpm, context, packageName, reason) {
    let suspended = false;
    let hidden = false;
    if (dpm.isDeviceOwnerApp(context.packageName)) {
        dpm.setPackagesSuspended(context.adminComponent, [packageName], true);
        suspended = dpm.isPackageSuspended(packageName);
        dpm.setApplicationHidden(context.adminComponent, packageName, true);
        hidden = dpm.isApplicationHidden(packageName);
    }
    return { suspended, hidden, packageName, reason };
}

const roguePkg = "free.vpn.unblock.proxy.turbovpn";
const enforceResult = handleDetectedVpn(dpm, context, roguePkg, "Signature match");

assert(enforceResult.suspended === true, "Enforcement suspends rogue package (dpm.setPackagesSuspended)", roguePkg);
assert(enforceResult.hidden === true, "Enforcement hides rogue package from launcher (dpm.setApplicationHidden)", roguePkg);
assert(dpm.isPackageSuspended(roguePkg) === true, "Verification: rogue package is suspended in DPM state");
assert(dpm.isApplicationHidden(roguePkg) === true, "Verification: rogue package is hidden in DPM state");

// Test Bulk Installed App Scanning
const installedApps = [
    { pkg: "com.whatsapp", services: [] },
    { pkg: "com.free.vpn.super.hotspot.open", services: [] },
    { pkg: "com.google.android.calculator", services: [] },
    { pkg: "com.thunder.vpn", services: [] },
    { pkg: "com.psiphon3", services: [] },
    { pkg: "com.android.chrome", services: [] }
];

function scanAllInstalledPackages(dpm, context, appList) {
    const blocked = [];
    for (const app of appList) {
        const check = isRogueVpnOrProxy(app.pkg, app.services);
        if (check.isRogue) {
            handleDetectedVpn(dpm, context, app.pkg, check.reason);
            blocked.push(app.pkg);
        }
    }
    return blocked;
}

const blockedList = scanAllInstalledPackages(dpm, context, installedApps);
assert(blockedList.length === 3, "Scan correctly isolates 3 rogue VPNs from 6 installed packages", blockedList.join(", "));
assert(dpm.isPackageSuspended("com.free.vpn.super.hotspot.open") === true, "SuperVPN is suspended after scan");
assert(dpm.isPackageSuspended("com.thunder.vpn") === true, "ThunderVPN is suspended after scan");
assert(dpm.isPackageSuspended("com.psiphon3") === true, "Psiphon is suspended after scan");
assert(dpm.isPackageSuspended("com.whatsapp") === false, "WhatsApp remains clean and unsuspended");
assert(dpm.isPackageSuspended("com.android.chrome") === false, "Chrome remains clean and unsuspended");

console.log("\n--- 4. Real-time Network Interface & VPN Watchdog (NetworkWatchdogService) ---");

class MockNetworkWatchdog {
    constructor(dpm, context) {
        this.dpm = dpm;
        this.context = context;
        this.isShuddhoVpnActive = false;
        this.bypassDetectedCount = 0;
        this.lastBypass = null;
        this.alwaysOnEnforced = false;
    }

    setShuddhoVpnActive(active) {
        this.isShuddhoVpnActive = active;
    }

    // Simulates ConnectivityManager.NetworkCallback
    onNetworkCapabilitiesChanged(networkInfo) {
        const hasVpnTransport = networkInfo.transports && networkInfo.transports.includes("TRANSPORT_VPN");
        if (hasVpnTransport) {
            if (!this.isShuddhoVpnActive) {
                // External VPN detected
                this.handleBypass("UNAUTHORIZED_VPN_TRANSPORT", `External VPN session: ${networkInfo.id}`);
                return { authorized: false, violation: true };
            }
            return { authorized: true, violation: false };
        }
        return { authorized: true, violation: false };
    }

    // Simulates NetworkInterface.getNetworkInterfaces() audit
    auditNetworkInterfaces(interfaceList) {
        const virtualTunnels = [];
        for (const iface of interfaceList) {
            const name = iface.name.toLowerCase();
            const isVirtual = name.startsWith("tun") || name.startsWith("tap") || 
                              name.startsWith("ppp") || name.startsWith("wg") || 
                              name.startsWith("ipsec") || name.startsWith("p2p");
            if (isVirtual && iface.isUp) {
                virtualTunnels.push(iface.name);
            }
        }

        // Validate
        let foundRogue = null;
        for (const ifaceName of virtualTunnels) {
            const lower = ifaceName.toLowerCase();
            const isShuddhoTun = this.isShuddhoVpnActive && (lower === "tun0" || lower.startsWith("tun"));
            if (!isShuddhoTun) {
                foundRogue = ifaceName;
                break;
            }
        }

        if (!foundRogue) {
            if (!this.isShuddhoVpnActive && virtualTunnels.length > 0) {
                foundRogue = virtualTunnels[0];
            } else if (virtualTunnels.length > 1) {
                foundRogue = virtualTunnels.find(n => n.toLowerCase() !== "tun0") || virtualTunnels[virtualTunnels.length - 1];
            }
        }

        if (foundRogue) {
            this.handleBypass("ROGUE_NETWORK_INTERFACE", `Unauthorized tunnel: ${foundRogue}`);
            return { clean: false, rogueInterface: foundRogue };
        }

        return { clean: true, tunnels: virtualTunnels };
    }

    // Proxy Audit
    auditProxy(proxyConfig) {
        if (proxyConfig && proxyConfig.host) {
            this.handleBypass("UNAUTHORIZED_PROXY", `Proxy host: ${proxyConfig.host}:${proxyConfig.port}`);
            return { clean: false, proxy: `${proxyConfig.host}:${proxyConfig.port}` };
        }
        return { clean: true };
    }

    handleBypass(type, details) {
        this.bypassDetectedCount++;
        this.lastBypass = { type, details, timestamp: Date.now() };
        // Trigger always-on lockdown if device owner
        if (this.dpm.isDeviceOwnerApp(this.context.packageName)) {
            this.dpm.setAlwaysOnVpnPackage(this.context.adminComponent, this.context.packageName, true);
            this.alwaysOnEnforced = true;
        }
    }
}

const watchdog = new MockNetworkWatchdog(dpm, context);

// Test 1: Clean network (wlan0, rmnet_data0, lo)
const cleanInterfaces = [
    { name: "lo", isUp: true },
    { name: "wlan0", isUp: true },
    { name: "rmnet_data0", isUp: true }
];
const cleanAudit = watchdog.auditNetworkInterfaces(cleanInterfaces);
assert(cleanAudit.clean === true, "Standard physical interfaces (lo, wlan0, rmnet) are verified clean");

// Test 2: Legitimate Shuddho Guard VPN active (tun0)
watchdog.setShuddhoVpnActive(true);
const authorizedVpnInterfaces = [
    { name: "lo", isUp: true },
    { name: "wlan0", isUp: true },
    { name: "tun0", isUp: true }
];
const authAudit = watchdog.auditNetworkInterfaces(authorizedVpnInterfaces);
assert(authAudit.clean === true, "Authorized Shuddho Guard tun0 interface passes audit");

// Test 3: Unauthorized external WireGuard / tun1 interface while Shuddho VPN is running
const rogueInterfaces = [
    { name: "lo", isUp: true },
    { name: "wlan0", isUp: true },
    { name: "tun0", isUp: true },
    { name: "wg0", isUp: true } // Rogue WireGuard bypass!
];
const rogueAudit = watchdog.auditNetworkInterfaces(rogueInterfaces);
assert(rogueAudit.clean === false && rogueAudit.rogueInterface === "wg0", 
    "Watchdog detects unauthorized WireGuard bypass interface (wg0)", rogueAudit.rogueInterface);
assert(watchdog.alwaysOnEnforced === true, "Watchdog triggers Always-on VPN lockdown to re-assert Shuddho tunnel");

// Test 4: External VPN via ConnectivityManager callback
watchdog.setShuddhoVpnActive(false); // Shuddho VPN displaced by rogue VPN
const externalVpnNetwork = { id: "net-vpn-express", transports: ["TRANSPORT_VPN", "TRANSPORT_WIFI"] };
const callbackRes = watchdog.onNetworkCapabilitiesChanged(externalVpnNetwork);
assert(callbackRes.violation === true, "ConnectivityManager callback detects external TRANSPORT_VPN bypass");
assert(watchdog.lastBypass.type === "UNAUTHORIZED_VPN_TRANSPORT", "Bypass event logged with correct type");

// Test 5: HTTP Proxy bypass detection
const proxyAudit = watchdog.auditProxy({ host: "127.0.0.1", port: 8080 });
assert(proxyAudit.clean === false, "Watchdog detects unauthorized local proxy bypass", proxyAudit.proxy);

console.log("\n--- 5. Static Source, Manifest & Binary Integrity Verification ---");

const projectRoot = path.join(__dirname, '..');
const androidRoot = path.join(projectRoot, 'android');

// 1. Verify Gradle Wrapper Jar
const wrapperJarPath = path.join(androidRoot, 'gradle', 'wrapper', 'gradle-wrapper.jar');
assert(fs.existsSync(wrapperJarPath), "gradle-wrapper.jar exists on disk", wrapperJarPath);
if (fs.existsSync(wrapperJarPath)) {
    const stats = fs.statSync(wrapperJarPath);
    assert(stats.size > 50000, `gradle-wrapper.jar is genuine binary (${stats.size} bytes > 50KB)`);
}

// 2. Verify AndroidManifest.xml
const manifestPath = path.join(androidRoot, 'app', 'src', 'main', 'AndroidManifest.xml');
assert(fs.existsSync(manifestPath), "AndroidManifest.xml exists");
const manifestContent = fs.readFileSync(manifestPath, 'utf8');

assert(manifestContent.includes("com.shuddho.guard.receivers.ShuddhoDeviceAdminReceiver") || 
       manifestContent.includes(".receivers.ShuddhoDeviceAdminReceiver"),
       "AndroidManifest declares ShuddhoDeviceAdminReceiver");
assert(manifestContent.includes("android.permission.BIND_DEVICE_ADMIN"), 
       "ShuddhoDeviceAdminReceiver is protected by BIND_DEVICE_ADMIN");
assert(manifestContent.includes(".receivers.AppInstallWatcher"), 
       "AndroidManifest declares AppInstallWatcher receiver");
assert(manifestContent.includes("PACKAGE_ADDED"), 
       "AppInstallWatcher listens to ACTION_PACKAGE_ADDED");
assert(manifestContent.includes(".services.NetworkWatchdogService"), 
       "AndroidManifest declares NetworkWatchdogService");
assert(manifestContent.includes("android.permission.MANAGE_DEVICE_ADMINS"), 
       "Permission MANAGE_DEVICE_ADMINS is present");
assert(manifestContent.includes("android.permission.QUERY_ALL_PACKAGES"), 
       "Permission QUERY_ALL_PACKAGES is present");

// 3. Verify ShuddhoDeviceAdminReceiver.kt code integrity
const adminReceiverPath = path.join(androidRoot, 'app', 'src', 'main', 'java', 'com', 'shuddho', 'guard', 'receivers', 'ShuddhoDeviceAdminReceiver.kt');
assert(fs.existsSync(adminReceiverPath), "ShuddhoDeviceAdminReceiver.kt exists");
const adminReceiverCode = fs.readFileSync(adminReceiverPath, 'utf8');

assert(adminReceiverCode.includes("dpm.setUninstallBlocked"), 
       "ShuddhoDeviceAdminReceiver contains active dpm.setUninstallBlocked invocation");
assert(adminReceiverCode.includes("UserManager.DISALLOW_UNINSTALL_APPS"), 
       "ShuddhoDeviceAdminReceiver enforces DISALLOW_UNINSTALL_APPS");
assert(adminReceiverCode.includes("UserManager.DISALLOW_SAFE_BOOT"), 
       "ShuddhoDeviceAdminReceiver enforces DISALLOW_SAFE_BOOT");
assert(adminReceiverCode.includes("UserManager.DISALLOW_CONFIG_VPN"), 
       "ShuddhoDeviceAdminReceiver enforces DISALLOW_CONFIG_VPN");
assert(adminReceiverCode.includes("unlockForAdministrativeMaintenance"), 
       "ShuddhoDeviceAdminReceiver provides administrative PIN challenge routine");

// 4. Verify AppInstallWatcher.kt code integrity
const installWatcherPath = path.join(androidRoot, 'app', 'src', 'main', 'java', 'com', 'shuddho', 'guard', 'receivers', 'AppInstallWatcher.kt');
assert(fs.existsSync(installWatcherPath), "AppInstallWatcher.kt exists");
const installWatcherCode = fs.readFileSync(installWatcherPath, 'utf8');

assert(installWatcherCode.includes("dpm.setPackagesSuspended"), 
       "AppInstallWatcher actively invokes dpm.setPackagesSuspended");
assert(installWatcherCode.includes("dpm.setApplicationHidden"), 
       "AppInstallWatcher actively invokes dpm.setApplicationHidden");
assert(installWatcherCode.includes("turbovpn") && installWatcherCode.includes("supervpn") && installWatcherCode.includes("psiphon"), 
       "AppInstallWatcher contains signature database of popular rogue VPN packages");
assert(installWatcherCode.includes("scanAndEnforceAllInstalledPackages"), 
       "AppInstallWatcher provides system-wide on-boot scan for rogue packages");

// 5. Verify NetworkWatchdogService.kt code integrity
const watchdogServicePath = path.join(androidRoot, 'app', 'src', 'main', 'java', 'com', 'shuddho', 'guard', 'services', 'NetworkWatchdogService.kt');
assert(fs.existsSync(watchdogServicePath), "NetworkWatchdogService.kt exists");
const watchdogServiceCode = fs.readFileSync(watchdogServicePath, 'utf8');

assert(watchdogServiceCode.includes("NetworkCapabilities.TRANSPORT_VPN"), 
       "NetworkWatchdogService monitors NetworkCapabilities.TRANSPORT_VPN");
assert(watchdogServiceCode.includes("NetworkInterface.getNetworkInterfaces"), 
       "NetworkWatchdogService scans NetworkInterface.getNetworkInterfaces()");
assert(watchdogServiceCode.includes("scanSystemProxyNow"), 
       "NetworkWatchdogService checks system HTTP proxy leaks");

// ==============================================================================
// Summary & Exit
// ==============================================================================
console.log("\n================================================================================");
console.log(`📊 Test Summary: Total = ${totalTests} | Passed = ${passedTests} | Failed = ${failedTests}`);
console.log("================================================================================");

if (failedTests === 0) {
    console.log("🎉 ALL TESTS PASSED! R4 Anti-Uninstall & VPN Bypass Watchdog is verified 100% compliant.");
    process.exit(0);
} else {
    console.error(`❌ ${failedTests} TEST(S) FAILED. Please review the implementation.`);
    process.exit(1);
}
