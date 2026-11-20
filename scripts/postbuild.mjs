import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
const root = 'dist';
let html = fs
  .readFileSync(root + '/index.html', 'utf8')
  .replace(/<html[^>]*>/, '<html lang="fr">')
  .replace(/<title>.*?<\/title>/, '<title>Matt Mez Studio — Espace artiste</title>');
html = html.replace(
  '</head>',
  `<meta name="theme-color" content="#101113"><meta name="description" content="Le studio personnel de Matt Mez. Prestations, devis, contrats et factures dans un espace privé et chiffré."><meta name="apple-mobile-web-app-capable" content="yes"><meta name="apple-mobile-web-app-status-bar-style" content="black-translucent"><link rel="manifest" href="/manifest.webmanifest"><link rel="apple-touch-icon" href="/icon-192.png"><style>body{background:#101113;-webkit-font-smoothing:antialiased}*{scrollbar-width:thin;scrollbar-color:#55514b transparent}button,input,textarea{font:inherit}:focus-visible{outline:2px solid #c9a76c!important;outline-offset:3px}input:focus-visible,textarea:focus-visible{outline-offset:0}::selection{background:#c9a76c66}@media(prefers-reduced-motion:reduce){*{animation-duration:0.01ms!important;transition-duration:0.01ms!important}}</style></head>`,
);
html = html.replace(
  '</body>',
  `<script>window.addEventListener('beforeinstallprompt',function(e){e.preventDefault();window.__mmInstall=e});if('serviceWorker'in navigator)window.addEventListener('load',function(){navigator.serviceWorker.register('/sw.js').catch(function(){})})</script></body>`,
);
fs.writeFileSync(root + '/index.html', html);
const walk = (p) =>
  fs
    .readdirSync(p, { withFileTypes: true })
    .flatMap((e) => (e.isDirectory() ? walk(path.join(p, e.name)) : [path.join(p, e.name)]));
const assets = walk(root)
  .map((x) => '/' + x.slice(root.length + 1))
  .filter(
    (x) =>
      (x === '/index.html' ||
        x.includes('/static/js/web/') ||
        /\.(ttf|woff2?|png|jpg|webmanifest|ico)$/.test(x)) &&
      !x.includes('/android/') &&
      !x.includes('/ios/'),
  );
const cache = 'mmstudio-' + createHash('sha256').update(html).digest('hex').slice(0, 12);
fs.writeFileSync(
  root + '/sw.js',
  `const CACHE=${JSON.stringify(cache)},FILES=${JSON.stringify(assets)};self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES)).then(()=>self.skipWaiting())));self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k.startsWith('mmstudio-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));self.addEventListener('fetch',e=>{const u=new URL(e.request.url);if(e.request.method!=='GET'||u.origin!==location.origin)return;if(e.request.mode==='navigate'){e.respondWith(fetch(e.request).catch(()=>caches.match('/index.html')));return}if(FILES.includes(u.pathname))e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request)))})`,
);
console.log('Studio PWA ready. ' + assets.length + ' public shell assets.');
