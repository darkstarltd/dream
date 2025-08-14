
import React, { useState, useEffect, useRef } from 'react';
import { Command } from '../types';
import { SearchIcon } from './Icons';

interface CommandPaletteProps {
    commands: Command[];
    onClose: () => void;
}

const CommandPalette: React.FC<CommandPaletteProps> = ({ commands, onClose }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [activeIndex, setActiveIndex] = useState(0);
    const paletteRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const filteredCommands = commands.filter(cmd => 
        cmd.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cmd.category.toLowerCase().includes(searchTerm.toLowerCase())
    );

    useEffect(() => {
        // Focus input on open
        inputRef.current?.focus();

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setActiveIndex(prev => (prev > 0 ? prev - 1 : filteredCommands.length - 1));
            } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                setActiveIndex(prev => (prev < filteredCommands.length - 1 ? prev + 1 : 0));
            } else if (e.key === 'Enter') {
                e.preventDefault();
                if (filteredCommands[activeIndex]) {
                    handleCommandSelect(filteredCommands[activeIndex]);
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [filteredCommands, activeIndex, onClose]);

    useEffect(() => {
        // Reset active index on search term change
        setActiveIndex(0);
    }, [searchTerm]);

    const handleCommandSelect = (command: Command) => {
        command.action();
        onClose();
    };
    
    // Group commands by category
    const groupedCommands = filteredCommands.reduce((acc, cmd) => {
        (acc[cmd.category] = acc[cmd.category] || []).push(cmd);
        return acc;
    }, {} as Record<string, Command[]>);

    let commandIndex = -1;

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-start justify-center z-50 pt-24" onClick={onClose}>
            <div
                ref={paletteRef}
                className="bg-dark-800 border border-dark-700 rounded-lg shadow-2xl shadow-black/50 w-full max-w-xl mx-4 transform transition-all animate-scale-in"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="relative">
                    <SearchIcon className="w-5 h-5 text-gray-500 absolute top-1/2 left-4 -translate-y-1/2" />
                    <input
                        ref={inputRef}
                        type="text"
                        placeholder="Type a command or search..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-transparent border-b border-dark-700 py-4 pl-12 pr-4 text-white text-base focus:outline-none"
                    />
                </div>
                <div className="max-h-[60vh] overflow-y-auto">
                    {Object.entries(groupedCommands).length > 0 ? (
                        Object.entries(groupedCommands).map(([category, cmds]) => (
                            <div key={category} className="p-2">
                                <h3 className="text-xs font-semibold text-gray-500 px-3 py-1 uppercase tracking-wider">{category}</h3>
                                <ul>
                                    {cmds.map((cmd) => {
                                        commandIndex++;
                                        const currentIndex = commandIndex;
                                        return (
                                        <li
                                            key={cmd.id}
                                            onClick={() => handleCommandSelect(cmd)}
                                            onMouseEnter={() => setActiveIndex(currentIndex)}
                                            className={`flex items-center space-x-3 p-3 rounded-md cursor-pointer text-gray-300 ${activeIndex === currentIndex ? 'bg-primary-500/20 text-white' : 'hover:bg-dark-700/50'}`}
                                        >
                                            <span className={`${activeIndex === currentIndex ? 'text-primary-300' : 'text-gray-500'}`}>{cmd.icon}</span>
                                            <span>{cmd.label}</span>
                                        </li>
                                    )})}
                                </ul>
                            </div>
                        ))
                    ) : (
                        <p className="text-center text-gray-500 py-16">No results found.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CommandPalette;