import React, { useState, useMemo } from 'react';
import { diffLines, Change } from 'diff';

type DiffView = 'inline' | 'sbs'; // Side-by-side

const DiffViewer: React.FC = () => {
    const [originalText, setOriginalText] = useState('const x = 1;\nconst y = 2;\nconsole.log(x + y);');
    const [changedText, setChangedText] = useState('const x = 1;\nconst y = 3; // changed value\nconsole.log(x * y); // changed operator');
    const [view, setView] = useState<DiffView>('sbs');

    const diffResult = useMemo(() => {
        return diffLines(originalText, changedText);
    }, [originalText, changedText]);
    
    const sbsDiff = useMemo(() => {
        const left: { num: number; content: string; type: 'deleted' | 'common' }[] = [];
        const right: { num: number; content: string; type: 'added' | 'common' }[] = [];
        let leftNum = 1;
        let rightNum = 1;

        diffResult.forEach(part => {
            const lines = part.value.split('\n').filter((l, i) => i < part.value.split('\n').length - 1);
            if (part.added) {
                lines.forEach(line => {
                    right.push({ num: rightNum++, content: line, type: 'added' });
                });
            } else if (part.removed) {
                lines.forEach(line => {
                    left.push({ num: leftNum++, content: line, type: 'deleted' });
                });
            } else {
                lines.forEach(line => {
                    left.push({ num: leftNum++, content: line, type: 'common' });
                    right.push({ num: rightNum++, content: line, type: 'common' });
                });
            }
        });
        
        const aligned: { left: typeof left[0] | null, right: typeof right[0] | null }[] = [];
        let i = 0;
        let j = 0;

        while (i < left.length || j < right.length) {
            if (left[i] && right[j] && left[i].content === right[j].content) {
                aligned.push({ left: left[i], right: right[j] });
                i++;
                j++;
            } else {
                const lookahead = right.slice(j).findIndex(r => left[i] && r.content === left[i].content);
                if(left[i]?.type === 'deleted' && (lookahead === -1 || lookahead > 5)) {
                    aligned.push({ left: left[i], right: null });
                    i++;
                } else if(right[j]?.type === 'added') {
                    aligned.push({ left: null, right: right[j] });
                    j++;
                } else {
                     aligned.push({ left: left[i] || null, right: right[j] || null });
                     if(left[i]) i++;
                     if(right[j]) j++;
                }
            }
        }
        return aligned;

    }, [diffResult]);


    const renderInlineDiff = () => (
        <div className="bg-dark-900 rounded p-2 text-sm">
            {diffResult.map((part, index) => {
                const className = part.added ? 'diff-added' : part.removed ? 'diff-deleted' : '';
                return (
                    <div key={index} className={className}>
                        {part.value.split('\n').filter((l,i) => i < part.value.split('\n').length - 1).map((line, lineIdx) => (
                           <div key={lineIdx} className="diff-line">{line}</div>
                        ))}
                    </div>
                );
            })}
        </div>
    );
    
    const renderSbsDiff = () => (
        <div className="bg-dark-900 rounded p-2 text-sm">
            {sbsDiff.map((line, index) => (
                <div key={index} className="diff-sbs-line">
                    <div className={`diff-sbs-num ${line.left ? '' : 'bg-dark-800'}`}>{line.left?.num}</div>
                    <div className={line.left?.type === 'deleted' ? 'diff-sbs-deleted' : ''}>{line.left?.content}</div>
                    <div className={`diff-sbs-num ${line.right ? '' : 'bg-dark-800'}`}>{line.right?.num}</div>
                    <div className={line.right?.type === 'added' ? 'diff-sbs-added' : ''}>{line.right?.content}</div>
                </div>
            ))}
        </div>
    );

    return (
        <div className="p-6 h-full flex flex-col bg-dark-900">
             {/* Input Panes */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-shrink-0">
                <div className="flex flex-col">
                     <h3 className="text-lg font-bold text-gray-200 mb-2">Original</h3>
                     <textarea
                        value={originalText}
                        onChange={(e) => setOriginalText(e.target.value)}
                        placeholder="Paste original text/code here"
                        className="w-full h-48 bg-dark-800 border border-dark-700 rounded-md p-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                        spellCheck="false"
                    />
                </div>
                 <div className="flex flex-col">
                     <h3 className="text-lg font-bold text-gray-200 mb-2">Changed</h3>
                     <textarea
                        value={changedText}
                        onChange={(e) => setChangedText(e.target.value)}
                        placeholder="Paste changed text/code here"
                        className="w-full h-48 bg-dark-800 border border-dark-700 rounded-md p-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                        spellCheck="false"
                    />
                </div>
            </div>

            {/* Diff Result */}
            <div className="bg-dark-800 border border-dark-700 rounded-lg mt-6 p-4 flex flex-col flex-1 min-h-0">
                <div className="flex justify-between items-center mb-3 flex-shrink-0">
                    <h3 className="text-lg font-bold text-gray-200">Result</h3>
                    <div className="w-40">
                         <div className="segmented-control">
                            <button onClick={() => setView('sbs')} className={view === 'sbs' ? 'active' : ''}>Side-by-side</button>
                            <button onClick={() => setView('inline')} className={view === 'inline' ? 'active' : ''}>Inline</button>
                        </div>
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto pr-2">
                    {view === 'inline' ? renderInlineDiff() : renderSbsDiff()}
                </div>
            </div>
        </div>
    );
};

export default DiffViewer;
