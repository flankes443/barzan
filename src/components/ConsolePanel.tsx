import React, { useState, useEffect, useRef } from 'react';
import { ConsoleMessage } from '../types';
import { Terminal, Trash2, Search, AlertCircle, AlertTriangle, Info, Play } from 'lucide-react';

interface ConsolePanelProps {
  messages: ConsoleMessage[];
  onClear: () => void;
}

export default function ConsolePanel({ messages, onClear }: ConsolePanelProps) {
  const [filter, setFilter] = useState<'all' | 'log' | 'error' | 'warn'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const filteredMessages = messages.filter(msg => {
    const matchesFilter = filter === 'all' || msg.type === filter;
    const matchesSearch = msg.text.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="bg-[#18181b] border border-zinc-800 rounded-2xl overflow-hidden flex flex-col h-full shadow-2xl">
      {/* Console Header */}
      <div className="flex flex-wrap items-center justify-between px-4 py-3 bg-[#0f0f11] border-b border-zinc-800 gap-2">
        <div className="flex items-center gap-2 text-zinc-300 font-medium">
          <Terminal size={16} className="text-emerald-500" />
          <span className="text-sm font-mono tracking-wider">flankes_console_logs</span>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Filters */}
          <div className="flex bg-[#1e1e24] p-1 rounded-lg border border-zinc-800">
            {(['all', 'log', 'warn', 'error'] as const).map(type => (
              <button
                key={type}
                onClick={() => setFilter(type)}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
                  filter === type
                    ? 'bg-zinc-700 text-white shadow-sm'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                {type.toUpperCase()}
              </button>
            ))}
          </div>

          <button
            onClick={onClear}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-red-400 hover:bg-zinc-900 transition-colors"
            title="Temizle"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="px-3 py-2 bg-zinc-900/50 border-b border-zinc-800 flex items-center gap-2">
        <Search size={14} className="text-zinc-500" />
        <input
          type="text"
          placeholder="Konsolda ara..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="bg-transparent border-none text-xs text-zinc-300 placeholder-zinc-600 focus:outline-none w-full font-mono"
        />
      </div>

      {/* Terminal Output */}
      <div className="flex-1 overflow-y-auto p-4 font-mono text-xs leading-relaxed space-y-3 min-h-[140px] max-h-[300px]">
        {filteredMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-zinc-600 py-10">
            <Terminal size={24} className="opacity-30 mb-2" />
            <p className="text-center font-sans">Konsol çıktısı temiz. Logları görmek için HTML kodunuzu çalıştırın.</p>
          </div>
        ) : (
          filteredMessages.map((msg, index) => {
            let icon = <Play size={10} className="mt-0.5" />;
            let textColor = 'text-zinc-300 border-zinc-800 bg-zinc-900/10';

            if (msg.type === 'error') {
              icon = <AlertCircle size={12} className="mt-0.5" />;
              textColor = 'text-red-400 border-red-950 bg-red-950/20';
            } else if (msg.type === 'warn') {
              icon = <AlertTriangle size={12} className="mt-0.5" />;
              textColor = 'text-amber-400 border-amber-950 bg-amber-950/20';
            } else if (msg.type === 'info') {
              icon = <Info size={12} className="mt-0.5" />;
              textColor = 'text-sky-400 border-sky-950 bg-sky-950/20';
            }

            return (
              <div
                key={index}
                className={`flex gap-3 px-3 py-2 border rounded-lg transition-colors ${textColor}`}
              >
                <div className="flex-shrink-0 mt-0.5">{icon}</div>
                <div className="flex-1 break-all whitespace-pre-wrap">{msg.text}</div>
                <div className="text-[10px] text-zinc-600 flex-shrink-0 self-start mt-0.5 select-none font-sans">
                  {msg.timestamp}
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
