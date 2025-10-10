# Pyra IDE

一个轻量级、现代化的 Python IDE，采用 **Tauri (Rust 后端) + React (TypeScript 前端)** 技术栈构建。Pyra 专注于现代工具链、跨平台兼容性，以及与 `uv` 的无缝集成，实现 Python 环境管理。

> [English](./README.md) | 简体中文

## <i class="fas fa-star"></i> 特性

- **<i class="fas fa-rocket"></i> 轻量高效**：基于 Rust 后端构建，性能卓越
- **<i class="fas fa-palette"></i> Monaco 编辑器**：专业代码编辑体验，支持 Python 语法高亮
- **<i class="fas fa-file-alt"></i> 多文件编辑**：标签页界面，支持同时编辑多个文件
- **<i class="fab fa-python"></i> 智能环境管理**：自动安装 `uv`，智能追踪环境状态
- **<i class="fas fa-box"></i> 包管理**：可视化包安装和依赖管理
- **<i class="fas fa-wrench"></i> 代码质量工具**：内置 Ruff 集成，支持代码检查和格式化
- **<i class="fas fa-bug"></i> Python 调试**：基于 DAP 协议的完整调试支持（断点、单步、变量查看）
- **<i class="fas fa-palette"></i> 现代化界面**：Catppuccin 主题，支持浅色/深色模式，设计风格统一
- **<i class="fas fa-bolt"></i> 实时控制台**：实时显示脚本输出和错误报告
- **<i class="fas fa-sync-alt"></i> 项目模板**：使用预定义模板快速创建项目
- **<i class="fas fa-tools"></i> 跨平台安装器**：为所有平台提供自动化环境配置脚本
- **<i class="fas fa-desktop"></i> 跨平台支持**：支持 Windows、macOS 和 Linux

## <i class="fas fa-rocket"></i> 快速开始

### 前置要求

- Node.js (16+)
- Rust 和 Cargo
- `uv`（Python 包管理器）- *首次运行时如果未安装会自动安装*

### 安装

1. 克隆仓库：
```bash
git clone https://github.com/sheacoding/Pyra.git
cd pyra
```

2. 安装依赖：
```bash
npm install
```

3. 启动开发服务器：
```bash
npm run tauri dev
```

> **注意**：Pyra 会在首次启动时自动检测并安装所需的 Python 工具（`uv`），如果系统中尚未安装。

### 构建生产版本

```bash
npm run tauri build
```

## <i class="fas fa-tools"></i> 开发命令

### 前端开发
```bash
npm run dev          # 启动 Vite 开发服务器（仅前端）
npm run build        # 构建生产版前端
npm run preview      # 预览生产构建
```

### 完整应用开发
```bash
npm run tauri dev    # 以开发模式运行完整 Tauri 应用
npm run tauri build  # 构建生产应用包
```

### TypeScript 和代码检查
```bash
npx tsc --noEmit     # 类型检查（不输出文件）
```

## <i class="fas fa-building"></i> 架构

### 前端（React + TypeScript）
- **主应用**：`src/App.tsx` - 中央应用程序，统一的头部/工具栏和多标签支持
- **核心组件**：
  - `FileTree.tsx` - 文件系统浏览器
  - `Editor.tsx` - Monaco 编辑器集成，支持多文件编辑
  - `TabsBar.tsx` - 多文件标签管理
  - `Console.tsx` - 实时脚本输出
  - `ProjectPanel.tsx` - Python 环境管理，智能集成 uv
  - `SettingsPanel.tsx` - IDE 配置和主题设置
  - `DebugPanel.tsx` - 调试控制面板（断点、调用栈、变量查看）
  - `StatusBar.tsx` - 环境状态和系统信息

### 后端（Rust + Tauri）
- **入口点**：`src-tauri/src/main.rs`
- **命令模块**：
  - `file.rs` - 文件系统操作
  - `python.rs` - Python/uv 集成
  - `project.rs` - 项目管理
  - `ruff.rs` - 代码格式化和检查
  - `debug.rs` - Python 调试器集成（DAP 协议）

