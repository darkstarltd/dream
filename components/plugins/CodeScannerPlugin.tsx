

import React, { useState, useEffect, useRef, useMemo } from 'react';
import type { CodeIssue } from '../../types';
import * as api from '../../services/apiService';
import * as credentialService from '../../services/credentialService';
import { CodeIcon, ExclamationIcon, InfoIcon, CheckIcon, SparklesIcon, LockIcon, SaveIcon } from '../Icons';
import { GoogleGenAI } from '@google/genai';
import { useNotification } from '../../App';

interface CodeScannerPluginProps {
    masterKey: CryptoKey | null;
    hasVaultAccess: boolean;
    requestVaultAccess: (pluginId: string, onGranted: () => void) => void;
    pluginId: string;
}

const CodeScannerPlugin: React.FC<CodeScannerPluginProps> = ({ masterKey, hasVaultAccess, requestVaultAccess, pluginId }) => {
    const [code, setCode] = useState(`import React, { useState, useEffect } from 'react';

// Using 'var' is outdated.
var globalTimeout;

function DataFetcher({ url }) {
  const [data, setData] = useState(null);
  
  // This effect has a missing dependency: 'url'
  useEffect(() => {
    fetch(url)
      .then(res => res.json())
      .then(setData);
  }, []); // <-- Missing dependency

  // This line is very long and could be broken up for readability.
  const formattedData = data ? JSON.stringify(data, null, 2).split('\\n').map(line => line.substring(0, 130)).join('\\n') : 'Loading...';

  return (
    <div>
      {/* dangerouslySetInnerHTML is a security risk if url is not trusted */}
      <div dangerouslySetInnerHTML={{ __html: \`Data from \${url}\` }} />
      <pre>{formattedData}</pre>
    </div>
  );
}

export default DataFetcher;`);
    
    const [issues, setIssues] = useState<CodeIssue[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [fixingIssueId, setFixingIssueId] = useState<string | null>(null);
    const [apiError, setApiError] = useState<string | null>(null);
    const addNotification = useNotification();
    const [lineCount, setLineCount] = useState(code.split('\n').length);
    const lineNumbersRef = useRef<HTMLPreElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // State for API key management
    const [apiKey, setApiKey] = useState<string | null>(null);
    const [showKeyInput, setShowKeyInput] = useState(false);
    const [tempApiKey, setTempApiKey] = useState('');

    useEffect(() => {
        setLineCount(code.split('\n').length);
    }, [code]);

    useEffect(() => {
        const fetchKey = async () => {
            if (masterKey && hasVaultAccess) {
                const storedKey = await credentialService.getApiKey(masterKey, pluginId);
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
            await credentialService.storeApiKey(masterKey, pluginId, tempApiKey);
            setApiKey(tempApiKey);
            setShowKeyInput(false);
            setTempApiKey('');
            addNotification('API key saved successfully.', 'success');
        }
    };
    
    const handleScan = async () => {
        if (!code) return;
        setIsLoading(true);
        setApiError(null);
        setIssues([]);
        const scanResults = await api.scanCode(code);
        setIssues(scanResults);
        setIsLoading(false);
    };

    const handleFixWithAI = async (issueToFix: CodeIssue) => {
        if (!code || fixingIssueId || !apiKey) {
            const errorMsg = "Cannot fix with AI: API Key is missing.";
            if (!apiKey) setApiError(errorMsg);
            addNotification(errorMsg, 'error');
            return;
        }

        setFixingIssueId(issueToFix.id);
        setApiError(null);
        try {
            const ai = new GoogleGenAI({ apiKey });
            const prompt = `You are an expert code fixer. Given the following code block, correct the specific issue described and return ONLY the full, updated code block. Do not add explanations, comments, or markdown formatting like \`\`\`.

ISSUE:
- Title: ${issueToFix.title}
- Description: ${issueToFix.description}
- Line: ${issueToFix.line}
- Suggestion: ${issueToFix.suggestion}

ORIGINAL CODE:
${code}`;

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
            });

            const correctedCode = response.text.trim();
            const cleanedCode = correctedCode.replace(/^```(?:\w+\n)?/, '').replace(/```$/, '');
            setCode(cleanedCode);
            setIssues([]);
            addNotification(`AI successfully fixed issue: ${issueToFix.title}`, 'success');
            
        } catch (error) {
            console.error("AI fix failed:", error);
            const errorMessage = error instanceof Error ? error.message : "An unknown error occurred during AI fix.";
            setApiError(errorMessage);
            addNotification(`AI fix failed: ${errorMessage}`, 'error');
        } finally {
            setFixingIssueId(null);
        }
    };

    const getSeverityStyles = (severity: CodeIssue['severity']) => {
        switch (severity) {
            case 'Critical': return { borderColor: '#ef4444', icon: <ExclamationIcon className="w-5 h-5 text-red-500" /> };
            case 'Warning': return { borderColor: '#f59e0b', icon: <ExclamationIcon className="w-5 h-5 text-yellow-500" /> };
            case 'Info': return { borderColor: '#3b82f6', icon: <InfoIcon className="w-5 h-5 text-blue-400" /> };
            default: return { borderColor: '#22c55e', icon: <CheckIcon className="w-5 h-5 text-green-500" /> };
        }
    };

    const handleScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
        if (lineNumbersRef.current) {
            lineNumbersRef.current.scrollTop = e.currentTarget.scrollTop;
        }
    };

    const handleIssueClick = (line: number) => {
        if (textareaRef.current) {
            const lineHeight = parseFloat(getComputedStyle(textareaRef.current).lineHeight);
            textareaRef.current.scrollTop = (line - 3) * lineHeight; // scroll to a bit above the line
            textareaRef.current.focus();
        }
    };
    
    const issueSummary = useMemo(() => {
        return issues.reduce((acc, issue) => {
            acc[issue.severity] = (acc[issue.severity] || 0) + 1;
            return acc;
        }, {} as Record<CodeIssue['severity'], number>);
    }, [issues]);
    
    // Render states for vault/key management
    if (!masterKey) return <div className="p-6 text-center text-gray-400">Unlock your vault to use the Code Scanner.</div>;
    if (!hasVaultAccess) {
        return (
            <div className="p-6 text-center text-gray-400">
                <p>The Code Scanner plugin needs permission to use your vault to store its API key securely.</p>
                <button onClick={handleGrantAccess} className="mt-4 bg-primary-500 hover:bg-primary-600 text-white font-bold py-2 px-4 rounded-md transition text-sm flex items-center justify-center space-x-2 mx-auto">
                    <LockIcon className="w-4 h-4"/><span>Grant Vault Access</span>
                </button>
            </div>
        );
    }
    if (showKeyInput) {
        return (
             <div className="p-6 text-center text-gray-400 max-w-lg mx-auto">
                <h3 className="text-lg font-bold text-white mb-2">Connect to Gemini</h3>
                <p>Please enter your Google Gemini API key to enable the "Fix with AI" feature. Your key will be stored securely in your encrypted vault.</p>
                <div className="mt-4 flex gap-2">
                    <input type="password" value={tempApiKey} onChange={e => setTempApiKey(e.target.value)} placeholder="Enter Gemini API Key" className="flex-grow bg-dark-900 border border-dark-600 rounded-md py-1.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"/>
                    <button onClick={handleSaveApiKey} disabled={!tempApiKey} className="bg-primary-500 hover:bg-primary-600 text-white font-bold py-2 px-3 rounded-md transition text-sm flex items-center space-x-2 disabled:opacity-50">
                        <SaveIcon className="w-4 h-4"/><span>Save Key</span>
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="p-6 h-full flex flex-col bg-dark-900">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 min-h-0">
                <div className="bg-dark-800 border border-dark-700 rounded-lg p-4 flex flex-col">
                    <h3 className="text-lg font-bold text-gray-200 mb-2 flex-shrink-0">Code to Scan</h3>
                    <div className="flex-1 min-h-0 bg-dark-900 border border-dark-600 rounded-md overflow-hidden">
                       <div className="code-editor-wrapper">
                            <pre ref={lineNumbersRef} className="line-numbers">
                                {Array.from({ length: lineCount }, (_, i) => i + 1).join('\n')}
                            </pre>
                            <textarea 
                                ref={textareaRef}
                                value={code} 
                                onChange={(e) => setCode(e.target.value)} 
                                onScroll={handleScroll}
                                placeholder="Paste your code here..." 
                                className="code-editor-textarea w-full h-full font-mono text-sm resize-none focus:outline-none" 
                                spellCheck="false" 
                            />
                       </div>
                    </div>
                    <button onClick={handleScan} disabled={isLoading || !code} className="mt-4 w-full bg-primary-500 hover:bg-primary-600 text-white font-bold py-2 px-4 rounded-md transition text-sm flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0">
                        {isLoading ? 'Scanning...' : 'Scan Code'}
                    </button>
                </div>
                <div className="bg-dark-800 border border-dark-700 rounded-lg p-4 flex flex-col min-h-0">
                    <h3 className="text-lg font-bold text-gray-200 mb-2 flex-shrink-0">Scan Results</h3>
                    {apiError && (<div className="bg-red-500/10 text-red-400 text-xs p-2 rounded-md mb-2 border border-red-500/20">{apiError}</div>)}
                    
                     {issues.length > 0 && (
                        <div className="flex-shrink-0 flex items-center space-x-4 mb-2 p-2 bg-dark-700/50 rounded-md text-xs">
                           <span className="font-bold text-gray-300">Summary:</span>
                           {issueSummary.Critical > 0 && <span className="text-red-400">{issueSummary.Critical} Critical</span>}
                           {issueSummary.Warning > 0 && <span className="text-yellow-400">{issueSummary.Warning} Warning(s)</span>}
                           {issueSummary.Info > 0 && <span className="text-blue-400">{issueSummary.Info} Info</span>}
                           {issues.every(i => i.severity !== 'Critical' && i.severity !== 'Warning') && <span className="text-green-400">No major issues found</span>}
                        </div>
                     )}

                    <div className="flex-1 overflow-y-auto pr-2 space-y-3">
                        {issues.length > 0 ? (
                            issues.map(issue => {
                                const { borderColor, icon } = getSeverityStyles(issue.severity);
                                const isFixingThis = fixingIssueId === issue.id;
                                return (
                                <div key={issue.id} onClick={() => handleIssueClick(issue.line)} className="border-l-4 p-3 bg-dark-900/50 rounded cursor-pointer hover:bg-dark-700" style={{ borderColor }}>
                                    <div className="flex items-start">
                                        <span className="mr-3 mt-0.5">{icon}</span>
                                        <div>
                                            <span className="font-bold text-gray-200">{issue.title} <span className="text-xs text-gray-500 font-mono">(Line: {issue.line})</span></span>
                                            <p className="text-sm text-gray-400 mt-1">{issue.description}</p>
                                            <p className="text-sm text-gray-300 mt-2 font-mono bg-dark-700/50 p-2 rounded"><span className="text-green-400">Suggestion:</span> {issue.suggestion}</p>
                                            {issue.severity !== 'Info' && (
                                                <button onClick={(e) => { e.stopPropagation(); handleFixWithAI(issue); }} disabled={fixingIssueId !== null || !apiKey} className="mt-3 text-sm bg-primary-500/10 hover:bg-primary-500/20 text-primary-300 font-semibold py-1.5 px-3 rounded-md transition flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed" title={!apiKey ? "Gemini API Key is missing" : ""}>
                                                    {isFixingThis ? (<span className="animate-spin h-4 w-4 border-2 border-primary-300 border-t-transparent rounded-full"></span>) : (<SparklesIcon className="w-4 h-4" />)}
                                                    <span>{isFixingThis ? 'Fixing...' : 'Fix with AI'}</span>
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )})
                        ) : (
                            <div className="text-center text-gray-500 flex flex-col justify-center items-center h-full">
                                <CodeIcon className="w-16 h-16 text-gray-600 mb-4" />
                                <p>{!isLoading ? 'No issues found, or no code scanned yet.' : 'Scanning for issues...'}</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CodeScannerPlugin;