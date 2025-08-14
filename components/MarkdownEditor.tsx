
import React, { useState, useEffect, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { MarkdownNote } from '../types';
import { useNotification } from '../App';
import { AddIcon, SearchIcon, DeleteIcon, EditIcon, SaveIcon, MarkdownIcon } from './Icons';

const CodeBlock: React.FC<{ language: string; code: string }> = ({ language, code }) => {
    return (
        <SyntaxHighlighter language={language} useInlineStyles={false} wrapLines={true}>
            {code}
        </SyntaxHighlighter>
    );
};

const MarkdownEditor: React.FC = () => {
    const [notes, setNotes] = useState<MarkdownNote[]>([]);
    const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const addNotification = useNotification();

    useEffect(() => {
        const savedNotes = localStorage.getItem('ds_markdown_notes');
        if (savedNotes) {
            const parsedNotes = JSON.parse(savedNotes);
            setNotes(parsedNotes);
            if (parsedNotes.length > 0) {
                setActiveNoteId(parsedNotes[0].id);
            }
        }
    }, []);

    useEffect(() => {
        localStorage.setItem('ds_markdown_notes', JSON.stringify(notes));
    }, [notes]);
    
    const activeNote = useMemo(() => notes.find(n => n.id === activeNoteId), [notes, activeNoteId]);

    const filteredNotes = useMemo(() => {
        return notes.filter(note => 
            note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            note.content.toLowerCase().includes(searchTerm.toLowerCase())
        ).sort((a,b) => b.updatedAt - a.updatedAt);
    }, [notes, searchTerm]);

    const handleCreateNote = () => {
        const newNote: MarkdownNote = {
            id: `note_${Date.now()}`,
            title: 'New Note',
            content: '# New Note\n\nStart writing your markdown here.',
            createdAt: Date.now(),
            updatedAt: Date.now()
        };
        setNotes(prev => [newNote, ...prev]);
        setActiveNoteId(newNote.id);
        addNotification('New note created.', 'success');
    };

    const handleDeleteNote = (id: string) => {
        if (window.confirm('Are you sure you want to delete this note?')) {
            const newNotes = notes.filter(n => n.id !== id);
            setNotes(newNotes);
            if (activeNoteId === id) {
                setActiveNoteId(newNotes.length > 0 ? newNotes[0].id : null);
            }
            addNotification('Note deleted.', 'info');
        }
    };

    const handleUpdateNote = (field: 'title' | 'content', value: string) => {
        setNotes(prev => prev.map(n => n.id === activeNoteId 
            ? { ...n, [field]: value, updatedAt: Date.now() } 
            : n
        ));
    };

    return (
        <div className="p-6 h-full flex flex-col bg-dark-900">
            <div className="grid grid-cols-12 gap-6 flex-1 min-h-0">
                {/* Sidebar */}
                <div className="col-span-3 bg-dark-800 border border-dark-700 rounded-lg p-4 flex flex-col">
                    <h3 className="text-lg font-bold text-gray-200 mb-4">All Notes</h3>
                    <div className="flex-shrink-0 mb-4 space-y-3">
                         <button onClick={handleCreateNote} className="w-full bg-primary-500 hover:bg-primary-600 text-white font-bold py-2 px-4 rounded-md text-sm flex items-center justify-center space-x-2">
                            <AddIcon className="w-4 h-4" /><span>New Note</span>
                        </button>
                        <div className="relative">
                           <SearchIcon className="w-4 h-4 text-gray-500 absolute top-1/2 left-3 -translate-y-1/2"/>
                           <input type="text" placeholder="Search notes..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full bg-dark-900 border border-dark-600 text-white rounded-md py-1.5 pl-9 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500"/>
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto pr-2 space-y-1">
                        {filteredNotes.map(note => (
                            <button key={note.id} onClick={() => setActiveNoteId(note.id)}
                                className={`w-full text-left p-2 rounded-md transition-colors ${activeNoteId === note.id ? 'bg-primary-500/20' : 'hover:bg-dark-700'}`}>
                                <h4 className="font-semibold text-gray-200 truncate">{note.title}</h4>
                                <p className="text-xs text-gray-500">{new Date(note.updatedAt).toLocaleString()}</p>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Editor & Preview */}
                <div className="col-span-9 bg-dark-800 border border-dark-700 rounded-lg flex flex-col min-h-0">
                    {activeNote ? (
                        <div className="flex flex-col flex-1 min-h-0">
                            <div className="flex-shrink-0 p-3 border-b border-dark-700 flex justify-between items-center">
                                <input 
                                    type="text"
                                    value={activeNote.title}
                                    onChange={e => handleUpdateNote('title', e.target.value)}
                                    className="bg-transparent text-xl font-bold text-white focus:outline-none w-full"
                                />
                                <button onClick={() => handleDeleteNote(activeNote.id)} className="text-gray-500 hover:text-red-400 p-1"><DeleteIcon className="w-4 h-4"/></button>
                            </div>
                            <div className="grid grid-cols-2 gap-px flex-1 min-h-0 bg-dark-700">
                                <textarea
                                    value={activeNote.content}
                                    onChange={e => handleUpdateNote('content', e.target.value)}
                                    className="w-full h-full bg-dark-800 p-4 text-sm font-mono focus:outline-none resize-none"
                                    spellCheck="false"
                                />
                                <div className="w-full h-full bg-dark-800 p-4 overflow-y-auto markdown-preview">
                                    <ReactMarkdown
                                        children={activeNote.content}
                                        remarkPlugins={[remarkGfm]}
                                        components={{
                                            code({ node, className, children, ...props }) {
                                                const match = /language-(\w+)/.exec(className || '');
                                                const codeContent = String(children).replace(/\n$/, '');
                                                return match ? (
                                                    <CodeBlock language={match[1]} code={codeContent} />
                                                ) : (
                                                    <code className={className} {...props}>{children}</code>
                                                );
                                            }
                                        }}
                                    />
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-center text-gray-500">
                           <MarkdownIcon className="w-16 h-16 text-gray-600 mb-4" />
                           <h3 className="text-lg font-semibold">No note selected</h3>
                           <p className="text-sm">Create a new note or select one from the list.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MarkdownEditor;
