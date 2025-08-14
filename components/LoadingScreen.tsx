
import React from 'react';

const LoadingScreen: React.FC = () => {
    return (
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-dark-900 via-dark-800 to-black overflow-hidden relative">
            <div className="text-center z-10">
                <div className="relative w-32 h-32 mx-auto mb-10 filter blur-[0.5px]">
                    <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-primary-500 via-purple-500 to-blue-500 animate-organic-morph animate-luminous-glow"></div>
                    <div className="absolute top-0 left-0 w-full h-full animate-subtle-rotation">
                         <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-primary-500 via-purple-500 to-blue-500 animate-organic-morph"></div>
                    </div>
                </div>

                <h1 className="text-4xl font-light text-white tracking-wider">
                    <span className="font-medium bg-clip-text text-transparent bg-gradient-to-r from-primary-300 to-primary-500">Dream</span>
                    <span>Studio</span>
                </h1>

                <p className="text-sm text-gray-500 tracking-widest uppercase mt-2 mb-8">
                    by Darkstar Security
                </p>

                <p className="text-base text-primary-400 font-mono">
                    Initializing secure environment
                    <span className="animate-cursor-blink">_</span>
                </p>
            </div>
        </div>
    );
};

export default LoadingScreen;
