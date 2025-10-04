# Pyra IDE User Guide

Welcome to Pyra IDE! This guide will help you get started with our lightweight Python development environment.

## <i class="fas fa-rocket"></i> Getting Started

### First Launch
1. **Open Pyra IDE** - The application will start with a default test project
2. **Create Virtual Environment** - If prompted, create a Python virtual environment for your project
3. **Explore the Interface** - Familiarize yourself with the layout and tools

## <i class="fas fa-bullseye"></i> Interface Overview

### Main Areas
- **<i class="fas fa-folder-open"></i> File Explorer** (Left): Browse and manage your project files
- **<i class="fas fa-edit"></i> Code Editor** (Center): Write and edit your Python code
- **<i class="fas fa-chart-bar"></i> Console** (Bottom): View script output and error messages
- **<i class="fas fa-cog"></i> Project Panel** (Right, toggleable): Manage Python packages and environment

### Toolbar Actions
- **<i class="fas fa-file"></i> New File** - Create a new Python file
- **<i class="fas fa-folder"></i> New Folder** - Create a new directory
- **<i class="fas fa-sync-alt"></i> Refresh** - Refresh the file tree
- **<i class="fas fa-play"></i> Run** - Execute the current Python script
- **<i class="fas fa-stop"></i> Stop** - Stop the running script
- **<i class="fas fa-palette"></i> Format** - Format your code with Ruff
- **<i class="fas fa-search"></i> Lint** - Check code quality with Ruff

## <i class="fas fa-folder"></i> Working with Projects

### Creating a New Project
1. Click **<i class="fas fa-rocket"></i> New Project** in the toolbar
2. Choose from available templates:
   - **Basic Python Project** - Simple structure
   - **Data Science Project** - With Jupyter notebook support
   - **Web Framework Project** - Flask/FastAPI setup
3. Enter project name and location
4. Click **Create Project**

### Opening an Existing Project
1. Click **<i class="fas fa-folder-open"></i> Open Project** in the toolbar
2. Navigate to your project folder
3. Select the project directory
4. Pyra will automatically detect Python files and configuration

## <i class="fab fa-python"></i> Python Environment Management

### Virtual Environment Setup
- **Automatic Detection**: Pyra checks for existing `.venv` folders
- **Easy Creation**: Prompted to create virtual environment if none exists
- **Python Version Selection**: Choose from Python 3.9, 3.10, 3.11, or 3.12

### Package Management
1. **Open Project Panel** - Click the **<i class="fas fa-clipboard"></i>** button or use "Show Panel"
2. **Install Packages**:
   - Type package name in the search box
   - Click **Install** to add to your project
   - Packages are installed via `uv pip`
3. **View Installed Packages** - See all packages in your virtual environment
4. **Update Dependencies** - Keep your packages up to date

## <i class="fas fa-edit"></i> Code Editing

### Features
- **Syntax Highlighting** - Full Python syntax support
- **Auto-completion** - IntelliSense for Python keywords and functions
- **Error Detection** - Real-time error highlighting
- **Multiple Files** - Work with multiple Python files simultaneously

### Code Quality Tools
- **Format Code** (<i class="fas fa-palette"></i>): Automatically format your code using Ruff
- **Lint Code** (<i class="fas fa-search"></i>): Check for code quality issues and potential bugs
- **Real-time Feedback**: See linting issues as you type

## <i class="fas fa-play"></i> Running Code

### Execute Scripts
1. **Open a Python file** in the editor
2. **Click Run** (<i class="fas fa-play"></i>) or use keyboard shortcut
3. **View Output** in the console below
4. **Monitor Execution** - See real-time output and errors

### Console Features
- **Real-time Output** - See print statements as they execute
- **Error Messages** - Clear error reporting with line numbers
- **Clear Console** - Reset output when needed
- **Scrollable History** - Review previous execution results

## <i class="fas fa-bug"></i> Debugging Code

### Starting Debug
1. **Open a Python file** (.py)
2. **Set Breakpoints** - Click the line number gutter, red dots will appear
3. **Start Debugging** - Click the debug button in toolbar (<i class="fas fa-bug"></i> orange bug icon)
4. **Select Debug Mode** - Choose "Debug" from the dropdown menu

