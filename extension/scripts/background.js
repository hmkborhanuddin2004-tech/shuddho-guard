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
