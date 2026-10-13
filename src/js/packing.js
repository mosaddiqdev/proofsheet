/* How many photos fit on a sheet, and which photo sits in each slot. */
function layout() {
  const P = PAPERS[st.paper], [w, h] = dims(), m = S.margin, g = S.gap, uw = P[0] - 2 * m, uh = P[1] - 2 * m;
  const f = (a, b) => { const c = Math.max(0, Math.floor((uw + g) / (a + g))), r = Math.max(0, Math.floor((uh + g) / (b + g))); return { c, r, sw: a, sh: b, cap: c * r }; };
  const A = f(w, h), B = f(h, w), L = B.cap > A.cap ? { ...B, rot: true } : { ...A, rot: false };
  L.alt = A.cap; L.P = P;
  L.x0 = (P[0] - (L.c * L.sw + (L.c - 1) * g)) / 2; L.y0 = (P[1] - (L.r * L.sh + (L.r - 1) * g)) / 2;
  return L;
}
function plan(L) {
  const flat = [];
  st.photos.forEach((p, i) => { for (let k = 0; k < p.copies; k++) flat.push(i); });
  const total = L.cap ? flat.length : 0, sheets = L.cap ? Math.ceil(flat.length / L.cap) : 0, pages = [];
  for (let i = 0; i < sheets; i++) pages.push(flat.slice(i * L.cap, (i + 1) * L.cap));
  const pr = +S.pp[st.size] || 0;
  return { total, sheets, pages, pr, cost: total * pr };
}
function spread(L, R) {
  let free = R.sheets * L.cap - R.total;
  while (free > 0) {
    const open = st.photos.filter(p => p.copies < MAXC);
    if (!open.length) break;
    for (const p of open) { if (free <= 0) break; p.copies++; free--; }
  }
}
