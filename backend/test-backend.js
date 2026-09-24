// ব্যাকএন্ড এপিআই ইউনিট টেস্ট (রুট ও v1 উভয় পাথ পরীক্ষা)
const http = require('http');

function testEndpoint(path, method = 'GET', postData = null) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 4000,
            path: path,
            method: method,
            headers: {
                'Content-Type': 'application/json'
            }
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve({ status: res.statusCode, body: JSON.parse(data) }));
        });

        req.on('error', err => reject(err));
        if (postData) req.write(JSON.stringify(postData));
        req.end();
    });
}

async function runTests() {
    console.log("=== শুদ্ধ গার্ড ব্যাকএন্ড টেস্ট শুরু হচ্ছে ===");
    try {
        // রুট পাথ টেস্ট
        const health = await testEndpoint('/health');
        console.log("1. /health টেস্ট:", health.status === 200 ? "PASS ✅" : "FAIL ❌");

        const blacklist = await testEndpoint('/blacklist');
        console.log("2. /blacklist টেস্ট:", blacklist.body.success ? "PASS ✅" : "FAIL ❌");

        const report = await testEndpoint('/report', 'POST', { url: "https://t.me/bad_trap_link", title: "ভুয়া লিংক" });
        console.log("3. /report টেস্ট:", report.body.success ? "PASS ✅" : "FAIL ❌");

        const sub = await testEndpoint('/subscription/verify', 'POST', { phoneNumber: "01711000000", trxId: "9J8K7L6M" });
        console.log("4. /subscription/verify টেস্ট:", sub.body.status === "ACTIVE" ? "PASS ✅" : "FAIL ❌");

        // v1 পাথ টেস্ট
        const healthV1 = await testEndpoint('/api/v1/health');
        console.log("5. /api/v1/health টেস্ট:", healthV1.status === 200 ? "PASS ✅" : "FAIL ❌");

        const blacklistV1 = await testEndpoint('/api/v1/blacklist');
        console.log("6. /api/v1/blacklist টেস্ট:", blacklistV1.body.success ? "PASS ✅" : "FAIL ❌");

        console.log("🎯 সব ব্যাকএন্ড টেস্ট সফলভাবে সম্পন্ন হয়েছে!");
        process.exit(0);
    } catch (e) {
        console.error("টেস্ট চলাকালে সমস্যা:", e.message);
        process.exit(1);
    }
}

// সার্ভার চালু করে টেস্ট রান করা
require('./server.js');
setTimeout(runTests, 1000);
