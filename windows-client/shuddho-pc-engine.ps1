# Shuddho PC Guard Native PowerShell Engine
param (
    [ValidateSet("Install", "Uninstall", "Monitor")]
    [string]$Mode = "Install"
)

$hostsPath = "$env:windir\System32\drivers\etc\hosts"
$backupPath = "$env:windir\System32\drivers\etc\hosts.shuddho.bak"

$safeSearchEntries = @(
    "216.239.38.120 forcesafesearch.google.com",
    "216.239.38.120 www.google.com",
    "216.239.38.120 google.com",
    "216.239.38.120 www.google.com.bd",
    "204.79.197.220 strict.bing.com",
    "204.79.197.220 www.bing.com",
    "204.79.197.220 bing.com",
    "216.239.38.119 restrict.youtube.com",
    "216.239.38.119 www.youtube.com",
    "safe.duckduckgo.com duckduckgo.com"
)

$blockedDomains = @(
    "pornhub.com", "www.pornhub.com", "rt.pornhub.com",
    "xvideos.com", "www.xvideos.com", "xvideos2.com",
    "xnxx.com", "www.xnxx.com",
    "xhamster.com", "www.xhamster.com", "xhamster.desi",
    "chaturbate.com", "bongacams.com", "stripchat.com",
    "onlyfans.com",
    "deshiboudi.com", "banglachoti.com", "chotikahini.com",
    "bdchoti.net", "chotigolpo.com", "banglasex.net",
    "redwap.me", "spankbang.com", "tube8.com", "youporn.com",
    "tnaflix.com", "beeg.com", "brazzers.com", "eporner.com"
)

function Install-ShuddhoProtection {
    Write-Host "[1/3] ব্যাকআপ তৈরি ও হোস্ট ফাইল আনলক করা হচ্ছে..." -ForegroundColor Cyan
    if (!(Test-Path $backupPath) -and (Test-Path $hostsPath)) {
        Copy-Item $hostsPath $backupPath -Force
    }

    try { Set-ItemProperty -Path $hostsPath -Name IsReadOnly -Value $false -ErrorAction SilentlyContinue } catch {}

    Write-Host "[2/3] সেফ সার্চ ও পর্ন ব্লকিং রুলস অন্তর্ভুক্ত করা হচ্ছে..." -ForegroundColor Cyan
    $currentHosts = Get-Content $hostsPath -Raw -ErrorAction SilentlyContinue
    if (-not $currentHosts) { $currentHosts = "" }

    $newEntries = New-Object System.Text.StringBuilder
    $newEntries.AppendLine($currentHosts.TrimEnd())
    $newEntries.AppendLine("`n# === SHUDDHO GUARD SAFE PROTECTION START ===")

    foreach ($entry in $safeSearchEntries) {
        if ($currentHosts -notmatch [regex]::Escape($entry)) {
            $newEntries.AppendLine($entry)
        }
    }

    foreach ($domain in $blockedDomains) {
        $blockLine = "0.0.0.0 $domain"
        if ($currentHosts -notmatch [regex]::Escape($blockLine)) {
            $newEntries.AppendLine($blockLine)
        }
    }
    $newEntries.AppendLine("# === SHUDDHO GUARD SAFE PROTECTION END ===")

    Set-Content -Path $hostsPath -Value $newEntries.ToString() -Encoding UTF8
    try { Set-ItemProperty -Path $hostsPath -Name IsReadOnly -Value $true -ErrorAction SilentlyContinue } catch {}

    Write-Host "[3/3] ফ্যামিলি ডিএনএস (CleanBrowsing & Cloudflare) সক্রিয় করা হচ্ছে..." -ForegroundColor Cyan
    try {
        $adapters = Get-NetAdapter | Where-Object { $_.Status -eq "Up" }
        foreach ($adapter in $adapters) {
            Set-DnsClientServerAddress -InterfaceIndex $adapter.InterfaceIndex -ServerAddresses ("185.228.168.10", "1.1.1.3") -ErrorAction SilentlyContinue
        }
    } catch {
        Write-Warning "DNS অ্যাডাপ্টার কনফিগারেশনে সতর্কতা: $_"
    }

    Clear-DnsClientCache -ErrorAction SilentlyContinue
    Write-Host "✅ সুরক্ষা সফলভাবে সক্রিয় হয়েছে।" -ForegroundColor Green
}

function Restore-ShuddhoProtection {
    Write-Host "হোস্ট ফাইল এবং ডিএনএস পূর্বের অবস্থায় ফিরিয়ে নেওয়া হচ্ছে..." -ForegroundColor Yellow
    try { Set-ItemProperty -Path $hostsPath -Name IsReadOnly -Value $false -ErrorAction SilentlyContinue } catch {}

    if (Test-Path $backupPath) {
        Copy-Item $backupPath $hostsPath -Force
    }

    try {
        $adapters = Get-NetAdapter | Where-Object { $_.Status -eq "Up" }
        foreach ($adapter in $adapters) {
            Set-DnsClientServerAddress -InterfaceIndex $adapter.InterfaceIndex -ResetServerAddresses -ErrorAction SilentlyContinue
        }
    } catch {}

    Clear-DnsClientCache -ErrorAction SilentlyContinue
    Write-Host "✅ সিস্টেম স্বাভাবিক অবস্থায় ফিরে এসেছে।" -ForegroundColor Green
}

switch ($Mode) {
    "Install"   { Install-ShuddhoProtection }
    "Monitor"   { Install-ShuddhoProtection }
    "Uninstall" { Restore-ShuddhoProtection }
    default     { Write-Warning "অজানা মোড: $Mode" }
}
