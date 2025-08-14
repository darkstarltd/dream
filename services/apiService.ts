
import type { SyncHubData, DeviceInfo, AndroidPackage, AndroidFile, CodeIssue, VaultEntry, ChatMessage } from '../types';

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// --- Sync Hub Service ---
export async function getSyncHubData(): Promise<SyncHubData> {
    await sleep(600);
    return {
        git: {
            not_added: ['new-feature.ts', 'docs/guide.md'],
            conflicted: [],
            created: [],
            deleted: ['old-styles.css'],
            modified: ['App.tsx', 'components/SyncHub.tsx'],
            renamed: [{ from: 'utils.js', to: 'utils/helpers.js'}],
            staged: ['App.tsx', 'package.json'],
            files: [
                { path: 'App.tsx', index: 'M', working_dir: ' ' },
                { path: 'package.json', index: 'M', working_dir: ' ' },
                { path: 'new-feature.ts', index: '?', working_dir: '?' },
                { path: 'docs/guide.md', index: '?', working_dir: '?' },
                { path: 'old-styles.css', index: 'D', working_dir: 'D' },
                { path: 'components/SyncHub.tsx', index: ' ', working_dir: 'M' },
                { path: 'utils/helpers.js', index: 'R', working_dir: ' '},
            ],
            ahead: 3,
            behind: 1,
            current: 'feature/new-sync-hub',
            tracking: 'origin/feature/new-sync-hub',
        },
        gists: [
            { id: 'gist_1', name: 'my-utility-script.js', type: 'gist', modified: '2 days ago', size: '1.2 KB' },
            { id: 'gist_2', name: 'nginx-config.conf', type: 'gist', modified: '1 week ago', size: '3.5 KB' },
        ],
        dropboxFiles: [
             { id: 'db_1', name: 'project-backup-latest.zip', type: 'dropbox', modified: '4 hours ago', size: '25.8 MB' },
             { id: 'db_2', name: 'design-assets.fig', type: 'dropbox', modified: '3 weeks ago', size: '150.2 MB' },
        ],
        activity: [
            { id: 'act_1', type: 'commit', message: 'feat: Implement new Sync Hub UI', time: '2 hours ago' },
            { id: 'act_2', type: 'push', message: 'Pushed 3 commits to origin', time: '1 hour ago' },
            { id: 'act_3', type: 'dropbox', message: 'Uploaded project-backup-latest.zip', time: '4 hours ago' },
            { id: 'act_4', type: 'gist', message: 'Created my-utility-script.js', time: '2 days ago' },
            { id: 'act_5', type: 'pull', message: 'Pulled changes from origin', time: '5 days ago' },
        ]
    };
}

export async function gitCommit(message: string, files: string[]): Promise<{ ok: boolean }> {
    await sleep(1000);
    console.log(`GIT COMMIT: "${message}"\nFiles: ${files.join(', ')}`);
    return { ok: true };
}

export async function gitPull(): Promise<{ summary: any }> {
    await sleep(1500);
    console.log(`GIT PULL`);
    return { summary: { changes: 2, insertions: 23, deletions: 5 } };
}

export async function gitPush(): Promise<{ ok: boolean }> {
    await sleep(2000);
    console.log(`GIT PUSH`);
    return { ok: true };
}

// --- Android Manager Service ---
export async function getAndroidFileSystem(): Promise<AndroidFile[]> {
    await sleep(400);
    return [
        { name: 'data', type: 'folder', children: [
            { name: 'app', type: 'folder', children: [] },
            { name: 'local', type: 'folder', children: [] },
        ]},
        { name: 'system', type: 'folder', children: [
            { name: 'app', type: 'folder' },
            { name: 'bin', type: 'folder' },
            { name: 'etc', type: 'folder', children: [{name: 'hosts', type: 'file', size: '1 KB'}] },
            { name: 'build.prop', type: 'file', size: '7 KB', modified: '2024-05-01' },
        ]},
        { name: 'sdcard', type: 'folder', children: [
            { name: 'Download', type: 'folder' },
            { name: 'DCIM', type: 'folder', children: [{name: 'camera_roll.jpg', type: 'file', size: '4.1 MB' }] },
            { name: 'documents', type: 'folder', children: [{name: 'report.pdf', type: 'file', size: '1.2 MB' }] },
        ]},
    ];
}

