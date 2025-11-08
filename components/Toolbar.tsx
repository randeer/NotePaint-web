import React, { useRef } from 'react';
import { Tool } from '../types';

interface ToolbarProps {
  tool: Tool;
  setTool: (tool: Tool) => void;
  color: string;
  setColor: (color: string) => void;
  brushSize: number;
  setBrushSize: (size: number) => void;
  onShare: () => void;
  onImageUpload: (file: File) => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

const ToolButton = ({
  label,
  icon,
  isActive,
  onClick,
  disabled = false,
}: {
  label: string;
  icon: React.ReactNode;
  isActive: boolean;
  onClick: () => void;
  disabled?: boolean;
}) => (
  <button
    title={label}
    onClick={onClick}
    disabled={disabled}
    className={`w-10 h-10 flex items-center justify-center rounded transition-colors duration-200 ${
      isActive
        ? 'bg-blue-500 text-white shadow-inner'
        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
    } ${disabled ? 'opacity-50 cursor-not-allowed bg-gray-100 text-gray-400' : ''}`}
  >
    {icon}
  </button>
);

// FIX: Make children optional to resolve type error where TypeScript fails to recognize implicit `children` prop.
const ToolbarSection = ({ title, children }: { title: string, children?: React.ReactNode }) => (
    <div className="flex flex-col items-center space-y-2 border-r border-gray-300 px-3">
        {children}
        <span className="text-xs text-gray-600 mt-1">{title}</span>
    </div>
);

const COLORS = [
  '#000000', '#808080', '#C00000', '#FF0000', '#FFC000', '#FFFF00', '#92D050', '#00B050',
  '#00B0F0', '#0070C0', '#002060', '#7030A0', '#FFFFFF', '#D3D3D3', '#F4CCCC', '#EA9999',
  '#F9CB9C', '#FFE599', '#B6D7A8', '#A2C4C9', '#9FC5E8', '#B4A7D6', '#D5A6BD', '#E06666'
];

export const Toolbar: React.FC<ToolbarProps> = ({
  tool,
  setTool,
  color,
  setColor,
  brushSize,
  setBrushSize,
  onShare,
  onImageUpload,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onImageUpload(e.target.files[0]);
    }
  };

