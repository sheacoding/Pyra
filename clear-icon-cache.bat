@echo off
echo Clearing Windows Icon Cache...
echo.
echo This will close Explorer and clear the icon cache.
echo Press Ctrl+C to cancel, or any other key to continue...
pause > nul

echo.
echo Stopping Explorer...
taskkill /f /im explorer.exe

echo.
echo Deleting icon cache...
cd /d "%userprofile%\AppData\Local\Microsoft\Windows\Explorer"
attrib -h IconCache.db
del IconCache.db
del iconcache_*.db 2>nul
del thumbcache_*.db 2>nul

echo.
echo Restarting Explorer...
start explorer.exe

echo.
echo Icon cache cleared successfully!
echo Please reinstall the application to see the new icon.
echo.
pause
