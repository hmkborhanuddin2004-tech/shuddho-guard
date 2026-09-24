// শুদ্ধ গার্ড — ফেসবুক হানি-ট্র্যাপ ও টেলিগ্রাম লিঙ্ক ইন্টারসেপ্টর
(function() {
    'use strict';

    console.log('[Shuddho Guard] ট্র্যাপ লিঙ্ক ইন্টারসেপ্টর ইঞ্জিন চালু হয়েছে...');

    const SUSPICIOUS_DOMAINS = ['t.me', 'telegram.me', 'telegram.dog', 'bit.ly', 'tinyurl.com', 'cutt.ly'];
    const SUSPICIOUS_KEYWORDS = [
        'choti', 'boudi', 'gopon', 'viral', 'leaked', 'leak', '18+', 'সহবাস',
        'বউ ছাড়া', 'গোপন ভিডিও', 'ভিডিও লিংক', 'কমেন্টে লিংক', 'সেক্স', 'চটি',
        'মজার ভিডিও', 'গরম খবর', 'জা-কির', 'জাকির নায়েক'
    ];

    function isTrapLink(anchor) {
        const href = anchor.href || '';
        const text = (anchor.innerText || '').toLowerCase();
        const parentText = (anchor.closest('div[role="article"], div[data-ad-preview="message"], .comment, div[dir="auto"]') 
                            ? anchor.closest('div[role="article"], div[data-ad-preview="message"], .comment, div[dir="auto"]').innerText 
                            : '').toLowerCase();

        // ১. ডোমেইন চেক (টেলিগ্রাম বা লিঙ্ক শর্টনার কি না)
        const isSuspiciousDomain = SUSPICIOUS_DOMAINS.some(domain => href.includes(domain));
        if (!isSuspiciousDomain) return false;

        // ২. কি-ওয়ার্ড ও কনটেক্সট চেক (জাকির নায়েক, সহবাস, চটি ইত্যাদি প্রতারণামূলক ফাঁদ)
        const combinedText = (text + ' ' + href + ' ' + parentText).toLowerCase();
        const hasSuspiciousContext = SUSPICIOUS_KEYWORDS.some(kw => combinedText.includes(kw));

        return hasSuspiciousContext;
    }

    // গ্লোবাল ক্লিক ইন্টারসেপ্টর
    document.addEventListener('click', function(e) {
        const anchor = e.target.closest('a');
        if (!anchor) return;

        if (isTrapLink(anchor)) {
            e.preventDefault();
            e.stopPropagation();
            showTrapWarningModal(anchor.href);
        }
    }, true);

    function showTrapWarningModal(targetUrl) {
        // পুরনো কোনো মোডাল থাকলে সরানো
        const oldModal = document.getElementById('shuddho-trap-modal');
        if (oldModal) oldModal.remove();

        const modal = document.createElement('div');
        modal.id = 'shuddho-trap-modal';
        modal.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
            background: rgba(15, 23, 42, 0.92); z-index: 99999999;
            display: flex; justify-content: center; align-items: center;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            backdrop-filter: blur(8px);
        `;

        // ব্যাকগ্রাউন্ড সার্ভিস ওয়ার্কারে ফাঁদ ব্লক হওয়ার নোটিফিকেশন পাঠানো
        if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
            try {
                chrome.runtime.sendMessage({ action: 'trapBlocked', url: targetUrl });
            } catch (e) {}
        }

        const warningPageUrl = (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.getURL) 
            ? chrome.runtime.getURL('pages/warning.html?url=' + encodeURIComponent(targetUrl))
            : '#';

        modal.innerHTML = `
            <div style="background: #1E293B; border: 2px solid #EF4444; border-radius: 16px; padding: 30px; max-width: 480px; text-align: center; color: white; box-shadow: 0 25px 50px -12px rgba(239, 68, 68, 0.5);">
                <div style="font-size: 54px; margin-bottom: 12px;">🚨</div>
                <h2 style="color: #F87171; font-size: 22px; margin-bottom: 10px; font-weight: bold;">বিপজ্জনক ফাঁদ শনাক্ত হয়েছে!</h2>
                <p style="font-size: 14px; color: #CBD5E1; line-height: 1.6; margin-bottom: 16px;">
                    আপনি যে লিঙ্কটিতে ক্লিক করেছেন, সেটি একটি প্রতারণামূলক পোস্টের অধীনে টেলিগ্রামের নোংরা বা ক্ষতিকর চ্যানেলের দিকে নিয়ে যাচ্ছিল।
                </p>
                <div style="background: #0F172A; padding: 10px; border-radius: 8px; font-size: 12px; color: #94A3B8; word-break: break-all; margin-bottom: 20px;">
                    🔗 গন্তব্য: ${targetUrl}
                </div>
                <div style="display: flex; gap: 12px; justify-content: center; flex-wrap: wrap;">
                    <button id="shuddho-close-btn" style="background: #10B981; color: white; border: none; padding: 12px 24px; border-radius: 8px; font-weight: bold; cursor: pointer; font-size: 14px;">
                        নিরাপদে ফিরে যান (রক্ষা করুন)
                    </button>
                    <a id="shuddho-details-btn" target="_blank" href="${warningPageUrl}" style="background: rgba(239, 68, 68, 0.2); color: #FCA5A5; border: 1px solid rgba(239, 68, 68, 0.4); padding: 12px 20px; border-radius: 8px; font-weight: bold; cursor: pointer; font-size: 14px; text-decoration: none; display: inline-flex; align-items: center;">
                        বিস্তারিত সতর্কতা ও রিপোর্ট
                    </a>
                </div>
                <div style="margin-top: 14px; font-size: 11px; color: #64748B;">
                    🛡️ শুদ্ধ গার্ড (Shuddho Guard) সার্বক্ষণিক আপনার পাহারায় নিয়োজিত।
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        document.getElementById('shuddho-close-btn').addEventListener('click', function() {
            modal.remove();
        });
    }

})();
