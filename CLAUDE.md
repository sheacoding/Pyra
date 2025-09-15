# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Pyra is a lightweight Python IDE built with **Tauri (Rust backend) + React (TypeScript frontend)**. The project emphasizes modern tooling, cross-platform compatibility, and integration with `uv` for Python environment management.

## Development Commands

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

## Architecture Overview

### Frontend (React + TypeScript)
- **Main App**: `src/App.tsx` - Central application component with unified header/toolbar
- **Core Components**:
  - `FileTree.tsx` - File system browser with file operations
  - `Editor.tsx` - Monaco Editor integration with Python syntax highlighting
  - `Console.tsx` - Real-time script output display
  - `ProjectPanel.tsx` - Python environment and package management
  - `SettingsPanel.tsx` - IDE configuration including theme switching
- **Theming**: `src/themes/` contains Catppuccin theme implementations for both UI and Monaco Editor
- **API Layer**: `src/lib/tauri.ts` - TypeScript definitions and API calls to Rust backend

### Backend (Rust + Tauri)
- **Entry Point**: `src-tauri/src/main.rs` - Registers all Tauri commands and plugins
- **Command Modules** in `src-tauri/src/commands/`:
  - `file.rs` - File system operations (read, write, list, create, delete)
  - `python.rs` - Python/uv integration (environments, packages, script execution)
  - `project.rs` - Project management and configuration
  - `ruff.rs` - Python linting and formatting via Ruff
  - `templates.rs` - Project template system

### Python Environment Management
The application relies heavily on `uv` (modern Python package manager) for:
- Python version installation and management
- Virtual environment creation (`.venv` in project directories)
- Package installation and dependency management
- Script execution within virtual environments

## Key Design Patterns

### IPC Communication
All frontend-backend communication uses Tauri's `invoke()` pattern:
```typescript
// Frontend calls Rust commands
const result = await invoke('command_name', { param: value })
```

### Component Communication
- **Refs for Direct Control**: Editor and FileTree components expose handles via `useRef`
- **State Lifting**: Project path, current file, and console messages managed in App.tsx
- **Event Callbacks**: Components communicate changes via callback props

### Theme System
- **Catppuccin Integration**: Full theme system with Mocha (dark) and Latte (light) variants
- **CSS Variables**: Runtime theme switching via CSS custom properties
- **Monaco Integration**: Custom theme definitions for syntax highlighting

### Process Management
- **Background Script Execution**: Rust backend manages Python processes
- **Real-time Output**: Streaming stdout/stderr to frontend console
- **Process Control**: Start/stop script execution with proper cleanup

## File Structure Conventions

### Frontend Structure
```
src/
├── components/          # React components
├── lib/                # TypeScript utilities and API definitions
├── themes/             # Theme configurations (Catppuccin)
├── App.tsx             # Main application component
└── main.tsx            # React entry point
```

### Backend Structure
```
src-tauri/src/
├── commands/           # Tauri command implementations
├── main.rs            # Application entry point
└── [modules].rs       # Additional Rust modules
```

## Important Implementation Details

### Monaco Editor Integration
- Uses `@monaco-editor/react` with custom Catppuccin themes
- Python syntax highlighting with token-specific color mapping
- Integrated with Ruff for real-time linting and formatting

### Python Execution
- All Python scripts run within project-specific virtual environments
- Uses `uv run` for execution when available, falls back to direct Python execution
- Supports both synchronous and streaming output modes

### Project Configuration
- `pyproject.toml` parsing and management for modern Python projects
- Automatic virtual environment detection and creation prompts
- Template-based project creation system

### Cross-Platform Considerations
- Tauri provides native desktop integration across Windows/macOS/Linux
- File path handling accounts for platform differences
- Window decorations disabled for custom title bar implementation

## Development Workflow

1. **Starting Development**: Run `npm run tauri dev` to start both frontend and backend
2. **Adding New Features**:
   - Add Tauri commands in `src-tauri/src/commands/` modules
   - Register commands in `main.rs`
   - Add TypeScript definitions in `src/lib/tauri.ts`
   - Implement frontend components in `src/components/`
3. **Theme Modifications**: Update `src/themes/catppuccin.ts` for UI changes, Monaco themes for editor changes
4. **Testing**: Currently manual testing - verify functionality across different Python projects and environments

## Known Architecture Decisions

- **Unified Toolbar**: Explorer, editor, and project actions combined in single header for space efficiency
- **uv-First Approach**: Prioritizes `uv` tooling over traditional pip/venv for better performance
- **No LSP Integration**: Currently uses Monaco's built-in Python support rather than language server
- **Stateless Backend**: Rust backend primarily provides command execution, state managed in frontend
- **Custom Window Frame**: Disabled native decorations for consistent cross-platform appearance