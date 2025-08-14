

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { getSyncHubData, gitCommit, gitPull, gitPush, getGitFileDiff } from '../services/apiService';
import type { SyncHubData, GitData, CloudFile, SyncActivity } from '../types';
import { CommitIcon, GitBranchIcon, GitPullIcon, GitPushIcon, RefreshIcon, FileIcon, ModifiedIcon, AddedIcon, DeletedIcon, RenamedIcon, SyncIcon, DropboxIcon, GistIcon, CheckIcon, PullRequestIcon, GitHubIcon, AddIcon, XCircleIcon, DiffIcon } from './Icons';
import { useNotification } from '../App';
import SkeletonLoader from './SkeletonLoader';
import DiffViewer from './DiffViewer';


type Source = 'git' | 'gists' | 'dropbox';

// --- Diff Modal ---
const DiffModal: React.FC<{
    filePath: string;
    onClose: () => void;
}> = ({ filePath, onClose }) => {
    const [diffContent, setDiffContent] = useState<{ before: string, after: string } | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        setIsLoading(true);
        getGitFileDiff(filePath).then(data => {
            setDiffContent(data);
            setIsLoading(false);
        });
    }, [filePath]);

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-dark-800 border border-dark-700 rounded-lg shadow-2xl w-full max-w-4xl h-[80vh] flex flex-col animate-scale-in" onClick={e => e.stopPropagation()}>
                <div className="flex-shrink-0 p-4 border-b border-dark-700 flex justify-between items-center">
                    <h3 className="text-lg font-bold text-white font-mono flex items-center">
                        <DiffIcon className="w-5 h-5 mr-3 text-primary-400"/>
                        Changes for {filePath}
                    </h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-white"><XCircleIcon className="w-6 h-6"/></button>
                </div>
                <div className="flex-1 p-2 overflow-auto">
                    {isLoading && <SkeletonLoader className="h-full w-full"/>}
                    {diffContent && (
                        <DiffViewer 
                            originalText={diffContent.before}
                            changedText={diffContent.after}
                            isModalView={true}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};


// --- GitHub Connect Pane ---
const GitHubConnectPane: React.FC<{ onConnect: () => void; isConnecting: boolean; }> = ({ onConnect, isConnecting }) => (
    <div className="flex-1 flex items-center justify-center p-6 bg-dark-900">
        <div className="text-center bg-dark-800 p-10 rounded-lg border border-dark-700 max-w-lg w-full shadow-2xl shadow-black/30 animate-scale-in">
            <GitHubIcon className="w-16 h-16 mx-auto text-gray-500 mb-6" />
            <h2 className="text-2xl font-bold text-white">Connect to GitHub</h2>
            <p className="text-gray-400 mt-2 mb-8">
                Authorize Dream Studio to access your repositories and Gists for a seamless sync experience.
            </p>
            <button 
                onClick={onConnect} 
                disabled={isConnecting}
                className="w-full bg-gray-200 hover:bg-white text-black font-bold py-3 px-4 rounded-md text-sm flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-wait"
            >
                <GitHubIcon className="w-5 h-5" />
                <span>{isConnecting ? 'Connecting...' : 'Sign in with GitHub'}</span>
            </button>
        </div>
    </div>
);


// --- Git Components ---
const GitFileItem: React.FC<{ path: string; status: string; onToggle: () => void; isStaged: boolean; onViewChanges: (path: string) => void; }> = ({ path, status, onToggle, isStaged, onViewChanges }) => {
    const statusMap: { [key: string]: { color: string; icon: React.ReactNode; text: string } } = {
        'M': { color: 'text-yellow-400', icon: <ModifiedIcon className="w-3.5 h-3.5" />, text: 'Modified' },
        'A': { color: 'text-green-400', icon: <AddedIcon className="w-3.5 h-3.5" />, text: 'Added' },
        'D': { color: 'text-red-400', icon: <DeletedIcon className="w-3.5 h-3.5" />, text: 'Deleted' },
        'R': { color: 'text-blue-400', icon: <RenamedIcon className="w-3.5 h-3.5" />, text: 'Renamed' },
        '?': { color: 'text-cyan-400', icon: <FileIcon className="w-3.5 h-3.5" />, text: 'Untracked' },
    };
    const s = statusMap[status] || { color: 'text-gray-400', icon: <FileIcon className="w-3.5 h-3.5" />, text: 'Unchanged' };

    return (
        <div className="flex items-center space-x-3 pl-3 pr-1 py-1.5 rounded-md hover:bg-dark-700/50 group">
            <span className={`${s.color} flex-shrink-0`}>{s.icon}</span>
            <span className="font-mono text-sm text-gray-300 flex-1 truncate">{path}</span>
            <div className="flex items-center opacity-0 group-hover:opacity-100">
                {status === 'M' && (
                     <button onClick={() => onViewChanges(path)} className="text-gray-500 hover:text-primary-400 p-1" data-tooltip="View Changes">
                         <DiffIcon className="w-4 h-4" />
                     </button>
                )}
                <button onClick={onToggle} className="text-gray-500 hover:text-primary-400 p-1" data-tooltip={isStaged ? "Unstage" : "Stage"}>
                    {isStaged ? <DeletedIcon className="w-4 h-4" /> : <AddIcon className="w-4 h-4" />}
                </button>
            </div>
        </div>
    );
};

const GitPane: React.FC<{ data: GitData; onAction: (action: () => Promise<any>, actionName: string) => Promise<void> }> = ({ data, onAction }) => {
    const [commitMessage, setCommitMessage] = useState('');
    const [stagedFiles, setStagedFiles] = useState<string[]>(data.staged);
    const [isActing, setIsActing] = useState<string | null>(null);
    const [diffingFile, setDiffingFile] = useState<string | null>(null);
    
    const allFilePaths = useMemo(() => data.files.map(f => f.path), [data.files]);
    const fileStatusMap = useMemo(() => Object.fromEntries(
        data.files.map(f => [f.path, f.working_dir === ' ' ? f.index : f.working_dir])
    ), [data.files]);

    const filesToDisplay = useMemo(() => {
        const unstaged = allFilePaths.filter(path => !stagedFiles.includes(path));
        const staged = allFilePaths.filter(path => stagedFiles.includes(path));
        return { staged, unstaged };
    }, [allFilePaths, stagedFiles]);


    const handleCommit = async () => {
        if (!commitMessage || stagedFiles.length === 0) return;
        setIsActing('commit');
        await onAction(() => gitCommit(commitMessage, stagedFiles), 'Commit');
        setCommitMessage('');
        setIsActing(null);
    };

    const handleAction = async (action: 'pull' | 'push' | 'pr') => {
        setIsActing(action);
        await onAction(() => {
            if (action === 'pull') return gitPull();
            if (action === 'push') return gitPush();
            return Promise.resolve(); // Mock for PR
        }, action.toUpperCase());
        setIsActing(null);
    };
    
    const toggleStaging = (file: string) => {
        setStagedFiles(prev => prev.includes(file) ? prev.filter(f => f !== file) : [...prev, file]);
    };
    
    const stageAll = () => setStagedFiles(allFilePaths);
    const unstageAll = () => setStagedFiles([]);

    return (
        <>
            {diffingFile && <DiffModal filePath={diffingFile} onClose={() => setDiffingFile(null)} />}
            <div className="flex-1 overflow-y-auto pr-2 space-y-4">
                 <div>
                    <div className="flex justify-between items-center mb-2 px-1">
                        <h3 className="text-sm font-semibold text-gray-400">Staged Changes ({filesToDisplay.staged.length})</h3>
                        <button onClick={unstageAll} className="text-xs text-primary-400 hover:underline">Unstage All</button>
                    </div>
                    <div className="space-y-1 bg-dark-900/50 rounded-md p-1">
                        {filesToDisplay.staged.length > 0 ? filesToDisplay.staged.map((path, i) => (
                           <div key={path} className="animate-stagger-in" style={{animationDelay: `${i * 20}ms`}}>
                             <GitFileItem path={path} status={fileStatusMap[path]} isStaged={true} onToggle={() => toggleStaging(path)} onViewChanges={setDiffingFile} />
                           </div>
                        )) : <p className="text-xs text-center text-gray-500 py-2">No staged changes</p>}
                    </div>
                </div>
                 <div>
                    <div className="flex justify-between items-center mb-2 px-1">
                        <h3 className="text-sm font-semibold text-gray-400">Changes ({filesToDisplay.unstaged.length})</h3>
                        <button onClick={stageAll} className="text-xs text-primary-400 hover:underline">Stage All</button>
                    </div>
                    <div className="space-y-1 bg-dark-900/50 rounded-md p-1">
                       {filesToDisplay.unstaged.length > 0 ? filesToDisplay.unstaged.map((path, i) => (
                           <div key={path} className="animate-stagger-in" style={{animationDelay: `${i * 20}ms`}}>
                             <GitFileItem path={path} status={fileStatusMap[path]} isStaged={false} onToggle={() => toggleStaging(path)} onViewChanges={setDiffingFile}/>
                           </div>
                        )) : <p className="text-xs text-center text-gray-500 py-2">No unstaged changes</p>}
                    </div>
                </div>
            </div>
            <div className="mt-auto pt-4 space-y-3 border-t border-dark-700">
                <input type="text" placeholder="Commit message..." value={commitMessage} onChange={e => setCommitMessage(e.target.value)} className="w-full bg-dark-900 border border-dark-600 text-white rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm" />
                <button onClick={handleCommit} disabled={isActing !== null || !commitMessage || stagedFiles.length === 0} className="w-full bg-primary-500 hover:bg-primary-600 text-white font-bold py-2 px-4 rounded-md text-sm flex items-center justify-center space-x-2 disabled:opacity-50">
                    <CommitIcon className="w-4 h-4" />
                    <span>{isActing === 'commit' ? 'Committing...' : `Commit ${stagedFiles.length} file(s)`}</span>
                </button>
                <div className="flex space-x-2">
                    <button onClick={() => handleAction('pull')} disabled={isActing !== null} className="flex-1 bg-dark-700 hover:bg-dark-600 text-gray-300 p-2 rounded-md text-sm flex items-center justify-center space-x-2 disabled:opacity-50">
                        <GitPullIcon className="w-4 h-4" /><span>Pull ({data.behind})</span>
                    </button>
                    <button onClick={() => handleAction('push')} disabled={isActing !== null} className="flex-1 bg-dark-700 hover:bg-dark-600 text-gray-300 p-2 rounded-md text-sm flex items-center justify-center space-x-2 disabled:opacity-50">
                        <GitPushIcon className="w-4 h-4" /><span>Push ({data.ahead})</span>
                    </button>
                     <button onClick={() => handleAction('pr')} disabled={isActing !== null || data.ahead === 0} className="flex-1 bg-green-500/20 hover:bg-green-500/30 text-green-300 p-2 rounded-md text-sm flex items-center justify-center space-x-2 disabled:opacity-50 disabled:bg-dark-700/50 disabled:text-gray-500">
                        <PullRequestIcon className="w-4 h-4" /><span>Create PR</span>
                    </button>
                </div>
            </div>
        </>
    );
};


const CloudFileItem: React.FC<{ file: CloudFile }> = ({ file }) => {
    const icon = file.type === 'gist' 
        ? <GistIcon className="w-5 h-5 text-gray-400" /> 
        : <DropboxIcon className="w-5 h-5 text-blue-400" />;
    return (
        <div className="flex items-center space-x-3 p-2 rounded-md hover:bg-dark-700/50">
            <div className="flex-shrink-0 w-6 flex items-center justify-center">{icon}</div>
            <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-300 truncate">{file.name}</p>
                <p className="text-xs text-gray-500">{file.size} - {file.modified}</p>
            </div>
        </div>
    );
};

const LoadingSkeleton: React.FC = () => (
     <div className="grid grid-cols-12 gap-6 p-6 flex-1 overflow-hidden">
        <div className="col-span-3 bg-dark-800 rounded-lg border border-dark-700 p-4 flex flex-col space-y-4">
            <SkeletonLoader className="h-6 w-3/4" />
            <SkeletonLoader className="h-4 w-full" />
            <SkeletonLoader className="h-4 w-full" />
            <SkeletonLoader className="h-4 w-2/3" />
            <div className="mt-auto pt-4 border-t border-dark-700">
                <SkeletonLoader className="h-10 w-full" />
            </div>
        </div>
        <div className="col-span-5 bg-dark-800 rounded-lg border border-dark-700 p-4 flex flex-col space-y-4">
            <SkeletonLoader className="h-5 w-1/2" />
            <SkeletonLoader className="h-20 w-full" />
            <SkeletonLoader className="h-5 w-1/2" />
            <SkeletonLoader className="h-20 w-full" />
            <div className="mt-auto pt-4 border-t border-dark-700 space-y-2">
                 <SkeletonLoader className="h-10 w-full" />
                 <SkeletonLoader className="h-10 w-full" />
            </div>
        </div>
        <div className="col-span-4 bg-dark-800 rounded-lg border border-dark-700 p-4 flex flex-col space-y-4">
            <SkeletonLoader className="h-6 w-1/3" />
            <SkeletonLoader className="h-8 w-full" />
            <SkeletonLoader className="h-16 w-full" />
             <div className="flex-1 border-t border-dark-700 mt-4 pt-4 space-y-2">
                <SkeletonLoader className="h-6 w-1/2" />
                <SkeletonLoader className="h-8 w-full" />
                <SkeletonLoader className="h-8 w-full" />
             </div>
        </div>
    </div>
);


// --- Main Hub Component ---
const SyncHub: React.FC<{
    isGitHubAuthenticated: boolean;
    setIsGitHubAuthenticated: (isAuthed: boolean) => void;
}> = ({ isGitHubAuthenticated, setIsGitHubAuthenticated }) => {
    const [data, setData] = useState<SyncHubData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeCloudSource, setActiveCloudSource] = useState<'gists' | 'dropbox'>('gists');
    const [isConnecting, setIsConnecting] = useState(false);
    const addNotification = useNotification();


    const fetchData = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const newData = await getSyncHubData();
            setData(newData);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch data');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        if (isGitHubAuthenticated) {
            fetchData();
        }
    }, [isGitHubAuthenticated, fetchData]);

    const handleConnect = async () => {
        setIsConnecting(true);
        // In a real application, this is where you would trigger the OAuth flow.
        await new Promise(resolve => setTimeout(resolve, 2000));
        addNotification('Successfully connected to GitHub!', 'success');
        setIsConnecting(false);
        setIsGitHubAuthenticated(true);
    };

    const handleGitAction = async (action: () => Promise<any>, actionName: string) => {
        try {
            await action();
            addNotification(`Git ${actionName} successful.`, 'success');
            await fetchData();
        } catch(e) {
            addNotification(`Git ${actionName} failed.`, 'error');
        }
    };

    const cloudFilesToShow = activeCloudSource === 'gists' ? data?.gists : data?.dropboxFiles;

    if (!isGitHubAuthenticated) {
        return <GitHubConnectPane onConnect={handleConnect} isConnecting={isConnecting} />;
    }
    
    if (isLoading) {
        return <div className="flex-1 flex flex-col bg-dark-900 overflow-hidden"><LoadingSkeleton /></div>
    }

    return (
        <div className="flex-1 flex flex-col bg-dark-900 overflow-hidden">
            <div className="grid grid-cols-12 gap-6 p-6 flex-1 overflow-hidden">
                {/* Left Column: Repo Info & Actions */}
                <div className="col-span-3 bg-dark-800 rounded-lg border border-dark-700 p-4 flex flex-col">
                    <h3 className="text-lg font-bold text-gray-200 mb-4 flex items-center">
                        <GitBranchIcon className="w-5 h-5 mr-2 text-primary-400" />
                        Repository
                    </h3>
                    {data?.git && (
                        <div className="text-sm space-y-2 font-mono">
                           <p><strong className="text-gray-400">Current:</strong> {data.git.current}</p>
                           <p><strong className="text-gray-400">Tracking:</strong> {data.git.tracking}</p>
                           <p><strong className="text-gray-400">Ahead:</strong> {data.git.ahead}</p>
                           <p><strong className="text-gray-400">Behind:</strong> {data.git.behind}</p>
                        </div>
                    )}
                    <div className="mt-auto pt-4 border-t border-dark-700">
                         <button onClick={fetchData} disabled={isLoading} className="w-full bg-dark-700 hover:bg-dark-600 text-gray-300 font-bold py-2 px-4 rounded-md text-sm flex items-center justify-center space-x-2 disabled:opacity-50">
                            <RefreshIcon className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`}/>
                            <span>{isLoading ? 'Refreshing...' : 'Refresh'}</span>
                        </button>
                    </div>
                </div>
                {/* Middle Column: Changes */}
                <div className="col-span-5 bg-dark-800 rounded-lg border border-dark-700 p-4 flex flex-col overflow-hidden">
                    {data && <GitPane data={data.git} onAction={handleGitAction} />}
                </div>
                {/* Right Column: Cloud & Activity */}
                <div className="col-span-4 bg-dark-800 rounded-lg border border-dark-700 p-4 flex flex-col overflow-hidden">
                     <div className="flex-1 flex flex-col min-h-0">
                         <h3 className="text-lg font-bold text-gray-200 mb-2">Cloud Sync</h3>
                        <div className="segmented-control mb-3">
                            <button onClick={() => setActiveCloudSource('gists')} className={activeCloudSource === 'gists' ? 'active' : ''}>Gists</button>
                            <button onClick={() => setActiveCloudSource('dropbox')} className={activeCloudSource === 'dropbox' ? 'active' : ''}>Dropbox</button>
                        </div>
                         <div className="flex-1 overflow-y-auto pr-2 space-y-1">
                            {cloudFilesToShow && cloudFilesToShow.length > 0 ? (
                                cloudFilesToShow.map((file, i) => 
                                    <div key={file.id} className="animate-stagger-in" style={{animationDelay: `${i * 30}ms`}}>
                                        <CloudFileItem file={file} />
                                    </div>
                                )
                            ) : (
                                <p className="text-center text-gray-500 py-8 text-sm">No {activeCloudSource} files found.</p>
                            )}
                         </div>
                     </div>
                     <div className="flex-1 flex flex-col min-h-0 border-t border-dark-700 mt-4 pt-4">
                         <h3 className="text-lg font-bold text-gray-200 mb-2">Recent Activity</h3>
                         <div className="flex-1 overflow-y-auto pr-2 space-y-2">
                             {data?.activity.map(act => (
                                 <div key={act.id} className="flex items-center space-x-3 text-sm p-1">
                                     <span className="text-gray-500 flex-shrink-0 w-24">{act.time}</span>
                                     <span className="text-gray-300 truncate">{act.message}</span>
                                 </div>
                             ))}
                         </div>
                     </div>
                </div>
            </div>
        </div>
    );
};

export default SyncHub;