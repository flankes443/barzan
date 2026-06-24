import React, { useState, useEffect, useRef } from 'react';
import { DeviceConfig, ConsoleMessage } from '../types';
import { 
  RotateCw, 
  Maximize2, 
  Minimize2, 
  RefreshCw, 
  Smartphone, 
  Battery, 
  Wifi, 
  Signal, 
  Sparkles,
  Share2, 
  ExternalLink, 
  FileCode, 
  Clipboard, 
  Laptop, 
  Server, 
  Check, 
  ArrowRight,
  Send,
  Trash2
} from 'lucide-react';
import { motion } from 'motion/react';

interface IPhoneSimulatorProps {
  html: string;
  css: string;
  js: string;
  deviceConfig: DeviceConfig;
  setDeviceConfig: React.Dispatch<React.SetStateAction<DeviceConfig>>;
  onAddConsoleMessage: (msg: ConsoleMessage) => void;
  onClearConsole: () => void;
  viewMode?: 'single' | 'multi5';
  isWifiShareActive?: boolean;
  onToggleWifiShare?: () => void;
}

export default function IPhoneSimulator({
  html,
  css,
  js,
  deviceConfig,
  setDeviceConfig,
  onAddConsoleMessage,
  onClearConsole,
  viewMode = 'single',
  isWifiShareActive = false,
  onToggleWifiShare = () => {},
}: IPhoneSimulatorProps) {
  const [time, setTime] = useState('');
  const [iframeKey, setIframeKey] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [iframeSrc, setIframeSrc] = useState('');

  const [localProjects, setLocalProjects] = useState<any[]>([]);
  const [computerClipboard, setComputerClipboard] = useState<string>('');
  const [phoneClipboardInput, setPhoneClipboardInput] = useState<string>('');
  const [copiedRealUrl, setCopiedRealUrl] = useState<boolean>(false);
  const [simulatedIp, setSimulatedIp] = useState<string>(() => {
    try {
      return localStorage.getItem('flankes_simulated_ip') || '192.168.1.14:8080';
    } catch (e) {
      return '192.168.1.14:8080';
    }
  });

  const getActiveUrl = () => {
    try {
      return typeof window !== 'undefined' 
        ? window.location.origin + window.location.pathname + '?mode=wifishare' 
        : '';
    } catch (e) {
      return '';
    }
  };

  const handleCopyActiveUrl = () => {
    const url = getActiveUrl();
    if (!url) return;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedRealUrl(true);
      setTimeout(() => setCopiedRealUrl(false), 3000);
    });
  };

  // Sync projects, clipboard and simulated IP on mount and during storage events
  useEffect(() => {
    const loadFromStorage = () => {
      try {
        const stored = localStorage.getItem('flankes_projects');
        if (stored) {
          setLocalProjects(JSON.parse(stored));
        }
        setComputerClipboard(localStorage.getItem('flankes_computer_clipboard') || '');
        setSimulatedIp(localStorage.getItem('flankes_simulated_ip') || '192.168.1.14:8080');
      } catch (e) {}
    };

    loadFromStorage();

    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'flankes_projects') {
        try {
          setLocalProjects(e.newValue ? JSON.parse(e.newValue) : []);
        } catch (err) {}
      }
      if (e.key === 'flankes_computer_clipboard') {
        setComputerClipboard(e.newValue || '');
      }
      if (e.key === 'flankes_simulated_ip') {
        setSimulatedIp(e.newValue || '192.168.1.14:8080');
      }
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const handleRandomizeIp = () => {
    const randomLastOctet = Math.floor(Math.random() * 253) + 2; // 2 to 254
    const newIp = `192.168.1.${randomLastOctet}:8080`;
    try {
      localStorage.setItem('flankes_simulated_ip', newIp);
      setSimulatedIp(newIp);
      window.dispatchEvent(new StorageEvent('storage', {
        key: 'flankes_simulated_ip',
        newValue: newIp
      }));
    } catch (e) {}
  };

  const handleCustomIpEdit = () => {
    const currentOctet = simulatedIp.split('.')[3]?.split(':')[0] || '14';
    const customLastOctet = prompt('Sanal iPhone için yeni bir IP adresi son rakamı girin (2-254 arası):', currentOctet);
    if (!customLastOctet) return;
    const num = parseInt(customLastOctet, 10);
    if (isNaN(num) || num < 2 || num > 254) {
      alert('Geçersiz rakam! Lütfen 2 ile 254 arasında bir sayı girin.');
      return;
    }
    const newIp = `192.168.1.${num}:8080`;
    try {
      localStorage.setItem('flankes_simulated_ip', newIp);
      setSimulatedIp(newIp);
      window.dispatchEvent(new StorageEvent('storage', {
        key: 'flankes_simulated_ip',
        newValue: newIp
      }));
    } catch (e) {}
  };

  const handleSendPhoneClipboard = () => {
    if (!phoneClipboardInput.trim()) return;
    try {
      localStorage.setItem('flankes_device_clipboard', phoneClipboardInput);
      window.dispatchEvent(new StorageEvent('storage', {
        key: 'flankes_device_clipboard',
        newValue: phoneClipboardInput
      }));
      setPhoneClipboardInput('');
      alert('Metin bilgisayardaki portale başarıyla gönderildi!');
    } catch (e) {}
  };

  // Update clock on iOS status bar
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Set up event listener to receive console logs from iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'console') {
        onAddConsoleMessage(event.data.payload);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onAddConsoleMessage]);

  // Construct source code with console interceptor preloaded before user JS runs
  const getIframeSource = () => {
    const htmlLower = html.toLowerCase();
    const isFullHtml = htmlLower.includes('<html') || 
                       htmlLower.includes('<body') || 
                       htmlLower.includes('<!doctype') || 
                       htmlLower.includes('<script') || 
                       htmlLower.includes('<style');

    if (isFullHtml) {
      const interceptor = `
        <script>
          // Intercept console functions immediately
          (function() {
            const _log = console.log;
            const _error = console.error;
            const _warn = console.warn;
            const _info = console.info;

            function sendToParent(type, args) {
              window.parent.postMessage({
                type: 'console',
                payload: {
                  type: type,
                  text: args.map(arg => {
                    if (arg === null) return 'null';
                    if (arg === undefined) return 'undefined';
                    if (typeof arg === 'object') {
                      try { return JSON.stringify(arg); } catch(e) { return '[Döngüsel Nesne]'; }
                    }
                    return String(arg);
                  }).join(' '),
                  timestamp: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                }
              }, '*');
            }

            console.log = function(...args) {
              _log.apply(console, args);
              sendToParent('log', args);
            };
            console.error = function(...args) {
              _error.apply(console, args);
              sendToParent('error', args);
            };
            console.warn = function(...args) {
              _warn.apply(console, args);
              sendToParent('warn', args);
            };
            console.info = function(...args) {
              _info.apply(console, args);
              sendToParent('info', args);
            };

            window.addEventListener('error', function(e) {
              sendToParent('error', [e.message + ' (Satır: ' + e.lineno + ', Sütun: ' + e.colno + ')']);
            });
          })();
        </script>
      `;

      let doc = html;
      if (doc.toLowerCase().includes('<head>')) {
        const headIndex = doc.toLowerCase().indexOf('<head>');
        doc = doc.slice(0, headIndex + 6) + interceptor + doc.slice(headIndex + 6);
      } else if (doc.toLowerCase().includes('<html>')) {
        const htmlIndex = doc.toLowerCase().indexOf('<html>');
        doc = doc.slice(0, htmlIndex + 6) + interceptor + doc.slice(htmlIndex + 6);
      } else {
        doc = interceptor + doc;
      }
      return doc;
    }

    return `
      <!DOCTYPE html>
      <html lang="tr">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
          <style>
            ${css}
          </style>
          <script>
            // Intercept console functions immediately
            (function() {
              const _log = console.log;
              const _error = console.error;
              const _warn = console.warn;
              const _info = console.info;

              function sendToParent(type, args) {
                window.parent.postMessage({
                  type: 'console',
                  payload: {
                    type: type,
                    text: args.map(arg => {
                      if (arg === null) return 'null';
                      if (arg === undefined) return 'undefined';
                      if (typeof arg === 'object') {
                        try { return JSON.stringify(arg); } catch(e) { return '[Döngüsel Nesne]'; }
                      }
                      return String(arg);
                    }).join(' '),
                    timestamp: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                  }
                }, '*');
              }

              console.log = function(...args) {
                _log.apply(console, args);
                sendToParent('log', args);
              };
              console.error = function(...args) {
                _error.apply(console, args);
                sendToParent('error', args);
              };
              console.warn = function(...args) {
                _warn.apply(console, args);
                sendToParent('warn', args);
              };
              console.info = function(...args) {
                _info.apply(console, args);
                sendToParent('info', args);
              };

              window.addEventListener('error', function(e) {
                sendToParent('error', [e.message + ' (Satır: ' + e.lineno + ', Sütun: ' + e.colno + ')']);
              });
            })();
          </script>
        </head>
        <body>
          ${html}
          <script>
            try {
              ${js}
            } catch (err) {
              console.error(err.message);
            }
          </script>
        </body>
      </html>
    `;
  };

  // Generate stable Blob Object URL to bypass iOS standalone PWA srcDoc restrictions
  useEffect(() => {
    const source = getIframeSource();
    const blob = new Blob([source], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    setIframeSrc(url);

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [html, css, js, iframeKey]);

  const reloadIframe = () => {
    onClearConsole();
    setIframeKey(prev => prev + 1);
  };

  // Toggle orientation
  const toggleOrientation = () => {
    setDeviceConfig(prev => ({
      ...prev,
      orientation: prev.orientation === 'portrait' ? 'landscape' : 'portrait',
    }));
  };

  // iPhone colors configuration
  const phoneColors: Record<string, string> = {
    'Uzay Siyahı': 'bg-[#1c1c1e] border-zinc-700 ring-zinc-800',
    'Titanyum Gri': 'bg-[#8e8e93] border-zinc-400 ring-zinc-500',
    'Derin Mor': 'bg-[#2e263a] border-purple-900 ring-purple-950',
    'Altın Sarısı': 'bg-[#f4e2d8] border-amber-200 ring-amber-300',
  };

  const isLandscape = deviceConfig.orientation === 'landscape';

  return (
    <div className={`flex flex-col items-center justify-center h-full ${isFullscreen ? 'fixed inset-0 bg-black/95 z-50 p-4' : ''}`}>
      {/* Simulator Actions Bar */}
      <div className="flex flex-wrap items-center justify-between w-full max-w-sm mb-4 px-2 gap-2">
        <div className="flex items-center gap-1.5 bg-zinc-900/80 p-1.5 rounded-xl border border-zinc-800">
          <button
            onClick={toggleOrientation}
            className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all flex items-center gap-1"
            title="Döndür (Dikey / Yatay)"
          >
            <RotateCw size={14} className={isLandscape ? 'rotate-90' : ''} />
            <span className="text-xs font-medium">Döndür</span>
          </button>
          <div className="h-4 w-px bg-zinc-800" />
          <button
            onClick={reloadIframe}
            className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all flex items-center gap-1"
            title="Yeniden Yükle"
          >
            <RefreshCw size={14} />
            <span className="text-xs font-medium">Yenile</span>
          </button>
        </div>

        <div className="flex items-center gap-1.5 bg-zinc-900/80 p-1.5 rounded-xl border border-zinc-800">
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all flex items-center gap-1"
            title="Tam Ekran Modu"
          >
            {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
            <span className="text-xs font-medium">{isFullscreen ? 'Kapat' : 'Tam Ekran'}</span>
          </button>
        </div>
      </div>

      {/* Frame Wrapper Scaling */}
      <div
        style={{ transform: `scale(${deviceConfig.scale})`, transformOrigin: 'center center' }}
        className="transition-transform duration-300"
      >
        {/* The iPhone Container */}
        <motion.div
          animate={{ rotate: isLandscape ? 90 : 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 25 }}
          className={`relative rounded-[56px] p-3.5 shadow-2xl ring-12 transition-colors duration-300 ${
            phoneColors[deviceConfig.color] || phoneColors['Uzay Siyahı']
          } ${
            isLandscape ? 'w-[780px] h-[390px]' : 'w-[360px] h-[730px]'
          }`}
          id="iphone-wrapper"
        >
          {/* Inner Display Screen */}
          <div className="relative w-full h-full bg-[#1e1e1e] rounded-[42px] overflow-hidden select-none flex flex-col border border-black/40">
            
            {/* iOS Status Bar (Only visible in Portrait or nicely absolute-positioned) */}
            <div className={`flex items-center justify-between px-6 z-30 pointer-events-none select-none text-white absolute top-0 left-0 right-0 w-full ${isLandscape ? 'h-6 text-[10px]' : 'h-11 text-xs'}`}>
              <div className="font-semibold select-none flex items-center gap-1">
                <span>{time}</span>
                <Sparkles size={11} className="text-amber-400 fill-amber-400 animate-pulse" />
              </div>
              
              {/* Dynamic Island / Notch */}
              <div className={`bg-black rounded-full flex items-center justify-center transition-all ${isLandscape ? 'w-24 h-4' : 'w-28 h-7'}`}>
                {/* Dynamic island lens shine details */}
                <div className="w-2 h-2 rounded-full bg-zinc-900 absolute right-10 flex items-center justify-center">
                  <div className="w-1 h-1 rounded-full bg-blue-950" />
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <Signal size={12} className="opacity-90" />
                <Wifi size={12} className="opacity-90" />
                <div className="flex items-center gap-0.5">
                  <span className="text-[9px] font-medium mr-0.5">98%</span>
                  <Battery size={14} className="opacity-95 text-emerald-400 fill-emerald-400" />
                </div>
              </div>
            </div>

            {/* Simulated Live View Iframe Container */}
            <div className={`relative flex-1 w-full bg-[#0c0c0e] ${isLandscape ? 'mt-6' : 'mt-11'} mb-4 rounded-b-[26px] overflow-hidden`}>
              {viewMode === 'multi5' ? (
                <div className="w-full h-full overflow-y-auto flex flex-col gap-1.5 p-1.5 bg-zinc-900 scrollbar-none select-none">
                  {/* Grid of the first 4 windows: 2x2 */}
                  <div className="grid grid-cols-2 gap-1.5 shrink-0">
                    {[0, 1, 2, 3].map((index) => (
                      <div 
                        key={index} 
                        className="bg-zinc-950 border border-zinc-800 rounded-lg overflow-hidden flex flex-col relative h-[90px] shadow-sm shrink-0"
                      >
                        {/* Miniature Header */}
                        <div className="bg-[#09090b] px-1 py-0.5 flex items-center justify-end border-b border-zinc-800/40 select-none shrink-0 scale-90 origin-right">
                          <span className="text-[6px] text-emerald-400 font-extrabold font-mono bg-emerald-500/10 px-0.5 rounded">LIVE</span>
                        </div>
                        {/* Content iframe wrapper with scale-50 */}
                        <div className="flex-1 bg-white relative overflow-hidden">
                          <div className="absolute inset-0 w-[200%] h-[200%] origin-top-left scale-50">
                            <iframe
                              key={`${iframeKey}-${index}`}
                              src={iframeSrc}
                              className="w-full h-full border-none bg-white"
                              title={`Flankes Active Preview Window ${index + 1}`}
                              sandbox="allow-scripts allow-same-origin allow-modals allow-popups"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* 5th window spanning across at the bottom */}
                  <div className="h-[75px] bg-zinc-950 border border-zinc-800 rounded-lg overflow-hidden flex flex-col relative shrink-0 shadow-sm">
                    {/* Miniature Header */}
                    <div className="bg-[#09090b] px-1 py-0.5 flex items-center justify-end border-b border-zinc-800/40 select-none shrink-0 scale-90 origin-right">
                      <span className="text-[6px] text-emerald-400 font-extrabold font-mono bg-emerald-500/10 px-0.5 rounded">LIVE</span>
                    </div>
                    {/* Content iframe wrapper */}
                    <div className="flex-1 bg-white relative overflow-hidden">
                      <div className="absolute inset-0 w-[200%] h-[200%] origin-top-left scale-50">
                        <iframe
                          key={`${iframeKey}-4`}
                          src={iframeSrc}
                          className="w-full h-full border-none bg-white"
                          title="Flankes Active Preview Window 5"
                          sandbox="allow-scripts allow-same-origin allow-modals allow-popups"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <iframe
                  id="iphone-iframe"
                  key={iframeKey}
                  ref={iframeRef}
                  src={iframeSrc}
                  className="w-full h-full border-none bg-white select-text"
                  title="Flankes iOS App Live Frame"
                  sandbox="allow-scripts allow-same-origin allow-modals allow-popups"
                />
              )}
            </div>

            {/* iOS Home Indicator Bar */}
            <div className="absolute bottom-1 w-full flex justify-center pointer-events-none z-30">
              <div className="w-32 h-1 bg-white/80 rounded-full" />
            </div>
          </div>

          {/* Virtual hardware buttons for premium styling */}
          {/* Silent Switch */}
          <div className={`absolute bg-zinc-800 rounded-l-md transition-all ${isLandscape ? 'top-[-5px] left-16 w-6 h-1' : 'left-[-4px] top-24 w-1 h-6'}`} />
          {/* Volume Up */}
          <div className={`absolute bg-zinc-800 rounded-l-md transition-all ${isLandscape ? 'top-[-5px] left-28 w-10 h-1' : 'left-[-4px] top-36 w-1 h-10'}`} />
          {/* Volume Down */}
          <div className={`absolute bg-zinc-800 rounded-l-md transition-all ${isLandscape ? 'top-[-5px] left-44 w-10 h-1' : 'left-[-4px] top-48 w-1 h-10'}`} />
          {/* Power Button */}
          <button
            onClick={reloadIframe}
            className={`absolute bg-zinc-800 rounded-r-md transition-all hover:bg-zinc-700 active:scale-95 cursor-pointer ${
              isLandscape ? 'bottom-[-5px] right-24 w-12 h-1' : 'right-[-4px] top-40 w-1 h-12'
            }`}
            title="Sanal Güç Düğmesi (Yenile)"
          />
        </motion.div>
      </div>

      {/* Model Name Details */}
      <div className="mt-4 flex flex-col items-center justify-center gap-1 text-center select-none">
        <p className="text-zinc-300 font-medium text-xs tracking-wide">
          Flankes Virtual Sandbox <span className="text-emerald-500">• Aktif</span>
        </p>
        <p className="text-[10px] text-zinc-500 font-mono">
          Model: {deviceConfig.color} iPhone • 60Hz Retina Ekran
        </p>
      </div>
    </div>
  );
}
