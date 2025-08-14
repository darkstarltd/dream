
import React from 'react';
import { Plugin } from '../types';
import GeminiAssistantPlugin from '../components/plugins/GeminiAssistantPlugin';
import OpenAiAssistantPlugin from '../components/plugins/OpenAiAssistantPlugin';
import SystemMonitorWidget from '../components/plugins/SystemMonitorWidget';
import WebLinksWidget from '../components/plugins/WebLinksWidget';
import CodeScannerPlugin from '../components/plugins/CodeScannerPlugin';
import { SparklesIcon, PuzzleIcon, CodeIcon } from '../components/Icons';


const AVAILABLE_PLUGINS: Plugin[] = [
    {
        id: 'gemini_assistant',
        name: 'Gemini Assistant',
        author: 'Google',
        description: 'Official Google Gemini integration for code assistance, explanations, and more.',
        type: 'ai_assistant',
        icon: React.createElement(SparklesIcon, { className: "w-6 h-6 text-primary-300" }),
        component: GeminiAssistantPlugin,
        requests_vault_access: true,
    },
    {
        id: 'openai_assistant',
        name: 'OpenAI Assistant',
        author: 'OpenAI (Mock)',
        description: 'A mock plugin demonstrating how to integrate ChatGPT or other OpenAI models.',
        type: 'ai_assistant',
        icon: React.createElement(SparklesIcon, { className: "w-6 h-6 text-green-300" }),
        component: OpenAiAssistantPlugin,
        requests_vault_access: true,
    },
     {
        id: 'code_scanner',
        name: 'Code Scanner',
        author: 'Darkstar Security',
        description: 'Statically analyze code and get AI-powered fix suggestions.',
        type: 'tool',
        icon: React.createElement(CodeIcon, { className: "w-5 h-5" }),
        component: CodeScannerPlugin,
        requests_vault_access: true,
    },
    {
        id: 'system_monitor_widget',
        name: 'System Monitor',
        author: 'Darkstar Security',
        description: 'A dashboard widget to display mock real-time system stats like CPU and Memory usage.',
        type: 'widget',
        icon: React.createElement(PuzzleIcon, { className: "w-6 h-6 text-blue-300" }),
        component: SystemMonitorWidget,
    },
    {
        id: 'web_links_widget',
        name: 'Developer Links',
        author: 'Darkstar Security',
        description: 'A handy dashboard widget with quick links to useful developer resources.',
        type: 'widget',
        icon: React.createElement(PuzzleIcon, { className: "w-6 h-6 text-yellow-300" }),
        component: WebLinksWidget,
    },
];

export const getPlugin = (id: string): Plugin | undefined => AVAILABLE_PLUGINS.find(p => p.id === id);

export const getAllPlugins = (): Plugin[] => AVAILABLE_PLUGINS;