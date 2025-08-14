import React, { useState, useMemo } from 'react';
import type { RegexMatch } from '../types';
import { ExclamationIcon, RegexIcon } from './Icons';

const RegexTester: React.FC = () => {
    const [pattern, setPattern] = useState('\\b(https?|ftp|file):\\/\\/[-A-Z0-9+&@#\\/%?=~_|!:,.;]*[-A-Z0-9+&@#\\/%=~_|]');
    const [flags, setFlags] = useState('ig');
    const [testString, setTestString] = useState('Find URLs like http://example.com or https://www.google.com/search?q=regex in this text.');
    const [error, setError] = useState<string | null>(null);

    const { matches, highlightedText } = useMemo(() => {
        if (!pattern) return { matches: [], highlightedText: testString };

        try {
            const regex = new RegExp(pattern, flags);
            setError(null);
            
            const foundMatches: RegexMatch[] = [];
            let match;
            while ((match = regex.exec(testString)) !== null) {
                if (match[0] === "" && regex.lastIndex === match.index) {
                    regex.lastIndex++; // Avoid infinite loops with zero-width matches
                }
                foundMatches.push({
                    match: match[0],
                    index: match.index,
                    groups: Array.from(match).slice(1).map(g => g ?? ''),
                });
            }

            // Create highlighted text
            if (foundMatches.length === 0) {
                return { matches: [], highlightedText: testString };
            }

            let lastIndex = 0;
            const parts = [];
            foundMatches.forEach(m => {
                parts.push(testString.substring(lastIndex, m.index));
                parts.push(<span key={m.index} className="regex-match">{m.match}</span>);
                lastIndex = m.index + m.match.length;
            });
            parts.push(testString.substring(lastIndex));

            return { matches: foundMatches, highlightedText: <>{parts}</> };

        } catch (e) {
            setError(e instanceof Error ? e.message : 'Invalid Regex');
            return { matches: [], highlightedText: testString };
        }
    }, [pattern, flags, testString]);

    return (
        <div className="p-6 h-full flex flex-col bg-dark-900">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 min-h-0">
                {/* Left side: Inputs */}
                <div className="flex flex-col gap-6">
                    <div className="bg-dark-800 border border-dark-700 rounded-lg p-4 flex flex-col">
                        <h3 className="text-lg font-bold text-gray-200 mb-2">Regular Expression</h3>
                        <div className="flex items-center bg-dark-900 border border-dark-600 rounded-md">
                            <span className="px-3 text-gray-500">/</span>
                            <input
                                type="text"
                                value={pattern}
                                onChange={e => setPattern(e.target.value)}
                                placeholder="Enter your pattern here"
                                className={`flex-1 bg-transparent py-2 text-sm font-mono focus:outline-none ${error ? 'regex-error' : 'focus:ring-1 focus:ring-primary-500'}`}
                                spellCheck="false"
                            />
                            <span className="px-3 text-gray-500">/</span>
                            <input
                                type="text"
                                value={flags}
                                onChange={e => setFlags(e.target.value.replace(/[^gimsuy]/g, ''))}
                                className="w-16 bg-transparent py-2 text-sm font-mono focus:outline-none"
                                spellCheck="false"
                            />
                        </div>
                        {error && <p className="text-red-400 text-xs mt-2 flex items-center"><ExclamationIcon className="w-4 h-4 mr-1"/>{error}</p>}
                    </div>
                    <div className="bg-dark-800 border border-dark-700 rounded-lg p-4 flex flex-col flex-1 min-h-0">
                         <h3 className="text-lg font-bold text-gray-200 mb-2">Test String</h3>
                         <div className="flex-1 min-h-0 relative">
                            <pre className="w-full h-full bg-dark-900 border border-dark-600 rounded-md p-3 text-sm font-mono whitespace-pre-wrap overflow-auto absolute inset-0">
                                {highlightedText}
                            </pre>
                             <textarea
                                value={testString}
                                onChange={e => setTestString(e.target.value)}
                                placeholder="Paste your test string here"
                                className="w-full h-full bg-transparent border-none rounded-md p-3 text-sm font-mono resize-none focus:outline-none absolute inset-0 text-transparent caret-white"
                                spellCheck="false"
                            />
                         </div>
                    </div>
                </div>

                {/* Right side: Matches */}
                <div className="bg-dark-800 border border-dark-700 rounded-lg p-4 flex flex-col min-h-0">
                    <h3 className="text-lg font-bold text-gray-200 mb-2">Matches ({matches.length})</h3>
                    <div className="flex-1 overflow-y-auto pr-2 space-y-3">
                        {matches.length > 0 ? (
                            matches.map((match, index) => (
                                <div key={index} className="bg-dark-900 border border-dark-700 rounded p-3">
                                    <div className="font-mono text-sm bg-primary-500/10 text-primary-300 p-2 rounded">
                                        Match {index + 1}: <span className="font-bold">{match.match || '""'}</span>
                                    </div>
                                    {match.groups.length > 0 && (
                                        <div className="mt-2 space-y-1 text-xs font-mono">
                                            <h4 className="text-gray-400 font-semibold">Capture Groups:</h4>
                                            {match.groups.map((group, gIndex) => (
                                                <div key={gIndex} className="flex items-start">
                                                    <span className="w-6 text-gray-500">{gIndex + 1}:</span>
                                                    <span className="bg-dark-700/50 p-1 rounded flex-1">{group}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))
                        ) : (
                             <div className="flex flex-col items-center justify-center h-full text-center text-gray-500">
                                <RegexIcon className="w-16 h-16 text-gray-600 mb-4" />
                                <p>No matches found.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RegexTester;