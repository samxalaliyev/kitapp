@echo off
echo ======================================================================
echo           LITERA - GOOGLE PLAY PRODUCTION BUNDLE (.AAB) BUILDER
echo ======================================================================
echo.
echo 1. Cleaning old build caches...
cd android
call gradlew.bat clean

echo.
echo 2. Building Release Android App Bundle (.aab)...
call gradlew.bat bundleRelease

echo.
echo ======================================================================
if %ERRORLEVEL% EQU 0 (
    echo SUCCESS: Google Play Bundle (.aab) created successfully!
    echo Location: android\app\build\outputs\bundle\release\app-release.aab
    echo.
    echo You can now upload this .aab file directly to Google Play Console!
) else (
    echo FAILED: Error building .aab bundle. Please check the logs above.
)
echo ======================================================================
cd ..
pause
