@echo off
chcp 65001 > nul
title শুদ্ধ গার্ড — উইন্ডোজ সার্বক্ষণিক সুরক্ষা ইনস্টলার

echo =================================================================
echo    🛡️ শুদ্ধ গার্ড: উইন্ডোজ সার্বক্ষণিক সুরক্ষা ইনস্টলার
echo =================================================================
echo.

:: অ্যাডমিন প্রিভিলেজ যাচাই
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo [সতর্কতা] অ্যাডমিনিস্ট্রেটর প্রিভিলেজ প্রয়োজন।
    echo অনুগ্রহ করে ফাইলটিতে রাইট-ক্লিক করে "Run as administrator" সিলেক্ট করুন।
    echo.
    pause
    exit /b 1
)

set SCRIPT_DIR=%~dp0
set TASK_NAME=ShuddhoGuardProtection

echo ১. উইন্ডোজ টাস্ক শিডিউলার (Task Scheduler)-এ সাইলেন্ট সার্ভিস নিবন্ধন করা হচ্ছে...
schtasks /create /f /tn "%TASK_NAME%" /tr "wscript.exe \"%SCRIPT_DIR%run-silent.vbs\"" /sc onlogon /rl HIGHEST >nul 2>&1

if %errorLevel% equ 0 (
    echo ✅ [সফল] টাস্ক শিডিউলার-এ সর্বোচ্চ প্রিভিলেজ (HIGHEST) সহ নিবন্ধিত হয়েছে।
) else (
    echo ⚠️ টাস্ক শিডিউলার বিকল্প: স্টার্টআপ ফোল্ডার ব্যবহার করা হচ্ছে...
    set STARTUP_DIR=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup
    set SHORTCUT_VBS=%STARTUP_DIR%\ShuddhoGuardStartup.vbs
    echo Set WshShell = CreateObject("WScript.Shell") > "%SHORTCUT_VBS%"
    echo WshShell.Run "wscript.exe """ ^& "%SCRIPT_DIR%run-silent.vbs" ^& """", 0, False >> "%SHORTCUT_VBS%"
    echo Set WshShell = Nothing >> "%SHORTCUT_VBS%"
    echo ✅ স্টার্টআপ ফোল্ডারে যুক্ত হয়েছে।
)

echo.
echo ২. তাৎক্ষণিক সাইলেন্ট ব্যাকগ্রাউন্ড গার্ড চালু করা হচ্ছে...
wscript.exe "%SCRIPT_DIR%run-silent.vbs"

echo.
echo =================================================================
echo 🎯 [সম্পন্ন!] শুদ্ধ গার্ড এখন কোনো কালো উইন্ডো ছাড়াই ব্যাকগ্রাউন্ডে
echo সার্বক্ষণিক চালু থাকবে এবং প্রতি রিস্টার্টে স্বয়ংক্রিয়ভাবে সক্রিয় হবে।
echo =================================================================
echo.
pause
