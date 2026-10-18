@echo off
setlocal
echo ======================================================================
echo           LITERA - GOOGLE PLAY PRODUCTION BUNDLE (.AAB) BUILDER
echo               Package: com.litera.app | Target: Google Play
echo ======================================================================
echo.

if not exist "android\app\release.keystore" (
    echo [ERROR] Production release.keystore not found in android\app\!
    echo Please ensure the release keystore exists before building for production.
    pause
    exit /b 1
)

echo [1/3] Navigating to android directory...
cd android

echo.
echo [2/3] Cleaning previous build caches...
call gradlew.bat clean

echo.
echo [3/3] Building Signed Production Android App Bundle (.aab)...
call gradlew.bat bundleRelease

echo.
echo ======================================================================
if %ERRORLEVEL% EQU 0 (
    echo [SUCCESS] Signed Google Play Bundle (.aab) created successfully!
    echo.
    echo Output File:
    echo android\app\build\outputs\bundle\release\app-release.aab
    echo.
    echo Keystore: android\app\release.keystore (litera-release-key)
    echo Package:  com.litera.app
    echo.
    echo You can now upload this .aab directly to Google Play Console:
    echo (Closed Testing -> Create new release -> Upload .aab)
) else (
    echo [FAILED] Error building .aab bundle. Please review the Gradle logs above.
)
echo ======================================================================
cd ..
endlocal
pause
