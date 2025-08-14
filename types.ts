

export interface VaultEntry {
  id: string;
  title: string;
  username: string;
  password?: string;
  url?: string;
  notes?: string;
  tags?: string[];
  isFavorite?: boolean;
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

// --- ENVIRONMENT MANAGER ---
export interface EnvVariable {
  id: string;
  key: string;
  value: string;
  isHidden?: boolean;
}

export interface EnvFile {
  id: string;
  name: string;
  variables: EnvVariable[];
}

// --- API LAB ---
export interface ApiHeader {
  id: string;
  key: string;
  value: string;
  enabled: boolean;
}

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS';

export interface TestResult {
  name: string;
  passed: boolean;
}

export interface ApiRequest {
  method: HttpMethod;
  url: string;
  headers: ApiHeader[];
  body: string; // JSON string
  preRequestScript?: string;
  testScript?: string;
}

export interface ApiResponse {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: any; // Parsed JSON
  size: number; // in bytes
  duration: number; // in ms
  testResults?: TestResult[];
}

export interface ApiHistoryEntry {
  id: string;
  request: ApiRequest;
  timestamp: number;
  status: number;
}

// --- MARKDOWN NOTES ---
export interface MarkdownNote {
  id: string;
  title: string;
  content: string;
  createdAt: number;
  updatedAt: number;
}

// --- REGEX TESTER ---
export interface RegexMatch {
  match: string;
  index: number;
  groups: string[];
}

// --- TASK RUNNER ---
export interface Task {
  id: string;
  name: string;
  command: string;
  envFileId: string | 'none';
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