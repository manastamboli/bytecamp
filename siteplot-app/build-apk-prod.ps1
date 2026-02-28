# build-apk-prod.ps1
# Builds a standalone APK that loads from your deployed Vercel URL
# Phone works INDEPENDENTLY - no PC server needed!

param(
    [Parameter(Mandatory=$false)]
    [string]$VercelUrl = ""
)

Write-Host "==================================" -ForegroundColor Cyan
Write-Host "  SitePilot - Build Production APK" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

if ($VercelUrl -eq "") {
    Write-Host "Enter your Vercel/deployed URL (e.g. https://sitepilot.vercel.app):" -ForegroundColor Yellow
    $VercelUrl = Read-Host
}

if ($VercelUrl -eq "") {
    Write-Host "ERROR: No URL provided. Exiting." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Using URL: $VercelUrl" -ForegroundColor Cyan
Write-Host ""

# Step 1: Update prod config with actual URL
Write-Host "[1/4] Setting production URL..." -ForegroundColor Yellow
$config = Get-Content "capacitor.config.prod.json" -Raw
$config = $config -replace "https://YOUR_VERCEL_URL.vercel.app", $VercelUrl
$config | Set-Content "capacitor.config.json"

# Step 2: Sync capacitor
Write-Host "[2/4] Syncing Capacitor..." -ForegroundColor Yellow
npx cap sync android

# Step 3: Build APK
Write-Host "[3/4] Building Release APK..." -ForegroundColor Yellow
Set-Location android
.\gradlew assembleRelease
Set-Location ..

# Step 4: Done
$apkPath = "android\app\build\outputs\apk\release\app-release-unsigned.apk"
if (Test-Path $apkPath) {
    Write-Host ""
    Write-Host "==================================" -ForegroundColor Green
    Write-Host "  APK Built Successfully!" -ForegroundColor Green
    Write-Host "==================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "APK Location:" -ForegroundColor White
    Write-Host "  $((Get-Item $apkPath).FullName)" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "To install on connected phone:" -ForegroundColor White
    Write-Host "  adb install $apkPath" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "This APK is STANDALONE - no PC server needed!" -ForegroundColor Green
} else {
    Write-Host "Build FAILED. Check errors above." -ForegroundColor Red
}
