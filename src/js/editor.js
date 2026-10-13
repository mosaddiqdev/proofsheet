/* Crop + adjust dialog. Crop is stored as centre (u,v in 0..1) and zoom z, so it survives photo-size changes. */
const ED = { p: null, u: .5, v: .5, z: 1, adj: NOADJ(), work: null, fw: 0, fh: 0, s: 1, raf: 0, cmp: false, pick: false, hist: null };
const edEl = $('#ed'), cs = $('#cs'), pv = $('#pv'), fr = $('#fr');
const GROUPS = [['Light', [['b', 'Brightness'], ['c', 'Contrast'], ['h', 'Highlights'], ['d', 'Shadows']]], ['Color', [['w', 'Temperature'], ['t', 'Tint'], ['s', 'Saturation'], ['v', 'Vibrance']]]];

const coverRect = (nw, nh, a) => { let w = nw, h = w / a; if (h > nh) { h = nh; w = h * a; } return [w, h]; };
function cropRect(p, u, v, z) {
  const nw = p.src.naturalWidth, nh = p.src.naturalHeight, [w, h] = dims(), [bw, bh] = coverRect(nw, nh, w / h), cw = bw / z, ch = bh / z;
  return { x: clamp(u * nw - cw / 2, 0, nw - cw), y: clamp(v * nh - ch / 2, 0, nh - ch), w: cw, h: ch };
}
function processPhoto(p) {
  const [w, h] = dims(), r = cropRect(p, p.u, p.v, p.z), ow = Math.round(w / 25.4 * 300), oh = Math.round(h / 25.4 * 300), c = document.createElement('canvas');
  c.width = ow; c.height = oh; c.getContext('2d').drawImage(p.src, r.x, r.y, r.w, r.h, 0, 0, ow, oh);
  grade(c, p.adj); p.cv = c; p.dpi = Math.round(r.w / (w / 25.4));
  const t = document.createElement('canvas'); t.width = 72; t.height = Math.round(72 * oh / ow);
  t.getContext('2d').drawImage(c, 0, 0, t.width, t.height); p.thumb = t.toDataURL('image/jpeg', .7);
}

/* build adjust panel */
$('#adjList').innerHTML = GROUPS.map(([g, ls]) => `<div class="ag"><div class="agl">${g}</div>${ls.map(([k, n]) => `<label class="sl"><span class="sln">${n}<output id="o-${k}">0</output></span><input type="range" min="-100" max="100" value="0" data-k="${k}" aria-label="${n}"></label>`).join('')}</div>`).join('');
$('#adjIco').innerHTML = I.sliders; $('#rotIco').innerHTML = I.rot; $('#chev').innerHTML = I.chev;

function syncUI() {
  document.querySelectorAll('#adjList input').forEach(i => { const k = i.dataset.k; i.value = ED.adj[k]; $('#o-' + k).textContent = (ED.adj[k] > 0 ? '+' : '') + ED.adj[k]; });
  $('#zoom').value = ED.z; syncCurve();
}
function drawPV() {
  cancelAnimationFrame(ED.raf);
  ED.raf = requestAnimationFrame(() => { const wk = ED.work; pv.width = wk.width; pv.height = wk.height; pv.getContext('2d').drawImage(wk, 0, 0); grade(pv, ED.cmp ? NOADJ() : ED.adj); });
}
function paint() {
  const p = ED.p; if (!p) return;
  const nw = p.src.naturalWidth, nh = p.src.naturalHeight, [w, h] = dims(), [bw, bh] = coverRect(nw, nh, w / h), cw = bw / ED.z, ch = bh / ED.z;
  ED.u = clamp(ED.u, cw / 2 / nw, 1 - cw / 2 / nw); ED.v = clamp(ED.v, ch / 2 / nh, 1 - ch / 2 / nh);
  const s = ED.fw / cw; ED.s = s;
  pv.style.transform = `translate(-50%,-50%) translate(${-(ED.u * nw - nw / 2) * s}px,${-(ED.v * nh - nh / 2) * s}px) scale(${s})`;
  const dpi = Math.round(cw / (w / 25.4));
  const g = GUIDE[st.size], hr = g && fr.classList.contains('g') ? headRange(g, h).map(Math.round) : null;
  $('#frLab').textContent = `${w} × ${h} mm` + (dpi < 200 ? ', low resolution' : `, ${dpi} dpi`) + (hr ? ` · head ${hr[0]}–${hr[1]} mm` : '');
}
/* Head range in mm for a photo of height h. */
const headRange = (g, h) => g.pct ? g.pct.map(p => p * h) : g.mm;
/* Guide drawn in frame pixels: dashed oval = ideal head size, thin ovals = smallest and largest allowed,
   line = eye level, band = allowed eye zone (US sizes). Chin sits low in the frame, eyes about 55% of head height above it. */
