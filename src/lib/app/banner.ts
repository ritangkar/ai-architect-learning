// Plain-DOM global banner so every page (even fully static ones) warns about session-only mode without loading Preact.
import { getApp } from './state';

export function mountGlobalBanner() {
  const host = document.getElementById('storage-banner-host');
  if (!host) return;
  getApp().then((app) => {
    const render = () => {
      host.innerHTML = '';
      if (app.mode !== 'session') return;
      const div = document.createElement('div');
      div.className = 'banner warn';
      div.setAttribute('role', 'alert');
      div.style.margin = '0';
      div.style.borderRadius = '0';
      div.id = 'session-only-banner';
      const p = document.createElement('p');
      p.style.margin = '0';
      p.textContent = 'Session-only mode: this browser is not allowing local storage, so your progress lives in memory and will be lost when you close or reload this tab. ';
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'btn sm';
      b.textContent = 'Export your data now';
      b.addEventListener('click', async () => {
        const { filename, text } = await app.exportData();
        const a = document.createElement('a');
        a.href = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
        a.download = filename;
        a.click();
        setTimeout(() => URL.revokeObjectURL(a.href), 2000);
      });
      p.append(b);
      div.append(p);
      host.append(div);
    };
    render();
    window.addEventListener('al-storage-degraded', render);
  }).catch(() => {});
}
