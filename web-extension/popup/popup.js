// শুদ্ধ গার্ড পপআপ কন্ট্রোলার (Popup Controller)
document.addEventListener('DOMContentLoaded', () => {
    const statusText = document.querySelector('.status-badge');
    const trapsEl = document.getElementById('stat-traps');
    const blurredEl = document.getElementById('stat-blurred');

    // স্টোরেজ থেকে পরিসংখ্যান লোড (trapsBlocked, mediaBlurred, blurredCount সিঙ্ক্রোনাইজড)
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        chrome.storage.local.get(['blurredCount', 'mediaBlurred', 'trapsBlocked'], (data) => {
            console.log('পরিসংখ্যান লোড হয়েছে:', data);
            if (trapsEl && typeof data.trapsBlocked !== 'undefined') {
                trapsEl.textContent = data.trapsBlocked;
            }
            const blurredVal = data.blurredCount !== undefined ? data.blurredCount : (data.mediaBlurred !== undefined ? data.mediaBlurred : 0);
            if (blurredEl) {
                blurredEl.textContent = blurredVal;
            }
        });

        // লাইভ পরিবর্তনের জন্য লিসেনার
        chrome.storage.onChanged.addListener((changes, areaName) => {
            if (areaName === 'local') {
                if (changes.trapsBlocked && trapsEl) {
                    trapsEl.textContent = changes.trapsBlocked.newValue !== undefined ? changes.trapsBlocked.newValue : 0;
                }
                if (changes.blurredCount && blurredEl) {
                    blurredEl.textContent = changes.blurredCount.newValue !== undefined ? changes.blurredCount.newValue : 0;
                } else if (changes.mediaBlurred && blurredEl) {
                    blurredEl.textContent = changes.mediaBlurred.newValue !== undefined ? changes.mediaBlurred.newValue : 0;
                }
            }
        });
    }
});
