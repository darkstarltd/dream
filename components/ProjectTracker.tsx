



import React, { useState, useEffect, useMemo } from 'react';
import { ProjectTask, ProjectColumnId, TaskPriority } from '../types';
import { AddIcon, DeleteIcon, ProjectIcon } from './Icons';
import { useNotification } from '../App';

// --- Column Definition ---
const columns: { id: ProjectColumnId; title: string }[] = [
    { id: 'todo', title: 'To Do' },
    { id: 'in-progress', title: 'In Progress' },
    { id: 'done', title: 'Done' },
];

const priorityStyles: Record<TaskPriority, { bg: string, text: string, border: string }> = {
    high: { bg: 'bg-red-500/20', text: 'text-red-300', border: 'border-red-500/50' },
    medium: { bg: 'bg-yellow-500/20', text: 'text-yellow-300', border: 'border-yellow-500/50' },
    low: { bg: 'bg-blue-500/20', text: 'text-blue-300', border: 'border-blue-500/50' },
};

// --- Add Task Form Component ---
const AddTaskForm: React.FC<{ onAddTask: (content: string, priority: TaskPriority) => void }> = ({ onAddTask }) => {
    const [content, setContent] = useState('');
    const [priority, setPriority] = useState<TaskPriority>('medium');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (content.trim()) {
            onAddTask(content, priority);
            setContent('');
            setPriority('medium');
        }
    };

    return (
        <form onSubmit={handleSubmit} className="mt-2 space-y-2">
            <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="New task..."
                className="w-full bg-dark-900 border border-dark-600 rounded-md py-1.5 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500 resize-none"
                rows={2}
            />
            <div className="flex justify-between items-center">
                <select 
                    value={priority} 
                    onChange={e => setPriority(e.target.value as TaskPriority)}
                    className="bg-dark-900 border border-dark-600 rounded-md py-1 px-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary-500"
                >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                </select>
                <button type="submit" className="bg-primary-500 hover:bg-primary-600 text-white font-bold py-1 px-3 rounded-md transition text-sm flex items-center space-x-1">
                    <AddIcon className="w-4 h-4" />
                    <span>Add</span>
                </button>
            </div>
        </form>
    );
};


// --- Task Card Component ---
const TaskCard: React.FC<{ task: ProjectTask; onDelete: (id: string) => void }> = ({ task, onDelete }) => {
    const styles = priorityStyles[task.priority];
    return (
        <div 
            draggable
            onDragStart={(e) => e.dataTransfer.setData('taskId', task.id)}
            className={`bg-dark-800 p-3 rounded-lg border-l-4 group relative flex flex-col ${styles.border} cursor-grab`}
        >
            <p className="text-sm text-gray-200 flex-grow">{task.content}</p>
            <div className="mt-2">
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${styles.bg} ${styles.text} capitalize`}>
                    {task.priority}
                </span>
            </div>
            <button onClick={() => onDelete(task.id)} className="absolute top-1 right-1 p-1 text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">
                <DeleteIcon className="w-4 h-4" />
            </button>
        </div>
    );
};


// --- Main Project Tracker Component ---
const ProjectTracker: React.FC = () => {
    const [tasks, setTasks] = useState<ProjectTask[]>([]);
    const [draggedOverColumn, setDraggedOverColumn] = useState<ProjectColumnId | null>(null);
    const addNotification = useNotification();

    useEffect(() => {
        const savedTasks = localStorage.getItem('ds_project_tasks');
        if (savedTasks) {
            setTasks(JSON.parse(savedTasks));
        }
    }, []);

    useEffect(() => {
        localStorage.setItem('ds_project_tasks', JSON.stringify(tasks));
    }, [tasks]);

    const tasksByColumn = useMemo(() => {
        return columns.reduce((acc, col) => {
            acc[col.id] = tasks.filter(t => t.columnId === col.id);
            return acc;
        }, {} as Record<ProjectColumnId, ProjectTask[]>);
    }, [tasks]);
    
    const handleAddTask = (content: string, priority: TaskPriority) => {
        const newTask: ProjectTask = {
            id: `task_${Date.now()}`,
            content,
            priority,
            columnId: 'todo',
        };
        setTasks(prev => [...prev, newTask]);
        addNotification('New task added.', 'success');
    };

    const handleDeleteTask = (id: string) => {
        if (window.confirm('Are you sure you want to delete this task?')) {
            setTasks(prev => prev.filter(t => t.id !== id));
            addNotification('Task deleted.', 'info');
        }
    };
    
    const handleDragOver = (e: React.DragEvent<HTMLDivElement>, columnId: ProjectColumnId) => {
        e.preventDefault();
        setDraggedOverColumn(columnId);
    };
    
    const handleDrop = (e: React.DragEvent<HTMLDivElement>, columnId: ProjectColumnId) => {
        e.preventDefault();
        const taskId = e.dataTransfer.getData('taskId');
        setTasks(prev => prev.map(t => t.id === taskId ? { ...t, columnId } : t));
        setDraggedOverColumn(null);
    };

    return (
        <div className="p-6 bg-dark-900 h-full flex flex-col">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full overflow-x-auto">
                {columns.map(column => (
                    <div
                        key={column.id}
                        onDragOver={(e) => handleDragOver(e, column.id)}
                        onDrop={(e) => handleDrop(e, column.id)}
                        onDragLeave={() => setDraggedOverColumn(null)}
                        className={`bg-dark-800 border border-dark-700 rounded-lg p-3 flex flex-col transition-colors ${draggedOverColumn === column.id ? 'bg-primary-500/10 border-primary-500/50' : ''}`}
                    >
                        <h3 className="text-base font-bold text-gray-200 px-2 py-1 mb-3">
                            {column.title} <span className="text-sm text-gray-500">{tasksByColumn[column.id].length}</span>
                        </h3>
                        <div className="space-y-3 overflow-y-auto flex-1 pr-1">
                            {tasksByColumn[column.id].length > 0 ? (
                                tasksByColumn[column.id].map(task => (
                                    <TaskCard key={task.id} task={task} onDelete={handleDeleteTask} />
                                ))
                            ) : (
                                <div className={`h-full flex items-center justify-center text-center text-gray-600 border-2 border-dashed border-dark-700 rounded-lg ${draggedOverColumn === column.id ? 'border-primary-500/50' : ''}`}>
                                    <div>
                                        <ProjectIcon className="w-8 h-8 mx-auto mb-2 opacity-50"/>
                                        <p className="text-xs">
                                            {column.id === 'todo' ? "Add a task below" : "Drag tasks here"}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                        {column.id === 'todo' && (
                            <div className="mt-auto pt-3 border-t border-dark-700">
                                <AddTaskForm onAddTask={handleAddTask} />
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ProjectTracker;