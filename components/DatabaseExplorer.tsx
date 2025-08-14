

import React, { useState, useMemo } from 'react';
import type { DbTable, DbRow } from '../types';
import { DatabaseIcon, SearchIcon, ChevronRightIcon, ChevronLeftIcon, CodeIcon, PlayIcon, ExclamationIcon } from './Icons';
import SegmentedControl from './SegmentedControl';

// Mock data source
const mockDb: DbTable[] = [
    {
        name: 'users',
        rows: Array.from({ length: 100 }, (_, i) => ({
            id: i + 1,
            name: `User ${i + 1}`,
            email: `user${i+1}@example.com`,
            role: i % 10 === 0 ? 'admin' : (i % 3 === 0 ? 'editor' : 'viewer'),
            created_at: new Date(Date.now() - Math.random() * 1e10).toISOString().split('T')[0],
        }))
    },
    {
        name: 'products',
        rows: Array.from({ length: 50 }, (_, i) => ({
            product_id: `prod_${String(i+1).padStart(3, '0')}`,
            name: `Product Title ${i + 1}`,
            price: parseFloat((Math.random() * 100 + 10).toFixed(2)),
            stock: Math.floor(Math.random() * 200),
            category: ['Electronics', 'Books', 'Home Goods'][i % 3],
        }))
    },
    {
        name: 'orders',
        rows: Array.from({ length: 200 }, (_, i) => ({
            order_id: 1000 + i,
            user_id: Math.floor(Math.random() * 100) + 1,
            amount: parseFloat((Math.random() * 200 + 20).toFixed(2)),
            status: ['completed', 'pending', 'shipped', 'cancelled'][i % 4],
            order_date: new Date(Date.now() - Math.random() * 1e10).toISOString(),
        }))
    }
];

// Mock SQL Runner
const runQuery = (query: string, db: DbTable[]): { results: DbRow[], error: string | null } => {
    const q = query.trim().toLowerCase();
    const selectRegex = /select\s+(.*?)\s+from\s+(\w+)(?:\s+where\s+(.*?))?;?$/;
    const match = q.match(selectRegex);

    if (!match) {
        return { results: [], error: "Invalid query. Only 'SELECT ... FROM ...' and optional 'WHERE' is supported." };
    }

    const [, columnsStr, tableName, whereClause] = match;
    const table = db.find(t => t.name.toLowerCase() === tableName);

    if (!table) {
        return { results: [], error: `Table '${tableName}' not found.` };
    }

    let results = table.rows;

    // Handle WHERE clause
    if (whereClause) {
        const whereMatch = whereClause.match(/(\w+)\s*=\s*'?([\w\d.-]+)'?/);
        if (whereMatch) {
            const [, key, value] = whereMatch;
            results = results.filter(row => String(row[key]).toLowerCase() === value.toLowerCase());
        }
    }

    // Handle column selection
    if (columnsStr !== '*') {
        const columns = columnsStr.split(',').map(c => c.trim());
        results = results.map(row => {
            const newRow: DbRow = {};
            columns.forEach(col => {
                if (row.hasOwnProperty(col)) {
                    newRow[col] = row[col];
                }
            });
            return newRow;
        });
    }

    return { results, error: null };
};


const ROWS_PER_PAGE = 15;

