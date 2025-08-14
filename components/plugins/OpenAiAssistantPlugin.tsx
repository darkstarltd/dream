
import React, { useState, useEffect } from 'react';
import { SendIcon, SparklesIcon, UserIcon, LockIcon, SaveIcon } from '../Icons';
import * as vaultService from '../../services/vaultService';
import type { ChatMessage } from '../../types';

interface OpenAiAssistantPluginProps {
    masterKey: CryptoKey;
    hasVaultAccess: boolean;
    requestVaultAccess: (pluginId: string, onGranted: () => void) => void;
    pluginId: string;
}

const OpenAiAssistantPlugin: React.FC<OpenAiAssistantPluginProps> = ({ masterKey, hasVaultAccess, requestVaultAccess, pluginId }) => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    
    // API key management state
    const [apiKey, setApiKey] = useState<string | null>(null);
    const [showKeyInput, setShowKeyInput] = useState(false);
    const [tempApiKey, setTempApiKey] = useState('');

    useEffect(() => {
        const fetchKey = async () => {
            if (masterKey && hasVaultAccess) {
                const storedKey = await vaultService.getPluginSecret(masterKey, pluginId, 'api_key');
                setApiKey(storedKey);
                if (!storedKey) {
                    setShowKeyInput(true);
                }
            }
        };
        fetchKey();
    }, [masterKey, hasVaultAccess, pluginId]);

    const handleGrantAccess = () => {
        requestVaultAccess(pluginId, () => {
            setShowKeyInput(true);
        });
    };

    const handleSaveApiKey = async () => {
        if (masterKey && tempApiKey) {
            await vaultService.storePluginSecret(masterKey, pluginId, 'api_key', tempApiKey);
            setApiKey(tempApiKey);
            setShowKeyInput(false);
            setTempApiKey('');
        }
    };

    const handleSend = async () => {
        if (!input.trim()) return;
        
        const userMessage: ChatMessage = { role: 'user', content: input };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        setTimeout(() => {
            const assistantResponse: ChatMessage = {
                role: 'assistant',
                content: `As an OpenAI assistant (mock), I received your message: "${input}". My API key is ${apiKey ? 'loaded' : 'not loaded'}.`
            };
            setMessages(prev => [...prev, assistantResponse]);
            setIsLoading(false);
        }, 1000);
    };

    if (!hasVaultAccess) {
        return (
            <div className="w-full h-full flex flex-col items-center justify-center text-center p-4">
                <p className="text-gray-400">The OpenAI Assistant plugin needs permission to use your vault to store its API key securely.</p>
                <button onClick={handleGrantAccess} className="mt-4 bg-primary-500 hover:bg-primary-600 text-white font-bold py-2 px-4 rounded-md transition text-sm flex items-center justify-center space-x-2 mx-auto">
                    <LockIcon className="w-4 h-4"/><span>Grant Vault Access</span>
                </button>
            </div>
        );
    }

    if (showKeyInput) {
        return (
            <div className="w-full h-full flex flex-col items-center justify-center text-center p-4 max-w-lg mx-auto">
                <h3 className="text-lg font-bold text-white mb-2">Connect to OpenAI (Mock)</h3>
                <p className="text-gray-400">Please enter your OpenAI API key. It will be stored securely in your encrypted vault.</p>
                <div className="mt-4 flex gap-2 w-full">
                    <input type="password" value={tempApiKey} onChange={e => setTempApiKey(e.target.value)} placeholder="Enter OpenAI API Key" className="flex-grow bg-dark-900 border border-dark-600 rounded-md py-1.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"/>
                    <button onClick={handleSaveApiKey} disabled={!tempApiKey} className="bg-primary-500 hover:bg-primary-600 text-white font-bold py-2 px-3 rounded-md transition text-sm flex items-center space-x-2 disabled:opacity-50">
                        <SaveIcon className="w-4 h-4"/><span>Save Key</span>
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col bg-dark-900 overflow-hidden h-full">
            <div className="flex-1 overflow-y-auto pr-4 space-y-6">
                 {messages.length === 0 && (
                     <div className="flex flex-col items-center justify-center h-full text-center">
                        <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center flex-shrink-0 mb-4">
                            <SparklesIcon className="w-8 h-8 text-green-400" />
                        </div>
                        <h3 className="text-2xl font-bold text-white">OpenAI Assistant (Mock)</h3>
                        <p className="text-gray-400 mb-6">This is a placeholder for a real OpenAI integration.</p>
                     </div>
                 )}
                {messages.map((msg, index) => (
                    <div key={index} className={`flex items-start gap-4 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                        {msg.role === 'assistant' && (
                            <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                                <SparklesIcon className="w-5 h-5 text-green-300" />
                            </div>
                        )}
                        <div className={`max-w-2xl p-4 rounded-lg ${msg.role === 'assistant' ? 'bg-dark-800 text-gray-300' : 'bg-primary-700 text-white'}`}>
                            <p>{msg.content}</p>
                        </div>
                        {msg.role === 'user' && (
                             <div className="w-8 h-8 rounded-full bg-dark-700 flex items-center justify-center flex-shrink-0">
                                <UserIcon className="w-5 h-5 text-gray-400" />
                            </div>
                        )}
                    </div>
                ))}
            </div>

            <div className="flex-shrink-0 mt-6 pt-4 border-t border-dark-700">
                <div className="relative">
                    <textarea value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())} placeholder="Ask the mock OpenAI assistant..." className="w-full bg-dark-800 border border-dark-700 text-white rounded-lg py-3 pl-4 pr-16 resize-none focus:outline-none focus:ring-2 focus:ring-primary-500 transition" rows={1} disabled={isLoading} />
                    <button onClick={handleSend} disabled={isLoading || !input.trim()} className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-md bg-primary-500 hover:bg-primary-600 disabled:bg-dark-600 disabled:text-gray-500 disabled:cursor-not-allowed transition-colors">
                        <SendIcon className="w-5 h-5 text-white" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default OpenAiAssistantPlugin;
