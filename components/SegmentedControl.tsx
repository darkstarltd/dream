import React from 'react';

interface SegmentedControlProps {
    options: { id: string; label: string }[];
    value: string;
    onChange: (value: string) => void;
}

const SegmentedControl: React.FC<SegmentedControlProps> = ({ options, value, onChange }) => (
    <div className="segmented-control">
        {options.map(opt => (
            <button
                key={opt.id}
                onClick={() => onChange(opt.id)}
                className={value === opt.id ? 'active' : ''}
            >
                {opt.label}
            </button>
        ))}
    </div>
);

export default SegmentedControl;
