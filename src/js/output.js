/* PDF (one page per sheet, exact paper size) and print. */
const ready = () => { const L = layout(), R = plan(L); return st.photos.length && L.cap && R.total && st.photos.every(p => p.cv) ? { L, R } : null; };

async function buildPDF(L, R) {
  const [W, H] = L.P, pw = (W / 25.4 * 72).toFixed(2), ph = (H / 25.4 * 72).toFixed(2), enc = new TextEncoder(), parts = [], offs = [];
  let len = 0;
  const put = d => { const b = typeof d === 'string' ? enc.encode(d) : d; parts.push(b); len += b.length; };
  const imgs = [], seen = new Map(), pages = [];
  for (const slots of R.pages) {
    const key = slots.join(',');
    if (!seen.has(key)) {
      const k = document.createElement('canvas'); drawSheet(k, L, slots, 300 / 25.4, false, -1);
      const blob = await new Promise(r => k.toBlob(r, 'image/jpeg', .95));
      seen.set(key, imgs.length); imgs.push({ b: new Uint8Array(await blob.arrayBuffer()), w: k.width, h: k.height });
    }
    pages.push(seen.get(key));
  }
  const base = 3 + imgs.length, max = 2 + imgs.length + pages.length * 2;
  put('%PDF-1.4\n');
  offs[1] = len; put('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n');
  offs[2] = len; put(`2 0 obj\n<< /Type /Pages /Count ${pages.length} /Kids [${pages.map((_, q) => `${base + q * 2} 0 R`).join(' ')}] >>\nendobj\n`);
  imgs.forEach((m, q) => {
    offs[3 + q] = len;
    put(`${3 + q} 0 obj\n<< /Type /XObject /Subtype /Image /Width ${m.w} /Height ${m.h} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${m.b.length} >>\nstream\n`);
    put(m.b); put('\nendstream\nendobj\n');
  });
  pages.forEach((im, q) => {
    const pid = base + q * 2, cid = pid + 1, ct = `q ${pw} 0 0 ${ph} 0 0 cm /Im0 Do Q`;
    offs[pid] = len; put(`${pid} 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pw} ${ph}] /Resources << /XObject << /Im0 ${3 + im} 0 R >> >> /Contents ${cid} 0 R >>\nendobj\n`);
    offs[cid] = len; put(`${cid} 0 obj\n<< /Length ${ct.length} >>\nstream\n${ct}\nendstream\nendobj\n`);
  });
  const xo = len; put(`xref\n0 ${max + 1}\n0000000000 65535 f \n`);
  for (let q = 1; q <= max; q++) put(String(offs[q]).padStart(10, '0') + ' 00000 n \n');
  put(`trailer\n<< /Size ${max + 1} /Root 1 0 R >>\nstartxref\n${xo}\n%%EOF`);
  return new Blob(parts, { type: 'application/pdf' });
}

$('#print').onclick = () => {
  const o = ready(); if (!o) return; const { L, R } = o, [W, H] = L.P, urls = new Map(), pages = [];
  for (const slots of R.pages) {
    const key = slots.join(',');
    if (!urls.has(key)) { const k = document.createElement('canvas'); drawSheet(k, L, slots, 300 / 25.4, false, -1); urls.set(key, k.toDataURL('image/jpeg', .95)); }
    pages.push(urls.get(key));
  }
  const doc = `<!doctype html><html><head><style>@page{size:${W}mm ${H}mm;margin:0}html,body{margin:0}img{display:block;width:${W}mm;height:${H}mm;break-after:page}img:last-child{break-after:auto}</style></head><body>${pages.map(u => `<img src="${u}">`).join('')}</body></html>`;
  const f = document.createElement('iframe'); f.setAttribute('aria-hidden', 'true'); f.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0';
  f.onload = () => setTimeout(() => { try { f.contentWindow.focus(); f.contentWindow.print(); } catch (e) { toast('Printing is blocked here. Use Download PDF and print the file.'); } }, 250);
  f.srcdoc = doc; document.body.appendChild(f); setTimeout(() => f.remove(), 300000);
  toast('Opening the print dialog. Set scale to 100% and margins to none. If nothing opens, use Download PDF and print the file.', 9000);
};

/* Plain browser download. */
async function saveBlob(blob, name) {
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; a.rel = 'noopener';
  document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 60000);
  return 'saved';
}
$('#dl').onclick = async () => {
  const o = ready(); if (!o) return; const { L, R } = o;
  $('#dl').disabled = true; $('#print').disabled = true; toast('Preparing PDF…', 30000);
  try {
    const blob = await buildPDF(L, R);
    const r = await saveBlob(blob, `${st.paper.replace(/\s/g, '').replace('×', 'x')}-${R.total}-photos.pdf`);
    toast(r === 'saved' ? 'PDF ready. Print it at 100% scale, no margins.' : '');
  } catch (e) { toast("The PDF couldn't be saved. Try again."); }
  refresh();
};
