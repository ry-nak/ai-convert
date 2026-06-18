import * as React from "react";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Upload, Download, Play, Volume2, AlertCircle, RefreshCw,
  FileText, CheckCircle2, Waves, Mic2, ArrowRight
} from "lucide-react";

// Fallback to localhost if env variable is missing
const API_BASE = import.meta.env.VITE_API_URL || 'https://ai-backend-production-522d.up.railway.app/api';

export default function App() {
  // State for File & Config
  const [file, setFile] = useState<File | null>(null);
  const [voice, setVoice] = useState("Sreymom"); 
  
  // State for Processing Logic
  const [isProcessing, setIsProcessing] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);
  const [completed, setCompleted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // State for Progress Tracking
  const [progress, setProgress] = useState(0);
  const [currentLine, setCurrentLine] = useState(0);
  const [totalLines, setTotalLines] = useState(0);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pollTimerRef = useRef<number | null>(null);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => { if (pollTimerRef.current) clearInterval(pollTimerRef.current); };
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile?.name.toLowerCase().endsWith(".srt")) {
      setFile(selectedFile);
      setError(null);
      setCompleted(false);
      setJobId(null);
      setProgress(0);
    } else {
      setError("Please select a valid .srt file");
    }
  };

  const handleConversion = async () => {
    if (!file) return;
    
    setIsProcessing(true);
    setError(null);
    setProgress(0);
    setCompleted(false);

    const formData = new FormData();
    formData.append("file", file); 
    formData.append("voice_option", voice);

    try {
      // 1. Start the Job
      const res = await fetch(`${API_BASE}/v1/tts/generate-srt`, { 
        method: "POST", 
        body: formData 
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Failed to start processing");
      
      setJobId(data.job_id);
      startPolling(data.job_id);
    } catch (err: any) {
      setError(err.message);
      setIsProcessing(false);
    }
  };

  const startPolling = (id: string) => {
    // Clear any existing timer
    if (pollTimerRef.current) clearInterval(pollTimerRef.current);

    pollTimerRef.current = window.setInterval(async () => {
      try {
        const res = await fetch(`${API_BASE}/v1/tts/status/${id}`);
        if (!res.ok) return;
        
        const data = await res.json();

        if (data.status === "completed") {
          if (pollTimerRef.current) clearInterval(pollTimerRef.current);
          setProgress(100);
          setCompleted(true);
          setIsProcessing(false);
        } else if (data.status === "failed") {
          if (pollTimerRef.current) clearInterval(pollTimerRef.current);
          setError(data.error || "Server processing failed");
          setIsProcessing(false);
        } else {
          // Update progress based on backend line counts
          setProgress(data.progress || 0);
          setCurrentLine(data.current_line || 0);
          setTotalLines(data.total_lines || 0);
        }
      } catch (e) {
        console.error("Polling error", e);
      }
    }, 1500); // Poll every 1.5 seconds
  };

  const triggerDownload = () => {
    if (!jobId) return;
    // Direct link to the backend download endpoint
    window.location.href = `${API_BASE}/v1/tts/download/${jobId}`;
  };

  const resetForm = () => {
    setFile(null);
    setCompleted(false);
    setJobId(null);
    setProgress(0);
    setCurrentLine(0);
    setTotalLines(0);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="relative min-h-screen font-sans overflow-x-hidden bg-[#020617] text-white selection:bg-indigo-500/30">
      {/* Background blobs */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-5%] left-[-10%] w-[70%] md:w-[40%] h-[40%] rounded-full bg-indigo-500/10 blur-[80px] md:blur-[120px]" />
        <div className="absolute bottom-[-5%] right-[-10%] w-[70%] md:w-[50%] h-[50%] rounded-full bg-blue-600/5 blur-[80px] md:blur-[150px]" />
      </div>

      <main className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-8 md:py-16 flex flex-col items-center">
        {/* Header Section */}
        <header className="mb-10 md:mb-16 text-center space-y-4 w-full">
          <motion.div 
            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] sm:text-xs font-semibold uppercase tracking-wider mb-2"
          >
            <Mic2 size={14} className="hidden sm:block" /> Parallel AI Audio Engine
          </motion.div>
          <h1 className="text-3xl sm:text-4xl md:text-6xl font-extrabold tracking-tight leading-tight">
            SRT Voice <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-blue-500 to-indigo-400">Studio</span>
          </h1>
          <p className="text-slate-400 text-sm md:text-base max-w-lg mx-auto px-4">
            Convert large subtitle files into high-quality Khmer voiceovers in seconds.
          </p>
        </header>

        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8 items-start">
          
          {/* Sidebar */}
          <div className="lg:col-span-4 space-y-4 md:space-y-6 order-2 lg:order-1">
            {/* File Upload Card */}
            <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-800 rounded-2xl p-5 md:p-6 shadow-xl">
               <div className="flex items-center gap-2 mb-4">
                 <FileText className="text-indigo-400" size={18} />
                 <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400">Subtitle File</h2>
               </div>
               <label className={`relative flex flex-col items-center justify-center w-full h-32 md:h-40 border-2 border-dashed rounded-xl cursor-pointer transition-all duration-300 ${file ? "border-indigo-500/50 bg-indigo-500/5" : "border-slate-700 hover:bg-slate-800/50"}`}>
                <input type="file" accept=".srt" className="hidden" onChange={handleFileChange} disabled={isProcessing} ref={fileInputRef} />
                <AnimatePresence mode="wait">
                  {file ? (
                    <motion.div key="selected" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center px-4">
                      <CheckCircle2 className="mx-auto mb-2 text-emerald-400" size={28} />
                      <p className="text-xs font-medium truncate max-w-[180px]">{file.name}</p>
                      <p className="text-[10px] text-slate-500 mt-1">Ready to process</p>
                    </motion.div>
                  ) : (
                    <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center text-slate-500">
                      <Upload className="mx-auto mb-2" size={28} />
                      <p className="text-xs">Click to browse .SRT</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </label>
            </div>

            {/* Voice Selection Card */}
            <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-800 rounded-2xl p-5 md:p-6">
              <div className="flex items-center gap-2 mb-4">
                 <Volume2 className="text-blue-400" size={18} />
                 <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400">Voice Profile</h2>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-1 gap-3">
                {["Sreymom", "Piseth"].map(v => (
                  <button 
                    key={v}
                    onClick={() => setVoice(v)}
                    disabled={isProcessing}
                    className={`flex items-center justify-between px-4 py-3 rounded-xl border transition-all duration-300 ${voice === v ? "border-indigo-500 bg-indigo-500/10 text-white" : "border-slate-700 bg-slate-800/40 text-slate-500 hover:border-slate-600"}`}
                  >
                    <span className="text-sm font-semibold">{v}</span>
                    {voice === v && <div className="w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_8px_#6366f1]" />}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Main Processing Area */}
          <div className="lg:col-span-8 order-1 lg:order-2">
            <div className="bg-slate-900/40 backdrop-blur-3xl border border-slate-800 rounded-3xl p-6 md:p-12 min-h-[400px] md:min-h-[500px] flex flex-col items-center justify-center relative overflow-hidden shadow-2xl">
              
              <AnimatePresence mode="wait">
                {/* IDLE STATE */}
                {!isProcessing && !completed && (
                  <motion.div 
                    key="idle" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                    className="text-center w-full max-w-sm"
                  >
                    <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-tr from-indigo-600 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-6 md:mb-8 shadow-xl shadow-indigo-500/20">
                      <Play fill="white" size={28} className="ml-1" />
                    </div>
                    <h3 className="text-xl md:text-2xl font-bold mb-3 md:mb-4">Sync Subtitles</h3>
                    <p className="text-slate-400 text-sm mb-8 md:mb-10">Select your preferred voice and upload an SRT file to start the parallel synthesis engine.</p>
                    <button 
                      onClick={handleConversion} 
                      disabled={!file}
                      className="group w-full sm:w-auto px-10 py-4 bg-white text-black font-bold rounded-2xl hover:bg-indigo-50 active:scale-95 transition-all disabled:opacity-30 disabled:hover:scale-100 shadow-lg shadow-white/5 flex items-center justify-center gap-2"
                    >
                      Process Now <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                  </motion.div>
                )}

                {/* PROCESSING STATE */}
                {isProcessing && (
                  <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full max-w-md text-center px-4">
                    <Waves className="mx-auto mb-6 text-indigo-500 animate-pulse" size={48} />
                    
                    <h3 className="text-xl font-bold mb-2">Synthesizing Audio...</h3>
                    
                    {/* Line Counter Display */}
                    <p className="text-slate-400 text-sm mb-6">
                      Processing line <span className="text-indigo-400 font-mono font-bold">{currentLine}</span> of <span className="font-mono">{totalLines || '...'}</span>
                    </p>

                    <div className="w-full bg-slate-800 rounded-full h-3 mb-4 overflow-hidden border border-slate-700">
                      <motion.div 
                        className="bg-gradient-to-r from-indigo-500 to-blue-500 h-full" 
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }} 
                        transition={{ duration: 0.5 }}
                      />
                    </div>
                    
                    <div className="flex justify-between items-center text-[10px] font-mono text-slate-500 uppercase tracking-widest">
                      <div className="flex items-center gap-2">
                        <RefreshCw size={10} className="animate-spin" />
                        <span>Generating Chunks</span>
                      </div>
                      <span className="text-indigo-400 font-bold">{typeof progress === 'number' ? progress.toFixed(1) : progress}%</span>
                    </div>
                  </motion.div>
                )}

                {/* COMPLETED STATE */}
                {completed && (
                  <motion.div key="done" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center w-full max-w-md">
                    <div className="w-16 h-16 md:w-20 md:h-20 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                      <CheckCircle2 size={40} className="text-emerald-500" />
                    </div>
                    <h3 className="text-2xl font-bold mb-2">Synthesis Complete</h3>
                    <p className="text-slate-400 text-sm mb-8 px-6">All chunks merged and processed. Your audio is ready for download.</p>
                    <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center px-4">
                      <button 
                        onClick={triggerDownload} 
                        className="flex-1 px-8 py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-900/20"
                      >
                        <Download size={20} /> Download MP3
                      </button>
                      <button 
                        onClick={resetForm} 
                        className="px-8 py-4 bg-slate-800 border border-slate-700 text-white font-bold rounded-2xl hover:bg-slate-700 transition-all"
                      >
                        New File
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* ERROR ALERT */}
              {error && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  className="absolute bottom-4 left-4 right-4 md:bottom-8 md:left-8 md:right-8 p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl flex items-center gap-3 text-xs md:text-sm"
                >
                  <AlertCircle size={18} className="shrink-0" /> 
                  <span className="flex-1 truncate font-medium">{error}</span>
                  <button onClick={() => setError(null)} className="hover:text-white font-bold px-2">×</button>
                </motion.div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-12 md:mt-20 py-6 border-t border-slate-800/50 w-full text-center">
          <p className="text-slate-600 text-[10px] md:text-xs uppercase tracking-[0.2em]">
            Optimized for large files • Khmer Voice Engine • Parallel Synthesis
          </p>
        </footer>
      </main>
    </div>
  );
}