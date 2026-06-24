import React, { useState, useEffect } from 'react';
import { HTMLProject } from '../types';
import { 
  Wifi, 
  Upload, 
  Download, 
  Trash2, 
  Plus, 
  FileCode, 
  Laptop, 
  Smartphone, 
  RefreshCw,
  Clock,
  ExternalLink,
  Clipboard,
  Check,
  Send
} from 'lucide-react';

export default function WifiSharePortal() {
  const [projects, setProjects] = useState<HTMLProject[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const [clipboardText, setClipboardText] = useState('');
  const [deviceClipboard, setDeviceClipboard] = useState<string>('');
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);
  const [simulatedIp, setSimulatedIp] = useState<string>(() => {
    try {
      return localStorage.getItem('flankes_simulated_ip') || '192.168.1.14:8080';
    } catch (e) {
      return '192.168.1.14:8080';
    }
  });

  // Load projects from localStorage
  const loadProjects = () => {
    try {
      const stored = localStorage.getItem('flankes_projects');
      if (stored) {
        setProjects(JSON.parse(stored));
      }
    } catch (e) {
      console.error("Projeler yüklenirken hata oluştu:", e);
    }
  };

  // Listen to cross-tab storage changes
  useEffect(() => {
    loadProjects();
    
    // Check device clipboard and IP
    try {
      const clip = localStorage.getItem('flankes_device_clipboard') || '';
      setDeviceClipboard(clip);
      const ip = localStorage.getItem('flankes_simulated_ip') || '192.168.1.14:8080';
      setSimulatedIp(ip);
    } catch (e) {}

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'flankes_projects') {
        loadProjects();
      }
      if (e.key === 'flankes_device_clipboard') {
        setDeviceClipboard(e.newValue || '');
      }
      if (e.key === 'flankes_simulated_ip') {
        const newIp = e.newValue || '192.168.1.14:8080';
        setSimulatedIp(newIp);
        showStatus(`Sanal Cihaz IP adresi güncellendi: ${newIp}`, 'info');
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Save projects to localStorage and notify other tabs
  const saveProjectsToStorage = (updatedProjects: HTMLProject[]) => {
    try {
      localStorage.setItem('flankes_projects', JSON.stringify(updatedProjects));
      setProjects(updatedProjects);
      // Dispatch a storage event to make sure the main tab detects it immediately
      window.dispatchEvent(new StorageEvent('storage', {
        key: 'flankes_projects',
        newValue: JSON.stringify(updatedProjects)
      }));
    } catch (e) {
      showStatus("Kaydedilirken hata oluştu!", 'error');
    }
  };

  const showStatus = (text: string, type: 'success' | 'info' | 'error') => {
    setStatusMessage({ text, type });
    setTimeout(() => {
      setStatusMessage(null);
    }, 4000);
  };

  // Helper to parse imported raw HTML (similar to main app)
  const parseHTMLContent = (content: string, fileName: string): HTMLProject => {
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

    const cleanName = fileName.replace(/\.html$/i, '') || 'Kablosuz Yüklenen Proje';

    return {
      id: 'wifi_' + Math.random().toString(36).substring(2, 9),
      name: cleanName,
      html,
      css,
      js,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  };

  const handleFileUpload = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    let processedCount = 0;
    const newProjects = [...projects];

    Array.from(files).forEach((file) => {
      if (!file.name.endsWith('.html') && !file.name.endsWith('.txt')) {
        showStatus(`${file.name} desteklenmiyor. Yalnızca .html dosyaları yükleyebilirsiniz.`, 'error');
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        if (text) {
          const parsed = parseHTMLContent(text, file.name);
          newProjects.unshift(parsed);
          processedCount++;

          if (processedCount === files.length) {
            saveProjectsToStorage(newProjects);
            showStatus(`${processedCount} dosya başarıyla iPhone cihazına gönderildi!`, 'success');
          }
        }
      };
      reader.readAsText(file);
    });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFileUpload(e.dataTransfer.files);
  };

  const handleDeleteProject = (id: string, name: string) => {
    if (confirm(`"${name}" projesini cihazdan tamamen silmek istiyor musunuz?`)) {
      const updated = projects.filter(p => p.id !== id);
      saveProjectsToStorage(updated);
      showStatus(`"${name}" silindi.`, 'success');
    }
  };

  const downloadProjectFile = (project: HTMLProject) => {
    // Reconstruct full HTML
    const fullHtml = `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${project.name}</title>
  <style>
    ${project.css}
  </style>
</head>
<body>
  ${project.html}
  <script>
    try {
      ${project.js}
    } catch (err) {
      console.error(err.message);
    }
  </script>
</body>
</html>`;

    const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${project.name.toLowerCase().replace(/[^a-z0-9]/g, '_') || 'proje'}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showStatus(`"${project.name}" bilgisayarınıza indirildi.`, 'success');
  };

  const handleCreateEmptyProject = () => {
    const name = prompt('Yeni proje adı:', 'Yeni Kablosuz Proje');
    if (!name) return;

    const newProj: HTMLProject = {
      id: 'wifi_' + Math.random().toString(36).substring(2, 9),
      name: name.trim(),
      html: '<h1>Yeni Sayfa Başlığı</h1>\n<p>Buraya kodunuzu ekleyebilirsiniz...</p>',
      css: 'body {\n  font-family: sans-serif;\n  padding: 20px;\n  background-color: #f4f4f5;\n}',
      js: 'console.log("Kablosuz oluşturulan proje aktif!");',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    saveProjectsToStorage([newProj, ...projects]);
    showStatus(`"${name}" başarıyla oluşturuldu!`, 'success');
  };

  const handleSendClipboard = () => {
    if (!clipboardText.trim()) return;
    try {
      localStorage.setItem('flankes_computer_clipboard', clipboardText);
      // Dispatch storage event
      window.dispatchEvent(new StorageEvent('storage', {
        key: 'flankes_computer_clipboard',
        newValue: clipboardText
      }));
      setClipboardText('');
      showStatus("Metin panosu iPhone simülatörüne iletildi!", 'success');
    } catch (e) {
      showStatus("Pano gönderilirken bir hata oluştu", 'error');
    }
  };

  const copyShareLink = () => {
    const shareUrl = window.location.origin + window.location.pathname + '?mode=wifishare';
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopiedUrl(shareUrl);
      setTimeout(() => setCopiedUrl(null), 2000);
    });
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 flex flex-col font-sans">
      {/* Header */}
      <header className="border-b border-zinc-800 bg-[#0c0c0e]/95 py-5 px-6 sticky top-0 z-10 shadow-md">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-600 flex items-center justify-center border border-amber-400/30 shadow-md">
              <Wifi size={20} className="text-white animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-black tracking-tight font-mono text-white">FLANKES WI-FI TRANSFER</h1>
                <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 text-[9px] font-bold uppercase tracking-widest rounded-full border border-emerald-500/20 font-mono">
                  CONNECTED
                </span>
              </div>
              <p className="text-xs text-zinc-400">Bilgisayarınızdan iPhone simülatörüne anında dosya aktarın ve yönetin</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={loadProjects}
              className="p-2.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-xl text-zinc-400 hover:text-zinc-200 transition-all active:scale-95 cursor-pointer"
              title="Yenile"
            >
              <RefreshCw size={14} />
            </button>
            <button
              onClick={copyShareLink}
              className="flex items-center gap-2 px-4 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs text-zinc-300 font-bold rounded-xl transition-all cursor-pointer active:scale-95"
            >
              <ExternalLink size={13} />
              <span>{copiedUrl ? 'Kopyalandı!' : 'Paylaşım Linkini Kopyala'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 p-6 max-w-6xl w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Status Toast Notification */}
        {statusMessage && (
          <div className={`fixed top-24 right-6 z-50 px-5 py-3.5 rounded-2xl shadow-xl flex items-center gap-3 border animate-fade-in ${
            statusMessage.type === 'success' 
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
              : statusMessage.type === 'error'
              ? 'bg-rose-500/10 border-rose-500/30 text-rose-400'
              : 'bg-zinc-900 border-zinc-800 text-zinc-300'
          }`}>
            <span className={`w-2 h-2 rounded-full ${
              statusMessage.type === 'success' ? 'bg-emerald-500' : statusMessage.type === 'error' ? 'bg-rose-500' : 'bg-zinc-400'
            }`} />
            <p className="text-xs font-medium">{statusMessage.text}</p>
          </div>
        )}

        {/* Left Column: Upload Box & Sync Dashboard (Span: 5) */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          
          {/* IP Sharing Status Indicator Card */}
          <div className="bg-[#121214] border border-zinc-800/80 rounded-2xl p-5 shadow-xl flex flex-col gap-4">
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest font-mono">Simülatör Ağ Bağlantısı</h3>
            <div className="bg-zinc-950/80 border border-zinc-900 rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
                  <Smartphone size={18} />
                </div>
                <div>
                  <div className="text-xs font-bold text-zinc-300">iPhone Simülatörü</div>
                  <div className="text-[10px] font-mono text-amber-400 font-bold">{simulatedIp}</div>
                </div>
              </div>
              <div className="text-right">
                <span className="inline-block px-2 py-0.5 rounded text-[8px] font-bold font-mono bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 animate-pulse">
                  AKTİF BAĞLANTI
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-center text-xs font-mono">
              <div className="bg-zinc-900/50 border border-zinc-800/50 p-3 rounded-xl">
                <span className="block text-zinc-500 text-[10px] uppercase mb-1">Cihazdaki Dosya</span>
                <span className="text-md font-bold text-zinc-200">{projects.length} Adet</span>
              </div>
              <div className="bg-zinc-900/50 border border-zinc-800/50 p-3 rounded-xl">
                <span className="block text-zinc-500 text-[10px] uppercase mb-1">Sinyal Gücü</span>
                <span className="text-md font-bold text-emerald-400">%100 Stabil</span>
              </div>
            </div>
          </div>

          {/* Drag & Drop Upload Zone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center text-center transition-all min-h-[220px] shadow-sm relative overflow-hidden group ${
              isDragOver 
                ? 'border-amber-500 bg-amber-500/5' 
                : 'border-zinc-800 hover:border-zinc-700 bg-[#121214]'
            }`}
          >
            <input 
              type="file" 
              multiple 
              accept=".html" 
              onChange={(e) => handleFileUpload(e.target.files)} 
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
            />
            
            <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-4 transition-transform group-hover:scale-110 duration-200 ${
              isDragOver ? 'bg-amber-500/20 text-amber-400' : 'bg-zinc-900 border border-zinc-800 text-zinc-400'
            }`}>
              <Upload size={24} className={isDragOver ? 'animate-bounce' : ''} />
            </div>

            <h4 className="text-sm font-bold text-zinc-200 mb-1">Dosya Sürükle veya Göz At</h4>
            <p className="text-xs text-zinc-500 max-w-xs leading-relaxed">
              Bilgisayarınızdaki <strong>.html</strong> dosyalarını buraya sürükleyerek iPhone simülatörüne anında gönderebilirsiniz.
            </p>
          </div>

          {/* Universal Clipboard Share Section */}
          <div className="bg-[#121214] border border-zinc-800/80 rounded-2xl p-5 shadow-xl flex flex-col gap-4">
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest font-mono flex items-center gap-1.5">
              <Clipboard size={14} className="text-amber-500" />
              <span>Cihaz Pano Paylaşımı (Metin Aktarımı)</span>
            </h3>

            <div className="flex flex-col gap-3">
              <textarea
                value={clipboardText}
                onChange={(e) => setClipboardText(e.target.value)}
                placeholder="Telefona göndermek istediğiniz bir metin, link, not veya kod parçası yazın..."
                className="w-full bg-zinc-950 border border-zinc-800/80 rounded-xl px-3 py-2.5 text-xs text-zinc-200 outline-none h-20 resize-none font-sans"
              />
              <button
                onClick={handleSendClipboard}
                disabled={!clipboardText.trim()}
                className="w-full py-2 px-4 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 disabled:hover:bg-amber-500 text-zinc-950 font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
              >
                <Send size={12} />
                <span>Metni Simülatör Panosuna Gönder</span>
              </button>
            </div>

            {/* Simulated iPhone clipboard */}
            {deviceClipboard && (
              <div className="mt-1 border-t border-zinc-800 pt-3">
                <span className="text-[10px] text-zinc-500 uppercase font-mono block mb-1">iPhone Cihazından Kopyalanan Son Metin</span>
                <div className="bg-zinc-950/60 border border-zinc-900 rounded-xl p-3 text-xs text-zinc-400 font-mono break-all max-h-20 overflow-y-auto">
                  {deviceClipboard}
                </div>
              </div>
            )}
          </div>

        </div>

        {/* Right Column: Files List & Action Manager (Span: 7) */}
        <div className="lg:col-span-7 bg-[#121214] border border-zinc-800 rounded-2xl p-5 shadow-xl flex flex-col gap-4 min-h-[450px]">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-4 shrink-0">
            <div>
              <h2 className="text-sm font-bold text-zinc-200 flex items-center gap-2">
                <FileCode size={16} className="text-amber-500" />
                <span>iPhone Simülatör Dosya Kütüphanesi</span>
              </h2>
              <p className="text-[11px] text-zinc-500 mt-0.5">Sanal cihazdaki tüm projeleri yönetin, silin veya bilgisayarınıza indirin</p>
            </div>
            
            <button
              onClick={handleCreateEmptyProject}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs text-zinc-300 font-bold rounded-lg transition-all cursor-pointer active:scale-95"
            >
              <Plus size={13} />
              <span>Yeni Taslak Ekle</span>
            </button>
          </div>

          {/* Files List Table */}
          <div className="flex-1 overflow-y-auto pr-1">
            {projects.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center py-16 text-center select-none">
                <div className="w-16 h-16 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-600 mb-4 animate-pulse">
                  <FileCode size={24} />
                </div>
                <h4 className="text-sm font-bold text-zinc-400 mb-1">Dosya Bulunmuyor</h4>
                <p className="text-xs text-zinc-600 max-w-sm">
                  Şu anda simülatörde hiç dosya yok. Sol taraftaki alana bir .html dosyası sürükleyerek anında oluşturabilirsiniz.
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-2.5">
                {projects.map((project) => (
                  <div 
                    key={project.id}
                    className="group bg-zinc-950/60 border border-zinc-900 hover:border-zinc-800 rounded-xl p-4 flex items-center justify-between gap-4 transition-all"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-amber-500 shrink-0">
                        <FileCode size={18} />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-zinc-200 truncate group-hover:text-amber-400 transition-colors">
                          {project.name}
                        </h4>
                        <div className="flex items-center gap-3 mt-1 text-[9px] text-zinc-500 font-mono">
                          <span className="flex items-center gap-1">
                            <Clock size={10} />
                            <span>{new Date(project.updatedAt).toLocaleDateString('tr-TR')} {new Date(project.updatedAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</span>
                          </span>
                          <span className="bg-zinc-900 text-zinc-400 px-1 py-0.5 rounded border border-zinc-800">
                            {((project.html.length + project.css.length + project.js.length) / 1024).toFixed(2)} KB
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => downloadProjectFile(project)}
                        className="p-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-lg text-zinc-400 hover:text-emerald-400 transition-all active:scale-95 cursor-pointer"
                        title="Bilgisayara İndir"
                      >
                        <Download size={13} />
                      </button>
                      <button
                        onClick={() => handleDeleteProject(project.id, project.name)}
                        className="p-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-lg text-zinc-400 hover:text-rose-400 transition-all active:scale-95 cursor-pointer"
                        title="iPhone'dan Sil"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-2 pt-4 border-t border-zinc-800/80 shrink-0 text-[10px] text-zinc-500 font-mono flex items-center justify-between">
            <span>Bağlantı Türü: LocalStorage Sync</span>
            <span>Flankes Wireless File Share v2.0</span>
          </div>

        </div>

      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-800 bg-[#0c0c0e]/95 py-4 px-6 text-center text-[10px] text-zinc-500 font-mono shrink-0">
        <p>© 2026 Flankes Web Studio. Wireless Data Syncer. All rights reserved.</p>
      </footer>
    </div>
  );
}
