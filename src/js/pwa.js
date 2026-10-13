/* Offline + install. Only runs on a real http(s) page; inside sandboxed previews it quietly does nothing. */
$('#instIco').innerHTML = I.install;
const webOK = /^https?:$/.test(location.protocol);
const standalone = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
let deferredInstall = null;
function paintInstall() { $('#installBtn').hidden = !webOK || standalone() || !(deferredInstall || isIOS); }

addEventListener('beforeinstallprompt', e => { e.preventDefault(); deferredInstall = e; paintInstall(); });
addEventListener('appinstalled', () => { deferredInstall = null; paintInstall(); toast('Installed. Open Proofsheet from your home screen or app list.'); });
$('#installBtn').onclick = async () => {
  if (deferredInstall) { deferredInstall.prompt(); await deferredInstall.userChoice; deferredInstall = null; paintInstall(); }
  else toast('Tap the Share button, then "Add to Home Screen".', 9000);
};
paintInstall();

if (webOK && 'serviceWorker' in navigator) {
  const hadController = !!navigator.serviceWorker.controller;
  navigator.serviceWorker.register('sw.js').then(reg => {
    const ask = w => toast('A new version is ready.', 20000, 'Reload', () => w.postMessage('SKIP_WAITING'));
    if (reg.waiting && hadController) ask(reg.waiting);
    reg.addEventListener('updatefound', () => {
      const w = reg.installing;
      if (w) w.addEventListener('statechange', () => { if (w.state === 'installed' && navigator.serviceWorker.controller) ask(w); });
    });
  }).catch(() => {});
  let reloaded = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => { if (hadController && !reloaded) { reloaded = true; location.reload(); } });
}
