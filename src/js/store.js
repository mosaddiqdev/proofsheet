/* State, saved settings, remembered choices, toast. */
function loadSettings() {
  try { const v = JSON.parse(localStorage.getItem('proofsheet-settings')); if (v) return { ...DEF, ...v, pp: { ...DEF.pp, ...v.pp } }; } catch (e) {}
  return JSON.parse(JSON.stringify(DEF));
}
function saveSettings() { try { localStorage.setItem('proofsheet-settings', JSON.stringify(S)); } catch (e) {} }
let S = loadSettings();

const st = { paper: 'A4', size: 'passport', cw: 40, ch: 50, photos: [], sheet: 0, hover: -1 };
try {
  const l = JSON.parse(localStorage.getItem('proofsheet-last'));
  if (l) { if (PAPERS[l.paper]) st.paper = l.paper; if (SIZES[l.size]) st.size = l.size; st.cw = +l.cw || st.cw; st.ch = +l.ch || st.ch; }
} catch (e) {}
const keep = () => { try { localStorage.setItem('proofsheet-last', JSON.stringify({ paper: st.paper, size: st.size, cw: st.cw, ch: st.ch })); } catch (e) {} };

const dims = () => st.size === 'custom' ? [clamp(st.cw, 10, 200), clamp(st.ch, 10, 200)] : [SIZES[st.size][1], SIZES[st.size][2]];
const money = n => S.cur + (Math.round(n * 100) / 100).toLocaleString();

function toast(t, ms = 4500, label, fn) {
  const e = $('#toast'); e.textContent = t;
  if (label) { const b = document.createElement('button'); b.type = 'button'; b.className = 'ta'; b.textContent = label; b.onclick = () => { e.classList.remove('on'); fn(); }; e.append(b); }
  e.classList.toggle('on', !!t); e.classList.toggle('act', !!label);
  clearTimeout(toast.t); if (t) toast.t = setTimeout(() => e.classList.remove('on'), ms);
}
