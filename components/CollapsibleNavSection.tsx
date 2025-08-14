import React, { useState } from 'react';
import { ChevronDownIcon } from './Icons';

interface CollapsibleNavSectionProps {
    title: string;
    children: React.ReactNode;
}

const CollapsibleNavSection: React.FC<CollapsibleNavSectionProps> = ({ title, children }) => {
    const [isOpen, setIsOpen] = useState(true);

    return (
        <div className="py-2">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex justify-between items-center py-1.5 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider hover:text-gray-300"
            >
                <span>{title}</span>
                <ChevronDownIcon className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            {isOpen && (
                <div className="mt-1 space-y-1.5">
                    {children}
                </div>
            )}
        </div>
    );
};

export default CollapsibleNavSection;
