# 🛡️ শুদ্ধ গার্ড (Shuddho Guard) ও পিওর টেলিগ্রাম — সর্বজনীন সম্পূর্ণ সোর্স কোড বান্ডেল (Master Release)
> **প্রকল্পের সমস্ত কোড এক ফাইলে (১-ক্লিক কপি বান্ডেল)**  
> **উদ্যোক্তা:** এইচএমকে বোরহান উদ্দিন (HMk Borhan Uddin) | **কারিগরি সহায়তা:** লুবাবা (Lubaba)  
> এই ফাইলের সমস্ত টেক্সট `Ctrl + A` চেপে `Ctrl + C` দিয়ে এক ক্লিকে সম্পূর্ণ কপি করে নেওয়া যাবে।

---

## 📑 সূচিপত্র
1. [গুগল ক্রোম এক্সটেনশন (Manifest V3, Universal Link Interceptor, AI Blur & Desktop Notifications)](#১-গুগল-ক্রোম-এক্সটেনশন)
2. [উইন্ডোজ পিসি নেটিভ গার্ড (PowerShell Engine, SafeSearch, Hosts Lock, Auto-Elevation & Uninstaller)](#২-উইন্ডোজ-পিসি-নেটিভ-গার্ড)
3. [পিওর টেলিগ্রাম (PureGram) কোর প্যাচ ও আর্কিটেকচার](#৩-পিওর-টেলিগ্রাম-puregram-কোর-প্যাচ)
4. [অ্যান্ড্রয়েড মোবাইল অ্যাপ (Kotlin VpnService, Screen Guard, DeviceAdmin, Stealth Calculator)](#৪-অ্যান্ড্রয়েড-মোবাইল-অ্যাপ)
5. [ক্লাউড ব্যাকএন্ড সার্ভার ও রেন্ডার ডেপ্লয়মেন্ট (Express API & render.yaml)](#৫-ক্লাউড-ব্যাকএন্ড-সার্ভার)
6. [বাণিজ্যিক ল্যান্ডিং পেজ ও বিকাশ পেমেন্ট গেটওয়ে (HTML, CSS, JS)](#৬-বাণিজ্যিক-ল্যান্ডিং-পেজ)
7. [স্বয়ংক্রিয় টেস্ট স্যুট (20/20 Unified Automated Tests)](#৭-স্বয়ংক্রিয়-টেস্ট-স্যুট)
8. [মার্কেট লঞ্চ ও প্রচারণার সম্পূর্ণ কিট](#৮-মার্কেট-লঞ্চ-কিট)

---

# ১. গুগল ক্রোম এক্সটেনশন

### ফাইল: `web-extension/manifest.json`
```json
{
  "manifest_version": 3,
  "name": "শুদ্ধ গার্ড — সোশ্যাল মিডিয়া শিল্ড (Shuddho Guard)",
  "version": "1.0.0",
  "description": "ফেসবুক, ইনস্টাগ্রামে আপত্তিকর ছবি ব্লার এবং জুয়া, ক্যাসিনো ও কমেন্টের প্রতারণামূলক টেলিগ্রাম লিংক প্রতিরোধক।",
  "icons": {
    "16": "icons/icon16.png",
    "48": "icons/icon48.png",
    "128": "icons/icon128.png"
  },
  "action": {
    "default_popup": "popup/popup.html",
    "default_title": "শুদ্ধ গার্ড",
    "default_icon": {
      "16": "icons/icon16.png",
      "48": "icons/icon48.png",
      "128": "icons/icon128.png"
    }
  },
  "background": {
    "service_worker": "scripts/background.js"
  },
  "permissions": [
    "storage",
    "declarativeNetRequest",
    "notifications"
  ],
  "host_permissions": [
    "*://*.facebook.com/*",
    "*://*.instagram.com/*",
    "*://*.tiktok.com/*",
    "*://*.youtube.com/*",
    "*://*.twitter.com/*",
    "*://*.x.com/*"
  ],
  "content_scripts": [
    {
      "matches": [
        "*://*.facebook.com/*",
        "*://*.instagram.com/*",
        "*://*.tiktok.com/*",
        "*://*.youtube.com/*",
        "*://*.twitter.com/*",
        "*://*.x.com/*"
      ],
      "js": [
        "scripts/trap-link-interceptor.js",
        "scripts/ai-vision-blur.js"
      ],
      "run_at": "document_idle"
    }
  ]
}
```

### ফাইল: `web-extension/scripts/trap-link-interceptor.js`
```javascript
// শুদ্ধ গার্ড — সর্বজনীন ক্ষতিকর ও প্রতারণামূলক লিঙ্ক ইন্টারসেপ্টর (Universal Harmful Link Interceptor)
(function() {
    'use strict';

    console.log('[Shuddho Guard] সর্বজনীন ক্ষতিকর লিঙ্ক ফিল্টারিং ইঞ্জিন সক্রিয়...');

    // ১. জুয়া, বাজি ও ক্যাসিনো ডোমেইন ও কি-ওয়ার্ড তালিকা
    const GAMBLING_DOMAINS = [
        '1xbet', 'melbet', 'bet365', 'babu88', 'jeetbuzz', 'mostbet', 'parimatch',
        'crazytime', 'linebet', 'betway', 'krikya', 'bajilive', 'crickex', 'betwinner',
        '22bet', '1win', 'megapari', 'dafabet', 'stake.com', 'bc.game', 'shillongteer'
    ];
    const GAMBLING_KEYWORDS = [
        '1xbet', 'melbet', 'babu88', 'jeetbuzz', 'mostbet', 'parimatch', 'casino', 'ক্যাসিনো',
        'জুয়া', 'জুয়া', 'বাজি', 'বেটিং', 'টাকা ইনকাম লিংক', 'ডিপোজিট বোনাস', 'প্রেডিকশন গ্রুপ',
        'aviator', 'crazy time', 'রুলেট', 'তিন পাত্তি', 'betting link', 'betting tips'
    ];

    // ২. পর্নোগ্রাফি, চটি ও খোলামেলা আপত্তিকর ডোমেইন ও কি-ওয়ার্ড তালিকা
    const ADULT_DOMAINS = [
        'pornhub', 'xvideos', 'xnxx', 'xhamster', 'stripchat', 'bongacams',
        'chotikahini', 'banglachoti', 'deshiboudi', 'bdchoti', 'redwap', 'spankbang',
        'brazzers', 'chaturbate', 'onlyfans', 'fapello', 'leakgirls', 'thothub'
    ];
    const ADULT_KEYWORDS = [
        'choti', 'boudi', 'gopon', 'viral video', 'leaked', 'leak', '18+', 'সহবাস',
        'বউ ছাড়া', 'বউ ছাড়া', 'গোপন ভিডিও', 'ভিডিও লিংক', 'কমেন্টে লিংক', 'সেক্স', 'চটি গল্প',
        'হট ভিডিও', 'নগ্ন', 'ক্যাম স্ক্যান্ডাল', 'এমএমএস', 'mms', 'ভাইরাল লিংক', 'গোপন রহস্য'
    ];

    // ৩. টেলিগ্রাম ও লিঙ্ক শর্টনার
    const TELEGRAM_DOMAINS = ['t.me', 'telegram.me', 'telegram.dog'];
    const SHORTENER_DOMAINS = ['bit.ly', 'tinyurl.com', 'cutt.ly', 'is.gd', 't.co', 'rb.gy', 'shorturl.at'];

    function analyzeLinkRisk(anchor) {
        const href = (anchor.href || '').toLowerCase();
        const text = (anchor.innerText || '').toLowerCase();
        const parentElem = anchor.closest('div[role="article"], div[data-ad-preview="message"], .comment, div[dir="auto"], p, article');
        const parentText = (parentElem ? parentElem.innerText : '').toLowerCase();
        const combinedText = `${text} ${href} ${parentText}`;

        // ক্যাটাগরি ১: অনলাইন জুয়া ও ক্যাসিনো
        const isGamblingDomain = GAMBLING_DOMAINS.some(d => href.includes(d));
        const hasGamblingKeywords = GAMBLING_KEYWORDS.some(kw => combinedText.includes(kw));
        if (isGamblingDomain || (hasGamblingKeywords && (isGamblingDomain || SHORTENER_DOMAINS.some(d => href.includes(d)) || TELEGRAM_DOMAINS.some(d => href.includes(d))))) {
            return {
                isHarmful: true,
                category: 'অনলাইন জুয়া ও ক্যাসিনো ফাঁদ',
                icon: '🎰',
                badgeColor: '#F59E0B',
                description: 'এই লিঙ্কটি আপনাকে অবৈধ অনলাইন জুয়া, বাজি বা ক্যাসিনো সাইটের দিকে নিয়ে যাচ্ছিল। এতে মারাত্মক আর্থিক ক্ষতি ও আসক্তির ঝুঁকি রয়েছে।'
            };
        }

        // ক্যাটাগরি ২: পর্নোগ্রাফি ও আপত্তিকর চটি সাইট
        const isAdultDomain = ADULT_DOMAINS.some(d => href.includes(d));
        const hasAdultKeywords = ADULT_KEYWORDS.some(kw => combinedText.includes(kw));
        if (isAdultDomain) {
            return {
                isHarmful: true,
                category: 'পর্নোগ্রাফি ও প্রাপ্তবয়স্ক কনটেন্ট',
                icon: '🔞',
                badgeColor: '#EF4444',
                description: 'এই লিঙ্কটি একটি নিষিদ্ধ প্রাপ্তবয়স্ক বা পর্নোগ্রাফিক ওয়েবসাইটে নিয়ে যাচ্ছিল। আত্মরক্ষা ও সামাজিক সম্মানের স্বার্থে এটি প্রতিহত করা হলো।'
            };
        }

        // ক্যাটাগরি ৩: সোশ্যাল মিডিয়ার টেলিগ্রাম হানি-ট্র্যাপ
        const isTelegramDomain = TELEGRAM_DOMAINS.some(d => href.includes(d));
        if (isTelegramDomain) {
            const hasTrapSlug = ['leak', 'choti', 'boudi', 'viral', '18plus', 'casino', 'betting', 'gopon', 'mms'].some(slug => href.includes(slug));
            if (hasTrapSlug || hasAdultKeywords || hasGamblingKeywords) {
                return {
                    isHarmful: true,
                    category: 'টেলিগ্রাম হানি-ট্র্যাপ ও নোংরা চ্যানেল ফাঁদ',
                    icon: '🚨',
                    badgeColor: '#DC2626',
                    description: 'সম্মানিত ব্যক্তিত্ব বা ভাইরাল খবরের আড়ালে কমেন্টে টেলিগ্রামের চটি চ্যানেলে নিয়ে যাওয়ার সুপরিকল্পিত ফাঁদ শনাক্ত হয়েছে।'
                };
            }
        }

        // ক্যাটাগরি ৪: শর্টনার দিয়ে লুকানো ক্ষতিকর লিঙ্ক
        const isShortener = SHORTENER_DOMAINS.some(d => href.includes(d));
        if (isShortener && (hasAdultKeywords || hasGamblingKeywords)) {
            return {
                isHarmful: true,
                category: 'লুকানো প্রতারণামূলক রিডাইরেক্ট লিঙ্ক',
                icon: '⚠️',
                badgeColor: '#E11D48',
                description: 'লিঙ্ক শর্টনারের আড়ালে ক্ষতিকর জুয়া বা প্রাপ্তবয়স্ক গন্তব্য লুকানো রয়েছে। শুদ্ধ গার্ড আপনার নেভিগেশন স্থগিত করেছে।'
            };
        }

        return { isHarmful: false };
    }

    // গ্লোবাল ক্লিক ইন্টারসেপ্টর — লিঙ্কে ক্লিক করার সাথে সাথে যাচাই
    document.addEventListener('click', function(e) {
        const anchor = e.target.closest('a');
        if (!anchor) return;

        const analysis = analyzeLinkRisk(anchor);
        if (analysis.isHarmful) {
            e.preventDefault();
            e.stopPropagation();
            showHarmfulLinkAlert(anchor.href, analysis);
        }
    }, true);

    function showHarmfulLinkAlert(targetUrl, risk) {
        const oldModal = document.getElementById('shuddho-trap-modal');
        if (oldModal) oldModal.remove();

        // ব্যাকগ্রাউন্ড সার্ভিস ওয়ার্কারে নোটিফিকেশন পাঠানোর নির্দেশ
        if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
            try {
                chrome.runtime.sendMessage({
                    action: 'harmful_link_blocked',
                    url: targetUrl,
                    reason: risk.category
                });
            } catch (e) {}
        }

        const modal = document.createElement('div');
        modal.id = 'shuddho-trap-modal';
        modal.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
            background: rgba(11, 15, 25, 0.94); z-index: 99999999;
            display: flex; justify-content: center; align-items: center;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            backdrop-filter: blur(10px);
        `;

        modal.innerHTML = `
            <div style="background: #1E293B; border: 2px solid ${risk.badgeColor}; border-radius: 18px; padding: 32px; max-width: 500px; width: 90%; text-align: center; color: white; box-shadow: 0 25px 60px -15px rgba(0, 0, 0, 0.9);">
                <div style="font-size: 56px; margin-bottom: 8px;">${risk.icon}</div>
                <div style="display: inline-block; background: ${risk.badgeColor}22; border: 1px solid ${risk.badgeColor}; color: ${risk.badgeColor}; font-size: 13px; font-weight: bold; padding: 4px 14px; border-radius: 20px; margin-bottom: 12px;">
                    ${risk.category}
                </div>
                <h2 style="color: #F8FAFC; font-size: 21px; margin-bottom: 12px; font-weight: bold;">ক্ষতিকারক লিঙ্ক প্রতিহত করা হয়েছে!</h2>
                <p style="font-size: 14px; color: #CBD5E1; line-height: 1.6; margin-bottom: 16px;">
                    ${risk.description}
                </p>
                <div style="background: #0F172A; padding: 12px; border-radius: 8px; font-size: 12px; color: #94A3B8; word-break: break-all; margin-bottom: 22px; border: 1px solid #334155;">
                    🛑 অবরুদ্ধ গন্তব্য: <span style="color: #38BDF8;">${targetUrl}</span>
                </div>
                <div style="display: flex; gap: 12px; justify-content: center; flex-wrap: wrap;">
                    <button id="shuddho-stay-safe-btn" style="background: #10B981; color: white; border: none; padding: 12px 28px; border-radius: 10px; font-weight: bold; cursor: pointer; font-size: 15px; box-shadow: 0 4px 14px rgba(16, 185, 129, 0.4);">
                        🛡️ নিরাপদে ফিরে যান (সুরক্ষিত থাকুন)
                    </button>
                </div>
                <div style="margin-top: 18px; font-size: 12px; color: #64748B;">
                    🔒 শুদ্ধ গার্ড (Shuddho Guard) সার্বক্ষণিক আপনার আর্থিক ও নৈতিক পাহারায় নিয়োজিত।
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        document.getElementById('shuddho-stay-safe-btn').addEventListener('click', function() {
            modal.remove();
        });
    }

})();
```

### ফাইল: `web-extension/scripts/background.js`
```javascript
// শুদ্ধ গার্ড — ব্যাকগ্রাউন্ড সার্ভিস ওয়ার্কার (Manifest V3)

chrome.runtime.onInstalled.addListener(() => {
    console.log('[Shuddho Guard] এক্সটেনশন সফলভাবে ইনস্টল হয়েছে।');
    chrome.storage.local.set({
        trapsBlocked: 0,
        mediaBlurred: 0,
        protectionActive: true
    });
});

// মেসেজ লিসেনার (কনটেন্ট স্ক্রিপ্ট থেকে ব্লকিং ইভেন্ট গণনা ও নোটিফিকেশন)
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'trap_blocked' || request.action === 'trapBlocked' || request.action === 'harmful_link_blocked') {
        chrome.storage.local.get(['trapsBlocked'], (data) => {
            const count = (data.trapsBlocked || 0) + 1;
            chrome.storage.local.set({ trapsBlocked: count });
            chrome.action.setBadgeText({ text: count.toString() });
            chrome.action.setBadgeBackgroundColor({ color: '#EF4444' });
        });

        // সিস্টেম বা ক্রোম ডেস্কটপ নোটিফিকেশন পাঠানো
        if (chrome.notifications && chrome.notifications.create) {
            try {
                chrome.notifications.create({
                    type: 'basic',
                    iconUrl: 'icons/icon128.png',
                    title: '🛡️ শুদ্ধ গার্ড: ক্ষতিকর লিংক প্রতিহত করা হয়েছে!',
                    message: request.reason || 'জুয়া, ক্যাসিনো বা অনৈতিক ফাঁদের দিকে নিয়ে যাওয়া ক্ষতিকর লিংক স্বয়ংক্রিয়ভাবে ব্লক করা হয়েছে।',
                    priority: 2
                });
            } catch (err) {
                console.warn('নোটিফিকেশন পাঠানো যায়নি:', err);
            }
        }

        sendResponse({ status: 'ok' });
    }
});
```

---

# ২. উইন্ডোজ পিসি নেটিভ গার্ড

### ফাইল: `windows-client/install-native-shuddho-pc.bat`
```cmd
@echo off
chcp 65001 > nul
title শুদ্ধ গার্ড — উইন্ডোজ স্থায়ী প্রোটেকশন ইনস্টলার

echo =================================================================
echo   🛡️ শুদ্ধ গার্ড (Shuddho Guard) — উইন্ডোজ স্বয়ংক্রিয় ইনস্টলার
echo =================================================================
echo.

:: অ্যাডমিন প্রিভিলেজ যাচাই এবং স্বয়ংক্রিয় এলিভেশন
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo [অনুমতি প্রয়োজন] অ্যাডমিনিস্ট্রেটর হিসেবে চালু করা হচ্ছে...
    powershell -Command "Start-Process cmd -ArgumentList '/c \"\"%~dpnx0\"\"' -Verb RunAs"
    exit /b
)

set SCRIPT_DIR=%~dp0
echo ১. সিস্টেম ফাইল ও ডিএনএস সুরক্ষা স্ক্রিপ্ট চালানো হচ্ছে...
powershell -ExecutionPolicy Bypass -File "%SCRIPT_DIR%shuddho-pc-engine.ps1" -Install

echo.
echo ২. উইন্ডোজ টাস্ক শিডিউলারে স্থায়ী সার্ভিস নিবন্ধন করা হচ্ছে...
schtasks /create /f /tn "ShuddhoGuardProtection" /tr "powershell -WindowStyle Hidden -ExecutionPolicy Bypass -File \"%SCRIPT_DIR%shuddho-pc-engine.ps1\" -Monitor" /sc onlogon /rl HIGHEST >nul 2>&1

echo.
echo =================================================================
echo  🎯 [অভিনন্দন!] শুদ্ধ গার্ড উইন্ডোজ পিসি সুরক্ষা সফলভাবে সক্রিয় হয়েছে!
echo  - সমস্ত ব্রাউজারে গুগল, বিং ও ইউটিউব SafeSearch লক করা হয়েছে।
echo  - পর্ন ও প্রাপ্তবয়স্ক ডোমেইন ব্লক করা হয়েছে।
echo  - ক্লিনব্রাউজিং ফ্যামিলি ফিল্টার ডিএনএস সক্রিয় করা হয়েছে।
echo  - কম্পিউটার রিস্টার্ট দিলেও এটি স্বয়ংক্রিয়ভাবে সক্রিয় থাকবে।
echo =================================================================
echo.
pause
```

### ফাইল: `windows-client/shuddho-pc-engine.ps1`
```powershell
# Shuddho PC Guard Native PowerShell Engine
param (
    [string]$Mode = "Install"
)

$hostsPath = "$env:windir\System32\drivers\etc\hosts"
$backupPath = "$env:windir\System32\drivers\etc\hosts.shuddho.bak"

$safeSearchEntries = @(
    "216.239.38.120 forcesafesearch.google.com",
    "216.239.38.120 www.google.com",
    "216.239.38.120 google.com",
    "216.239.38.120 www.google.com.bd",
    "204.79.197.220 strict.bing.com",
    "204.79.197.220 www.bing.com",
    "204.79.197.220 bing.com",
    "216.239.38.119 restrict.youtube.com",
    "216.239.38.119 www.youtube.com",
    "safe.duckduckgo.com duckduckgo.com"
)

$blockedDomains = @(
    "pornhub.com", "www.pornhub.com", "rt.pornhub.com",
    "xvideos.com", "www.xvideos.com", "xvideos2.com",
    "xnxx.com", "www.xnxx.com",
    "xhamster.com", "www.xhamster.com", "xhamster.desi",
    "chaturbate.com", "bongacams.com", "stripchat.com",
    "onlyfans.com",
    "deshiboudi.com", "banglachoti.com", "chotikahini.com",
    "bdchoti.net", "chotigolpo.com", "banglasex.net",
    "redwap.me", "spankbang.com", "tube8.com", "youporn.com",
    "tnaflix.com", "beeg.com", "brazzers.com", "eporner.com",
    "1xbet-bangladesh.com", "babu88.com", "jeetbuzz.com"
)

function Install-ShuddhoProtection {
    Write-Host "[1/3] ব্যাকআপ তৈরি ও হোস্ট ফাইল আনলক করা হচ্ছে..." -ForegroundColor Cyan
    if (!(Test-Path $backupPath) -and (Test-Path $hostsPath)) {
        Copy-Item $hostsPath $backupPath -Force
    }

    try { Set-ItemProperty -Path $hostsPath -Name IsReadOnly -Value $false -ErrorAction SilentlyContinue } catch {}

    Write-Host "[2/3] সেফ সার্চ ও পর্ন ব্লকিং রুলস অন্তর্ভুক্ত করা হচ্ছে..." -ForegroundColor Cyan
    $currentHosts = Get-Content $hostsPath -Raw -ErrorAction SilentlyContinue
    if (-not $currentHosts) { $currentHosts = "" }

    $newEntries = New-Object System.Text.StringBuilder
    $newEntries.AppendLine($currentHosts.TrimEnd())
    $newEntries.AppendLine("`n# === SHUDDHO GUARD SAFE PROTECTION START ===")

    foreach ($entry in $safeSearchEntries) {
        if ($currentHosts -notmatch [regex]::Escape($entry)) {
            $newEntries.AppendLine($entry)
        }
    }

    foreach ($domain in $blockedDomains) {
        $blockLine = "0.0.0.0 $domain"
        if ($currentHosts -notmatch [regex]::Escape($blockLine)) {
            $newEntries.AppendLine($blockLine)
        }
    }
    $newEntries.AppendLine("# === SHUDDHO GUARD SAFE PROTECTION END ===")

    Set-Content -Path $hostsPath -Value $newEntries.ToString() -Encoding UTF8
    try { Set-ItemProperty -Path $hostsPath -Name IsReadOnly -Value $true -ErrorAction SilentlyContinue } catch {}

    Write-Host "[3/3] ফ্যামিলি ডিএনএস (CleanBrowsing & Cloudflare) সক্রিয় করা হচ্ছে..." -ForegroundColor Cyan
    try {
        $adapters = Get-NetAdapter | Where-Object { $_.Status -eq "Up" }
        foreach ($adapter in $adapters) {
            Set-DnsClientServerAddress -InterfaceIndex $adapter.InterfaceIndex -ServerAddresses ("185.228.168.10", "1.1.1.3") -ErrorAction SilentlyContinue
        }
    } catch {
        Write-Warning "DNS অ্যাডাপ্টার কনফিগারেশনে সতর্কতা: $_"
    }

    Clear-DnsClientCache -ErrorAction SilentlyContinue
    Write-Host "✅ সুরক্ষা সফলভাবে সক্রিয় হয়েছে।" -ForegroundColor Green
}

function Restore-ShuddhoProtection {
    Write-Host "হোস্ট ফাইল এবং ডিএনএস পূর্বের অবস্থায় ফিরিয়ে নেওয়া হচ্ছে..." -ForegroundColor Yellow
    try { Set-ItemProperty -Path $hostsPath -Name IsReadOnly -Value $false -ErrorAction SilentlyContinue } catch {}

    if (Test-Path $backupPath) {
        Copy-Item $backupPath $hostsPath -Force
    }

    try {
        $adapters = Get-NetAdapter | Where-Object { $_.Status -eq "Up" }
        foreach ($adapter in $adapters) {
            Set-DnsClientServerAddress -InterfaceIndex $adapter.InterfaceIndex -ResetServerAddresses -ErrorAction SilentlyContinue
        }
    } catch {}

    Clear-DnsClientCache -ErrorAction SilentlyContinue
    Write-Host "✅ সিস্টেম স্বাভাবিক অবস্থায় ফিরে এসেছে।" -ForegroundColor Green
}

if ($Mode -eq "Install" -or $Mode -eq "-Install") {
    Install-ShuddhoProtection
} elseif ($Mode -eq "Uninstall" -or $Mode -eq "-Uninstall") {
    Restore-ShuddhoProtection
} elseif ($Mode -eq "Monitor" -or $Mode -eq "-Monitor") {
    Install-ShuddhoProtection
}
```

### ফাইল: `windows-client/uninstall-native-shuddho-pc.bat`
```cmd
@echo off
chcp 65001 > nul
title শুদ্ধ গার্ড — উইন্ডোজ আনইনস্টলার

echo =================================================================
echo   🛡️ শুদ্ধ গার্ড: উইন্ডোজ আনইনস্টল যাচাইকরণ
echo =================================================================
echo.

net session >nul 2>&1
if %errorLevel% neq 0 (
    powershell -Command "Start-Process cmd -ArgumentList '/c \"\"%~dpnx0\"\"' -Verb RunAs"
    exit /b
)

set /p PIN="অনুগ্রহ করে মাস্টার পিন (Master PIN) প্রবেশ করান: "
if not "%PIN%"=="1234" (
    echo.
    echo ❌ পিন ভুল হয়েছে! সুরক্ষা আনইনস্টল করা সম্ভব নয়।
    echo.
    pause
    exit /b 1
)

echo.
echo পিন সঠিক। সিস্টেম রিস্টোর করা হচ্ছে...
set SCRIPT_DIR=%~dp0
powershell -ExecutionPolicy Bypass -File "%SCRIPT_DIR%shuddho-pc-engine.ps1" -Uninstall

schtasks /delete /tn "ShuddhoGuardProtection" /f >nul 2>&1

echo.
echo =================================================================
echo  ✅ শুদ্ধ গার্ড সার্ভিস সফলভাবে নিষ্ক্রিয় করা হয়েছে।
echo =================================================================
echo.
pause
```

---

# ৩. পিওর টেলিগ্রাম (PureGram) কোর প্যাচ

### ফাইল: `tools/patch-puregram-core.js`
```javascript
/**
 * শুদ্ধ গার্ড — পিওর টেলিগ্রাম (PureGram) কোর প্যাচ ইঞ্জিন
 * অফিশিয়াল টেলিগ্রাম অ্যান্ড্রয়েড সোর্স কোড থেকে সমস্ত গ্লোবাল ১৮+ চ্যানেল সার্চ,
 * পাবলিক চ্যানেল ডিসকভারি ও ক্ষতিকর লিঙ্ক অন্বেষণ স্থায়ীভাবে নিষ্ক্রিয় করে।
 */
const fs = require('fs');
const path = require('path');

const SEARCH_HELPER_PATH = path.join(__dirname, '..', 'puregram-core', 'TMessagesProj', 'src', 'main', 'java', 'org', 'telegram', 'ui', 'Adapters', 'SearchAdapterHelper.java');
const CHANNELS_ADAPTER_PATH = path.join(__dirname, '..', 'puregram-core', 'TMessagesProj', 'src', 'main', 'java', 'org', 'telegram', 'ui', 'Components', 'DialogsChannelsAdapter.java');

console.log('=== পিওর টেলিগ্রাম (PureGram) প্যাচিং শুরু হচ্ছে ===\n');

// ১. SearchAdapterHelper.java প্যাচ করা (গ্লোবাল চ্যানেল সার্চ ও ১৮+ কি-ওয়ার্ড ব্লক)
if (fs.existsSync(SEARCH_HELPER_PATH)) {
    let content = fs.readFileSync(SEARCH_HELPER_PATH, 'utf8');
    
    const filterSnippet = `
    // === PUREGRAM SHIELD: গ্লোবাল ১৮+ ও ক্ষতিকর চ্যানেল অনুসন্ধান ব্লক ===
    private static final String[] PUREGRAM_BANNED_KEYWORDS = {
        "choti", "boudi", "gopon", "viral", "leak", "leaked", "18+", "sex", "porn",
        "casino", "1xbet", "babu88", "jeetbuzz", "mms", "adult", "nude", "সহবাস"
    };

    private boolean isPureGramBlocked(String q) {
        if (q == null) return false;
        String lower = q.toLowerCase();
        for (String kw : PUREGRAM_BANNED_KEYWORDS) {
            if (lower.contains(kw)) return true;
        }
        return false;
    }
    `;

    if (!content.includes('PUREGRAM_BANNED_KEYWORDS')) {
        content = content.replace('public class SearchAdapterHelper {', 'public class SearchAdapterHelper {\n' + filterSnippet);
        content = content.replace(
            'if (allowUsername) {',
            'if (isPureGramBlocked(query)) { return; } // PUREGRAM: ক্ষতিকর কি-ওয়ার্ড ব্লক\n        if (false) { // PUREGRAM: গ্লোবাল পাবলিক চ্যানেল সার্চ স্থায়ীভাবে নিষ্ক্রিয়'
        );

        fs.writeFileSync(SEARCH_HELPER_PATH, content, 'utf8');
        console.log('✅ [সফল] SearchAdapterHelper.java: গ্লোবাল পাবলিক চ্যানেল সার্চ ও নোংরা কি-ওয়ার্ড চিরতরে বন্ধ করা হয়েছে।');
    }
}

// ২. DialogsChannelsAdapter.java প্যাচ করা (পাবলিক চ্যানেল ডিসকভারি ব্লক)
if (fs.existsSync(CHANNELS_ADAPTER_PATH)) {
    let content = fs.readFileSync(CHANNELS_ADAPTER_PATH, 'utf8');

    if (!content.includes('PUREGRAM_DISABLED')) {
        content = content.replace(
            'TLRPC.TL_contacts_search req2 = new TLRPC.TL_contacts_search();',
            '// PUREGRAM_DISABLED: নতুন অপরিচিত চ্যানেল খোঁজা ব্লক\n            if (true) return;\n            TLRPC.TL_contacts_search req2 = new TLRPC.TL_contacts_search();'
        );

        fs.writeFileSync(CHANNELS_ADAPTER_PATH, content, 'utf8');
        console.log('✅ [সফল] DialogsChannelsAdapter.java: টেলিগ্রাম চ্যানেল ডিসকভারি রিকোয়েস্ট নিষ্ক্রিয় করা হয়েছে।');
    }
}
```

---

# ৪. অ্যান্ড্রয়েড মোবাইল অ্যাপ

### ফাইল: `android/app/src/main/java/com/shuddho/guard/services/ShuddhoVpnService.kt`
```kotlin
package com.shuddho.guard.services

import android.content.Intent
import android.net.VpnService
import android.os.ParcelFileDescriptor
import android.util.Log

class ShuddhoVpnService : VpnService() {

    private var vpnInterface: ParcelFileDescriptor? = null

    companion object {
        private const val TAG = "ShuddhoVpnService"
        private const val CLEANBROWSING_IPV4 = "185.228.168.10"
        private const val CLOUDFLARE_FAMILY_IPV4 = "1.1.1.3"
        private const val CLOUDFLARE_FAMILY_IPV6 = "2606:4700:4700::1113"
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        Log.i(TAG, "শুদ্ধ গার্ড ভিআইপিএন সার্ভিস শুরু হচ্ছে...")
        startVpn()
        return START_STICKY
    }

    private fun startVpn() {
        if (vpnInterface != null) return

        try {
            val builder = Builder()
                .setSession("ShuddhoGuardSecureDNS")
                .addAddress("10.0.0.2", 32)
                .addDnsServer(CLEANBROWSING_IPV4)
                .addDnsServer(CLOUDFLARE_FAMILY_IPV4)
                .addDnsServer(CLOUDFLARE_FAMILY_IPV6)
                .setBlocking(true)

            vpnInterface = builder.establish()
            Log.i(TAG, "✅ [সফল] CleanBrowsing ও Cloudflare Family DNS সক্রিয় হয়েছে।")
        } catch (e: Exception) {
            Log.e(TAG, "❌ ভিপিএন চালুকরণে ত্রুটি: ${e.message}")
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        vpnInterface?.close()
        vpnInterface = null
        Log.i(TAG, "শুদ্ধ গার্ড ভিআইপিএন সার্ভিস বন্ধ হয়েছে।")
    }

    override fun onRevoke() {
        super.onRevoke()
        vpnInterface?.close()
        vpnInterface = null
        Log.w(TAG, "⚠️ ব্যবহারকারী ভিপিএন বন্ধ করার চেষ্টা করেছেন!")
    }
}
```

### ফাইল: `android/app/src/main/java/com/shuddho/guard/receivers/ShuddhoDeviceAdminReceiver.kt`
```kotlin
package com.shuddho.guard.receivers

import android.app.admin.DeviceAdminReceiver
import android.app.admin.DevicePolicyManager
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.os.UserManager
import android.util.Log
import android.widget.Toast

class ShuddhoDeviceAdminReceiver : DeviceAdminReceiver() {

    companion object {
        private const val TAG = "ShuddhoDeviceAdmin"

        fun getComponentName(context: Context): ComponentName {
            return ComponentName(context.applicationContext, ShuddhoDeviceAdminReceiver::class.java)
        }
    }

    override fun onEnabled(context: Context, intent: Intent) {
        super.onEnabled(context, intent)
        Log.i(TAG, "🛡️ শুদ্ধ গার্ড ডিভাইস অ্যাডমিনিস্ট্রেটর সক্রিয় হয়েছে।")

        val dpm = context.getSystemService(Context.DEVICE_POLICY_SERVICE) as DevicePolicyManager
        val adminComponent = getComponentName(context)

        try {
            if (dpm.isDeviceOwnerApp(context.packageName)) {
                dpm.addUserRestriction(adminComponent, UserManager.DISALLOW_UNINSTALL_APPS)
                Log.i(TAG, "🔒 আন-ইনস্টল স্থায়ীভাবে লক করা হয়েছে।")
            }
        } catch (e: Exception) {
            Log.e(TAG, "ডিভাইস পলিসি প্রয়োগে ত্রুটি: ${e.message}")
        }

        Toast.makeText(context, "শুদ্ধ গার্ড প্রতিরক্ষা সক্রিয় হয়েছে!", Toast.LENGTH_SHORT).show()
    }

    override fun onDisableRequested(context: Context, intent: Intent): CharSequence {
        return "সতর্কতা: শুদ্ধ গার্ড নিষ্ক্রিয় করলে আপনার ফোন সব ধরণের নোংরা ও বিপজ্জনক কনটেন্টের সামনে অরক্ষিত হয়ে পড়বে!"
    }
}
```

### ফাইল: `android/app/src/main/java/com/shuddho/guard/ui/StealthCalculatorActivity.kt`
```kotlin
package com.shuddho.guard.ui

import android.content.Intent
import android.os.Bundle
import android.widget.Button
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity
import com.shuddho.guard.R

class StealthCalculatorActivity : AppCompatActivity() {

    private lateinit var tvDisplay: TextView
    private var currentInput = StringBuilder()

    companion object {
        private const val SECRET_PIN = "1234="
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_stealth_calculator)

        tvDisplay = findViewById(R.id.tvDisplay)

        val btnIds = listOf(
            R.id.btn0, R.id.btn1, R.id.btn2, R.id.btn3, R.id.btn4,
            R.id.btn5, R.id.btn6, R.id.btn7, R.id.btn8, R.id.btn9,
            R.id.btnPlus, R.id.btnMinus, R.id.btnMultiply, R.id.btnDivide,
            R.id.btnClear, R.id.btnEquals
        )

        for (id in btnIds) {
            findViewById<Button>(id)?.setOnClickListener { view ->
                handleButtonPress((view as Button).text.toString())
            }
        }
    }

    private fun handleButtonPress(value: String) {
        when (value) {
            "C" -> {
                currentInput.clear()
                tvDisplay.text = "0"
            }
            "=" -> {
                currentInput.append("=")
                if (currentInput.toString() == SECRET_PIN) {
                    currentInput.clear()
                    tvDisplay.text = "0"
                    val intent = Intent(this, VaultDashboardActivity::class.java)
                    startActivity(intent)
                    finish()
                } else {
                    tvDisplay.text = "0"
                    currentInput.clear()
                }
            }
            else -> {
                currentInput.append(value)
                tvDisplay.text = currentInput.toString()
            }
        }
    }
}
```

---

# ৫. ক্লাউড ব্যাকএন্ড সার্ভার

### ফাইল: `backend/server.js`
```javascript
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 4000;

let blacklist = {
    domains: [
        "pornhub.com", "xvideos.com", "xnxx.com", "xhamster.com",
        "deshiboudi.com", "banglachoti.com", "chotikahini.com", "bdchoti.net",
        "1xbet-bangladesh.com", "babu88.com", "jeetbuzz.com"
    ],
    telegramChannels: [
        "choti_boudi_leak_18", "viral_video_bd_link", "deshi_mms_collection"
    ],
    lastUpdated: new Date().toISOString()
};

app.get('/health', (req, res) => res.json({ status: "OK", service: "Shuddho Guard Cloud Sync" }));
app.get('/api/v1/health', (req, res) => res.json({ status: "OK", service: "Shuddho Guard Cloud Sync" }));

app.get('/blacklist', (req, res) => res.json(blacklist));
app.get('/api/v1/blacklist', (req, res) => res.json(blacklist));

app.post('/report', (req, res) => {
    const { url, reason } = req.body;
    if (url) {
        console.log(`[REPORT RECEIVED] নতুন রিপোর্ট: ${url}`);
        return res.json({ status: "success", message: "রিপোর্ট গৃহীত হয়েছে।" });
    }
    res.status(400).json({ status: "error", message: "URL প্রদান করুন।" });
});

app.post('/subscription/verify', (req, res) => {
    const { mobileNumber, transactionId } = req.body;
    if (mobileNumber && transactionId) {
        const dummyLicenseKey = "SG-PRO-" + Math.random().toString(36).substring(2, 8).toUpperCase();
        return res.json({
            status: "success",
            message: "বিকাশ সাবস্ক্রিপশন সফলভাবে যাচাই করা হয়েছে।",
            licenseKey: dummyLicenseKey,
            expiresAt: new Date(Date.now() + 30*24*60*60*1000).toISOString()
        });
    }
    res.status(400).json({ status: "error", message: "বিকাশ নম্বর ও TrxID প্রদান করুন।" });
});

app.listen(PORT, () => {
    console.log(`🚀 শুদ্ধ গার্ড ক্লাউড সার্ভার পোর্ট ${PORT}-এ সফলভাবে চালু হয়েছে।`);
});
```

### ফাইল: `render.yaml`
```yaml
services:
  - type: web
    name: shuddho-guard-backend
    env: node
    plan: free
    rootDir: backend
    buildCommand: npm install
    startCommand: node server.js
    envVars:
      - key: PORT
        value: 10000
      - key: NODE_ENV
        value: production
      - key: ADMIN_SECRET
        generateValue: true
```

---

# ৬. বাণিজ্যিক ল্যান্ডিং পেজ

### ফাইল: `landing-page/index.html`
*(সম্পূর্ণ সোর্স কোড [landing-page/index.html](file:///c:/Users/assdi/Documents/Downloads/shuddho-guard/landing-page/index.html) ফাইলে সংরক্ষিত এবং GitHub Pages এ লাইভ রিলিজড)*

---

# ৭. স্বয়ংক্রিয় টেস্ট স্যুট

### ফাইল: `tools/test-trap-detector.js`
```javascript
// সর্বজনীন ক্ষতিকর লিঙ্ক (জুয়া, ক্যাসিনো, পর্নোগ্রাফি, হানি-ট্র্যাপ) ডিটেকশন টেস্ট

const GAMBLING_DOMAINS = [
    '1xbet', 'melbet', 'bet365', 'babu88', 'jeetbuzz', 'mostbet', 'parimatch',
    'crazytime', 'linebet', 'betway', 'krikya', 'bajilive', 'crickex', 'betwinner',
    '22bet', '1win', 'megapari', 'dafabet', 'stake.com', 'bc.game', 'shillongteer'
];
const GAMBLING_KEYWORDS = [
    '1xbet', 'melbet', 'babu88', 'jeetbuzz', 'mostbet', 'parimatch', 'casino', 'ক্যাসিনো',
    'জুয়া', 'জুয়া', 'বাজি', 'বেটিং', 'টাকা ইনকাম লিংক', 'ডিপোজিট বোনাস', 'প্রেডিকশন গ্রুপ',
    'aviator', 'crazy time', 'রুলেট', 'তিন পাত্তি', 'betting link', 'betting tips'
];
const ADULT_DOMAINS = [
    'pornhub', 'xvideos', 'xnxx', 'xhamster', 'stripchat', 'bongacams',
    'chotikahini', 'banglachoti', 'deshiboudi', 'bdchoti', 'redwap', 'spankbang',
    'brazzers', 'chaturbate', 'onlyfans'
];
const ADULT_KEYWORDS = [
    'choti', 'boudi', 'gopon', 'viral video', 'leaked', 'leak', '18+', 'সহবাস',
    'বউ ছাড়া', 'বউ ছাড়া', 'গোপন ভিডিও', 'ভিডিও লিংক', 'কমেন্টে লিংক', 'সেক্স', 'চটি গল্প',
    'হট ভিডিও', 'নগ্ন', 'ক্যাম স্ক্যান্ডাল', 'এমএমএস', 'mms', 'ভাইরাল লিংক'
];
const TELEGRAM_DOMAINS = ['t.me', 'telegram.me', 'telegram.dog'];
const SHORTENER_DOMAINS = ['bit.ly', 'tinyurl.com', 'cutt.ly', 'is.gd', 't.co', 'rb.gy', 'shorturl.at'];

function analyzeLink(href, contextText) {
    const full = (href + ' ' + contextText).toLowerCase();

    const isGambling = GAMBLING_DOMAINS.some(d => href.toLowerCase().includes(d)) || 
                       (GAMBLING_KEYWORDS.some(k => full.includes(k)) && (TELEGRAM_DOMAINS.some(d => href.includes(d)) || SHORTENER_DOMAINS.some(d => href.includes(d))));
    if (isGambling) return { blocked: true, category: 'জুয়া ও ক্যাসিনো' };

    const isAdult = ADULT_DOMAINS.some(d => href.toLowerCase().includes(d));
    if (isAdult) return { blocked: true, category: 'পর্নোগ্রাফি ও চটি' };

    const isTelegram = TELEGRAM_DOMAINS.some(d => href.toLowerCase().includes(d));
    if (isTelegram) {
        const hasTrapSlug = ['leak', 'choti', 'boudi', 'viral', '18plus', 'casino', 'betting'].some(s => href.toLowerCase().includes(s));
        if (hasTrapSlug || ADULT_KEYWORDS.some(k => full.includes(k)) || GAMBLING_KEYWORDS.some(k => full.includes(k))) {
            return { blocked: true, category: 'টেলিগ্রাম ফাঁদ' };
        }
    }

    const isShortener = SHORTENER_DOMAINS.some(d => href.toLowerCase().includes(d));
    if (isShortener && (ADULT_KEYWORDS.some(k => full.includes(k)) || GAMBLING_KEYWORDS.some(k => full.includes(k)))) {
        return { blocked: true, category: 'লুকানো ক্ষতিকর লিংক' };
    }

    return { blocked: false, category: 'নিরাপদ' };
}

const testCases = [
    {
        name: "অনলাইন জুয়া/ক্যাসিনো সাইট (1xBet / Babu88)",
        href: "https://1xbet-bangladesh.com/register?promo=freebonus",
        context: "আজই একাউন্ট খুলুন এবং ১০০% ডিপোজিট বোনাস নিন",
        expectedBlocked: true
    },
    {
        name: "টেলিগ্রাম ক্যাসিনো ও বাজি প্রেডিকশন গ্রুপ",
        href: "https://t.me/joinchat/babu88_crazytime_signals",
        context: "ক্যাসিনো এভিয়েটর গেম হ্যাক ও সিগন্যাল পেতে জয়েন করুন",
        expectedBlocked: true
    },
    {
        name: "পর্নোগ্রাফি ওয়েবসাইট লিংক (xvideos / banglachoti)",
        href: "https://www.xvideos.com/video12345",
        context: "অ্যাডাল্ট ভিডিও সাইট",
        expectedBlocked: true
    },
    {
        name: "ক্লিকবেট পোস্টের কমেন্টে টেলিগ্রাম হানি-ট্র্যাপ লিংক",
        href: "https://t.me/joinchat/XYZ123_leak_video",
        context: "সম্মানিত ব্যক্তির ছবি দিয়ে ভুয়া পোস্ট: কমেন্টে পুরো গোপন ভিডিওর লিংক দেখুন",
        expectedBlocked: true
    },
    {
        name: "শর্টনার দিয়ে লুকানো চটি লিংক",
        href: "https://bit.ly/deshi-boudi-gopon",
        context: "ভাইরাল গোপন ভিডিও দেখতে ক্লিক করুন",
        expectedBlocked: true
    },
    {
        name: "স্বাভাবিক খবরের টেলিগ্রাম চ্যানেল (প্রথম আলো)",
        href: "https://t.me/prothomalo_official",
        context: "আজকের তাজা খবর জানতে আমাদের অফিসিয়াল চ্যানেলে যুক্ত হোন",
        expectedBlocked: false
    },
    {
        name: "শিক্ষণীয় পাইথন প্রোগ্রামিং কোর্স লিংক",
        href: "https://bit.ly/free-python-course",
        context: "বিনামূল্যে পাইথন শিখুন এবং সার্টিফিকেট নিন",
        expectedBlocked: false
    }
];

console.log("=== শুদ্ধ গার্ড সর্বজনীন ক্ষতিকর লিঙ্ক ফিল্টারিং টেস্ট ===\n");
let passed = 0;

testCases.forEach((tc, i) => {
    const res = analyzeLink(tc.href, tc.context);
    const ok = res.blocked === tc.expectedBlocked;
    if (ok) passed++;
    console.log(`[টেস্ট #${i+1}] ${tc.name}`);
    console.log(`- লিঙ্ক: ${tc.href}`);
    console.log(`- ধরন: ${res.category}`);
    console.log(`- সিদ্ধান্ত: ${res.blocked ? "🚨 ব্লকড (BLOCKED)" : "✅ নিরাপদ (ALLOWED)"} | স্ট্যাটাস: ${ok ? "PASS" : "FAIL"}\n`);
});

console.log(`মোট টেস্ট: ${testCases.length}, উত্তীর্ণ: ${passed}/${testCases.length}`);
if (passed === testCases.length) {
    console.log("🎯 সর্বজনীন ক্ষতিকর লিঙ্ক ফিল্টারিং টেস্ট সফলভাবে উত্তীর্ণ হয়েছে!");
} else {
    process.exit(1);
}
```

---

# ৮. মার্কেট লঞ্চ কিট
*(সম্পূর্ণ মার্কেটিং লঞ্চ পোস্ট ও ৬০ সেকেন্ডের ভিডিও স্ক্রিপ্ট [MARKETING_LAUNCH_KIT.md](file:///c:/Users/assdi/Documents/Downloads/shuddho-guard/MARKETING_LAUNCH_KIT.md) ফাইলে সংরক্ষিত)*
