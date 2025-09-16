# Pyra IDE

A lightweight, modern Python IDE built with **Tauri (Rust backend) + React (TypeScript frontend)**. Pyra emphasizes modern tooling, cross-platform compatibility, and seamless integration with `uv` for Python environment management.

## ✨ Features

- **🚀 Lightweight & Fast**: Built with Rust backend for optimal performance
- **🎨 Monaco Editor**: Professional code editing with Python syntax highlighting
- **🐍 Python Environment Management**: Integrated `uv` support for Python versions and virtual environments
- **📦 Package Management**: Visual package installation and dependency management
- **🔧 Code Quality Tools**: Built-in Ruff integration for linting and formatting
- **🌈 Modern UI**: Catppuccin theme with light/dark mode support
- **⚡ Real-time Console**: Live script output and error reporting
- **🔄 Project Templates**: Quick project setup with predefined templates
- **🖥️ Cross-platform**: Windows, macOS, and Linux support

## 🚀 Quick Start

### Prerequisites

- Node.js (16+)
- Rust and Cargo
- `uv` (Python package manager)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/your-username/pyra.git
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

### Building for Production

```bash
npm run tauri build
```

## 🛠️ Development Commands

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

## 🏗️ Architecture

### Frontend (React + TypeScript)
- **Main App**: `src/App.tsx` - Central application with unified header/toolbar
- **Core Components**:
  - `FileTree.tsx` - File system browser
  - `Editor.tsx` - Monaco Editor integration
  - `Console.tsx` - Real-time script output
  - `ProjectPanel.tsx` - Python environment management
  - `SettingsPanel.tsx` - IDE configuration and theming

### Backend (Rust + Tauri)
- **Entry Point**: `src-tauri/src/main.rs`
- **Command Modules**:
  - `file.rs` - File system operations
  - `python.rs` - Python/uv integration
  - `project.rs` - Project management
  - `ruff.rs` - Code formatting and linting

### Python Integration
- **Environment Management**: `uv` for Python versions and virtual environments
- **Package Management**: `uv pip` for dependency installation
- **Code Quality**: Ruff for linting and formatting
- **Script Execution**: Virtual environment isolation

## 🎨 Theming

Pyra features the beautiful Catppuccin color scheme with both light (Latte) and dark (Mocha) variants. Themes are applied consistently across:

- UI components
- Monaco Editor syntax highlighting
- Terminal/console output

## 📁 Project Structure

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

## 🌍 Language Support

- **English**: This README
- **中文**: [中文文档](./docs/README.md)

## 📖 Documentation

- **[User Guide](./docs/USER_GUIDE_EN.md)** - Complete user manual for getting started
- **[用户指南](./docs/USER_GUIDE.md)** - 中文版用户使用手册

## 🤝 Contributing

We welcome contributions! Please feel free to submit issues and enhancement requests.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [Tauri](https://tauri.app/) for the desktop application framework
- Powered by [Monaco Editor](https://microsoft.github.io/monaco-editor/) for code editing
- Uses [uv](https://github.com/astral-sh/uv) for fast Python package management
- Styled with [Catppuccin](https://catppuccin.com/) color schemes
- Formatted with [Ruff](https://github.com/astral-sh/ruff) for Python code quality