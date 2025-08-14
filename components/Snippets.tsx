


import React, { useState, useEffect, useMemo } from 'react';
import { CodeSnippet } from '../types';
import { useNotification } from '../App';
import { AddIcon, SearchIcon, XCircleIcon, TagIcon, EditIcon, DeleteIcon, CopyIcon, SparklesIcon, ScratchpadIcon, CheckIcon, SaveIcon, SnippetIcon } from './Icons';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import type { View } from '../App';

interface SnippetsProps {
    setActiveView: (view: View) => void;
    setCodeForAi: (code: string) => void;
    setCodeForScratchpad: (code: string) => void;
}

const SnippetFormModal: React.FC<{
    snippet: CodeSnippet | null;
    onSave: (snippet: CodeSnippet) => void;
    onClose: () => void;
}> = ({ snippet, onSave, onClose }) => {
    const [formData, setFormData] = useState<CodeSnippet>({ id: '', title: '', language: 'javascript', code: '', tags: [], description: '' });
    const [tagInput, setTagInput] = useState('');

    useEffect(() => {
        setFormData(snippet || { id: '', title: '', language: 'javascript', code: '', tags: [], description: '' });
    }, [snippet]);
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
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
        setFormData(prev => ({ ...prev, tags: prev.tags.filter(t => t !== tagToRemove) }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.title || !formData.code) return;
        onSave(formData);
    };

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
            <form onSubmit={handleSubmit} className="bg-dark-800 border border-dark-700 rounded-lg shadow-2xl w-full max-w-2xl animate-scale-in" onClick={e => e.stopPropagation()}>
                <div className="p-6 border-b border-dark-700">
                    <h3 className="text-lg font-bold text-white">{snippet ? 'Edit Snippet' : 'Add New Snippet'}</h3>
                </div>
                <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                    <input type="text" name="title" placeholder="Snippet Title" value={formData.title} onChange={handleChange} className="w-full bg-dark-900 border border-dark-600 rounded-md py-1.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" required />
                    <textarea name="description" placeholder="Description (optional)" value={formData.description} onChange={handleChange} rows={2} className="w-full bg-dark-900 border border-dark-600 rounded-md py-1.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none" />
                    <select name="language" value={formData.language} onChange={handleChange} className="w-full bg-dark-900 border border-dark-600 rounded-md py-1.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
                        <option value="javascript">JavaScript</option>
                        <option value="typescript">TypeScript</option>
                        <option value="python">Python</option>
                        <option value="html">HTML</option>
                        <option value="css">CSS</option>
                        <option value="tsx">TSX</option>
                        <option value="jsx">JSX</option>
                        <option value="json">JSON</option>
                        <option value="sql">SQL</option>
                        <option value="bash">Bash</option>
                    </select>
                    <textarea name="code" placeholder="Your code snippet..." value={formData.code} onChange={handleChange} rows={8} className="w-full bg-dark-900 border border-dark-600 rounded-md p-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none" spellCheck="false" required />
                    <div className="flex flex-wrap gap-2 items-center bg-dark-900 border border-dark-600 rounded-md p-2">
                        {formData.tags?.map(tag => (
                            <span key={tag} className="flex items-center bg-primary-500/30 text-primary-200 text-xs font-medium px-2 py-0.5 rounded-full">
                                {tag}
                                <button type="button" onClick={() => removeTag(tag)} className="ml-1.5 text-primary-200/70 hover:text-white"><XCircleIcon className="w-3.5 h-3.5"/></button>
                            </span>
                        ))}
                        <input type="text" value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={handleTagKeyDown} placeholder={formData.tags?.length ? "" : "Add tags (press Enter)..."} className="bg-transparent flex-1 text-sm focus:outline-none min-w-20" />
                    </div>
                </div>
                <div className="p-4 bg-dark-800/50 border-t border-dark-700 flex justify-end space-x-2">
                    <button type="button" onClick={onClose} className="bg-dark-700 hover:bg-dark-600 text-gray-300 font-bold py-2 px-4 rounded-md text-sm">Cancel</button>
                    <button type="submit" className="bg-primary-500 hover:bg-primary-600 text-white font-bold py-2 px-4 rounded-md text-sm flex items-center space-x-2">
                        <SaveIcon className="w-4 h-4" /><span>Save Snippet</span>
                    </button>
                </div>
            </form>
        </div>
    );
};


