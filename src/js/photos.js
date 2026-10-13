/* Photo list and adding files. */
let uid = 0;
function renderPhotos() {
  const [w, h] = dims(), n = st.photos.length;
  $('#plist').innerHTML = st.photos.map((p, i) => {
    const edited = !isNeutral(p.adj);
    return `<li class="pc${p.fresh ? ' fresh' : ''}" data-i="${i}"><button class="pc-th" data-a="edit" type="button" aria-label="Edit ${esc(p.name)}"><img src="${p.thumb}" alt=""></button>` +
      `<div class="pc-m"><b>${esc(p.name)}</b><span>${w} × ${h} mm${edited ? ', edited' : ''}${p.dpi < 200 ? ', <em class="lo">low resolution</em>' : ''}</span></div>` +
      `<button class="ib x" data-a="del" type="button" aria-label="Remove ${esc(p.name)}">${I.x}</button>` +
      `<div class="step"><button data-a="dec" type="button" aria-label="One fewer">${I.minus}</button><input data-a="cnt" type="number" min="1" max="${MAXC}" inputmode="numeric" value="${p.copies}" aria-label="Copies of ${esc(p.name)}"><button data-a="inc" type="button" aria-label="One more">${I.plus}</button></div>` +
      `<button class="btn sm pe" data-a="edit" type="button">${I.sliders}Edit</button></li>`;
  }).join('');
  $('#pcount').innerHTML = n ? `${n} added${n > 1 ? ' <button class="lk" id="clearAll" type="button">Clear all</button>' : ''}` : '';
  st.photos.forEach(p => { p.fresh = false; });
  const b = $('#addPhotos'); b.classList.toggle('empty', !n);
  $('#addLab').innerHTML = I.plus + (n ? 'Add more photos' : 'Add photos');
}
$('#plist').addEventListener('click', e => {
  const b = e.target.closest('[data-a]'); if (!b) return;
  const li = b.closest('.pc'), i = +li.dataset.i, p = st.photos[i], a = b.dataset.a;
  if (a === 'edit') openEditor(i);
  else if (a === 'del') { const [rm] = st.photos.splice(i, 1); st.hover = -1; renderPhotos(); refresh(); toast('Photo removed', 7000, 'Undo', () => { st.photos.splice(i, 0, rm); renderPhotos(); refresh(); }); }
  else if (a === 'inc' || a === 'dec') { p.copies = clamp(p.copies + (a === 'inc' ? 1 : -1), 1, MAXC); li.querySelector('input').value = p.copies; refresh(); }
});
$('#pcount').addEventListener('click', e => {
  if (e.target.id !== 'clearAll') return;
  const all = st.photos.splice(0); st.hover = -1; renderPhotos(); refresh();
  toast(`${all.length} photos removed`, 7000, 'Undo', () => { st.photos.push(...all); renderPhotos(); refresh(); });
});
$('#plist').addEventListener('input', e => {
  if (e.target.dataset.a !== 'cnt' || e.target.value === '') return;
  st.photos[+e.target.closest('.pc').dataset.i].copies = clamp(Math.floor(+e.target.value) || 1, 1, MAXC); refresh();
});
$('#plist').addEventListener('pointerover', e => { const li = e.target.closest('.pc'); const i = li ? +li.dataset.i : -1; if (i !== st.hover) { st.hover = i; drawPreview(); } });
$('#plist').addEventListener('pointerleave', () => { if (st.hover !== -1) { st.hover = -1; drawPreview(); } });

function addFiles(files) {
  files = [...files]; if (!files.length || edEl.open || $('#set').open) return;
  const room = MAXP - st.photos.length; if (room <= 0) return toast(`You can add up to ${MAXP} photos.`);
  const skipped = Math.max(0, files.length - room);
  let pending = 0, added = 0, first = -1;
  const done = () => {
    if (--pending > 0) return;
    if ($('#toast').textContent === 'Adding photos…') toast('');
    renderPhotos(); refresh();
    if (added === 1 && first >= 0) openEditor(first);
    else if (added > 1) toast(`${added} photos added. Tap Edit on any photo to crop or adjust it.` + (skipped ? ` ${skipped} not added (limit is ${MAXP}).` : ''));
    else if (added === 1 && skipped) toast(`Only ${MAXP} photos fit. ${skipped} not added.`);
  };
  for (const f of files.slice(0, room)) {
    if (/\.(heic|heif)$/i.test(f.name) || /hei[cf]/.test(f.type)) { toast("HEIC photos aren't supported here. Pick the photo again from your gallery, or save it as JPG first."); continue; }
    if (!/^image\/(jpeg|png|webp)$/.test(f.type)) { toast('Choose JPG, PNG or WebP photos.'); continue; }
    if (f.size > 40e6) { toast('That photo is over 40 MB. Choose a smaller one.'); continue; }
    pending++;
    const im = new Image();
    im.onload = () => { const p = { id: ++uid, name: f.name, src: im, u: .5, v: .5, z: 1, adj: NOADJ(), copies: 6, fresh: true }; URL.revokeObjectURL(im.src); processPhoto(p); st.photos.push(p); added++; if (first < 0) first = st.photos.length - 1; done(); };
    im.onerror = () => { URL.revokeObjectURL(im.src); toast("A photo couldn't be read. Try a different JPG or PNG."); done(); };
    im.src = URL.createObjectURL(f);
  }
  if (pending) toast('Adding photos…', 30000);
}
