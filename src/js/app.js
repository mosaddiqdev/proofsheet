/* Wiring and screen refresh. Loaded last. */
const sheetEl = $('#sheet');
let curL = null, curR = null;

const glyph = (w, h, k) => { const f = k / Math.max(w, h); return `<span class="gl"><i class="pp" style="width:${Math.max(5, w * f)}px;height:${Math.max(5, h * f)}px"></i></span>`; };
$('#gear').innerHTML = I.gear; $('#print').innerHTML = I.print + 'Print'; $('#dl').innerHTML = I.dl + '<span class="lbl">Download PDF</span>';
$('#pgPrev').innerHTML = I.left; $('#pgNext').innerHTML = I.right;
$('#papers').innerHTML = Object.keys(PAPERS).map(k => `<button class="chip" type="button" data-k="${k}" aria-pressed="false">${glyph(PAPERS[k][0], PAPERS[k][1], 24)}<span class="t">${k}<small>${PAPERS[k][0]} × ${PAPERS[k][1]}</small></span></button>`).join('');
$('#sizes').innerHTML = Object.keys(SIZES).map(k => `<button class="chip" type="button" data-k="${k}" aria-pressed="false">${glyph(SIZES[k][1], SIZES[k][2], k === 'custom' ? 18 : Math.max(SIZES[k][1], SIZES[k][2]) * .45)}<span class="t">${SIZES[k][0]}<small>${k === 'custom' ? 'Set your own' : SIZES[k][1] + ' × ' + SIZES[k][2]}</small></span></button>`).join('');
$('#cw').value = st.cw; $('#ch').value = st.ch;

function reprocess() { st.photos.forEach(processPhoto); renderPhotos(); refresh(); }
$('#papers').onclick = e => { const b = e.target.closest('.chip'); if (b) { st.paper = b.dataset.k; st.sheet = 0; refresh(); } };
$('#sizes').onclick = e => { const b = e.target.closest('.chip'); if (b) { st.size = b.dataset.k; reprocess(); } };
let rt = 0; const later = () => { clearTimeout(rt); rt = setTimeout(reprocess, 300); };
$('#cw').oninput = e => { st.cw = +e.target.value || 10; later(); };
$('#ch').oninput = e => { st.ch = +e.target.value || 10; later(); };
$('#fillBtn').onclick = () => { spread(curL, curR); renderPhotos(); refresh(); };
$('#pgPrev').onclick = () => { st.sheet--; refresh(); };
$('#pgNext').onclick = () => { st.sheet++; refresh(); };

function fit() {
  const s = $('.stage'), L = curL; if (!L) return;
  const c = getComputedStyle(s), aw = s.clientWidth - parseFloat(c.paddingLeft) * 2 - 28;
  const ah = s.clientHeight - parseFloat(c.paddingTop) * 2 - 24 - $('.under').offsetHeight - (parseFloat(c.rowGap) || 14);
  const r = L.P[0] / L.P[1], w = Math.max(60, Math.min(aw, ah * r));
  sheetEl.style.width = w + 'px'; sheetEl.style.height = w / r + 'px';
}
function drawPreview() {
  if (!curL) return;
  drawSheet(sheetEl, curL, curR.pages[st.sheet] || [], Math.min(6, 1300 / Math.max(...curL.P)), true, st.hover);
}
function refresh() {
  const L = layout(), R = plan(L), n = st.photos.length; curL = L; curR = R;
  st.sheet = clamp(st.sheet, 0, Math.max(0, R.sheets - 1));
  document.querySelectorAll('#papers .chip').forEach(b => b.setAttribute('aria-pressed', b.dataset.k === st.paper));
  document.querySelectorAll('#sizes .chip').forEach(b => b.setAttribute('aria-pressed', b.dataset.k === st.size));
  $('#custom').hidden = st.size !== 'custom';

  const sh = c => `${c} sheet${c === 1 ? '' : 's'}`, ph = `${R.total} photo${R.total === 1 ? '' : 's'}`;
  $('#priceBox').hidden = !S.showPrice; $('#price').textContent = L.cap && R.total ? money(R.cost) : '–';
  if (!L.cap) { $('#line1').textContent = 'Photo is larger than the paper'; $('#line2').textContent = 'Choose a bigger sheet or smaller size'; }
  else if (!n) { $('#line1').textContent = 'No photos yet'; $('#line2').textContent = 'Add a photo to start'; }
  else { $('#line1').textContent = S.showPrice ? `${ph} × ${money(R.pr)}` : ph; $('#line2').textContent = `${sh(R.sheets)} of ${st.paper}`; }
  const free = L.cap && n ? R.sheets * L.cap - R.total : 0, fb = $('#fillBtn');
  fb.hidden = !(free > 0); if (free > 0) fb.textContent = `Fill the last sheet (${free} spot${free === 1 ? '' : 's'} free)`;
  const ok = !!ready(); $('#print').disabled = !ok; $('#dl').disabled = !ok;

  $('#pager').hidden = R.sheets < 2; $('#pgLab').textContent = `Sheet ${st.sheet + 1} of ${R.sheets}`;
  $('#pgPrev').disabled = st.sheet <= 0; $('#pgNext').disabled = st.sheet >= R.sheets - 1;
  sheetEl.setAttribute('aria-label', L.cap ? `${st.paper} sheet preview with ${(R.pages[st.sheet] || []).length} of ${L.cap} photo spots filled` : 'Sheet preview');
  $('#dx').textContent = L.P[0] + ' mm'; $('#dy').textContent = L.P[1] + ' mm';
  $('#cap').textContent = L.cap ? `${L.cap} photos fit on one ${st.paper} sheet` + (L.rot ? `, turned sideways (${L.alt} if upright)` : '') : '';
  $('#addwrap').hidden = n > 0;
  drawPreview(); fit(); keep();
}

/* adding photos: button, file input, drop anywhere, paste */
document.querySelectorAll('.fin').forEach(i => i.addEventListener('change', e => { addFiles(e.target.files); e.target.value = ''; }));
addEventListener('dragover', e => { e.preventDefault(); document.body.classList.add('drag'); });
addEventListener('dragleave', e => { if (!e.relatedTarget) document.body.classList.remove('drag'); });
addEventListener('drop', e => { e.preventDefault(); document.body.classList.remove('drag'); if (e.dataTransfer) addFiles(e.dataTransfer.files); });
document.addEventListener('paste', e => { const fs = [...(e.clipboardData?.files || [])].filter(f => f.type.startsWith('image/')); if (fs.length) addFiles(fs); });

new ResizeObserver(fit).observe($('.stage'));
renderPhotos(); refresh();