function guideSVG(g, w, h, fw, fh) {
  const k = fh / h, [lo, hi] = headRange(g, h), m = (lo + hi) / 2, eyeUp = .55 * m;
  const chin = g.eye ? (g.eye[0] + g.eye[1]) / 2 - eyeUp : .12 * h, cx = fw / 2, yc = fh - chin * k;
  const ov = H => `<ellipse cx="${cx}" cy="${yc - H * k / 2}" rx="${H * k * .36}" ry="${H * k / 2}"/>`;
  const ey = yc - eyeUp * k, ex = m * k * .4, line = `<line x1="${cx - ex}" x2="${cx + ex}" y1="${ey}" y2="${ey}"/>`;
  const band = g.eye ? `<rect class="gz" x="0" width="${fw}" y="${fh - g.eye[1] * k}" height="${(g.eye[1] - g.eye[0]) * k}"/>` : '';
  return `${band}<g class="gb">${ov(m)}${line}</g><g class="gx">${ov(lo)}${ov(hi)}</g><g class="gw">${ov(m)}${line}</g>`;
}
function fitStage() {
  if (!ED.p) return;
  const [w, h] = dims(), a = w / h, SW = cs.clientWidth, SH = cs.clientHeight;
  let fw = SW * .84, fh = fw / a; if (fh > SH * .76) { fh = SH * .76; fw = fh * a; }
  ED.fw = fw; ED.fh = fh; fr.style.width = fw + 'px'; fr.style.height = fh + 'px';
  const g = GUIDE[st.size];
  $('#fgRow').hidden = !g; fr.classList.toggle('g', !!g && $('#fgOn').checked);
  $('#fgs').innerHTML = g ? guideSVG(g, w, h, fw, fh) : '';
  paint();
}
function openEditor(i) {
  const p = st.photos[i]; if (!p) return;
  Object.assign(ED, { p, u: p.u, v: p.v, z: p.z, adj: cloneAdj(p.adj), cmp: false }); setPick(false);
  ED.orig = null; rebuildWork();
  const [w, h] = dims(); $('#edSize').textContent = `${w} × ${h} mm`; $('#edT').textContent = p.name;
  edEl.classList.remove('adj'); $('#edAdj').setAttribute('aria-expanded', 'false');
  syncUI(); edEl.showModal(); requestAnimationFrame(() => { fitStage(); drawPV(); });
}
function rebuildWork() {
  const p = ED.p, nw = p.src.naturalWidth, nh = p.src.naturalHeight, f = Math.min(1, 900 / Math.max(nw, nh));
  const wk = document.createElement('canvas'); wk.width = Math.round(nw * f); wk.height = Math.round(nh * f);
  wk.getContext('2d').drawImage(p.src, 0, 0, wk.width, wk.height); ED.work = wk; ED.hist = histo(wk);
  pv.style.width = nw + 'px'; pv.style.height = nh + 'px';
}
/* rotate 90 degrees clockwise; the rotated canvas stands in for the image (it carries naturalWidth/Height like an Image) */
function rotateSrc(s) {
  const w = s.naturalWidth || s.width, h = s.naturalHeight || s.height, f = Math.min(1, 4096 / Math.max(w, h));
  const c = document.createElement('canvas'); c.width = Math.round(h * f); c.height = Math.round(w * f);
  const x = c.getContext('2d'); x.translate(c.width, 0); x.rotate(Math.PI / 2); x.drawImage(s, 0, 0, w * f, h * f);
  c.naturalWidth = c.width; c.naturalHeight = c.height; return c;
}
$('#edRot').onclick = () => {
  const p = ED.p; if (!ED.orig) ED.orig = { src: p.src };
  const u = ED.u, v = ED.v; p.src = rotateSrc(p.src); ED.u = 1 - v; ED.v = u;
  rebuildWork(); fitStage(); drawPV(); drawCurve();
};
const setZ = z => { ED.z = clamp(z, 1, 4); $('#zoom').value = ED.z; };

