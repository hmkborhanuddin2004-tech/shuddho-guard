// শুদ্ধ গার্ড — ব্যাকগ্রাউন্ড সার্ভিস ওয়ার্কার (Manifest V3)

chrome.runtime.onInstalled.addListener((details) => {
    console.log('[Shuddho Guard] এক্সটেনশন ইভেন্ট:', details.reason);
    if (details.reason === 'install') {
        chrome.storage.local.set({
            trapsBlocked: 0,
            mediaBlurred: 0,
            blurredCount: 0,
            protectionActive: true
        });
    } else if (details.reason === 'update') {
        // আপডেটের ক্ষেত্রে পূর্বের পরিসংখ্যান অক্ষুণ্ণ রাখা হয়
        chrome.storage.local.get(['trapsBlocked', 'mediaBlurred', 'blurredCount', 'protectionActive'], (data) => {
            const mediaVal = data.mediaBlurred !== undefined ? data.mediaBlurred : (data.blurredCount !== undefined ? data.blurredCount : 0);
            chrome.storage.local.set({
                trapsBlocked: data.trapsBlocked !== undefined ? data.trapsBlocked : 0,
                mediaBlurred: mediaVal,
                blurredCount: mediaVal,
                protectionActive: data.protectionActive !== undefined ? data.protectionActive : true
            });
        });
    }
});

// মেসেজ লিসেনার (অ্যাসিঙ্ক sendResponse ও পোর্ট লিক সুরক্ষা সহ)
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    // ক্ষতিকর ফাঁদ ও লিঙ্ক ব্লকিং হ্যান্ডলার (উভয় একশন নাম সাপোর্ট করে)
    if (request.action === 'trap_blocked' || request.action === 'trapBlocked' || request.action === 'harmful_link_blocked') {
        chrome.storage.local.get(['trapsBlocked'], (data) => {
            const count = (data.trapsBlocked || 0) + 1;
            chrome.storage.local.set({ trapsBlocked: count }, () => {
                chrome.action.setBadgeText({ text: count.toString() });
                chrome.action.setBadgeBackgroundColor({ color: '#EF4444' });

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

                sendResponse({ status: 'ok', trapsBlocked: count });
            });
        });
        return true; // MV3 অ্যাসিঙ্ক রেসপন্সের জন্য পোর্ট খোলা রাখা আবশ্যক
    }

    // মিডিয়া ব্লার কাউন্টার হ্যান্ডলার (media_blurred ও mediaBlurred উভয় সিঙ্কড)
    if (request.action === 'media_blurred' || request.action === 'mediaBlurred') {
        chrome.storage.local.get(['mediaBlurred', 'blurredCount'], (data) => {
            const count = Math.max(data.mediaBlurred || 0, data.blurredCount || 0) + 1;
            // উভয় কী সিঙ্ক্রোনাইজ করে রাখা যাতে পপআপ এবং এক্সটার্নাল স্ক্রিপ্ট নিরবচ্ছিন্ন কাজ করে
            chrome.storage.local.set({ mediaBlurred: count, blurredCount: count }, () => {
                sendResponse({ status: 'ok', mediaBlurred: count, blurredCount: count });
            });
        });
        return true;
    }

    // স্ট্যাটাস অনুসন্ধান হ্যান্ডলার
    if (request.action === 'getStatus') {
        chrome.storage.local.get(['trapsBlocked', 'mediaBlurred', 'blurredCount', 'protectionActive'], (data) => {
            const mediaVal = data.mediaBlurred !== undefined ? data.mediaBlurred : (data.blurredCount !== undefined ? data.blurredCount : 0);
            sendResponse({
                trapsBlocked: data.trapsBlocked || 0,
                mediaBlurred: mediaVal,
                blurredCount: mediaVal,
                protectionActive: data.protectionActive !== false
            });
        });
        return true;
    }

    return false;
});
