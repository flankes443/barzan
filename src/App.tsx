import React, { useState, useEffect, useCallback, useRef } from 'react';
import { HTMLProject, ConsoleMessage, CodeTab, DeviceConfig, HTMLTemplate } from './types';
import { templates } from './data/templates';
import CodeEditor from './components/CodeEditor';
import IPhoneSimulator from './components/IPhoneSimulator';
import ConsolePanel from './components/ConsolePanel';
import ProjectManager from './components/ProjectManager';
import { 
  Smartphone, 
  HelpCircle, 
  Sparkles, 
  Sliders, 
  Upload,
  RefreshCw,
  FolderOpen,
  Code2,
  Terminal,
  Eye,
  Settings,
  ChevronLeft,
  Info,
  Volume2,
  VolumeX,
  Cpu,
  LayoutGrid,
  Wifi
} from 'lucide-react';
import WifiSharePortal from './components/WifiSharePortal';
import QRCode from 'qrcode';

function OfflineQRCode({ url }: { url: string }) {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  useEffect(() => {
    let active = true;
    QRCode.toDataURL(url, { margin: 1, width: 250 }, (err, dataUrl) => {
      if (err) {
        console.error('QR generation error:', err);
        return;
      }
      if (active) {
        setQrDataUrl(dataUrl);
      }
    });
    return () => {
      active = false;
    };
  }, [url]);

  if (!qrDataUrl) {
    return (
      <div className="w-[180px] h-[180px] bg-zinc-900 flex items-center justify-center rounded-xl text-zinc-500 font-mono text-[10px]">
        QR Kod Oluşturuluyor...
      </div>
    );
  }

  return (
    <img 
      src={qrDataUrl}
      alt="QR Code"
      className="w-[180px] h-[180px] select-none rounded-xl"
      referrerPolicy="no-referrer"
    />
  );
}

