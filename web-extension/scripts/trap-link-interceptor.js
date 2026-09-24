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
        'pornhub.com', 'xvideos.com', 'xnxx.com', 'xhamster.com', 'stripchat.com', 'bongacams.com',
        'chotikahini.com', 'banglachoti.com', 'deshiboudi.com', 'bdchoti.net', 'redwap.me', 'spankbang.com',
        'brazzers.com', 'chaturbate.com', 'onlyfans.com', 'fapello.com', 'leakgirls.com', 'thothub.to'
    ];
    const ADULT_KEYWORDS = [
        'choti', 'boudi', 'gopon', 'viral video', 'leaked', 'leak', '18+', 'সহবাস',
        'বউ ছাড়া', 'বউ ছাড়া', 'গোপন ভিডিও', 'ভিডিও লিংক', 'কমেন্টে লিংক', 'সেক্স', 'চটি গল্প',
        'হট ভিডিও', 'নগ্ন', 'ক্যাম স্ক্যান্ডাল', 'এমএমএস', 'mms', 'ভাইরাল লিংক', 'গোপন রহস্য'
    ];

    // ৩. টেলিগ্রাম ও লিঙ্ক শর্টনার
    const TELEGRAM_DOMAINS = ['t.me', 'telegram.me', 'telegram.dog'];
    const SHORTENER_DOMAINS = ['bit.ly', 'tinyurl.com', 'cutt.ly', 'is.gd', 't.co', 'rb.gy', 'shorturl.at'];

    /**
     * FIX #11: নিরাপদ Hostname নিষ্কাশন
     */
    function extractHostname(rawUrl) {
        if (!rawUrl) return '';
        try {
            const u = new URL(rawUrl, window.location.href);
            return (u.hostname || '').toLowerCase();
        } catch (e) {
            return '';
        }
    }

    /**
     * FIX #11: সাবস্ট্রিং বাউন্ডারি সমস্যা ছাড়া সঠিক ডোমেইন ম্যাচিং
     */
    function hostMatches(hostname, pattern) {
        if (!hostname || !pattern) return false;
        hostname = hostname.toLowerCase().trim();
        pattern = pattern.toLowerCase().trim();

        // ১. ডাইরেক্ট হোস্ট বা সাবডোমেইন (যেমন t.me, sub.t.me, pornhub.com)
        if (hostname === pattern || hostname.endsWith('.' + pattern)) {
            return true;
        }

        // ২. ডট ছাড়া ব্র্যান্ড কী-ওয়ার্ড (যেমন 1win, 1xbet, babu88)
        if (!pattern.includes('.')) {
            const labels = hostname.split('.');
            for (const label of labels) {
                if (label === pattern) return true;
                if (label.startsWith(pattern + '-') || label.startsWith(pattern + '_')) return true;
                const digitsRegex = new RegExp(`^${pattern}[0-9]+$`);
                if (digitsRegex.test(label)) return true;
            }
        }

        return false;
    }

    /**
     * লিঙ্কটি ক্ষতিকারক কি না যাচাই করা এবং বিপদের ধরন শনাক্ত করা
     */
    function analyzeLinkRisk(anchor) {
        const href = (anchor.href || '').toLowerCase();
        const hostname = extractHostname(href);
        const text = (anchor.innerText || '').toLowerCase();
        const parentElem = anchor.closest('div[role="article"], div[data-ad-preview="message"], .comment, div[dir="auto"], p, article');
        const parentText = (parentElem ? parentElem.innerText : '').toLowerCase();
        const combinedText = `${text} ${href} ${parentText}`;

        const isTelegramDomain = TELEGRAM_DOMAINS.some(d => hostMatches(hostname, d));
        const isShortener = SHORTENER_DOMAINS.some(d => hostMatches(hostname, d));
        const isGamblingDomain = GAMBLING_DOMAINS.some(d => hostMatches(hostname, d));
        const hasGamblingKeywords = GAMBLING_KEYWORDS.some(kw => combinedText.includes(kw));

        // FIX #12: Adult Keywords সঠিকভাবে শনাক্ত ও ব্যবহার
        const isAdultDomain = ADULT_DOMAINS.some(d => hostMatches(hostname, d));
        const hasAdultKeywords = ADULT_KEYWORDS.some(kw => combinedText.includes(kw));

        // ক্যাটাগরি ১: অনলাইন জুয়া ও ক্যাসিনো
        if (isGamblingDomain || (hasGamblingKeywords && (isShortener || isTelegramDomain))) {
            return {
                isHarmful: true,
                category: 'অনলাইন জুয়া ও ক্যাসিনো ফাঁদ',
                icon: '🎰',
                badgeColor: '#F59E0B',
                description: 'এই লিঙ্কটি আপনাকে অবৈধ অনলাইন জুয়া, বাজি বা ক্যাসিনো সাইটের দিকে নিয়ে যাচ্ছিল। এতে মারাত্মক আর্থিক ক্ষতি ও আসক্তির ঝুঁকি রয়েছে।'
            };
        }

        // ক্যাটাগরি ২: পর্নোগ্রাফি ও আপত্তিকর চটি সাইট (FIX #12: hasAdultKeywords সক্রিয়)
        if (isAdultDomain || (hasAdultKeywords && (isShortener || isTelegramDomain || href.includes('video') || href.includes('watch')))) {
            return {
                isHarmful: true,
                category: 'পর্নোগ্রাফি ও প্রাপ্তবয়স্ক কনটেন্ট',
                icon: '🔞',
                badgeColor: '#EF4444',
                description: 'এই লিঙ্কটি একটি নিষিদ্ধ প্রাপ্তবয়স্ক বা পর্নোগ্রাফিক ওয়েবসাইটে নিয়ে যাচ্ছিল। আত্মরক্ষা ও সামাজিক সম্মানের স্বার্থে এটি প্রতিহত করা হলো।'
            };
        }

        // ক্যাটাগরি ৩: সোশ্যাল মিডিয়ার টেলিগ্রাম হানি-ট্র্যাপ (ক্লিকবেট পোস্টের কমেন্টে চটি/ভিডিও লিংক)
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

    /**
     * FIX #18: বাম ক্লিক ও মিডল-ক্লিক (auxclick) হ্যান্ডলার
     */
    function handleLinkInteraction(e) {
        // শুধুমাত্র বাম ক্লিক (button 0) বা মিডল ক্লিক (button 1) পরীক্ষা
        if (e.button !== 0 && e.button !== 1) return;

        const anchor = e.target.closest('a');
        if (!anchor) return;

        const analysis = analyzeLinkRisk(anchor);
        if (analysis.isHarmful) {
            e.preventDefault();
            e.stopPropagation();
            showHarmfulLinkAlert(anchor.href, analysis);
        }
    }

    document.addEventListener('click', handleLinkInteraction, true);
    document.addEventListener('auxclick', handleLinkInteraction, true);

    /**
     * FIX #13: XSS-মুক্ত অ্যালার্ট মডাল (textContent ব্যবহার)
     */
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
                    🛑 অবরুদ্ধ গন্তব্য: <span id="shuddho-blocked-url" style="color: #38BDF8;"></span>
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

        // FIX #13: XSS রোধে textContent এর মাধ্যমে URL রেন্ডার করা
        const urlSpan = document.getElementById('shuddho-blocked-url');
        if (urlSpan) {
            urlSpan.textContent = targetUrl || '';
        }

        document.getElementById('shuddho-stay-safe-btn').addEventListener('click', function() {
            modal.remove();
        });
    }

})();