export async function getPackages(): Promise<AndroidPackage[]> {
    await sleep(800);
    const packages: AndroidPackage[] = [
        { name: 'com.google.android.youtube', type: 'system' }, { name: 'com.android.chrome', type: 'system' },
        { name: 'com.vanced.manager', type: 'user' }, { name: 'org.thoughtcrime.securesms', type: 'user' },
        { name: 'com.google.android.gm', type: 'system' }, { name: 'com.termux', type: 'user' },
    ];
    return packages.sort((a, b) => a.name.localeCompare(b.name));
}

export async function connectToDevice(ip: string): Promise<{ success: boolean }> {
    await sleep(1200);
    console.log(`Connecting to device at ${ip}...`);
    return { success: true };
}

export async function getDeviceInfo(): Promise<DeviceInfo> {
    await sleep(500);
    return {
        model: 'Pixel 8 Pro', androidVersion: '14 (Upside Down Cake)', sdkVersion: '34',
        kernelVersion: '6.1.21-gdd45f3e', rootStatus: 'Rooted', storageUsed: 78.5,
        storageTotal: 128, memoryUsed: 7.2, memoryTotal: 12, cpuGovernor: 'schedutil',
    };
}

export async function rebootDevice(mode: 'system' | 'recovery' | 'bootloader'): Promise<{ ok: boolean }> {
    await sleep(1000);
    console.log(`Rebooting device into ${mode} mode...`);
    return { ok: true };
}

export async function uninstallPackage(packageName: string): Promise<{ ok: boolean }> {
    await sleep(800);
    console.log(`Uninstalling package: ${packageName}`);
    return { ok: true };
}


// --- Code Scanner Service ---
export function scanCode(code: string): Promise<CodeIssue[]> {
    return new Promise(resolve => {
        setTimeout(() => {
            const issues: CodeIssue[] = [];
            if (code.includes('dangerouslySetInnerHTML')) {
                issues.push({ id: 'S01', line: code.split('\n').findIndex(l => l.includes('dangerouslySetInnerHTML')) + 1, severity: 'Critical', title: 'Potential XSS Vulnerability', description: '`dangerouslySetInnerHTML` can expose your application to cross-site scripting (XSS) attacks if the content is not properly sanitized.', suggestion: 'Avoid using this property. If necessary, use a library like DOMPurify to sanitize HTML content before rendering.' });
            }
            if (code.match(/var\s/)) {
                issues.push({ id: 'W01', line: code.split('\n').findIndex(l => l.match(/var\s/) !== null) + 1, severity: 'Warning', title: 'Legacy Variable Declaration', description: 'The `var` keyword is function-scoped and can lead to unexpected behavior due to hoisting.', suggestion: 'Use `let` for variables that will be reassigned, or `const` for variables that will not.' });
            }
            if (code.includes('useEffect(() => {}, [])')) {
                issues.push({ id: 'P01', line: code.split('\n').findIndex(l => l.includes('useEffect(() => {}, [])')) + 1, severity: 'Warning', title: 'Potentially Unnecessary Effect', description: 'An empty `useEffect` with an empty dependency array runs only once on mount. Ensure this is the intended behavior and not a placeholder.', suggestion: 'If the effect is truly unnecessary, remove it. If it should run on updates, add the appropriate dependencies.' });
            }
            if (code.split('\n').some(l => l.length > 120)) {
                issues.push({ id: 'I01', line: code.split('\n').findIndex(l => l.length > 120) + 1, severity: 'Info', title: 'Line Length Exceeds Convention', description: 'Long lines can be harder to read and may not conform to team style guides.', suggestion: 'Consider refactoring long lines of code for better readability. A common convention is to keep lines under 80 or 100 characters.' });
            }
            if (!code) {
                resolve([]);
                return;
            }
            if (issues.length === 0) {
                issues.push({ id: 'OK01', line: 1, severity: 'Info', title: 'No Major Issues Found', description: 'The mock scan completed without finding any critical or common warning-level issues.', suggestion: 'This is a mock scan. For a real analysis, integrate a tool like SonarLint or ESLint.' });
            }
            resolve(issues);
        }, 1800);
    });
}