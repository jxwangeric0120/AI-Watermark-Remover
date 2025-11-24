import React, { useState, useEffect } from 'react';
import { Eraser, Video, Image as ImageIcon, Sparkles, AlertCircle, Wand2 } from 'lucide-react';
import { AppMode, ProcessingStatus, ProcessedResult } from './types';
import { DropZone } from './components/DropZone';
import { Button } from './components/Button';
import { ComparisonView } from './components/ComparisonView';
import { removeImageWatermark, generateCleanVideo } from './services/geminiService';

const App: React.FC = () => {
  const [mode, setMode] = useState<AppMode>(AppMode.IMAGE);
  const [status, setStatus] = useState<ProcessingStatus>(ProcessingStatus.IDLE);
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [result, setResult] = useState<ProcessedResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Video specific prompt state
  const [videoPrompt, setVideoPrompt] = useState<string>("");

  useEffect(() => {
    // Reset state when switching modes
    setStatus(ProcessingStatus.IDLE);
    setOriginalFile(null);
    setPreviewUrl(null);
    setResult(null);
    setError(null);
    setVideoPrompt("");
  }, [mode]);

  const handleFileSelect = (file: File) => {
    setOriginalFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setStatus(ProcessingStatus.IDLE); // Ready to process
    setError(null);
  };

  const processImage = async () => {
    if (!originalFile) return;
    setStatus(ProcessingStatus.PROCESSING);
    setError(null);

    try {
      const processedImageBase64 = await removeImageWatermark(originalFile);
      setResult({
        originalUrl: previewUrl!,
        processedUrl: processedImageBase64,
        type: 'image'
      });
      setStatus(ProcessingStatus.COMPLETED);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to process image");
      setStatus(ProcessingStatus.ERROR);
    }
  };

  const processVideo = async () => {
    if (!originalFile) return;
    if (!videoPrompt.trim()) {
        setError("Please provide a prompt to describe the video.");
        return;
    }

    setStatus(ProcessingStatus.PROCESSING);
    setError(null);

    try {
      // For video, we use the uploaded image as the "first frame" or reference
      // and generate a new video using Veo.
      const videoUrl = await generateCleanVideo(originalFile, videoPrompt);
      setResult({
        originalUrl: previewUrl!,
        processedUrl: videoUrl,
        type: 'video'
      });
      setStatus(ProcessingStatus.COMPLETED);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate video");
      setStatus(ProcessingStatus.ERROR);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-950 via-dark-900 to-slate-900 text-slate-200">
      
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl border-b border-white/5 bg-dark-950/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-gradient-to-tr from-primary-600 to-indigo-600 rounded-lg shadow-lg shadow-primary-500/20">
                <Eraser className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
                ClearView AI
              </span>
            </div>
            
            <nav className="flex items-center gap-1 bg-slate-800/50 p-1 rounded-xl border border-white/5">
              <button
                onClick={() => setMode(AppMode.IMAGE)}
                className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  mode === AppMode.IMAGE 
                    ? 'bg-slate-700 text-white shadow-sm' 
                    : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                }`}
              >
                <ImageIcon className="w-4 h-4 mr-2" />
                Image
              </button>
              <button
                onClick={() => setMode(AppMode.VIDEO)}
                className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  mode === AppMode.VIDEO 
                    ? 'bg-slate-700 text-white shadow-sm' 
                    : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                }`}
              >
                <Video className="w-4 h-4 mr-2" />
                Video
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        
        {/* Hero Text */}
        <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight">
              {mode === AppMode.IMAGE ? 'Remove Watermarks Instantly' : 'Re-imagine Video Cleanly'}
            </h1>
            <p className="text-slate-400 max-w-2xl mx-auto text-lg">
              {mode === AppMode.IMAGE 
                ? 'Upload an image and let our AI magically erase watermarks, text, and unwanted objects while preserving the background.'
                : 'Upload a reference frame (image) and use Veo to generate a high-quality, watermark-free video based on your prompt.'}
            </p>
        </div>

        {/* Upload & Processing Section */}
        {status === ProcessingStatus.COMPLETED && result ? (
          <div className="space-y-8 animate-fade-in">
             <div className="bg-slate-800/30 border border-white/5 rounded-3xl p-6 md:p-8 backdrop-blur-sm">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-semibold text-white">Result</h2>
                    <Button 
                      variant="secondary" 
                      onClick={() => {
                        setStatus(ProcessingStatus.IDLE);
                        setResult(null);
                        setOriginalFile(null);
                        setPreviewUrl(null);
                      }}
                    >
                      Process New File
                    </Button>
                </div>
                <ComparisonView 
                    originalUrl={result.originalUrl} 
                    processedUrl={result.processedUrl || ''} 
                    type={result.type} 
                />
             </div>
          </div>
        ) : (
          <div className="max-w-2xl mx-auto bg-slate-800/30 border border-white/5 rounded-3xl p-6 md:p-8 backdrop-blur-sm shadow-xl">
            
            {/* Step 1: Upload */}
            {!previewUrl ? (
              <DropZone 
                onFileSelect={handleFileSelect} 
                accept={mode === AppMode.IMAGE ? "image/*" : "image/*"} // Note: Video mode uses Image reference for Veo
                label={mode === AppMode.IMAGE ? "Upload Image to Clean" : "Upload Reference Frame for Video"}
                icon={mode === AppMode.IMAGE ? <ImageIcon className="w-8 h-8 text-slate-300"/> : <Video className="w-8 h-8 text-slate-300"/>}
              />
            ) : (
              <div className="space-y-6">
                <div className="relative rounded-2xl overflow-hidden border border-slate-700 bg-black/50 aspect-video group">
                  <img 
                    src={previewUrl} 
                    alt="Preview" 
                    className="w-full h-full object-contain"
                  />
                  <button 
                    onClick={() => {
                        setOriginalFile(null);
                        setPreviewUrl(null);
                        setStatus(ProcessingStatus.IDLE);
                    }}
                    className="absolute top-4 right-4 p-2 bg-black/60 hover:bg-red-600/90 text-white rounded-lg backdrop-blur-md transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>

                {/* Video specific inputs */}
                {mode === AppMode.VIDEO && (
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-300">Describe the video scene</label>
                        <textarea
                            value={videoPrompt}
                            onChange={(e) => setVideoPrompt(e.target.value)}
                            placeholder="e.g. A cinematic drone shot of a mountain range at sunset..."
                            className="w-full bg-slate-900/50 border border-slate-700 rounded-xl p-3 text-slate-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none resize-none h-24"
                        />
                         <div className="flex items-start gap-2 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg text-xs text-blue-200">
                             <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                             <p>
                                 Note: Direct watermark removal from existing video files is experimental. 
                                 This tool uses the <strong>Veo</strong> model to generate a fresh, high-quality video based on your reference image and prompt.
                                 You will need to select a paid billing project API Key.
                             </p>
                         </div>
                    </div>
                )}

                {/* Processing Controls */}
                <div className="flex flex-col items-center gap-4">
                  {status === ProcessingStatus.ERROR && (
                    <div className="w-full p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-200">
                      <AlertCircle className="w-5 h-5 shrink-0" />
                      <span className="text-sm">{error}</span>
                    </div>
                  )}
                  
                  {status === ProcessingStatus.PROCESSING ? (
                    <div className="w-full py-8 flex flex-col items-center justify-center text-slate-400 space-y-4">
                        <div className="relative w-16 h-16">
                            <div className="absolute inset-0 border-4 border-slate-700 rounded-full"></div>
                            <div className="absolute inset-0 border-4 border-primary-500 rounded-full border-t-transparent animate-spin"></div>
                            <Sparkles className="absolute inset-0 m-auto w-6 h-6 text-primary-400 animate-pulse" />
                        </div>
                        <p className="animate-pulse">
                            {mode === AppMode.IMAGE ? 'AI is removing artifacts...' : 'Veo is dreaming up your video...'}
                        </p>
                        <p className="text-xs text-slate-500">This might take a few moments</p>
                    </div>
                  ) : (
                    <Button 
                        onClick={mode === AppMode.IMAGE ? processImage : processVideo} 
                        className="w-full md:w-auto min-w-[200px]"
                        icon={<Wand2 className="w-5 h-5" />}
                    >
                      {mode === AppMode.IMAGE ? 'Remove Watermark' : 'Generate Clean Video'}
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default App;