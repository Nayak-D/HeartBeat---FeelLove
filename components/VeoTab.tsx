import React, { useState, useRef } from 'react';
import { GoogleGenAI } from "@google/genai";
import { Upload, Film, Play, RefreshCw, CheckCircle2, AlertCircle, Info, Clapperboard } from 'lucide-react';

const VeoTab: React.FC = () => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16'>('9:16');
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
        setError(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const generateVideo = async () => {
    if (!selectedImage) return;
    setIsGenerating(true);
    setGeneratedVideoUrl(null);
    setError(null);

    const messages = [
      "Analyzing your image structure...",
      "Interpolating cinematic frames...",
      "Infusing motion dynamics...",
      "Perfecting the visual flow...",
      "Almost ready, adding final touches...",
      "Still processing, great things take time!",
      "Polishing pixels for maximum impact..."
    ];

    let msgIndex = 0;
    setLoadingMessage(messages[0]);
    const messageInterval = setInterval(() => {
      msgIndex = (msgIndex + 1) % messages.length;
      setLoadingMessage(messages[msgIndex]);
    }, 8000);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const base64Data = selectedImage!.split(',')[1];
      
      let operation = await ai.models.generateVideos({
        model: 'veo-3.1-fast-generate-preview',
        prompt: prompt || 'Animate this scene with natural movement and depth',
        image: {
          imageBytes: base64Data,
          mimeType: 'image/png',
        },
        config: {
          numberOfVideos: 1,
          resolution: '720p',
          aspectRatio: aspectRatio
        }
      });

      while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 10000));
        operation = await ai.operations.getVideosOperation({ operation: operation });
      }

      const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
      if (downloadLink) {
        const response = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        setGeneratedVideoUrl(url);
      } else {
        throw new Error("No video returned from AI");
      }
    } catch (err: any) {
      console.error(err);
      setError("Generation failed. Please check your connection or try again.");
    } finally {
      setIsGenerating(false);
      clearInterval(messageInterval);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-black italic tracking-tighter">STUDIO</h2>
          <p className="text-[10px] font-black text-white/40 uppercase tracking-[3px]">Animate with Veo AI</p>
        </div>
        <div className="p-2 bg-white/5 rounded-xl border border-white/5">
          <Clapperboard size={20} className="text-indigo-400" />
        </div>
      </div>

      {!generatedVideoUrl && !isGenerating && (
        <div className="space-y-6">
          {/* Image Selection Area */}
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="aspect-square bg-[#111] border-2 border-dashed border-white/10 rounded-[3rem] flex flex-col items-center justify-center relative overflow-hidden group cursor-pointer active:scale-[0.98] transition-all"
          >
            {selectedImage ? (
              <>
                <img src={selectedImage} className="w-full h-full object-cover brightness-[0.7] group-hover:scale-110 transition-transform duration-500" alt="Source" />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <RefreshCw className="text-white" />
                </div>
              </>
            ) : (
              <>
                <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Upload className="text-white/40" />
                </div>
                <p className="text-xs font-black uppercase tracking-[2px] text-white/40">Upload Memory</p>
              </>
            )}
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
          </div>

          {/* Config Area */}
          <div className="bg-[#111] rounded-[2.5rem] p-6 border border-white/5 space-y-6">
            <div className="space-y-3">
              <span className="text-[10px] font-black uppercase tracking-[3px] text-white/30 block ml-1">Aspect Ratio</span>
              <div className="flex space-x-2">
                {(['9:16', '16:9'] as const).map(ratio => (
                  <button
                    key={ratio}
                    onClick={() => setAspectRatio(ratio)}
                    className={`flex-1 py-3 rounded-2xl font-black text-xs uppercase transition-all ${aspectRatio === ratio ? 'bg-indigo-500 text-white shadow-lg' : 'bg-white/5 text-white/40 border border-white/5'}`}
                  >
                    {ratio === '9:16' ? 'Portrait' : 'Landscape'}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <span className="text-[10px] font-black uppercase tracking-[3px] text-white/30 block ml-1">Prompt (Optional)</span>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe the motion... (e.g. Cinematic slow zoom, gentle wind blowing hair)"
                className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500/50 resize-none h-24 transition-all"
              />
            </div>
          </div>

          <button
            disabled={!selectedImage || isGenerating}
            onClick={generateVideo}
            className={`w-full py-5 rounded-[2rem] font-black uppercase tracking-widest text-sm flex items-center justify-center space-x-3 transition-all active:scale-95 shadow-2xl ${selectedImage ? 'bg-white text-black' : 'bg-white/5 text-white/20 cursor-not-allowed'}`}
          >
            <Film size={20} />
            <span>Generate Video</span>
          </button>
          
          <div className="bg-indigo-500/5 border border-indigo-500/10 p-4 rounded-2xl flex items-start space-x-3">
            <Info size={16} className="text-indigo-400 shrink-0 mt-0.5" />
            <p className="text-[10px] text-indigo-300/60 font-medium leading-relaxed uppercase tracking-wider">
              Veo AI generates high-quality video frames. This process may take 2-3 minutes.
            </p>
          </div>
        </div>
      )}

      {isGenerating && (
        <div className="flex flex-col items-center justify-center space-y-10 py-20 animate-in fade-in zoom-in duration-500">
          <div className="relative">
            <div className="w-32 h-32 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin shadow-2xl shadow-indigo-500/20" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Film size={40} className="text-indigo-500 animate-pulse" />
            </div>
          </div>
          <div className="text-center space-y-3">
            <h3 className="text-xl font-black uppercase italic tracking-widest">Crafting Magic</h3>
            <p className="text-xs text-white/40 font-black uppercase tracking-[3px] animate-pulse">{loadingMessage}</p>
          </div>
          <div className="w-full max-w-[200px] h-1.5 bg-white/5 rounded-full overflow-hidden">
            <div className="h-full bg-indigo-500 animate-[loading-progress_30s_linear_infinite]" />
          </div>
        </div>
      )}

      {generatedVideoUrl && !isGenerating && (
        <div className="space-y-8 animate-in zoom-in fade-in duration-700">
          <div className="relative bg-[#111] border border-white/5 rounded-[3rem] overflow-hidden shadow-2xl group">
             <video 
               src={generatedVideoUrl} 
               className="w-full aspect-[9/16] object-cover" 
               controls 
               autoPlay 
               loop 
             />
             <div className="absolute top-4 right-4 z-20">
               <div className="bg-indigo-500 px-3 py-1 rounded-full flex items-center space-x-2 shadow-xl">
                  <CheckCircle2 size={14} className="text-white" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Masterpiece Ready</span>
               </div>
             </div>
          </div>

          <div className="flex space-x-4">
             <button 
               onClick={() => setGeneratedVideoUrl(null)}
               className="flex-1 py-5 bg-white text-black rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center space-x-3 active:scale-95 transition-all shadow-xl"
             >
                <RefreshCw size={18} />
                <span>Create New</span>
             </button>
             <a 
               href={generatedVideoUrl} 
               download="VeoGen.mp4"
               className="flex-1 py-5 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center space-x-3 active:scale-95 transition-all shadow-xl"
             >
                <Play size={18} fill="currentColor" />
                <span>Save Video</span>
             </a>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 p-6 rounded-[2rem] flex flex-col items-center text-center space-y-4 animate-shake">
          <AlertCircle size={32} className="text-red-500" />
          <div>
            <h4 className="font-black text-sm uppercase tracking-widest text-red-100">Generation Error</h4>
            <p className="text-xs text-red-200/50 mt-1">{error}</p>
          </div>
          <button 
            onClick={() => setError(null)}
            className="px-8 py-3 bg-red-500 text-white rounded-xl font-black uppercase tracking-widest text-[10px]"
          >
            Try Again
          </button>
        </div>
      )}

      <style>{`
        @keyframes loading-progress {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        .animate-shake {
          animation: shake 0.4s ease-in-out 0s 2;
        }
      `}</style>
    </div>
  );
};

export default VeoTab;