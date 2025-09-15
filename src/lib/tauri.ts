import { invoke } from '@tauri-apps/api/core';

export interface FileItem {
  name: string;
  path: string;
  is_directory: boolean;
  size?: number;
}

export interface Package {
  name: string;
  version: string;
}

export interface PackageWithDeps {
  name: string;
  version: string;
  dependencies: Package[];
  depth: number;
}

export interface DependencyTree {
  packages: PackageWithDeps[];
  total_count: number;
}

export interface PyProjectToml {
  project: ProjectMetadata;
  dependencies: string[];
  dev_dependencies: string[];
  build_system?: BuildSystem;
}

export interface ProjectMetadata {
  name: string;
  version: string;
  description?: string;
  authors: string[];
  requires_python?: string;
  license?: string;
  readme?: string;
}

export interface BuildSystem {
  requires: string[];
  build_backend: string;
}

export interface RuffDiagnostic {
  rule: string;
  message: string;
  line: number;
  column: number;
  end_line: number;
  end_column: number;
  severity: string;
  filename: string;
}

export interface RuffCheckResult {
  diagnostics: RuffDiagnostic[];
  fixed: number;
  errors: string[];
}

export interface ProjectTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  files: TemplateFile[];
  dependencies: string[];
}

export interface TemplateFile {
  path: string;
  content: string;
  is_directory: boolean;
}

export class TauriAPI {
  // File operations
  static async readFile(path: string): Promise<string> {
    return invoke('read_file', { path });
  }

  static async writeFile(path: string, content: string): Promise<void> {
    return invoke('write_file', { path, content });
  }

  static async listDirectory(path: string): Promise<FileItem[]> {
    return invoke('list_directory', { path });
  }

  static async createFile(path: string): Promise<void> {
    return invoke('create_file', { path });
  }

  static async createDirectory(path: string): Promise<void> {
    return invoke('create_directory', { path });
  }

  static async deleteFile(path: string): Promise<void> {
    return invoke('delete_file', { path });
  }

  static async fileExists(path: string): Promise<boolean> {
    return invoke('file_exists', { path });
  }

  // Python/uv operations
  static async checkUvInstalled(): Promise<boolean> {
    return invoke('check_uv_installed');
  }

  static async listPythonVersions(): Promise<string[]> {
    return invoke('list_python_versions');
  }

  static async installPythonVersion(version: string): Promise<string> {
    return invoke('install_python_version', { version });
  }

  static async createVenv(projectPath: string, pythonVersion?: string): Promise<string> {
    return invoke('create_venv', { projectPath, pythonVersion });
  }

  static async checkVenvExists(projectPath: string): Promise<boolean> {
    return invoke('check_venv_exists', { projectPath });
  }

  static async installPackage(projectPath: string, packageName: string): Promise<string> {
    return invoke('install_package', { projectPath, package: packageName });
  }

  static async uninstallPackage(projectPath: string, packageName: string): Promise<string> {
    return invoke('uninstall_package', { projectPath, package: packageName });
  }

  static async listPackages(projectPath: string): Promise<Package[]> {
    return invoke('list_packages', { projectPath });
  }

  static async getDependencyTree(projectPath: string): Promise<DependencyTree> {
    return invoke('get_dependency_tree', { projectPath });
  }

  static async runScript(projectPath: string, scriptPath: string): Promise<string> {
    return invoke('run_script', { projectPath, scriptPath });
  }

  static async runScriptWithStreaming(projectPath: string, scriptPath: string): Promise<string> {
    return invoke('run_script_with_output_streaming', { projectPath, scriptPath });
  }

  static async runScriptSimple(projectPath: string, scriptPath: string): Promise<string> {
    return invoke('run_script_simple', { projectPath, scriptPath });
  }

  static async stopRunningScript(): Promise<string> {
    return invoke('stop_running_script');
  }

  // UV Project Management
  static async initUvProject(projectPath: string, projectName: string, pythonVersion?: string): Promise<string> {
    return invoke('init_uv_project', { projectPath, projectName, pythonVersion });
  }

  static async syncUvProject(projectPath: string): Promise<string> {
    return invoke('sync_uv_project', { projectPath });
  }

  static async runScriptWithUv(projectPath: string, scriptPath: string): Promise<string> {
    return invoke('run_script_with_uv', { projectPath, scriptPath });
  }

  static async runScriptWithUvStreaming(projectPath: string, scriptPath: string): Promise<string> {
    return invoke('run_script_with_uv_streaming', { projectPath, scriptPath });
  }

  // Project Management
  static async createNewProject(name: string, path: string, pythonVersion?: string): Promise<any> {
    return invoke('create_new_project', { name, path, pythonVersion });
  }
  
  static async openProjectDialog(): Promise<string> {
    return invoke('open_project_dialog');
  }
  
  static async loadProjectConfig(projectPath: string): Promise<any> {
    return invoke('load_project_config', { projectPath });
  }
  
  static async saveProjectConfig(config: any): Promise<void> {
    return invoke('save_project_config', { config });
  }
  
  static async getRecentProjects(): Promise<any[]> {
    return invoke('get_recent_projects');
  }

  // Ruff operations
  static async checkRuffInstalled(): Promise<boolean> {
    return invoke('check_ruff_installed');
  }

  static async installRuffWithUv(projectPath: string): Promise<string> {
    return invoke('install_ruff_with_uv', { projectPath });
  }

  static async ruffCheckFile(projectPath: string, filePath: string): Promise<RuffCheckResult> {
    return invoke('ruff_check_file', { projectPath, filePath });
  }

  static async ruffCheckProject(projectPath: string): Promise<RuffCheckResult> {
    return invoke('ruff_check_project', { projectPath });
  }

  static async ruffFormatFile(projectPath: string, filePath: string): Promise<string> {
    return invoke('ruff_format_file', { projectPath, filePath });
  }

  static async ruffFormatProject(projectPath: string): Promise<string> {
    return invoke('ruff_format_project', { projectPath });
  }

  static async ruffFixFile(projectPath: string, filePath: string): Promise<RuffCheckResult> {
    return invoke('ruff_fix_file', { projectPath, filePath });
  }

  static async createRuffConfig(projectPath: string): Promise<string> {
    return invoke('create_ruff_config', { projectPath });
  }

  // Template operations
  static async getProjectTemplates(): Promise<ProjectTemplate[]> {
    return invoke('get_project_templates');
  }

  static async createProjectFromTemplate(projectPath: string, templateId: string, projectName: string, pythonVersion?: string): Promise<string> {
    return invoke('create_project_from_template', { projectPath, templateId, projectName, pythonVersion });
  }

  // PyProject.toml management
  static async readPyProjectToml(projectPath: string): Promise<PyProjectToml> {
    return invoke('read_pyproject_toml', { projectPath });
  }

  static async writePyProjectToml(projectPath: string, config: PyProjectToml): Promise<void> {
    return invoke('write_pyproject_toml', { projectPath, config });
  }

  static async checkPyProjectExists(projectPath: string): Promise<boolean> {
    return invoke('check_pyproject_exists', { projectPath });
  }
}