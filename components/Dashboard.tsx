



import React, { useState, useEffect } from 'react';
import type { View } from '../App';
import type { SyncActivity, Plugin, SyncHubData, UserProfile } from '../types';
import * as api from '../services/apiService';
import * as vault from '../services/vaultService';
import { LockIcon, SyncIcon, TerminalIcon, AndroidIcon, SparklesIcon, CommitIcon, GitPushIcon, GitPullIcon, GistIcon, DropboxIcon, CodeIcon, GitBranchIcon, PuzzleIcon, ProjectIcon, ScratchpadIcon, DiffIcon, SnippetIcon, DatabaseIcon, LogIcon } from './Icons';
import * as pluginService from '../services/pluginService';
import { StatCardSkeleton, ActivityItemSkeleton } from './SkeletonLoader';

const ToolCard: React.FC<{
  view: View;
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick: (view: View) => void;
}> = ({ view, icon, title, description, onClick }) => (
    <div 
      onClick={() => onClick(view)} 
      className="bg-dark-800 p-6 rounded-lg border border-dark-700 hover:border-primary-500/40 hover:shadow-2xl hover:shadow-black/30 hover:-translate-y-1 transition-all duration-300 cursor-pointer group"
    >
        <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-dark-700 group-hover:bg-primary-500/20 mb-4 transition-colors duration-300 ring-1 ring-dark-600/50 group-hover:ring-primary-500/30">
            <div className="w-6 h-6 text-primary-400 group-hover:text-primary-300 transition-colors duration-300">{icon}</div>
        </div>
        <h3 className="text-lg font-bold text-gray-100">{title}</h3>
        <p className="mt-1 text-sm text-gray-400">{description}</p>
    </div>
);

const ActivityItem: React.FC<{ activity: SyncActivity }> = ({ activity }) => {
    const iconMap = {
        commit: <CommitIcon className="w-4 h-4 text-green-400" />,
        push: <GitPushIcon className="w-4 h-4 text-blue-400" />,
        pull: <GitPullIcon className="w-4 h-4 text-purple-400" />,
        gist: <GistIcon className="w-4 h-4 text-yellow-400" />,
        dropbox: <DropboxIcon className="w-4 h-4 text-cyan-400" />,
    };

    return (
        <div className="flex items-center space-x-3 py-2 border-b border-dark-700/50">
            <div className="flex-shrink-0 w-5 text-center">{iconMap[activity.type]}</div>
            <div className="flex-1">
                <p className="text-sm text-gray-300 truncate">{activity.message}</p>
            </div>
            <p className="text-xs text-gray-500">{activity.time}</p>
        </div>
    );
};

const StatCard: React.FC<{ icon: React.ReactNode; label: string; value: string; }> = ({ icon, label, value }) => (
    <div className="flex items-center space-x-3">
        <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-dark-700 text-primary-400">{icon}</div>
        <div>
            <p className="text-sm text-gray-400">{label}</p>
            <p className="text-lg font-bold text-white">{value}</p>
        </div>
    </div>
);


