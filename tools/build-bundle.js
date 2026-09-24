const fs = require('fs');

const files = [
  { section: '১. গুগল ক্রোম এক্সটেনশন', path: 'web-extension/manifest.json', lang: 'json' },
  { section: '১. গুগল ক্রোম এক্সটেনশন', path: 'web-extension/scripts/background.js', lang: 'javascript' },
  { section: '১. গুগল ক্রোম এক্সটেনশন', path: 'web-extension/scripts/trap-link-interceptor.js', lang: 'javascript' },
  { section: '১. গুগল ক্রোম এক্সটেনশন', path: 'web-extension/scripts/ai-vision-blur.js', lang: 'javascript' },
  { section: '১. গুগল ক্রোম এক্সটেনশন', path: 'web-extension/popup/popup.html', lang: 'html' },
  { section: '১. গুগল ক্রোম এক্সটেনশন', path: 'web-extension/popup/popup.js', lang: 'javascript' },

  { section: '২. উইন্ডোজ পিসি নেটিভ গার্ড', path: 'windows-client/install-native-shuddho-pc.bat', lang: 'batch' },
  { section: '২. উইন্ডোজ পিসি নেটিভ গার্ড', path: 'windows-client/uninstall-native-shuddho-pc.bat', lang: 'batch' },
  { section: '২. উইন্ডোজ পিসি নেটিভ গার্ড', path: 'windows-client/shuddho-pc-engine.ps1', lang: 'powershell' },

  { section: '৩. পিওর টেলিগ্রাম (PureGram) কোর প্যাচ ও আর্কিটেকচার', path: 'tools/patch-puregram-core.js', lang: 'javascript' },
  { section: '৩. পিওর টেলিগ্রাম (PureGram) কোর প্যাচ ও আর্কিটেকচার', path: 'PUREGRAM_ARCHITECTURE.md', lang: 'markdown' },

  { section: '৪. অ্যান্ড্রয়েড মোবাইল অ্যাপ', path: 'android/app/src/main/AndroidManifest.xml', lang: 'xml' },
  { section: '৪. অ্যান্ড্রয়েড মোবাইল অ্যাপ', path: 'android/app/src/main/java/com/shuddho/guard/services/ShuddhoVpnService.kt', lang: 'kotlin' },
  { section: '৪. অ্যান্ড্রয়েড মোবাইল অ্যাপ', path: 'android/app/src/main/java/com/shuddho/guard/receivers/ShuddhoDeviceAdminReceiver.kt', lang: 'kotlin' },
  { section: '৪. অ্যান্ড্রয়েড মোবাইল অ্যাপ', path: 'android/app/src/main/java/com/shuddho/guard/ui/StealthCalculatorActivity.kt', lang: 'kotlin' },
  { section: '৪. অ্যান্ড্রয়েড মোবাইল অ্যাপ', path: 'android/app/src/main/java/com/shuddho/guard/ui/MasterOnboardingActivity.kt', lang: 'kotlin' },
  { section: '৪. অ্যান্ড্রয়েড মোবাইল অ্যাপ', path: 'android/app/src/main/java/com/shuddho/guard/services/TelegramScreenGuardService.kt', lang: 'kotlin' },

  { section: '৫. ক্লাউড ব্যাকএন্ড সার্ভার', path: 'backend/package.json', lang: 'json' },
  { section: '৫. ক্লাউড ব্যাকএন্ড সার্ভার', path: 'backend/server.js', lang: 'javascript' },
  { section: '৫. ক্লাউড ব্যাকএন্ড সার্ভার', path: 'render.yaml', lang: 'yaml' },

  { section: '৬. টেস্ট স্যুট', path: 'tools/test-trap-detector.js', lang: 'javascript' },
  { section: '৬. টেস্ট স্যুট', path: 'tools/test-banglish-filter.js', lang: 'javascript' },
  { section: '৬. টেস্ট স্যুট', path: 'backend/test-backend.js', lang: 'javascript' }
];

let out = '# 🛡️ শুদ্ধ গার্ড (Shuddho Guard) ও পিওর টেলিগ্রাম — সর্বজনীন সম্পূর্ণ সোর্স কোড বান্ডেল (Master Release)\n';
out += '> **প্রকল্পের সমস্ত কোড এক ফাইলে (১-ক্লিক কপি বান্ডেল — সমস্ত অডিট ফিক্স সহ সম্পূর্ণ প্রোডাকশন রেডি)**  \n';
out += '> **উদ্যোক্তা:** এইচএমকে বোরহান উদ্দিন (HMk Borhan Uddin) | **কারিগরি সহায়তা:** লুবাবা (Lubaba)  \n';
out += '> এই ফাইলের সমস্ত টেক্সট `Ctrl + A` চেপে `Ctrl + C` দিয়ে এক ক্লিকে সম্পূর্ণ কপি করে নেওয়া যাবে।\n\n---\n\n';

out += '## 📑 সূচিপত্র\n';
const sections = [...new Set(files.map(f => f.section))];
sections.forEach((sec, idx) => {
  out += `${idx + 1}. [${sec}](#${encodeURIComponent(sec)})\n`;
});
out += '\n---\n\n';

let currSec = '';
for (const f of files) {
  if (f.section !== currSec) {
    currSec = f.section;
    out += `# ${currSec}\n\n`;
  }
  if (fs.existsSync(f.path)) {
    const content = fs.readFileSync(f.path, 'utf8');
    out += `### ফাইল: \`${f.path}\`\n\`\`\`${f.lang}\n${content}\n\`\`\`\n\n`;
  }
}

fs.writeFileSync('ALL_CODE_BUNDLE.md', out, 'utf8');
console.log('ALL_CODE_BUNDLE.md generated successfully, size:', fs.statSync('ALL_CODE_BUNDLE.md').size);
