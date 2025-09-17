# Pyra IDE

一个基于 **Tauri (Rust 后端) + React (TypeScript 前端)** 构建的轻量级现代 Python IDE。Pyra 强调现代化工具链、跨平台兼容性，以及与 `uv` 的无缝集成来管理 Python 环境。

## ✨ 特性

- **🚀 轻量快速**: 基于 Rust 后端，性能卓越
- **🎨 Monaco 编辑器**: 专业代码编辑体验，支持 Python 语法高亮
- **📑 多文件编辑**: 基于标签页的界面，支持同时编辑多个文件
- **🐍 智能环境管理**: 自动安装 `uv` 并智能跟踪环境状态
- **📦 包管理**: 可视化包安装和依赖管理
- **🔧 代码质量工具**: 内置 Ruff 集成，支持代码检查和格式化
- **🌈 现代化界面**: Catppuccin 主题，支持亮色/暗色模式并保持统一设计风格
- **⚡ 实时控制台**: 实时脚本输出和错误报告
- **🔄 项目模板**: 预定义模板快速创建项目
- **🛠️ 跨平台安装器**: 自动化环境设置脚本，支持所有平台
- **🖥️ 跨平台**: 支持 Windows、macOS 和 Linux

## 🚀 快速开始

### 系统要求

- Node.js (16+)
- Rust 和 Cargo
- `uv` (Python 包管理器) - *如果不存在，首次运行时会自动安装*

### 安装

1. 克隆仓库:
```bash
git clone https://github.com/sheacoding/Pyra.git
cd pyra
```

2. 安装依赖:
```bash
npm install
```

3. 启动开发服务器:
```bash
npm run tauri dev
```

> **注意**: Pyra 在首次启动时会自动检测并安装必需的 Python 工具（`uv`），如果系统中还没有的话。

### 生产环境构建

```bash
npm run tauri build
```

## 🛠️ 开发命令

### 前端开发
```bash
npm run dev          # 启动 Vite 开发服务器（仅前端）
npm run build        # 构建前端生产版本
npm run preview      # 预览生产构建
```

### 完整应用开发
```bash
npm run tauri dev    # 运行完整 Tauri 应用开发模式
npm run tauri build  # 构建生产应用包
```

### TypeScript 和代码检查
```bash
npx tsc --noEmit     # 类型检查（不生成文件）
```

## 🏗️ 架构设计

### 前端 (React + TypeScript)
- **主应用**: `src/App.tsx` - 中央应用组件，统一的标题栏/工具栏和多标签页支持
- **核心组件**:
  - `FileTree.tsx` - 文件系统浏览器
  - `Editor.tsx` - Monaco 编辑器集成，支持多文件编辑
  - `TabsBar.tsx` - 多文件标签页管理
  - `Console.tsx` - 实时脚本输出
  - `ProjectPanel.tsx` - Python 环境管理，智能 uv 集成
  - `SettingsPanel.tsx` - IDE 配置和主题设置
  - `StatusBar.tsx` - 环境状态和系统信息

### 后端 (Rust + Tauri)
- **入口点**: `src-tauri/src/main.rs`
- **命令模块**:
  - `file.rs` - 文件系统操作
  - `python.rs` - Python/uv 集成
  - `project.rs` - 项目管理
  - `ruff.rs` - 代码格式化和检查

### Python 集成
- **智能环境设置**: 首次运行时通过官方脚本自动安装 `uv`
- **环境管理**: 使用 `uv` 管理 Python 版本和虚拟环境，并进行状态跟踪
- **包管理**: 使用 `uv pip` 进行依赖安装
- **代码质量**: 使用 Ruff 进行代码检查和格式化
- **脚本执行**: 虚拟环境隔离执行
- **跨平台支持**: 为 Windows、macOS 和 Linux 提供环境设置脚本

## 🎨 主题系统

Pyra 采用精美的 Catppuccin 配色方案，提供亮色（Latte）和暗色（Mocha）两种变体。主题统一应用于：

- UI 组件
- Monaco 编辑器语法高亮
- 终端/控制台输出

## 📁 项目结构

```
pyra/
├── src/                    # React 前端
│   ├── components/         # React 组件
│   ├── lib/               # TypeScript 工具
│   ├── themes/            # Catppuccin 主题配置
│   └── App.tsx            # 主应用程序
├── src-tauri/             # Rust 后端
│   └── src/
│       ├── commands/      # Tauri 命令处理器
│       └── main.rs        # 应用程序入口点
└── docs/                  # 文档
```

## 🌍 多语言支持

- **English**: [English Documentation](../README.md)
- **中文**: 本文档

## 📖 文档资源

- **[用户指南](./USER_GUIDE.md)** - 完整的用户使用手册，帮助快速上手
- **[User Guide](./USER_GUIDE_EN.md)** - 英文版用户使用指南

## 🤝 贡献

我们欢迎贡献！请随时提交问题和功能改进请求。

## 📄 许可证

本项目采用 MIT 许可证 - 详见 [LICENSE](../LICENSE) 文件。

## 🙏 致谢

- 使用 [Tauri](https://tauri.app/) 作为桌面应用框架
- 基于 [Monaco Editor](https://microsoft.github.io/monaco-editor/) 提供代码编辑功能
- 使用 [uv](https://github.com/astral-sh/uv) 进行快速 Python 包管理
- 采用 [Catppuccin](https://catppuccin.com/) 配色方案
- 使用 [Ruff](https://github.com/astral-sh/ruff) 确保 Python 代码质量