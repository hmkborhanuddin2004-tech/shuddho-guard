/**
 * শুদ্ধ গার্ড — উইন্ডোজ পিসি ব্যাকগ্রাউন্ড শিল্ড (Shuddho PC Guard)
 * এটি কম্পিউটারে স্বয়ংক্রিয়ভাবে SafeSearch বাধ্যতামূলক করে এবং পর্ন সাইট ব্লক রাখে।
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const HOSTS_FILE = 'C:\\Windows\\System32\\drivers\\etc\\hosts';

const BLOCKED_DOMAINS = [
    // পর্নোগ্রাফিক ডোমেইন ব্লক তালিকা
    "pornhub.com", "www.pornhub.com",
    "xvideos.com", "www.xvideos.com",
    "xnxx.com", "www.xnxx.com",
    "xhamster.com", "www.xhamster.com",
    "chotikahini.com", "banglachoti.com",
    "deshiboudi.com", "bdchoti.net"
];

const SAFESEARCH_REDIRECTS = [
    // গুগল ও বিং সেফ সার্চ ফোর্সিং
    "216.239.38.120 www.google.com",
    "216.239.38.120 google.com",
    "216.239.38.120 www.google.com.bd",
    "204.79.197.220 www.bing.com",
    "204.79.197.220 bing.com"
];

function enforceHostsSecurity() {
    console.log('[Shuddho PC Guard] হোস্ট ফাইল সুরক্ষা পরীক্ষা করা হচ্ছে...');
    try {
        // রিড-অনলি মোড সরানো সাময়িক সময়ের জন্য
        try { execSync(`attrib -r -s -h "${HOSTS_FILE}"`); } catch (e) {}

        let content = fs.readFileSync(HOSTS_FILE, 'utf8');

        // ব্লকড ডোমেইনস এবং সেফ সার্চ অন্তর্ভুক্ত করা
        let modified = false;
        
        SAFESEARCH_REDIRECTS.forEach(entry => {
            if (!content.includes(entry)) {
                content += `\n${entry}`;
                modified = true;
            }
        });

        BLOCKED_DOMAINS.forEach(domain => {
            const entry = `0.0.0.0 ${domain}`;
            if (!content.includes(entry)) {
                content += `\n${entry}`;
                modified = true;
            }
        });

        if (modified) {
            fs.writeFileSync(HOSTS_FILE, content, 'utf8');
            console.log('✅ [সফল] SafeSearch ও পর্ন সাইট ব্লকিং হোস্ট ফাইলে যুক্ত হয়েছে।');
            // ডিএনএস ক্যাশ ফ্লাশ
            execSync('ipconfig /flushdns');
        } else {
            console.log('🛡️ [সুরক্ষিত] হোস্ট ফাইল ইতিমধ্যে সম্পূর্ণ সুরক্ষিত।');
        }

        // হোস্ট ফাইলকে রিড-অনলি ও লক করে দেওয়া যাতে কোনো অ্যাপ বদলাতে না পারে
        execSync(`attrib +r +s "${HOSTS_FILE}"`);

    } catch (err) {
        console.warn('⚠️ হোস্ট ফাইল পরিবর্তনে অ্যাডমিন পারমিশন প্রয়োজন হতে পারে: ', err.message);
    }
}

// প্রতি ৫ মিনিট পর পর ব্যাকগ্রাউন্ডে অডিট
enforceHostsSecurity();
setInterval(enforceHostsSecurity, 5 * 60 * 1000);

console.log('🚀 শুদ্ধ গার্ড উইন্ডোজ প্রোটেকশন চালু হয়েছে এবং ব্যাকগ্রাউন্ডে চলছে...');
