


import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type { VaultEntry } from '../types';
import * as vaultService from '../services/vaultService';
import { AddIcon, CopyIcon, DeleteIcon, EditIcon, EyeIcon, EyeSlashIcon, LinkIcon, LockIcon, NoteIcon, RefreshIcon, SaveIcon, SearchIcon, UserIcon, XCircleIcon, TagIcon, CheckIcon } from './Icons';
import { useNotification } from '../App';

// --- Sub-component: Password Strength ---
const PasswordStrength: React.FC<{ password?: string }> = ({ password = '' }) => {
    const getStrength = () => {
        let score = 0;
        if (!password) return 0;
        if (password.length >= 8) score++;
        if (password.length >= 12) score++;
        if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
        if (/\d/.test(password)) score++;
        if (/[^a-zA-Z0-9]/.test(password)) score++;
        return score;
    };

    const strength = getStrength();
    const widthMap = ['0%', '20%', '40%', '60%', '80%', '100%'];
    const colorMap = ['bg-gray-500', 'bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-lime-500', 'bg-green-500'];
    const labelMap = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong', 'Very Strong'];

    return (
        <div>
            <div className="strength-bar">
                <div className={`strength-bar-inner ${colorMap[strength]}`} style={{ width: widthMap[strength] }}></div>
            </div>
            <p className={`text-xs text-right mt-1 ${strength > 0 ? colorMap[strength].replace('bg-', 'text-') : 'text-gray-400'}`}>
                {labelMap[strength]}
            </p>
        </div>
    );
};


