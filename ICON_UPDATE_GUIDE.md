# Pyra IDE 图标更新指南

## ✅ 已完成的更新

### 1. 图标文件生成
- ✅ Windows: `icon.ico` (64.5 KB, 包含多尺寸)
- ✅ macOS: `icon.icns` (包含所有Apple要求的尺寸)
- ✅ Linux: `icon.png` 及各种PNG尺寸
- ✅ NSIS安装界面: `nsis-header.bmp`, `nsis-sidebar.bmp`

### 2. 版本升级
- ✅ 应用版本从 `0.1.0` 升级到 `0.1.1`
- 这有助于Windows识别为新应用，避免图标缓存问题

### 3. 文件哈希验证
```
icon.ico SHA256: 688B47F08BF129B1DC2C2248E00A8FC6AB3A3746C0EABE756CD9EDB774DF4603
文件大小: 64.5 KB
主尺寸: 256x256 RGBA
```

## 📋 用户安装步骤

### 方案A：标准安装（推荐）

1. **卸载旧版本**
   ```bash
   # 通过Windows设置卸载
   # 设置 > 应用 > 已安装的应用 > Pyra > 卸载
   ```

2. **清理图标缓存**（可选，如果仍显示旧图标）
   ```powershell
   # 以管理员权限运行PowerShell
   .\force_icon_refresh.ps1
   ```

3. **重新构建应用**
   ```bash
   npm run tauri build
   ```

4. **安装新版本**
   ```
   运行: src-tauri\target\release\bundle\nsis\Pyra_0.1.1_x64-setup.exe
   ```

5. **重启计算机**（如果图标仍未更新）

### 方案B：彻底清理（如果方案A无效）

1. **卸载应用**

2. **手动删除残留文件**
   ```
   删除以下目录:
   %LOCALAPPDATA%\Pyra
   %APPDATA%\com.pyra.ide
   ```

3. **运行图标缓存清理脚本**
   ```powershell
   .\force_icon_refresh.ps1
   ```

4. **重启计算机**

5. **重新安装**

## 🔧 图标缓存清理工具

### 使用 `force_icon_refresh.ps1`

此脚本会：
- ✅ 停止Windows资源管理器
- ✅ 删除所有图标缓存数据库文件
- ✅ 清理开始菜单和任务栏缓存
- ✅ 重建图标缓存
- ✅ 刷新文件关联
- ✅ 重启资源管理器

**运行方法：**
```powershell
# 右键点击 force_icon_refresh.ps1
# 选择 "以管理员身份运行PowerShell"
.\force_icon_refresh.ps1
```

## 📝 注意事项

### Windows图标缓存特性
- Windows会根据应用的**路径**、**版本**、**文件哈希**缓存图标
- 即使更新了图标文件，旧缓存仍可能显示
- 卸载后重新安装不一定清除缓存
- 重启计算机是最可靠的缓存清理方法

### 如果仍显示旧图标
1. 确认已完全卸载旧版本
2. 运行图标缓存清理脚本
3. 重启计算机
4. 安装新版本 (0.1.1)
5. 如果任务栏有快捷方式，取消固定后重新固定

### 开发环境注意
如果您在开发环境中运行 `npm run tauri dev`，图标更新可能不会立即生效。这是正常的，因为：
- 开发模式使用不同的应用路径
- 需要重新构建才能看到图标更新
- 建议测试图标时使用 `npm run tauri build` 构建正式版本

## 🎨 NSIS安装界面美化

安装/卸载程序现在包含：
- 🎨 顶部横幅 (150x57) - 包含Pyra图标
- 🎨 左侧边栏 (164x314) - 蓝色渐变背景
- 🎨 格式化的安装/卸载进度信息
- 🎨 友好的完成提示

## 🔄 未来更新图标

如果将来需要更新图标，请遵循以下步骤：

1. **准备新图标**
   - 图片必须是**正方形** (推荐1024x1024或512x512)
   - PNG格式，带透明背景 (RGBA)
   - 命名为 `icon.png`

2. **替换源图标**
   ```bash
   # 替换文件
   cp new-icon.png src-tauri/icons/icon.png
   ```

3. **重新生成所有平台图标**
   ```bash
   npm run tauri icon "src-tauri/icons/icon.png"
   ```

4. **升级版本号**
   ```json
   // src-tauri/tauri.conf.json
   "version": "0.1.2"  // 递增版本号
   ```

5. **构建并测试**
   ```bash
   npm run tauri build
   ```

## 📞 问题反馈

如果遇到图标显示问题，请提供以下信息：
- Windows版本
- 是否运行了图标缓存清理脚本
- 是否重启了计算机
- Pyra版本号 (帮助 > 关于)
- 截图显示问题

GitHub Issues: [项目仓库地址]
