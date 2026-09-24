// শুদ্ধ গার্ড — ব্যাকগ্রাউন্ড সার্ভিস ওয়ার্কার (Manifest V3)

chrome.runtime.onInstalled.addListener(() => {
    console.log('[Shuddho Guard] এক্সটেনশন সফলভাবে ইনস্টল হয়েছে।');
    chrome.storage.local.set({
        trapsBlocked: 0,
        mediaBlurred: 0,
        protectionActive: true
    });
});

// মেসেজ লিসেনার (কনটেন্ট স্ক্রিপ্ট থেকে ব্লকিং ইভেন্ট গণনা)
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'trap_blocked') {
        chrome.storage.local.get(['trapsBlocked'], (data) => {
            const count = (data.trapsBlocked || 0) + 1;
            chrome.storage.local.set({ trapsBlocked: count });
            chrome.action.setBadgeText({ text: count.toString() });
            chrome.action.setBadgeBackgroundColor({ color: '#EF4444' });
        });
        sendResponse({ status: 'ok' });
    }
});
