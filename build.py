"""Bundles src/ into dist/: one index.html (css + js inlined) plus the PWA files (manifest, service worker, icons)."""
import re, json, shutil, hashlib, pathlib
base = pathlib.Path(__file__).parent; src = base / 'src'; dist = base / 'dist'
shutil.rmtree(dist, ignore_errors=True); dist.mkdir()

html = (src / 'index.html').read_text(encoding='utf-8')
html = re.sub(r'<link rel="stylesheet" href="(css/[^"]+)">', lambda m: '<style>\n' + (src / m.group(1)).read_text(encoding='utf-8') + '\n</style>', html)
html = re.sub(r'<script src="(js/[^"]+)"></script>', lambda m: '<script>\n' + (src / m.group(1)).read_text(encoding='utf-8') + '\n</script>', html)
(dist / 'index.html').write_text(html, encoding='utf-8')

for f in (src / 'pwa').rglob('*'):
    if f.is_file() and f.name != 'sw.js':
        t = dist / f.relative_to(src / 'pwa'); t.parent.mkdir(parents=True, exist_ok=True); shutil.copy2(f, t)

manifest = (dist / 'manifest.webmanifest').read_bytes()
version = hashlib.sha256(html.encode() + manifest).hexdigest()[:10]
assets = ['./', './index.html', './manifest.webmanifest'] + sorted('./' + p.relative_to(dist).as_posix() for p in (dist / 'icons').rglob('*') if p.is_file())
sw = (src / 'pwa' / 'sw.js').read_text(encoding='utf-8').replace('__VERSION__', version).replace('__ASSETS__', json.dumps(assets))
(dist / 'sw.js').write_text(sw, encoding='utf-8')
print('built dist/ version', version, '|', len(html), 'bytes html |', len(assets), 'precached files')
