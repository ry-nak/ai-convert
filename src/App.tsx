import * as React from "react";
import { useState, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Upload, Download, 
  Play, Volume2, AlertCircle, RefreshCw,
  FileText, CheckCircle2, Waves, Mic2
} from "lucide-react";

const API_BASE = import.meta.env.VITE_API_URL;
const BACKEND_API_URL = `${API_BASE}/v1/tts/generate-srt`;

export default function App() {
  const [file, setFile] = useState<File | null>(null);
  const [voice, setVoice] = useState("Sreymom"); 
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [completed, setCompleted] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [previewingVoice, setPreviewingVoice] = useState<string | null>(null);
  const [downloadFormat, setDownloadFormat] = useState<"wav" | "mp3">("wav");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    
    if (!selectedFile.name.toLowerCase().endsWith(".srt")) {
      setError("Please select a valid .srt file");
      return;
    }
    
    setFile(selectedFile);
    setError(null);
    setCompleted(false);
    setAudioUrl(null);
    setProgress(0);
  };

  const resetForm = () => {
    setFile(null);
    setCompleted(false);
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    setAudioUrl(null);
    setError(null);
    setProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleConversion = async () => {
    if (!file) return;

    setIsProcessing(true);
    setError(null);
    setCompleted(false);
    setProgress(5);

    // Simulate progress while waiting for the heavy backend task
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 92) return prev; 
        return prev + Math.random() * 2;
      });
    }, 500);

    const formData = new FormData();
    formData.append("file", file); 
    formData.append("voice_option", voice);
    formData.append("format", downloadFormat);

    try {
      const res = await fetch(BACKEND_API_URL, { method: "POST", body: formData });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: "Generation failed" }));
        throw new Error(errorData.error || "Server processing error");
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      setAudioUrl(url);
      
      clearInterval(progressInterval);
      setProgress(100);
      setCompleted(true);
    } catch (err: any) {
      clearInterval(progressInterval);
      setError(err.message || "An unexpected error occurred during audio generation.");
    } finally {
      setIsProcessing(false);
    }
  };

  const triggerDownload = () => {
    if (!audioUrl || !file) return;
    const a = document.createElement('a');
    a.href = audioUrl;
    a.download = `${file.name.replace(".srt", "")}_voiceover.${downloadFormat}`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const playPreview = async (voiceId: string) => {
    if (previewingVoice) return;
    setPreviewingVoice(voiceId);
    try {
      const res = await fetch(`/api/v1/tts/preview?voice_option=${voiceId}`);
      if (!res.ok) throw new Error("Preview failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      
      if (audioRef.current) {
        audioRef.current.src = url;
        audioRef.current.play();
      } else {
        const audio = new Audio(url);
        audioRef.current = audio;
        audio.play();
      }
      
      audioRef.current!.onended = () => {
        setPreviewingVoice(null);
        URL.revokeObjectURL(url);
      };
    } catch (err) {
      console.error(err);
      setPreviewingVoice(null);
    }
  };

  return (
    <div className="relative min-h-screen font-sans overflow-hidden bg-[#020617]">
      {/* Dynamic Atmospheric background */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-500/10 blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-blue-600/5 blur-[150px]" />
        <div className="absolute top-[30%] right-[10%] w-[30%] h-[30%] rounded-full bg-emerald-500/5 blur-[100px]" />
      </div>

      <main className="relative z-10 max-w-5xl mx-auto px-6 py-12 lg:py-24 flex flex-col items-center">
        {/* Header */}
        <header className="mb-16 text-center space-y-4">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-2"
          >
            <Mic2 size={12} /> AI-Powered Synced Audio
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl md:text-6xl font-bold text-white tracking-tight"
          >
            SRT Voice <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-blue-500">Studio</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-slate-400 text-lg max-w-xl mx-auto"
          >
            Upload your subtitles and transform them into high-fidelity synced voiceovers in seconds.
          </motion.p>
        </header>

        {/* Main Interface Grid */}
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Sidebar / Config */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="lg:col-span-4 space-y-6"
          >
            {/* Upload Section */}
            <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 shadow-xl">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
                  <FileText size={18} />
                </div>
                <h2 className="text-sm font-semibold text-white uppercase tracking-wider">Subtitles</h2>
              </div>
              
              <label 
                className={`relative group flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-xl cursor-pointer transition-all duration-300
                ${file ? "border-indigo-500/50 bg-indigo-500/5" : "border-slate-700 hover:border-indigo-500/50 hover:bg-slate-800/50 text-slate-500"}`}
              >
                <input 
                  type="file" 
                  accept=".srt" 
                  className="hidden" 
                  onChange={handleFileChange} 
                  disabled={isProcessing}
                  ref={fileInputRef}
                />
                <AnimatePresence mode="wait">
                  {file ? (
                    <motion.div 
                      key="file-selected"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="text-center px-4"
                    >
                      <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto mb-3">
                        <CheckCircle2 size={24} />
                      </div>
                      <p className="text-sm font-medium text-slate-200 truncate max-w-[200px]">{file.name}</p>
                      <p className="text-xs text-slate-500 mt-1">Ready to sync</p>
                    </motion.div>
                  ) : (
                    <motion.div 
                      key="no-file"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex flex-col items-center transition-transform group-hover:scale-105"
                    >
                      <Upload className="mb-4 text-slate-400" size={32} />
                      <p className="text-sm font-medium mb-1">Click or drag SRT file</p>
                      <p className="text-xs text-slate-500">Max size 2MB</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </label>
            </div>

            {/* Voice Selection */}
            <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 shadow-xl">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
                  <Volume2 size={18} />
                </div>
                <h2 className="text-sm font-semibold text-white uppercase tracking-wider">Voice Profile</h2>
              </div>
              <div className="grid grid-cols-1 gap-3">
                {[
                  { id: "Sreymom", name: "Sreymom", desc: "Clear female voice" },
                  { id: "Piseth", name: "Piseth", desc: "Strong male voice" }
                ].map((v) => (
                  <div key={v.id} className="relative group/voice">
                    <button 
                      onClick={() => setVoice(v.id)} 
                      disabled={isProcessing || completed}
                      className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition-all duration-300 ${
                        voice === v.id 
                          ? "bg-indigo-500/10 border-indigo-500 text-indigo-400 shadow-[0_0_20px_rgba(99,102,241,0.1)]" 
                          : "bg-slate-800/30 border-slate-700 text-slate-500 hover:border-slate-600 hover:bg-slate-800/50"
                      }`}
                    >
                      <div>
                        <p className={`text-sm font-semibold ${voice === v.id ? "text-white" : ""}`}>{v.name}</p>
                        <p className="text-[10px] opacity-70 uppercase tracking-tighter">{v.desc}</p>
                      </div>
                      {voice === v.id && (
                        <motion.div layoutId="voice-indicator" className="w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_10px_#6366f1]" />
                      )}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        playPreview(v.id);
                      }}
                      disabled={isProcessing}
                      className={`absolute right-8 top-1/2 -translate-y-1/2 p-2 rounded-lg transition-all duration-200 border ${
                        previewingVoice === v.id 
                          ? "bg-indigo-500 text-white border-indigo-500 animate-pulse" 
                          : "bg-slate-800/80 text-slate-400 border-slate-700 hover:text-white opacity-0 group-hover/voice:opacity-100"
                      }`}
                      title="Preview Voice"
                    >
                      {previewingVoice === v.id ? (
                        <RefreshCw size={14} className="animate-spin" />
                      ) : (
                        <Volume2 size={14} />
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Format Selection */}
            <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 shadow-xl">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                  <Download size={18} />
                </div>
                <h2 className="text-sm font-semibold text-white uppercase tracking-wider">Output Format</h2>
              </div>
              <div className="flex gap-3">
                {["wav", "mp3"].map((f) => (
                  <button 
                    key={f} 
                    onClick={() => setDownloadFormat(f as "wav" | "mp3")} 
                    disabled={isProcessing || completed}
                    className={`flex-1 py-2 rounded-xl border text-sm font-bold transition-all duration-300 ${
                      downloadFormat === f 
                        ? "bg-indigo-500/10 border-indigo-500 text-indigo-400" 
                        : "bg-slate-800/30 border-slate-700 text-slate-500 hover:border-slate-600"
                    }`}
                  >
                    {f.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Central Action Area */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            className="lg:col-span-8 h-full"
          >
            <div className="bg-slate-900/40 backdrop-blur-3xl border border-slate-800 rounded-3xl p-8 md:p-12 h-full flex flex-col justify-center min-h-[400px] shadow-2xl relative overflow-hidden">
              {/* Animated waveform background when processing */}
              {isProcessing && (
                <div className="absolute inset-0 opacity-20 pointer-events-none flex items-center justify-around overflow-hidden">
                  {[...Array(20)].map((_, i) => (
                    <motion.div
                      key={i}
                      animate={{ height: ["10%", "60%", "10%"] }}
                      transition={{ 
                        repeat: Infinity, 
                        duration: 1 + Math.random(),
                        delay: i * 0.1 
                      }}
                      className="w-1 bg-indigo-500 rounded-full"
                    />
                  ))}
                </div>
              )}

              <AnimatePresence mode="wait">
                {!isProcessing && !completed && (
                  <motion.div 
                    key="start-state"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center gap-8"
                  >
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center shadow-[0_0_40px_rgba(79,70,229,0.3)] ">
                      <Play size={32} className="text-white ml-1 fill-white" />
                    </div>
                    <div className="text-center">
                      <h3 className="text-2xl font-bold text-white mb-2">Ready to Process</h3>
                      <p className="text-slate-400 max-w-sm">
                        Ensure your subtitle timeline is correct before starting the conversion.
                      </p>
                    </div>
                    <button 
                      onClick={handleConversion} 
                      disabled={!file} 
                      className={`group relative px-8 py-4 rounded-2xl font-bold text-lg transition-all duration-300 flex items-center gap-3
                        ${file 
                          ? "bg-white text-slate-950 hover:scale-105 shadow-[0_20px_50px_rgba(255,255,255,0.1)]" 
                          : "bg-slate-800 text-slate-600 cursor-not-allowed opacity-50"
                        }`}
                    >
                      Generate Sync Audio
                      <Waves className="group-hover:animate-bounce" size={20} />
                    </button>
                  </motion.div>
                )}

                {isProcessing && (
                  <motion.div 
                    key="processing-state"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="w-full flex flex-col items-center gap-8"
                  >
                    <div className="text-center">
                      <h3 className="text-2xl font-bold text-white mb-2">Synthesizing...</h3>
                      <p className="text-slate-400 text-sm">Gemini is mapping your timeline to speech</p>
                    </div>

                    <div className="w-full max-w-md bg-slate-800/50 rounded-full h-4 overflow-hidden border border-slate-700/50 relative">
                      <motion.div 
                        className="absolute inset-y-0 left-0 bg-gradient-to-r from-indigo-500 via-blue-500 to-emerald-500 h-full" 
                        initial={{ width: "0%" }}
                        animate={{ width: `${progress}%` }}
                        transition={{ type: "spring", stiffness: 50, damping: 20 }}
                      />
                    </div>
                    
                    <div className="flex items-center gap-2 text-indigo-400 font-mono text-sm">
                      <span className="animate-pulse flex gap-1">
                        <span style={{ animationDelay: '0s' }}>.</span>
                        <span style={{ animationDelay: '0.2s' }}>.</span>
                        <span style={{ animationDelay: '0.4s' }}>.</span>
                      </span>
                      {Math.floor(progress)}% Complete
                    </div>
                  </motion.div>
                )}

                {completed && (
                  <motion.div 
                    key="complete-state"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center gap-8"
                  >
                    <div className="w-24 h-24 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                      <CheckCircle2 size={48} />
                    </div>
                    <div className="text-center">
                      <h3 className="text-2xl font-bold text-white mb-2">Generation Successful</h3>
                      <p className="text-slate-400">Your audio is ready for download in high-fidelity WAV format.</p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
                      <button 
                        onClick={triggerDownload} 
                        className="px-8 py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 font-bold text-white shadow-[0_20px_40px_rgba(16,185,129,0.2)] hover:scale-105 transition-all flex items-center justify-center gap-3"
                      >
                        <Download size={20} /> Download {downloadFormat.toUpperCase()} Master
                      </button>
                      <button 
                        onClick={resetForm} 
                        className="px-8 py-4 rounded-2xl bg-slate-800 border border-slate-700 text-slate-300 font-semibold hover:bg-slate-700 transition-all flex items-center justify-center gap-2"
                      >
                        <RefreshCw size={18} /> New Conversion
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {error && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute bottom-8 left-8 right-8 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center gap-3 text-sm"
                >
                  <AlertCircle size={18} /> 
                  <div className="flex-1">
                    <p className="font-semibold">Pipeline Error</p>
                    <p className="opacity-80">{error}</p>
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
        </div>

        {/* Footer info */}
        <footer className="mt-20 py-8 border-t border-slate-800 w-full flex flex-col md:flex-row justify-between items-center gap-4 text-slate-500 text-sm font-medium">
          <p>© 2026 SRT Voice Studio. All rights reserved.</p>
          <div className="flex gap-6 uppercase tracking-widest text-[10px]">
            <span className="hover:text-slate-300 cursor-pointer transition-colors">Privacy</span>
            <span className="hover:text-slate-300 cursor-pointer transition-colors">Terms</span>
            <span className="hover:text-slate-300 cursor-pointer transition-colors">Docs</span>
          </div>
        </footer>
      </main>
    </div>
  );
}
