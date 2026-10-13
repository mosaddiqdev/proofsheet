/* Colour pipeline. All tone work is baked into one 256-entry table per channel, then saturation runs per pixel.
   Done in plain JS so it works in every browser (canvas filter is missing in Safari).
   Curves use monotone cubic interpolation (Fritsch-Carlson), so they never overshoot between points. */
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };

function curveLUT(pts) {
  const P = [...pts].sort((a, b) => a[0] - b[0]), n = P.length, lut = new Float32Array(256);
  const xs = P.map(p => p[0]), ys = P.map(p => p[1]), dx = [], m = [], t = new Array(n);
  for (let i = 0; i < n - 1; i++) { dx[i] = (xs[i + 1] - xs[i]) || 1e-6; m[i] = (ys[i + 1] - ys[i]) / dx[i]; }
  t[0] = m[0]; t[n - 1] = m[n - 2];
  for (let i = 1; i < n - 1; i++) t[i] = m[i - 1] * m[i] <= 0 ? 0 : (m[i - 1] + m[i]) / 2;
  for (let i = 0; i < n - 1; i++) {
    if (m[i] === 0) { t[i] = t[i + 1] = 0; continue; }
    const a = t[i] / m[i], b = t[i + 1] / m[i], s = a * a + b * b;
    if (s > 9) { const k = 3 / Math.sqrt(s); t[i] = k * a * m[i]; t[i + 1] = k * b * m[i]; }
  }
  let seg = 0;
  for (let x = 0; x < 256; x++) {
    let y;
    if (x <= xs[0]) y = ys[0]; else if (x >= xs[n - 1]) y = ys[n - 1];
    else {
      while (seg < n - 2 && x >= xs[seg + 1]) seg++;
      const h = dx[seg], s = (x - xs[seg]) / h, s2 = s * s, s3 = s2 * s;
      y = (2 * s3 - 3 * s2 + 1) * ys[seg] + (s3 - 2 * s2 + s) * h * t[seg] + (-2 * s3 + 3 * s2) * ys[seg + 1] + (s3 - s2) * h * t[seg + 1];
    }
    lut[x] = clamp(y, 0, 255);
  }
  return lut;
}

function buildLUTs(a) {
  const M = curveLUT(a.k.m), C = [curveLUT(a.k.r), curveLUT(a.k.g), curveLUT(a.k.b)];
  const gain = [1 + a.w * .0025, 1 - a.t * .002, 1 - a.w * .0025];   // temperature: red/blue, tint: green (+ is magenta)
  const ex = Math.pow(2, -a.b / 100 * .9), cc = a.c / 100, hh = a.h / 100 * .25, dd = a.d / 100 * .25;
  return [0, 1, 2].map(ch => {
    const L = new Uint8ClampedArray(256);
    for (let i = 0; i < 256; i++) {
      let x = clamp(i / 255 * gain[ch], 0, 1);
      x = Math.pow(x, ex);
      if (cc > 0) x += (x * x * (3 - 2 * x) - x) * cc; else x = .5 + (x - .5) * (1 + cc * .6);
      x += hh * smooth(.45, 1, x) + dd * (1 - smooth(0, .55, x));
      x = M[Math.round(clamp(x, 0, 1) * 255)];
      L[i] = C[ch][Math.round(x)];
    }
    return L;
  });
}

function grade(cv, a) {
  if (isNeutral(a)) return cv;
  const x = cv.getContext('2d'), d = x.getImageData(0, 0, cv.width, cv.height), p = d.data, [LR, LG, LB] = buildLUTs(a);
  const sat = 1 + a.s / 100, vib = a.v / 100, useSat = a.s !== 0 || a.v !== 0;
  for (let i = 0; i < p.length; i += 4) {
    let r = LR[p[i]], g = LG[p[i + 1]], b = LB[p[i + 2]];
    if (useSat) {
      const mx = Math.max(r, g, b), mn = Math.min(r, g, b), k = sat * (1 + vib * (1 - (mx ? (mx - mn) / mx : 0))), l = .299 * r + .587 * g + .114 * b;
      r = l + (r - l) * k; g = l + (g - l) * k; b = l + (b - l) * k;
    }
    p[i] = r; p[i + 1] = g; p[i + 2] = b;
  }
  x.putImageData(d, 0, 0); return cv;
}

/* per-channel histograms (for the curve backdrop and the cast fixer) */
function sample(cv, n) { const t = document.createElement('canvas'); t.width = t.height = n; const x = t.getContext('2d'); x.drawImage(cv, 0, 0, n, n); return x.getImageData(0, 0, n, n).data; }
function histo(cv) {
  const p = sample(cv, 96), H = { m: new Float32Array(256), r: new Float32Array(256), g: new Float32Array(256), b: new Float32Array(256) };
  for (let i = 0; i < p.length; i += 4) { H.r[p[i]]++; H.g[p[i + 1]]++; H.b[p[i + 2]]++; H.m[Math.round(.299 * p[i] + .587 * p[i + 1] + .114 * p[i + 2])]++; }
  for (const k in H) { const mx = Math.max(...H[k].slice(1, 255)) || 1; for (let i = 0; i < 256; i++) H[k][i] = Math.min(1, H[k][i] / mx); }
  return H;
}
/* Auto: gentle brightness + contrast from the luminance spread */
function autoAdj(cv) {
  const p = sample(cv, 48), h = new Array(256).fill(0); let n = 0, m = 0;
  for (let i = 0; i < p.length; i += 4) { const l = Math.round(.299 * p[i] + .587 * p[i + 1] + .114 * p[i + 2]); h[l]++; m += l; n++; }
  m /= n; let a = 0, lo = 0, hi = 255;
  for (let i = 0; i < 256; i++) { a += h[i]; if (a >= n * .02) { lo = i; break; } }
  a = 0; for (let i = 255; i >= 0; i--) { a += h[i]; if (a >= n * .02) { hi = i; break; } }
  return { b: Math.round(clamp((128 - m) / 128 * 70, -35, 35)), c: Math.round(clamp((255 / Math.max(60, hi - lo) - 1) * 70, 0, 35)) };
}
/* Fix cast: move each channel's black and white point to the edge of its own histogram (limited), the classic levels fix */
function castCurves(cv) {
  const p = sample(cv, 64), n = p.length / 4, k = {};
  [['r', 0], ['g', 1], ['b', 2]].forEach(([c, o]) => {
    const h = new Array(256).fill(0); for (let i = 0; i < p.length; i += 4) h[p[i + o]]++;
    let a = 0, lo = 0, hi = 255;
    for (let i = 0; i < 256; i++) { a += h[i]; if (a >= n * .01) { lo = i; break; } }
    a = 0; for (let i = 255; i >= 0; i--) { a += h[i]; if (a >= n * .01) { hi = i; break; } }
    lo = Math.min(lo, 28); hi = Math.max(hi, 227);
    k[c] = [[lo, 0], [hi, 255]];
  });
  return k;
}
