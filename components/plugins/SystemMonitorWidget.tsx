
import React, { useState, useEffect } from 'react';
import { ChipIcon, ServerIcon, DatabaseIcon } from '../Icons';

const StatBar: React.FC<{ label: string; value: number; icon: React.ReactNode }> = ({ label, value, icon }) => {
    const colorClass = value > 85 ? 'bg-red-500' : value > 60 ? 'bg-yellow-500' : 'bg-green-500';
    return (
        <div>
            <div className="flex justify-between items-center mb-1 text-xs">
                <div className="flex items-center text-gray-400 space-x-2">
                    {icon}
                    <span>{label}</span>
                </div>
                <span className="font-mono text-gray-300">{value.toFixed(0)}%</span>
            </div>
            <div className="w-full bg-dark-700 rounded-full h-1.5">
                <div className={`${colorClass} h-1.5 rounded-full transition-all duration-500`} style={{ width: `${value}%` }}></div>
            </div>
        </div>
    );
};

const SystemMonitorWidget: React.FC = () => {
    const [stats, setStats] = useState({ cpu: 0, memory: 0, network: 0 });

    useEffect(() => {
        const interval = setInterval(() => {
            setStats({
                cpu: 40 + Math.random() * 50, // 40-90%
                memory: 50 + Math.random() * 30, // 50-80%
                network: 5 + Math.random() * 20, // 5-25%
            });
        }, 2000);

        // Set initial state
        setStats({
            cpu: 40 + Math.random() * 50,
            memory: 50 + Math.random() * 30,
            network: 5 + Math.random() * 20,
        });

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="bg-dark-800 p-6 rounded-lg border border-dark-700 h-full">
            <h3 className="text-base font-bold text-gray-100 mb-4">System Monitor</h3>
            <div className="space-y-4">
                <StatBar label="CPU Usage" value={stats.cpu} icon={<ChipIcon className="w-4 h-4" />} />
                <StatBar label="Memory Usage" value={stats.memory} icon={<DatabaseIcon className="w-4 h-4" />} />
                <StatBar label="Network I/O" value={stats.network} icon={<ServerIcon className="w-4 h-4" />} />
            </div>
        </div>
    );
};

export default SystemMonitorWidget;
