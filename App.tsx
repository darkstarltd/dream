

import React, { useState, useEffect, useCallback, createContext, useContext, useRef } from 'react';
import PasswordManager from './components/PasswordManager';
import SyncHub from './components/SyncHub';
import Terminal from './components/Terminal';
import AndroidManager from './components/AndroidManager';
import AiAssistant from './components/AiAssistant';
import Settings from './components/Settings';
import Dashboard from './components/Dashboard';
import Marketplace from './components/Marketplace';
import ProjectTracker from './components/ProjectTracker';
import Scratchpad from './components/Scratchpad';
import DiffViewer from './components/DiffViewer';
import Snippets from './components/Snippets';
import DatabaseExplorer from './components/DatabaseExplorer';
import LogViewer from './components/LogViewer';
import EnvironmentManager from './components/EnvironmentManager';
import ApiLab from './components/ApiLab';
import MarkdownEditor from './components/MarkdownEditor';
import RegexTester from './components/RegexTester';
import TaskRunner from './components/TaskRunner';
import LoadingScreen from './components/LoadingScreen';
import VaultAccessModal from './components/VaultAccessModal';
import NotificationContainer from './components/NotificationContainer';
import CommandPalette from './components/CommandPalette';
import CollapsibleNavSection from './components/CollapsibleNavSection';
import { AndroidIcon, DashboardIcon, LockIcon, TerminalIcon, SparklesIcon, SettingsIcon, SyncIcon, StoreIcon, UserIcon, ProjectIcon, ScratchpadIcon, DiffIcon, SnippetIcon, DatabaseIcon, LogIcon, EnvManagerIcon, ApiLabIcon, MarkdownIcon, RegexIcon, TaskRunnerIcon } from './components/Icons';
import * as pluginService from './services/pluginService';
import * as themeService from './services/themeService';
import type { Plugin, VaultAccessRequest, UserProfile, Theme, Notification, NotificationType, Command, AutoLockTimeout } from './types';

export type View = 'dashboard' | 'passwords' | 'sync' | 'terminal' | 'android' | 'ai' | 'settings' | 'marketplace' | 'projects' | 'scratchpad' | 'diff' | 'snippets' | 'database' | 'logs' | 'envmanager' | 'apilab' | 'markdown' | 'regex' | 'taskrunner' | string; // string for plugin views

export const viewConfig: Record<string, { label: string; icon: React.ReactNode }> = {
    dashboard: { label: 'Dashboard', icon: <DashboardIcon className="w-5 h-5" /> },
    marketplace: { label: 'Marketplace', icon: <StoreIcon className="w-5 h-5" /> },
    projects: { label: 'Projects', icon: <ProjectIcon className="w-5 h-5" /> },
    snippets: { label: 'Snippets', icon: <SnippetIcon className="w-5 h-5" /> },
    markdown: { label: 'Markdown Notes', icon: <MarkdownIcon className="w-5 h-5" /> },
    database: { label: 'Database', icon: <DatabaseIcon className="w-5 h-5" /> },
    scratchpad: { label: 'Scratchpad', icon: <ScratchpadIcon className="w-5 h-5" /> },
    diff: { label: 'Diff Viewer', icon: <DiffIcon className="w-5 h-5" /> },
    logs: { label: 'Log Viewer', icon: <LogIcon className="w-5 h-5" /> },
    apilab: { label: 'API Lab', icon: <ApiLabIcon className="w-5 h-5" /> },
    regex: { label: 'Regex Tester', icon: <RegexIcon className="w-5 h-5" /> },
    taskrunner: { label: 'Task Runner', icon: <TaskRunnerIcon className="w-5 h-5" /> },
    sync: { label: 'Sync Hub', icon: <SyncIcon className="w-5 h-5" /> },
    passwords: { label: 'Vault', icon: <LockIcon className="w-5 h-5" /> },
    envmanager: { label: 'Environments', icon: <EnvManagerIcon className="w-5 h-5" /> },
    terminal: { label: 'Terminal', icon: <TerminalIcon className="w-5 h-5" /> },
    android: { label: 'Android', icon: <AndroidIcon className="w-5 h-5" /> },
    ai: { label: 'AI Assistant', icon: <SparklesIcon className="w-5 h-5" /> },
    settings: { label: 'Settings', icon: <SettingsIcon className="w-5 h-5" /> },
};

