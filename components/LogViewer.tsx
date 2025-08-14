import React, { useState, useEffect, useMemo, useRef } from 'react';
import type { LogEntry, LogLevel } from '../types';
import { GitPullIcon, PlayIcon, PauseIcon, ClearIcon, SearchIcon, LogIcon } from './Icons';

const MOCK_SOURCES = ['WebServer', 'Database', 'AuthService', 'Cache', 'Scheduler', 'API_Gateway'];
const MOCK_MESSAGES = [
  'User authenticated successfully', 'Cache miss for key: user:123', 'Executing background job: SendWeeklyEmails',
  'Incoming request: GET /api/v1/users', 'Database query executed in 25ms', 'Connection to Redis timed out',
  'New deployment detected, restarting service...', 'Found 5 items in cart', 'Validation Error: email field is required',
];

const LogViewer: React.FC = () => {
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [isPaused, setIsPaused] = useState(false);
    const [filter, setFilter] = useState('');
    const [levels, setLevels] = useState<Set<LogLevel>>(new Set(['V', 'D', 'I', 'W', 'E']));
    const [autoScroll, setAutoScroll] = useState(true);
    const logCounter = useRef(0);
    const logContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const interval = setInterval(() => {
            if (isPaused) return;

            const levelOptions: LogLevel[] = ['V', 'D', 'I', 'W', 'E'];
            const randomLevel = levelOptions[Math.floor(Math.random() * 5)];
            const randomSource = MOCK_SOURCES[Math.floor(Math.random() * MOCK_SOURCES.length)];
            const randomMessage = MOCK_MESSAGES[Math.floor(Math.random() * MOCK_MESSAGES.length)];

            const newLog: LogEntry = {
                id: logCounter.current++,
                level: randomLevel,
                timestamp: new Date().toISOString(),
                message: `[${randomSource}] ${randomMessage}`
            };
            setLogs(prev => [...prev.slice(-499), newLog]);
        }, 1200);

        return () => clearInterval(interval);
    }, [isPaused]);

    useEffect(() => {
        if (autoScroll && logContainerRef.current) {
            logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
        }
    }, [logs, autoScroll]);

    const filteredLogs = useMemo(() => {
        return logs.filter(log => {
            const levelMatch = levels.has(log.level);
            const filterMatch = filter.trim() === '' || log.message.toLowerCase().includes(filter.toLowerCase());
            return levelMatch && filterMatch;
        });
    }, [logs, levels, filter]);

    const toggleLevel = (level: LogLevel) => {
        setLevels(prev => {
            const newLevels = new Set(prev);
            if (newLevels.has(level)) newLevels.delete(level);
            else newLevels.add(level);
            return newLevels;
        });
    };

    const handleScroll = () => {
        if (logContainerRef.current) {
            const { scrollTop, scrollHeight, clientHeight } = logContainerRef.current;
            const isAtBottom = scrollHeight - scrollTop - clientHeight < 5;
            if (!isAtBottom && autoScroll) {
                setAutoScroll(false);
            } else if (isAtBottom && !autoScroll) {
                setAutoScroll(true);
            }
        }
    };
    
    const levelButtonColors: Record<LogLevel, { active: string; inactive: string; }> = {
        V: { active: 'bg-cyan-500/80 text-white', inactive: 'bg-dark-700 text-gray-400 hover:bg-dark-600' },
        D: { active: 'bg-blue-500/80 text-white', inactive: 'bg-dark-700 text-gray-400 hover:bg-dark-600' },
        I: { active: 'bg-gray-500/80 text-white', inactive: 'bg-dark-700 text-gray-400 hover:bg-dark-600' },
        W: { active: 'bg-yellow-500/80 text-white', inactive: 'bg-dark-700 text-gray-400 hover:bg-dark-600' },
        E: { active: 'bg-red-500/80 text-white', inactive: 'bg-dark-700 text-gray-400 hover:bg-dark-600' },
    };

    return (
        <div className="p-6 h-full flex flex-col bg-dark-900">
            <div className="bg-dark-800 border border-dark-700 rounded-lg p-4 flex flex-col flex-1 min-h-0">
                <div className="flex justify-between items-center mb-3 flex-shrink-0 gap-4">
                    <div className="relative flex-1">
                        <SearchIcon className="w-4 h-4 text-gray-500 absolute top-1/2 left-3 -translate-y-1/2"/>
                        <input type="text" placeholder="Filter logs..." value={filter} onChange={e => setFilter(e.target.value)} className="w-full bg-dark-900 border border-dark-700 text-white rounded-md py-1.5 pl-9 pr-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500"/>
                    </div>
                    <div className="flex items-center space-x-1">
                        {(['V', 'D', 'I', 'W', 'E'] as const).map(level => (
                            <button
                                key={level}
                                onClick={() => toggleLevel(level)}
                                className={`w-7 h-7 rounded text-xs font-bold flex items-center justify-center transition ${levels.has(level) ? levelButtonColors[level].active : levelButtonColors[level].inactive}`}
                                title={`Toggle ${level} Logs`}
                            >
                                {level}
                            </button>
                        ))}
                    </div>
                    <div className="flex items-center space-x-3">
                        <button onClick={() => setAutoScroll(!autoScroll)} className={`transition ${autoScroll ? 'text-primary-400' : 'text-gray-500 hover:text-white'}`} data-tooltip={autoScroll ? "Auto-scroll On" : "Auto-scroll Off"}>
                            <GitPullIcon className="w-5 h-5" />
                        </button>
                        <button onClick={() => setIsPaused(!isPaused)} className="text-gray-400 hover:text-white transition" data-tooltip={isPaused ? "Resume Log" : "Pause Log"}>
                            {isPaused ? <PlayIcon className="w-5 h-5" /> : <PauseIcon className="w-5 h-5" />}
                        </button>
                        <button onClick={() => setLogs([])} className="text-gray-400 hover:text-white transition" data-tooltip="Clear Log">
                            <ClearIcon className="w-5 h-5" />
                        </button>
                    </div>
                </div>
                <div ref={logContainerRef} onScroll={handleScroll} className="bg-dark-900 rounded p-3 flex-1 overflow-y-auto font-mono text-sm">
                    {filteredLogs.length > 0 ? (
                        filteredLogs.map((log) => (
                             <div key={log.id} className="flex items-start">
                                <span className="text-gray-600">{log.timestamp.substr(11, 12)}</span>
                                <span className={`font-bold mx-2 log-line-${log.level}`}>{log.level}</span>
                                <p className={`whitespace-pre-wrap log-line-${log.level}`}>{log.message}</p>
                            </div>
                        ))
                    ) : (
                        <div className="text-center text-gray-500 flex flex-col justify-center items-center h-full">
                            <LogIcon className="w-16 h-16 text-gray-600 mb-4" />
                            <p>Waiting for logs or no logs match filter...</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default LogViewer;