### Debug Controls
- **<i class="fas fa-play"></i> Continue (F5)** - Continue execution until next breakpoint
- **<i class="fas fa-arrow-right"></i> Step Over (F10)** - Execute current line without entering functions
- **<i class="fas fa-arrow-down"></i> Step Into (F11)** - Step into function calls
- **<i class="fas fa-arrow-up"></i> Step Out (Shift+F11)** - Exit current function
- **<i class="fas fa-stop"></i> Stop** - Stop the debug session

### Debug Information Panel
When the program pauses at a breakpoint, the debug panel displays:

- **Call Stack**:
  - Shows function call hierarchy
  - Click different stack frames to view corresponding code location
  - Understand program execution path

- **Variables Viewer**:
  - **Locals** - Variables in current function scope
  - **Globals** - Variables in global scope
  - Expand nested objects to view details
  - Real-time display of variable value changes

### Breakpoint Management
- **Add Breakpoint** - Click the line number gutter
- **Remove Breakpoint** - Click the red dot again
- **Multiple Breakpoints** - Set breakpoints at different locations
- **Breakpoint Verification** - Breakpoints are verified after debug starts

### Debugging Tips
- **Set breakpoints at key locations** - Place breakpoints where errors might occur
- **Use step execution** - Track code execution line by line
- **Check variable values** - Verify variables match expectations
- **Observe call stack** - Understand function call sequence

### Installing debugpy
First-time use of debugging requires installing debugpy:

1. **Install via Package Manager**:
   - Open project panel (<i class="fas fa-clipboard"></i>)
   - Search for "debugpy"
   - Click Install

2. **Or use command line**:
   ```bash
   # Windows
   .venv\Scripts\pip install debugpy

   # Linux/macOS
   .venv/bin/pip install debugpy
   ```

### Debug Troubleshooting

**Q: Debug fails to start**
- A: Ensure debugpy is installed (via package manager)
- A: Ensure virtual environment is created

**Q: Breakpoints not hit**
- A: Ensure breakpoint is on executable code line (not empty or comment)
- A: Restart debug session

**Q: Variables display incorrectly**
- A: Ensure program is paused at breakpoint
- A: Click the correct stack frame in call stack

## <i class="fas fa-cog"></i> Settings & Customization

### Theme Options
1. **Open Settings** - Click <i class="fas fa-cog"></i> Settings button
2. **Choose Theme**:
   - **Catppuccin Mocha** (Dark theme)
   - **Catppuccin Latte** (Light theme)
3. **Apply Changes** - Theme updates immediately

### Editor Preferences
- **Font Size** - Adjust editor font size
- **Tab Size** - Configure indentation preferences
- **Word Wrap** - Enable/disable line wrapping
- **Minimap** - Show/hide code minimap

## <i class="fas fa-clipboard"></i> Tips & Best Practices

### Project Organization
- **Use Virtual Environments** - Always create isolated environments for projects
- **Organize Files** - Keep related code in folders
- **Version Control** - Use git for tracking changes (external to Pyra)

### Code Quality
- **Format Regularly** - Use the Format button to maintain consistent style
- **Fix Linting Issues** - Address warnings and errors highlighted by Ruff
- **Test Your Code** - Run scripts frequently to catch errors early

### Performance
- **Close Unused Files** - Keep only necessary files open
- **Clear Console** - Reset output when it gets lengthy
- **Restart if Needed** - Refresh the application if it becomes unresponsive

## <i class="fas fa-wrench"></i> Troubleshooting

### Common Issues

**Q: Virtual environment not found**
- A: Click "Create Environment" when prompted, or use the Project Panel to set up Python environment

**Q: Package installation fails**
- A: Ensure you have an active virtual environment and internet connection

**Q: Code doesn't run**
- A: Check that your file is saved and has a `.py` extension

**Q: Linting errors persist**
- A: Use the Format button to auto-fix many style issues

**Q: Console output is missing**
- A: Ensure your script has print statements or output commands

### Getting Help
- **Check Console** - Error messages often provide helpful details
- **Review Code** - Use the linting tools to identify issues
- **Restart Application** - Close and reopen Pyra if problems persist

## <i class="fas fa-book"></i> Additional Resources

- **[中文用户手册](./USER_GUIDE.md)** - Chinese version of this guide
- **[项目文档](./README.md)** - Technical documentation in Chinese
- **[Main README](../README.md)** - Project overview and development information

---

Happy coding with Pyra IDE! <i class="fas fa-star"></i>