const Snippets: React.FC<SnippetsProps> = ({ setActiveView, setCodeForAi, setCodeForScratchpad }) => {
    const [snippets, setSnippets] = useState<CodeSnippet[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTag, setActiveTag] = useState<string | null>(null);
    const [selectedSnippet, setSelectedSnippet] = useState<CodeSnippet | null>(null);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [copiedSnippetId, setCopiedSnippetId] = useState<string | null>(null);
    const addNotification = useNotification();

    useEffect(() => {
        const savedSnippets = localStorage.getItem('ds_code_snippets');
        if (savedSnippets) {
            setSnippets(JSON.parse(savedSnippets));
        }
    }, []);

    useEffect(() => {
        localStorage.setItem('ds_code_snippets', JSON.stringify(snippets));
    }, [snippets]);
    
    const allTags = useMemo(() => {
        const tags = new Set<string>();
        snippets.forEach(s => s.tags?.forEach(t => tags.add(t)));
        return Array.from(tags).sort();
    }, [snippets]);

    const filteredSnippets = useMemo(() => {
        return snippets.filter(snippet => {
            const searchLower = searchTerm.toLowerCase();
            const matchesSearch = searchTerm ?
                snippet.title.toLowerCase().includes(searchLower) ||
                snippet.description?.toLowerCase().includes(searchLower) ||
                snippet.language.toLowerCase().includes(searchLower) : true;
            const matchesTag = activeTag ? snippet.tags?.includes(activeTag) : true;
            return matchesSearch && matchesTag;
        }).sort((a,b) => a.title.localeCompare(b.title));
    }, [searchTerm, snippets, activeTag]);
    
    const handleSaveSnippet = (snippet: CodeSnippet) => {
        if (snippet.id) { // Editing existing
            setSnippets(prev => prev.map(s => s.id === snippet.id ? snippet : s));
            addNotification('Snippet updated!', 'success');
        } else { // Adding new
            const newSnippet = { ...snippet, id: `snippet_${Date.now()}`};
            setSnippets(prev => [...prev, newSnippet]);
            addNotification('New snippet saved!', 'success');
        }
        setIsFormOpen(false);
    };

    const handleDeleteSnippet = (id: string) => {
        if (window.confirm('Are you sure you want to delete this snippet?')) {
            setSnippets(prev => prev.filter(s => s.id !== id));
            if (selectedSnippet?.id === id) setSelectedSnippet(null);
            addNotification('Snippet deleted.', 'info');
        }
    };
    
    const handleCopyToClipboard = (code: string, id: string) => {
        navigator.clipboard.writeText(code);
        setCopiedSnippetId(id);
        setTimeout(() => setCopiedSnippetId(null), 2000);
    }
    
    const handleSendToScratchpad = (code: string) => {
        setCodeForScratchpad(code);
        setActiveView('scratchpad');
    }
    
    const handleExplainWithAI = (code: string) => {
        setCodeForAi(code);
        setActiveView('ai');
    }
    
    const handleAddNewClick = () => {
        setSelectedSnippet(null);
        setIsFormOpen(true);
    };

    return (
        <div className="p-6 h-full flex flex-col bg-dark-900">
            {isFormOpen && <SnippetFormModal snippet={selectedSnippet} onSave={handleSaveSnippet} onClose={() => {setIsFormOpen(false); setSelectedSnippet(null);}} />}
            <div className="grid grid-cols-12 gap-6 flex-1 min-h-0">
                {/* Left: List & Controls */}
                <div className="col-span-4 bg-dark-800 border border-dark-700 rounded-lg p-4 flex flex-col">
                    <div className="flex-shrink-0 mb-4">
                        <button onClick={handleAddNewClick} className="w-full bg-primary-500 hover:bg-primary-600 text-white font-bold py-2 px-4 rounded-md text-sm flex items-center justify-center space-x-2">
                            <AddIcon className="w-5 h-5"/><span>New Snippet</span>
                        </button>
                        <div className="relative mt-4">
                           <SearchIcon className="w-5 h-5 text-gray-500 absolute top-1/2 left-3 -translate-y-1/2"/>
                           <input type="text" placeholder="Search snippets..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full bg-dark-900 border border-dark-600 text-white rounded-md py-2 pl-10 pr-4 focus:outline-none focus:ring-1 focus:ring-primary-500"/>
                        </div>
                    </div>
                     {allTags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-4 flex-shrink-0">
                            <button onClick={() => setActiveTag(null)} className={`text-xs px-2 py-0.5 rounded-full ${!activeTag ? 'bg-primary-500/50 text-white font-semibold' : 'bg-dark-700 hover:bg-dark-600 text-gray-300'}`}>All</button>
                            {allTags.map(tag => (
                                <button key={tag} onClick={() => setActiveTag(tag)} className={`text-xs px-2 py-0.5 rounded-full ${activeTag === tag ? 'bg-primary-500/50 text-white font-semibold' : 'bg-dark-700 hover:bg-dark-600 text-gray-300'}`}>{tag}</button>
                            ))}
                        </div>
                    )}
                    <div className="flex-1 overflow-y-auto pr-2 space-y-2">
                        {filteredSnippets.map((s, i) => (
                             <div key={s.id} className="animate-stagger-in" style={{animationDelay: `${i * 30}ms`}}>
                                <button onClick={() => setSelectedSnippet(s)} className={`w-full text-left p-3 rounded-lg transition-colors ${selectedSnippet?.id === s.id ? 'bg-primary-500/20' : 'bg-dark-900/50 hover:bg-dark-700'}`}>
                                    <h4 className="font-semibold text-gray-200 truncate">{s.title}</h4>
                                    <p className="text-xs text-gray-500">{s.language}</p>
                                </button>
                            </div>
                        ))}
                         {filteredSnippets.length === 0 && <p className="text-center text-sm text-gray-500 py-8">No snippets found.</p>}
                    </div>
                </div>
                {/* Right: Viewer */}
                <div className="col-span-8 bg-dark-800 border border-dark-700 rounded-lg p-4 flex flex-col">
                    {selectedSnippet ? (
                        <>
                           <div className="flex-shrink-0 border-b border-dark-700 pb-3 mb-3">
                                <div className="flex justify-between items-center">
                                    <h2 className="text-xl font-bold text-white">{selectedSnippet.title}</h2>
                                    <div className="flex items-center space-x-2">
                                        <button onClick={() => { setIsFormOpen(true); }} className="text-gray-400 hover:text-primary-400 p-1" data-tooltip="Edit"><EditIcon className="w-4 h-4" /></button>
                                        <button onClick={() => handleDeleteSnippet(selectedSnippet.id)} className="text-gray-400 hover:text-red-400 p-1" data-tooltip="Delete"><DeleteIcon className="w-4 h-4" /></button>
                                    </div>
                                </div>
                                {selectedSnippet.description && <p className="text-sm text-gray-400 mt-1">{selectedSnippet.description}</p>}
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {selectedSnippet.tags?.map(tag => (
                                         <span key={tag} className="bg-primary-500/20 text-primary-200 text-xs font-medium px-2 py-0.5 rounded-full flex items-center"><TagIcon className="w-3 h-3 mr-1"/>{tag}</span>
                                    ))}
                                </div>
                           </div>
                           <div className="flex-1 min-h-0 overflow-y-auto relative">
                             <div className="absolute top-2 right-2 z-10 flex space-x-2">
                                <button onClick={() => handleCopyToClipboard(selectedSnippet.code, selectedSnippet.id)} className="bg-dark-700/80 hover:bg-dark-600 backdrop-blur-sm text-gray-300 text-xs font-semibold py-1 px-2.5 rounded-md flex items-center space-x-1.5">
                                    {copiedSnippetId === selectedSnippet.id ? <CheckIcon className="w-3.5 h-3.5 text-green-400" /> : <CopyIcon className="w-3.5 h-3.5" />}
                                    <span>{copiedSnippetId === selectedSnippet.id ? 'Copied' : 'Copy'}</span>
                                </button>
                                 <button onClick={() => handleSendToScratchpad(selectedSnippet.code)} className="bg-dark-700/80 hover:bg-dark-600 backdrop-blur-sm text-gray-300 text-xs font-semibold py-1 px-2.5 rounded-md flex items-center space-x-1.5">
                                    <ScratchpadIcon className="w-3.5 h-3.5" /><span>To Scratchpad</span>
                                </button>
                                <button onClick={() => handleExplainWithAI(selectedSnippet.code)} className="bg-dark-700/80 hover:bg-dark-600 backdrop-blur-sm text-gray-300 text-xs font-semibold py-1 px-2.5 rounded-md flex items-center space-x-1.5">
                                    <SparklesIcon className="w-3.5 h-3.5" /><span>Explain</span>
                                </button>
                             </div>
                              <SyntaxHighlighter language={selectedSnippet.language} useInlineStyles={false} wrapLines={true} showLineNumbers={true}>
                                {selectedSnippet.code}
                              </SyntaxHighlighter>
                           </div>
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-center text-gray-500">
                           <SnippetIcon className="w-16 h-16 text-gray-600 mb-4" />
                           <h3 className="text-lg font-semibold">Select a snippet to view</h3>
                           <p className="text-sm">Or, create a new one to get started.</p>
                           <button onClick={handleAddNewClick} className="mt-4 bg-primary-500 hover:bg-primary-600 text-white font-bold py-2 px-4 rounded-md text-sm flex items-center justify-center space-x-2">
                               <AddIcon className="w-4 h-4"/>
                               <span>Create New Snippet</span>
                           </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Snippets;