import { useState } from 'react';
import { Button } from '../ui/button';

export type DrawingTool = 'cursor' | 'horizontal-line' | 'trend-line' | 'fibonacci' | 'rectangle';

interface ChartDrawingToolsProps {
  selectedTool: DrawingTool;
  onToolSelect: (tool: DrawingTool) => void;
  onClearAll: () => void;
}

export default function ChartDrawingTools({ selectedTool, onToolSelect, onClearAll }: ChartDrawingToolsProps) {
  const tools = [
    { id: 'cursor' as DrawingTool, icon: '↖️', label: 'Cursor', shortcut: 'Esc' },
    { id: 'horizontal-line' as DrawingTool, icon: '─', label: 'Horizontal Line', shortcut: 'H' },
    { id: 'trend-line' as DrawingTool, icon: '⟋', label: 'Trend Line', shortcut: 'T' },
    { id: 'fibonacci' as DrawingTool, icon: 'φ', label: 'Fibonacci', shortcut: 'F' },
    { id: 'rectangle' as DrawingTool, icon: '▭', label: 'Rectangle', shortcut: 'R' },
  ];

  return (
    <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10">
      <div className="bg-[#2a2e39] rounded-lg shadow-lg px-2 py-2 flex items-center gap-2">
        {tools.map((tool) => (
          <button
            key={tool.id}
            onClick={() => onToolSelect(tool.id)}
            className={`
              px-3 py-2 rounded-md text-sm font-medium transition-all
              hover:bg-[#3a3e49] relative group
              ${selectedTool === tool.id 
                ? 'bg-yellow-600 text-white' 
                : 'bg-[#1a1d26] text-gray-300'
              }
            `}
            title={`${tool.label} (${tool.shortcut})`}
          >
            <span className="text-lg">{tool.icon}</span>
            
            {/* Tooltip */}
            <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 
                          bg-gray-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap
                          opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity">
              {tool.label}
              <div className="text-gray-400 text-[10px]">{tool.shortcut}</div>
            </div>
          </button>
        ))}

        {/* Divider */}
        <div className="h-6 w-px bg-gray-600 mx-1" />

        {/* Clear All Button */}
        <button
          onClick={onClearAll}
          className="px-3 py-2 rounded-md text-sm font-medium bg-red-600 hover:bg-red-700 
                     text-white transition-all"
          title="Clear All Drawings"
        >
          🗑️
        </button>
      </div>
    </div>
  );
}
