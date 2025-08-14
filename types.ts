

export interface VaultEntry {
  id: string;
  title: string;
  username: string;
  password?: string;
  url?: string;
  notes?: string;
  tags?: string[];
}

export interface GitData {
  not_added: string[];
  conflicted: string[];
  created: string[];
  deleted: string[];
  modified: string[];
  renamed: { from: string; to: string }[];
  staged: string[];
  files: { path: string; index: string; working_dir: string }[];
  ahead: number;
  behind: number;
  current: string | null;
  tracking: string | null;
}

export interface CloudFile {
    id: string;
    name: string;
    type: 'gist' | 'dropbox';
    modified: string;
    size: string;
}

export interface SyncActivity {
    id: string;
    type: 'commit' | 'push' | 'pull' | 'gist' | 'dropbox';
    message: string;
    time: string;
}

export interface SyncHubData {
    git: GitData;
    gists: CloudFile[];
    dropboxFiles: CloudFile[];
    activity: SyncActivity[];
}

export interface DeviceInfo {
    model: string;
    androidVersion: string;
    sdkVersion: string;
    kernelVersion: string;
    rootStatus: 'Rooted' | 'Not Rooted' | 'Unknown';
    storageUsed: number; // in GB
    storageTotal: number; // in GB
    memoryUsed: number; // in GB
    memoryTotal: number; // in GB
    cpuGovernor: 'performance' | 'powersave' | 'ondemand' | 'schedutil';
}

export interface AndroidPackage {
    name: string;
    type: 'user' | 'system';
}

export interface AndroidFile {
    name: string;
    type: 'folder' | 'file';
    size?: string;
    modified?: string;
    children?: AndroidFile[];
}


export interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
}

export interface CodeIssue {
    id: string;
    line: number;
    severity: 'Critical' | 'Warning' | 'Info';
    title: string;
    description: string;
    suggestion: string;
}

export interface UserProfile {
    username: string;
    avatarUrl: string;
}

// --- PROJECT TRACKER ---
export type ProjectColumnId = 'todo' | 'in-progress' | 'done';

export type TaskPriority = 'low' | 'medium' | 'high';

export interface ProjectTask {
  id: string;
  content: string;
  columnId: ProjectColumnId;
  priority: TaskPriority;
}

// --- SNIPPET VAULT ---
export interface CodeSnippet {
    id: string;
    title: string;
    language: string;
    code: string;
    tags: string[];
    description?: string;
}

// --- DATABASE EXPLORER ---
export type DbRow = Record<string, any>;

export interface DbTable {
    name: string;
    rows: DbRow[];
}

// --- LOG VIEWER ---
export type LogLevel = 'V' | 'D' | 'I' | 'W' | 'E';

export interface LogEntry {
    id: number;
    level: LogLevel;
    timestamp: string;
    message: string;
}


// --- PLUGIN & VAULT SYSTEM ---

export type PluginType = 'widget' | 'tool' | 'ai_assistant';

export interface Plugin {
  id: string;
  name: string;
  author: string;
  description: string;
  type: PluginType;
  icon: React.ReactNode;
  component: React.FC<any>;
  requests_vault_access?: boolean;
}

export interface VaultAccessRequest {
  plugin: Plugin;
  onGranted: () => void;
}

export type AutoLockTimeout = 1 | 5 | 15 | 30 | 0; // In minutes, 0 is 'Never'

// --- THEMING SYSTEM ---

export interface ThemePalette {
  '100': string; '200': string; '300': string; '400': string; '500': string;
  '600': string; '700': string; '800': string; '900': string;
}

export interface Theme {
  name: string;
  isCustom?: boolean;
  font: {
    sans: string;
    mono: string;
  };
  colors: {
    primary: ThemePalette;
    dark: ThemePalette;
    glow: {
        start: string;
        end: string;
    }
  };
}

// --- NOTIFICATION & COMMAND SYSTEMS ---

export type NotificationType = 'success' | 'error' | 'info';

export interface Notification {
  id: number;
  message: string;
  type: NotificationType;
}

export interface Command {
  id:string;
  label: string;
  category: string;
  action: () => void;
  icon: React.ReactNode;
}