  return (
    <aside className="bg-gray-100 text-black p-2 flex items-center space-x-2 shadow-md z-10 w-full">
       <ToolbarSection title="History">
        <div className="flex space-x-1">
          <ToolButton
            label="Undo"
            isActive={false}
            onClick={onUndo}
            disabled={!canUndo}
            icon={<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 14 4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 5.5 5.5v0a5.5 5.5 0 0 1-5.5 5.5H11"/></svg>}
          />
          <ToolButton
            label="Redo"
            isActive={false}
            onClick={onRedo}
            disabled={!canRedo}
            icon={<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 14 5-5-5-5"/><path d="M20 9H9.5A5.5 5.5 0 0 0 4 14.5v0A5.5 5.5 0 0 0 9.5 20H13"/></svg>}
          />
        </div>
      </ToolbarSection>
      <ToolbarSection title="Tools">
        <div className="grid grid-cols-2 gap-1">
          <ToolButton
            label="Select"
            isActive={tool === Tool.SELECT}
            onClick={() => setTool(Tool.SELECT)}
            // FIX: Corrected SVG property `strokeLineCap` to `strokeLinecap` and `strokeLineJoin` to `strokeLinejoin`.
            icon={<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3.8 3.8l16.4 16.4M20.2 3.8L3.8 20.2M12 2v2M12 20v2M2 12h2M20 12h2" stroke="none"/><path d="M14.5 14.5L19 19"/></svg>}
          />
          <ToolButton
            label="Pencil"
            isActive={tool === Tool.PENCIL}
            onClick={() => setTool(Tool.PENCIL)}
            // FIX: Corrected SVG property `strokeLineCap` to `strokeLinecap` and `strokeLineJoin` to `strokeLinejoin`.
            icon={<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>}
          />
           <ToolButton
            label="Eraser"
            isActive={tool === Tool.ERASER}
            onClick={() => setTool(Tool.ERASER)}
            // FIX: Corrected SVG property `strokeLineCap` to `strokeLinecap` and `strokeLineJoin` to `strokeLinejoin`.
            icon={<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.49 20.49L3.51 3.51M20.49 3.51L3.51 20.49" stroke="none" /><path d="M2.5 12.5l5-5L12 12l-5 5-4.5-4.5zM12 2.5l5 5L22 12l-5 5-5-5-5-5 5-5z" /></svg>}
          />
          <ToolButton
            label="Text"
            isActive={tool === Tool.TEXT}
            onClick={() => setTool(Tool.TEXT)}
            // FIX: Corrected SVG property `strokeLineCap` to `strokeLinecap` and `strokeLineJoin` to `strokeLinejoin`.
            icon={<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79c-1.12 1.3-2.3 2.6-3.5 3.8-1.2 1.2-2.5 2.4-3.7 3.6-1.2 1.2-2.5 2.3-3.8 3.4-1.1.9-2.2 1.8-3.3 2.5.1-.1 0 0 0 0M5 22v-4.81c0-1.03.42-2.03 1.17-2.79l5.42-5.41c.75-.75 1.76-1.17 2.79-1.17 1.03 0 2.04.42 2.79 1.17l5.42 5.41c.75.75 1.17 1.76 1.17 2.79V22M5 12V7a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v5"></path></svg>}
          />
        </div>
      </ToolbarSection>
      <ToolbarSection title="Shapes">
        <div className="grid grid-cols-2 gap-1">
          <ToolButton
            label="Line"
            isActive={tool === Tool.LINE}
            onClick={() => setTool(Tool.LINE)}
            // FIX: Corrected SVG property `strokeLineCap` to `strokeLinecap` and `strokeLineJoin` to `strokeLinejoin`.
            icon={<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="19" x2="19" y2="5" /></svg>}
          />
          <ToolButton
            label="Circle"
            isActive={tool === Tool.CIRCLE}
            onClick={() => setTool(Tool.CIRCLE)}
            // FIX: Corrected SVG property `strokeLineCap` to `strokeLinecap` and `strokeLineJoin` to `strokeLinejoin`.
            icon={<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /></svg>}
          />
          <ToolButton
            label="Rectangle"
            isActive={tool === Tool.RECTANGLE}
            onClick={() => setTool(Tool.RECTANGLE)}
            // FIX: Corrected SVG property `strokeLineCap` to `strokeLinecap` and `strokeLineJoin` to `strokeLinejoin`.
            icon={<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /></svg>}
          />
        </div>
      </ToolbarSection>

      <ToolbarSection title="Size">
         <input
          id="brush-size"
          type="range"
          min="1"
          max="50"
          value={brushSize}
          onChange={(e) => setBrushSize(parseInt(e.target.value))}
          className="w-24 h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer"
        />
        <span className="text-sm font-mono">{brushSize}px</span>
      </ToolbarSection>
      
      <ToolbarSection title="Colors">
        <div className="flex items-center space-x-3">
            <div className="flex flex-col items-center space-y-1">
                <div className="w-10 h-10 border-2 border-gray-400" style={{ backgroundColor: color }}></div>
                <input
                    id="color-picker"
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="w-8 h-8 p-0 border-none bg-transparent cursor-pointer"
                    title="Edit Colors"
                />
            </div>
            <div className="grid grid-cols-12 gap-1">
                {COLORS.map(c => (
                    <div
                        key={c}
                        onClick={() => setColor(c)}
                        className={`w-5 h-5 rounded-sm cursor-pointer border ${color.toLowerCase() === c.toLowerCase() ? 'border-blue-500 ring-2 ring-blue-500' : 'border-gray-300'}`}
                        style={{ backgroundColor: c }}
                    />
                ))}
            </div>
        </div>
      </ToolbarSection>
      
      <div className="flex-grow"></div>
      
      <div className="flex items-center space-x-2">
        <ToolButton
          label="Upload Image"
          isActive={false}
          onClick={handleImageButtonClick}
          // FIX: Corrected SVG property `strokeLineCap` to `strokeLinecap` and `strokeLineJoin` to `strokeLinejoin`.
          icon={<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>}
        />
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*"
          className="hidden"
        />
        <button
          onClick={onShare}
          className="h-10 px-4 flex items-center justify-center bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
          title="Share"
        >
          Share
        </button>
      </div>
    </aside>
  );
};