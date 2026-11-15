const available = () => 'serviceWorker' in navigator && window.isSecureContext;
let panelWatcher;

export function registerOffline() {
  if (!available()) return;
  const register = () => navigator.serviceWorker.register('./sw.js').catch(() => {});
  if (document.readyState === 'complete') void register();
  else window.addEventListener('load', register, { once: true });
}

export function recordingPreloader(keys) {
  let task;
  return () => {
    if (task || !navigator.onLine || !navigator.serviceWorker?.controller) return;
    task = Promise.allSettled(Array.from({ length: 3 }, async (_, lane) => {
      for (let i = lane; i < keys.length; i += 3) {
        const response = await fetch(`./assets/audio/${keys[i]}.mp3`);
        if (!response.ok) throw new Error('Recording unavailable');
        await response.arrayBuffer();
      }
    })).then(results => {
      if (results.some(result => result.status === 'rejected')) task = null;
    });
  };
}

export function mountOfflineAudio(panel) {
  const button = panel.querySelector('button');
  const status = panel.querySelector('[role="status"]');
  if (!available()) {
    status.textContent = 'הדפדפן הזה אינו תומך בהורדה למשחק בלי אינטרנט.';
    return;
  }
  const service = navigator.serviceWorker;
  panelWatcher?.abort();
  panelWatcher = new AbortController();
  let channel;
  function ask(type) {
    const worker = service.controller;
    if (!worker) return;
    button.disabled = true;
    channel?.port1.close();
    channel = new MessageChannel();
    const port = channel.port1;
    port.onmessage = ({ data }) => {
      if (!panel.isConnected || data.done) port.close();
      if (!panel.isConnected) return;
      const { bytes, count, total, busy, error, incomplete } = data;
      if (error) status.textContent = 'ההורדה לא זמינה כרגע. אפשר לנסות שוב.';
      else if (busy) status.textContent = `מכינות את ההקלטות · ${count} מתוך ${total}`;
      else if (count === total) status.textContent = 'כל ההקלטות זמינות במכשיר הזה.';
      else if (incomplete) status.textContent = `נשמרו ${count} מתוך ${total} הקלטות. אפשר להמשיך את ההורדה.`;
      else status.textContent = `כדי שכל ההקלטות יהיו זמינות בלי אינטרנט, אפשר להוריד אותן מראש (כ־${Math.ceil(bytes / 1000000)} מ״ב).`;
      button.hidden = count === total && !error;
      button.disabled = Boolean(busy);
    };
    try { worker.postMessage({ type }, [channel.port2]); }
    catch {
      port.close();
      button.disabled = false;
      status.textContent = 'ההורדה לא זמינה כרגע. אפשר לנסות שוב.';
    }
  }
  button.addEventListener('click', () => {
    if (!navigator.onLine) { status.textContent = 'כדי להוריד הקלטות, התחברו לאינטרנט.'; return; }
    status.textContent = 'מכינות את ההקלטות…';
    ask('offline-download');
  });
  const update = () => {
    if (panel.isConnected) ask('offline-status');
  };
  service.addEventListener('controllerchange', update, { signal: panelWatcher.signal });
  update();
}
