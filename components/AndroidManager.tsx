
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import type { DeviceInfo, AndroidPackage, AndroidFile } from '../types';
import * as api from '../services/apiService';
import { AndroidIcon, ChipIcon, PowerIcon, PackageIcon, ScrollIcon, InfoIcon, DatabaseIcon, ServerIcon, PauseIcon, PlayIcon, ClearIcon, FolderIcon, FileIcon, ChevronRightIcon, ChevronDownIcon, SearchIcon, GitPullIcon } from './Icons';

type Log = {
    id: number;
    level: 'I' | 'D' | 'W' | 'E' | 'V';
    line: string;
};

type ManagerTab = 'info' | 'packages' | 'files' | 'logcat';


// --- Sub-component: Disconnected State ---
const DisconnectedCover: React.FC<{ onConnect: () => void, isLoading: boolean, error: string | null }> = ({ onConnect, isLoading, error }) => (
    <div className="absolute inset-0 bg-dark-900/90 backdrop-blur-sm flex flex-col items-center justify-center z-10 p-4">
        <AndroidIcon className="w-20 h-20 text-primary-500/50 mb-4" />
        <h3 className="text-2xl font-bold text-gray-200">Android Manager</h3>
        <p className="text-gray-400 mt-1 mb-6">Connect to a device to begin.</p>
        <button
            onClick={onConnect}
            disabled={isLoading}
            className="bg-primary-500 hover:bg-primary-600 text-white font-bold py-2 px-6 rounded-md transition text-sm flex items-center space-x-2 disabled:opacity-50 disabled:cursor-wait"
        >
            {isLoading ? 'Connecting...' : 'Connect to Device'}
        </button>
        {error && <p className="text-red-400 text-sm mt-4">{error}</p>}
    </div>
);

// --- Sub-component: ProgressBar ---
const ProgressBar: React.FC<{ value: number; total: number; label: string; icon: React.ReactNode }> = ({ value, total, label, icon }) => {
    const percentage = total > 0 ? (value / total) * 100 : 0;
    return (
        <div>
            <div className="flex justify-between items-center mb-1 text-xs">
                <div className="flex items-center text-gray-400 space-x-2">
                    {icon}
                    <span>{label}</span>
                </div>
                <span className="font-mono">{value.toFixed(1)} / {total} GB</span>
            </div>
            <div className="w-full bg-dark-700 rounded-full h-1.5">
                <div className="bg-primary-500 h-1.5 rounded-full" style={{ width: `${percentage}%` }}></div>
            </div>
        </div>
    );
};

const SegmentedControl: React.FC<{ options: { id: string; label: string }[], value: string, onChange: (value: string) => void }> = ({ options, value, onChange }) => (
    <div className="segmented-control">
        {options.map(opt => (
            <button key={opt.id} onClick={() => onChange(opt.id)} className={value === opt.id ? 'active' : ''}>
                {opt.label}
            </button>
        ))}
    </div>
);