// --- Contexts for global systems ---
const NotificationContext = createContext<(message: string, type: NotificationType) => void>(() => {});
export const useNotification = () => useContext(NotificationContext);

const App: React.FC = () => {
    const [activeView, setActiveView] = useState<View>('dashboard');
    
    // --- Global State ---
    const [masterKey, setMasterKey] = useState<CryptoKey | null>(null);
    const [isGitHubAuthenticated, setIsGitHubAuthenticated] = useState(false);
    const [isDeviceConnected, setIsDeviceConnected] = useState(false);
    const [userProfile, setUserProfile] = useState<UserProfile>({ username: 'Developer', avatarUrl: '' });
    
    // --- Plugin, Theme & Vault Integration State ---
    const [installedPlugins, setInstalledPlugins] = useState<string[]>([]);
    const [enabledPlugins, setEnabledPlugins] = useState<string[]>([]);
    const [activeAiAssistant, setActiveAiAssistant] = useState<string>('gemini_assistant');
    const [activeTheme, setActiveTheme] = useState<Theme>(themeService.getAllThemes()[0]);
    const [customThemes, setCustomThemes] = useState<Theme[]>([]);
    const [vaultAccessGrants, setVaultAccessGrants] = useState<Record<string, boolean>>({});
    const [vaultAccessRequest, setVaultAccessRequest] = useState<VaultAccessRequest | null>(null);
    const [toolPlugins, setToolPlugins] = useState<Plugin[]>([]);
    const [passwordManagerActions, setPasswordManagerActions] = useState({ addNew: () => {} });
    const [autoLockTimeout, setAutoLockTimeout] = useState<AutoLockTimeout>(15);
    
    // --- Inter-component communication state ---
    const [codeForAi, setCodeForAi] = useState<string | null>(null);
    const [codeForScratchpad, setCodeForScratchpad] = useState<string | null>(null);


    // --- UI State ---
    const [isLoading, setIsLoading] = useState(true);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
    const [commands, setCommands] = useState<Command[]>([]);
    const [avatarLoadError, setAvatarLoadError] = useState(false);


    useEffect(() => {
        // Mock app loading
        setTimeout(() => setIsLoading(false), 1500);

        // Load state from localStorage
        const savedPlugins = localStorage.getItem('ds_installed_plugins');
        const loadedPlugins = savedPlugins ? JSON.parse(savedPlugins) : ['gemini_assistant', 'web_links_widget', 'system_monitor_widget'];
        setInstalledPlugins(loadedPlugins);
        
        const savedEnabledPlugins = localStorage.getItem('ds_enabled_plugins');
        setEnabledPlugins(savedEnabledPlugins ? JSON.parse(savedEnabledPlugins) : ['web_links_widget', 'system_monitor_widget']);
        
        const allPlugins = pluginService.getAllPlugins();
        setToolPlugins(allPlugins.filter(p => p.type === 'tool' && loadedPlugins.includes(p.id)));

        const savedActiveAi = localStorage.getItem('ds_active_ai');
        if (savedActiveAi) setActiveAiAssistant(savedActiveAi);

        const savedGrants = localStorage.getItem('ds_vault_access_grants');
        setVaultAccessGrants(savedGrants ? JSON.parse(savedGrants) : {});
        
        const savedProfile = localStorage.getItem('ds_user_profile');
        if (savedProfile) setUserProfile(JSON.parse(savedProfile));
        
        const savedThemeName = localStorage.getItem('ds_active_theme_name');
        const savedCustomThemes = localStorage.getItem('ds_custom_themes');
        const loadedCustomThemes = savedCustomThemes ? JSON.parse(savedCustomThemes) : [];
        setCustomThemes(loadedCustomThemes);
        
        const savedTimeout = localStorage.getItem('ds_autolock_timeout');
        if (savedTimeout) setAutoLockTimeout(JSON.parse(savedTimeout) as AutoLockTimeout);

        const allThemes = [...themeService.getAllThemes(), ...loadedCustomThemes];
        let foundTheme: Theme | undefined;
        if (savedThemeName) {
            foundTheme = allThemes.find(t => t.name === savedThemeName);
        }
        
        if (foundTheme) {
            setActiveTheme(foundTheme);
            themeService.applyTheme(foundTheme);
        } else {
            setActiveTheme(allThemes[0]);
            themeService.applyTheme(allThemes[0]);
        }
        
        // Command Palette keyboard listener
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setIsCommandPaletteOpen(prev => !prev);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);

    }, []);

    // Reset avatar error on profile change
    useEffect(() => {
        setAvatarLoadError(false);
    }, [userProfile.avatarUrl]);

    // --- Command Generation Effect ---
    useEffect(() => {
        const generatedCommands: Command[] = [];
        // Navigation commands
        Object.entries(viewConfig).forEach(([id, config]) => {
            generatedCommands.push({
                id: `nav_${id}`,
                label: `Go to ${config.label}`,
                category: 'Navigation',
                icon: config.icon,
                action: () => setActiveView(id)
            });
        });
        toolPlugins.forEach(plugin => {
            generatedCommands.push({
                id: `nav_${plugin.id}`,
                label: `Go to ${plugin.name}`,
                category: 'Navigation',
                icon: plugin.icon,
                action: () => setActiveView(plugin.id)
            });
        });
        
        // Theme commands
        const allThemes = [...themeService.getAllThemes(), ...customThemes];
        allThemes.forEach(theme => {
            generatedCommands.push({
                id: `theme_${theme.name.replace(/\s/g, '_')}`,
                label: `Switch to ${theme.name} theme`,
                category: 'Theme',
                icon: <div style={{ backgroundColor: theme.colors.primary['500']}} className="w-4 h-4 rounded-full"></div>,
                action: () => handleSetActiveTheme(theme)
            });
        });
        
        // Vault commands
        if(masterKey) {
            generatedCommands.push({
                id: 'vault_lock', label: 'Lock Vault', category: 'Vault',
                icon: <LockIcon className="w-4 h-4"/>, action: () => setMasterKey(null)
            });
            generatedCommands.push({
                id: 'vault_add', label: 'Add New Vault Entry', category: 'Vault',
                icon: <LockIcon className="w-4 h-4"/>, action: () => {
                    setActiveView('passwords');
                    passwordManagerActions.addNew();
                }
            });
        }
        setCommands(generatedCommands);
    }, [activeView, toolPlugins, customThemes, masterKey, passwordManagerActions]);

    const addNotification = useCallback((message: string, type: NotificationType) => {
        const id = Date.now();
        setNotifications(prev => [...prev, { id, message, type }]);
        setTimeout(() => {
            setNotifications(prev => prev.filter(n => n.id !== id));
        }, 4000);
    }, []);
    
    // --- Vault Auto-Lock Effect ---
    const timerRef = useRef<number | null>(null);
    const resetTimer = useCallback(() => {
        if (timerRef.current) {
            window.clearTimeout(timerRef.current);
        }
        if (masterKey && autoLockTimeout > 0) {
            timerRef.current = window.setTimeout(() => {
                setMasterKey(null);
                addNotification('Vault has been auto-locked due to inactivity.', 'info');
            }, autoLockTimeout * 60 * 1000);
        }
    }, [masterKey, autoLockTimeout, setMasterKey, addNotification]);

    useEffect(() => {
        const events: (keyof WindowEventMap)[] = ['mousemove', 'keydown', 'click', 'scroll'];
        events.forEach(event => window.addEventListener(event, resetTimer));
        
        resetTimer(); // Initialize timer

        return () => {
            events.forEach(event => window.removeEventListener(event, resetTimer));
            if (timerRef.current) {
                window.clearTimeout(timerRef.current);
            }
        };
    }, [resetTimer]);


    const handleSetInstalledPlugins = (plugins: string[]) => {
        setInstalledPlugins(plugins);
        localStorage.setItem('ds_installed_plugins', JSON.stringify(plugins));
        const allPlugins = pluginService.getAllPlugins();
        setToolPlugins(allPlugins.filter(p => p.type === 'tool' && plugins.includes(p.id)));
    };

    const handleSetEnabledPlugins = (plugins: string[]) => {
        setEnabledPlugins(plugins);
        localStorage.setItem('ds_enabled_plugins', JSON.stringify(plugins));
    };

    const handleSetActiveAiAssistant = (pluginId: string) => {
        setActiveAiAssistant(pluginId);
        localStorage.setItem('ds_active_ai', pluginId);
    };

    const handleSetUserProfile = (profile: UserProfile) => {
        setUserProfile(profile);
        localStorage.setItem('ds_user_profile', JSON.stringify(profile));
    };

    const handleSetVaultAccessGrants = (grants: Record<string, boolean>) => {
        setVaultAccessGrants(grants);
        localStorage.setItem('ds_vault_access_grants', JSON.stringify(grants));
    }
    
    const handleSetActiveTheme = (theme: Theme) => {
        setActiveTheme(theme);
        themeService.applyTheme(theme);
        localStorage.setItem('ds_active_theme_name', theme.name);
    };

    const handleSetCustomThemes = (themes: Theme[]) => {
        setCustomThemes(themes);
        localStorage.setItem('ds_custom_themes', JSON.stringify(themes));
    };
    
    const handleSetAutoLockTimeout = (timeout: AutoLockTimeout) => {
        setAutoLockTimeout(timeout);
        localStorage.setItem('ds_autolock_timeout', JSON.stringify(timeout));
    };
    
    const handleRequestVaultAccess = (pluginId: string, onGranted: () => void) => {
        const plugin = pluginService.getPlugin(pluginId);
        if (plugin) {
            setVaultAccessRequest({ plugin, onGranted });
        }
    };
    
    const handleVaultAccessDecision = (granted: boolean) => {
        if (vaultAccessRequest) {
            if (granted) {
                handleSetVaultAccessGrants({ ...vaultAccessGrants, [vaultAccessRequest.plugin.id]: true });
                vaultAccessRequest.onGranted();
            }
            setVaultAccessRequest(null);
        }
    };
    

    const renderView = () => {
        const pluginView = toolPlugins.find(p => p.id === activeView);
        if (pluginView) {
            const PluginComponent = pluginView.component;
            return <PluginComponent 
                masterKey={masterKey} 
                requestVaultAccess={handleRequestVaultAccess}
                hasVaultAccess={vaultAccessGrants[pluginView.id]}
                pluginId={pluginView.id}
            />;
        }

        switch (activeView) {
            case 'passwords':
                return <PasswordManager 
                            masterKey={masterKey} 
                            setMasterKey={setMasterKey} 
                            setActions={setPasswordManagerActions}
                        />;
            case 'sync':
                return <SyncHub isGitHubAuthenticated={isGitHubAuthenticated} setIsGitHubAuthenticated={setIsGitHubAuthenticated} />;
            case 'terminal':
                return <Terminal />;
            case 'android':
                return <AndroidManager isDeviceConnected={isDeviceConnected} setIsDeviceConnected={setIsDeviceConnected} />;
            case 'ai':
                return <AiAssistant 
                            activeAiPluginId={activeAiAssistant}
                            setActiveView={setActiveView}
                            masterKey={masterKey}
                            requestVaultAccess={handleRequestVaultAccess}
                            vaultAccessGrants={vaultAccessGrants}
                            codeForAi={codeForAi}
                            setCodeForAi={setCodeForAi}
                        />;
            case 'marketplace':
                return <Marketplace installedPlugins={installedPlugins} setInstalledPlugins={handleSetInstalledPlugins} />;
            case 'projects':
                return <ProjectTracker />;
            case 'scratchpad':
                return <Scratchpad 
                            setActiveView={setActiveView} 
                            setCodeForAi={setCodeForAi} 
                            initialCode={codeForScratchpad}
                            setInitialCode={setCodeForScratchpad}
                        />;
            case 'diff':
                return <DiffViewer />;
            case 'snippets':
                return <Snippets 
                            setActiveView={setActiveView}
                            setCodeForAi={setCodeForAi}
                            setCodeForScratchpad={setCodeForScratchpad}
                        />;
            case 'database':
                return <DatabaseExplorer />;
            case 'logs':
                return <LogViewer />;
            case 'envmanager':
                return <EnvironmentManager />;
            case 'apilab':
                return <ApiLab />;
            case 'markdown':
                return <MarkdownEditor />;
            case 'regex':
                return <RegexTester />;
            case 'taskrunner':
                return <TaskRunner />;
            case 'settings':
                return <Settings
                            userProfile={userProfile}
                            setUserProfile={handleSetUserProfile}
                            isGitHubAuthenticated={isGitHubAuthenticated} 
                            setIsGitHubAuthenticated={setIsGitHubAuthenticated}
                            installedPlugins={installedPlugins}
                            enabledPlugins={enabledPlugins}
                            setEnabledPlugins={handleSetEnabledPlugins}
                            activeAiAssistant={activeAiAssistant}
                            setActiveAiAssistant={handleSetActiveAiAssistant}
                            activeTheme={activeTheme}
                            setActiveTheme={handleSetActiveTheme}
                            customThemes={customThemes}
                            setCustomThemes={handleSetCustomThemes}
                            vaultAccessGrants={vaultAccessGrants}
                            setVaultAccessGrants={handleSetVaultAccessGrants}
                            autoLockTimeout={autoLockTimeout}
                            setAutoLockTimeout={handleSetAutoLockTimeout}
                        />;
            case 'dashboard':
            default:
                return <Dashboard
                            setActiveView={setActiveView} 
                            isDeviceConnected={isDeviceConnected}
                            installedPlugins={installedPlugins}
                            enabledPlugins={enabledPlugins}
                            masterKey={masterKey}
                            userProfile={userProfile}
                        />;
        }
    };
    
    const NavItem = ({ view, label, icon }: { view: View, label: string, icon: React.ReactNode }) => (
        <button
            onClick={() => setActiveView(view)}
            className={`flex items-center w-full px-4 py-3 text-sm font-medium rounded-lg transition-colors duration-200 group ${
                activeView === view
                    ? 'bg-primary-500/20 text-primary-300'
                    : 'text-gray-400 hover:bg-dark-800 hover:text-gray-200'
            }`}
            aria-current={activeView === view}
        >
            <span className={`transition-colors duration-200 ${activeView === view ? 'text-primary-400' : 'text-gray-500 group-hover:text-primary-400'}`}>{icon}</span>
            <span className="ml-3">{label}</span>
        </button>
    );
    
    const Header: React.FC = () => {
        const currentViewConfig = viewConfig[activeView] || toolPlugins.find(p => p.id === activeView);
        if (!currentViewConfig) return null;

        const label = 'label' in currentViewConfig ? currentViewConfig.label : currentViewConfig.name;

        return (
            <div className="flex-shrink-0 bg-dark-800/80 backdrop-blur-sm border-b border-dark-700 px-6 py-3 flex items-center justify-between">
                <div className="flex items-center">
                    <div className="text-primary-400 text-lg mr-3">{currentViewConfig.icon}</div>
                    <h2 className="text-xl font-bold text-white">{label}</h2>
                </div>
                 <button onClick={() => setIsCommandPaletteOpen(true)} className="flex items-center space-x-2 text-sm text-gray-400 border border-dark-600 px-2 py-1 rounded-md hover:bg-dark-700 hover:border-dark-500 transition-colors">
                    <span>Cmd + K</span>
                </button>
            </div>
        );
    };
    
    if (isLoading) {
        return <LoadingScreen />;
    }

    return (
        <NotificationContext.Provider value={addNotification}>
            <div className="flex h-screen bg-dark-900 text-gray-200">
                {vaultAccessRequest && (
                    <VaultAccessModal
                        request={vaultAccessRequest}
                        onDecision={handleVaultAccessDecision}
                    />
                )}
                {isCommandPaletteOpen && <CommandPalette commands={commands} onClose={() => setIsCommandPaletteOpen(false)} />}
                <aside className="w-64 flex-shrink-0 bg-dark-800/50 border-r border-dark-700 p-4 flex flex-col">
                    <div className="flex items-center mb-8">
                        <svg className="h-8 w-8 text-primary-500" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M21 6.5A1.5 1.5 0 0 0 19.5 5A5 5 0 0 0 15 10h-6A4 4 0 0 0 5 14v3.5A1.5 1.5 0 0 0 6.5 19h11a1.5 1.5 0 0 0 1.5-1.5L19 14.28v-5.77l2-.01zM13 13.5a.5.5 0 0 1 .5-.5h4a.5.5 0 0 1 0 1h-4a.5.5 0 0 1-.5-.5zm-3-3a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7a.5.5 0 0 1-.5-.5zM6.5 7.5h6.38a2.48 2.48 0 0 1-.88 2.12v2H6a7.51 7.51 0 0 0-.5 3.08V8.5a1 1 0 0 1 .5-.5z"/>
                        </svg>
                        <h1 className="text-xl font-bold ml-2 text-white">Dream Studio</h1>
                    </div>
                    <nav className="flex-grow space-y-1.5 overflow-y-auto">
                        {/* Main Navigation */}
                        <NavItem view="dashboard" label={viewConfig.dashboard.label} icon={viewConfig.dashboard.icon} />
                        <NavItem view="marketplace" label={viewConfig.marketplace.label} icon={viewConfig.marketplace.icon} />
                        
                        <CollapsibleNavSection title="Development">
                            <NavItem view="projects" label={viewConfig.projects.label} icon={viewConfig.projects.icon} />
                            <NavItem view="snippets" label={viewConfig.snippets.label} icon={viewConfig.snippets.icon} />
                            <NavItem view="markdown" label={viewConfig.markdown.label} icon={viewConfig.markdown.icon} />
                            <NavItem view="database" label={viewConfig.database.label} icon={viewConfig.database.icon} />
                            <NavItem view="scratchpad" label={viewConfig.scratchpad.label} icon={viewConfig.scratchpad.icon} />
                            <NavItem view="diff" label={viewConfig.diff.label} icon={viewConfig.diff.icon} />
                            <NavItem view="logs" label={viewConfig.logs.label} icon={viewConfig.logs.icon} />
                            <NavItem view="apilab" label={viewConfig.apilab.label} icon={viewConfig.apilab.icon} />
                            <NavItem view="regex" label={viewConfig.regex.label} icon={viewConfig.regex.icon} />
                            <NavItem view="taskrunner" label={viewConfig.taskrunner.label} icon={viewConfig.taskrunner.icon} />
                        </CollapsibleNavSection>
                        
                         <CollapsibleNavSection title="Management">
                            <NavItem view="passwords" label={viewConfig.passwords.label} icon={viewConfig.passwords.icon} />
                            <NavItem view="envmanager" label={viewConfig.envmanager.label} icon={viewConfig.envmanager.icon} />
                            <NavItem view="sync" label={viewConfig.sync.label} icon={viewConfig.sync.icon} />
                        </CollapsibleNavSection>

                        {/* Custom Tool Plugins */}
                        {toolPlugins.length > 0 && (
                             <CollapsibleNavSection title="Plugins">
                                {toolPlugins.map(plugin => (
                                    <NavItem key={plugin.id} view={plugin.id} label={plugin.name} icon={plugin.icon} />
                                ))}
                            </CollapsibleNavSection>
                        )}
                        
                        <CollapsibleNavSection title="Integrations">
                            <NavItem view="ai" label={viewConfig.ai.label} icon={viewConfig.ai.icon} />
                            <NavItem view="terminal" label={viewConfig.terminal.label} icon={viewConfig.terminal.icon} />
                            <NavItem view="android" label={viewConfig.android.label} icon={viewConfig.android.icon} />
                        </CollapsibleNavSection>
                    </nav>
                    <div className="flex-shrink-0">
                        <div className="border-t border-dark-700 pt-4 mt-4">
                            <div className="flex items-center px-2 py-2 mb-2 rounded-lg">
                            {(userProfile.avatarUrl && !avatarLoadError) ? (
                                    <img src={userProfile.avatarUrl} alt="User Avatar" className="w-9 h-9 rounded-full object-cover bg-dark-600" onError={() => setAvatarLoadError(true)} />
                                ) : (
                                  <div className="w-9 h-9 rounded-full bg-dark-600 flex items-center justify-center">
                                      <UserIcon className="w-5 h-5 text-gray-400" />
                                  </div>
                                )}
                                <span className="ml-3 font-semibold text-white truncate">{userProfile.username}</span>
                            </div>
                            <NavItem view="settings" label={viewConfig.settings.label} icon={viewConfig.settings.icon} />
                        </div>
                        <div className="text-xs text-gray-500 text-center mt-4">
                            <p>&copy; 2024 Darkstar Security</p>
                            <p>Version 10.0.0 "Betelgeuse"</p>
                        </div>
                    </div>
                </aside>
                <main className="flex-1 flex flex-col overflow-hidden">
                    {activeView !== 'dashboard' && <Header />}
                    <div className="flex-1 overflow-y-auto relative">
                        <div key={activeView} className="animate-fade-in-up">
                          {renderView()}
                        </div>
                    </div>
                </main>
                <NotificationContainer notifications={notifications} />
            </div>
        </NotificationContext.Provider>
    );
};

export default App;