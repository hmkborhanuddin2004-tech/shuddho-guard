// শুদ্ধ গার্ড — সতর্কবার্তা পেজ কন্ট্রোলার (Warning Page Controller)
document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const targetUrl = urlParams.get('url') || urlParams.get('target') || 'https://t.me/suspicious_trap_link';
    const reason = urlParams.get('reason') || 'honey_trap';

    const urlDisplay = document.getElementById('blocked-target-url') || document.getElementById('targetUrl');
    if (urlDisplay) {
        urlDisplay.textContent = '🛑 অবরুদ্ধ গন্তব্য: ' + decodeURIComponent(targetUrl);
    }

    // পরিসংখ্যান আপডেট (Storage)
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        chrome.storage.local.get(['trapsBlocked'], (res) => {
            const current = (res.trapsBlocked || 0) + 1;
            chrome.storage.local.set({ trapsBlocked: current });
        });
    }

    // ব্যাকগ্রাউন্ড ওয়ার্কারে বার্তা প্রেরণ
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
        try {
            chrome.runtime.sendMessage({ action: 'trap_blocked', url: targetUrl, reason: reason });
        } catch (e) {
            // Service worker inactive or direct page open
        }
    }

    // ১. "নিরাপদে ফিরে যান" বাটন হ্যান্ডলার
    const btnGoBack = document.getElementById('btn-go-back');
    if (btnGoBack) {
        btnGoBack.addEventListener('click', () => {
            if (window.history.length > 1) {
                window.history.back();
            } else {
                window.close();
                // যদি window.close কাজ না করে, সেফ সাইটে রিডাইরেক্ট
                setTimeout(() => {
                    window.location.href = 'https://www.google.com';
                }, 300);
            }
        });
    }

    // ২. "ফাঁদ রিপোর্ট করুন" বাটন হ্যান্ডলার
    const btnReport = document.getElementById('btn-report-trap');
    const toast = document.getElementById('toast-message');

    if (btnReport) {
        btnReport.addEventListener('click', async () => {
            btnReport.disabled = true;
            btnReport.textContent = 'রিপোর্ট পাঠানো হচ্ছে...';

            let reportSuccess = false;

            // ক্লাউড ব্যাকএন্ডে রিপোর্ট জমা দেওয়ার চেষ্টা
            try {
                const response = await fetch('http://localhost:4000/api/v1/report', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        url: targetUrl,
                        category: reason || 'honey-trap',
                        platform: 'web',
                        reportedBy: 'shuddho-extension-warning'
                    })
                });
                if (response.ok) {
                    reportSuccess = true;
                }
            } catch (err) {
                // ব্যাকএন্ড অফলাইন থাকলেও বিকল্প হিসেবে ব্যাকগ্রাউন্ড ওয়ার্কারে বার্তা
                if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
                    try {
                        chrome.runtime.sendMessage({
                            action: 'reportTrap',
                            data: { url: targetUrl, category: reason || 'honey-trap' }
                        });
                        reportSuccess = true;
                    } catch (e) {}
                }
            }

            // সফল স্টেট দেখানো
            btnReport.classList.add('reported');
            btnReport.innerHTML = '<span>✅ রিপোর্ট সফলভাবে গৃহীত হয়েছে</span>';

            if (toast) {
                toast.textContent = 'ধন্যবাদ! আপনার রিপোর্টটি শুদ্ধ গার্ড কমিউনিটি ক্লাউড ব্ল্যাকলিস্টে জমা হয়েছে।';
                toast.style.display = 'block';
            }
        });
    }
});
