import { HTMLTemplate } from '../types';

export const templates: HTMLTemplate[] = [
  {
    id: 'blank-slate',
    name: 'Boş HTML Taslak',
    description: 'Kendi özel tasarımlarınızı yazmaya başlayabileceğiniz temiz bir başlangıç şablonu.',
    icon: 'FileText',
    html: `<!-- Flankes Özel Tasarım -->
<div class="app-container">
  <header class="app-header">
    <h1>Flankes Tasarım</h1>
  </header>
  
  <main class="app-content">
    <div class="card">
      <h2>Yeni Başlangıç</h2>
      <p>Kendi HTML, CSS ve JavaScript kodlarınızı yazarak bu iPhone ekranında anında canlı test edebilirsiniz.</p>
      <button id="action-btn" class="primary-btn">Tıkla ve Deneyimle</button>
    </div>
  </main>
</div>`,
    css: `/* Flankes Temel Stil Şablonu */
body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  background-color: #0c0c0e;
  color: #f4f4f5;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
}

.app-container {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.app-header {
  background-color: #18181b;
  padding: 18px;
  text-align: center;
  border-bottom: 1px solid #27272a;
}

.app-header h1 {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  letter-spacing: -0.5px;
}

.app-content {
  flex: 1;
  padding: 20px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.card {
  background: #18181b;
  border: 1px solid #27272a;
  border-radius: 16px;
  padding: 24px;
  text-align: center;
  max-width: 320px;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3);
}

.card h2 {
  margin-top: 0;
  font-size: 20px;
  font-weight: 600;
  color: #ffffff;
}

.card p {
  color: #a1a1aa;
  font-size: 14px;
  line-height: 1.5;
  margin-bottom: 20px;
}

.primary-btn {
  background-color: #10b981;
  color: white;
  border: none;
  padding: 12px 24px;
  font-size: 14px;
  font-weight: 600;
  border-radius: 10px;
  cursor: pointer;
  width: 100%;
  transition: all 0.2s;
}

.primary-btn:active {
  transform: scale(0.97);
  background-color: #059669;
}`,
    js: `// Kodlarınızın burada çalıştığını test etmek için butona dokunabilirsiniz
const btn = document.getElementById('action-btn');

if (btn) {
  btn.addEventListener('click', () => {
    console.log('Butona başarıyla tıklandı!');
    alert('Harika! JavaScript kodunuz başarıyla çalıştı.');
  });
}`
  },
  {
    id: 'haptic-button',
    name: 'Buton ve Titreşim',
    description: 'Dokunmatik geri bildirim (Haptic vibration) ve renk değiştirme fonksiyonlu modern iOS butonu.',
    icon: 'Smartphone',
    html: `<div class="container">
  <div class="ios-status">Buton Testi</div>
  
  <div class="button-wrapper">
    <button id="vibe-btn" class="vibe-button">
      <span class="icon">⚡</span>
      <span>Dokun ve Titret</span>
    </button>
    <p class="status-text" id="status-text">Butona basılması bekleniyor...</p>
  </div>
</div>`,
    css: `body {
  font-family: -apple-system, BlinkMacSystemFont, sans-serif;
  background: radial-gradient(circle at top, #1e1b4b, #090514);
  color: white;
  margin: 0;
  padding: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
}

.container {
  text-align: center;
  padding: 24px;
  width: 100%;
}

.ios-status {
  font-size: 14px;
  text-transform: uppercase;
  letter-spacing: 2px;
  color: #a5b4fc;
  margin-bottom: 40px;
  font-weight: 600;
}

.vibe-button {
  background: linear-gradient(135deg, #6366f1, #4f46e5);
  border: none;
  color: white;
  padding: 16px 32px;
  font-size: 16px;
  font-weight: 600;
  border-radius: 14px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 10px;
  box-shadow: 0 10px 20px -5px rgba(99, 102, 241, 0.4);
  transition: all 0.1s ease;
}

.vibe-button:active {
  transform: scale(0.95);
  box-shadow: 0 4px 10px -2px rgba(99, 102, 241, 0.4);
}

.status-text {
  margin-top: 24px;
  font-size: 13px;
  color: #64748b;
  font-family: monospace;
}`,
    js: `const btn = document.getElementById('vibe-btn');
const status = document.getElementById('status-text');
let clicks = 0;

if (btn) {
  btn.addEventListener('click', () => {
    clicks++;
    console.log(\`Butona \${clicks} kez tıklandı.\`);
    
    // Mobil cihazlarda gerçek titreşimi simüle et
    if (navigator.vibrate) {
      navigator.vibrate(80);
    }
    
    if (status) {
      status.innerText = \`Aktif: \${clicks} tıklama kaydedildi!\`;
      status.style.color = '#34d399';
      
      setTimeout(() => {
        status.style.color = '#64748b';
      }, 1000);
    }
  });
}`
  },
  {
    id: 'profile-card',
    name: 'Kişisel Profil Kartı',
    description: 'iOS tarzı cam efekti ve sosyal medya linklerine sahip sade bir biyografi kartı.',
    icon: 'User',
    html: `<div class="profile-card">
  <div class="avatar-bg"></div>
  <div class="avatar">👤</div>
  <h1 class="name">Kullanıcı Profili</h1>
  <p class="tagline">Geliştirici & Tasarımcı</p>
  
  <div class="links">
    <a href="#" class="link-item" onclick="console.log('GitHub tıklandı')">GitHub Profili</a>
    <a href="#" class="link-item" onclick="console.log('LinkedIn tıklandı')">LinkedIn Bağlantısı</a>
    <a href="#" class="link-item" onclick="console.log('E-posta tıklandı')">E-posta Gönder</a>
  </div>
</div>`,
    css: `body {
  font-family: -apple-system, BlinkMacSystemFont, sans-serif;
  background-color: #09090b;
  color: #fafafa;
  margin: 0;
  padding: 24px;
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
}

.profile-card {
  width: 100%;
  max-width: 320px;
  background: #18181b;
  border: 1px solid #27272a;
  border-radius: 24px;
  overflow: hidden;
  text-align: center;
  position: relative;
  box-shadow: 0 15px 30px rgba(0,0,0,0.4);
}

.avatar-bg {
  height: 80px;
  background: linear-gradient(135deg, #a855f7, #ec4899);
}

.avatar {
  width: 70px;
  height: 70px;
  background: #27272a;
  border: 4px solid #18181b;
  border-radius: 50%;
  margin: -35px auto 12px;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 28px;
}

.name {
  font-size: 18px;
  font-weight: 700;
  margin: 0 0 4px;
}

.tagline {
  font-size: 13px;
  color: #a1a1aa;
  margin: 0 0 24px;
}

.links {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 0 20px 24px;
}

.link-item {
  display: block;
  background: #27272a;
  color: white;
  text-decoration: none;
  padding: 12px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 600;
  transition: background 0.2s;
}

.link-item:hover, .link-item:active {
  background: #3f3f46;
}`,
    js: `console.log('Profil Kartı başarıyla yüklendi!');`
  }
];
