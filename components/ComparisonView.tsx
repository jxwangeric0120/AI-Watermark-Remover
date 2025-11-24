import React, { useState } from 'react';
import { Download } from 'lucide-react';
import { Button } from './Button';

interface ComparisonViewProps {
  originalUrl: string;
  processedUrl: string;
  type: 'image' | 'video';
}

export const ComparisonView: React.FC<ComparisonViewProps> = ({ originalUrl, processedUrl, type }) => {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);

  const handleMouseDown = () => setIsDragging(true);
  const handleMouseUp = () => setIsDragging(false);
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    setSliderPosition((x / rect.width) * 100);
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = processedUrl;
    link.download = `clearview-processed.${type === 'video' ? 'mp4' : 'png'}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (type === 'video') {
    return (
        <div className="w-full space-y-4">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Original Reference</span>
                    {/* Assuming original URL for video workflow was an image reference */}
                    <img src={originalUrl} className="w-full rounded-xl border border-slate-700 bg-black" alt="Original" />
                </div>
                <div className="space-y-2">
                    <span className="text-xs font-semibold text-primary-400 uppercase tracking-wider">Generated Clean Video</span>
                    <video src={processedUrl} controls className="w-full rounded-xl border border-primary-500/30 shadow-[0_0_30px_rgba(14,165,233,0.15)] bg-black" />
                </div>
            </div>
            <div className="flex justify-center pt-4">
                <Button onClick={handleDownload} icon={<Download className="w-4 h-4"/>}>
                    Download Video
                </Button>
            </div>
        </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <div 
        className="relative w-full aspect-video rounded-xl overflow-hidden cursor-ew-resize select-none border border-slate-700 shadow-2xl"
        onMouseMove={handleMouseMove}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* Background (Processed) */}
        <div className="absolute inset-0">
          <img src={processedUrl} alt="Processed" className="w-full h-full object-contain bg-slate-900/50" />
        </div>

        {/* Foreground (Original) - Clip Path */}
        <div 
          className="absolute inset-0 border-r-2 border-primary-500 bg-slate-900/50"
          style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
        >
          <img src={originalUrl} alt="Original" className="w-full h-full object-contain" />
        </div>

        {/* Slider Handle */}
        <div 
          className="absolute top-0 bottom-0 w-1 bg-primary-500 cursor-ew-resize shadow-[0_0_10px_rgba(14,165,233,0.8)] z-10"
          style={{ left: `${sliderPosition}%` }}
        >
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center shadow-lg">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" transform="rotate(90 12 12)" />
            </svg>
          </div>
        </div>

        {/* Labels */}
        <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded-lg text-xs font-medium text-white pointer-events-none">
          Original
        </div>
        <div className="absolute top-4 right-4 bg-primary-600/90 backdrop-blur-md px-3 py-1 rounded-lg text-xs font-medium text-white pointer-events-none">
          Cleaned
        </div>
      </div>

      <div className="flex justify-center">
        <Button onClick={handleDownload} icon={<Download className="w-4 h-4"/>}>
          Download Image
        </Button>
      </div>
    </div>
  );
};