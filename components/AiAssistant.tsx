
import React, { useState, useEffect } from 'react';
import { ExclamationIcon, LockIcon } from './Icons';
import * as pluginService from '../services/pluginService';
import type { Plugin } from '../types';
import type { View } from '../App';


const AiAssistant: React.FC<{
    activeAiPluginId: string;
    setActiveView: (view: View) => void;
    masterKey: CryptoKey | null;
    vaultAccessGrants: Record<string, boolean>;
    requestVaultAccess: (pluginId: string, onGranted: () => void) => void;
    codeForAi: string | null;
    setCodeForAi: (code: string | null) => void;
}> = ({ activeAiPluginId, setActiveView, masterKey, vaultAccessGrants, requestVaultAccess, codeForAi, setCodeForAi }) => {
    const [activePlugin, setActivePlugin] = useState<Plugin | null>(null);

    useEffect(() => {
        const plugin = pluginService.getPlugin(activeAiPluginId);
        setActivePlugin(plugin || null);
    }, [activeAiPluginId]);

    const renderContent = () => {
        if (!masterKey) {
             return (
                <div className="text-center text-gray-400">
                    <LockIcon className="w-12 h-12 mx-auto mb-4 text-yellow-500" />
                    <h3 className="text-xl font-bold text-white">Vault is Locked</h3>
                    <p className="mt-2">Please unlock the Password Vault to use the AI Assistant.</p>
                     <button onClick={() => setActiveView('passwords')} className="mt-4 bg-primary-500 hover:bg-primary-600 text-white font-bold py-2 px-4 rounded-md transition text-sm">
                        Unlock Vault
                    </button>
                </div>
            );
        }

        if (!activePlugin) {
            return (
                <div className="text-center text-gray-400">
                    <ExclamationIcon className="w-12 h-12 mx-auto mb-4 text-yellow-500" />
                    <h3 className="text-xl font-bold text-white">No AI Assistant Selected</h3>
                    <p className="mt-2">Please install and select an AI Assistant from the Marketplace or Settings.</p>
                     <button onClick={() => setActiveView('marketplace')} className="mt-4 bg-primary-500 hover:bg-primary-600 text-white font-bold py-2 px-4 rounded-md transition text-sm">
                        Go to Marketplace
                    </button>
                </div>
            )
        }

        const PluginComponent = activePlugin.component;
        return <PluginComponent 
            masterKey={masterKey} 
            hasVaultAccess={vaultAccessGrants[activePlugin.id] || false}
            requestVaultAccess={requestVaultAccess}
            pluginId={activePlugin.id}
            codeForAi={codeForAi}
            setCodeForAi={setCodeForAi}
        />;
    };

    return (
        <div className="flex-1 flex flex-col bg-dark-900 overflow-hidden">
             <div className="flex-1 flex flex-col justify-center items-center p-6">
                {renderContent()}
             </div>
        </div>
    );
};

export default AiAssistant;
