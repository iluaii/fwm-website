export interface FileNode {
  name: string;
  type: 'file' | 'dir';
  content?: string;
  children?: Record<string, FileNode>;
}

export interface TerminalOutputLine {
  id: string;
  type: 'cmd' | 'text' | 'json' | 'error' | 'success';
  content: string;
  cwd?: string; // Tracks the directory the command was run in
}

export interface SandboxActions {
  setGravity: (val: number, type?: 'earth' | 'moon' | 'space') => void;
  setMassMode: (mode: 'size' | 'ram') => void;
  setBspTiling: (val: boolean) => void;
  spawnWindow: () => void;
  killWindow: (id?: number) => void;
  calmAll: () => void;
  getState: () => Record<string, any>;
  getWindows: () => Record<string, any>[];
}