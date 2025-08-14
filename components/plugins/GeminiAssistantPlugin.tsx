

import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, Chat } from '@google/genai';
import type { ChatMessage } from '../../types';
import * as credentialService from '../../services/credentialService';
import { SendIcon, SparklesIcon, UserIcon, CopyIcon, LockIcon, SaveIcon } from '../Icons';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useNotification } from '../../App';

interface GeminiAssistantPluginProps {
    masterKey: CryptoKey;
    hasVaultAccess: boolean;
    requestVaultAccess: (pluginId: string, onGranted: () => void) => void;
    pluginId: string;
    codeForAi: string | null;
    setCodeForAi: (code: string | null) => void;
}

const CodeBlock: React.FC<{ language: string, code: string }> = ({ language, code }) => {
    const addNotification = useNotification();
    const handleCopy = () => {
        navigator.clipboard.writeText(code);
        addNotification('Code copied to clipboard!', 'success');
    };

    return (
        <div className="bg-dark-900 rounded-lg my-2 border border-dark-700">
            <div className="flex justify-between items-center px-4 py-1.5 bg-dark-700/50 rounded-t-lg">
                <span className="text-xs text-gray-400 font-sans">{language || 'code'}</span>
                <button onClick={handleCopy} className="text-xs text-gray-400 hover:text-primary-300 transition-colors flex items-center space-x-1">
                    <CopyIcon className="w-3.5 h-3.5" />
                    <span>Copy</span>
                </button>
            </div>
            <div className="p-4 overflow-x-auto">
                <code className={`language-${language}`}>{code}</code>
            </div>
        </div>
    );
};

const SuggestedPrompts: React.FC<{ onSelect: (prompt: string) => void }> = ({ onSelect }) => {
    const prompts = [ "Write a React hook to manage toggle state", "Explain Git rebase vs merge", "How do I center a div with CSS?", ];
    return (
        <div className="flex flex-col items-center justify-center h-full text-center">
             <div className="w-16 h-16 rounded-full bg-primary-500/10 flex items-center justify-center flex-shrink-0 mb-4">
                <SparklesIcon className="w-8 h-8 text-primary-400" />
            </div>
            <h3 className="text-2xl font-bold text-white">Gemini AI</h3>
            <p className="text-gray-400 mb-6">How can I help you today?</p>
            <div className="space-y-3">
                {prompts.map(p => (
                    <button key={p} onClick={() => onSelect(p)} className="bg-dark-800 hover:bg-dark-700 border border-dark-700 text-gray-300 text-sm py-2 px-4 rounded-lg transition">
                        {p}
                    </button>
                ))}
            </div>
        </div>
    )
}

