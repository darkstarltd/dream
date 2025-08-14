
import React from 'react';
import { LinkIcon } from '../Icons';

const links = [
    { name: 'React Docs', url: 'https://react.dev/' },
    { name: 'MDN Web Docs', url: 'https://developer.mozilla.org/' },
    { name: 'Tailwind CSS', url: 'https://tailwindcss.com/docs' },
    { name: 'TypeScript', url: 'https://www.typescriptlang.org/docs/' },
];

const WebLinksWidget: React.FC = () => {
    return (
        <div className="bg-dark-800 p-6 rounded-lg border border-dark-700 h-full">
            <h3 className="text-base font-bold text-gray-100 mb-4">Developer Links</h3>
            <div className="space-y-2">
                {links.map(link => (
                    <a
                        key={link.name}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center space-x-3 p-2 rounded-md hover:bg-dark-700/50 group"
                    >
                        <LinkIcon className="w-4 h-4 text-gray-500 group-hover:text-primary-400 transition-colors" />
                        <span className="text-sm text-gray-300 group-hover:text-white transition-colors">{link.name}</span>
                    </a>
                ))}
            </div>
        </div>
    );
};

export default WebLinksWidget;
