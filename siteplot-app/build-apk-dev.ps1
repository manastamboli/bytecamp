# build-apk-dev.ps1
# Builds a debug APK that loads from your local PC (http://10.37.181.254:3000)
# Your PC must be running: npm run dev:phone
# Your phone must be on the same Wi-Fi as your PC

Write-Host "==================================" -ForegroundColor Cyan
Write-Host "  SitePilot - Build Dev APK" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Use dev config
Write-Host "[1/4] Using DEV config (PC local server)..." -ForegroundColor Yellow
Copy-Item "capacitor.config.dev.json" "capacitor.config.json" -Force

# Step 2: Sync capacitor
Write-Host "[2/4] Syncing Capacitor..." -ForegroundColor Yellow
npx cap sync android

# Step 3: Build APK
Write-Host "[3/4] Building Debug APK..." -ForegroundColor Yellow
Set-Location android
.\gradlew assembleDebug
Set-Location ..

# Step 4: Done
$apkPath = "android\app\build\outputs\apk\debug\app-debug.apk"
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
    Write-Host "REMINDER: Start your server first with:" -ForegroundColor Yellow
    Write-Host "  cd ..\sitepilot-frontend" -ForegroundColor Yellow
    Write-Host "  npm run dev:phone" -ForegroundColor Yellow
} else {
    Write-Host "Build FAILED. Check Android Studio SDK is installed." -ForegroundColor Red
}
