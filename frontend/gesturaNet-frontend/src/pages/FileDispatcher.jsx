import React, { useState, useEffect } from 'react';
import useFilePeer from '../hooks/useFilePeer';

const FileDispatcher = ({ state }) => {
  const { peers, stats, selectedFile, setSelectedFile, handleSend } = useFilePeer();
  const [dispatchProgress, setDispatchProgress] = useState(0);

  // Pulse animation for active streams
  const isStreaming = stats.status !== 'idle' && stats.status !== 'completed';

  // Gesture handling for 2-second Broadcast hold
  useEffect(() => {
    // Only engage if file selected, peers available, and not already streaming
    if (!state || !state.gesture || !selectedFile || peers.length === 0 || isStreaming) {
      setDispatchProgress(0);
      return;
    }

    let interval;
    if (state.gesture === 'closed') {
      interval = setInterval(() => {
        setDispatchProgress(prev => {
          if (prev >= 100) {
            // Reached 2s limit, Dispatch to all peers
            peers.forEach(peer => handleSend(peer));
            return 0;
          }
          return prev + 5; // 5% per 100ms = 2000ms total
        });
      }, 100);
    } else {
      setDispatchProgress(0);
    }

    return () => clearInterval(interval);
  }, [state?.gesture, selectedFile, peers, isStreaming, handleSend]);

  return (
    <div className="space-y-6 text-white font-sans max-w-4xl mx-auto p-4">
      {/* GLOBAL DISPATCH PROGRESS */}
      {dispatchProgress > 0 && (
        <div className="bg-cyan-900/40 border border-cyan-500/50 rounded-xl relative overflow-hidden h-10 shadow-[0_0_20px_-5px_cyan]">
          <div className="absolute top-0 left-0 h-full bg-cyan-500/50 transition-all duration-100 ease-linear" style={{ width: `${dispatchProgress}%` }} />
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <p className="text-[10px] font-mono font-bold tracking-widest text-cyan-50">
               GESTURE DETECTED: BROADCASTING {dispatchProgress}%
            </p>
          </div>
        </div>
      )}

      {/* 1. DISPATCHER HEADER */}
      <div className="flex justify-between items-center border-b border-white/10 pb-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tighter text-cyan-400">FILE VAULT</h2>
          <p className="text-xs text-slate-400 uppercase tracking-widest">P2P DATA DISPATCHER v2.4</p>
        </div>
        <div className="flex items-center gap-3">
          <div className={`w-2 h-2 rounded-full ${isStreaming ? 'bg-cyan-400 animate-pulse' : 'bg-slate-700'}`} />
          <span className="text-[10px] text-slate-500 font-mono italic">STREAMING STATUS: {stats.status.toUpperCase()}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 2. FILE SELECTION (THE SOURCE) */}
        <div className="bg-slate-900/40 border border-white/10 rounded-2xl p-6 backdrop-blur-xl group hover:border-cyan-500/30 transition-all">
          <label className="block mb-2 text-[10px] font-bold text-cyan-600 tracking-tighter">DATA SOURCE</label>
          <div className="relative group overflow-hidden bg-black/40 rounded-xl border border-dashed border-slate-700 hover:border-cyan-500/50 p-8 flex flex-col items-center justify-center transition-all cursor-pointer">
            <input 
              type="file" 
              onChange={(e) => setSelectedFile(e.target.files[0])}
              className="absolute inset-0 opacity-0 cursor-pointer z-10"
            />
            <div className="text-4xl mb-3 text-slate-600 group-hover:text-cyan-400 transition-colors">📦</div>
            {selectedFile ? (
              <div className="text-center animate-in fade-in zoom-in duration-300">
                <p className="text-sm font-medium text-slate-200 truncate max-w-[200px]">{selectedFile.name}</p>
                <p className="text-[10px] text-cyan-500 mt-1 font-mono tracking-tighter">
                  {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • READY
                </p>
              </div>
            ) : (
              <p className="text-xs text-slate-500">Inject data packet here</p>
            )}
          </div>
        </div>

        {/* 3. PEER RADAR (THE DESTINATION) */}
        <div className="bg-slate-900/40 border border-white/10 rounded-2xl p-6 backdrop-blur-xl">
          <label className="block mb-2 text-[10px] font-bold text-cyan-600 tracking-tighter">DETECTED LAN NODES</label>
          <div className="space-y-3 max-h-[160px] overflow-y-auto custom-scrollbar">
            {peers.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full opacity-30 select-none">
                <div className="w-12 h-12 rounded-full border border-slate-700 animate-ping opacity-20" />
                <p className="text-[10px] mt-2 italic">Scanning network interfaces...</p>
              </div>
            ) : (
              peers.map((peer, idx) => (
                <button
                  key={`${peer.ip}-${idx}`}
                  onClick={() => handleSend(peer)}
                  disabled={!selectedFile || isStreaming}
                  className="w-full flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-cyan-500/10 hover:border-cyan-500/20 transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="text-left">
                    <p className="text-xs font-bold text-slate-200 uppercase tracking-tighter">{peer.name}</p>
                    <p className="text-[10px] font-mono text-slate-500">{peer.ip}</p>
                  </div>
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-[10px] font-bold text-cyan-400 tracking-widest">DISPATCH →</span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      </div>

      {/* 4. THE SURGICAL PROGRESS METER */}
      <div className={`mt-8 p-6 rounded-2xl bg-black/60 border ${isStreaming ? 'border-cyan-500/40 shadow-[0_0_50px_-12px_rgba(34,211,238,0.3)]' : 'border-white/5'} transition-all duration-700 overflow-hidden relative`}>
        {/* Animated Scanning Background */}
        {isStreaming && (
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-500/5 to-transparent -translate-x-full animate-[scan_2s_linear_infinite]" />
        )}

        <div className="flex justify-between items-end mb-3">
          <div>
            <label className="block text-[10px] font-bold text-cyan-600 tracking-tighter uppercase mb-1">Telemetry Monitor</label>
            <p className="text-sm font-mono tracking-tighter text-slate-300">STREAM_ID: {selectedFile ? selectedFile.name.substring(0, 15)+'...':'WAITING_FOR_DATA'}</p>
          </div>
          <div className="text-right">
            <span className="text-xs font-mono text-cyan-400">{stats.percent === -1 ? 'CONTINUOUS' : `${stats.percent}%`}</span>
          </div>
        </div>

        {/* THE NEON BAR */}
        <div className="h-4 w-full bg-slate-800/40 rounded-full border border-white/10 overflow-hidden relative shadow-inner">
           {/* Pulsing Gradient Fill */}
           <div 
             className="h-full bg-gradient-to-r from-cyan-600 via-cyan-400 to-indigo-500 transition-all duration-300 relative rounded-full"
             style={{ width: stats.percent === -1 ? '100%' : `${stats.percent}%` }}
           >
             {isStreaming && (
               <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.4)_50%,transparent_100%)] w-20 h-full animate-[progress-glide_1.5s_infinite]" />
             )}
           </div>
        </div>

        {/* METABOLIC STATUS LABELS */}
        <div className="mt-4 grid grid-cols-3 gap-4 border-t border-white/5 pt-4">
           <div>
             <span className="block text-[8px] text-slate-500 uppercase tracking-widest">Hash Consistency</span>
             <span className="text-[11px] font-mono text-slate-300">{stats.status === 'completed' ? '✓ MATCH_VERIFIED' : stats.status === 'error' ? '✗ CORRUPT' : 'INITIATING...'}</span>
           </div>
           <div>
             <span className="block text-[8px] text-slate-500 uppercase tracking-widest">Flow Algorithm</span>
             <span className="text-[11px] font-mono text-slate-300">P2P_ASYNC_RELAY</span>
           </div>
           <div>
             <span className="block text-[8px] text-slate-500 uppercase tracking-widest">Protocol Type</span>
             <span className="text-[11px] font-mono text-slate-300">ZERO_DEP_NATIVE</span>
           </div>
        </div>
      </div>

      {/* STYLES FOR SCANNING EFFECT */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes scan {
          from { transform: translateX(-100%); }
          to { transform: translateX(100%); }
        }
        @keyframes progress-glide {
          from { transform: translateX(-100%); }
          to { transform: translateX(500%); }
        }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(34, 211, 238, 0.2); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(34, 211, 238, 0.4); }
      `}} />
    </div>
  );
};

export default FileDispatcher;
