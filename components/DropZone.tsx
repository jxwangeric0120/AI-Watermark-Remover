import React, { useRef, useState } from 'react';
import { Upload, FileImage, FileVideo } from 'lucide-react';

interface DropZoneProps {
  onFileSelect: (file: File) => void;
  accept: string;
  label: string;
  icon?: React.ReactNode;
}

export const DropZone: React.FC<DropZoneProps> = ({ onFileSelect, accept, label, icon }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleClick = () => {
    inputRef.current?.click();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileSelect(e.target.files[0]);
    }
  };

  return (
    <div
      onClick={handleClick}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`
        relative group cursor-pointer w-full h-64 rounded-2xl border-2 border-dashed transition-all duration-300 ease-out flex flex-col items-center justify-center overflow-hidden
        ${isDragOver 
          ? 'border-primary-500 bg-primary-500/10 scale-[1.02]' 
          : 'border-slate-700 bg-slate-800/50 hover:border-slate-500 hover:bg-slate-800'}
      `}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={handleChange}
      />
      
      <div className={`
        p-4 rounded-full bg-slate-800 mb-4 transition-transform duration-300
        ${isDragOver ? 'scale-110 bg-primary-600' : 'group-hover:scale-110'}
      `}>
        {icon || <Upload className="w-8 h-8 text-slate-300" />}
      </div>
      
      <p className="text-lg font-medium text-slate-200 mb-2">{label}</p>
      <p className="text-sm text-slate-400">or drag and drop here</p>
    </div>
  );
};