/* Draws one sheet. slots = photo indexes for this sheet. hi = photo index to outline (preview only). */
function drawSheet(c, L, slots, ppm, guides, hi) {
  const [W, H] = L.P; c.width = Math.round(W * ppm); c.height = Math.round(H * ppm);
  const x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height); const g = S.gap;
  for (let k = 0; k < L.cap; k++) {
    const X = (L.x0 + (k % L.c) * (L.sw + g)) * ppm, Y = (L.y0 + Math.floor(k / L.c) * (L.sh + g)) * ppm, w = L.sw * ppm, h = L.sh * ppm;
    if (k < slots.length) {
      const p = st.photos[slots[k]];
      if (p && p.cv) {
        if (L.rot) { x.save(); x.translate(X + w / 2, Y + h / 2); x.rotate(Math.PI / 2); x.drawImage(p.cv, -h / 2, -w / 2, h, w); x.restore(); }
        else x.drawImage(p.cv, X, Y, w, h);
      } else { x.fillStyle = '#ECEBE7'; x.fillRect(X, Y, w, h); }
      if (S.cut) { x.strokeStyle = '#C4C3BE'; x.lineWidth = Math.max(1, ppm * .12); x.strokeRect(X, Y, w, h); }
      if (guides && hi >= 0 && slots[k] === hi) { x.strokeStyle = '#1D1D20'; x.lineWidth = Math.max(2, ppm * .5); x.strokeRect(X, Y, w, h); }
    } else if (guides) {
      x.setLineDash([ppm * 1.2, ppm * 1.2]); x.strokeStyle = '#D3D2CD'; x.lineWidth = Math.max(1, ppm * .15);
      x.strokeRect(X + .5, Y + .5, w - 1, h - 1); x.setLineDash([]);
    }
  }
}