/* pan, pinch, wheel */
const ptr = new Map(); let pd = 0;
function setPick(on) { ED.pick = on; cs.classList.toggle('pick', on); $('#edPick').setAttribute('aria-pressed', on); if (on) toast('Tap a spot that should be white or grey.'); }
function pickAt(e) {
  const p = ED.p, r = cs.getBoundingClientRect(), nw = p.src.naturalWidth, nh = p.src.naturalHeight, wk = ED.work, f = wk.width / nw;
  const x = Math.round((ED.u * nw + (e.clientX - r.left - r.width / 2) / ED.s) * f), y = Math.round((ED.v * nh + (e.clientY - r.top - r.height / 2) / ED.s) * f);
  const d = wk.getContext('2d').getImageData(clamp(x - 3, 0, wk.width - 7), clamp(y - 3, 0, wk.height - 7), 7, 7).data;
  let R = 0, G = 0, B = 0; for (let i = 0; i < d.length; i += 4) { R += d[i]; G += d[i + 1]; B += d[i + 2]; } const n = d.length / 4; R /= n; G /= n; B /= n;
  if (R + B < 40 || G < 12) return toast('That spot is too dark. Pick something white or grey.');
  const w = clamp((B - R) / (B + R) / .0025, -100, 100), T = R * (1 + .0025 * w), t = clamp(500 * (1 - T / G), -100, 100);
  ED.adj.w = Math.round(w); ED.adj.t = Math.round(t); setPick(false); syncUI(); drawPV(); toast('White balance set from that spot.');
}
cs.addEventListener('pointerdown', e => { if (ED.pick) return pickAt(e); ptr.set(e.pointerId, [e.clientX, e.clientY]); cs.setPointerCapture(e.pointerId); pd = 0; });
cs.addEventListener('pointermove', e => {
  const q = ptr.get(e.pointerId); if (!q || !ED.p) return;
  const nw = ED.p.src.naturalWidth, nh = ED.p.src.naturalHeight;
  if (ptr.size === 1) { ED.u -= (e.clientX - q[0]) / ED.s / nw; ED.v -= (e.clientY - q[1]) / ED.s / nh; }
  ptr.set(e.pointerId, [e.clientX, e.clientY]);
  if (ptr.size === 2) { const [a, b] = [...ptr.values()], d = Math.hypot(a[0] - b[0], a[1] - b[1]); if (pd) setZ(ED.z * d / pd); pd = d; }
  paint();
});
const pup = e => { ptr.delete(e.pointerId); pd = 0; };
cs.addEventListener('pointerup', pup); cs.addEventListener('pointercancel', pup);
cs.addEventListener('wheel', e => { e.preventDefault(); setZ(ED.z * (e.deltaY < 0 ? 1.06 : .94)); paint(); }, { passive: false });
$('#zoom').oninput = e => { ED.z = +e.target.value; paint(); };
$('#fgOn').onchange = e => { fr.classList.toggle('g', e.target.checked && !!GUIDE[st.size]); paint(); };
new ResizeObserver(fitStage).observe(cs);

/* adjust panel */
$('#edAdj').onclick = () => { const o = edEl.classList.toggle('adj'); $('#edAdj').setAttribute('aria-expanded', o); setTimeout(drawCurve, 320); };
$('#adjList').addEventListener('input', e => { const k = e.target.dataset.k; if (!k) return; ED.adj[k] = +e.target.value; syncUI(); drawPV(); });
$('#adjList').addEventListener('dblclick', e => { const k = e.target.dataset.k; if (k) { ED.adj[k] = 0; syncUI(); drawPV(); } });
$('#edAuto').onclick = () => { Object.assign(ED.adj, autoAdj(ED.work)); syncUI(); drawPV(); };
$('#edCast').onclick = () => { ED.adj.k = { ...ED.adj.k, ...castCurves(ED.work) }; syncUI(); drawPV(); toast('Colour cast reduced. Fine-tune with Tint or the curves.'); };
$('#edPick').onclick = () => setPick(!ED.pick);
$('#edReset').onclick = () => { ED.adj = NOADJ(); syncUI(); drawPV(); };
const cmp = on => () => { ED.cmp = on; drawPV(); };
$('#edCmp').addEventListener('pointerdown', cmp(true));
['pointerup', 'pointerleave', 'pointercancel'].forEach(v => $('#edCmp').addEventListener(v, cmp(false)));

$('#edDone').onclick = () => {
  const p = ED.p; Object.assign(p, { u: ED.u, v: ED.v, z: ED.z, adj: cloneAdj(ED.adj) });
  processPhoto(p); ED.orig = null; edEl.close(); renderPhotos(); refresh();
};
$('#edCancel').onclick = () => edEl.close();
edEl.addEventListener('close', () => { if (ED.orig && ED.p) ED.p.src = ED.orig.src; ED.orig = null; ED.p = null; });
