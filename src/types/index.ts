export interface FileTreeItem {
  name: string;
  path: string;
  isDirectory: boolean;
  children?: FileTreeItem[];
}

export interface Project {
  name: string;
  path: string;
  pythonVersion?: string;
  hasVenv: boolean;
}

export interface ProjectConfig {
  name: string;
  path: string;
  pythonVersion?: string;
  dependencies: string[];
  createdAt: string;
  lastOpened: string;
}

export interface ConsoleMessage {
  id: string;
  content: string;
  timestamp: Date;
  type: 'stdout' | 'stderr' | 'info' | 'error';
}