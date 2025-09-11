import { invoke } from '@tauri-apps/api/tauri';

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
}