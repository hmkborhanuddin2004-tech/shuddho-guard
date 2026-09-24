// শুদ্ধ গার্ড — সর্বজনীন ক্ষতিকর ও প্রতারণামূলক লিঙ্ক ইন্টারসেপ্টর (Universal Harmful Link Interceptor)
(function(root, factory) {
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = factory();
    } else {
        root.ShuddhoTrapInterceptor = factory();
    }
})(typeof globalThis !== 'undefined' ? globalThis : this, function() {
    'use strict';

    // ১. জুয়া, বাজি ও ক্যাসিনো ডোমেইন ও ব্র্যান্ড তালিকা
    const GAMBLING_DOMAINS = [
        '1xbet', 'melbet', 'bet365', 'babu88', 'jeetbuzz', 'mostbet', 'parimatch',
        'crazytime', 'linebet', 'betway', 'krikya', 'bajilive', 'crickex', 'betwinner',
        '22bet', '1win', 'megapari', 'dafabet', 'stake.com', 'bc.game', 'shillongteer'
    ];

    const GAMBLING_BRANDS = [
        '1xbet', '1win', 'babu88', 'melbet', 'bet365', 'mostbet', 'parimatch',
        'jeetbuzz', 'crazytime', 'linebet', 'betway', 'krikya', 'bajilive', 'baji999',
        'crickex', 'betwinner', '22bet', 'megapari', 'dafabet', 'stake', 'bc.game',
        'shillongteer'
    ];

    // ব্র্যান্ড ভ্যারিয়েন্ট ও মিরর ডোমেইনের জন্য স্বীকৃত উপসর্গ ও অনুসর্গ
    const BETTING_AFFIX_PREFIXES = [
        'bd', 'bangla', 'live', 'play', 'app', 'login', 'official', 'link', 'agent', 'online', 'vip'
    ];

    const BETTING_AFFIX_SUFFIXES = [
        'bd', 'bangladesh', 'live', 'pro', 'app', 'login', 'official', 'link',
        'casino', 'bet', 'betting', 'agent', 'online', 'vip', 'mobi', 'asia', 'games', 'win', 'plus', 'sports'
    ];

    const GAMBLING_KEYWORDS = [
        '1xbet', 'melbet', 'babu88', 'jeetbuzz', 'mostbet', 'parimatch', 'casino', 'ক্যাসিনো',
        'জুয়া', 'জুয়া', 'বাজি', 'বেটিং', 'টাকা ইনকাম লিংক', 'ডিপোজিট বোনাস', 'প্রেডিকশন গ্রুপ',
        'aviator', 'crazy time', 'রুলেট', 'তিন পাত্তি', 'betting link', 'betting tips',
        'free bonus', 'win money', 'jackpot'
    ];

    // ২. পর্নোগ্রাফি, চটি ও আপত্তিকর অ্যাডাল্ট ডোমেইন ও কি-ওয়ার্ড তালিকা
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
     * মাল্টি-পাস ইউআরএল ডিকোডার (Multi-Pass URL Decoder)
     * ট্রিপল এনকোডেড (%2525) এবং অস্পষ্ট ইউআরএল ডিকোড করে
     */
    function multiPassDecodeUrl(str, maxPasses = 3) {
        if (!str || typeof str !== 'string') return str;
        let decoded = str;
        for (let i = 0; i < maxPasses; i++) {
            try {
                const next = decodeURIComponent(decoded);
                if (next === decoded) break;
                decoded = next;
            } catch (e) {
                break;
            }
        }
        return decoded;
    }

    /**
     * কেস-ইনসেনসিটিভ কোয়েরি প্যারামিটার এক্সট্র্যাকশন
     */
    function getQueryParamCaseInsensitive(parsed, ...paramNames) {
        if (!parsed || !parsed.searchParams) return null;
        const candidates = paramNames.map(p => p.toLowerCase());
        for (const [key, value] of parsed.searchParams.entries()) {
            if (candidates.includes(key.toLowerCase())) {
                return value;
            }
        }
        return null;
    }

    /**
     * রিকার্সিভ রিডাইরেক্ট আনর‍্যাপার (Recursive Redirect Unwrapper)
     * YouTube, Facebook, Instagram, TikTok, Google ইত্যাদি প্ল্যাটফর্মের মোড়ক ও শর্টনার থেকে
     * মূল ক্ষতিকর গন্তব্য উন্মোচন করে (সর্বোচ্চ maxDepth স্তর পর্যন্ত, ডিফল্ট ১০)।
     */
    function unwrapUrl(rawUrl, maxDepth = 10) {
        if (!rawUrl || typeof rawUrl !== 'string') return '';
        let current = rawUrl.trim();
        const visited = new Set();

        for (let depth = 0; depth < maxDepth; depth++) {
            if (!current || visited.has(current)) break;
            visited.add(current);

            let parsed;
            try {
                parsed = new URL(current, typeof window !== 'undefined' ? window.location.href : 'http://localhost');
            } catch (e) {
                break;
            }

            const host = (parsed.hostname || '').toLowerCase();
            let extracted = null;

            // ১. YouTube রিডাইরেক্ট র‍্যাপার (youtube.com/redirect?q=... বা youtu.be)
            if (host === 'youtube.com' || host.endsWith('.youtube.com') || host === 'youtu.be') {
                if (parsed.pathname.includes('/redirect') || getQueryParamCaseInsensitive(parsed, 'q', 'url')) {
                    extracted = getQueryParamCaseInsensitive(parsed, 'q', 'url');
                }
            }
            // ২. Facebook Link Shim & ফ্লিক্স ওয়ার্নিং র‍্যাপার (l.facebook.com/l.php?u=... ও facebook.com/flx/warn/?u=...)
            else if (host === 'facebook.com' || host.endsWith('.facebook.com') || host.endsWith('.fb.com')) {
                extracted = getQueryParamCaseInsensitive(parsed, 'u', 'url');
            }
            // ৩. Instagram রিডাইরেক্ট শিম (l.instagram.com/?u=...)
            else if (host === 'instagram.com' || host.endsWith('.instagram.com')) {
                extracted = getQueryParamCaseInsensitive(parsed, 'u', 'url');
            }
            // ৪. TikTok প্রতারণামূলক অ্যাড ও রিডাইরেক্ট লিঙ্ক (tiktok.com/link/v2?target=...)
            else if (host === 'tiktok.com' || host.endsWith('.tiktok.com')) {
                extracted = getQueryParamCaseInsensitive(parsed, 'target', 'target_url', 'url');
            }
            // ৫. Google রিডাইরেক্ট (google.com/url?q=...)
            else if (host === 'google.com' || host.endsWith('.google.com')) {
                extracted = getQueryParamCaseInsensitive(parsed, 'q', 'url');
            }

            // ৬. সাধারণ কোয়েরি প্যারামিটার রিডাইরেক্ট এক্সট্র্যাকশন
            if (!extracted) {
                const redirectParams = ['target', 'target_url', 'dest', 'destination', 'redirect', 'redirect_url', 'url', 'u', 'link', 'to', 'q', 'next', 'return', 'return_url', 'forward', 'goto', 'r'];
                for (const param of redirectParams) {
                    const val = getQueryParamCaseInsensitive(parsed, param);
                    if (val) {
                        const decodedVal = multiPassDecodeUrl(val, 3);
                        if (decodedVal.startsWith('http://') || decodedVal.startsWith('https://') || decodedVal.startsWith('//') || decodedVal.startsWith('tg://') || decodedVal.startsWith('t.me/')) {
                            extracted = val;
                            break;
                        }
                    }
                }
            }

            if (extracted) {
                extracted = extracted.trim();
                extracted = multiPassDecodeUrl(extracted, 3);
                if (extracted.startsWith('//')) {
                    extracted = 'https:' + extracted;
                } else if (extracted.startsWith('t.me/')) {
                    extracted = 'https://' + extracted;
                }
                current = extracted;
            } else {
                break;
            }
        }

        return current;
    }

    /**
     * নিরাপদ Hostname নিষ্কাশন
     */
    function extractHostname(rawUrl) {
        if (!rawUrl) return '';
        try {
            const base = (typeof window !== 'undefined' && window.location) ? window.location.href : 'http://localhost';
            const u = new URL(rawUrl, base);
            return (u.hostname || '').toLowerCase().replace(/\.+$/, '');
        } catch (e) {
            return '';
        }
    }

    /**
     * সাবস্ট্রিং বাউন্ডারি সমস্যা ছাড়া সঠিক ডোমেইন ম্যাচিং
     */
    function hostMatches(hostname, pattern) {
        if (!hostname || !pattern) return false;
        hostname = hostname.toLowerCase().trim().replace(/\.+$/, '');
        pattern = pattern.toLowerCase().trim().replace(/\.+$/, '');

        // ১. ডাইরেক্ট হোস্ট বা সাবডোমেইন (যেমন t.me, sub.t.me, pornhub.com)
        if (hostname === pattern || hostname.endsWith('.' + pattern)) {
            return true;
        }

        // ২. ডট ছাড়া ব্র্যান্ড কী-ওয়ার্ড
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
     * বেটিং ব্র্যান্ড ভ্যারিয়েন্ট ও মিরর ডোমেইন ম্যাচিং (Prefixes, Infixes, Suffixes)
     * উদাহরন: 1xbet, bd-1xbet, 1xbet-mobi, 1win, 1winbd, 1win-pro, babu88, babu88live, babu88-bd
     * ফলস পজিটিভ প্রতিরোধ (যেমন 1windows.com নিরাপদ রাখা আবশ্যক)।
     */
    function isBettingBrandMatch(hostname) {
        if (!hostname) return false;
        hostname = hostname.toLowerCase().trim().replace(/\.+$/, '');

        // ১. সরাসরি তালিকাভুক্ত জুয়া ডোমেইন
        for (const d of GAMBLING_DOMAINS) {
            if (hostname === d || hostname.endsWith('.' + d)) {
                return true;
            }
        }

        // ২. হোস্টনেমের প্রতিটি লেবেলে ব্র্যান্ডের ভ্যারিয়েন্ট অনুসন্ধান
        const labels = hostname.split('.');
        for (const label of labels) {
            const cleanLabel = label.replace(/[-_]+/g, '').replace(/^one(?=[a-z0-9])/i, '1');

            for (const brand of GAMBLING_BRANDS) {
                // ক. নিখুঁত লেবেল ম্যাচ বা হাইফেন-বিভক্ত ব্র্যান্ড ম্যাচ (যেমন 1xbet, 1x-bet, babu-88, 1-win, one-xbet)
                if (label === brand || cleanLabel === brand) return true;

                // খ. হাইফেন বা আন্ডারস্কোর দ্বারা বিভক্ত টোকেন (যেমন bd-1xbet, 1xbet-mobi, 1win-pro, babu88-bd, fake-1xbet)
                if (label.includes('-') || label.includes('_')) {
                    const tokens = label.split(/[-_]+/);
                    if (tokens.includes(brand)) return true;
                    if (tokens.some(t => new RegExp(`^${brand}[0-9]+$`).test(t))) return true;
                    for (const suffix of BETTING_AFFIX_SUFFIXES) {
                        if (tokens.includes(brand + suffix)) return true;
                        if (brand === '1xbet' && tokens.includes('1xbetting')) return true;
                    }
                    for (const prefix of BETTING_AFFIX_PREFIXES) {
                        if (tokens.includes(prefix + brand)) return true;
                    }
                }

                // গ. ব্র্যান্ডের সাথে শুধুমাত্র সংখ্যা যুক্ত (যেমন 1xbet12, 1win88, babu888, 1xbet100)
                const digitsRegex = new RegExp(`^${brand}[0-9]+$`);
                if (digitsRegex.test(label) || digitsRegex.test(cleanLabel)) return true;

                // ঘ. ব্র্যান্ডের সাথে স্বীকৃত বেটিং অনুসর্গ যুক্ত (যেমন 1winbd, babu88live, 1xbetbd, 1xbetting)
                for (const suffix of BETTING_AFFIX_SUFFIXES) {
                    if (label === brand + suffix || cleanLabel === brand + suffix) return true;
                    if (new RegExp(`^${brand}${suffix}[0-9]*$`).test(label) || new RegExp(`^${brand}${suffix}[0-9]*$`).test(cleanLabel)) return true;
                }
                if (brand === '1xbet' && (label.startsWith('1xbetting') || cleanLabel.startsWith('1xbetting'))) {
                    return true;
                }

                // ঙ. ব্র্যান্ডের সাথে স্বীকৃত বেটিং উপসর্গ যুক্ত (যেমন official1xbet, playbabu88, bd1win)
                for (const prefix of BETTING_AFFIX_PREFIXES) {
                    if (label === prefix + brand || cleanLabel === prefix + brand) return true;
                    if (new RegExp(`^${prefix}${brand}[0-9]*$`).test(label) || new RegExp(`^${prefix}${brand}[0-9]*$`).test(cleanLabel)) return true;
                }
            }
        }

        return false;
    }

    /**
     * টেলিগ্রাম ক্ষতিকর ফাঁদ ও গোপন চ্যানেল লিংক শনাক্তকরণ
     * যেমন: t.me/+..., t.me/joinchat/..., গোপন অ্যাডাল্ট ও বাজি চ্যানেল
     */
    function isTelegramTrapLink(url, combinedText) {
        if (!url) return false;
        const lowerUrl = url.toLowerCase();
        const hostname = extractHostname(lowerUrl);
        const isTg = lowerUrl.startsWith('tg://') || TELEGRAM_DOMAINS.some(d => hostMatches(hostname, d));
        if (!isTg) return false;

        // ক. ইউআরএল পাথে ক্ষতিকর ফাঁদ নির্দেশক শব্দ (Trap Slugs)
        const trapSlugs = [
            'leak', 'leaked', 'choti', 'boudi', 'viral', '18plus', '18+', 'casino', 'betting',
            'gopon', 'mms', 'adult', 'sexy', 'nude', 'babu88', '1xbet', '1win', 'aviator',
            'crazytime', 'teenpatti', 'jackpot', 'escort', 'vip_signal', 'casiino', 'bazi', 'juya'
        ];
        if (trapSlugs.some(slug => lowerUrl.includes(slug))) {
            return true;
        }

        // খ. কনটেক্সটে বাজি বা প্রাপ্তবয়স্ক কি-ওয়ার্ড থাকলে টেলিগ্রামের যেকোনো লিংকই ফাঁদ
        const textToCheck = (combinedText || '').toLowerCase();
        const hasGamblingKeywords = GAMBLING_KEYWORDS.some(kw => textToCheck.includes(kw));
        const hasAdultKeywords = ADULT_KEYWORDS.some(kw => textToCheck.includes(kw));

        if (hasGamblingKeywords || hasAdultKeywords) {
            return true;
        }

        // গ. ইনভাইট লিংক প্যাটার্ন (t.me/+, t.me/%2b, t.me/joinchat/, tg://join) এবং ক্লিকবেট কনটেক্সট
        const decodedUrl = multiPassDecodeUrl(lowerUrl, 3);
        const isInvitePattern = lowerUrl.includes('/+') ||
            lowerUrl.includes('/%2b') ||
            decodedUrl.includes('/+') ||
            lowerUrl.includes('/joinchat/') ||
            decodedUrl.includes('/joinchat/') ||
            lowerUrl.startsWith('tg://join') ||
            decodedUrl.startsWith('tg://join');

        if (isInvitePattern) {
            const clickbaitKeywords = [
                'ভিডিও লিংক', 'কমেন্টে লিংক', 'গোপন', 'ভাইরাল', 'ফাঁস', 'লিংক কমেন্টে',
                'free bonus', 'win money', 'free money', 'হ্যাক', 'সিগন্যাল', 'ভিআইপি গ্রুপ',
                'full video', 'watch video', 'link in comment', 'join fast'
            ];
            if (clickbaitKeywords.some(kw => textToCheck.includes(kw))) {
                return true;
            }
        }

        return false;
    }

    /**
     * মূল মূল্যায়ন ইঞ্জিন (Core Evaluation Engine)
     * টার্গেট এলিমেন্ট বা ইউআরএল স্ট্রিং ও কনটেক্সট যাচাই করে
     */
    function analyzeLinkRisk(target, extraContext = '') {
        let rawHref = '';
        let anchorText = '';
        let parentText = '';

        if (typeof target === 'string') {
            rawHref = target;
            parentText = extraContext || '';
        } else if (target && typeof target === 'object') {
            rawHref = target.href || target.url || '';
            anchorText = target.innerText || target.textContent || '';
            if (typeof target.closest === 'function') {
                const parentElem = target.closest(
                    'ytd-comment-renderer, #comment, #description-inline-expander, ytd-promoted-sparkles-web-renderer, ytd-action-companion-ad-renderer, ytd-video-secondary-info-renderer, ' +
                    'div[role="article"], div[data-ad-preview="message"], .comment, div[dir="auto"], article, [data-pagelet*="FeedUnit"], ' +
                    'ul._a9z6 li, div[role="dialog"], article[role="presentation"], ' +
                    '[data-e2e="comment-level-1"], [data-e2e="browse-video-desc"], .tiktok-ad-card, div[class*="DivCommentItemContainer"], ' +
                    'p, li, section'
                );
                parentText = parentElem ? (parentElem.innerText || parentElem.textContent || '') : '';
            }
            if (extraContext) {
                parentText = `${parentText} ${extraContext}`;
            }
        }

        const rawLower = (rawHref || '').toLowerCase().trim();
        const unwrapped = unwrapUrl(rawHref);
        const unwrappedLower = (unwrapped || '').toLowerCase().trim();

        const rawHost = extractHostname(rawLower);
        const unwrappedHost = extractHostname(unwrappedLower);

        const combinedText = `${anchorText} ${rawLower} ${unwrappedLower} ${parentText}`.toLowerCase();

        const isRawShortener = SHORTENER_DOMAINS.some(d => hostMatches(rawHost, d));
        const isUnwrappedShortener = SHORTENER_DOMAINS.some(d => hostMatches(unwrappedHost, d));
        const isShortener = isRawShortener || isUnwrappedShortener;

        const isRawTelegram = TELEGRAM_DOMAINS.some(d => hostMatches(rawHost, d));
        const isUnwrappedTelegram = TELEGRAM_DOMAINS.some(d => hostMatches(unwrappedHost, d));
        const isTelegram = isRawTelegram || isUnwrappedTelegram;

        const isGambling = isBettingBrandMatch(unwrappedHost) || isBettingBrandMatch(rawHost);
        const hasGamblingKeywords = GAMBLING_KEYWORDS.some(kw => combinedText.includes(kw));

        const isAdultDomain = ADULT_DOMAINS.some(d => hostMatches(unwrappedHost, d) || hostMatches(rawHost, d));
        const hasAdultKeywords = ADULT_KEYWORDS.some(kw => combinedText.includes(kw));

        // ক্যাটাগরি ১: অনলাইন জুয়া ও ক্যাসিনো ফাঁদ (Direct, Mirror, বা Unwrapped)
        if (isGambling || (hasGamblingKeywords && (isShortener || isTelegram))) {
            return {
                blocked: true,
                isHarmful: true,
                category: 'অনলাইন জুয়া ও ক্যাসিনো ফাঁদ',
                reason: 'অনলাইন জুয়া ও ক্যাসিনো ফাঁদ',
                icon: '🎰',
                badgeColor: '#F59E0B',
                targetUrl: unwrapped || rawHref,
                rawUrl: rawHref,
                unwrappedUrl: unwrapped,
                description: 'এই লিঙ্কটি আপনাকে অবৈধ অনলাইন জুয়া, বাজি বা ক্যাসিনো সাইটের দিকে নিয়ে যাচ্ছিল। এতে মারাত্মক আর্থিক ক্ষতি ও আসক্তির ঝুঁকি রয়েছে।'
            };
        }

        // ক্যাটাগরি ২: পর্নোগ্রাফি ও আপত্তিকর চটি সাইট
        if (isAdultDomain || (hasAdultKeywords && (isShortener || isTelegram || unwrappedLower.includes('video') || unwrappedLower.includes('watch') || unwrappedLower.includes('choti')))) {
            return {
                blocked: true,
                isHarmful: true,
                category: 'পর্নোগ্রাফি ও প্রাপ্তবয়স্ক কনটেন্ট',
                reason: 'পর্নোগ্রাফি ও প্রাপ্তবয়স্ক কনটেন্ট',
                icon: '🔞',
                badgeColor: '#EF4444',
                targetUrl: unwrapped || rawHref,
                rawUrl: rawHref,
                unwrappedUrl: unwrapped,
                description: 'এই লিঙ্কটি একটি নিষিদ্ধ প্রাপ্তবয়স্ক বা পর্নোগ্রাফিক ওয়েবসাইটে নিয়ে যাচ্ছিল। আত্মরক্ষা ও সামাজিক সম্মানের স্বার্থে এটি প্রতিহত করা হলো।'
            };
        }

        // ক্যাটাগরি ৩: সোশ্যাল মিডিয়ার টেলিগ্রাম হানি-ট্র্যাপ ও নোংরা চ্যানেল ফাঁদ
        if (isTelegramTrapLink(unwrappedLower, combinedText) || isTelegramTrapLink(rawLower, combinedText)) {
            return {
                blocked: true,
                isHarmful: true,
                category: 'টেলিগ্রাম হানি-ট্র্যাপ ও নোংরা চ্যানেল ফাঁদ',
                reason: 'টেলিগ্রাম হানি-ট্র্যাপ ও নোংরা চ্যানেল ফাঁদ',
                icon: '🚨',
                badgeColor: '#DC2626',
                targetUrl: unwrapped || rawHref,
                rawUrl: rawHref,
                unwrappedUrl: unwrapped,
                description: 'সম্মানিত ব্যক্তিত্ব বা ভাইরাল খবরের আড়ালে কমেন্টে টেলিগ্রামের চটি চ্যানেলে নিয়ে যাওয়ার সুপরিকল্পিত ফাঁদ শনাক্ত হয়েছে।'
            };
        }

        // ক্যাটাগরি ৪: শর্টনার দিয়ে লুকানো ক্ষতিকর লিঙ্ক
        if (isShortener && (hasAdultKeywords || hasGamblingKeywords)) {
            return {
                blocked: true,
                isHarmful: true,
                category: 'লুকানো প্রতারণামূলক রিডাইরেক্ট লিঙ্ক',
                reason: 'লুকানো প্রতারণামূলক রিডাইরেক্ট লিঙ্ক',
                icon: '⚠️',
                badgeColor: '#E11D48',
                targetUrl: unwrapped || rawHref,
                rawUrl: rawHref,
                unwrappedUrl: unwrapped,
                description: 'লিঙ্ক শর্টনারের আড়ালে ক্ষতিকর জুয়া বা প্রাপ্তবয়স্ক গন্তব্য লুকানো রয়েছে। শুদ্ধ গার্ড আপনার নেভিগেশন স্থগিত করেছে।'
            };
        }

        return {
            blocked: false,
            isHarmful: false,
            category: 'নিরাপদ',
            reason: 'নিরাপদ',
            targetUrl: unwrapped || rawHref,
            rawUrl: rawHref,
            unwrappedUrl: unwrapped
        };
    }

    /**
     * টেস্ট ফ্রেমওয়ার্ক ও টুলসের সাথে সহজ ইন্টিগ্রেশনের জন্য কম্প্যাটিবিলিটি হেল্পার
     */
    function analyzeLink(href, contextText = '') {
        return analyzeLinkRisk(href, contextText);
    }

    /**
     * বাম ক্লিক ও মিডল-ক্লিক (auxclick) হ্যান্ডলার
     */
    function handleLinkInteraction(e) {
        if (e.button !== 0 && e.button !== 1) return;

        const anchor = e.target.closest('a');
        if (!anchor) return;

        const analysis = analyzeLinkRisk(anchor);
        if (analysis.isHarmful) {
            e.preventDefault();
            e.stopPropagation();
            showHarmfulLinkAlert(analysis.targetUrl || anchor.href, analysis);
        }
    }

    /**
     * XSS-মুক্ত ইন-পেজ ওয়ার্নিং মডাল
     */
    function showHarmfulLinkAlert(targetUrl, risk) {
        if (typeof document === 'undefined') return;

        const oldModal = document.getElementById('shuddho-trap-modal');
        if (oldModal) oldModal.remove();

        // ব্যাকগ্রাউন্ড সার্ভিস ওয়ার্কারে নোটিফিকেশন প্রেরণের নির্দেশ
        if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
            try {
                chrome.runtime.sendMessage({
                    action: 'trap_blocked',
                    url: targetUrl,
                    reason: risk.category || risk.reason
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
            <div style="background: #1E293B; border: 2px solid ${risk.badgeColor || '#EF4444'}; border-radius: 18px; padding: 32px; max-width: 500px; width: 90%; text-align: center; color: white; box-shadow: 0 25px 60px -15px rgba(0, 0, 0, 0.9);">
                <div style="font-size: 56px; margin-bottom: 8px;">${risk.icon || '🚨'}</div>
                <div style="display: inline-block; background: ${risk.badgeColor || '#EF4444'}22; border: 1px solid ${risk.badgeColor || '#EF4444'}; color: ${risk.badgeColor || '#EF4444'}; font-size: 13px; font-weight: bold; padding: 4px 14px; border-radius: 20px; margin-bottom: 12px;">
                    ${risk.category || 'ক্ষতিকর ফাঁদ'}
                </div>
                <h2 style="color: #F8FAFC; font-size: 21px; margin-bottom: 12px; font-weight: bold;">ক্ষতিকারক লিঙ্ক প্রতিহত করা হয়েছে!</h2>
                <p style="font-size: 14px; color: #CBD5E1; line-height: 1.6; margin-bottom: 16px;">
                    ${risk.description || 'শুদ্ধ গার্ড নিরাপত্তা ঝুঁকি শনাক্ত করে এই লিঙ্কটি ব্লক করেছে।'}
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

        const urlSpan = document.getElementById('shuddho-blocked-url');
        if (urlSpan) {
            urlSpan.textContent = targetUrl || '';
        }

        const btn = document.getElementById('shuddho-stay-safe-btn');
        if (btn) {
            btn.addEventListener('click', function() {
                modal.remove();
            });
        }
    }

    // ব্রাউজার ডকুমেন্টে ইভেন্ট লিসেনার রেজিস্ট্রেশন
    if (typeof document !== 'undefined' && document.addEventListener) {
        document.addEventListener('click', handleLinkInteraction, true);
        document.addEventListener('auxclick', handleLinkInteraction, true);
    }

    return {
        unwrapUrl,
        extractHostname,
        hostMatches,
        isBettingBrandMatch,
        isTelegramTrapLink,
        analyzeLinkRisk,
        analyzeLink,
        showHarmfulLinkAlert,
        GAMBLING_DOMAINS,
        GAMBLING_BRANDS,
        ADULT_DOMAINS,
        TELEGRAM_DOMAINS,
        SHORTENER_DOMAINS
    };
});