### Python 集成
- **智能环境配置**：首次运行时通过官方脚本自动安装 `uv`
- **环境管理**：使用 `uv` 管�� Python 版本和虚拟环境，支持状态追踪
- **包管理**：使用 `uv pip` 安装依赖
- **代码质量**：使用 Ruff 进行代码检查和格式化
- **脚本执行**：虚拟环境隔离
- **调试功能**：实现 DAP 客户端，支持断点、单步执行、变量查看等完整调试功能
- **跨平台支持**：为 Windows、macOS 和 Linux 提供环境配置脚本

## <i class="fas fa-palette"></i> 主题系统

Pyra 采用美观的 Catppuccin 配色方案，提供浅色（Latte）和深色（Mocha）两种主题变体。主题在以下方面保持一致：

- UI 组件
- Monaco 编辑器语法高亮
- 终端/控制台输出

## <i class="fas fa-folder"></i> 项目结构

```
pyra/
├── src/                    # React 前端
│   ├── components/         # React 组件
│   ├── lib/               # TypeScript 工具库
│   ├── themes/            # Catppuccin 主题配置
│   └── App.tsx            # 主应用程序
├── src-tauri/             # Rust 后端
│   └── src/
│       ├── commands/      # Tauri 命令处理器
│       └── main.rs        # 应用程序入口点
└── docs/                  # 文档
```

## <i class="fas fa-book"></i> 文档

### 用户文档
- **[用户指南（中文）](./docs/USER_GUIDE.md)** - 中文版用户使用手册
- **[User Guide (English)](./docs/USER_GUIDE_EN.md)** - 英文版用户使用手册

### 开发者文档
- **[贡献指南](./docs/CONTRIBUTING.md)** - 开发工作流程、编码标准和贡献指南
- **[安全政策](./docs/SECURITY.md)** - 安全漏洞报告和处理流程
- **[图标更新指南](./docs/ICON_UPDATE_GUIDE.md)** - 应用图标更新说明

## <i class="fas fa-handshake"></i> 贡献

我们欢迎贡献！请阅读我们的[贡献指南](./docs/CONTRIBUTING.md)了解详情：

- 行为准则
- 开发工作流程
- 编码标准
- 提交指南
- 许可协议

如需报告安全漏洞，请查看我们的[安全政策](./docs/SECURITY.md)。

## <i class="fas fa-briefcase"></i> 商业使用

Pyra 采用 Apache 2.0 许可证，允许个人和商业使用：

- ✅ **免费使用**：可用于任何目的，包括商业项目
- ✅ **修改和分发**：可以修改和分发软件，但需保留原始声明
- ✅ **专利授权**：包含贡献者的明确专利授权
- ⚠️ **需要署名**：必须包含原始版权声明和许可证
- ⚠️ **商标限制**：未经许可不得使用 Pyra 名称/标志

如需商业支持、定制功能或合作机会，请联系：**ericoding**

## <i class="fas fa-file-alt"></i> 许可证

```
Copyright 2024 ericoding

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
```

本项目采用 Apache License 2.0 许可证 - 详见 [LICENSE](LICENSE) 文件。

### 第三方许可证

本项目包含各种第三方开源组件。详细归属和许可信息请参见 [NOTICE](NOTICE)。

## <i class="fas fa-heart"></i> 致谢

- 使用 [Tauri](https://tauri.app/) 作为桌面应用框架
- 使用 [Monaco Editor](https://microsoft.github.io/monaco-editor/) 作为代码编辑器
- 使用 [uv](https://github.com/astral-sh/uv) 实现快速 Python 包管理
- 使用 [Catppuccin](https://catppuccin.com/) 配色方案
- 使用 [Ruff](https://github.com/astral-sh/ruff) 进行 Python 代码质量检查
