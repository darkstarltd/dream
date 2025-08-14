
import React from 'react';
import type { VaultAccessRequest } from '../types';
import { LockIcon } from './Icons';
import { useNotification } from '../App';

const VaultAccessModal: React.FC<{
    request: VaultAccessRequest;
    onDecision: (granted: boolean) => void;
}> = ({ request, onDecision }) => {
    const addNotification = useNotification();

    const handleAllow = () => {
        addNotification(`Vault access granted to ${request.plugin.name}.`, 'success');
        onDecision(true);
    };

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-dark-800 border border-dark-700 rounded-lg shadow-2xl shadow-black/50 max-w-md w-full p-8 m-4 animate-scale-in">
                <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary-500/10 flex items-center justify-center">
                         <LockIcon className="w-8 h-8 text-primary-400" />
                    </div>
                    <h2 className="text-xl font-bold text-white">Vault Access Request</h2>
                    <p className="text-gray-400 mt-2">
                        The plugin <strong className="text-primary-300">{request.plugin.name}</strong> wants to store and access its own sensitive data (like API keys) in your encrypted vault.
                    </p>
                    <p className="text-xs text-gray-500 mt-4">
                        This allows the plugin to function securely without you having to re-enter credentials. Your other vault entries will not be accessible to this plugin. You can revoke this permission at any time in Settings.
                    </p>
                </div>
                <div className="flex justify-end space-x-3 mt-8">
                    <button 
                        onClick={() => onDecision(false)}
                        className="bg-dark-700 hover:bg-dark-600 text-gray-300 font-bold py-2 px-4 rounded-md text-sm">
                        Deny
                    </button>
                    <button 
                        onClick={handleAllow}
                        className="bg-primary-500 hover:bg-primary-600 text-white font-bold py-2 px-4 rounded-md text-sm">
                        Allow Access
                    </button>
                </div>
            </div>
        </div>
    );
};

export default VaultAccessModal;