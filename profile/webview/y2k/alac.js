'use strict';
/* METALHEART // Y2K: Apple Lossless (ALAC) decoder for the seek bar's waveform + BPM scan.
   The WebView's audio engine can't decode ALAC, so this one does: it walks the .m4a's sample table and decodes
   each frame the same way Apple's open-source reference decoder does (adaptive Golomb residuals + LPC predictor +
   stereo unmix). alacDecode(arrayBuffer, outRate) returns { sampleRate, numberOfChannels, length, chans } at
   outRate (box-averaged down from the source rate; 0 keeps the source rate), or null if the file isn't ALAC.
   It is self-contained (helpers are nested) so the seek bar can run it in a worker via alacDecode.toString(). */
function alacDecode(buffer, outRate) {
  const u8 = new Uint8Array(buffer), dv = new DataView(buffer), len = u8.length;
  const tag = (o) => String.fromCharCode(u8[o], u8[o + 1], u8[o + 2], u8[o + 3]);

  /* ---- MP4: find the ALAC track and its sample table ---- */
  function boxes(start, end, fn) {
    for (let o = start; o + 8 <= end;) {
      let size = dv.getUint32(o), hdr = 8;
      if (size === 1) { size = Number(dv.getBigUint64(o + 8)); hdr = 16; } else if (size === 0) size = end - o;
      if (size < hdr || o + size > end) break;
      if (fn(tag(o + 4), o + hdr, o + size) === false) return false;
      o += size;
    }
    return true;
  }
  const child = (s, e, name) => { let r = null; boxes(s, e, (t, a, b) => { if (t === name) { r = [a, b]; return false; } }); return r; };
  let trk = null;
  const moov = child(0, len, 'moov');
  if (!moov) return null;
  boxes(moov[0], moov[1], (t, a, b) => {
    if (t !== 'trak') return;
    const stbl = [['mdia'], ['minf'], ['stbl']].reduce((r, [n]) => r && child(r[0], r[1], n), [a, b]);
    if (!stbl) return;
    const stsd = child(stbl[0], stbl[1], 'stsd');
    if (!stsd || tag(stsd[0] + 12) !== 'alac') return;
    const entry = stsd[0] + 8, eEnd = Math.min(stsd[1], entry + dv.getUint32(entry));
    let cfg = -1; // the 'alac' config box follows the sample entry's fields (28 or 44 bytes of them)
    for (let o = entry + 36; o + 36 <= eEnd; o++) if (tag(o + 4) === 'alac' && dv.getUint32(o) === 36) { cfg = o + 12; break; }
    if (cfg < 0) return;
    trk = { stbl, cfg };
    return false;
  });
  if (!trk) return null;
  const c = trk.cfg;
  const C = { frameLength: dv.getUint32(c), bitDepth: u8[c + 5], pb: u8[c + 6], mb: u8[c + 7], kb: u8[c + 8],
    channels: u8[c + 9], maxRun: dv.getUint16(c + 10), sampleRate: dv.getUint32(c + 20) };
  const st = (n) => child(trk.stbl[0], trk.stbl[1], n);
  const stsz = st('stsz'), stsc = st('stsc'), stco = st('stco'), co64 = st('co64');
  if (!stsz || !stsc || !(stco || co64)) return null;
  const fixed = dv.getUint32(stsz[0] + 4), nS = dv.getUint32(stsz[0] + 8);
  const sizes = new Uint32Array(nS);
  for (let i = 0; i < nS; i++) sizes[i] = fixed || dv.getUint32(stsz[0] + 12 + i * 4);
  const co = stco || co64, nC = dv.getUint32(co[0] + 4), chunks = new Float64Array(nC);
  for (let i = 0; i < nC; i++) chunks[i] = stco ? dv.getUint32(co[0] + 8 + i * 4) : Number(dv.getBigUint64(co[0] + 8 + i * 8));
  const nE = dv.getUint32(stsc[0] + 4), offs = new Float64Array(nS);
  for (let e = 0, s = 0; e < nE; e++) {
    const p = stsc[0] + 8 + e * 12, first = dv.getUint32(p) - 1, per = dv.getUint32(p + 4);
    const last = e + 1 < nE ? dv.getUint32(p + 12) - 1 : nC;
    for (let ch = first; ch < last && s < nS; ch++) { let o = chunks[ch]; for (let k = 0; k < per && s < nS; k++) { offs[s] = o; o += sizes[s++]; } }
  }

  /* ---- output: box-average down to outRate as frames are decoded ---- */
  const outCh = Math.min(2, Math.max(1, C.channels)), ratio = outRate > 0 ? C.sampleRate / outRate : 1;
  const cap = Math.ceil((nS * C.frameLength) / ratio) + 2, out = [], acc = [];
  for (let k = 0; k < outCh; k++) { out.push(new Float32Array(cap)); acc.push(0); }
  const scale = 1 / Math.pow(2, C.bitDepth - 1);
  let inPos = 0, outPos = 0, cnt = 0;
  function emit(frame, n, nch) {
    for (let i = 0; i < n; i++) {
      const o = Math.floor(inPos / ratio);
      if (o !== outPos && cnt) { for (let k = 0; k < outCh; k++) { out[k][outPos] = acc[k] / cnt; acc[k] = 0; } cnt = 0; outPos = o; }
      for (let k = 0; k < outCh; k++) acc[k] += frame[Math.min(k, nch - 1)][i] * scale;
      cnt++; inPos++;
    }
  }

  /* ---- bit reader (MSB first) ---- */
  let bp = 0, end = 0;
  const byte = (i) => (i < end ? u8[i] : 0);
  function peek32(pos) { const b = Math.floor(pos / 8); return ((byte(b) << 24) | (byte(b + 1) << 16) | (byte(b + 2) << 8) | byte(b + 3)) >>> 0; }
  function readAt(pos, n) { // up to 32 bits from any bit position
    if (!n) return 0;
    const sh = pos % 8, hi = peek32(pos), lo = byte(Math.floor(pos / 8) + 4);
    const v = sh ? ((hi << sh) | (lo >>> (8 - sh))) >>> 0 : hi;
    return n === 32 ? v : v >>> (32 - n);
  }
  const read = (n) => { const v = readAt(bp, n); bp += n; return v; };

  /* ---- adaptive Golomb residual decoder (Apple ag_dec.c) ---- */
  function dynGet(m, k) { // run lengths
    const sl = (peek32(bp) << (bp % 8)) >>> 0;
    let pre = Math.clz32(~sl >>> 0), r;
    if (pre >= 9) { r = readAt(bp + 9, 16); bp += 25; }
    else {
      const v = readAt(bp + pre + 1, k);
      bp += pre + 1 + k; r = pre * m + v - 1;
      if (v < 2) { r -= v - 1; bp -= 1; }
    }
    return r >>> 0;
  }
  function dynGet32(m, k, maxBits) {
    const sl = (peek32(bp) << (bp % 8)) >>> 0;
    let r = Math.clz32(~sl >>> 0);
    if (r >= 9) { const v = readAt(bp + 9, maxBits); bp += 9 + maxBits; return v; }
    const pre = r; bp += pre + 1;
    if (k !== 1) {
      const v = readAt(bp, k); bp += k - 1; r = pre * m;
      if (v >= 2) { r += v - 1; bp += 1; }
    }
    return r;
  }
  function dynDecomp(pc, n, chanBits, pbF) {
    const pb = (C.pb * pbF) >> 2, kb = C.kb, wb = (1 << kb) - 1;
    let mb = C.mb, zmode = 0, cI = 0;
    while (cI < n) {
      let k = 31 - Math.clz32((mb >>> 9) + 3); if (k > kb) k = kb;
      const m = (1 << k) - 1;
      const v = dynGet32(m, k, chanBits), nd = v + zmode;
      pc[cI++] = (nd & 1 ? -1 : 1) * Math.floor((nd + 1) / 2);
      mb = (pb * (v + zmode) + mb - (((pb * mb) >>> 0) >>> 9)) >>> 0;
      if (v > 0xffff) mb = 0xffff;
      zmode = 0;
      if (mb * 4 < 512 && cI < n) {
        zmode = 1;
        const kz = Math.clz32(mb) - 24 + ((mb + 16) >> 6), mz = ((1 << kz) - 1) & wb;
        const run = dynGet(mz, kz);
        if (cI + run > n) throw new Error('alac: run overflow');
        for (let j = 0; j < run; j++) pc[cI++] = 0;
        if (run >= 65535) zmode = 0;
        mb = 0;
      }
    }
  }
  /* ---- LPC predictor (Apple dp_dec.c unpc_block) ---- */
  const sgn = (x) => (x > 0) - (x < 0);
  function unpc(pc, out, n, coefs, act, chanBits, den) {
    const cs = 32 - chanBits, denHalf = den ? 1 << (den - 1) : 0, wrap = (x) => (x << cs) >> cs;
    out[0] = pc[0];
    if (act === 0) { for (let j = 1; j < n; j++) out[j] = pc[j]; return; }
    if (act === 31) { let prev = out[0]; for (let j = 1; j < n; j++) { prev = wrap(pc[j] + prev); out[j] = prev; } return; }
    for (let j = 1; j <= act && j < n; j++) out[j] = wrap(pc[j] + out[j - 1]);
    const lim = act + 1;
    for (let j = lim; j < n; j++) {
      const top = out[j - lim], b = j - 1;
      let sum = 0;
      for (let k = 0; k < act; k++) sum = (sum + Math.imul(coefs[k], out[b - k] - top)) | 0;
      let del = pc[j], del0 = del;
      const sg = sgn(del);
      del = (del + top + ((sum + denHalf) >> den)) | 0;
      out[j] = wrap(del);
      if (sg > 0) {
        for (let k = act - 1; k >= 0; k--) {
          const dd = top - out[b - k], s = sgn(dd);
          coefs[k] -= s; del0 -= (act - k) * ((s * dd) >> den);
          if (del0 <= 0) break;
        }
      } else if (sg < 0) {
        for (let k = act - 1; k >= 0; k--) {
          const dd = top - out[b - k], s = sgn(dd);
          coefs[k] += s; del0 -= (act - k) * ((-s * dd) >> den);
          if (del0 >= 0) break;
        }
      }
    }
  }

  /* ---- frames ---- */
  const FL = C.frameLength, pred = new Int32Array(FL), mixU = new Int32Array(FL), mixV = new Int32Array(FL);
  const shU = new Uint32Array(FL), shV = new Uint32Array(FL), pcm = [];
  function readCoefs() {
    let h = read(8); const mode = h >> 4, den = h & 15;
    h = read(8); const pbF = h >> 5, num = h & 31, coefs = new Int16Array(32);
    for (let i = 0; i < num; i++) coefs[i] = read(16);
    return { mode, den, pbF, num, coefs };
  }
  function channelDecode(p, dst, n, chanBits) {
    dynDecomp(pred, n, chanBits, p.pbF);
    if (p.mode === 0) unpc(pred, dst, n, p.coefs, p.num, chanBits, p.den);
    else { unpc(pred, pred, n, null, 31, chanBits, 0); unpc(pred, dst, n, p.coefs, p.num, chanBits, p.den); }
  }
  const signed = (v, n) => (n >= 32 ? v | 0 : (v << (32 - n)) >> (32 - n));
  function element(stereo) {
    read(4); read(12);
    const h = read(4), partial = h >> 3, shifted = (h >> 1) & 3, escape = h & 1;
    let n = FL;
    if (partial) n = Math.min(FL, ((read(16) << 16) | read(16)) >>> 0);
    let chanBits = C.bitDepth - shifted * 8 + (stereo ? 1 : 0), mixBits = 0, mixRes = 0, shiftPos = -1;
    if (!escape) {
      mixBits = read(8); mixRes = (read(8) << 24) >> 24;
      const pu = readCoefs(), pv = stereo ? readCoefs() : null;
      if (shifted) { shiftPos = bp; bp += shifted * 8 * n * (stereo ? 2 : 1); }
      channelDecode(pu, mixU, n, chanBits);
      if (stereo) channelDecode(pv, mixV, n, chanBits);
    } else {
      chanBits = C.bitDepth;
      for (let i = 0; i < n; i++) { mixU[i] = signed(read(chanBits), chanBits); if (stereo) mixV[i] = signed(read(chanBits), chanBits); }
    }
    const sh = shifted * 8;
    if (shiftPos >= 0) {
      const save = bp; bp = shiftPos;
      for (let i = 0; i < n; i++) { shU[i] = read(sh); if (stereo) shV[i] = read(sh); }
      bp = save;
    }
    const L = new Int32Array(n), R = stereo ? new Int32Array(n) : null;
    for (let i = 0; i < n; i++) {
      let l = mixU[i], r = 0;
      if (stereo) { const u = mixU[i], v = mixV[i]; if (mixRes) { l = u + v - ((mixRes * v) >> mixBits); r = l - v; } else { l = u; r = v; } }
      if (shiftPos >= 0) { l = (l << sh) | shU[i]; if (stereo) r = (r << sh) | shV[i]; }
      L[i] = l; if (stereo) R[i] = r;
    }
    pcm.push(L); if (stereo) pcm.push(R);
    return n;
  }
  for (let s = 0; s < nS; s++) {
    const o = offs[s], sz = sizes[s];
    if (o + sz > len) break;
    bp = o * 8; end = o + sz; pcm.length = 0;
    let n = 0;
    for (let guard = 0; guard < 64; guard++) {
      const t = read(3);
      if (t === 0 || t === 3) n = element(false);
      else if (t === 1) n = element(true);
      else if (t === 4) { read(4); const align = read(1); let cnt = read(8); if (cnt === 255) cnt += read(8); if (align) bp = Math.ceil(bp / 8) * 8; bp += cnt * 8; }
      else if (t === 6) { let cnt = read(4); if (cnt === 15) cnt += read(8) - 1; bp += cnt * 8; }
      else if (t === 7) break;
      else throw new Error('alac: unsupported element ' + t);
      if (bp > end * 8) throw new Error('alac: frame overrun');
    }
    if (pcm.length) emit(pcm, n, pcm.length);
  }
  if (cnt) { for (let k = 0; k < outCh; k++) out[k][outPos] = acc[k] / cnt; outPos++; }
  return { sampleRate: outRate > 0 ? outRate : C.sampleRate, numberOfChannels: outCh, length: outPos, chans: out.map((a) => a.subarray(0, outPos)), bitDepth: C.bitDepth, srcRate: C.sampleRate };
}
if (typeof module !== 'undefined') module.exports = alacDecode;
