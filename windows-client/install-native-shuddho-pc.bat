@echo off
chcp 65001 > nul
title শুদ্ধ গার্ড — উইন্ডোজ স্থায়ী প্রোটেকশন ইনস্টলার

echo =================================================================
echo   🛡️ শুদ্ধ গার্ড (Shuddho Guard) — উইন্ডোজ স্বয়ংক্রিয় ইনস্টলার
echo =================================================================
echo.

:: ---- অ্যাডমিন চেক ও এলিভেশন ----
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo [অনুমতি প্রয়োজন] অ্যাডমিনিস্ট্রেটর হিসেবে চালু করা হচ্ছে...
    powershell -NoProfile -Command "Start-Process -FilePath '%~f0' -Verb RunAs"
    exit /b
)

set "SCRIPT_DIR=%~dp0"
set "ENGINE=%SCRIPT_DIR%shuddho-pc-engine.ps1"

if not exist "%ENGINE%" (
    echo [ত্রুটি] shuddho-pc-engine.ps1 পাওয়া যায়নি: "%ENGINE%"
    pause
    exit /b 1
)

echo ১. সিস্টেম ফাইল ও ডিএনএস সুরক্ষা স্ক্রিপ্ট চালানো হচ্ছে...
powershell -NoProfile -ExecutionPolicy Bypass -File "%ENGINE%" -Mode Install
if errorlevel 1 (
    echo [ত্রুটি] সুরক্ষা ইনস্টল ব্যর্থ হয়েছে।
    pause
    exit /b 1
)

echo.
echo ২. উইন্ডোজ টাস্ক শিডিউলারে স্থায়ী সার্ভিস নিবন্ধন করা হচ্ছে...
schtasks /create /f /tn "ShuddhoGuardProtection" ^
  /tr "powershell -NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -File \"%ENGINE%\" -Mode Monitor" ^
  /sc onlogon /rl HIGHEST
if errorlevel 1 (
    echo [সতর্কতা] টাস্ক শিডিউলার নিবন্ধন ব্যর্থ হয়েছে।
)

echo.
echo =================================================================
echo  🎯 [অভিনন্দন!] শুদ্ধ গার্ড উইন্ডোজ পিসি সুরক্ষা সফলভাবে সক্রিয় হয়েছে!
echo  - SafeSearch (Google/Bing/YouTube) লক করা হয়েছে।
echo  - পর্ন ও প্রাপ্তবয়স্ক ডোমেইন ব্লক করা হয়েছে।
echo  - CleanBrowsing Family DNS সক্রিয় করা হয়েছে।
echo  - রিস্টার্টের পরেও স্বয়ংক্রিয়ভাবে সক্রিয় থাকবে।
echo =================================================================
echo.
pause
