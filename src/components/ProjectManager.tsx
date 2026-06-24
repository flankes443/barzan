import React, { useState } from 'react';
import { HTMLProject, HTMLTemplate } from '../types';
import { templates } from '../data/templates';
import JSZip from 'jszip';
import { 
  FolderPlus, 
  Save, 
  Download, 
  Upload, 
  Trash2, 
  Check, 
  Folder, 
  Sparkles, 
  FileText, 
  HelpCircle,
  FileArchive
} from 'lucide-react';

interface ProjectManagerProps {
  currentProject: HTMLProject;
  savedProjects: HTMLProject[];
  onLoadProject: (project: HTMLProject) => void;
  onSaveProject: (name: string) => void;
  onDeleteProject: (id: string) => void;
  onLoadTemplate: (template: HTMLTemplate) => void;
  onImportHTML: (htmlContent: string) => void;
}

export default function ProjectManager({
  currentProject,
  savedProjects,
  onLoadProject,
  onSaveProject,
  onDeleteProject,
  onLoadTemplate,
  onImportHTML,
}: ProjectManagerProps) {
  const [newProjectName, setNewProjectName] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const nameToSave = newProjectName.trim() || currentProject.name || 'Başlıksız Proje';
    onSaveProject(nameToSave);
    setNewProjectName('');
    setIsSaving(true);
    setTimeout(() => setIsSaving(false), 1500);
  };

  // Export as single self-contained html file
  const handleExport = () => {
    const combinedHTML = `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${currentProject.name || 'Flankes HTML Export'}</title>
  <style>
    ${currentProject.css}
  </style>
</head>
<body>
  ${currentProject.html}
  <script>
    ${currentProject.js}
  </script>
</body>
</html>`;

    const blob = new Blob([combinedHTML], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(currentProject.name || 'flankes_export').toLowerCase().replace(/\s+/g, '_')}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Export as ZIP archive containing separate index.html, style.css, and script.js files
  const handleExportZip = async () => {
    const zip = new JSZip();

    const indexHTML = `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${currentProject.name || 'Flankes HTML Project'}</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  ${currentProject.html}
  <script src="script.js"></script>
</body>
</html>`;

    zip.file('index.html', indexHTML);
    zip.file('style.css', currentProject.css);
    zip.file('script.js', currentProject.js);

    try {
      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${(currentProject.name || 'flankes_project').toLowerCase().replace(/\s+/g, '_')}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('ZIP oluşturulurken hata oluştu:', err);
    }
  };

  // Import local HTML file
  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        onImportHTML(content);
      }
    };
    reader.readAsText(file);
    // Clear value to allow re-importing same file if modified
    e.target.value = '';
  };

  return (
    <div className="bg-[#121214] p-5 rounded-2xl border border-zinc-800 flex flex-col gap-6">
      
      {/* Save Project Section */}
      <div>
        <h3 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider mb-3 flex items-center gap-2">
          <Save size={15} className="text-sky-400" />
          <span>Projeyi Kaydet / Güncelle</span>
        </h3>
        <form onSubmit={handleSave} className="flex gap-2">
          <input
            type="text"
            placeholder={currentProject.name || "Proje adı girin..."}
            value={newProjectName}
            onChange={(e) => setNewProjectName(e.target.value)}
            className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-zinc-700 font-medium"
          />
          <button
            type="submit"
            className="flex items-center justify-center gap-1.5 px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-sky-950/20 active:scale-95 cursor-pointer"
          >
            {isSaving ? <Check size={14} /> : <Save size={14} />}
            <span>{isSaving ? 'Kaydedildi' : 'Kaydet'}</span>
          </button>
        </form>
      </div>

      {/* Import / Export Utility Dock */}
      <div className="flex flex-col gap-3.5 border-t border-b border-zinc-800/60 py-4">
        <h4 className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-1.5">
          <Download size={13} className="text-emerald-500" />
          <span>İçe / Dışa Aktar</span>
        </h4>

        <div className="flex flex-col gap-2">
          {/* HTML Yükle */}
          <label className="flex items-center justify-center gap-2 px-3 py-2.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-zinc-300 rounded-xl text-xs font-semibold cursor-pointer transition-all">
            <Upload size={14} className="text-emerald-500" />
            <span>Bilgisayardan HTML Yükle</span>
            <input
              type="file"
              accept=".html,.htm"
              onChange={handleImport}
              className="hidden"
            />
          </label>

          {/* Dışa Aktarma Seçenekleri */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleExport}
              className="flex items-center justify-center gap-2 px-3 py-2.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-zinc-300 rounded-xl text-[11px] font-semibold transition-all cursor-pointer"
              title="CSS ve JS gömülü tek bir HTML dosyası indirir"
            >
              <FileText size={13} className="text-sky-400" />
              <span>Tek HTML</span>
            </button>

            <button
              onClick={handleExportZip}
              className="flex items-center justify-center gap-2 px-3 py-2.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-zinc-300 rounded-xl text-[11px] font-semibold transition-all cursor-pointer"
              title="index.html, style.css ve script.js dosyalarını içeren bir ZIP arşivi indirir"
            >
              <FileArchive size={13} className="text-amber-500" />
              <span>ZIP Arşivi</span>
            </button>
          </div>
        </div>
      </div>

      {/* Select Built-in Premium Templates */}
      <div>
        <h3 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider mb-3 flex items-center gap-2">
          <Sparkles size={15} className="text-amber-400" />
          <span>Örnek iOS Şablonları</span>
        </h3>
        <div className="grid grid-cols-1 gap-2.5 max-h-[160px] overflow-y-auto pr-1">
          {templates.map(tmpl => (
            <button
              key={tmpl.id}
              onClick={() => onLoadTemplate(tmpl)}
              className="flex items-start text-left p-2.5 bg-zinc-900/50 hover:bg-zinc-900 border border-zinc-800/60 hover:border-zinc-700 rounded-xl transition-all group cursor-pointer"
            >
              <div className="w-8 h-8 rounded-lg bg-zinc-800/80 group-hover:bg-zinc-800 flex items-center justify-center text-amber-500 mr-3 flex-shrink-0">
                <FileText size={16} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold text-zinc-200 group-hover:text-white transition-colors">
                  {tmpl.name}
                </div>
                <div className="text-[10px] text-zinc-500 line-clamp-1 mt-0.5">
                  {tmpl.description}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Saved Projects Library */}
      <div className="flex-1 flex flex-col min-h-[180px]">
        <h3 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider mb-3 flex items-center gap-2">
          <Folder size={15} className="text-amber-500" />
          <span>Kayıtlı Projelerim ({savedProjects.length})</span>
        </h3>
        
        {savedProjects.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-6 border-2 border-dashed border-zinc-800 rounded-2xl text-center">
            <Folder size={20} className="text-zinc-700 mb-1" />
            <p className="text-[11px] text-zinc-600">Henüz kaydedilmiş yerel proje bulunmuyor.</p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto max-h-[220px] space-y-2 pr-1">
            {savedProjects.map(proj => {
              const isCurrent = proj.id === currentProject.id;
              return (
                <div
                  key={proj.id}
                  className={`flex items-center justify-between p-2.5 rounded-xl border transition-all ${
                    isCurrent
                      ? 'bg-sky-500/5 border-sky-500/20 text-sky-400'
                      : 'bg-zinc-900/30 border-zinc-800 hover:border-zinc-700 text-zinc-300'
                  }`}
                >
                  <button
                    onClick={() => onLoadProject(proj)}
                    className="flex-1 text-left min-w-0 pr-2 cursor-pointer"
                  >
                    <div className="text-xs font-bold truncate">{proj.name}</div>
                    <div className="text-[9px] text-zinc-500 mt-0.5 font-mono">
                      {new Date(proj.updatedAt).toLocaleDateString('tr-TR')} {new Date(proj.updatedAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </button>

                  <button
                    onClick={() => onDeleteProject(proj.id)}
                    className="p-1.5 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-zinc-800 transition-colors"
                    title="Projeyi Sil"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