const Dashboard: React.FC<{
    setActiveView: (view: View) => void;
    isDeviceConnected: boolean;
    installedPlugins: string[];
    enabledPlugins: string[];
    masterKey: CryptoKey | null;
    userProfile: UserProfile;
}> = ({ setActiveView, isDeviceConnected, installedPlugins, enabledPlugins, masterKey, userProfile }) => {
    const [hubData, setHubData] = useState<SyncHubData | null>(null);
    const [vaultEntryCount, setVaultEntryCount] = useState(0);
    const [greeting, setGreeting] = useState('Welcome back');
    
    const toolPlugins = pluginService.getAllPlugins().filter(p => 
        installedPlugins.includes(p.id) && p.type === 'tool'
    );
    const widgetPlugins = pluginService.getAllPlugins().filter(p => 
        installedPlugins.includes(p.id) && 
        enabledPlugins.includes(p.id) &&
        p.type === 'widget'
    );
    
    useEffect(() => {
        api.getSyncHubData().then(setHubData);
        
        const hour = new Date().getHours();
        if (hour < 12) setGreeting('Good morning');
        else if (hour < 18) setGreeting('Good afternoon');
        else setGreeting('Good evening');

    }, []);

    useEffect(() => {
        if (masterKey) {
            vault.listSecrets(masterKey).then(secrets => setVaultEntryCount(secrets.length));
        } else {
            setVaultEntryCount(0);
        }
    }, [masterKey]);
    
    const coreTools: Plugin[] = [
        { id: 'projects', name: 'Project Tracker', description: 'Organize tasks with a drag-and-drop Kanban board.', icon: <ProjectIcon />, type: 'tool', component: React.Fragment, author: '' },
        { id: 'snippets', name: 'Snippet Vault', description: 'Save, tag, and search your reusable code snippets.', icon: <SnippetIcon />, type: 'tool', component: React.Fragment, author: '' },
        { id: 'database', name: 'Database Explorer', description: 'Browse and query your local mock databases.', icon: <DatabaseIcon />, type: 'tool', component: React.Fragment, author: '' },
        { id: 'scratchpad', name: 'Code Scratchpad', description: 'Quickly write, test, and get AI explanations for code.', icon: <ScratchpadIcon />, type: 'tool', component: React.Fragment, author: '' },
        { id: 'diff', name: 'Diff Viewer', description: 'Compare two blocks of text or code side-by-side.', icon: <DiffIcon />, type: 'tool', component: React.Fragment, author: '' },
        { id: 'logs', name: 'Log Viewer', description: 'View, search, and filter real-time application logs.', icon: <LogIcon />, type: 'tool', component: React.Fragment, author: '' },
        { id: 'passwords', name: 'Password Vault', description: 'Securely store and manage your sensitive credentials.', icon: <LockIcon />, type: 'tool', component: React.Fragment, author: '' },
        { id: 'ai', name: 'AI Assistant', description: 'Leverage AI for code generation, explanation, and debugging.', icon: <SparklesIcon />, type: 'tool', component: React.Fragment, author: '' },
        { id: 'sync', name: 'Sync Hub', description: 'Manage Git, Gists, and cloud backups from one location.', icon: <SyncIcon />, type: 'tool', component: React.Fragment, author: '' },
        { id: 'terminal', name: 'Integrated Terminal', description: 'A full-featured terminal baked into your workspace.', icon: <TerminalIcon />, type: 'tool', component: React.Fragment, author: '' },
        { id: 'android', name: 'Android Manager', description: 'Connect and manage Android devices with powerful tools.', icon: <AndroidIcon />, type: 'tool', component: React.Fragment, author: '' },
    ];
    
    const allTools = [...coreTools, ...toolPlugins];

    return (
    <div className="p-8 flex-1 flex flex-col bg-dark-900 overflow-y-auto">
        <div className="mb-10 animate-fade-in-up">
            <h2 className="text-4xl font-bold text-white">{greeting}, <span className="text-primary-300">{userProfile.username}</span>.</h2>
            <p className="mt-2 text-lg text-gray-400">Your all-in-one developer toolkit. Select a tool to get started.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main column with tool cards */}
            <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                 {allTools.map((tool, index) => (
                     <div key={tool.id} className="animate-stagger-in" style={{animationDelay: `${index * 50}ms`}}>
                        <ToolCard 
                            view={tool.id} 
                            icon={tool.icon} 
                            title={tool.name} 
                            description={tool.description} 
                            onClick={setActiveView} 
                        />
                     </div>
                 ))}
            </div>

            {/* Right column with stats and activity */}
            <div className="lg:col-span-1 space-y-6 animate-fade-in-up" style={{animationDelay: '300ms'}}>
                <div className="bg-dark-800 rounded-lg border border-dark-700 p-6">
                    <h3 className="text-lg font-bold text-gray-100 mb-4">Quick Stats</h3>
                    <div className="space-y-4">
                        {hubData ? (
                            <>
                                <StatCard icon={<LockIcon className="w-4 h-4"/>} label="Vault Entries" value={!masterKey ? 'Locked' : vaultEntryCount.toString()} />
                                <StatCard icon={<GitBranchIcon className="w-4 h-4"/>} label="Current Branch" value={hubData.git.current || '...'} />
                                <StatCard icon={<AndroidIcon className="w-4 h-4"/>} label="Device Status" value={isDeviceConnected ? 'Connected' : 'Disconnected'} />
                            </>
                        ) : (
                            <>
                                <StatCardSkeleton />
                                <StatCardSkeleton />
                                <StatCardSkeleton />
                            </>
                        )}
                    </div>
                </div>
                 <div className="bg-dark-800 rounded-lg border border-dark-700 p-6">
                     <h3 className="text-lg font-bold text-gray-100 mb-4">Recent Activity</h3>
                     <div className="space-y-2">
                         {hubData ? (
                            hubData.activity.length > 0 ? (
                                hubData.activity.slice(0, 4).map(act => <ActivityItem key={act.id} activity={act} />)
                            ) : (
                                <p className="text-sm text-gray-500 text-center py-8">No recent activity.</p>
                            )
                         ) : (
                             <>
                                <ActivityItemSkeleton />
                                <ActivityItemSkeleton />
                                <ActivityItemSkeleton />
                                <ActivityItemSkeleton />
                             </>
                         )}
                     </div>
                </div>
            </div>
        </div>
        
        {widgetPlugins.length > 0 && (
            <div className="mt-8 pt-6 border-t border-dark-700 animate-fade-in-up" style={{animationDelay: '500ms'}}>
                <h3 className="text-2xl font-bold text-white mb-4 flex items-center">
                    <PuzzleIcon className="w-6 h-6 mr-3 text-primary-400"/>
                    Dashboard Widgets
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {widgetPlugins.map(plugin => {
                        const WidgetComponent = plugin.component;
                        return <WidgetComponent key={plugin.id} />;
                    })}
                </div>
            </div>
        )}
    </div>
    );
};

export default Dashboard;