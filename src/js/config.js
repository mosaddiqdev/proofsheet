/* Constants, presets, icons and tiny helpers. Loaded first. */
const $ = s => document.querySelector(s);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const esc = t => String(t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

const PAPERS = { A6: [105, 148], '4×6 in': [102, 152], '5×7 in': [127, 178], A5: [148, 210], A4: [210, 297], A3: [297, 420] };
const SIZES = { passport: ['Passport', 35, 45], square: ['Square', 50, 50], stamp: ['Stamp', 20, 25], us: ['US 2×2 in', 51, 51], visa: ['Visa', 33, 48], custom: ['Custom', 40, 50] };
/* Face guide specs. head = chin-to-crown range, as a share of photo height (pct) or in mm; eye = eye-line zone in mm from the bottom.
   passport/visa: ICAO and Indian passport rule, face fills 70-80% of the photo height, centred.
   us/square: US State Department 2x2 in rule, head 25-35 mm, eyes 28-35 mm from the bottom. */
const GUIDE = {
  passport: { pct: [.7, .8] },
  visa: { pct: [.7, .8] },
  us: { mm: [25, 35], eye: [28, 35] },
  square: { mm: [25, 35], eye: [28, 35] }
};
const MAXC = 999, MAXP = 20;
const DEF = { cur: '₹', margin: 5, gap: 2, cut: true, showPrice: false, pp: { passport: 5, square: 5, stamp: 3, us: 6, visa: 5, custom: 5 } };

const IDENT = () => [[0, 0], [255, 255]];
const NOADJ = () => ({ b: 0, c: 0, h: 0, d: 0, w: 0, t: 0, s: 0, v: 0, k: { m: IDENT(), r: IDENT(), g: IDENT(), b: IDENT() } });
const isNeutral = a => JSON.stringify(a) === JSON.stringify(NOADJ());
const cloneAdj = a => JSON.parse(JSON.stringify(a));

const ico = d => `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
const I = {
  plus: ico('<path d="M8 3v10M3 8h10"/>'),
  minus: ico('<path d="M3 8h10"/>'),
  x: ico('<path d="M4 4l8 8M12 4l-8 8"/>'),
  sliders: ico('<path d="M2 4h7M13 4h1M2 12h1M7 12h7M11 2v4M5 10v4"/>'),
  print: ico('<path d="M4.5 6V2.5h7V6M4.5 11.5h-2v-5h11v5h-2M4.5 9.5h7v4h-7z"/>'),
  dl: ico('<path d="M8 2v8M4.5 7 8 10.5 11.5 7M3 13.5h10"/>'),
  gear: ico('<circle cx="8" cy="8" r="2.2"/><path d="M8 1.5v1.6M8 12.9v1.6M1.5 8h1.6M12.9 8h1.6M3.4 3.4l1.1 1.1M11.5 11.5l1.1 1.1M3.4 12.6l1.1-1.1M11.5 4.5l1.1-1.1"/>'),
  chev: ico('<path d="M4 6l4 4 4-4"/>'),
  left: ico('<path d="M10 3L5 8l5 5"/>'),
  right: ico('<path d="M6 3l5 5-5 5"/>'),
  rot: ico('<path d="M13 8a5 5 0 1 1-1.6-3.7M13 2.5v3h-3"/>'),
  install: ico('<rect x="3" y="2" width="10" height="12" rx="2"/><path d="M8 5.5v4M6.3 8 8 9.7 9.7 8"/>')
};
