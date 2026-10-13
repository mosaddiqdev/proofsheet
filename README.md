# Proofsheet

**Quick start:** upload the contents of the `dist/` folder to any https static host (Netlify, GitHub Pages, Vercel, Cloudflare Pages). That is the finished installable offline app. Everything else here is the source, only needed if you want to change the app.

Print many photos on one sheet. Crop, adjust colour, set copies per photo, print or save a PDF.

```
src/
  index.html        page markup (links css and js in order)
  css/              tokens, base, layout, components, editor
  js/
    config.js       papers, photo sizes, presets, icons, helpers
    store.js        state, saved settings, toast
    packing.js      how many photos fit, which photo goes in which slot
    render.js       draws a sheet on a canvas
    grade.js        colour pipeline: tone tables, curves, saturation, auto, cast fixer
    curves.js       curve editor widget (RGB, R, G, B)
    editor.js       crop, rotate and adjust dialog
    photos.js       photo list, adding files
    output.js       PDF builder and print
    settings.js     shop settings dialog
    app.js          wiring and screen refresh
build.py            bundles src/ into dist/index.html (one file)
dist/index.html     the published page
```
Dev: open `src/index.html`. Build: `python3 build.py`.

## Install as an app (PWA) and offline
`dist/` is a complete installable web app: `index.html`, `manifest.webmanifest`, `sw.js` (service worker), `icons/`, `screenshots/`.
Put the contents of `dist/` on any static host that serves **HTTPS** (Netlify Drop, GitHub Pages, Vercel, Cloudflare Pages, your own server).
Test locally with `python3 -m http.server --directory dist 8080` and open http://localhost:8080 (localhost counts as secure).

- Chrome, Edge, Samsung Internet: an **Install app** button appears in the header (or use the browser's install icon).
- iPhone/iPad (Safari): tap Share, then **Add to Home Screen**. iOS has no install prompt.
- After the first visit everything is cached, so the app opens and works with no network (adding photos, editing, PDF, print).
  Fonts are cached after the first online visit; until then a system font is used.
- Updating: run `python3 build.py` and upload `dist/` again. The build stamps a new version into `sw.js`; open copies show
  "A new version is ready. Reload".
- `dist/_headers` keeps `sw.js` and `index.html` uncached on Netlify / Cloudflare Pages so updates arrive quickly.
- `dist/index.html` also works alone as a plain file (no install or offline without the other files).
Prices and settings are kept in the browser (localStorage) on each device.
Icons are made by `python3 tools/make_icons.py`; the two store screenshots in `src/pwa/screenshots/` can be retaken any time.