const GeminiAssistantPlugin: React.FC<GeminiAssistantPluginProps> = ({ masterKey, hasVaultAccess, requestVaultAccess, pluginId, codeForAi, setCodeForAi }) => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const chatRef = useRef<Chat | null>(null);
    const [apiKey, setApiKey] = useState<string | null>(null);
    const [showKeyInput, setShowKeyInput] = useState(false);
    const [tempApiKey, setTempApiKey] = useState('');
    const addNotification = useNotification();

    const handleSend = async (prompt?: string) => {
        const currentInput = prompt || input;
        if (!currentInput.trim() || isLoading || !chatRef.current) return;

        const userMessage: ChatMessage = { role: 'user', content: currentInput };
        setMessages(prev => [...prev, userMessage, { role: 'assistant', content: '' }]);
        setInput('');
        setIsLoading(true);

        try {
            const stream = await chatRef.current.sendMessageStream({ message: currentInput });
            for await (const chunk of stream) {
                setMessages(prev => {
                    const newMessages = [...prev];
                    const lastMessage = newMessages[newMessages.length - 1];
                    if (lastMessage.role === 'assistant') { lastMessage.content += chunk.text; }
                    return newMessages;
                });
            }
        } catch (error) {
            const errorMessage = "Sorry, I encountered an error. It could be a network issue or a problem with your API key configuration. Please check the console for details.";
             setMessages(prev => {
                const newMessages = [...prev];
                const lastMessage = newMessages[newMessages.length - 1];
                if (lastMessage.role === 'assistant') { lastMessage.content = errorMessage; }
                return newMessages;
            });
            addNotification(errorMessage, 'error');
        } finally {
            setIsLoading(false);
        }
    };
    
    useEffect(() => {
        const setupAI = async () => {
            if (masterKey && hasVaultAccess) {
                const storedKey = await credentialService.getApiKey(masterKey, pluginId);
                if (storedKey) {
                    setApiKey(storedKey);
                    setShowKeyInput(false);
                    try {
                        const ai = new GoogleGenAI({ apiKey: storedKey });
                        const systemInstruction = "You are Dream AI, a helpful and friendly development assistant integrated into Dream Studio, powered by Google Gemini. You specialize in explaining code, writing functions, debugging, and providing expert advice on software development topics. Keep your responses clear, concise, and formatted with markdown. For code blocks, specify the language.";
                        chatRef.current = ai.chats.create({ model: 'gemini-2.5-flash', config: { systemInstruction }});
                    } catch (e) {
                        console.error("Gemini AI Initialization Error:", e);
                        const errorMessage = `Failed to initialize Gemini AI. Please check your API key. Error: ${e instanceof Error ? e.message : 'Unknown'}`;
                        setMessages([{ role: 'assistant', content: errorMessage }]);
                        addNotification(errorMessage, 'error');
                    }
                } else {
                    setShowKeyInput(true);
                }
            }
        };
        setupAI();
    }, [masterKey, hasVaultAccess, pluginId, apiKey, addNotification]);

    useEffect(() => {
        if (codeForAi && chatRef.current) {
            // Make sure chat is ready and there's code to explain
            setMessages([]); // Clear previous chat for a fresh explanation
            handleSend(`Explain the following code:\n\n\`\`\`\n${codeForAi}\n\`\`\``);
            setCodeForAi(null); // Consume the code
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [codeForAi]);


    const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    useEffect(scrollToBottom, [messages, isLoading]);
    
    const handleGrantAccess = () => {
        requestVaultAccess(pluginId, () => {
            setShowKeyInput(true); // Callback after access is granted
        });
    };

    const handleSaveApiKey = async () => {
        if (masterKey && tempApiKey) {
            await credentialService.storeApiKey(masterKey, pluginId, tempApiKey);
            setApiKey(tempApiKey); // Trigger re-initialization
            addNotification('Gemini API Key saved successfully!', 'success');
            setShowKeyInput(false);
            setTempApiKey('');
        }
    };

    if (!hasVaultAccess) {
        return (
            <div className="w-full h-full flex flex-col items-center justify-center text-center p-4">
                <p className="text-gray-400">The Gemini Assistant plugin needs permission to use your vault to store its API key securely.</p>
                <button onClick={handleGrantAccess} className="mt-4 bg-primary-500 hover:bg-primary-600 text-white font-bold py-2 px-4 rounded-md transition text-sm flex items-center justify-center space-x-2 mx-auto">
                    <LockIcon className="w-4 h-4"/><span>Grant Vault Access</span>
                </button>
            </div>
        );
    }
    if (showKeyInput) {
         return (
             <div className="w-full h-full flex flex-col items-center justify-center text-center p-4 max-w-lg mx-auto">
                <h3 className="text-lg font-bold text-white mb-2">Connect to Gemini</h3>
                <p className="text-gray-400">Please enter your Google Gemini API key. It will be stored securely in your encrypted vault.</p>
                <div className="mt-4 flex gap-2 w-full">
                    <input type="password" value={tempApiKey} onChange={e => setTempApiKey(e.target.value)} placeholder="Enter Gemini API Key" className="flex-grow bg-dark-900 border border-dark-600 rounded-md py-1.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"/>
                    <button onClick={handleSaveApiKey} disabled={!tempApiKey} className="bg-primary-500 hover:bg-primary-600 text-white font-bold py-2 px-3 rounded-md transition text-sm flex items-center space-x-2 disabled:opacity-50">
                        <SaveIcon className="w-4 h-4"/><span>Save Key</span>
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full h-full flex flex-col bg-dark-900 overflow-hidden">
            <div className="flex-1 overflow-y-auto pr-4 space-y-6 markdown-container">
                {messages.length === 0 && !isLoading ? (
                    <SuggestedPrompts onSelect={(p) => handleSend(p)} />
                ) : (
                    messages.map((msg, index) => (
                        <div key={index} className={`flex items-start gap-4 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                            {msg.role === 'assistant' && (<div className="w-8 h-8 rounded-full bg-primary-500/20 flex items-center justify-center flex-shrink-0"><SparklesIcon className="w-5 h-5 text-primary-300" /></div>)}
                            <div className={`max-w-2xl p-4 rounded-lg ${msg.role === 'assistant' ? 'bg-dark-800 text-gray-300' : 'bg-primary-700 text-white'}`}>
                                 {msg.role === 'assistant' && msg.content === '' && isLoading ? (
                                    <div className="flex items-center space-x-1">
                                        <span className="w-1.5 h-1.5 bg-primary-400 rounded-full animate-pulse" style={{animationDelay: '0s'}}></span>
                                        <span className="w-1.5 h-1.5 bg-primary-400 rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></span>
                                        <span className="w-1.5 h-1.5 bg-primary-400 rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></span>
                                    </div>
                                ) : (
                                    <ReactMarkdown children={msg.content} remarkPlugins={[remarkGfm]} components={{ code({ node, className, children, ...props }) {
                                                const match = /language-(\w+)/.exec(className || '');
                                                const codeContent = String(children).replace(/\n$/, '');
                                                return match ? (<CodeBlock language={match[1]} code={codeContent} />) : (<code className={className} {...props}>{children}</code>);
                                    }}} />
                                )}
                            </div>
                             {msg.role === 'user' && (<div className="w-8 h-8 rounded-full bg-dark-700 flex items-center justify-center flex-shrink-0"><UserIcon className="w-5 h-5 text-gray-400" /></div>)}
                        </div>
                    ))
                )}
                <div ref={messagesEndRef} />
            </div>
            <div className="flex-shrink-0 mt-6 pt-4 border-t border-dark-700">
                <div className="relative">
                    <textarea value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())} placeholder="Ask the AI..." className="w-full bg-dark-800 border border-dark-700 text-white rounded-lg py-3 pl-4 pr-16 resize-none focus:outline-none focus:ring-2 focus:ring-primary-500 transition" rows={1} disabled={isLoading}/>
                    <button onClick={() => handleSend()} disabled={isLoading || !input.trim()} className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-md bg-primary-500 hover:bg-primary-600 disabled:bg-dark-600 disabled:text-gray-500 disabled:cursor-not-allowed transition-colors"><SendIcon className="w-5 h-5 text-white" /></button>
                </div>
            </div>
        </div>
    );
};

export default GeminiAssistantPlugin;