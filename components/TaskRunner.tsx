import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Task, EnvFile } from '../types';
import { useNotification } from '../App';
import { AddIcon, DeleteIcon, EditIcon, SaveIcon, PlayIcon, TaskRunnerIcon, TerminalIcon } from './Icons';

const TaskRunner: React.FC = () => {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [environments, setEnvironments] = useState<EnvFile[]>([]);
    const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [output, setOutput] = useState<string[]>([]);
    const [runningTaskId, setRunningTaskId] = useState<string | null>(null);
    const outputRef = useRef<HTMLDivElement>(null);
    const addNotification = useNotification();

    useEffect(() => {
        const savedTasks = localStorage.getItem('ds_task_runner_tasks');
        if (savedTasks) setTasks(JSON.parse(savedTasks));
        
        const savedEnvs = localStorage.getItem('ds_env_files');
        if (savedEnvs) setEnvironments(JSON.parse(savedEnvs));
    }, []);
    
    useEffect(() => {
        localStorage.setItem('ds_task_runner_tasks', JSON.stringify(tasks));
    }, [tasks]);

    useEffect(() => {
        outputRef.current?.scrollTo(0, outputRef.current.scrollHeight);
    }, [output]);

    const selectedTask = useMemo(() => tasks.find(t => t.id === selectedTaskId), [tasks, selectedTaskId]);

    const handleCreateTask = () => {
        const newTask: Task = {
            id: `task_${Date.now()}`,
            name: 'New Task',
            command: 'echo "Hello from Dream Studio!"',
            envFileId: 'none'
        };
        setTasks(prev => [...prev, newTask]);
        setSelectedTaskId(newTask.id);
        setIsEditing(true);
    };

    const handleUpdateTask = (updatedTask: Task) => {
        setTasks(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t));
    };

    const handleDeleteTask = (id: string) => {
        if (window.confirm('Are you sure you want to delete this task?')) {
            setTasks(prev => prev.filter(t => t.id !== id));
            if (selectedTaskId === id) setSelectedTaskId(null);
            addNotification('Task deleted.', 'info');
        }
    };
    
    const runTask = (task: Task) => {
        setRunningTaskId(task.id);
        setOutput([
            `[${new Date().toLocaleTimeString()}] Running task: ${task.name}...`,
            `> ${task.command}`,
            ''
        ]);

        const env = environments.find(e => e.id === task.envFileId);
        if (env) {
            setOutput(prev => [...prev, `[INFO] Using environment: ${env.name}`]);
        }

        // Mock execution
        setTimeout(() => {
            setOutput(prev => [...prev, `[MOCK] Task output for '${task.command}'...`, '✅ Done!']);
            setOutput(prev => [...prev, `[${new Date().toLocaleTimeString()}] Task finished.`]);
            setRunningTaskId(null);
        }, 1500 + Math.random() * 1000);
    };

    return (
        <div className="p-6 h-full flex flex-col bg-dark-900">
            <div className="grid grid-cols-12 gap-6 flex-1 min-h-0">
                <div className="col-span-3 bg-dark-800 border border-dark-700 rounded-lg p-4 flex flex-col">
                    <h3 className="text-lg font-bold text-gray-200 mb-4">Tasks</h3>
                    <div className="flex-1 overflow-y-auto pr-2 space-y-1">
                        {tasks.map(task => (
                            <button key={task.id} onClick={() => { setSelectedTaskId(task.id); setIsEditing(false); }}
                                className={`w-full text-left p-2 rounded-md font-mono text-sm flex items-center justify-between transition-colors ${selectedTaskId === task.id ? 'bg-primary-500/20 text-primary-300' : 'text-gray-400 hover:bg-dark-700'}`}>
                                <span className="truncate">{task.name}</span>
                                {runningTaskId === task.id && <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>}
                            </button>
                        ))}
                    </div>
                    <button onClick={handleCreateTask} className="mt-4 w-full bg-dark-700 hover:bg-dark-600 text-gray-300 font-bold py-2 px-4 rounded-md text-sm flex items-center justify-center space-x-2">
                        <AddIcon className="w-4 h-4"/><span>New Task</span>
                    </button>
                </div>

                <div className="col-span-9 bg-dark-800 border border-dark-700 rounded-lg p-4 flex flex-col">
                    {selectedTask ? (
                        <div className="flex flex-col flex-1 min-h-0">
                            <div className="flex justify-between items-center mb-4 flex-shrink-0">
                                {isEditing ? (
                                    <input type="text" value={selectedTask.name} onChange={e => handleUpdateTask({...selectedTask, name: e.target.value})} className="bg-dark-900 border border-dark-600 rounded-md py-1.5 px-3 text-xl font-bold text-white focus:outline-none focus:ring-1 focus:ring-primary-500"/>
                                ) : (
                                    <h2 className="text-xl font-bold text-white">{selectedTask.name}</h2>
                                )}
                                <div className="flex items-center space-x-2">
                                    {isEditing ? (
                                        <button onClick={() => setIsEditing(false)} className="bg-primary-500 hover:bg-primary-600 text-white font-bold py-2 px-3 rounded-md text-sm flex items-center space-x-2">
                                            <SaveIcon className="w-4 h-4"/><span>Save</span>
                                        </button>
                                    ) : (
                                        <button onClick={() => setIsEditing(true)} className="bg-dark-700 hover:bg-dark-600 text-gray-300 font-bold py-2 px-3 rounded-md text-sm flex items-center space-x-2">
                                            <EditIcon className="w-4 h-4"/><span>Edit</span>
                                        </button>
                                    )}
                                    <button onClick={() => handleDeleteTask(selectedTask.id)} className="bg-red-500/10 hover:bg-red-500/20 text-red-400 font-bold py-2 px-3 rounded-md text-sm"><DeleteIcon className="w-4 h-4"/></button>
                                </div>
                            </div>
                            
                            {isEditing ? (
                                <div className="space-y-4 flex-shrink-0">
                                    <div>
                                        <label className="text-xs text-gray-400">Command</label>
                                        <input type="text" value={selectedTask.command} onChange={e => handleUpdateTask({...selectedTask, command: e.target.value})} className="w-full bg-dark-900 border border-dark-600 rounded-md py-1.5 px-3 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-primary-500" />
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-400">Environment</label>
                                        <select value={selectedTask.envFileId} onChange={e => handleUpdateTask({...selectedTask, envFileId: e.target.value})} className="w-full bg-dark-900 border border-dark-600 rounded-md py-1.5 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500">
                                            <option value="none">None</option>
                                            {environments.map(env => <option key={env.id} value={env.id}>{env.name}</option>)}
                                        </select>
                                    </div>
                                </div>
                            ) : (
                                <div className="mb-4 flex-shrink-0">
                                    <p className="font-mono bg-dark-900 border border-dark-700 rounded-md p-3 text-sm text-gray-300">{selectedTask.command}</p>
                                    <button onClick={() => runTask(selectedTask)} disabled={runningTaskId !== null} className="mt-4 bg-primary-500 hover:bg-primary-600 text-white font-bold py-2 px-4 rounded-md text-sm flex items-center justify-center space-x-2 disabled:opacity-50">
                                        <PlayIcon className="w-4 h-4"/><span>{runningTaskId === selectedTask.id ? 'Running...' : 'Run Task'}</span>
                                    </button>
                                </div>
                            )}

                            <div className="flex-1 min-h-0 mt-4 pt-4 border-t border-dark-700 flex flex-col">
                                <h4 className="text-sm font-semibold text-gray-400 mb-2 flex items-center"><TerminalIcon className="w-4 h-4 mr-2"/>Output</h4>
                                <div ref={outputRef} className="bg-dark-900 rounded p-3 flex-1 overflow-y-auto font-mono text-xs text-gray-300 whitespace-pre-wrap">
                                    {output.join('\n')}
                                    {runningTaskId && <span className="animate-cursor-blink">_</span>}
                                </div>
                            </div>
                        </div>
                    ) : (
                         <div className="flex flex-col items-center justify-center h-full text-center text-gray-500">
                            <TaskRunnerIcon className="w-16 h-16 text-gray-600 mb-4" />
                            <h3 className="text-lg font-semibold">Select a task to view</h3>
                            <p className="text-sm">Or, create a new one to get started.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TaskRunner;
