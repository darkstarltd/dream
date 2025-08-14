
import React, { useState, useEffect, useRef } from 'react';
import { SparklesIcon, ClearIcon, PlayIcon, ExportIcon, ChevronDownIcon } from './Icons';
import type { View } from '../App';
import { useNotification } from '../App';

interface ScratchpadProps {
    setActiveView: (view: View) => void;
    setCodeForAi: (code: string) => void;
    initialCode: string | null;
    setInitialCode: (code: string | null) => void;
}

const Scratchpad: React.FC<ScratchpadProps> = ({ setActiveView, setCodeForAi, initialCode, setInitialCode }) => {
    const [code, setCode] = useState('// Welcome to your Scratchpad!\n// Write some code and try the actions below.\n\nfunction greet(name) {\n  return `Hello, ${name}!`;\n}\n\nconsole.log(greet("Developer"));');
    const [language, setLanguage] = useState('javascript');
    const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
    const exportMenuRef = useRef<HTMLDivElement>(null);
    const addNotification = useNotification();

    useEffect(() => {
        if (initialCode) {
            setCode(initialCode);
            setInitialCode(null); // Consume the initial code
        }
    }, [initialCode, setInitialCode]);
    
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
                setIsExportMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleExplain = () => {
        if (!code.trim()) {
            addNotification('There is no code to explain.', 'info');
            return;
        }
        setCodeForAi(code);
        setActiveView('ai');
    };
    
    const handleRun = () => {
         addNotification('Running code... (mock execution)', 'info');
    };

    const handleClear = () => {
        setCode('');
    }
    
    const languageToFileExtension: { [key: string]: string } = {
        javascript: 'js', python: 'py', html: 'html', css: 'css', tsx: 'tsx',
    };

    const handleExportAsFile = () => {
        const blob = new Blob([code], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `scratchpad.${languageToFileExtension[language] || 'txt'}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        addNotification('Code exported as a file!', 'success');
        setIsExportMenuOpen(false);
    };

    const handleCopyAsMarkdown = () => {
        const markdown = `\`\`\`${language}\n${code}\n\`\`\``;
        navigator.clipboard.writeText(markdown);
        addNotification('Code copied as Markdown!', 'success');
        setIsExportMenuOpen(false);
    };

    return (
        <div className="p-6 h-full flex flex-col bg-dark-900">
            <div className="bg-dark-800 border border-dark-700 rounded-lg p-4 flex flex-col flex-1">
                <div className="flex justify-between items-center mb-3 flex-shrink-0">
                    <div className="flex items-center space-x-4">
                        <h3 className="text-lg font-bold text-gray-200">Code Scratchpad</h3>
                        <select 
                            value={language}
                            onChange={e => setLanguage(e.target.value)}
                            className="bg-dark-900 border border-dark-600 rounded-md py-1 px-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary-500"
                        >
                            <option value="javascript">JavaScript</option>
                            <option value="python">Python</option>
                            <option value="html">HTML</option>
                            <option value="css">CSS</option>
                            <option value="tsx">TSX</option>
                        </select>
                    </div>
                    <div className="flex items-center space-x-2">
                         <button onClick={handleExplain} className="bg-primary-500/10 hover:bg-primary-500/20 text-primary-300 font-semibold py-1.5 px-3 rounded-md flex items-center space-x-2 text-sm">
                            <SparklesIcon className="w-4 h-4" />
                            <span>Explain with AI</span>
                        </button>
                        <button onClick={handleRun} className="bg-green-500/10 hover:bg-green-500/20 text-green-300 font-semibold py-1.5 px-3 rounded-md flex items-center space-x-2 text-sm">
                            <PlayIcon className="w-4 h-4" />
                            <span>Run</span>
                        </button>
                         <button onClick={handleClear} className="bg-red-500/10 hover:bg-red-500/20 text-red-400 font-semibold py-1.5 px-3 rounded-md flex items-center space-x-2 text-sm">
                            <ClearIcon className="w-4 h-4" />
                            <span>Clear</span>
                        </button>
                        <div className="relative" ref={exportMenuRef}>
                            <button onClick={() => setIsExportMenuOpen(!isExportMenuOpen)} className="bg-dark-700 hover:bg-dark-600 text-gray-300 font-semibold py-1.5 px-3 rounded-md flex items-center space-x-2 text-sm">
                               <ExportIcon className="w-4 h-4" />
                               <span>Export</span>
                               <ChevronDownIcon className="w-3 h-3" />
                           </button>
                           {isExportMenuOpen && (
                                <div className="absolute top-full right-0 mt-2 w-48 bg-dark-700 border border-dark-600 rounded-md shadow-lg z-10 animate-scale-in">
                                   <button onClick={handleExportAsFile} className="block w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-dark-600">Save as File</button>
                                   <button onClick={handleCopyAsMarkdown} className="block w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-dark-600">Copy as Markdown</button>
                                </div>
                           )}
                        </div>
                    </div>
                </div>
                <div className="flex-1 min-h-0">
                    <textarea 
                        value={code} 
                        onChange={(e) => setCode(e.target.value)} 
                        placeholder="Paste your code here..." 
                        className="w-full h-full bg-dark-900 border border-dark-600 rounded-md p-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none" 
                        spellCheck="false" 
                    />
                </div>
            </div>
        </div>
    );
};

export default Scratchpad;