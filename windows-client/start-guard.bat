@echo off
chcp 65001 > nul
title শুদ্ধ গার্ড — উইন্ডোজ পিসি প্রোটেকশন

:: অ্যাডমিনিস্ট্রেটর পারমিশন যাচাই
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo [অনুমতি প্রয়োজন] অ্যাডমিন পারমিশন চাওয়া হচ্ছে...
    powershell -Command "Start-Process '%~f0' -Verb RunAs"
    exit /b
)

echo =================================================================
echo       🛡️ শুদ্ধ গার্ড (Shuddho Guard) — উইন্ডোজ প্রোটেকশন
echo =================================================================
echo.
echo SafeSearch বাধ্যতামূলক করা হচ্ছে এবং পর্ন সাইট বন্ধ রাখা হচ্ছে...
echo.

node "%~dp0shuddho-pc-guard.js"

pause
