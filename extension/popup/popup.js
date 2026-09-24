// শুদ্ধ গার্ড পপআপ কন্ট্রোলার (Popup Controller)
document.addEventListener('DOMContentLoaded', () => {
    const statusText = document.querySelector('.status-badge');
    const trapsEl = document.getElementById('stat-traps');
    const blurredEl = document.getElementById('stat-blurred');

    // স্টোরেজ থেকে পরিসংখ্যান লোড
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        chrome.storage.local.get(['blurredCount', 'trapsBlocked'], (data) => {
            console.log('পরিসংখ্যান লোড হয়েছে:', data);
            if (trapsEl && typeof data.trapsBlocked !== 'undefined') {
                trapsEl.textContent = data.trapsBlocked;
            }
            if (blurredEl && typeof data.blurredCount !== 'undefined') {
                blurredEl.textContent = data.blurredCount;
            }
        });

        // লাইভ পরিবর্তনের জন্য লিসেনার
        chrome.storage.onChanged.addListener((changes, areaName) => {
            if (areaName === 'local') {
                if (changes.trapsBlocked && trapsEl) {
                    trapsEl.textContent = changes.trapsBlocked.newValue || 0;
                }
                if (changes.blurredCount && blurredEl) {
                    blurredEl.textContent = changes.blurredCount.newValue || 0;
                }
            }
        });
    }
});