// --- Sub-component: VaultForm ---
const VaultForm: React.FC<{
    item: VaultEntry | null;
    onSubmit: (item: VaultEntry) => void;
    onCancel: () => void;
    generatedPasswordToUse: string | null;
}> = ({ item, onSubmit, onCancel, generatedPasswordToUse }) => {
    const [formData, setFormData] = useState<VaultEntry>({ id: '', title: '', username: '', password: '', url: '', notes: '', tags: [] });
    const [showPassword, setShowPassword] = useState(false);
    const [tagInput, setTagInput] = useState('');

    useEffect(() => {
        setFormData(item || { id: '', title: '', username: '', password: '', url: '', notes: '', tags: [] });
    }, [item]);
    
    useEffect(() => {
        if (generatedPasswordToUse) {
            setFormData(prev => ({ ...prev, password: generatedPasswordToUse }));
        }
    }, [generatedPasswordToUse]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            const newTag = tagInput.trim().toLowerCase();
            if (newTag && !formData.tags?.includes(newTag)) {
                setFormData(prev => ({...prev, tags: [...(prev.tags || []), newTag]}));
            }
            setTagInput('');
        }
    };
    
    const removeTag = (tagToRemove: string) => {
        setFormData(prev => ({ ...prev, tags: prev.tags?.filter(t => t !== tagToRemove) }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.title || !formData.username) return;
        onSubmit(formData);
    };

    return (
        <div className="flex flex-col h-full animate-fade-in-up">
        <form onSubmit={handleSubmit} className="flex-1 p-4 bg-dark-800 rounded-lg border border-dark-700 overflow-y-auto">
            <h4 className="text-lg font-bold text-gray-300 mb-6">{item?.id ? 'Edit Entry' : 'Add New Entry'}</h4>
            <div className="space-y-4">
                <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">Title</label>
                    <input type="text" name="title" placeholder="e.g. GitHub Account" value={formData.title} onChange={handleChange} className="w-full bg-dark-900 border border-dark-600 rounded-md py-1.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" required />
                </div>
                 <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">Username</label>
                    <input type="text" name="username" placeholder="e.g. user@example.com" value={formData.username} onChange={handleChange} className="w-full bg-dark-900 border border-dark-600 rounded-md py-1.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" required />
                </div>
                <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">Password</label>
                    <div className="relative">
                        <input type={showPassword ? 'text' : 'password'} name="password" value={formData.password} onChange={handleChange} className="w-full bg-dark-900 border border-dark-600 rounded-md py-1.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-primary-400" data-tooltip={showPassword ? "Hide password" : "Show password"}>
                            {showPassword ? <EyeSlashIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                        </button>
                    </div>
                    <PasswordStrength password={formData.password} />
                </div>
                <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">URL</label>
                    <input type="url" name="url" placeholder="https://..." value={formData.url} onChange={handleChange} className="w-full bg-dark-900 border border-dark-600 rounded-md py-1.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
                </div>
                <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">Tags</label>
                    <div className="flex flex-wrap gap-2 items-center bg-dark-900 border border-dark-600 rounded-md p-2">
                        {formData.tags?.map(tag => (
                            <span key={tag} className="flex items-center bg-primary-500/30 text-primary-200 text-xs font-medium px-2 py-0.5 rounded-full">
                                {tag}
                                <button type="button" onClick={() => removeTag(tag)} className="ml-1.5 text-primary-200/70 hover:text-white"><XCircleIcon className="w-3.5 h-3.5"/></button>
                            </span>
                        ))}
                        <input 
                            type="text"
                            value={tagInput}
                            onChange={(e) => setTagInput(e.target.value)}
                            onKeyDown={handleTagKeyDown}
                            placeholder={formData.tags?.length ? "" : "Add tags..."}
                            className="bg-transparent flex-1 text-sm focus:outline-none min-w-20"
                        />
                    </div>
                </div>
                <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">Notes</label>
                    <textarea name="notes" rows={3} value={formData.notes} onChange={handleChange} className="w-full bg-dark-900 border border-dark-600 rounded-md py-1.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"></textarea>
                </div>
            </div>
            <div className="flex space-x-2 mt-6">
                <button type="button" onClick={onCancel} className="flex-1 bg-dark-700 hover:bg-dark-600 text-gray-300 font-bold py-2 px-4 rounded-md text-sm">Cancel</button>
                <button type="submit" className="flex-1 bg-primary-500 hover:bg-primary-600 text-white font-bold py-2 px-4 rounded-md text-sm flex items-center justify-center space-x-2">
                    <SaveIcon className="w-4 h-4" />
                    <span>{item?.id ? 'Save Changes' : 'Add Entry'}</span>
                </button>
            </div>
        </form>
        </div>
    );
};

// --- Sub-component: PasswordGenerator ---
const PasswordGenerator: React.FC<{ onApply: (password: string) => void; isFormVisible: boolean; }> = ({ onApply, isFormVisible }) => {
    const [length, setLength] = useState(16);
    const [options, setOptions] = useState({ uppercase: true, numbers: true, symbols: true });
    const [password, setPassword] = useState('');
    const [copied, setCopied] = useState(false);
    const addNotification = useNotification();

    const generatePassword = useCallback(() => {
        const lowerChars = 'abcdefghijklmnopqrstuvwxyz';
        const upperChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        const numberChars = '0123456789';
        const symbolChars = '!@#$%^&*()_+-=[]{}|;:,.<>?';

        let charSet = lowerChars;
        if (options.uppercase) charSet += upperChars;
        if (options.numbers) charSet += numberChars;
        if (options.symbols) charSet += symbolChars;
        
        if (charSet === '') { // Ensure charset is not empty
            setPassword('');
            return;
        }

        let newPassword = '';
        const cryptoArray = new Uint32Array(length);
        window.crypto.getRandomValues(cryptoArray);
        for (let i = 0; i < length; i++) {
            newPassword += charSet[cryptoArray[i] % charSet.length];
        }
        setPassword(newPassword);
    }, [length, options]);

    useEffect(() => {
        generatePassword();
    }, [generatePassword]);

    const handleCopy = () => {
        if (!password) return;
        navigator.clipboard.writeText(password);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };
    
    const handleOptionChange = (option: keyof typeof options) => {
        setOptions(prev => ({ ...prev, [option]: !prev[option] }));
    };
    
     const handleApply = () => {
        if (password) {
            onApply(password);
            addNotification('Password applied to form.', 'info');
        }
    };

    return (
        <div className="bg-dark-800 border border-dark-700 rounded-lg p-4">
            <h4 className="text-base font-bold text-gray-300 mb-3">Password Generator</h4>
            <div className="relative mb-2">
                <input
                    type="text"
                    readOnly
                    value={password}
                    placeholder="Generating..."
                    className="w-full bg-dark-900 border border-dark-600 rounded-md py-2 px-3 text-sm font-mono focus:outline-none"
                />
                 <button 
                    onClick={handleCopy} 
                    className={`absolute right-2 top-1/2 -translate-y-1/2 transition-colors ${copied ? 'text-green-400' : 'text-gray-400 hover:text-primary-400'}`} 
                    data-tooltip="Copy password"
                >
                    {copied ? <CheckIcon className="w-5 h-5" /> : <CopyIcon className="w-5 h-5" />}
                </button>
            </div>
            <PasswordStrength password={password} />
            <div className="space-y-3 my-4 text-sm">
                <div>
                    <label htmlFor="length-range" className="flex justify-between items-center text-gray-400 mb-1">
                        <span>Length</span>
                        <span className="font-mono text-primary-300 text-base">{length}</span>
                    </label>
                    <input id="length-range" type="range" min="8" max="32" value={length} onChange={e => setLength(parseInt(e.target.value, 10))} className="w-full h-1.5 bg-dark-600 rounded-lg appearance-none cursor-pointer accent-primary-500" />
                </div>
                <div className="flex justify-between items-center">
                    <label htmlFor="uppercase" className="text-gray-300 select-none cursor-pointer">Include Uppercase (A-Z)</label>
                    <input id="uppercase" type="checkbox" checked={options.uppercase} onChange={() => handleOptionChange('uppercase')} className="w-4 h-4 text-primary-500 bg-dark-700 border-dark-600 rounded focus:ring-primary-600 cursor-pointer" />
                </div>
                 <div className="flex justify-between items-center">
                    <label htmlFor="numbers" className="text-gray-300 select-none cursor-pointer">Include Numbers (0-9)</label>
                    <input id="numbers" type="checkbox" checked={options.numbers} onChange={() => handleOptionChange('numbers')} className="w-4 h-4 text-primary-500 bg-dark-700 border-dark-600 rounded focus:ring-primary-600 cursor-pointer" />
                </div>
                 <div className="flex justify-between items-center">
                    <label htmlFor="symbols" className="text-gray-300 select-none cursor-pointer">Include Symbols (!@#)</label>
                    <input id="symbols" type="checkbox" checked={options.symbols} onChange={() => handleOptionChange('symbols')} className="w-4 h-4 text-primary-500 bg-dark-700 border-dark-600 rounded focus:ring-primary-600 cursor-pointer" />
                </div>
            </div>
            <div className="flex flex-col space-y-2 mt-4">
                <button onClick={generatePassword} className="w-full bg-dark-700 hover:bg-dark-600 text-gray-200 font-bold py-2 px-4 rounded-md text-sm flex items-center justify-center space-x-2">
                    <RefreshIcon className="w-4 h-4" /><span>Generate New</span>
                </button>
                <button onClick={handleApply} disabled={!password || !isFormVisible} className="w-full bg-primary-500/20 hover:bg-primary-500/30 text-primary-300 font-bold py-2 px-4 rounded-md text-sm flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-dark-700/50 disabled:text-gray-500" title={!isFormVisible ? "Open 'Add New Entry' form first" : ""}>
                    <AddIcon className="w-4 h-4" /><span>Apply to Form</span>
                </button>
            </div>
        </div>
    );
};

// --- Main Component: PasswordManager ---
const PasswordManager: React.FC<{ 
    masterKey: CryptoKey | null;
    setMasterKey: (key: CryptoKey | null) => void; 
    setActions: (actions: { addNew: () => void }) => void;
}> = ({ masterKey, setMasterKey, setActions }) => {
    const [secrets, setSecrets] = useState<VaultEntry[]>([]);
    const [currentForm, setCurrentForm] = useState<{mode: 'add' | 'edit'; data: VaultEntry | null}>({ mode: 'add', data: null });
    const [isFormVisible, setIsFormVisible] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [generatedPasswordForForm, setGeneratedPasswordForForm] = useState<string | null>(null);
    const [activeTag, setActiveTag] = useState<string | null>(null);
    const addNotification = useNotification();

    const isLocked = !masterKey;

    const allTags = useMemo(() => {
        const tags = new Set<string>();
        secrets.forEach(s => s.tags?.forEach(t => tags.add(t)));
        return Array.from(tags).sort();
    }, [secrets]);

    const filteredSecrets = useMemo(() => {
        return secrets.filter(secret => {
            const matchesSearch = searchTerm ?
                secret.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                secret.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                secret.url?.toLowerCase().includes(searchTerm.toLowerCase()) : true;

            const matchesTag = activeTag ? secret.tags?.includes(activeTag) : true;
            
            return matchesSearch && matchesTag;
        });
    }, [searchTerm, secrets, activeTag]);

    const loadSecrets = useCallback(async (key: CryptoKey) => {
        const storedSecrets = await vaultService.listSecrets(key);
        const vaultEntries = storedSecrets.map(s => ({ ...s.item, id: s.id })) as VaultEntry[];
        setSecrets(vaultEntries.sort((a,b) => a.title.localeCompare(b.title)));
    }, []);
    
    useEffect(() => {
        if (!isLocked && masterKey) {
            loadSecrets(masterKey);
        } else {
            setSecrets([]);
        }
    }, [isLocked, masterKey, loadSecrets]);
    
    const handleAddNew = useCallback(() => {
        setCurrentForm({ mode: 'add', data: null });
        setIsFormVisible(true);
        setGeneratedPasswordForForm(null);
    }, []);

    useEffect(() => {
        setActions({ addNew: handleAddNew });
    }, [setActions, handleAddNew]);

    const handleUnlock = (key: CryptoKey) => { 
        setMasterKey(key); 
        addNotification('Vault unlocked successfully!', 'success');
    };
    const handleEdit = (item: VaultEntry) => { setCurrentForm({ mode: 'edit', data: item }); setIsFormVisible(true); setGeneratedPasswordForForm(null);};
    const handleCancelForm = () => { setIsFormVisible(false); setCurrentForm({ mode: 'add', data: null }); setGeneratedPasswordForForm(null); };

    const handleSaveItem = async (item: VaultEntry) => {
        if (!masterKey) return;
        const id = item.id || `entry_${Date.now()}`;
        const entryToSave = { ...item };
        delete entryToSave.id;
        await vaultService.addSecret(masterKey, id, entryToSave);
        addNotification(`Entry "${item.title}" saved.`, 'success');
        handleCancelForm();
        await loadSecrets(masterKey);
    };
    
    const handleDeleteItem = async (item: VaultEntry) => {
        if (!masterKey || !window.confirm(`Are you sure you want to delete "${item.title}"?`)) return;
        await vaultService.removeSecret(masterKey, item.id);
        addNotification(`Entry "${item.title}" deleted.`, 'info');
        await loadSecrets(masterKey);
    };
    
    const handleApplyPassword = (password: string) => {
        setGeneratedPasswordForForm(password);
        if (!isFormVisible) {
            handleAddNew();
        }
    };
    
    const handleLockVault = () => {
        setMasterKey(null);
        addNotification('Vault has been locked.', 'info');
    };

    const UnlockScreen: React.FC<{ onUnlock: (key: CryptoKey) => void }> = ({ onUnlock }) => {
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleUnlockSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!password) return;
        setIsLoading(true);
        setError('');
        try {
            const key = await vaultService.initVault(password);
            const data = await vaultService.decryptVault(key);
            if (data === null) {
                throw new Error("Invalid master password or corrupted data.");
            }
            onUnlock(key);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to unlock vault. Please check your password.';
            setError(errorMessage);
            addNotification(errorMessage, 'error');
            setIsLoading(false);
        }
    };

    return (
        <div className="flex-1 flex items-center justify-center p-4 bg-dark-900">
            <div className="w-full max-w-sm mx-auto animate-fade-in-up">
                 <form onSubmit={handleUnlockSubmit} className="bg-dark-800 p-8 rounded-2xl shadow-2xl shadow-black/30 border border-dark-700">
                    <div className="text-center mb-6">
                        <LockIcon className="w-12 h-12 text-primary-500 mx-auto mb-3" />
                        <h2 className="text-2xl font-bold text-white">Vault Locked</h2>
                        <p className="text-gray-400 text-sm mt-1">Enter your master password to continue.</p>
                    </div>
                    <div className="mb-4">
                        <label className="block text-gray-400 text-xs font-bold mb-2" htmlFor="master-password">Master Password</label>
                        <input
                            id="master-password"
                            type="password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            className="w-full bg-dark-900 border border-dark-600 text-white rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-primary-500 transition"
                            placeholder="••••••••••••"
                        />
                    </div>
                    {error && <p className="text-red-500 text-xs italic mb-4">{error}</p>}
                    <button type="submit" disabled={isLoading || !password} className="w-full bg-primary-500 hover:bg-primary-600 text-white font-bold py-2 px-4 rounded-md disabled:opacity-50 disabled:cursor-not-allowed">
                        {isLoading ? 'Unlocking...' : 'Unlock'}
                    </button>
                </form>
            </div>
        </div>
    );
};
    const CopyButton: React.FC<{textToCopy?: string, fieldName: string}> = ({ textToCopy, fieldName }) => {
        const [copied, setCopied] = useState(false);
        const copyToClipboard = () => { 
            if (textToCopy) {
                navigator.clipboard.writeText(textToCopy);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
            }
        };

        return (
            <button onClick={copyToClipboard} className={`transition-colors ${copied ? 'text-green-400' : 'text-gray-500 hover:text-primary-400'}`} data-tooltip={`Copy ${fieldName}`}>
                {copied ? <CheckIcon className="w-4 h-4" /> : <CopyIcon className="w-4 h-4" />}
            </button>
        );
    }

    const VaultItemComponent: React.FC<{ item: VaultEntry; onEdit: (item: VaultEntry) => void; onDelete: (item: VaultEntry) => void; }> = ({ item, onEdit, onDelete }) => {
         const [showPassword, setShowPassword] = useState(false);
         
         return (
        <div className="bg-dark-800 border border-dark-700 rounded-lg p-4 transition-all hover:border-primary-500/30 hover:shadow-lg hover:shadow-black/20 hover:-translate-y-0.5">
            <div className="flex justify-between items-start">
                <h3 className="text-lg font-bold text-gray-100 flex-1 truncate">{item.title}</h3>
                <div className="flex space-x-3 ml-4">
                    <button onClick={() => onEdit(item)} className="text-gray-400 hover:text-primary-400" data-tooltip="Edit"><EditIcon className="w-4 h-4" /></button>
                    <button onClick={() => onDelete(item)} className="text-gray-400 hover:text-red-400" data-tooltip="Delete"><DeleteIcon className="w-4 h-4" /></button>
                </div>
            </div>
            {item.tags && item.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                    {item.tags.map(tag => (
                        <span key={tag} className="bg-primary-500/20 text-primary-200 text-xs font-medium px-2 py-0.5 rounded-full">{tag}</span>
                    ))}
                </div>
            )}
            <div className="mt-3 space-y-2 text-sm">
                 <div className="flex items-center">
                    <UserIcon className="w-4 h-4 text-gray-500 mr-3 shrink-0" />
                    <span className="text-gray-300 font-mono flex-1 truncate">{item.username}</span>
                    <div className="ml-2"><CopyButton textToCopy={item.username} fieldName="Username" /></div>
                </div>
                {item.password && (
                     <div className="flex items-center">
                        <LockIcon className="w-4 h-4 text-gray-500 mr-3 shrink-0" />
                        <span className="text-gray-300 font-mono flex-1">{showPassword ? item.password : '••••••••••••'}</span>
                        <div className="flex items-center space-x-2 ml-2">
                            <button onClick={() => setShowPassword(!showPassword)} className="text-gray-500 hover:text-primary-400" data-tooltip={showPassword ? "Hide password" : "Show password"}>
                                {showPassword ? <EyeSlashIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                            </button>
                            <CopyButton textToCopy={item.password} fieldName="Password" />
                        </div>
                    </div>
                )}
                {item.url && (
                    <div className="flex items-center">
                        <LinkIcon className="w-4 h-4 text-gray-500 mr-3 shrink-0" />
                        <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline truncate flex-1">{item.url}</a>
                    </div>
                )}
                 {item.notes && (
                    <div className="flex items-start pt-2">
                        <NoteIcon className="w-4 h-4 text-gray-500 mr-3 mt-1 shrink-0" />
                        <p className="text-gray-400 whitespace-pre-wrap text-xs flex-1">{item.notes}</p>
                    </div>
                )}
            </div>
        </div>
    );
    };
    
    if (isLocked) return <UnlockScreen onUnlock={handleUnlock} />;

    return (
        <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full">
                {isFormVisible ? (
                     <div className="md:col-span-3">
                        <VaultForm item={currentForm.data} onSubmit={handleSaveItem} onCancel={handleCancelForm} generatedPasswordToUse={generatedPasswordForForm} />
                     </div>
                ) : (
                    <>
                    <div className="md:col-span-2 flex flex-col h-full animate-fade-in-up">
                         <div className="flex-shrink-0 mb-4">
                            <div className="relative">
                                <SearchIcon className="w-5 h-5 text-gray-500 absolute top-1/2 left-3 -translate-y-1/2"/>
                                <input type="text" placeholder={`Search ${secrets.length} entries...`} value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full bg-dark-800 border border-dark-700 text-white rounded-md py-2 pl-10 pr-8 focus:outline-none focus:ring-2 focus:ring-primary-500"/>
                                {searchTerm && <button onClick={() => setSearchTerm('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"><XCircleIcon className="w-5 h-5"/></button>}
                            </div>
                            {allTags.length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-3">
                                    <button onClick={() => setActiveTag(null)} className={`text-xs px-2 py-1 rounded-full ${!activeTag ? 'bg-primary-500 text-white font-semibold' : 'bg-dark-700 hover:bg-dark-600 text-gray-300'}`}>All</button>
                                    {allTags.map(tag => (
                                        <button key={tag} onClick={() => setActiveTag(tag)} className={`text-xs px-2 py-1 rounded-full ${activeTag === tag ? 'bg-primary-500 text-white font-semibold' : 'bg-dark-700 hover:bg-dark-600 text-gray-300'}`}>{tag}</button>
                                    ))}
                                </div>
                            )}
                         </div>
                        <div className="flex-1 space-y-3 overflow-y-auto pr-2">
                            {filteredSecrets.map((s, i) => 
                                <div key={s.id} className="animate-stagger-in" style={{animationDelay: `${i * 30}ms`}}>
                                    <VaultItemComponent item={s} onEdit={handleEdit} onDelete={handleDeleteItem} />
                                </div>
                            )}
                            {filteredSecrets.length === 0 && <div className="text-center text-gray-500 py-16"><h3 className="text-lg">No entries found</h3><p className="text-sm">Try adjusting your search or selected tag.</p></div>}
                        </div>
                    </div>
                    
                    <div className="md:col-span-1 space-y-6 animate-fade-in-up" style={{animationDelay: '150ms'}}>
                         <button onClick={handleAddNew} className="w-full bg-primary-500 hover:bg-primary-600 text-white font-bold py-3 px-4 rounded-md text-sm flex items-center justify-center space-x-2">
                            <AddIcon className="w-5 h-5"/><span>Add New Entry</span>
                        </button>
                        <PasswordGenerator onApply={handleApplyPassword} isFormVisible={isFormVisible} />
                         <button onClick={handleLockVault} className="w-full bg-red-500/10 hover:bg-red-500/20 text-red-400 font-bold py-2 px-4 rounded-md text-sm flex items-center justify-center space-x-2">
                            <LockIcon className="w-4 h-4"/><span>Lock Vault</span>
                        </button>
                    </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default PasswordManager;