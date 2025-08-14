


import React, { useState, useEffect, useMemo } from 'react';
import type { ApiRequest, ApiResponse, ApiHistoryEntry, HttpMethod, ApiHeader, EnvFile, TestResult } from '../types';
import { useNotification } from '../App';
import { SendIcon, DeleteIcon, CopyIcon, CheckIcon, ChevronDownIcon, ChevronUpIcon, XCircleIcon } from './Icons';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import SegmentedControl from './SegmentedControl';

const ApiLab: React.FC = () => {
    const [request, setRequest] = useState<ApiRequest>({
        method: 'GET',
        url: 'https://jsonplaceholder.typicode.com/posts/1',
        headers: [{ id: 'h1', key: 'Content-Type', value: 'application/json', enabled: true }],
        body: '',
        preRequestScript: `// Example: Add a timestamp header\n// request.headers.push({ key: 'X-Timestamp', value: Date.now() });`,
        testScript: `// Example: Check for a 200 status code\ntests["Status code is 200"] = response.status === 200;\n\n// Example: Check response time\ntests["Response time is less than 500ms"] = response.duration < 500;`
    });
    const [response, setResponse] = useState<ApiResponse | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [history, setHistory] = useState<ApiHistoryEntry[]>([]);
    const [activeRequestTab, setActiveRequestTab] = useState<'headers' | 'body' | 'pre-request' | 'tests'>('headers');
    const [activeResponseTab, setActiveResponseTab] = useState<'body' | 'headers' | 'tests'>('body');
    const [environments, setEnvironments] = useState<EnvFile[]>([]);
    const [activeEnvId, setActiveEnvId] = useState<string>('none');
    const addNotification = useNotification();

    useEffect(() => {
        const savedHistory = localStorage.getItem('ds_api_lab_history');
        if (savedHistory) setHistory(JSON.parse(savedHistory));
        
        const savedEnvs = localStorage.getItem('ds_env_files');
        if (savedEnvs) setEnvironments(JSON.parse(savedEnvs));
    }, []);

    const activeEnvironment = useMemo(() => environments.find(e => e.id === activeEnvId), [environments, activeEnvId]);

    const substituteVariables = (text: string): string => {
        if (!activeEnvironment || !text) return text;
        let substituted = text;
        activeEnvironment.variables.forEach(variable => {
            const regex = new RegExp(`\\{\\{\\s*${variable.key}\\s*\\}\\}`, 'g');
            substituted = substituted.replace(regex, variable.value);
        });
        return substituted;
    };

    const addToHistory = (req: ApiRequest, res: ApiResponse) => {
        const newEntry: ApiHistoryEntry = {
            id: `hist_${Date.now()}`,
            request: req,
            timestamp: Date.now(),
            status: res.status
        };
        const newHistory = [newEntry, ...history.filter(h => h.request.url !== req.url || h.request.method !== req.method)].slice(0, 50);
        setHistory(newHistory);
        localStorage.setItem('ds_api_lab_history', JSON.stringify(newHistory));
    };

    const handleSend = async () => {
        setIsLoading(true);
        setError(null);
        setResponse(null);

        // --- Mock Script Execution ---
        let processedRequest = { ...request };

        // 1. Pre-request Script
        if (processedRequest.preRequestScript) {
            try {
                // In a real app, this would be a sandboxed execution environment (e.g., using a web worker and a library like vm2).
                // For this mock, we'll use a simple Function constructor.
                const scriptRunner = new Function('request', processedRequest.preRequestScript);
                scriptRunner(processedRequest);
                addNotification('Pre-request script executed.', 'info');
            } catch (e) {
                const errorMessage = `Pre-request script error: ${e instanceof Error ? e.message : 'Unknown error'}`;
                setError(errorMessage);
                setIsLoading(false);
                addNotification(errorMessage, 'error');
                return;
            }
        }
        
        // 2. Substitute Environment Variables
        processedRequest = {
            ...processedRequest,
            url: substituteVariables(processedRequest.url),
            headers: processedRequest.headers.map(h => ({ ...h, value: substituteVariables(h.value) })),
            body: substituteVariables(processedRequest.body),
        };

        const startTime = Date.now();
        try {
            await new Promise(res => setTimeout(res, 800)); // Mock fetch
            const mockRes: Omit<ApiResponse, 'testResults'> = {
                status: 200, statusText: 'OK',
                headers: { 'content-type': 'application/json; charset=utf-8', 'x-powered-by': 'DreamStudio Mock Server' },
                body: { userId: 1, id: 1, title: "sunt aut facere...", processedUrl: processedRequest.url },
                size: 292, duration: Date.now() - startTime
            };
            if(request.method === 'POST') mockRes.status = 201;

            // 3. Test Script
            let testResults: TestResult[] = [];
            if (processedRequest.testScript) {
                try {
                    const tests: Record<string, boolean> = {};
                    const scriptRunner = new Function('response', 'tests', processedRequest.testScript);
                    scriptRunner(mockRes, tests);
                    testResults = Object.entries(tests).map(([name, passed]) => ({ name, passed }));
                    addNotification(`${testResults.filter(r => r.passed).length} of ${testResults.length} tests passed.`, 'info');
                } catch (e) {
                     addNotification(`Test script error: ${e instanceof Error ? e.message : 'Unknown error'}`, 'error');
                }
            }
            
            const finalResponse = { ...mockRes, testResults };
            setResponse(finalResponse);
            addToHistory(request, finalResponse);
            
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred.');
        } finally {
            setIsLoading(false);
        }
    };
    
    const updateHeader = (id: string, field: 'key' | 'value' | 'enabled', value: string | boolean) => {
        setRequest(prev => ({ ...prev, headers: prev.headers.map(h => h.id === id ? {...h, [field]: value} : h) }));
    };

    const addHeader = () => {
        setRequest(prev => ({ ...prev, headers: [...prev.headers, { id: `h_${Date.now()}`, key: '', value: '', enabled: true }]}));
    };
    
    const removeHeader = (id: string) => {
        setRequest(prev => ({ ...prev, headers: prev.headers.filter(h => h.id !== id) }));
    };
    
    const loadFromHistory = (entry: ApiHistoryEntry) => {
        setRequest(entry.request);
        setResponse(null);
        setError(null);
    };

    const methodColorClass = (method: HttpMethod) => ({
        'GET': 'text-green-400', 'POST': 'text-yellow-400', 'PUT': 'text-blue-400',
        'PATCH': 'text-purple-400', 'DELETE': 'text-red-400',
    }[method] || 'text-gray-400');
    
    const statusColorClass = (status: number) => {
        if(status >= 500) return 'text-red-400';
        if(status >= 400) return 'text-yellow-400';
        if(status >= 300) return 'text-blue-400';
        if(status >= 200) return 'text-green-400';
        return 'text-gray-400';
    };

    return (
        <div className="p-6 h-full flex flex-col bg-dark-900">
            <div className="grid grid-cols-12 gap-6 flex-1 min-h-0">
                <div className="col-span-3 bg-dark-800 border border-dark-700 rounded-lg p-4 flex flex-col">
                    <h3 className="text-lg font-bold text-gray-200 mb-4">History</h3>
                    <div className="flex-1 overflow-y-auto pr-2 space-y-1">
                        {history.map(h => (
                            <button key={h.id} onClick={() => loadFromHistory(h)} className="w-full text-left p-2 rounded-md hover:bg-dark-700">
                                <div className="flex items-center space-x-2">
                                    <span className={`font-bold text-xs w-12 text-center ${methodColorClass(h.request.method)}`}>{h.request.method}</span>
                                    <span className="flex-1 text-sm text-gray-300 truncate">{h.request.url}</span>
                                    <span className={`font-mono text-xs ${statusColorClass(h.status)}`}>{h.status}</span>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                <div className="col-span-9 flex flex-col gap-6 min-h-0">
                    <div className="bg-dark-800 border border-dark-700 rounded-lg p-4 flex flex-col">
                        <div className="flex items-stretch space-x-2 mb-3">
                            <select value={request.method} onChange={e => setRequest({...request, method: e.target.value as HttpMethod})} className={`bg-dark-900 border border-dark-600 rounded-md py-2 px-3 text-sm font-bold focus:outline-none focus:ring-1 focus:ring-primary-500 ${methodColorClass(request.method)}`}>
                                <option value="GET">GET</option><option value="POST">POST</option><option value="PUT">PUT</option>
                                <option value="DELETE">DELETE</option><option value="PATCH">PATCH</option>
                            </select>
                            <input type="text" value={request.url} onChange={e => setRequest({...request, url: e.target.value})} placeholder="https://api.example.com/data" className="flex-1 bg-dark-900 border border-dark-600 rounded-md py-2 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500" />
                            <button onClick={handleSend} disabled={isLoading} className="bg-primary-500 hover:bg-primary-600 text-white font-bold py-2 px-4 rounded-md text-sm flex items-center justify-center space-x-2 disabled:opacity-50">
                                <SendIcon className="w-4 h-4"/><span>{isLoading ? 'Sending...' : 'Send'}</span>
                            </button>
                        </div>
                        <div className="flex justify-between items-center mb-2">
                            <SegmentedControl 
                                options={[{id: 'headers', label: 'Headers'}, {id: 'body', label: 'Body'}, {id: 'pre-request', label: 'Pre-request Script'}, {id: 'tests', label: 'Tests'}]}
                                value={activeRequestTab}
                                onChange={v => setActiveRequestTab(v as any)}
                            />
                            <select value={activeEnvId} onChange={e => setActiveEnvId(e.target.value)} className="bg-dark-900 border border-dark-600 rounded-md py-1 px-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary-500">
                                <option value="none">No Environment</option>
                                {environments.map(env => <option key={env.id} value={env.id}>{env.name}</option>)}
                            </select>
                        </div>
                        {activeRequestTab === 'headers' && (
                            <div className="space-y-1 text-sm max-h-48 overflow-y-auto pr-2">
                                {request.headers.map(h => (
                                    <div key={h.id} className="flex items-center gap-2">
                                        <input type="checkbox" checked={h.enabled} onChange={e => updateHeader(h.id, 'enabled', e.target.checked)} className="w-4 h-4 text-primary-500 bg-dark-700 border-dark-600 rounded focus:ring-primary-600" />
                                        <input type="text" value={h.key} onChange={e => updateHeader(h.id, 'key', e.target.value)} placeholder="Key" className="flex-1 bg-dark-900 border border-dark-600 rounded-md py-1 px-2 focus:outline-none" />
                                        <input type="text" value={h.value} onChange={e => updateHeader(h.id, 'value', e.target.value)} placeholder="Value" className="flex-1 bg-dark-900 border border-dark-600 rounded-md py-1 px-2 focus:outline-none" />
                                        <button onClick={() => removeHeader(h.id)} className="text-gray-500 hover:text-red-400"><DeleteIcon className="w-4 h-4" /></button>
                                    </div>
                                ))}
                                <button onClick={addHeader} className="text-xs text-primary-400 hover:underline mt-2">Add Header</button>
                            </div>
                        )}
                         {activeRequestTab === 'body' && <textarea value={request.body} onChange={e => setRequest({...request, body: e.target.value})} placeholder='{ "key": "value" }' className="h-32 bg-dark-900 border border-dark-600 rounded-md p-2 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-primary-500 resize-none" />}
                         {activeRequestTab === 'pre-request' && <textarea value={request.preRequestScript} onChange={e => setRequest({...request, preRequestScript: e.target.value})} className="h-32 bg-dark-900 border border-dark-600 rounded-md p-2 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-primary-500 resize-none" />}
                         {activeRequestTab === 'tests' && <textarea value={request.testScript} onChange={e => setRequest({...request, testScript: e.target.value})} className="h-32 bg-dark-900 border border-dark-600 rounded-md p-2 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-primary-500 resize-none" />}
                    </div>
                    <div className="bg-dark-800 border border-dark-700 rounded-lg p-4 flex flex-col flex-1 min-h-0">
                        <div className="flex justify-between items-center mb-3 flex-shrink-0">
                             <h3 className="text-lg font-bold text-gray-200">Response</h3>
                             {response && (
                                <div className="flex items-center space-x-4 text-sm font-mono">
                                    <span className={statusColorClass(response.status)}>Status: {response.status} {response.statusText}</span>
                                    <span>Time: {response.duration}ms</span>
                                    <span>Size: {(response.size / 1024).toFixed(2)} KB</span>
                                </div>
                             )}
                        </div>
                        {isLoading && <div className="text-center py-16 text-gray-400">Request in flight...</div>}
                        {error && <div className="text-center py-16 text-red-400 font-mono">{error}</div>}
                        {response ? (
                            <div className="flex-1 flex flex-col min-h-0">
                                 <SegmentedControl 
                                    options={[{id: 'body', label: 'Body'}, {id: 'headers', label: 'Headers'}, {id: 'tests', label: `Tests (${response.testResults?.length || 0})`}]}
                                    value={activeResponseTab}
                                    onChange={v => setActiveResponseTab(v as any)}
                                />
                                <div className="flex-1 overflow-y-auto mt-2">
                                {activeResponseTab === 'body' && <SyntaxHighlighter language="json" useInlineStyles={false} wrapLines={true}>{JSON.stringify(response.body, null, 2)}</SyntaxHighlighter>}
                                {activeResponseTab === 'headers' && (
                                    <div className="text-sm font-mono p-2 space-y-1">
                                        {Object.entries(response.headers).map(([key, value]) => (<div key={key}><span className="text-gray-400">{key}:</span> <span className="text-gray-200">{value}</span></div>))}
                                    </div>
                                )}
                                {activeResponseTab === 'tests' && (
                                    <div className="text-sm p-2 space-y-1">
                                        {response.testResults?.length ? response.testResults.map(result => (
                                            <div key={result.name} className={`flex items-center space-x-2 ${result.passed ? 'test-result-pass' : 'test-result-fail'}`}>
                                                {result.passed ? <CheckIcon className="w-4 h-4" /> : <XCircleIcon className="w-4 h-4"/>}
                                                <span>{result.name}</span>
                                            </div>
                                        )) : <p className="text-gray-500">No tests were run.</p>}
                                    </div>
                                )}
                                </div>
                            </div>
                        ) : !isLoading && !error && <div className="text-center py-16 text-gray-500">Send a request to see the response here.</div>}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ApiLab;