export default function App() {
  const [isWifiPortal] = useState(() => {
    try {
      return typeof window !== 'undefined' && window.location.search.includes('mode=wifishare');
    } catch (e) {
      return false;
    }
  });

  const [savedProjects, setSavedProjects] = useState<HTMLProject[]>([]);
  const [showQRModal, setShowQRModal] = useState(false);
  const [currentProject, setCurrentProject] = useState<HTMLProject>({
    id: 'default',
    name: 'Boş HTML Taslak',
    html: templates[0].html,
    css: templates[0].css,
    js: templates[0].js,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  const [isWifiShareActive, setIsWifiShareActive] = useState<boolean>(() => {
    try {
      return localStorage.getItem('flankes_wifishare_active') === 'true';
    } catch (e) {
      return false;
    }
  });

  const [simulatedIp, setSimulatedIp] = useState<string>(() => {
    try {
      return localStorage.getItem('flankes_simulated_ip') || '192.168.1.14:8080';
    } catch (e) {
      return '192.168.1.14:8080';
    }
  });

  const [copiedAppUrl, setCopiedAppUrl] = useState<boolean>(false);

  const handleCopyRealWifiUrl = () => {
    try {
      const url = window.location.origin + window.location.pathname + '?mode=wifishare';
      navigator.clipboard.writeText(url).then(() => {
        setCopiedAppUrl(true);
        setTimeout(() => setCopiedAppUrl(false), 3000);
      });
    } catch (e) {}
  };

  useEffect(() => {
    try {
      localStorage.setItem('flankes_wifishare_active', String(isWifiShareActive));
    } catch (e) {}
  }, [isWifiShareActive]);

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'flankes_simulated_ip') {
        setSimulatedIp(e.newValue || '192.168.1.14:8080');
      }
      if (e.key === 'flankes_wifishare_active') {
        setIsWifiShareActive(e.newValue === 'true');
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const [activeTab, setActiveTab] = useState<CodeTab>('html');
  const [consoleMessages, setConsoleMessages] = useState<ConsoleMessage[]>([]);
  const [activeHelpTab, setActiveHelpTab] = useState<'info' | 'shortcuts'>('info');
  const [isMobileView, setIsMobileView] = useState(false);
  const [mobileActiveScreen, setMobileActiveScreen] = useState<'upload' | 'run' | 'console'>(() => {
    try {
      const saved = localStorage.getItem('flankes_mobile_screen');
      if (saved === 'run' || saved === 'console' || saved === 'upload') {
        return saved;
      }
    } catch (e) {}
    return 'upload';
  });
  const [iframeKey, setIframeKey] = useState(0);
  const [mobileIframeUrl, setMobileIframeUrl] = useState<string>('');
  
  // View mode state to toggle between standard single preview and 5 identical window outputs
  const [viewMode, setViewMode] = useState<'single' | 'multi5'>(() => {
    try {
      const saved = localStorage.getItem('flankes_view_mode');
      if (saved === 'single' || saved === 'multi5') {
        return saved;
      }
    } catch (e) {}
    return 'single';
  });

  // Sync viewMode changes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('flankes_view_mode', viewMode);
    } catch (e) {}
  }, [viewMode]);
  
  // Background Keep-Alive Audio state to keep iOS JS execution alive when minimized
  const [bgKeepAlive, setBgKeepAlive] = useState<boolean>(() => {
    try {
      return localStorage.getItem('flankes_bg_keepalive') === 'true';
    } catch (e) {}
    return false;
  });
  const audioCtxRef = useRef<AudioContext | null>(null);
  const audioOscRef = useRef<OscillatorNode | null>(null);
  const audioScriptNodeRef = useRef<ScriptProcessorNode | null>(null);
  const bgAudioRef = useRef<HTMLAudioElement | null>(null);

  // Sync mobile screen changes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('flankes_mobile_screen', mobileActiveScreen);
    } catch (e) {}
  }, [mobileActiveScreen]);

  // Sync bgKeepAlive to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('flankes_bg_keepalive', String(bgKeepAlive));
    } catch (e) {}
  }, [bgKeepAlive]);

  const activateAudioContext = () => {
    if (audioCtxRef.current) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        
        // 1. Setup ScriptProcessorNode for unthrottled timer ticks
        const scriptNode = ctx.createScriptProcessor(4096, 1, 1);
        scriptNode.onaudioprocess = (e) => {
          const outputBuffer = e.outputBuffer;
          for (let channel = 0; channel < outputBuffer.numberOfChannels; channel++) {
            const outputData = outputBuffer.getChannelData(channel);
            for (let sample = 0; sample < outputBuffer.length; sample++) {
              outputData[sample] = 0;
            }
          }
          
          // Post tick message to all running iframes so they bypass iOS background JS suspension
          const iframes = document.querySelectorAll('iframe');
          iframes.forEach(iframe => {
            if (iframe.contentWindow) {
              iframe.contentWindow.postMessage({ type: 'flankes-keepalive-tick' }, '*');
            }
          });
        };
        
        // 2. Play standard silent oscillator
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();
        gainNode.gain.value = 0.0001; // completely silent
        osc.frequency.value = 440; // 440 Hz
        
        // Connect oscillator through scriptNode to gainNode to force processing
        osc.connect(scriptNode);
        scriptNode.connect(gainNode);
        gainNode.connect(ctx.destination);
        osc.start();
        
        // 3. Play HTML5 Audio element looped silent track to reinforce media session
        const silentWav = "data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAAAAA==";
        const bgAudio = new Audio(silentWav);
        bgAudio.loop = true;
        bgAudio.volume = 0.01;
        bgAudio.play().catch(err => {
          console.warn("Silent audio autoplay failed (will activate next background loop)", err);
        });
        
        audioCtxRef.current = ctx;
        audioOscRef.current = osc;
        audioScriptNodeRef.current = scriptNode;
        bgAudioRef.current = bgAudio;
        
        setBgKeepAlive(true);
      } else {
        alert("Bu tarayıcı veya cihaz arka plan desteğini desteklemiyor.");
      }
    } catch (e) {
      console.error("Keep-alive sound initialization failed", e);
    }
  };

  const toggleBgKeepAlive = () => {
    if (bgKeepAlive) {
      // Deactivate
      if (audioOscRef.current) {
        try { audioOscRef.current.stop(); } catch (e) {}
        audioOscRef.current = null;
      }
      if (audioScriptNodeRef.current) {
        try { audioScriptNodeRef.current.disconnect(); } catch (e) {}
        audioScriptNodeRef.current = null;
      }
      if (audioCtxRef.current) {
        try { audioCtxRef.current.close(); } catch (e) {}
        audioCtxRef.current = null;
      }
      if (bgAudioRef.current) {
        try {
          bgAudioRef.current.pause();
          bgAudioRef.current.src = "";
        } catch (e) {}
        bgAudioRef.current = null;
      }
      setBgKeepAlive(false);
      alert("Arka Plan Çalışma Modu Kapatıldı. Telefonu kilitlediğinizde veya başka uygulamaya geçtiğinizde iOS sistemi uygulamayı dondurabilir.");
    } else {
      activateAudioContext();
      alert("Arka Plan Sürdürme Modu Aktif! Artık cihazınızı kilitleseniz veya arka plana alsanız bile tasarladığınız kodlar (zamanlayıcılar, saatler vb.) kesintisiz olarak gerçek zamanlı çalışmaya devam eder.");
    }
  };

  // Auto-resume background audio context on user gesture if it was set to active in state
  useEffect(() => {
    if (!bgKeepAlive || audioCtxRef.current) return;

    const handleGesture = () => {
      if (bgKeepAlive && !audioCtxRef.current) {
        activateAudioContext();
      }
    };

    window.addEventListener('click', handleGesture, { passive: true });
    window.addEventListener('touchstart', handleGesture, { passive: true });
    return () => {
      window.removeEventListener('click', handleGesture);
      window.removeEventListener('touchstart', handleGesture);
    };
  }, [bgKeepAlive]);

  const [deviceConfig, setDeviceConfig] = useState<DeviceConfig>({
    model: 'iphone15',
    color: 'Uzay Siyahı',
    orientation: 'portrait',
    showBezel: true,
    scale: 0.9,
  });

  // Check if screen is mobile-sized to adapt layout dynamically
  useEffect(() => {
    const checkMobile = () => {
      setIsMobileView(window.innerWidth < 1024);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Load saved projects from LocalStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('flankes_projects');
      if (stored) {
        setSavedProjects(JSON.parse(stored));
      }
      
      const activeDraft = localStorage.getItem('flankes_active_draft');
      if (activeDraft) {
        setCurrentProject(JSON.parse(activeDraft));
      }
    } catch (e) {
      console.error('Kayıtlı projeler yüklenirken hata oluştu', e);
    }
  }, []);

  // Auto-save active draft to LocalStorage on every single code change
  useEffect(() => {
    if (currentProject) {
      localStorage.setItem('flankes_active_draft', JSON.stringify(currentProject));
    }
  }, [currentProject]);

  // Sync saved projects list helper
  const updateSavedProjectsList = (updatedList: HTMLProject[]) => {
    setSavedProjects(updatedList);
    localStorage.setItem('flankes_projects', JSON.stringify(updatedList));
  };

  // Save current project state
  const handleSaveProject = (name: string) => {
    const isNew = currentProject.id === 'default' || currentProject.id === 'imported';
    const id = isNew ? `project_${Date.now()}` : currentProject.id;
    
    const updatedProject: HTMLProject = {
      ...currentProject,
      id,
      name,
      updatedAt: new Date().toISOString(),
    };

    let nextProjects: HTMLProject[];
    if (isNew) {
      nextProjects = [...savedProjects, updatedProject];
    } else {
      nextProjects = savedProjects.map(p => p.id === id ? updatedProject : p);
    }

    setCurrentProject(updatedProject);
    updateSavedProjectsList(nextProjects);
  };

  // Load project
  const handleLoadProject = (project: HTMLProject) => {
    setConsoleMessages([]);
    setCurrentProject(project);
    setActiveTab('html');
    if (isMobileView) {
      setMobileActiveScreen('run');
    }
  };

  // Delete project
  const handleDeleteProject = (id: string) => {
    const updated = savedProjects.filter(p => p.id !== id);
    updateSavedProjectsList(updated);
    
    // If deleted current project, reset to default
    if (currentProject.id === id) {
      setCurrentProject({
        id: 'default',
        name: 'Boş HTML Taslak',
        html: templates[0].html,
        css: templates[0].css,
        js: templates[0].js,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
  };

  // Load ready-to-use template
  const handleLoadTemplate = (template: HTMLTemplate) => {
    setConsoleMessages([]);
    const freshProj: HTMLProject = {
      id: 'default',
      name: template.name,
      html: template.html,
      css: template.css,
      js: template.js,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setCurrentProject(freshProj);
    setActiveTab('html');
    if (isMobileView) {
      setMobileActiveScreen('run');
    }
  };

  // Handle live changes inside active tab
  const handleCodeChange = (tab: CodeTab, value: string) => {
    setCurrentProject(prev => ({
      ...prev,
      [tab]: value,
      updatedAt: new Date().toISOString(),
    }));
  };

  // Format code (Simple beautifier wrapper)
  const handleFormatCode = () => {
    const currentCode = currentProject[activeTab];
    // Simple Indenter / Spacing formatter helper
    let formatted = '';
    let indentLevel = 0;
    const lines = currentCode.split('\n');

    for (let line of lines) {
      line = line.trim();
      if (!line) {
        formatted += '\n';
        continue;
      }

      // Check closing bracket decrease indent
      if (line.startsWith('}') || line.startsWith('</') || line.startsWith(']')) {
        indentLevel = Math.max(0, indentLevel - 1);
      }

      formatted += '  '.repeat(indentLevel) + line + '\n';

      // Check opening bracket increase indent
      if (
        (line.endsWith('{') || line.endsWith('[') || line.includes('<') && !line.includes('</') && !line.includes('/>')) && 
        !line.startsWith('</') && 
        !line.includes('html') && 
        !line.includes('meta')
      ) {
        indentLevel++;
      }
    }

    handleCodeChange(activeTab, formatted.trim());
  };

  // Clear Editor Content
  const handleClearCode = () => {
    if (confirm(`${activeTab.toUpperCase()} kod alanını tamamen temizlemek istiyor musunuz?`)) {
      handleCodeChange(activeTab, '');
    }
  };

  // Parse imported raw HTML
  const handleImportHTML = (content: string) => {
    const contentLower = content.toLowerCase();
    const isFullHtml = contentLower.includes('<html') || 
                       contentLower.includes('<body') || 
                       contentLower.includes('<!doctype') || 
                       contentLower.includes('<script') || 
                       contentLower.includes('<style');

    let html = content;
    let css = '';
    let js = '';

    if (!isFullHtml) {
      const styleRegex = /<style[^>]*>([\s\S]*?)<\/style>/i;
      const styleMatch = content.match(styleRegex);
      css = styleMatch ? styleMatch[1].trim() : '';

      const scriptRegex = /<script[^>]*>([\s\S]*?)<\/script>/i;
      const scriptMatch = content.match(scriptRegex);
      js = scriptMatch ? scriptMatch[1].trim() : '';

      html = content
        .replace(styleRegex, '')
        .replace(scriptRegex, '');

      const bodyRegex = /<body[^>]*>([\s\S]*?)<\/body>/i;
      const bodyMatch = html.match(bodyRegex);
      if (bodyMatch) {
        html = bodyMatch[1].trim();
      } else {
        html = html
          .replace(/<!DOCTYPE[^>]*>/gi, '')
          .replace(/<html[^>]*>/gi, '')
          .replace(/<\/html>/gi, '')
          .replace(/<head[^>]*>[\s\S]*?<\/head>/gi, '')
          .trim();
      }
    }

    const importedProj: HTMLProject = {
      id: 'imported',
      name: 'Yüklenen Şablon',
      html,
      css,
      js,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setConsoleMessages([]);
    setCurrentProject(importedProj);
    setActiveTab('html');
    
    // Auto launch preview on mobile
    if (isMobileView) {
      setMobileActiveScreen('run');
    }
  };

  // Console logic callbacks
  const handleAddConsoleMessage = useCallback((msg: ConsoleMessage) => {
    setConsoleMessages(prev => {
      if (prev.length > 100) return [...prev.slice(1), msg];
      return [...prev, msg];
    });
  }, []);

  const handleClearConsole = useCallback(() => {
    setConsoleMessages([]);
  }, []);

  // Set up event listener to receive console logs from mobile iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'console') {
        handleAddConsoleMessage(event.data.payload);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [handleAddConsoleMessage]);

  // Construct source code for full mobile frame runner
  const getMobileIframeSource = () => {
    const interceptorCode = `
      (function() {
        // 1. Console Redirect & Logging Support
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
          sendToParent('error', [e.message + ' (Satır: ' + e.lineno + ')']);
        });

        // 2. Advanced Background Timer Keep-Alive (Bypasses iOS Screen-Lock & Minimized throttling)
        const _setTimeout = window.setTimeout;
        const _setInterval = window.setInterval;
        const _clearTimeout = window.clearTimeout;
        const _clearInterval = window.clearInterval;

        const timers = {};
        let timerIdCounter = 1;

        function runTicks() {
          const now = Date.now();
          for (const id in timers) {
            const timer = timers[id];
            if (now >= timer.nextRun) {
              try {
                timer.callback();
              } catch (e) {
                console.error(e);
              }
              if (timer.interval) {
                timer.nextRun = now + timer.delay;
              } else {
                delete timers[id];
              }
            }
          }
        }

        window.setTimeout = function(callback, delay, ...args) {
          const id = timerIdCounter++;
          const ms = delay || 0;
          timers[id] = {
            callback: () => callback(...args),
            delay: ms,
            nextRun: Date.now() + ms,
            interval: false,
            nativeId: _setTimeout(() => {
              if (timers[id]) {
                delete timers[id];
                callback(...args);
              }
            }, ms)
          };
          return id;
        };

        window.setInterval = function(callback, delay, ...args) {
          const id = timerIdCounter++;
          const ms = delay || 0;
          timers[id] = {
            callback: () => callback(...args),
            delay: ms,
            nextRun: Date.now() + ms,
            interval: true,
            nativeId: _setInterval(() => {
              if (timers[id]) {
                timers[id].nextRun = Date.now() + timers[id].delay;
                callback(...args);
              }
            }, ms)
          };
          return id;
        };

        window.clearTimeout = function(id) {
          if (timers[id]) {
            _clearTimeout(timers[id].nativeId);
            delete timers[id];
          } else {
            _clearTimeout(id);
          }
        };

        window.clearInterval = function(id) {
          if (timers[id]) {
            _clearInterval(timers[id].nativeId);
            delete timers[id];
          } else {
            _clearInterval(id);
          }
        };

        window.addEventListener('message', function(e) {
          if (e.data && e.data.type === 'flankes-keepalive-tick') {
            runTicks();
          }
        });
      })();
    `;

    const htmlLower = currentProject.html.toLowerCase();
    const isFullHtml = htmlLower.includes('<html') || 
                       htmlLower.includes('<body') || 
                       htmlLower.includes('<!doctype') || 
                       htmlLower.includes('<script') || 
                       htmlLower.includes('<style');

    if (isFullHtml) {
      const interceptor = `<script>${interceptorCode}</script>`;
      let doc = currentProject.html;
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
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover" />
          <style>
            ${currentProject.css}
          </style>
          <script>
            ${interceptorCode}
          </script>
        </head>
        <body>
          ${currentProject.html}
          <script>
            try {
              ${currentProject.js}
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
    const source = getMobileIframeSource();
    const blob = new Blob([source], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    setMobileIframeUrl(url);

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [currentProject, iframeKey]);

  // Handle direct HTML file uploads from mobile safari
  const handleMobileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        handleImportHTML(content);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const reloadIframe = () => {
    setIframeKey(prev => prev + 1);
    setConsoleMessages([]);
  };

  // Render Wi-Fi Transfer Portal if query parameter is active
  if (isWifiPortal) {
    return <WifiSharePortal />;
  }

  // Render Mobile View layout if accessed from phone
  if (isMobileView) {
    return (
      <div className="min-h-screen bg-[#09090b] text-zinc-100 flex flex-col font-sans select-none">
        
        {/* Mobile Header - lowered via pt-10 for modern notch / browser bar comfort */}
        <header className="border-b border-zinc-800 bg-[#0c0c0e]/95 px-4 pt-10 pb-3 flex items-center justify-between sticky top-0 z-40">
          <button 
            onClick={() => {
              if (mobileIframeUrl) {
                setMobileActiveScreen('run');
              } else {
                setMobileActiveScreen('upload');
              }
            }}
            className="flex items-center gap-2 text-left bg-transparent border-none p-0 focus:outline-none cursor-pointer group active:opacity-80 pt-1.5"
            title="Aktif Önizlemeye Git"
          >
            <div className="px-3 h-8 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-500 flex items-center justify-center border border-emerald-400/20 font-black text-white text-[10px] font-mono shadow-md tracking-wider group-hover:scale-105 transition-all mt-1.5">
              FLANKES
            </div>
          </button>

          <div className="flex items-center gap-2">
            {mobileActiveScreen !== 'run' && mobileIframeUrl && (
              <button
                onClick={() => setMobileActiveScreen('run')}
                className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-500/10 border border-emerald-500/30 hover:bg-emerald-500/20 rounded-lg text-xs font-bold text-emerald-400 active:scale-95 transition-all cursor-pointer"
              >
                <Eye size={13} />
                <span>Önizleme</span>
              </button>
            )}
          </div>
        </header>

        {/* Mobile Main Body */}
        <div className="flex-1 flex flex-col relative">
          
          {/* SCREEN 1: UPLOAD & TEMPLATE SELECTOR */}
          {mobileActiveScreen === 'upload' && (
            <div className="flex-1 p-5 flex flex-col gap-8 justify-center items-center">
              
              {/* Colorful FLANKES header */}
              <div className="text-center mb-2">
                <h1 className="text-5xl font-black tracking-widest bg-gradient-to-r from-emerald-400 via-teal-400 via-amber-300 via-rose-400 to-indigo-400 bg-clip-text text-transparent font-mono drop-shadow-lg animate-rainbow-text">
                  FLANKES
                </h1>
              </div>

              {/* Massive file selection button for phone tap */}
              <div className="text-center flex flex-col items-center gap-6 w-full max-w-sm">
                <div className="w-16 h-16 rounded-full bg-orange-500/10 flex items-center justify-center text-orange-400 animate-bounce">
                  <Upload size={32} />
                </div>
                <div>
                  <h2 className="text-lg font-black text-white">iPhone HTML Kodunu Çalıştır</h2>
                  <p className="text-xs text-zinc-400 mt-1 max-w-xs mx-auto leading-relaxed">
                    Telefonunuzda kayıtlı olan herhangi bir HTML dosyasını seçin, anında tam ekran çalıştıralım.
                  </p>
                </div>

                <label className="w-full max-w-xs mt-6 flex items-center justify-center gap-2.5 px-6 py-4.5 bg-gradient-to-tr from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600 text-white rounded-2xl text-sm font-black shadow-2xl shadow-orange-500/10 cursor-pointer active:scale-95 transition-all">
                  <Upload size={18} />
                  <span>DOSYA SEÇ VE ÇALIŞTIR</span>
                  <input
                    type="file"
                    accept=".html,.htm"
                    onChange={handleMobileImport}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          )}

          {/* SCREEN 2: ACTIVE IFRAME RUNNER */}
          {mobileActiveScreen === 'run' && (
            <div className="flex-1 flex flex-col relative bg-zinc-950 overflow-hidden">
              {viewMode === 'multi5' ? (
                <div className="flex-1 overflow-y-auto p-2.5 flex flex-col gap-2.5 pb-24 scrollbar-none">
                  {/* 2x2 Grid of the first 4 windows */}
                  <div className="grid grid-cols-2 gap-2 w-full">
                    {[0, 1, 2, 3].map((index) => (
                      <div 
                        key={index}
                        className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-md h-[120px] flex flex-col animate-fade-in"
                      >
                        {/* Miniature Window Title Bar */}
                        <div className="bg-zinc-950 px-2 py-1 flex items-center justify-between border-b border-zinc-800/60 select-none">
                          <div className="flex items-center gap-1 scale-75 origin-left">
                            <span className="w-1 h-1 rounded-full bg-rose-500/80" />
                            <span className="w-1 h-1 rounded-full bg-amber-500/80" />
                            <span className="w-1 h-1 rounded-full bg-emerald-500/80" />
                          </div>
                          <span className="text-[6px] text-emerald-400 bg-emerald-500/10 px-1 rounded font-mono">AKTİF</span>
                        </div>

                        {/* Content iframe with 50% scale rendering */}
                        <div className="flex-1 bg-white relative overflow-hidden">
                          <div className="absolute inset-0 w-[200%] h-[200%] origin-top-left scale-50">
                            <iframe
                              key={`${iframeKey}-${index}`}
                              src={mobileIframeUrl}
                              className="w-full h-full border-none bg-white"
                              title={`Flankes Active Preview Window ${index + 1}`}
                              sandbox="allow-scripts allow-same-origin allow-modals allow-popups"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* 5th Window spanning full width at the bottom */}
                  <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-md h-[100px] flex flex-col animate-fade-in w-full">
                    {/* Miniature Window Title Bar */}
                    <div className="bg-zinc-950 px-2 py-1 flex items-center justify-between border-b border-zinc-800/60 select-none">
                      <div className="flex items-center gap-1 scale-75 origin-left">
                        <span className="w-1 h-1 rounded-full bg-rose-500/80" />
                        <span className="w-1 h-1 rounded-full bg-amber-500/80" />
                        <span className="w-1 h-1 rounded-full bg-emerald-500/80" />
                      </div>
                      <span className="text-[6px] text-emerald-400 bg-emerald-500/10 px-1 rounded font-mono">AKTİF</span>
                    </div>

                    {/* Content iframe with 50% scale rendering */}
                    <div className="flex-1 bg-white relative overflow-hidden">
                      <div className="absolute inset-0 w-[200%] h-[200%] origin-top-left scale-50">
                        <iframe
                          key={`${iframeKey}-4`}
                          src={mobileIframeUrl}
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
                  key={iframeKey}
                  src={mobileIframeUrl}
                  className="flex-1 w-full h-full border-none bg-white select-text"
                  title="Flankes Active HTML Preview"
                  sandbox="allow-scripts allow-same-origin allow-modals allow-popups"
                />
              )}

              {/* Float Mobile Controllers */}
              <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex items-center gap-2.5 bg-black/85 backdrop-blur-md px-3.5 py-2.5 rounded-full border border-zinc-800 shadow-2xl z-50">
                <button
                  onClick={() => setMobileActiveScreen('upload')}
                  className="p-2 bg-zinc-900 hover:bg-zinc-800 rounded-full text-zinc-300"
                  title="Yeni Dosya"
                >
                  <FolderOpen size={16} />
                </button>
                <div className="w-px h-5 bg-zinc-800" />
                <button
                  onClick={reloadIframe}
                  className="p-2 bg-zinc-900 hover:bg-zinc-800 rounded-full text-emerald-400"
                  title="Yeniden Yükle"
                >
                  <RefreshCw size={16} />
                </button>
                <div className="w-px h-5 bg-zinc-800" />
                <button
                  onClick={() => setViewMode(prev => prev === 'single' ? 'multi5' : 'single')}
                  className={`p-2 rounded-full border transition-all flex items-center justify-center ${
                    viewMode === 'multi5' 
                      ? 'bg-amber-500/20 border-amber-500/50 text-amber-400 font-bold' 
                      : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                  }`}
                  title={viewMode === 'single' ? '5 Sanal Ekrana Geç' : 'Tek Sanal Ekrana Geç'}
                >
                  <LayoutGrid size={16} />
                </button>
                <div className="w-px h-5 bg-zinc-800" />
                <button
                  onClick={toggleBgKeepAlive}
                  className={`p-2 rounded-full border transition-all flex items-center justify-center ${
                    bgKeepAlive 
                      ? (audioCtxRef.current 
                          ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400 animate-pulse' 
                          : 'bg-amber-500/20 border-amber-500/50 text-amber-400 animate-bounce')
                      : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                  }`}
                  title={bgKeepAlive 
                    ? (audioCtxRef.current 
                        ? "Arka Plan Sürdürme Aktif" 
                        : "Arka Planı Etkinleştirmek İçin Ekrana Dokunun")
                    : "Arka Planda Sürdür (iOS)"
                  }
                >
                  <Cpu size={16} />
                </button>
                <div className="w-px h-5 bg-zinc-800" />
                <button
                  onClick={() => setMobileActiveScreen('console')}
                  className="p-2 bg-zinc-900 hover:bg-zinc-800 rounded-full text-yellow-400 flex items-center gap-1.5"
                  title="Konsol"
                >
                  <Terminal size={16} />
                  {consoleMessages.length > 0 && (
                    <span className="w-4 h-4 rounded-full bg-red-500 text-[9px] text-white font-bold flex items-center justify-center">
                      {consoleMessages.length}
                    </span>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* SCREEN 3: MOBILE CONSOLE LOG PANEL */}
          {mobileActiveScreen === 'console' && (
            <div className="flex-1 flex flex-col p-4 bg-[#0a0a0c]">
              <div className="flex items-center justify-between mb-3">
                <button
                  onClick={() => setMobileActiveScreen('run')}
                  className="flex items-center gap-1 text-xs text-zinc-400"
                >
                  <ChevronLeft size={16} />
                  <span>Önizlemeye Dön</span>
                </button>
                <button
                  onClick={handleClearConsole}
                  className="text-xs text-red-400 hover:text-red-300"
                >
                  Temizle
                </button>
              </div>

              <div className="flex-1 overflow-y-auto">
                <ConsolePanel
                  messages={consoleMessages}
                  onClear={handleClearConsole}
                />
              </div>
            </div>
          )}

        </div>
      </div>
    );
  }

  // Render Desktop Studio layout
  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 flex flex-col font-sans">
      
      {/* Top Main Navigation Bar */}
      <header className="border-b border-zinc-800 bg-[#0c0c0e]/90 backdrop-blur-md sticky top-0 z-40 px-6 py-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="px-4 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-950/20 border border-emerald-400/30 font-black text-white text-xs tracking-widest font-mono animate-pulse">
            FLANKES
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black tracking-tight text-white font-mono">flankes</h1>
              <span className="px-2 py-0.5 bg-orange-500/10 text-orange-400 text-[10px] font-bold uppercase tracking-widest rounded-full border border-orange-500/20">
                v2.1 iOS Runner
              </span>
            </div>
            <p className="text-xs text-zinc-400">iPhone için Gelişmiş HTML, CSS ve JavaScript Tasarım ve Kod Düzenleyici</p>
          </div>
        </div>

        {/* Global Stats indicators */}
        <div className="flex items-center gap-3 text-xs font-mono">
          <button
            onClick={() => setShowQRModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold rounded-xl shadow-lg shadow-emerald-950/20 transition-all cursor-pointer transform hover:scale-[1.02] active:scale-[0.98]"
          >
            <Smartphone size={15} className="animate-pulse" />
            <span>Telefona Yükle (QR Kod)</span>
          </button>

          <div className="hidden xl:flex items-center gap-2 px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Aktif Düzenleme: <strong className="text-zinc-200">{currentProject.name}</strong></span>
          </div>
        </div>
      </header>

      {/* Main Studio Workbench Grid */}
      <main className="flex-1 p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-7xl mx-auto w-full">
        
        {/* LEFT COLUMN: Project Manager (Width Span: 3) */}
        <div className="lg:col-span-3 flex flex-col gap-6">
          <ProjectManager
            currentProject={currentProject}
            savedProjects={savedProjects}
            onLoadProject={handleLoadProject}
            onSaveProject={handleSaveProject}
            onDeleteProject={handleDeleteProject}
            onLoadTemplate={handleLoadTemplate}
            onImportHTML={handleImportHTML}
          />

          {/* Quick Guidelines Card */}
          <div className="bg-[#121214] p-5 rounded-2xl border border-zinc-800 flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2.5">
              <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-widest flex items-center gap-1.5">
                <HelpCircle size={14} className="text-orange-400" />
                <span>Nasıl Kullanılır?</span>
              </h4>
              <div className="flex gap-1.5 text-[9px] font-bold">
                <button 
                  onClick={() => setActiveHelpTab('info')}
                  className={`px-1.5 py-0.5 rounded ${activeHelpTab === 'info' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
                >
                  Bilgi
                </button>
                <button 
                  onClick={() => setActiveHelpTab('shortcuts')}
                  className={`px-1.5 py-0.5 rounded ${activeHelpTab === 'shortcuts' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
                >
                  Yönergeler
                </button>
              </div>
            </div>

            {activeHelpTab === 'info' ? (
              <div className="space-y-3.5 text-xs text-zinc-400 leading-relaxed">
                <p>
                  <strong>Flankes</strong>, yazdığınız HTML tasarımlarını, CSS stillerini ve JavaScript algoritmalarını gerçekçi bir sanal iPhone ekranında çalıştırır.
                </p>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <span className="text-emerald-400 font-bold font-mono">1.</span>
                    <span>Yukarıdaki hazır şablonlardan birini seçerek anında başlatın.</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-emerald-400 font-bold font-mono">2.</span>
                    <span>Sekmeler arasında geçiş yaparak kodları dilediğiniz gibi düzenleyin.</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-emerald-400 font-bold font-mono">3.</span>
                    <span>Hazır element enjektörleri ile hızlıca butonlar ve cam form kartları ekleyin.</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-2.5 text-xs text-zinc-400 leading-relaxed font-mono">
                <div className="flex justify-between border-b border-zinc-900 pb-1.5">
                  <span className="text-zinc-300">Güç Düğmesi</span>
                  <span className="text-amber-500 text-[10px]">Cihazı Yeniler</span>
                </div>
                <div className="flex justify-between border-b border-zinc-900 pb-1.5">
                  <span className="text-zinc-300">Döndür</span>
                  <span className="text-amber-500 text-[10px]">Dikey / Yatay</span>
                </div>
                <div className="flex justify-between border-b border-zinc-900 pb-1.5">
                  <span className="text-zinc-300">Konsol Logu</span>
                  <span className="text-emerald-400 text-[10px]">Console.log()</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-300">Yerel Kayıt</span>
                  <span className="text-sky-400 text-[10px]">LocalStorage</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* MIDDLE COLUMN: Code Editor (Width Span: 5, or 4 if 5-windows view is active) */}
        <div className={`${viewMode === 'multi5' ? 'lg:col-span-4' : 'lg:col-span-5'} flex flex-col gap-4`}>
          <div className="flex-1">
            <CodeEditor
              project={currentProject}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              onCodeChange={handleCodeChange}
              onFormatCode={handleFormatCode}
              onClearCode={handleClearCode}
              onImportHTML={handleImportHTML}
            />
          </div>
        </div>

        {/* RIGHT COLUMN: iPhone Simulator & Console Logs (Width Span: 4, or 5 if 5-windows view is active) */}
        <div className={`${viewMode === 'multi5' ? 'lg:col-span-5' : 'lg:col-span-4'} flex flex-col gap-6`}>
          
          {/* Simulator Panel wrapper */}
          <div className="bg-[#121214] border border-zinc-800 rounded-2xl p-5 flex flex-col gap-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <Sliders size={15} className="text-emerald-400" />
                <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-widest">Önizleme Ayarları</h3>
              </div>
            </div>

            {/* Simulated settings sliders */}
            <div className="grid grid-cols-2 gap-4 text-xs font-medium">
              <div>
                <label className="text-zinc-500 block mb-1.5">iPhone Rengi</label>
                <select
                  value={deviceConfig.color}
                  onChange={(e) => setDeviceConfig(prev => ({ ...prev, color: e.target.value }))}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-2.5 py-2 text-zinc-200 outline-none"
                >
                  <option value="Uzay Siyahı">Uzay Siyahı</option>
                  <option value="Titanyum Gri">Titanyum Gri</option>
                  <option value="Derin Mor">Derin Mor</option>
                  <option value="Altın Sarısı">Altın Sarısı</option>
                </select>
              </div>

              <div>
                <label className="text-zinc-500 block mb-1.5">Ölçeklendirme</label>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="0.6"
                    max="1.1"
                    step="0.05"
                    value={deviceConfig.scale}
                    onChange={(e) => setDeviceConfig(prev => ({ ...prev, scale: parseFloat(e.target.value) }))}
                    className="w-full accent-amber-500 h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer"
                  />
                  <span className="font-mono text-[10px] text-zinc-400 w-8 text-right">
                    {Math.round(deviceConfig.scale * 100)}%
                  </span>
                </div>
              </div>

              {/* View Layout Mode (Single Device vs 5 Windows Grid) */}
              <div className="col-span-2 border-t border-zinc-800/80 pt-3 mt-1">
                <label className="text-zinc-400 block mb-2 font-mono uppercase text-[10px] tracking-wider">GÖRÜNÜM DÜZENİ</label>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    onClick={() => setViewMode('single')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 ${
                      viewMode === 'single'
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 font-extrabold shadow-sm'
                        : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-300 hover:bg-zinc-800/60'
                    }`}
                  >
                    <Smartphone size={13} />
                    <span>Tek Sanal Cihaz</span>
                  </button>
                  <button
                    onClick={() => setViewMode('multi5')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 ${
                      viewMode === 'multi5'
                        ? 'bg-amber-500/10 border-amber-500/30 text-amber-400 font-extrabold shadow-sm'
                        : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-300 hover:bg-zinc-800/60'
                    }`}
                  >
                    <LayoutGrid size={13} />
                    <span>5 Sanal Ekran</span>
                  </button>
                </div>
              </div>

              {/* Background Run (iOS Keep-Alive) Controller */}
              <div className="border-t border-zinc-800/80 pt-4 mt-2">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      bgKeepAlive 
                        ? (audioCtxRef.current ? 'bg-emerald-500 animate-ping' : 'bg-amber-500 animate-pulse') 
                        : 'bg-zinc-600'
                    }`} />
                    <span>Arka Planda Sürdür</span>
                  </span>
                  <button
                    onClick={toggleBgKeepAlive}
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      bgKeepAlive ? 'bg-emerald-500' : 'bg-zinc-800'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        bgKeepAlive ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
                <p className="text-[10px] text-zinc-500 leading-relaxed">
                  {bgKeepAlive 
                    ? (audioCtxRef.current 
                        ? 'Aktif • iOS kilitliyken veya arka planda kodun kesintisiz çalışmasını sürdürür.' 
                        : 'Dokunma Bekleniyor • Kilidi açtıktan sonra arka plan sesini yeniden tetiklemek için ekrana dokunun.') 
                    : 'Kapalı • iOS Safari / PWA kısıtlamalarını aşarak arka planda ve kilitli ekranda kodun çalışmaya devam etmesini sağlamak için açın.'}
                </p>
              </div>
            </div>
          </div>

          {/* Simulated iPhone Area */}
          <div className="flex-1 flex items-center justify-center min-h-[450px]">
            <IPhoneSimulator
              html={currentProject.html}
              css={currentProject.css}
              js={currentProject.js}
              deviceConfig={deviceConfig}
              setDeviceConfig={setDeviceConfig}
              onAddConsoleMessage={handleAddConsoleMessage}
              onClearConsole={handleClearConsole}
              viewMode={viewMode}
              isWifiShareActive={isWifiShareActive}
              onToggleWifiShare={() => setIsWifiShareActive(prev => !prev)}
            />
          </div>

          {/* Real-time Console logs outputs */}
          <div className="h-[200px]">
            <ConsolePanel
              messages={consoleMessages}
              onClear={handleClearConsole}
            />
          </div>
        </div>

      </main>

      {/* Elegant Footer branding lines */}
      <footer className="border-t border-zinc-800 bg-[#09090b] py-6 px-12 mt-12 text-center text-zinc-600 text-xs">
        <p className="font-mono tracking-wider">FLANKES HTML DEVICE SIMULATOR FRAMEWORK</p>
        <p className="mt-1">Tasarım & Fonksiyonel Güç Bir Arada • Yerel Tarayıcı Belleğinde Saklanır</p>
      </footer>

      {/* Modern QR Code Modal for scanning with Phone Camera */}
      {showQRModal && (() => {
        const activeUrl = typeof window !== 'undefined' && window.location.origin && window.location.origin !== 'null'
          ? window.location.origin 
          : "https://ais-dev-mymbxcywukjsvhvvbnrkmf-1000456578286.europe-west2.run.app";
        return (
          <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <div className="bg-[#121214] border border-zinc-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
              <button 
                onClick={() => setShowQRModal(false)}
                className="absolute top-4 right-4 text-zinc-400 hover:text-white text-lg font-bold w-8 h-8 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center transition-all cursor-pointer hover:border-zinc-700"
              >
                ✕
              </button>
              <div className="text-center flex flex-col items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                  <Smartphone size={24} />
                </div>
                <h3 className="text-lg font-black text-white">Telefonunuzda Çalıştırın</h3>
                <p className="text-xs text-zinc-400 px-2 leading-relaxed">
                  Telefonunuzun kamerasını açın ve aşağıdaki **QR Kodu** taratın. Tasarladığınız kodlar ve uygulamalar doğrudan telefonunuzda tam ekran açılacaktır!
                </p>
                
                {/* QR Code Container */}
                <div className="p-4 bg-white rounded-2xl shadow-inner my-2 flex items-center justify-center">
                  <OfflineQRCode url={activeUrl} />
                </div>

                {/* Direct link input */}
                <div className="w-full flex flex-col gap-1.5 text-left">
                  <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Doğrudan Bağlantı Linki</label>
                  <div className="flex gap-2 bg-zinc-900 p-2.5 rounded-xl border border-zinc-800">
                    <input 
                      type="text" 
                      readOnly 
                      value={activeUrl} 
                      className="bg-transparent text-xs text-zinc-300 flex-1 outline-none font-mono selection:bg-emerald-500/25 select-all"
                    />
                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText(activeUrl);
                        alert("Bağlantı başarıyla kopyalandı!");
                      }}
                      className="text-[10px] font-bold text-emerald-400 hover:text-emerald-300 animate-pulse"
                    >
                      Kopyala
                    </button>
                  </div>
                </div>

                {/* Quick instructions */}
                <div className="text-[11px] text-zinc-500 bg-zinc-900/50 p-3.5 rounded-xl border border-zinc-900 text-left w-full space-y-1.5">
                  <p className="font-bold text-zinc-400 flex items-center gap-1">
                    <span>💡</span>
                    <span>Ana Ekrana Ekleme (Tam Ekran App):</span>
                  </p>
                  <p className="pl-1">• <strong>iPhone (Safari):</strong> Alt kısımdaki <strong className="text-zinc-300">Paylaş (Yukarı Ok Simgesi)</strong> butonuna tıklayın, ardından <strong className="text-zinc-300">Ana Ekrana Ekle</strong> seçeneğini seçin.</p>
                  <p className="pl-1">• <strong>Android (Chrome):</strong> Sağ üstteki üç noktaya tıklayıp <strong className="text-zinc-300">Uygulamayı Yükle</strong> veya <strong className="text-zinc-300">Ana Ekrana Ekle</strong> deyin.</p>
                </div>

                <button
                  onClick={() => setShowQRModal(false)}
                  className="w-full mt-2 py-2.5 bg-zinc-800 hover:bg-zinc-700 hover:text-white text-zinc-300 font-bold rounded-xl text-xs transition-all cursor-pointer"
                >
                  Kapat
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
