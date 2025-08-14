
import React, { useEffect, useRef } from 'react';
import { Terminal as XTerm } from 'xterm';
import { io, Socket } from 'socket.io-client';
import { FitAddon } from 'xterm-addon-fit';

const DS_SERVER_URL = (window as any).DS_SERVER_URL || 'http://localhost:4000';

export default function Terminal() {
    const terminalRef = useRef<HTMLDivElement | null>(null);
    const xtermRef = useRef<XTerm | null>(null);
    const socketRef = useRef<Socket | null>(null);

    useEffect(() => {
        if (!terminalRef.current || xtermRef.current) return;

        const xterm = new XTerm({
            cursorBlink: true,
            fontFamily: '"Fira Code", monospace',
            fontSize: 14,
            theme: {
                background: '#161b22', // dark-800
                foreground: '#c9d1d9',
                cursor: '#c9d1d9',
                selectionBackground: '#30363d', // dark-600
                black: '#21262d',
                red: '#ff7b72',
                green: '#3fb950',
                yellow: '#d29922',
                blue: '#58a6ff',
                magenta: '#bc8cff',
                cyan: '#39c5cf',
                white: '#c9d1d9',
                brightBlack: '#48515a',
                brightRed: '#ffa198',
                brightGreen: '#56d364',
                brightYellow: '#e3b341',
                brightBlue: '#79c0ff',
                brightMagenta: '#d2a8ff',
                brightCyan: '#56d4dd',
                brightWhite: '#f0f6fc',
            },
            allowProposedApi: true,
        });
        
        const fitAddon = new FitAddon();
        xterm.loadAddon(fitAddon);
        
        xterm.open(terminalRef.current);
        fitAddon.fit();
        xtermRef.current = xterm;

        xterm.writeln('Welcome to Dream Studio Terminal!');
        xterm.writeln('');

        const socket = io(DS_SERVER_URL, {
            transports: ['websocket'],
            auth: { token: localStorage.getItem('ds_token') || '' }
        });
        socketRef.current = socket;

        socket.on('connect', () => {
            xterm.writeln('\x1b[1;32mSocket connected.\x1b[0m');
            fitAddon.fit();
        });
        
        socket.on('disconnect', () => {
            xterm.writeln('\x1b[1;31mSocket disconnected.\x1b[0m');
        });

        socket.on('terminal.out', (data: string) => xterm.write(data));

        xterm.onData((data: string) => socket.emit('terminal.in', data));

        const handleResize = () => {
            fitAddon.fit();
        };

        const resizeObserver = new ResizeObserver(handleResize);
        if (terminalRef.current.parentElement) {
            resizeObserver.observe(terminalRef.current.parentElement);
        }
        
        xterm.onResize(({ cols, rows }) => {
            socket.emit('resize', { cols, rows });
        });

        return () => {
            resizeObserver.disconnect();
            socket.disconnect();
            xterm.dispose();
            xtermRef.current = null;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <div className="w-full h-full p-2 bg-dark-800">
            <div ref={terminalRef} className="w-full h-full" />
        </div>
    );
};
