# Pyra IDE - 强制Windows图标缓存刷新脚本
# 需要管理员权限运行

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Pyra IDE 图标缓存强制刷新工具" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 检查管理员权限
$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "警告: 建议以管理员权限运行此脚本以获得最佳效果" -ForegroundColor Yellow
    Write-Host "某些操作可能需要管理员权限" -ForegroundColor Yellow
    Write-Host ""
}

Write-Host "[1/7] 停止 Windows 资源管理器..." -ForegroundColor Green
Stop-Process -Name explorer -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

Write-Host "[2/7] 清理图标缓存数据库文件..." -ForegroundColor Green
$iconCachePaths = @(
    "$env:LOCALAPPDATA\IconCache.db",
    "$env:LOCALAPPDATA\Microsoft\Windows\Explorer\iconcache_*.db",
    "$env:LOCALAPPDATA\Microsoft\Windows\Explorer\thumbcache_*.db"
)

foreach ($path in $iconCachePaths) {
    Get-ChildItem $path -ErrorAction SilentlyContinue | ForEach-Object {
        try {
            Remove-Item $_.FullName -Force -ErrorAction Stop
            Write-Host "  已删除: $($_.Name)" -ForegroundColor Gray
        } catch {
            Write-Host "  无法删除: $($_.Name) (可能正在使用)" -ForegroundColor Yellow
        }
    }
}

Write-Host "[3/7] 清理应用程序图标缓存..." -ForegroundColor Green
# 清理开始菜单缓存
$startMenuCache = "$env:LOCALAPPDATA\Microsoft\Windows\Caches"
if (Test-Path $startMenuCache) {
    Get-ChildItem $startMenuCache -Recurse -ErrorAction SilentlyContinue | Remove-Item -Force -Recurse -ErrorAction SilentlyContinue
    Write-Host "  已清理开始菜单缓存" -ForegroundColor Gray
}

Write-Host "[4/7] 清理任务栏图标缓存..." -ForegroundColor Green
$taskbarIconCache = "$env:APPDATA\Microsoft\Internet Explorer\Quick Launch\User Pinned\TaskBar"
if (Test-Path $taskbarIconCache) {
    # 备份快捷方式
    $pyraShortcuts = Get-ChildItem $taskbarIconCache -Filter "*Pyra*.lnk" -ErrorAction SilentlyContinue
    foreach ($shortcut in $pyraShortcuts) {
        Write-Host "  发现任务栏快捷方式: $($shortcut.Name)" -ForegroundColor Yellow
        Write-Host "  建议手动从任务栏取消固定后重新固定" -ForegroundColor Yellow
    }
}

Write-Host "[5/7] 重建图标缓存..." -ForegroundColor Green
# 触发系统重建图标缓存
ie4uinit.exe -show

Write-Host "[6/7] 刷新桌面和文件关联..." -ForegroundColor Green
# 刷新文件关联
Start-Process "rundll32.exe" -ArgumentList "user32.dll,UpdatePerUserSystemParameters" -Wait -NoNewWindow

Write-Host "[7/7] 重新启动 Windows 资源管理器..." -ForegroundColor Green
Start-Process explorer.exe
Start-Sleep -Seconds 2

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  图标缓存清理完成！" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "后续步骤:" -ForegroundColor Yellow
Write-Host "1. 如果Pyra已安装，请完全卸载" -ForegroundColor White
Write-Host "2. 重新启动计算机 (推荐)" -ForegroundColor White
Write-Host "3. 重新安装Pyra IDE" -ForegroundColor White
Write-Host "4. 如果仍有问题，请删除以下目录后重启:" -ForegroundColor White
Write-Host "   %LOCALAPPDATA%\Pyra" -ForegroundColor Gray
Write-Host "   %APPDATA%\com.pyra.ide" -ForegroundColor Gray
Write-Host ""
Write-Host "按任意键退出..." -ForegroundColor Cyan
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
