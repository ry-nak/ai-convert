import * as React from "react";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Upload, Download, Play, Volume2, AlertCircle, RefreshCw,
  FileText, CheckCircle2, Waves, Mic2, ArrowRight
} from "lucide-react";

const API_BASE = import.meta.env.VITE_API_URL || "https://ai-backend-production-522d.up.railway.app/api";

export default function App() {
  const [file, setFile] = useState<File | null>(null);
  const [voice, setVoice] = useState("Sreymom"); 
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentLine, setCurrentLine] = useState(0);
  const [totalLines, setTotalLines] = useState(0);
  const [jobId, setJobId] = useState<string | null>(null);
  const [completed, setCompleted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const pollTimerRef = useRef<number | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile?.name.toLowerCase().endsWith(".srt")) {
      setFile(selectedFile);
      setError(null);
      setCompleted(false);
    }
  };

  const startPolling = (id: string) => {
    pollTimerRef.current = window.setInterval(async () => {
      try {
        const res = await fetch(`${API_BASE}/v1/tts/status/${id}`);
        const data = await res.json();
        if (data.status === "completed") {
          clearInterval(pollTimerRef.current!);
          setProgress(100);
          setCompleted(true);
          setIsProcessing(false);
        } else if (data.status === "failed") {
          clearInterval(pollTimerRef.current!);
          setError(data.error);
          setIsProcessing(false);
        } else {
          setProgress(data.progress || 0);
          setCurrentLine(data.current_line || 0);
          setTotalLines(data.total_lines || 0);
        }
      } catch (e) { console.error(e); }
    }, 1500);
  };

  const handleConversion = async () => {
    if (!file) return;
    setIsProcessing(true);
    setError(null);
    const formData = new FormData();
    formData.append("file", file); 
    formData.append("voice_option", voice);
    try {
      const res = await fetch(`${API_BASE}/v1/tts/generate-srt`, { method: "POST", body: formData });
      const data = await res.json();
      setJobId(data.job_id);
      startPolling(data.job_id);
    } catch (err: any) {
      setError("Server connection failed");
      setIsProcessing(false);
    }
  };

  const triggerDownload = () => {
    if (!jobId) return;
    window.location.href = `${API_BASE}/v1/tts/download/${jobId}`;
  };

  return (
    <div className="min-h-screen bg-[#020617] text-white p-4 md:p-10 font-sans">
      <div className="max-w-5xl mx-auto space-y-10">
        
        <header className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs rounded-full">
            <Mic2 size={14} /> Parallel Khmer Engine
          </div>
          <h1 className="text-4xl md:text-6xl font-black italic tracking-tighter">SRT STUDIO</h1>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Controls */}
          <div className="space-y-6">
            <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl">
              <h2 className="text-xs font-bold uppercase text-slate-500 mb-4 tracking-widest">1. Config</h2>
              <label className="block border-2 border-dashed border-slate-700 p-6 rounded-xl hover:bg-slate-800 transition text-center cursor-pointer">
                <input type="file" className="hidden" onChange={handleFileChange} accept=".srt" />
                <FileText className="mx-auto mb-2 text-slate-500" />
                <span className="text-sm block truncate">{file ? file.name : "Choose SRT"}</span>
              </label>
              <div className="mt-4 grid grid-cols-2 gap-2">
                {["Sreymom", "Piseth"].map(v => (
                  <button key={v} onClick={() => setVoice(v)} className={`py-2 rounded-lg text-sm font-bold border ${voice === v ? "bg-indigo-600 border-indigo-400" : "bg-slate-800 border-slate-700"}`}>{v}</button>
                ))}
              </div>
            </div>
          </div>

          {/* Main Visualizer */}
          <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-3xl p-8 md:p-16 flex flex-col items-center justify-center relative overflow-hidden shadow-2xl min-h-[400px]">
            <AnimatePresence mode="wait">
              {!isProcessing && !completed && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
                  <Play className="mx-auto mb-6 text-indigo-500" size={60} fill="currentColor" />
                  <button onClick={handleConversion} disabled={!file} className="bg-white text-black px-12 py-4 rounded-2xl font-black hover:scale-105 active:scale-95 transition disabled:opacity-20">GENERATE</button>
                </motion.div>
              )}

              {isProcessing && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full text-center">
                  <Waves className="mx-auto mb-6 text-indigo-500 animate-pulse" size={50} />
                  <p className="text-slate-400 text-sm mb-2">Processing Line {currentLine} of {totalLines || "..."}</p>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden mb-4">
                    <motion.div className="bg-indigo-500 h-full" animate={{ width: `${progress}%` }} />
                  </div>
                  <p className="text-xs font-mono text-indigo-400">{progress}% Complete</p>
                </motion.div>
              )}

              {completed && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-center">
                  <CheckCircle2 className="mx-auto mb-6 text-emerald-500" size={60} />
                  <p className="text-slate-400 text-xs mb-4 font-mono">{file?.name.replace(".srt", ".mp3")}</p>
                  <div className="flex gap-4">
                    <button onClick={triggerDownload} className="bg-emerald-600 px-8 py-4 rounded-xl font-bold flex items-center gap-2"><Download size={20}/> Download</button>
                    <button onClick={() => setCompleted(false)} className="bg-slate-800 px-8 py-4 rounded-xl font-bold">Back</button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {error && (
              <div className="absolute bottom-6 px-6 py-3 bg-red-500/10 border border-red-500/50 text-red-500 text-xs rounded-lg flex items-center gap-2">
                <AlertCircle size={14} /> {error}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}