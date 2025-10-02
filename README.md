# Pyra IDE

A lightweight, modern Python IDE built with **Tauri (Rust backend) + React (TypeScript frontend)**. Pyra emphasizes modern tooling, cross-platform compatibility, and seamless integration with `uv` for Python environment management.

## <i class="fas fa-star"></i> Features

- **<i class="fas fa-rocket"></i> Lightweight & Fast**: Built with Rust backend for optimal performance
- **<i class="fas fa-palette"></i> Monaco Editor**: Professional code editing with Python syntax highlighting
- **<i class="fas fa-file-alt"></i> Multi-file Editing**: Tab-based interface for editing multiple files simultaneously
- **<i class="fab fa-python"></i> Smart Environment Management**: Automatic `uv` installation and intelligent environment status tracking
- **<i class="fas fa-box"></i> Package Management**: Visual package installation and dependency management
- **<i class="fas fa-wrench"></i> Code Quality Tools**: Built-in Ruff integration for linting and formatting
- **<i class="fas fa-palette"></i> Modern UI**: Catppuccin theme with light/dark mode support and unified design consistency
- **<i class="fas fa-bolt"></i> Real-time Console**: Live script output and error reporting
- **<i class="fas fa-sync-alt"></i> Project Templates**: Quick project setup with predefined templates
- **<i class="fas fa-tools"></i> Cross-platform Installer**: Automated environment setup scripts for all platforms
- **<i class="fas fa-desktop"></i> Cross-platform**: Windows, macOS, and Linux support

## <i class="fas fa-rocket"></i> Quick Start

### Prerequisites

- Node.js (16+)
- Rust and Cargo
- `uv` (Python package manager) - *Automatically installed on first run if not present*

### Installation

1. Clone the repository:
```bash
git clone https://github.com/sheacoding/Pyra.git
cd pyra
```

2. Install dependencies:
```bash
npm install
```

3. Start development server:
```bash
npm run tauri dev
```

> **Note**: Pyra will automatically detect and install required Python tools (`uv`) on first launch if they're not already available on your system.

### Building for Production

```bash
npm run tauri build
```

## <i class="fas fa-tools"></i> Development Commands

### Frontend Development
```bash
npm run dev          # Start Vite dev server (frontend only)
npm run build        # Build frontend for production
npm run preview      # Preview production build
```

### Full Application Development
```bash
npm run tauri dev    # Run full Tauri app in development mode
npm run tauri build  # Build production app bundle
```

### TypeScript and Linting
```bash
npx tsc --noEmit     # Type check without emitting files
```

## <i class="fas fa-building"></i> Architecture

### Frontend (React + TypeScript)
- **Main App**: `src/App.tsx` - Central application with unified header/toolbar and multi-tab support
- **Core Components**:
  - `FileTree.tsx` - File system browser
  - `Editor.tsx` - Monaco Editor integration with multi-file support
  - `TabsBar.tsx` - Multi-file tab management
  - `Console.tsx` - Real-time script output
  - `ProjectPanel.tsx` - Python environment management with smart uv integration
  - `SettingsPanel.tsx` - IDE configuration and theming
  - `StatusBar.tsx` - Environment status and system information

### Backend (Rust + Tauri)
- **Entry Point**: `src-tauri/src/main.rs`
- **Command Modules**:
  - `file.rs` - File system operations
  - `python.rs` - Python/uv integration
  - `project.rs` - Project management
  - `ruff.rs` - Code formatting and linting

### Python Integration
- **Smart Environment Setup**: Automatic `uv` installation via official scripts on first run
- **Environment Management**: `uv` for Python versions and virtual environments with status tracking
- **Package Management**: `uv pip` for dependency installation
- **Code Quality**: Ruff for linting and formatting
- **Script Execution**: Virtual environment isolation
- **Cross-platform Support**: Environment setup scripts for Windows, macOS, and Linux

## <i class="fas fa-palette"></i> Theming

Pyra features the beautiful Catppuccin color scheme with both light (Latte) and dark (Mocha) variants. Themes are applied consistently across:

- UI components
- Monaco Editor syntax highlighting
- Terminal/console output

## <i class="fas fa-folder"></i> Project Structure

```
pyra/
├── src/                    # React frontend
│   ├── components/         # React components
│   ├── lib/               # TypeScript utilities
│   ├── themes/            # Catppuccin theme configs
│   └── App.tsx            # Main application
├── src-tauri/             # Rust backend
│   └── src/
│       ├── commands/      # Tauri command handlers
│       └── main.rs        # Application entry point
└── docs/                  # Documentation
```

## <i class="fas fa-globe"></i> Language Support

- **中文**: [中文文档](./docs/README.md)

## <i class="fas fa-book"></i> Documentation

- **[User Guide](./docs/USER_GUIDE_EN.md)** - Complete user manual for getting started
- **[用户指南](./docs/USER_GUIDE.md)** - 中文版用户使用手册

## <i class="fas fa-handshake"></i> Contributing

We welcome contributions! Please read our [Contributing Guide](CONTRIBUTING.md) for details on:

- Code of conduct
- Development workflow
- Coding standards
- Commit guidelines
- License agreement

For security vulnerabilities, please see our [Security Policy](SECURITY.md).

## <i class="fas fa-briefcase"></i> Commercial Use

Pyra is licensed under Apache 2.0, which allows for both personal and commercial use:

- ✅ **Free to Use**: Use Pyra for any purpose, including commercial projects
- ✅ **Modify and Distribute**: Modify and distribute the software with proper attribution
- ✅ **Patent Grant**: Includes an express grant of patent rights from contributors
- ⚠️ **Attribution Required**: Include the original copyright notice and license
- ⚠️ **Trademark Restrictions**: Cannot use the Pyra name/logo without permission

For commercial support, custom features, or partnership opportunities, please contact: **ericoding**

## <i class="fas fa-file-alt"></i> License

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

This project is licensed under the Apache License 2.0 - see the [LICENSE](LICENSE) file for full details.

### Third-Party Licenses

This project includes various third-party open-source components. See [NOTICE](NOTICE) for detailed attribution and license information.

## <i class="fas fa-heart"></i> Acknowledgments

- Built with [Tauri](https://tauri.app/) for the desktop application framework
- Powered by [Monaco Editor](https://microsoft.github.io/monaco-editor/) for code editing
- Uses [uv](https://github.com/astral-sh/uv) for fast Python package management
- Styled with [Catppuccin](https://catppuccin.com/) color schemes
- Formatted with [Ruff](https://github.com/astral-sh/ruff) for Python code quality