const FileTreeItem: React.FC<{ 
    node: AndroidFile; 
    level: number;
    openFolders: Set<string>;
    onToggleFolder: (path: string) => void;
    path: string;
}> = ({ node, level, openFolders, onToggleFolder, path }) => {
    const isFolder = node.type === 'folder';
    const isOpen = openFolders.has(path);

    const handleToggle = () => {
        if (isFolder) {
            onToggleFolder(path);
        }
    };
    
    return (
        <div>
            <div 
                className="flex items-center space-x-2 p-1.5 rounded-md hover:bg-dark-700/50 cursor-pointer"
                style={{ paddingLeft: `${level * 1.25 + 0.5}rem` }}
                onClick={handleToggle}
            >
                {isFolder ? (
                    isOpen ? <ChevronDownIcon className="w-4 h-4 text-gray-500 shrink-0" /> : <ChevronRightIcon className="w-4 h-4 text-gray-500 shrink-0" />
                ) : (
                    <FileIcon className="w-4 h-4 text-gray-500 shrink-0" />
                )}
                {isFolder ? <FolderIcon className="w-5 h-5 text-yellow-500 shrink-0"/> : <FileIcon className="w-5 h-5 text-gray-400 shrink-0"/>}
                <span className="text-gray-200 truncate flex-1">{node.name}</span>
                {!isFolder && <span className="text-xs text-gray-500 font-mono ml-auto">{node.size}</span>}
            </div>
            {isFolder && isOpen && node.children && (
                <div>
                    {node.children.map(child => (
                        <FileTreeItem 
                            key={child.name} 
                            node={child} 
                            level={level + 1} 
                            openFolders={openFolders}
                            onToggleFolder={onToggleFolder}
                            path={`${path}/${child.name}`}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};


// --- Main Component: AndroidManager ---
const AndroidManager: React.FC<{
    isDeviceConnected: boolean;
    setIsDeviceConnected: (isConnected: boolean) => void;
}> = ({ isDeviceConnected, setIsDeviceConnected }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [deviceInfo, setDeviceInfo] = useState<DeviceInfo | null>(null);
    const [packages, setPackages] = useState<AndroidPackage[]>([]);
    const [fileSystem, setFileSystem] = useState<AndroidFile[]>([]);
    const [openFolders, setOpenFolders] = useState<Set<string>>(new Set());
    const [logcat, setLogcat] = useState<Log[]>([]);
    const [packageFilter, setPackageFilter] = useState<'all' | 'user' | 'system'>('all');
    const [activeTab, setActiveTab] = useState<ManagerTab>('info');
    const [isLogcatPaused, setIsLogcatPaused] = useState(false);
    
    // Logcat state
    const [logFilter, setLogFilter] = useState('');
    const [logLevels, setLogLevels] = useState<Set<Log['level']>>(new Set(['V', 'D', 'I', 'W', 'E']));
    const [autoScroll, setAutoScroll] = useState(true);
    const logCounter = useRef(0);
    const logContainerRef = useRef<HTMLDivElement>(null);


    const handleConnect = async () => {
        setIsLoading(true);
        setError(null);
        try {
            await api.connectToDevice('192.168.1.100'); // Mock IP
            const [info, pkgs, files] = await Promise.all([api.getDeviceInfo(), api.getPackages(), api.getAndroidFileSystem()]);
            setDeviceInfo(info);
            setPackages(pkgs);
            setFileSystem(files);
            setIsDeviceConnected(true);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to connect');
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleDisconnect = () => {
        setIsDeviceConnected(false);
        setDeviceInfo(null);
        setPackages([]);
        setFileSystem([]);
        setLogcat([]);
        setOpenFolders(new Set());
        setError(null);
    };

    const handleReboot = async (mode: 'system' | 'recovery' | 'bootloader') => {
        if (window.confirm(`Are you sure you want to reboot the device into ${mode} mode?`)) {
            await api.rebootDevice(mode);
            handleDisconnect();
        }
    };

    const handleUninstall = async (pkgName: string) => {
        if (window.confirm(`Are you sure you want to uninstall ${pkgName}? This cannot be undone.`)) {
            await api.uninstallPackage(pkgName);
            setPackages(prev => prev.filter(p => p.name !== pkgName));
        }
    };
    
    const onToggleFolder = (path: string) => {
        setOpenFolders(prev => {
            const newSet = new Set(prev);
            if (newSet.has(path)) {
                newSet.delete(path);
            } else {
                newSet.add(path);
            }
            return newSet;
        });
    };

    useEffect(() => {
        let intervalId: ReturnType<typeof setInterval> | undefined;
        if (isDeviceConnected && !isLogcatPaused) {
            const logTypes: { level: Log['level']; prefix: string; }[] = [
                { level: 'I', prefix: 'WindowManager' }, { level: 'D', prefix: 'EGL_emulation' },
                { level: 'V', prefix: 'NativeCrypto' }, { level: 'W', prefix: 'ActivityManager' },
                { level: 'E', prefix: 'OpenGLRenderer' },
            ];
            const logMessages = ['Setting focus to null window', 'eglMakeCurrent: 0xeb48a600: ver 3 0', 'Read error: ssl=0x7b87163088: I/O error', 'Unable to start service Intent', 'ReliableSurface: perform: failed to ANativeWindow_perform(13)', 'uid=1000 system_server expire 4 lines'];
            
            intervalId = setInterval(() => {
                const randomType = logTypes[Math.floor(Math.random() * logTypes.length)];
                const randomMessage = logMessages[Math.floor(Math.random() * logMessages.length)];
                const timestamp = new Date().toISOString().substr(11, 12);
                const line = `${timestamp} ${Math.floor(Math.random() * 1000)}-${Math.floor(Math.random() * 1000)} ${randomType.level}/${randomType.prefix}: ${randomMessage}`;
                setLogcat(prev => [{ id: logCounter.current++, level: randomType.level, line }, ...prev].slice(0, 200));
            }, 800);
        }
        return () => clearInterval(intervalId);
    }, [isDeviceConnected, isLogcatPaused]);

    const filteredPackages = packages.filter(pkg => packageFilter === 'all' || pkg.type === packageFilter);

    // Logcat filtering logic
    const filteredLogs = useMemo(() => {
        return logcat.filter(log => {
            const levelMatch = logLevels.has(log.level);
            const filterMatch = logFilter.trim() === '' || log.line.toLowerCase().includes(logFilter.toLowerCase());
            return levelMatch && filterMatch;
        }).reverse(); // reverse for correct display order
    }, [logcat, logLevels, logFilter]);
    
    useEffect(() => {
        if (autoScroll && logContainerRef.current) {
            logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
        }
    }, [filteredLogs, autoScroll]);

    const handleLogScroll = () => {
        if (logContainerRef.current) {
            const { scrollTop, scrollHeight, clientHeight } = logContainerRef.current;
            const isAtBottom = scrollHeight - scrollTop - clientHeight < 1;
            if (!isAtBottom) {
                setAutoScroll(false);
            }
        }
    };

    const toggleLogLevel = (level: Log['level']) => {
        setLogLevels(prev => {
            const newLevels = new Set(prev);
            if (newLevels.has(level)) {
                newLevels.delete(level);
            } else {
                newLevels.add(level);
            }
            return newLevels;
        });
    };

    const logColorMap: Record<Log['level'], string> = {
        I: 'text-gray-300', D: 'text-blue-400', W: 'text-yellow-400', E: 'text-red-400', V: 'text-cyan-400',
    };
    
    const logLevelButtonColors: Record<Log['level'], { active: string; inactive: string; }> = {
        V: { active: 'bg-cyan-500 text-white', inactive: 'bg-dark-700 text-gray-400 hover:bg-dark-600' },
        D: { active: 'bg-blue-500 text-white', inactive: 'bg-dark-700 text-gray-400 hover:bg-dark-600' },
        I: { active: 'bg-gray-500 text-white', inactive: 'bg-dark-700 text-gray-400 hover:bg-dark-600' },
        W: { active: 'bg-yellow-500 text-white', inactive: 'bg-dark-700 text-gray-400 hover:bg-dark-600' },
        E: { active: 'bg-red-500 text-white', inactive: 'bg-dark-700 text-gray-400 hover:bg-dark-600' },
    };


    const renderTabContent = () => {
        switch (activeTab) {
            case 'info':
                return (
                    <div className="space-y-6">
                         <div className="bg-dark-800 border border-dark-700 rounded-lg p-4">
                            <h3 className="font-bold text-gray-200 flex items-center mb-3"><InfoIcon className="w-5 h-5 mr-2 text-gray-400" />Device Information</h3>
                            {deviceInfo ? (
                                <div className="space-y-3">
                                    <div className="space-y-2 text-sm font-mono">
                                        <p><strong className="text-gray-400 w-32 inline-block">Model:</strong> {deviceInfo.model}</p>
                                        <p><strong className="text-gray-400 w-32 inline-block">Android Ver:</strong> {deviceInfo.androidVersion}</p>
                                        <p><strong className="text-gray-400 w-32 inline-block">Root Status:</strong> <span className={deviceInfo.rootStatus === 'Rooted' ? 'text-green-400' : 'text-yellow-400'}>{deviceInfo.rootStatus}</span></p>
                                    </div>
                                    <div className="pt-2 border-t border-dark-700 space-y-3">
                                        <ProgressBar label="Storage" value={deviceInfo.storageUsed} total={deviceInfo.storageTotal} icon={<DatabaseIcon className="w-4 h-4" />} />
                                        <ProgressBar label="Memory" value={deviceInfo.memoryUsed} total={deviceInfo.memoryTotal} icon={<ServerIcon className="w-4 h-4" />} />
                                    </div>
                                </div>
                            ) : <p className="text-gray-500 text-sm">Waiting for connection...</p>}
                        </div>
                         <div className="bg-dark-800 border border-dark-700 rounded-lg p-4">
                            <h3 className="font-bold text-gray-200 flex items-center mb-3"><PowerIcon className="w-5 h-5 mr-2 text-gray-400" />Power Controls</h3>
                             <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                <button onClick={() => handleReboot('system')} className="bg-dark-700 hover:bg-dark-600 text-gray-300 p-2 rounded-md text-sm transition">Reboot</button>
                                <button onClick={() => handleReboot('recovery')} className="bg-dark-700 hover:bg-dark-600 text-gray-300 p-2 rounded-md text-sm transition">Reboot Recovery</button>
                                <button onClick={() => handleReboot('bootloader')} className="bg-dark-700 hover:bg-dark-600 text-gray-300 p-2 rounded-md text-sm transition">Reboot Bootloader</button>
                             </div>
                        </div>
                    </div>
                );
            case 'packages':
                return (
                    <div className="bg-dark-800 border border-dark-700 rounded-lg p-4 flex-1 flex flex-col min-h-0">
                        <div className="flex-shrink-0">
                            <SegmentedControl options={[{id: 'all', label: 'All'}, {id: 'user', label: 'User'}, {id: 'system', label: 'System'}]} value={packageFilter} onChange={(v) => setPackageFilter(v as any)} />
                        </div>
                        <div className="flex-1 overflow-y-auto space-y-1 pr-1 text-sm mt-2">
                            {filteredPackages.length > 0 ? filteredPackages.map(pkg => (
                                <div key={pkg.name} className="flex items-center p-1.5 rounded hover:bg-dark-700/50">
                                    <span className={`font-mono truncate flex-1 ${pkg.type === 'system' ? 'text-gray-400' : 'text-gray-200'}`}>{pkg.name}</span>
                                    <button onClick={() => handleUninstall(pkg.name)} className="text-red-500/80 hover:text-red-500 text-xs ml-2">Uninstall</button>
                                </div>
                            )) : <p className="text-gray-500 text-sm p-4 text-center">No packages found.</p>}
                        </div>
                    </div>
                );
            case 'files':
                return (
                     <div className="bg-dark-800 border border-dark-700 rounded-lg p-4 flex-1 flex flex-col min-h-0">
                        <div className="flex-1 overflow-y-auto pr-2">
                            {fileSystem.map(node => (
                                <FileTreeItem 
                                    key={node.name}
                                    node={node}
                                    level={0}
                                    openFolders={openFolders}
                                    onToggleFolder={onToggleFolder}
                                    path={node.name}
                                />
                            ))}
                        </div>
                     </div>
                );
            case 'logcat':
                 return (
                     <div className="bg-dark-800 border border-dark-700 rounded-lg p-4 flex-1 flex flex-col min-h-0">
                        <div className="flex justify-between items-center mb-3 flex-shrink-0 gap-4">
                           <div className="relative flex-1">
                                <SearchIcon className="w-4 h-4 text-gray-500 absolute top-1/2 left-3 -translate-y-1/2"/>
                                <input type="text" placeholder="Filter logs..." value={logFilter} onChange={e => setLogFilter(e.target.value)} className="w-full bg-dark-900 border border-dark-700 text-white rounded-md py-1.5 pl-9 pr-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500"/>
                           </div>
                            <div className="flex items-center space-x-1">
                                {(['V', 'D', 'I', 'W', 'E'] as const).map(level => (
                                    <button
                                        key={level}
                                        onClick={() => toggleLogLevel(level)}
                                        className={`w-6 h-6 rounded text-xs font-bold flex items-center justify-center transition ${logLevels.has(level) ? logLevelButtonColors[level].active : logLevelButtonColors[level].inactive}`}
                                        title={`Toggle ${level} Logs`}
                                    >
                                        {level}
                                    </button>
                                ))}
                            </div>
                            <div className="flex items-center space-x-3">
                                <button onClick={() => setAutoScroll(!autoScroll)} className={`transition ${autoScroll ? 'text-primary-400' : 'text-gray-500 hover:text-white'}`} title={autoScroll ? "Auto-scroll On" : "Auto-scroll Off"}>
                                    <GitPullIcon className="w-5 h-5" />
                                </button>
                                <button onClick={() => setIsLogcatPaused(!isLogcatPaused)} className="text-gray-400 hover:text-white transition" title={isLogcatPaused ? "Resume Log" : "Pause Log"}>
                                    {isLogcatPaused ? <PlayIcon className="w-5 h-5" /> : <PauseIcon className="w-5 h-5" />}
                                </button>
                                <button onClick={() => setLogcat([])} className="text-gray-400 hover:text-white transition" title="Clear Log">
                                    <ClearIcon className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                        <div ref={logContainerRef} onScroll={handleLogScroll} className="bg-dark-900 rounded p-2 flex-1 overflow-y-auto font-mono text-xs space-y-1">
                            {filteredLogs.length > 0 ? filteredLogs.map((log) => (
                                <p key={log.id} className={`whitespace-pre-wrap ${logColorMap[log.level]}`}>{log.line}</p>
                            )) : <p className="text-gray-500 text-center py-4">Waiting for logs or no logs match filter...</p>}
                        </div>
                    </div>
                 );
            default: return null;
        }
    }


    return (
        <div className="flex-1 flex flex-col bg-dark-900 p-6 overflow-hidden">
            <div className="flex justify-between items-center mb-4 flex-shrink-0">
                 <div className="w-full max-w-lg">
                     <SegmentedControl 
                        options={[
                            {id: 'info', label: 'Device Info'},
                            {id: 'packages', label: 'Packages'},
                            {id: 'files', label: 'File System'},
                            {id: 'logcat', label: 'Logcat'}
                        ]} 
                        value={activeTab} 
                        onChange={(v) => setActiveTab(v as ManagerTab)} />
                 </div>
                {isDeviceConnected && (
                     <button onClick={handleDisconnect} className="bg-dark-700 hover:bg-dark-600 text-gray-300 font-bold py-2 px-4 rounded-md transition text-sm">
                        Disconnect
                    </button>
                )}
            </div>

            <div className="relative flex-1 overflow-y-auto pr-2">
                {!isDeviceConnected && <DisconnectedCover onConnect={handleConnect} isLoading={isLoading} error={error} />}
                {isDeviceConnected && renderTabContent()}
            </div>
        </div>
    );
};

export default AndroidManager;