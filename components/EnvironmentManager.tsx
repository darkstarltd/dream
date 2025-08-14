
import React, { useState, useEffect, useMemo } from 'react';
import { EnvFile, EnvVariable } from '../types';
import { useNotification } from '../App';
import { AddIcon, DeleteIcon, EditIcon, SaveIcon, XCircleIcon, EyeIcon, EyeSlashIcon, ExportIcon, FileIcon } from './Icons';

const EnvironmentManager: React.FC = () => {
    const [envFiles, setEnvFiles] = useState<EnvFile[]>([]);
    const [activeFileId, setActiveFileId] = useState<string | null>(null);
    const addNotification = useNotification();
    
    useEffect(() => {
        const savedFiles = localStorage.getItem('ds_env_files');
        if (savedFiles) {
            const parsedFiles = JSON.parse(savedFiles);
            setEnvFiles(parsedFiles);
            if (parsedFiles.length > 0) {
                setActiveFileId(parsedFiles[0].id);
            }
        } else {
            // Create a default file if none exist
            const defaultFile: EnvFile = { id: `env_${Date.now()}`, name: '.env.development', variables: [] };
            setEnvFiles([defaultFile]);
            setActiveFileId(defaultFile.id);
        }
    }, []);

    useEffect(() => {
        localStorage.setItem('ds_env_files', JSON.stringify(envFiles));
    }, [envFiles]);

    const activeFile = useMemo(() => envFiles.find(f => f.id === activeFileId), [envFiles, activeFileId]);

    const handleCreateFile = () => {
        const newName = prompt('Enter new environment file name:', '.env.production');
        if (newName && !envFiles.some(f => f.name === newName)) {
            const newFile: EnvFile = { id: `env_${Date.now()}`, name: newName, variables: [] };
            setEnvFiles(prev => [...prev, newFile]);
            setActiveFileId(newFile.id);
            addNotification(`Created file: ${newName}`, 'success');
        } else if (newName) {
            addNotification('A file with that name already exists.', 'error');
        }
    };

    const handleDeleteFile = (id: string) => {
        const fileToDelete = envFiles.find(f => f.id === id);
        if (fileToDelete && window.confirm(`Are you sure you want to delete ${fileToDelete.name}?`)) {
            const newFiles = envFiles.filter(f => f.id !== id);
            setEnvFiles(newFiles);
            if (activeFileId === id) {
                setActiveFileId(newFiles.length > 0 ? newFiles[0].id : null);
            }
            addNotification(`Deleted file: ${fileToDelete.name}`, 'info');
        }
    };

    const handleUpdateVariable = (varId: string, key: string, value: string) => {
        setEnvFiles(prev => prev.map(f => f.id === activeFileId ? {
            ...f,
            variables: f.variables.map(v => v.id === varId ? { ...v, key, value } : v)
        } : f));
    };

    const handleAddVariable = () => {
        const newVar: EnvVariable = { id: `var_${Date.now()}`, key: '', value: '', isHidden: false };
        setEnvFiles(prev => prev.map(f => f.id === activeFileId ? {
            ...f, variables: [...f.variables, newVar]
        } : f));
    };
    
    const handleDeleteVariable = (varId: string) => {
         setEnvFiles(prev => prev.map(f => f.id === activeFileId ? {
            ...f, variables: f.variables.filter(v => v.id !== varId)
        } : f));
    };
    
    const handleToggleVisibility = (varId: string) => {
        setEnvFiles(prev => prev.map(f => f.id === activeFileId ? {
            ...f, variables: f.variables.map(v => v.id === varId ? {...v, isHidden: !v.isHidden} : v)
        } : f));
    };

    const handleExport = () => {
        if (!activeFile) return;
        const content = activeFile.variables
            .map(v => `${v.key}=${v.value}`)
            .join('\n');
        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = activeFile.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        addNotification(`Exported ${activeFile.name}`, 'success');
    };

    return (
        <div className="p-6 h-full flex flex-col bg-dark-900">
            <div className="grid grid-cols-12 gap-6 flex-1 min-h-0">
                <div className="col-span-3 bg-dark-800 border border-dark-700 rounded-lg p-4 flex flex-col">
                    <h3 className="text-lg font-bold text-gray-200 mb-4">Environments</h3>
                    <div className="flex-1 overflow-y-auto pr-2 space-y-1">
                        {envFiles.map(file => (
                            <button
                                key={file.id}
                                onClick={() => setActiveFileId(file.id)}
                                className={`w-full text-left p-2 rounded-md font-mono text-sm flex items-center justify-between transition-colors ${
                                    activeFileId === file.id ? 'bg-primary-500/20 text-primary-300' : 'text-gray-400 hover:bg-dark-700'
                                }`}
                            >
                                <span className="truncate">{file.name}</span>
                                <button onClick={(e) => { e.stopPropagation(); handleDeleteFile(file.id); }} className="text-gray-500 hover:text-red-400 opacity-0 hover:opacity-100"><DeleteIcon className="w-4 h-4"/></button>
                            </button>
                        ))}
                    </div>
                    <button onClick={handleCreateFile} className="mt-4 w-full bg-dark-700 hover:bg-dark-600 text-gray-300 font-bold py-2 px-4 rounded-md text-sm flex items-center justify-center space-x-2">
                        <AddIcon className="w-4 h-4"/><span>New File</span>
                    </button>
                </div>

                <div className="col-span-9 bg-dark-800 border border-dark-700 rounded-lg p-4 flex flex-col">
                    {activeFile ? (
                        <>
                            <div className="flex justify-between items-center mb-4 flex-shrink-0">
                                <h2 className="text-xl font-bold text-white font-mono">{activeFile.name}</h2>
                                <button onClick={handleExport} className="bg-primary-500 hover:bg-primary-600 text-white font-bold py-2 px-3 rounded-md text-sm flex items-center space-x-2">
                                    <ExportIcon className="w-4 h-4"/><span>Export</span>
                                </button>
                            </div>
                            <div className="flex-1 min-h-0 overflow-y-auto">
                                <div className="space-y-2 pr-2">
                                    {activeFile.variables.map(variable => (
                                        <div key={variable.id} className="grid grid-cols-12 gap-2 items-center">
                                            <input type="text" placeholder="KEY" value={variable.key} onChange={e => handleUpdateVariable(variable.id, e.target.value, variable.value)} className="col-span-4 bg-dark-900 border border-dark-600 rounded-md py-1.5 px-3 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-primary-500" />
                                            <div className="col-span-7 relative">
                                                <input type={variable.isHidden ? 'password' : 'text'} placeholder="VALUE" value={variable.value} onChange={e => handleUpdateVariable(variable.id, variable.key, e.target.value)} className="w-full bg-dark-900 border border-dark-600 rounded-md py-1.5 px-3 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-primary-500" />
                                                <button onClick={() => handleToggleVisibility(variable.id)} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-primary-400">
                                                    {variable.isHidden ? <EyeIcon className="w-4 h-4"/> : <EyeSlashIcon className="w-4 h-4"/>}
                                                </button>
                                            </div>
                                            <button onClick={() => handleDeleteVariable(variable.id)} className="col-span-1 text-gray-500 hover:text-red-400 p-1 flex justify-center items-center">
                                                <DeleteIcon className="w-5 h-5"/>
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                             <div className="mt-4 flex-shrink-0">
                                <button onClick={handleAddVariable} className="bg-dark-700 hover:bg-dark-600 text-gray-300 font-bold py-2 px-4 rounded-md text-sm">Add Variable</button>
                            </div>
                        </>
                    ) : (
                         <div className="flex flex-col items-center justify-center h-full text-center text-gray-500">
                            <FileIcon className="w-16 h-16 text-gray-600 mb-4" />
                            <h3 className="text-lg font-semibold">No Environment Selected</h3>
                            <p className="text-sm">Create or select an environment file from the left panel.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default EnvironmentManager;
