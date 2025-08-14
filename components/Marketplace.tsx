

import React from 'react';
import { getAllPlugins } from '../services/pluginService';
import type { Plugin } from '../types';
import { AddIcon, CheckIcon, PuzzleIcon, SparklesIcon, StoreIcon } from './Icons';

const PluginCard: React.FC<{
    plugin: Plugin;
    isInstalled: boolean;
    onInstall: (id: string) => void;
    onUninstall: (id: string) => void;
}> = ({ plugin, isInstalled, onInstall, onUninstall }) => {
    
    return (
        <div className="bg-dark-800 p-6 rounded-lg border border-dark-700 flex flex-col transition-all hover:border-primary-500/30 hover:shadow-2xl hover:shadow-black/30 hover:-translate-y-1 group">
            <div className="flex items-start justify-between mb-3">
                <div className="w-12 h-12 rounded-lg bg-dark-700 group-hover:bg-primary-500/10 transition-colors flex items-center justify-center flex-shrink-0">
                    {plugin.icon}
                </div>
                <div className={`text-xs px-2 py-0.5 rounded-full ${isInstalled ? 'bg-green-500/20 text-green-300' : 'bg-dark-600 text-gray-400'}`}>
                    {isInstalled ? 'Installed' : 'Available'}
                </div>
            </div>
            <h3 className="text-lg font-bold text-gray-100">{plugin.name}</h3>
            <p className="text-sm text-gray-500 mb-1">by {plugin.author}</p>
            <p className="text-sm text-gray-400 flex-grow mt-2">{plugin.description}</p>
            <div className="mt-6">
                {isInstalled ? (
                    <button 
                        onClick={() => onUninstall(plugin.id)} 
                        className="w-full bg-dark-700 hover:bg-dark-600 text-gray-300 font-bold py-2 px-4 rounded-md flex items-center justify-center space-x-2"
                    >
                        <CheckIcon className="w-4 h-4" />
                        <span>Uninstall</span>
                    </button>
                ) : (
                    <button 
                        onClick={() => onInstall(plugin.id)} 
                        className="w-full bg-primary-500 hover:bg-primary-600 text-white font-bold py-2 px-4 rounded-md flex items-center justify-center space-x-2"
                    >
                         <AddIcon className="w-4 h-4" />
                        <span>Install</span>
                    </button>
                )}
            </div>
        </div>
    );
};


const Marketplace: React.FC<{
    installedPlugins: string[];
    setInstalledPlugins: (plugins: string[]) => void;
}> = ({ installedPlugins, setInstalledPlugins }) => {
    
    const AVAILABLE_PLUGINS = getAllPlugins();

    const handleInstall = (pluginId: string) => {
        if (!installedPlugins.includes(pluginId)) {
            setInstalledPlugins([...installedPlugins, pluginId]);
        }
    };
    
    const handleUninstall = (pluginId: string) => {
        setInstalledPlugins(installedPlugins.filter(id => id !== pluginId));
    };

    return (
        <div className="p-8 flex-1 flex flex-col bg-dark-900 overflow-y-auto">
            <div className="mb-10 animate-fade-in-up">
                <h2 className="text-4xl font-bold text-white flex items-center">
                    <StoreIcon className="w-10 h-10 mr-4 text-primary-400" />
                    Marketplace
                </h2>
                <p className="mt-2 text-lg text-gray-400">Discover and install plugins to customize your Dream Studio experience.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {AVAILABLE_PLUGINS.map((plugin, index) => (
                    <div key={plugin.id} className="animate-stagger-in" style={{animationDelay: `${index * 50}ms`}}>
                        <PluginCard 
                            plugin={plugin}
                            isInstalled={installedPlugins.includes(plugin.id)}
                            onInstall={handleInstall}
                            onUninstall={handleUninstall}
                        />
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Marketplace;