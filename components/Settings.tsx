


import React, { useState, useEffect } from 'react';
import { DeleteIcon, GitHubIcon, KeyIcon, PuzzleIcon, SparklesIcon, UserIcon, CheckIcon, PaletteIcon, AddIcon, ShieldIcon, SaveIcon } from './Icons';
import * as pluginService from '../services/pluginService';
import * as themeService from '../services/themeService';
import type { UserProfile, Theme, AutoLockTimeout } from '../types';
import { useNotification } from '../App';

const Settings: React.FC<{
    userProfile: UserProfile;
    setUserProfile: (profile: UserProfile) => void;
    isGitHubAuthenticated: boolean;
    setIsGitHubAuthenticated: (isAuthed: boolean) => void;
    installedPlugins: string[];
    enabledPlugins: string[];
    setEnabledPlugins: (plugins: string[]) => void;
    activeAiAssistant: string;
    setActiveAiAssistant: (pluginId: string) => void;
    activeTheme: Theme;
    setActiveTheme: (theme: Theme) => void;
    customThemes: Theme[];
    setCustomThemes: (themes: Theme[]) => void;
    vaultAccessGrants: Record<string, boolean>;
    setVaultAccessGrants: (grants: Record<string, boolean>) => void;
    autoLockTimeout: AutoLockTimeout;
    setAutoLockTimeout: (timeout: AutoLockTimeout) => void;
}> = (props) => {
    
    const {
        userProfile, setUserProfile, isGitHubAuthenticated, setIsGitHubAuthenticated,
        installedPlugins, activeAiAssistant, setActiveAiAssistant,
        vaultAccessGrants, setVaultAccessGrants, enabledPlugins, setEnabledPlugins,
        activeTheme, setActiveTheme, customThemes, setCustomThemes,
        autoLockTimeout, setAutoLockTimeout
    } = props;
    
    const addNotification = useNotification();
    const [profileForm, setProfileForm] = useState(userProfile);
    const [themePreview, setThemePreview] = useState(activeTheme);
    const [clearDataConfirmation, setClearDataConfirmation] = useState('');

    useEffect(() => {
        setProfileForm(userProfile);
    }, [userProfile]);

     useEffect(() => {
        // When the active theme changes (e.g., from command palette), update the preview
        setThemePreview(activeTheme);
    }, [activeTheme]);
    
    const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setProfileForm({...profileForm, [e.target.name]: e.target.value});
    };

    const handleProfileSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setUserProfile(profileForm);
        addNotification('User profile saved successfully!', 'success');
    };

    const handleClearData = () => {
        if (clearDataConfirmation === 'DELETE') {
            localStorage.clear();
            window.location.reload();
        } else {
            addNotification('Confirmation text does not match.', 'error');
        }
    }

    const handleGitHubDisconnect = () => {
        if (window.confirm('Are you sure you want to disconnect your GitHub account?')) {
            setIsGitHubAuthenticated(false);
            addNotification('Disconnected from GitHub.', 'info');
        }
    };

    const handleRevokeAccess = (pluginId: string) => {
        if (window.confirm(`Are you sure you want to revoke vault access for this plugin? It will no longer be able to store or retrieve its credentials.`)) {
            const newGrants = { ...vaultAccessGrants };
            delete newGrants[pluginId];
            setVaultAccessGrants(newGrants);
            addNotification(`Vault access revoked for ${pluginService.getPlugin(pluginId)?.name}.`, 'success');
        }
    };
    
    const togglePlugin = (pluginId: string) => {
        const newEnabled = enabledPlugins.includes(pluginId)
            ? enabledPlugins.filter(id => id !== pluginId)
            : [...enabledPlugins, pluginId];
        setEnabledPlugins(newEnabled);
    };

    const handleThemeValueChange = (field: 'primary' | 'dark' | 'fontSans' | 'fontMono', value: string) => {
        const newPreview = { ...themePreview, name: "Custom" };
        if(field === 'primary') newPreview.colors.primary['500'] = value;
        if(field === 'dark') newPreview.colors.dark['900'] = value;
        if(field === 'fontSans') newPreview.font.sans = value;
        if(field === 'fontMono') newPreview.font.mono = value;

        const updatedTheme = themeService.createThemeFromHex(newPreview.name, newPreview.colors.primary['500'], newPreview.colors.dark['900'], newPreview.font);
        setThemePreview(updatedTheme);
        themeService.applyTheme(updatedTheme);
    };

    const handleSaveTheme = () => {
        const themeToSave = { ...themePreview };
        if (themeToSave.isCustom) {
            const existingIndex = customThemes.findIndex(t => t.name === themeToSave.name);
            if(existingIndex > -1) {
                const updatedCustoms = [...customThemes];
                updatedCustoms[existingIndex] = themeToSave;
                setCustomThemes(updatedCustoms);
            } else {
                setCustomThemes([...customThemes, themeToSave]);
            }
        }
        setActiveTheme(themeToSave);
        addNotification(`Theme "${themeToSave.name}" saved and applied!`, 'success');
    };
    
    const handleSelectPresetTheme = (theme: Theme) => {
        setThemePreview(theme);
        themeService.applyTheme(theme);
    };
    
    const fontOptions = [
        { label: "Inter / Fira Code", sans: "Inter, system-ui, sans-serif", mono: "Fira Code, monospace" },
        { label: "Source Sans Pro / Roboto Mono", sans: "Source Sans Pro, sans-serif", mono: "Roboto Mono, monospace" },
    ];
    
    const allAvailableThemes = [...themeService.getAllThemes(), ...customThemes];
    const widgetPlugins = pluginService.getAllPlugins().filter(p => installedPlugins.includes(p.id) && p.type === 'widget');
    const grantedPlugins = pluginService.getAllPlugins().filter(p => vaultAccessGrants[p.id]);
    const aiAssistantPlugins = pluginService.getAllPlugins().filter(p => installedPlugins.includes(p.id) && p.type === 'ai_assistant');
    
    const timeoutOptions: { value: AutoLockTimeout, label: string }[] = [
        { value: 1, label: "1 Minute" },
        { value: 5, label: "5 Minutes" },
        { value: 15, label: "15 Minutes" },
        { value: 30, label: "30 Minutes" },
        { value: 0, label: "Never" },
    ];


    return (
        <div className="flex-1 flex flex-col bg-dark-900 p-6 overflow-y-auto">
            <div className="max-w-2xl mx-auto w-full space-y-8">
                
                {/* User Profile */}
                <div className="bg-dark-800 border border-dark-700 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-200 flex items-center"><UserIcon className="w-5 h-5 mr-3 text-primary-400" />User Profile</h3>
                    <form onSubmit={handleProfileSubmit} className="space-y-4 mt-4">
                        <div>
                            <label className="block text-xs font-medium text-gray-400 mb-1" htmlFor="username">Username</label>
                            <input id="username" name="username" type="text" value={profileForm.username} onChange={handleProfileChange} className="w-full bg-dark-900 border border-dark-600 rounded-md py-1.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-400 mb-1" htmlFor="avatarUrl">Avatar URL</label>
                            <input id="avatarUrl" name="avatarUrl" type="text" placeholder="https://..." value={profileForm.avatarUrl} onChange={handleProfileChange} className="w-full bg-dark-900 border border-dark-600 rounded-md py-1.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
                        </div>
                        <div className="flex justify-end">
                            <button type="submit" className="bg-primary-500 hover:bg-primary-600 text-white font-bold py-2 px-4 rounded-md text-sm flex items-center space-x-2">
                                <span>Save Profile</span>
                            </button>
                        </div>
                    </form>
                </div>

                {/* Appearance */}
                 <div className="bg-dark-800 border border-dark-700 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-200 flex items-center"><PaletteIcon className="w-5 h-5 mr-3 text-primary-400" />Appearance</h3>
                    <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-300 mb-2">Theme Presets</label>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            {themeService.getAllThemes().map(theme => (
                                <button key={theme.name} onClick={() => handleSelectPresetTheme(theme)} className={`p-2 rounded-lg border-2 ${themePreview.name === theme.name ? 'border-primary-500' : 'border-dark-700 hover:border-dark-600'}`}>
                                    <div className="flex items-center space-x-2">
                                        <div style={{ backgroundColor: theme.colors.primary['500']}} className="w-5 h-5 rounded-full"></div>
                                        <div style={{ backgroundColor: theme.colors.dark['800']}} className="w-5 h-5 rounded-full"></div>
                                    </div>
                                    <p className={`text-xs mt-2 text-left ${themePreview.name === theme.name ? 'text-white' : 'text-gray-400'}`}>{theme.name}</p>
                                </button>
                            ))}
                        </div>
                    </div>
                     <div className="mt-6 pt-4 border-t border-dark-700 space-y-4">
                         <label className="block text-sm font-medium text-gray-300">Live Editor</label>
                        <div className="flex items-center justify-between">
                            <label className="text-sm text-gray-400">Primary Color</label>
                            <input type="color" value={themePreview.colors.primary['500']} onChange={(e) => handleThemeValueChange('primary', e.target.value)} className="bg-dark-900 border-none w-10 h-8 rounded" />
                        </div>
                        <div className="flex items-center justify-between">
                            <label className="text-sm text-gray-400">Background Color</label>
                            <input type="color" value={themePreview.colors.dark['900']} onChange={(e) => handleThemeValueChange('dark', e.target.value)} className="bg-dark-900 border-none w-10 h-8 rounded" />
                        </div>
                        <div className="flex items-center justify-between">
                             <label className="text-sm text-gray-400" htmlFor="font-select">Font Pairing</label>
                             <select id="font-select" value={themePreview.font.sans} onChange={(e) => handleThemeValueChange('fontSans', e.target.value)} className="bg-dark-900 border border-dark-600 rounded-md py-1 px-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
                                {fontOptions.map(opt => <option key={opt.label} value={opt.sans}>{opt.label}</option>)}
                             </select>
                        </div>
                        <button onClick={handleSaveTheme} className="w-full bg-primary-500 hover:bg-primary-600 text-white font-bold py-2 px-4 rounded-md text-sm flex items-center justify-center space-x-2">
                             <SaveIcon className="w-4 h-4"/><span>Save and Apply Theme</span>
                        </button>
                    </div>
                </div>

                {/* Security */}
                <div className="bg-dark-800 border border-dark-700 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-200 flex items-center"><ShieldIcon className="w-5 h-5 mr-3 text-primary-400" />Security</h3>
                    <div className="mt-4 space-y-3">
                         <div className="flex items-center justify-between">
                            <label htmlFor="autolock" className="text-sm text-gray-300">Vault Auto-Lock Timeout</label>
                            <select
                                id="autolock"
                                value={autoLockTimeout}
                                onChange={(e) => setAutoLockTimeout(Number(e.target.value) as AutoLockTimeout)}
                                className="bg-dark-900 border border-dark-600 rounded-md py-1 px-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                            >
                                {timeoutOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                            </select>
                         </div>
                         <p className="text-xs text-gray-500">Automatically lock the vault after a period of inactivity.</p>
                    </div>
                </div>


                 {/* Plugins */}
                <div className="bg-dark-800 border border-dark-700 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-200 flex items-center"><PuzzleIcon className="w-5 h-5 mr-3 text-primary-400" />Plugins</h3>
                     <p className="text-sm text-gray-400 mt-1 mb-4">Enable or disable installed dashboard widgets.</p>
                    <div className="space-y-3">
                         {widgetPlugins.length > 0 ? widgetPlugins.map(plugin => (
                            <div key={plugin.id} className="bg-dark-900/50 p-3 rounded-md flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                    <div className="w-8 h-8 flex-shrink-0 flex items-center justify-center">{plugin.icon}</div>
                                    <div>
                                        <p className="font-semibold text-gray-200">{plugin.name}</p>
                                        <p className="text-xs text-gray-500">{plugin.description}</p>
                                    </div>
                                </div>
                                 <label className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" checked={enabledPlugins.includes(plugin.id)} onChange={() => togglePlugin(plugin.id)} className="sr-only peer" />
                                    <div className="w-11 h-6 bg-dark-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                                </label>
                            </div>
                        )) : (
                            <p className="text-sm text-center text-gray-500 py-4">No widget plugins installed. Visit the Marketplace to add some.</p>
                        )}
                    </div>
                </div>

                 {/* AI Assistant */}
                 <div className="bg-dark-800 border border-dark-700 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-200 flex items-center"><SparklesIcon className="w-5 h-5 mr-3 text-primary-400" />Active AI Assistant</h3>
                     {aiAssistantPlugins.length > 0 ? (
                        <select
                            value={activeAiAssistant}
                            onChange={(e) => setActiveAiAssistant(e.target.value)}
                            className="w-full mt-4 bg-dark-900 border border-dark-600 rounded-md py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                        >
                            {aiAssistantPlugins.map(plugin => ( <option key={plugin.id} value={plugin.id}>{plugin.name}</option> ))}
                        </select>
                     ) : ( <p className="text-sm text-center text-gray-500 py-4 mt-4">No AI Assistant plugins installed.</p> )}
                </div>

                {/* Vault Integrations */}
                 <div className="bg-dark-800 border border-dark-700 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-200 flex items-center"><KeyIcon className="w-5 h-5 mr-3 text-primary-400" />Vault Integrations</h3>
                    <p className="text-sm text-gray-400 mt-1 mb-4">Manage plugin permissions for your vault.</p>
                    <div className="space-y-2">
                        {grantedPlugins.length > 0 ? grantedPlugins.map(plugin => (
                            <div key={plugin.id} className="bg-dark-900/50 p-3 rounded-md flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                    <div className="w-8 h-8 flex-shrink-0 flex items-center justify-center">{plugin.icon}</div>
                                    <div><p className="font-semibold text-gray-200">{plugin.name}</p></div>
                                </div>
                                <button onClick={() => handleRevokeAccess(plugin.id)} className="bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-bold py-1 px-2 rounded-md">Revoke</button>
                            </div>
                        )) : ( <p className="text-sm text-center text-gray-500 py-4">No plugins have been granted vault access.</p> )}
                    </div>
                </div>

                {/* Connected Accounts */}
                 <div className="bg-dark-800 border border-dark-700 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-200">Connected Accounts</h3>
                    {isGitHubAuthenticated ? (
                        <div className="mt-4 bg-dark-900/50 p-4 rounded-md flex items-center justify-between">
                            <div className="flex items-center space-x-4"><GitHubIcon className="w-8 h-8 text-white" />
                                <div><p className="font-bold text-white">GitHub</p><p className="text-sm text-gray-400">Connected as github-user</p></div>
                            </div>
                            <button onClick={handleGitHubDisconnect} className="bg-red-500/10 hover:bg-red-500/20 text-red-400 font-bold py-2 px-3 rounded-md text-sm">Disconnect</button>
                        </div>
                    ) : ( <div className="mt-4 text-sm text-gray-500 text-center py-4 bg-dark-900/50 rounded-md">No accounts connected.</div> )}
                </div>

                 <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-red-300">Danger Zone</h3>
                     <p className="text-sm text-red-400/80 mt-1 mb-4">This action is irreversible and will delete all stored data including passwords, plugins, and settings. Proceed with extreme caution.</p>
                     <div className="space-y-2">
                        <label className="block text-xs font-medium text-gray-400">To confirm, type "DELETE" in the box below.</label>
                        <input 
                            type="text" 
                            value={clearDataConfirmation}
                            onChange={(e) => setClearDataConfirmation(e.target.value)}
                            className="w-full bg-dark-900 border border-red-500/50 rounded-md py-1.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                        />
                         <button onClick={handleClearData} disabled={clearDataConfirmation !== 'DELETE'} className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-md text-sm flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed">
                            <DeleteIcon className="w-4 h-4" />
                            <span>Clear All Local Data</span>
                        </button>
                     </div>
                </div>
            </div>
        </div>
    );
};

export default Settings;