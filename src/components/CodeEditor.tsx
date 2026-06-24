import React, { useState, useEffect, useRef } from 'react';
import { CodeTab, HTMLProject } from '../types';
import { Code, FileCode, Coffee, Brackets, PlusCircle, CheckCircle2, Copy, Sparkles, Trash2, AlignLeft, FolderOpen, Folder, Upload } from 'lucide-react';

interface CodeEditorProps {
  project: HTMLProject;
  activeTab: CodeTab;
  setActiveTab: (tab: CodeTab) => void;
  onCodeChange: (tab: CodeTab, value: string) => void;
  onFormatCode: () => void;
  onClearCode: () => void;
  onImportHTML?: (htmlContent: string) => void;
}

export default function CodeEditor({
  project,
  activeTab,
  setActiveTab,
  onCodeChange,
  onFormatCode,
  onClearCode,
  onImportHTML,
}: CodeEditorProps) {
  const [copied, setCopied] = useState(false);
  const [showFileTree, setShowFileTree] = useState(true);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lineCounterRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync scroll between textarea and line numbers
  const handleScroll = () => {
    if (textareaRef.current && lineCounterRef.current) {
      lineCounterRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  };

  // Generate line numbers list based on newlines
  const getLineNumbers = () => {
    const lines = project[activeTab].split('\n');
    return Array.from({ length: Math.max(lines.length, 1) }, (_, i) => i + 1);
  };

  // Copy code to clipboard
  const handleCopy = () => {
    navigator.clipboard.writeText(project[activeTab]);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Handle local file selection to open code
  const handleLocalFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content === undefined || content === null) return;

      const fileNameLower = file.name.toLowerCase();
      if (fileNameLower.endsWith('.html')) {
        if (onImportHTML) {
          onImportHTML(content);
          alert(`"${file.name}" dosyası başarıyla yüklendi ve ayrıştırıldı!`);
        } else {
          onCodeChange('html', content);
          setActiveTab('html');
          alert(`"${file.name}" içeriği HTML sekmesine yüklendi!`);
        }
      } else if (fileNameLower.endsWith('.css')) {
        onCodeChange('css', content);
        setActiveTab('css');
        alert(`"${file.name}" içeriği CSS sekmesine yüklendi!`);
      } else if (fileNameLower.endsWith('.js')) {
        onCodeChange('js', content);
        setActiveTab('js');
        alert(`"${file.name}" içeriği JavaScript sekmesine yüklendi!`);
      } else {
        onCodeChange(activeTab, content);
        alert(`"${file.name}" içeriği aktif sekmeye yüklendi!`);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Snippets to inject
  const snippets = {
    html: [
      {
        name: 'iOS Buton',
        code: '<button id="my-ios-btn" class="ios-btn">Dokun ve Titret</button>',
        description: 'iOS tarzı animasyonlu ve gölgeli düğme'
      },
      {
        name: 'Cam Kart',
        code: '<div class="glass-card">\n  <h3>Flankes Kart</h3>\n  <p>Bu kart buzlu cam efekti kullanmaktadır.</p>\n</div>',
        description: 'Glassmorphism arka plan kartı'
      },
      {
        name: 'Hızlı Form',
        code: '<form class="ios-form" onsubmit="event.preventDefault(); console.log(\'Giriş Yapıldı!\')">\n  <input type="text" placeholder="Kullanıcı Adı" required />\n  <input type="password" placeholder="Şifre" required />\n  <button type="submit">Giriş Yap</button>\n</form>',
        description: 'iPhone için sade veri giriş formu'
      }
    ],
    css: [
      {
        name: 'iOS Buton Stili',
        code: `.ios-btn {
  background-color: #007aff;
  color: white;
  border: none;
  padding: 14px 28px;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(0, 122, 255, 0.3);
  transition: transform 0.1s, background-color 0.2s;
}
.ios-btn:active {
  transform: scale(0.96);
  background-color: #0056b3;
}`,
        description: 'iOS buton tasarımları'
      },
      {
        name: 'Cam Kart Stili',
        code: `.glass-card {
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.25);
  border-radius: 20px;
  padding: 24px;
  color: white;
  box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.15);
}`,
        description: 'Arka plan buzlu cam görseli'
      },
      {
        name: 'iOS Form Stili',
        code: `.ios-form {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
  max-width: 320px;
}
.ios-form input {
  padding: 12px 16px;
  border-radius: 10px;
  border: 1px solid #e5e5ea;
  background-color: #f2f2f7;
  font-size: 14px;
  outline: none;
}
.ios-form input:focus {
  border-color: #007aff;
}
.ios-form button {
  background-color: #34c759;
  color: white;
  border: none;
  padding: 12px;
  border-radius: 10px;
  font-weight: bold;
  cursor: pointer;
}`,
        description: 'Sade form tasarımı'
      }
    ],
    js: [
      {
        name: 'Haptic Titreşim',
        code: `// Sanal titreşim efekti tetikleme
const btn = document.getElementById('my-ios-btn');
if (btn) {
  btn.addEventListener('click', () => {
    console.log("Haptic titreşim simüle edildi!");
    if (window.navigator.vibrate) {
      window.navigator.vibrate(50); // Mobil cihazlarda gerçek titreşim
    }
  });
}`,
        description: 'Buton tıklandığında haptic geri bildirim'
      },
      {
        name: 'Renk Değiştirici',
        code: `// Rastgele tema rengi seçici
function changeBg() {
  const colors = ['#1f1c2c', '#00c6ff', '#f857a6', '#2ecc71', '#f39c12'];
  const randomColor = colors[Math.floor(Math.random() * colors.length)];
  document.body.style.background = randomColor;
  console.log("Arka plan rengi değiştirildi: " + randomColor);
}
changeBg();`,
        description: 'Buton tıklandığında gövde arka planını günceller'
      }
    ]
  };

  // Inject snippet code at cursor position
  const injectSnippet = (code: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentText = project[activeTab];
    const newText = currentText.substring(0, start) + code + currentText.substring(end);

    onCodeChange(activeTab, newText);

    // Focus and select cursor position after injection
    setTimeout(() => {
      textarea.focus();
      textarea.selectionStart = textarea.selectionEnd = start + code.length;
    }, 0);
  };

  return (
    <div className="bg-[#18181b] border border-zinc-800 rounded-2xl flex flex-col h-full overflow-hidden shadow-xl">
      {/* Tab Selectors & Utility Bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#0f0f11] border-b border-zinc-800">
        <div className="flex items-center gap-2">
          {/* File Explorer Toggle Button */}
          <button
            onClick={() => setShowFileTree(!showFileTree)}
            className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
              showFileTree 
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
            }`}
            title="Dosya Gezginini Göster/Gizle"
          >
            <FolderOpen size={14} />
          </button>

          <div className="flex bg-[#1e1e24] p-1 rounded-xl border border-zinc-800/80">
            {(['html', 'css', 'js'] as const).map(tab => {
              const isActive = activeTab === tab;
              let icon = <Code size={14} />;
              let label = 'HTML';
              let activeColor = 'bg-orange-500/10 text-orange-400 border border-orange-500/20';

              if (tab === 'css') {
                icon = <FileCode size={14} />;
                label = 'CSS';
                activeColor = 'bg-blue-500/10 text-blue-400 border border-blue-500/20';
              } else if (tab === 'js') {
                icon = <Coffee size={14} />;
                label = 'JS';
                activeColor = 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20';
              }

              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-[11px] font-semibold tracking-wider transition-all cursor-pointer ${
                    isActive
                      ? activeColor
                      : 'text-zinc-400 hover:text-white border border-transparent'
                  }`}
                >
                  {icon}
                  <span>{label}</span>
                </button>
              );
            })}
          </div>
        </div>
 
         {/* Editor Actions */}
         <div className="flex items-center gap-2">
           <button
             onClick={onFormatCode}
             className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-zinc-400 hover:text-zinc-200 bg-zinc-900 border border-zinc-800 rounded-lg hover:border-zinc-700 transition-colors"
             title="Kodu Düzenle"
           >
             <AlignLeft size={13} />
             <span className="hidden sm:inline">Düzenle</span>
           </button>
 
           <button
             onClick={handleCopy}
             className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-zinc-400 hover:text-zinc-200 bg-zinc-900 border border-zinc-800 rounded-lg hover:border-zinc-700 transition-colors"
             title="Kopyala"
           >
             {copied ? <CheckCircle2 size={13} className="text-emerald-500" /> : <Copy size={13} />}
             <span className="hidden sm:inline">{copied ? 'Kopyalandı!' : 'Kopyala'}</span>
           </button>
 
           <button
             onClick={onClearCode}
             className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-zinc-900/50 rounded-lg transition-colors"
             title="Kodu Temizle"
           >
             <Trash2 size={14} />
           </button>
         </div>
       </div>
 
       {/* Editor Main Writing Area */}
       <div className="flex-1 flex overflow-hidden min-h-[300px] relative">
         {/* File Explorer Sidebar */}
         {showFileTree && (
           <div className="hidden md:flex flex-col w-52 bg-[#0c0c0e] border-r border-zinc-800/80 select-none shrink-0 animate-in fade-in slide-in-from-left duration-200">
             {/* Header */}
             <div className="p-3 border-b border-zinc-900/80 flex items-center justify-between text-zinc-500 text-[10px] font-bold uppercase tracking-wider">
               <span className="flex items-center gap-1.5">
                 <FolderOpen size={12} className="text-amber-500" />
                 <span>workspace</span>
               </span>
               <button 
                 onClick={() => fileInputRef.current?.click()}
                 className="hover:text-emerald-400 p-1 rounded hover:bg-zinc-900 transition-all cursor-pointer"
                 title="Yeni Dosya İçe Aktar"
               >
                 <Upload size={11} />
               </button>
             </div>
 
             {/* Tree */}
             <div className="flex-1 overflow-y-auto p-2 space-y-3 font-mono">
               <div className="space-y-1">
                 {/* Active file folder indicator */}
                 <div className="flex items-center justify-between text-zinc-400 text-[11px] font-medium px-2 py-1 bg-zinc-900/40 rounded-lg">
                   <span className="flex items-center gap-1.5 truncate">
                     <Folder size={12} className="text-amber-500 shrink-0" />
                     <span className="truncate">{project.name || 'Boş Proje'}</span>
                   </span>
                   <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                 </div>
 
                 <div className="mt-1.5 pl-1.5 space-y-0.5">
                   {/* index.html file button */}
                   <button
                     onClick={() => setActiveTab('html')}
                     className={`w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-xs transition-all text-left cursor-pointer ${
                       activeTab === 'html'
                         ? 'bg-orange-500/10 text-orange-400 font-semibold border border-orange-500/20'
                         : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50 border border-transparent'
                     }`}
                   >
                     <span className="flex items-center gap-1.5 truncate">
                       <span className="text-orange-500 font-bold font-mono text-[10px]">&lt;&gt;</span>
                       <span className="truncate">index.html</span>
                     </span>
                     <span className="text-[8px] text-zinc-600 bg-zinc-900 px-1 py-0.5 rounded font-sans">HTML</span>
                   </button>
 
                   {/* style.css file button */}
                   <button
                     onClick={() => setActiveTab('css')}
                     className={`w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-xs transition-all text-left cursor-pointer ${
                       activeTab === 'css'
                         ? 'bg-blue-500/10 text-blue-400 font-semibold border border-blue-500/20'
                         : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50 border border-transparent'
                     }`}
                   >
                     <span className="flex items-center gap-1.5 truncate">
                       <span className="text-blue-400 font-bold font-mono text-[10px]">#</span>
                       <span className="truncate">style.css</span>
                     </span>
                     <span className="text-[8px] text-zinc-600 bg-zinc-900 px-1 py-0.5 rounded font-sans">CSS</span>
                   </button>
 
                   {/* app.js file button */}
                   <button
                     onClick={() => setActiveTab('js')}
                     className={`w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-xs transition-all text-left cursor-pointer ${
                       activeTab === 'js'
                         ? 'bg-yellow-500/10 text-yellow-400 font-semibold border border-yellow-500/20'
                         : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50 border border-transparent'
                     }`}
                   >
                     <span className="flex items-center gap-1.5 truncate">
                       <span className="text-yellow-400 font-bold font-mono text-[10px]">{}</span>
                       <span className="truncate">app.js</span>
                     </span>
                     <span className="text-[8px] text-zinc-600 bg-zinc-900 px-1 py-0.5 rounded font-sans">JS</span>
                   </button>
                 </div>
               </div>
 
               {/* Fake systems files */}
               <div className="pt-2.5 border-t border-zinc-900/80 space-y-1">
                 <div className="text-[9px] text-zinc-600 px-2 font-bold tracking-wider uppercase">PWA Yapısı</div>
                 <div className="px-2 py-1 text-[11px] text-zinc-600 flex items-center gap-1.5 select-none">
                   <span>⚙️</span>
                   <span className="truncate">manifest.json</span>
                 </div>
                 <div className="px-2 py-1 text-[11px] text-zinc-600 flex items-center gap-1.5 select-none">
                   <span>🛠️</span>
                   <span className="truncate">sw.js</span>
                 </div>
               </div>
             </div>
 
             {/* Quick Open File footer button */}
             <div className="p-2.5 bg-zinc-950/80 border-t border-zinc-900/80">
               <button
                 onClick={() => fileInputRef.current?.click()}
                 className="w-full flex items-center justify-center gap-1.5 px-2.5 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-zinc-800 rounded-xl text-xs font-semibold transition-all cursor-pointer shadow-sm"
               >
                 <Upload size={12} className="text-emerald-400" />
                 <span>Dosya Aç</span>
               </button>
               <input
                 ref={fileInputRef}
                 type="file"
                 accept=".html,.txt,.css,.js"
                 onChange={handleLocalFileSelect}
                 className="hidden"
               />
             </div>
           </div>
         )}

         {/* Line Counter */}
         <div
           ref={lineCounterRef}
           className="w-12 bg-[#0c0c0e] border-r border-zinc-800/80 text-zinc-600 font-mono text-xs text-right pr-3.5 py-4 select-none overflow-hidden leading-6"
         >
           {getLineNumbers().map(num => (
             <div key={num} className="h-6">
               {num}
             </div>
           ))}
         </div>
 
         {/* Actual Code Textarea */}
         <div className="flex-1 bg-[#121214] relative">
           <textarea
             ref={textareaRef}
             value={project[activeTab]}
             onChange={(e) => onCodeChange(activeTab, e.target.value)}
             onScroll={handleScroll}
             className="absolute inset-0 w-full h-full bg-transparent text-zinc-100 font-mono text-xs leading-6 p-4 resize-none focus:outline-none focus:ring-0 overflow-auto selection:bg-zinc-700 select-text"
             placeholder={`${activeTab.toUpperCase()} kodunuzu buraya yazın...`}
             spellCheck="false"
             autoCapitalize="off"
             autoComplete="off"
           />
         </div>
       </div>

      {/* Snippet Injector Dock */}
      <div className="bg-[#0b0b0d] border-t border-zinc-800 p-3 flex flex-col gap-2">
        <div className="flex items-center gap-1.5 text-zinc-400 text-[11px] font-semibold uppercase tracking-wider px-1">
          <Sparkles size={11} className="text-amber-500" />
          <span>Hızlı {activeTab.toUpperCase()} Bileşenleri</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {snippets[activeTab].map((snip, i) => (
            <button
              key={i}
              onClick={() => injectSnippet(snip.code)}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-zinc-300 rounded-lg text-xs transition-all text-left"
              title={snip.description}
            >
              <PlusCircle size={12} className="text-emerald-500" />
              <span className="font-medium">{snip.name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