const DatabaseExplorer: React.FC = () => {
    const [tables] = useState<DbTable[]>(mockDb);
    const [selectedTable, setSelectedTable] = useState<DbTable | null>(tables[0] || null);
    const [activeTab, setActiveTab] = useState<'browse' | 'query'>('browse');
    
    // Browse state
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);

    // Query state
    const [query, setQuery] = useState('SELECT id, name, role FROM users WHERE role = admin;');
    const [queryResult, setQueryResult] = useState<{ results: DbRow[], error: string | null }>({ results: [], error: null });

    const filteredRows = useMemo(() => {
        if (!selectedTable) return [];
        if (!searchTerm) return selectedTable.rows;

        const searchLower = searchTerm.toLowerCase();
        return selectedTable.rows.filter(row => 
            Object.values(row).some(val => String(val).toLowerCase().includes(searchLower))
        );
    }, [selectedTable, searchTerm]);
    
    const paginatedRows = useMemo(() => {
        const startIndex = (currentPage - 1) * ROWS_PER_PAGE;
        return filteredRows.slice(startIndex, startIndex + ROWS_PER_PAGE);
    }, [filteredRows, currentPage]);

    const totalPages = Math.ceil(filteredRows.length / ROWS_PER_PAGE);
    const headers = selectedTable && selectedTable.rows.length > 0 ? Object.keys(selectedTable.rows[0]) : [];

    const queryResultHeaders = queryResult.results.length > 0 ? Object.keys(queryResult.results[0]) : [];

    const handleSelectTable = (tableName: string) => {
        const table = tables.find(t => t.name === tableName);
        setSelectedTable(table || null);
        setSearchTerm('');
        setCurrentPage(1);
    };

    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setCurrentPage(newPage);
        }
    };
    
    const handleRunQuery = () => {
        const result = runQuery(query, tables);
        setQueryResult(result);
    };

    const renderBrowseView = () => (
        <>
            <div className="flex-shrink-0 mb-4 flex justify-between items-center">
                <h2 className="text-xl font-bold text-white">{selectedTable?.name || 'No Table Selected'}</h2>
                <div className="relative w-full max-w-xs">
                    <SearchIcon className="w-4 h-4 text-gray-500 absolute top-1/2 left-3 -translate-y-1/2" />
                    <input
                        type="text"
                        placeholder="Search table..."
                        value={searchTerm}
                        onChange={(e) => {setSearchTerm(e.target.value); setCurrentPage(1);}}
                        className="w-full bg-dark-900 border border-dark-600 rounded-md py-1.5 pl-9 pr-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500"
                    />
                </div>
            </div>
            <div className="flex-1 min-h-0 overflow-auto">
                <table className="w-full text-sm text-left text-gray-400">
                    <thead className="text-xs text-gray-300 uppercase bg-dark-700 sticky top-0">
                        <tr>
                            {headers.map(header => (
                                <th key={header} scope="col" className="px-4 py-2 font-mono font-normal">
                                    {header}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedRows.map((row, rowIndex) => (
                            <tr key={rowIndex} className="bg-dark-800 border-b border-dark-700 hover:bg-dark-700/50">
                                {headers.map(header => (
                                    <td key={`${rowIndex}-${header}`} className="px-4 py-2 font-mono text-gray-300 whitespace-nowrap">
                                        {String(row[header])}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
                {paginatedRows.length === 0 && (
                     <div className="text-center text-gray-500 py-16">No results found for "{searchTerm}".</div>
                )}
            </div>
            <div className="flex-shrink-0 pt-3 flex justify-between items-center text-sm text-gray-400">
                <div>
                    Page {currentPage} of {totalPages} ({filteredRows.length} rows)
                </div>
                <div className="flex items-center space-x-2">
                    <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} className="p-1 rounded-md hover:bg-dark-700 disabled:opacity-50">
                        <ChevronLeftIcon className="w-5 h-5" />
                    </button>
                     <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages} className="p-1 rounded-md hover:bg-dark-700 disabled:opacity-50">
                        <ChevronRightIcon className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </>
    );
    
    const renderQueryView = () => (
        <>
           <div className="flex-shrink-0 mb-4 flex flex-col space-y-3">
               <textarea 
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="SELECT * FROM users;"
                  className="w-full h-24 bg-dark-900 border border-dark-600 rounded-md p-3 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-primary-500 resize-none"
                  spellCheck="false"
               />
               <button onClick={handleRunQuery} className="bg-primary-500 hover:bg-primary-600 text-white font-bold py-2 px-4 rounded-md text-sm flex items-center justify-center space-x-2 self-start">
                   <PlayIcon className="w-4 h-4"/><span>Run Query</span>
               </button>
           </div>
            {queryResult.error && (
                <div className="flex-shrink-0 mb-4 p-3 bg-red-500/10 text-red-300 border border-red-500/30 rounded-md text-sm flex items-start space-x-2">
                    <ExclamationIcon className="w-4 h-4 mt-0.5 shrink-0" />
                    <p className="font-mono">{queryResult.error}</p>
                </div>
            )}
           <div className="flex-1 min-h-0 overflow-auto">
               <table className="w-full text-sm text-left text-gray-400">
                    <thead className="text-xs text-gray-300 uppercase bg-dark-700 sticky top-0">
                        <tr>
                            {queryResultHeaders.map(header => (
                                <th key={header} scope="col" className="px-4 py-2 font-mono font-normal">
                                    {header}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {queryResult.results.map((row, rowIndex) => (
                            <tr key={rowIndex} className="bg-dark-800 border-b border-dark-700 hover:bg-dark-700/50">
                                {queryResultHeaders.map(header => (
                                    <td key={`${rowIndex}-${header}`} className="px-4 py-2 font-mono text-gray-300 whitespace-nowrap">
                                        {String(row[header])}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
                {queryResult.results.length === 0 && !queryResult.error && (
                     <div className="text-center text-gray-500 py-16">No results from query.</div>
                )}
           </div>
        </>
    );

    return (
        <div className="p-6 h-full flex flex-col bg-dark-900">
            <div className="grid grid-cols-12 gap-6 flex-1 min-h-0">
                {/* Left: Table List */}
                <div className="col-span-3 bg-dark-800 border border-dark-700 rounded-lg p-4 flex flex-col">
                    <h3 className="text-lg font-bold text-gray-200 mb-4">Tables</h3>
                    <div className="flex-1 overflow-y-auto pr-2 space-y-1">
                        {tables.map(table => (
                            <button
                                key={table.name}
                                onClick={() => handleSelectTable(table.name)}
                                className={`w-full text-left p-2 rounded-md font-mono text-sm transition-colors ${
                                    selectedTable?.name === table.name && activeTab === 'browse'
                                        ? 'bg-primary-500/20 text-primary-300'
                                        : 'text-gray-400 hover:bg-dark-700 hover:text-gray-200'
                                }`}
                            >
                                {table.name} ({table.rows.length})
                            </button>
                        ))}
                    </div>
                </div>

                {/* Right: Data Viewer */}
                <div className="col-span-9 bg-dark-800 border border-dark-700 rounded-lg p-4 flex flex-col">
                     <div className="w-64 flex-shrink-0 mb-4">
                         <SegmentedControl
                            options={[
                                { id: 'browse', label: 'Browse' },
                                { id: 'query', label: 'Query' }
                            ]}
                            value={activeTab}
                            onChange={(v) => setActiveTab(v as 'browse' | 'query')}
                         />
                    </div>

                    {activeTab === 'browse' ? (
                        selectedTable ? renderBrowseView() : (
                            <div className="flex flex-col items-center justify-center h-full text-center text-gray-500">
                                <DatabaseIcon className="w-16 h-16 text-gray-600 mb-4" />
                                <h3 className="text-lg font-semibold">Select a table to begin</h3>
                                <p className="text-sm">Choose a table from the left panel to view its data.</p>
                            </div>
                        )
                    ) : renderQueryView()}
                </div>
            </div>
        </div>
    );
};

export default DatabaseExplorer;