/* Curve editor: RGB plus R, G, B channels. Click to add a point, drag to move, double-click to remove. */
const CH = { m: ['RGB', ''], r: ['R', '#e5484d'], g: ['G', '#30a46c'], b: ['B', '#3e63dd'] };
const CVS = { ch: 'm', drag: -1 };
const cvEl = $('#curve');
$('#chTabs').innerHTML = Object.keys(CH).map(k => `<button class="q ct" type="button" data-ch="${k}" aria-pressed="${k === 'm'}"><i style="background:${CH[k][1] || 'currentColor'}"></i>${CH[k][0]}</button>`).join('');
const curPts = () => ED.adj.k[CVS.ch];

function drawCurve() {
  if (!ED.p) return;
  const S = cvEl.clientWidth; if (!S) return; const d = devicePixelRatio || 1;
  cvEl.width = cvEl.height = Math.round(S * d); const x = cvEl.getContext('2d'); x.scale(d, d);
  const css = getComputedStyle(cvEl), col = CH[CVS.ch][1] || css.color, grid = css.getPropertyValue('--line2') || '#ccc', P = curPts(), k = S / 255;
  x.strokeStyle = grid; x.lineWidth = 1; x.globalAlpha = .6;
  for (let i = 1; i < 4; i++) { x.beginPath(); x.moveTo(i * S / 4, 0); x.lineTo(i * S / 4, S); x.moveTo(0, i * S / 4); x.lineTo(S, i * S / 4); x.stroke(); }
  x.globalAlpha = .22; x.fillStyle = col; const h = ED.hist && ED.hist[CVS.ch];
  if (h) for (let i = 0; i < 256; i++) x.fillRect(i * k, S - h[i] * S * .9, Math.max(1, k), h[i] * S * .9);
  x.globalAlpha = .5; x.setLineDash([4, 4]); x.beginPath(); x.moveTo(0, S); x.lineTo(S, 0); x.stroke(); x.setLineDash([]); x.globalAlpha = 1;
  const lut = curveLUT(P); x.strokeStyle = col; x.lineWidth = 2; x.beginPath();
  for (let i = 0; i < 256; i++) { const X = i * k, Y = S - lut[i] * k; i ? x.lineTo(X, Y) : x.moveTo(X, Y); } x.stroke();
  P.forEach(p => { x.beginPath(); x.arc(p[0] * k, S - p[1] * k, 5, 0, 7); x.fillStyle = css.backgroundColor === 'rgba(0, 0, 0, 0)' ? '#fff' : css.backgroundColor; x.fill(); x.strokeStyle = col; x.lineWidth = 2; x.stroke(); });
}
function syncCurve() {
  document.querySelectorAll('#chTabs .ct').forEach(b => b.setAttribute('aria-pressed', b.dataset.ch === CVS.ch));
  drawCurve();
}
const cpos = e => { const r = cvEl.getBoundingClientRect(); return [clamp((e.clientX - r.left) / r.width * 255, 0, 255), clamp(255 - (e.clientY - r.top) / r.height * 255, 0, 255)]; };
function nearest(x, y) {
  const P = curPts(), r = 16 / (cvEl.getBoundingClientRect().width / 255); let best = -1, bd = r;
  P.forEach((p, i) => { const dd = Math.hypot(p[0] - x, p[1] - y); if (dd < bd) { bd = dd; best = i; } }); return best;
}
function movePt(e) {
  const P = curPts(), i = CVS.drag; if (i < 0) return; const [x, y] = cpos(e);
  const lo = i > 0 ? P[i - 1][0] + 1 : 0, hi = i < P.length - 1 ? P[i + 1][0] - 1 : 255;
  P[i] = [Math.round(clamp(x, lo, hi)), Math.round(y)]; drawCurve(); drawPV();
}
cvEl.addEventListener('pointerdown', e => {
  const P = curPts(), [x, y] = cpos(e); let i = nearest(x, y);
  if (i < 0) { if (P.length >= 12) return; const np = [Math.round(x), Math.round(y)]; P.push(np); P.sort((a, b) => a[0] - b[0]); i = P.indexOf(np); }
  CVS.drag = i; cvEl.setPointerCapture(e.pointerId); movePt(e);
});
cvEl.addEventListener('pointermove', e => { if (CVS.drag >= 0) movePt(e); });
const cend = () => { CVS.drag = -1; };
cvEl.addEventListener('pointerup', cend); cvEl.addEventListener('pointercancel', cend);
cvEl.addEventListener('dblclick', e => { const P = curPts(), [x, y] = cpos(e), i = nearest(x, y); if (i >= 0 && P.length > 2) { P.splice(i, 1); drawCurve(); drawPV(); } });
$('#chTabs').addEventListener('click', e => { const b = e.target.closest('[data-ch]'); if (b) { CVS.ch = b.dataset.ch; syncCurve(); } });
$('#curveReset').onclick = () => { ED.adj.k[CVS.ch] = IDENT(); drawCurve(); drawPV(); };
new ResizeObserver(drawCurve).observe(cvEl);
