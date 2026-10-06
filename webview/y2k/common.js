/* ==========================================================================
   METALHEART // Y2K — shared runtime for the foobar2000 WebView2 panels.
   Talks to foo_webview2's host object; no external dependencies.
   ========================================================================== */
'use strict';

const Y2K = (() => {
  const H = chrome.webview.hostObjects.sync.foo_uie_webview;
  const BS = String.fromCharCode(92);           // backslash, kept out of literals on purpose
  const SEP = String.fromCharCode(30);          // record separator used in title-formatting output
  const toFwd = (p) => (p || '').split(BS).join('/');

  const safe = (fn, fallback = '') => { try { const v = fn(); return v === undefined || v === null ? fallback : v; } catch (e) { return fallback; } };
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const log = (...a) => safe(() => H.print('[Y2K] ' + a.join(' ')));

  /* ------------------------------------------------------------------ fields
     Picard writes Vorbis-style names (FLAC/Ogg/Opus). For ID3/MP4 foobar2000
     exposes the same data either under those names or the TXXX description,
     so every field is a list of aliases tried in order.                      */
  const META = {
    title: ['title'], artist: ['artist'], artists: ['artists'], album: ['album'],
    albumartist: ['album artist', 'albumartist'],
    date: ['date'], originaldate: ['originaldate', 'original date', 'original release date'], originalyear: ['originalyear'],
    tracknumber: ['tracknumber'], totaltracks: ['totaltracks', 'tracktotal'],
    discnumber: ['discnumber'], totaldiscs: ['totaldiscs', 'disctotal'], discsubtitle: ['discsubtitle', 'setsubtitle'],
    media: ['media'], label: ['label', 'publisher', 'organization'], catalognumber: ['catalognumber'],
    barcode: ['barcode', 'upc', 'ean'], asin: ['asin'],
    releasecountry: ['releasecountry', 'musicbrainz album release country'],
    releasetype: ['releasetype', 'musicbrainz album type'], releasestatus: ['releasestatus', 'musicbrainz album status'],
    script: ['script'], language: ['language'], genre: ['genre'], style: ['style'], mood: ['mood'],
    bpm: ['bpm'], key: ['initialkey', 'key'], isrc: ['isrc'],
    composer: ['composer'], lyricist: ['lyricist'], writer: ['writer'], arranger: ['arranger'],
    conductor: ['conductor'], performer: ['performer'], producer: ['producer'], engineer: ['engineer'],
    mixer: ['mixer'], djmixer: ['djmixer'], remixer: ['remixer', 'mixartist'],
    work: ['work'], movement: ['movement', 'movementname'], grouping: ['grouping', 'contentgroup'],
    copyright: ['copyright'], license: ['license'], comment: ['comment'],
    encodedby: ['encodedby', 'encoded by'], encodersettings: ['encodersettings', 'encoder settings'],
    mb_recording: ['musicbrainz_trackid', 'musicbrainz track id'],
    mb_releasetrack: ['musicbrainz_releasetrackid', 'musicbrainz release track id'],
    mb_release: ['musicbrainz_albumid', 'musicbrainz album id'],
    mb_releasegroup: ['musicbrainz_releasegroupid', 'musicbrainz release group id'],
    mb_artist: ['musicbrainz_artistid', 'musicbrainz artist id'],
    mb_albumartist: ['musicbrainz_albumartistid', 'musicbrainz album artist id'],
    mb_work: ['musicbrainz_workid', 'musicbrainz work id'],
    mb_discid: ['musicbrainz_discid', 'musicbrainz disc id'],
    acoustid: ['acoustid_id', 'acoustid id'],
    artistcountry: ['artistcountry', 'artist country', 'musicbrainz artist country'],
  };
  const TECH = {
    path: '[%path%]', dir: '[$directory_path(%path%)]', filename: '[%filename_ext%]', subsong: '[%subsong%]',
    codec: '[%codec%]', codecprofile: '[%codec_profile%]', bitrate: '[%bitrate%]', samplerate: '[%samplerate%]',
    bits: '[$info(bitspersample)]', channels: '[%channels%]', encoding: '[$info(encoding)]',
    filesize: '[%filesize_natural%]', length: '[%length%]', lengthsec: '[%length_seconds%]', tool: '[$info(tool)]',
    rg_tg: '[%replaygain_track_gain%]', rg_ag: '[%replaygain_album_gain%]', rg_tp: '[%replaygain_track_peak%]', rg_ap: '[%replaygain_album_peak%]',
    playcount: '[%play_count%]', firstplayed: '[%first_played%]', lastplayed: '[%last_played%]', added: '[%added%]', rating: '[%rating%]',
    tracknum: '[%tracknumber%]', discnum: '[%discnumber%]', year: "$year($if3($meta(date),$meta(originaldate),))",
    md5: '[$info(md5)]', cuesheet: '$if(%cuesheet%,1,)',
    lrcname: '$replace([%artist% - ][%title%],/,-,\\,-,<,-,>,-,:,-,",-,|,-,?,-,*,-)',
  };
  const tfAlias = (names) => {
    const parts = names.map((n) => "$meta_sep(" + n + ",'; ')");
    return parts.length === 1 ? parts[0] : '$if3(' + parts.join(',') + ',)';
  };
  const KEYS = [...Object.keys(META), ...Object.keys(TECH)];
  const SCRIPT = KEYS.map((k) => (META[k] ? tfAlias(META[k]) : TECH[k])).join('$char(30)');

  const parseFields = (s) => {
    const v = String(s || '').split(SEP);
    const o = {};
    KEYS.forEach((k, i) => { o[k] = (v[i] || '').trim(); });
    o.list = (k) => (o[k] ? o[k].split(/;\s*/).filter(Boolean) : []);
    return o;
  };

  /** Current track: now playing, else the focused item of the active playlist. */
  function getTrack() {
    let src = 'none', raw = '';
    if (safe(() => H.isPlaying, false)) {
      raw = safe(() => H.nowPlaying(SCRIPT));
      src = 'playing';
    } else {
      const pl = safe(() => H.activePlaylist, -1);
      const idx = pl >= 0 ? safe(() => H.getFocusedPlaylistItem(pl), -1) : -1;
      if (idx >= 0) { raw = safe(() => H.getPlaylistItemFormattedText(pl, idx, SCRIPT)); src = 'focused'; }
      var focusPl = pl, focusIdx = idx;
    }
    if (!raw || raw.split(SEP).length < KEYS.length - 2) return { _src: 'none', list: () => [] };
    const t = parseFields(raw);
    t._src = src;
    t._paused = safe(() => H.isPaused, false);
    if (src === 'focused') { t._pl = focusPl; t._idx = focusIdx; }
    t._key = t.path + '|' + t.subsong;
    t._local = /^[A-Za-z]:/.test(t.path) || t.path.startsWith(BS + BS);
    t._dirFwd = t._local ? toFwd(t.dir) : '';
    return t;
  }

  /* --------------------------------------------------------------- files */
  const dirCache = new Map();
  function listDir(dirFwd) {
    if (!dirFwd) return [];
    const hit = dirCache.get(dirFwd);
    if (hit && Date.now() - hit.t < 20000) return hit.v;
    let v = [];
    try {
      const raw = H.readDirectory(dirFwd, '*.*');
      try { v = JSON.parse(raw); }
      catch (e) { // tolerate unescaped characters in names
        v = [...String(raw).matchAll(/"name":\s*"(.*?)",\s*"size":\s*(\d+),\s*"isDirectory":\s*(true|false)/g)]
          .map((m) => ({ name: m[1], size: +m[2], isDirectory: m[3] === 'true' }));
      }
    } catch (e) { v = []; }
    dirCache.set(dirFwd, { t: Date.now(), v });
    return v;
  }
  const readText = (pathFwd) => safe(() => H.readAllText(pathFwd, 65001), '');
  const readImage = (pathFwd) => safe(() => H.readImage(pathFwd), '');

  /* ------------------------------------------------------------- artwork
     Priority: folder.* > cover.* > front.* > embedded > any other image in
     the folder (or a scans/artwork subfolder) > nothing.                    */
  const IMG = /\.(jpe?g|png|webp|gif|bmp|jfif)$/i;
  const artCache = new Map();
  function resolveArt(t) {
    if (!t || t._src === 'none') return { src: '', origin: 'none' };
    const ck = t.dir + '|' + (t._src !== 'none' ? t._key : '');
    if (artCache.has(ck)) return artCache.get(ck);
    let res = null;
    const files = t._local ? listDir(t._dirFwd) : [];
    const imgs = files.filter((f) => !f.isDirectory && IMG.test(f.name));
    const pick = (stem, list, base) => {
      const f = list.find((x) => x.name.replace(IMG, '').toLowerCase() === stem);
      return f ? { src: readImage(base + '/' + f.name), origin: f.name } : null;
    };
    for (const stem of ['folder', 'cover', 'front']) {
      res = pick(stem, imgs, t._dirFwd);
      if (res && res.src) break;
      res = null;
    }
    if (!res && t._src === 'playing') {
      const emb = safe(() => H.getArtwork('front'));
      if (emb) res = { src: emb, origin: 'embedded' };
    }
    if (!res && t._src === 'focused' && t._idx >= 0) {
      const emb = safe(() => H.getPlaylistArtwork('front', t._pl, t._idx));
      if (emb) res = { src: emb, origin: 'embedded' };
    }
    if (!res && t._local) {
      // scans/artwork subfolders
      const sub = files.find((f) => f.isDirectory && /^[-_ ]*(scans?|artwork|covers?|images?|art)$/i.test(f.name));
      if (sub) {
        const base = t._dirFwd + '/' + sub.name;
        const simgs = listDir(base).filter((f) => !f.isDirectory && IMG.test(f.name));
        for (const stem of ['folder', 'cover', 'front']) { res = pick(stem, simgs, base); if (res && res.src) break; res = null; }
        if (!res && simgs.length) {
          const f = simgs.find((x) => /front|cover|folder/i.test(x.name)) || null;
          if (f) res = { src: readImage(base + '/' + f.name), origin: sub.name + '/' + f.name };
        }
      }
      if (!res && imgs.length) {
        const f = imgs.find((x) => /front|cover|folder|album/i.test(x.name)) || imgs.slice().sort((a, b) => b.size - a.size)[0];
        res = { src: readImage(t._dirFwd + '/' + f.name), origin: f.name };
      }
    }
    if (!res && t._src !== 'playing') res = { src: '', origin: 'none' };
    res = res && res.src ? res : { src: '', origin: 'none' };
    if (artCache.size > 40) artCache.clear();
    artCache.set(ck, res);
    return res;
  }

  /* --------------------------------------------------------------- rip logs */
  const RIPPERS = [
    [/Exact Audio Copy V\s*([^\s]+(?: beta \d+)?)/i, 'EAC'],
    [/EAC extraction logfile/i, 'EAC'],
    [/X Lossless Decoder version\s*([^\s]+)/i, 'XLD'],
    [/CUERipper\s*v?([\d.]+)/i, 'CUERipper'],
    [/dBpoweramp\s+Release\s*([\d.]+)/i, 'dBpoweramp'],
    [/Log created by:\s*whipper\s*([^\s]+)/i, 'whipper'],
    [/whipper\s+([\d.]+)/i, 'whipper'],
    [/Rubyripper version\s*([^\s]+)/i, 'Rubyripper'],
    [/EZ CD Audio Converter\s*([\d.]+)/i, 'EZ CD Audio Converter'],
    [/morituri version\s*([^\s]+)/i, 'morituri'],
  ];
  const UTF16_FIRST = { E: 'EAC', X: 'XLD', C: 'CUERipper', d: 'dBpoweramp' };

  function parseRipLog(text, trackNo) {
    const r = { ripper: '', version: '' };
    for (const [re, name] of RIPPERS) {
      const m = text.match(re);
      if (m) { r.ripper = name; r.version = (m[1] || '').replace(/[,;]$/, ''); break; }
    }
    if (!r.ripper) return null;
    const g = (re) => { const m = text.match(re); return m ? m[1].trim() : ''; };
    r.date = g(/(?:extraction logfile from|logfile from)\s*([^\r\n]+)/i) || g(/Log creation date:\s*([^\r\n]+)/i);
    r.drive = g(/Used drive\s*:\s*([^\r\n]+?)(?:\s+Adapter:.*)?$/im) || g(/^\s*Drive:\s*([^\r\n]+)/im);
    r.readMode = g(/Read mode\s*:\s*([^\r\n]+)/i) || g(/Ripper mode\s*:\s*([^\r\n]+)/i);
    r.offset = g(/Read offset correction\s*:\s*([-+\d]+)/i) || g(/Read offset correction:\s*([-+\d]+)/i);
    r.c2 = g(/Make use of C2 pointers\s*:\s*([^\r\n]+)/i) || g(/Use C2 Error Pointers\s*:\s*([^\r\n]+)/i);
    r.gap = g(/Gap handling\s*:\s*([^\r\n]+)/i);
    r.format = g(/Used output format\s*:\s*([^\r\n]+)/i) || g(/Output format\s*:\s*([^\r\n]+)/i);
    r.ar = g(/(All tracks accurately ripped|\d+ out of \d+ tracks? accurately ripped|None of the tracks are present in the AccurateRip database|No tracks could be verified as accurate|Some tracks could not be verified as accurate)/i)
        || g(/AccurateRip Summary[\s\S]{0,200}?->\s*([^\r\n]+)/i);
    r.errors = /No errors occurr?ed/i.test(text) ? 'No errors' : /There were errors|Some inconsistencies/i.test(text) ? 'Errors reported' : '';
    r.checksum = g(/==== Log checksum\s+([0-9A-F]+)\s+====/i) ? 'EAC log checksum present'
               : /BEGIN XLD SIGNATURE/i.test(text) ? 'XLD signature present' : '';
    r.ok = /All tracks accurately ripped|No errors occurr?ed/i.test(text) && !/There were errors/i.test(text);
    // per-track section
    if (trackNo) {
      const n = parseInt(trackNo, 10);
      const re = new RegExp('(?:^|\\n)\\s*Track\\s+0*' + n + '\\s*\\r?\\n([\\s\\S]*?)(?=\\n\\s*Track\\s+\\d+\\s*\\r?\\n|\\n\\s*(?:No errors|There were errors|AccurateRip Summary|All tracks|None of the tracks|==== Log checksum|End of status report)|$)', 'i');
      const m = text.match(re);
      if (m) {
        const s = m[1];
        const tg = (x) => { const k = s.match(x); return k ? k[1].trim() : ''; };
        r.track = {
          peak: tg(/Peak level\s*([\d.]+\s*%)/i),
          copyCRC: tg(/Copy CRC\s*([0-9A-F]{8})/i) || tg(/CRC32 hash\s*:\s*([0-9A-F]{8})/i),
          testCRC: tg(/Test CRC\s*([0-9A-F]{8})/i),
          ar: tg(/(Accurately ripped[^\r\n]*)/i) || tg(/AccurateRip v\d signature[^\r\n]*\r?\n\s*->\s*([^\r\n]+)/i) || tg(/(Cannot be verified as accurate[^\r\n]*)/i) || tg(/(Track not present in AccurateRip database)/i),
          status: tg(/(Copy OK|Copy finished|Suspicious position[^\r\n]*)/i),
        };
      }
    }
    return r;
  }

  const logCache = new Map();
  function findRipLog(t) {
    if (!t || !t._local) return null;
    const ck = t.dir + '|' + t.tracknum;
    if (logCache.has(ck)) return logCache.get(ck);
    const logs = listDir(t._dirFwd).filter((f) => !f.isDirectory && /\.log$/i.test(f.name));
    let out = null;
    // prefer logs that look like rip logs: name contains album/artist, then biggest
    logs.sort((a, b) => b.size - a.size);
    for (const f of logs) {
      if (/audiochecker|spectro|lac\b|auCDtect|install|debug/i.test(f.name)) continue;
      const p = t._dirFwd + '/' + f.name;
      const txt = readText(p);
      const looksUtf16 = !txt || txt.length < Math.min(64, f.size / 4) || txt.charCodeAt(0) === 0xFFFD || txt.startsWith('ÿþ');
      if (!looksUtf16) {
        const parsed = parseRipLog(txt, t.tracknum);
        if (parsed) { out = Object.assign(parsed, { file: f.name, path: p, encoding: 'UTF-8' }); break; }
      } else {
        // foo_webview2 can only decode multi-byte text; read the first character via ANSI to identify the ripper
        const ansi = safe(() => H.readAllText(p, 1252), '');
        const first = ansi.replace(/^ÿþ|^﻿/, '').charAt(0);
        if (UTF16_FIRST[first]) {
          out = { ripper: UTF16_FIRST[first], version: '', file: f.name, path: p, encoding: 'UTF-16', utf16: true };
          break;
        }
      }
    }
    if (logCache.size > 40) logCache.clear();
    logCache.set(ck, out);
    return out;
  }

  /* --------------------------------------------------------------- flags */
  const regionNames = (() => { try { return new Intl.DisplayNames(['en'], { type: 'region' }); } catch (e) { return null; } })();
  const SPECIAL_REGIONS = { XW: 'Worldwide', XE: 'Europe', XU: 'Unknown', XG: 'East Germany', XC: 'Czechoslovakia', SU: 'Soviet Union', YU: 'Yugoslavia', CS: 'Serbia and Montenegro' };
  function countryName(cc) {
    cc = (cc || '').toUpperCase();
    if (!cc) return '';
    if (SPECIAL_REGIONS[cc]) return SPECIAL_REGIONS[cc];
    return safe(() => regionNames.of(cc), cc) || cc;
  }
  function flagFile(cc) {
    cc = (cc || '').toLowerCase();
    const map = { xe: 'eu', uk: 'gb', xw: 'xw', xu: 'xx', su: 'xx', yu: 'xx', xg: 'xx', xc: 'xx', cs: 'xx' };
    return 'flags/' + (map[cc] || cc) + '.svg';
  }
  function flagHTML(cc, extraTitle) {
    cc = (cc || '').trim().toUpperCase();
    if (!/^[A-Z]{2}$/.test(cc)) return '';
    const name = countryName(cc);
    return '<span class="flag" title="' + esc(name + (extraTitle ? ' — ' + extraTitle : '')) + '" style="background-image:url(\'' + flagFile(cc) + '\')"></span>';
  }

  /* --------------------------------------------------------------- barcode */
  const EAN_L = ['0001101', '0011001', '0010011', '0111101', '0100011', '0110001', '0101111', '0111011', '0110111', '0001011'];
  const EAN_G = ['0100111', '0110011', '0011011', '0100001', '0011101', '0111001', '0000101', '0010001', '0001001', '0010111'];
  const EAN_R = ['1110010', '1100110', '1101100', '1000010', '1011100', '1001110', '1010000', '1000100', '1001000', '1110100'];
  const EAN_PAR = ['LLLLLL', 'LLGLGG', 'LLGGLG', 'LLGGGL', 'LGLLGG', 'LGGLLG', 'LGGGLL', 'LGLGLG', 'LGLGGL', 'LGGLGL'];
  const checkDigitOK = (d) => {
    const n = d.length, body = d.slice(0, -1).split('').reverse().map(Number);
    const sum = body.reduce((s, x, i) => s + x * (i % 2 === 0 ? 3 : 1), 0);
    return (10 - (sum % 10)) % 10 === +d[n - 1];
  };
  /** Returns an SVG string for EAN-13 / UPC-A / EAN-8, or '' for unsupported codes. */
  function barcodeSVG(code, opts = {}) {
    const d = String(code || '').replace(/\D/g, '');
    let kind, bits = '', guards = new Set(), digits;
    if (d.length === 12 || d.length === 13) {
      kind = d.length === 12 ? 'UPC-A' : 'EAN-13';
      digits = d.length === 12 ? '0' + d : d;
      const par = EAN_PAR[+digits[0]];
      bits = '101';
      for (let i = 1; i <= 6; i++) bits += (par[i - 1] === 'L' ? EAN_L : EAN_G)[+digits[i]];
      bits += '01010';
      for (let i = 7; i <= 12; i++) bits += EAN_R[+digits[i]];
      bits += '101';
      const g = [0, 1, 2, 45, 46, 47, 48, 49, 92, 93, 94];
      if (kind === 'UPC-A') { for (let i = 3; i < 10; i++) g.push(i); for (let i = 85; i < 92; i++) g.push(i); }
      g.forEach((x) => guards.add(x));
    } else if (d.length === 8) {
      kind = 'EAN-8'; digits = d;
      bits = '101';
      for (let i = 0; i < 4; i++) bits += EAN_L[+d[i]];
      bits += '01010';
      for (let i = 4; i < 8; i++) bits += EAN_R[+d[i]];
      bits += '101';
      [0, 1, 2, 31, 32, 33, 34, 35, 64, 65, 66].forEach((x) => guards.add(x));
    } else return '';
    const m = opts.module || 2, quietL = kind === 'EAN-8' ? 7 : 11, quietR = 7, barH = opts.height || 56, guardExt = 8, textH = 14;
    const W = (quietL + bits.length + quietR) * m, Hh = barH + guardExt + textH;
    let rects = '';
    for (let i = 0; i < bits.length; i++) {
      if (bits[i] !== '1') continue;
      let j = i; while (j + 1 < bits.length && bits[j + 1] === '1' && guards.has(j + 1) === guards.has(i)) j++;
      const h = guards.has(i) ? barH + guardExt : barH;
      rects += '<rect x="' + (quietL + i) * m + '" y="0" width="' + (j - i + 1) * m + '" height="' + h + '"/>';
      i = j;
    }
    const tx = (x, s, anchor = 'middle') => '<text x="' + x + '" y="' + (barH + guardExt + textH - 3) + '" text-anchor="' + anchor + '">' + s + '</text>';
    let text = '';
    if (kind === 'EAN-13') {
      text += tx((quietL - 2) * m, digits[0], 'end');
      text += tx((quietL + 3 + 21) * m, digits.slice(1, 7));
      text += tx((quietL + 50 + 21) * m, digits.slice(7));
    } else if (kind === 'UPC-A') {
      text += tx((quietL - 2) * m, d[0], 'end');
      text += tx((quietL + 10 + 17.5) * m, d.slice(1, 6));
      text += tx((quietL + 50 + 17.5) * m, d.slice(6, 11));
      text += tx((quietL + bits.length + 2) * m, d[11], 'start');
    } else {
      text += tx((quietL + 3 + 14) * m, d.slice(0, 4));
      text += tx((quietL + 36 + 14) * m, d.slice(4));
    }
    const valid = checkDigitOK(kind === 'UPC-A' ? d : digits);
    return { kind, valid, svg: '<svg class="barcode" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + W + ' ' + Hh + '" width="' + W + '" height="' + Hh + '"><g fill="#0b0d10">' + rects + '</g><g fill="#0b0d10" font-family="Consolas, \'OCR-B\', monospace" font-size="' + (m * 6.2) + '">' + text + '</g></svg>' };
  }

  /* --------------------------------------------------------------- MusicBrainz & web */
  const store = {
    get(k, ttlMs) { try { const o = JSON.parse(localStorage.getItem(k)); if (o && (!ttlMs || Date.now() - o.t < ttlMs)) return o.v; } catch (e) {} return undefined; },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify({ t: Date.now(), v })); } catch (e) { try { localStorage.clear(); } catch (_) {} } },
  };
  const DAY = 86400000;
  let mbChain = Promise.resolve(), mbLast = 0;
  /** Rate-limited (≈1 req/s, MusicBrainz policy) and cached JSON fetch. */
  function mb(path, ttl = 21 * DAY) {
    const key = 'mb:' + path;
    const cached = store.get(key, ttl);
    if (cached !== undefined) return Promise.resolve(cached);
    const run = mbChain.then(async () => {
      const again = store.get(key, ttl);
      if (again !== undefined) return again;
      const wait = Math.max(0, mbLast + 1100 - Date.now());
      if (wait) await new Promise((r) => setTimeout(r, wait));
      mbLast = Date.now();
      const url = 'https://musicbrainz.org/ws/2/' + path + (path.includes('?') ? '&' : '?') + 'fmt=json';
      const res = await fetch(url, { headers: { Accept: 'application/json' } });
      if (res.status === 503) { mbLast = Date.now() + 2000; throw new Error('MusicBrainz rate limited'); }
      if (!res.ok) { store.set(key, null); return null; }
      const j = await res.json();
      store.set(key, j);
      return j;
    });
    mbChain = run.catch(() => {});
    return run;
  }
  async function getJSON(url, ttl = 14 * DAY) {
    const key = 'web:' + url;
    const c = store.get(key, ttl);
    if (c !== undefined) return c;
    const res = await fetch(url);
    if (!res.ok) { store.set(key, null); return null; }
    const j = await res.json();
    store.set(key, j);
    return j;
  }
  async function artistCountry(mbid) {
    if (!mbid) return '';
    const a = await mb('artist/' + mbid).catch(() => null);
    if (!a) return '';
    return a.country || (a.area && a.area['iso-3166-1-codes'] && a.area['iso-3166-1-codes'][0]) || '';
  }

  /* --------------------------------------------------------------- shell / commands */
  const profileDir = toFwd(safe(() => H.profilePath));
  const exePath = profileDir.replace(/\/[^/]+\/?$/, '') + '/foobar2000.exe';
  const openUrl = (url) => safe(() => H.execute(url, '', '', 'open', 1));
  const openFile = (pathFwd) => safe(() => H.execute(pathFwd.split('/').join(BS), '', '', 'open', 1));
  const runCommand = (name) => safe(() => H.execute(exePath.split('/').join(BS), '/command:"' + name + '"', '', 'open', 1));

  /* --------------------------------------------------------------- misc helpers */
  const fmtTime = (s) => {
    s = Math.max(0, Math.floor(s || 0));
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), x = s % 60;
    return (h ? h + ':' + String(m).padStart(2, '0') : String(m).padStart(2, '0')) + ':' + String(x).padStart(2, '0');
  };
  const qualityOf = (t) => {
    const lossless = /lossless/i.test(t.encoding) || /^(FLAC|ALAC|WavPack|APE|Monkey|TAK|PCM|WAV|AIFF|DSD|DSF|DFF|TTA|OptimFROG)/i.test(t.codec);
    const bits = parseInt(t.bits, 10) || 0, sr = parseInt(t.samplerate, 10) || 0;
    const hires = lossless && (bits > 16 || sr > 48000);
    return { lossless, hires, bits, sr, khz: sr ? (sr / 1000).toString().replace(/\.0+$/, '') : '' };
  };
  const firstOf = (s) => (s || '').split(/;\s*/)[0];
  /** Drop MusicBrainz placeholder values such as "[no label]" / "[none]". */
  const clean = (s) => (/^\s*\[(no label|none|unknown)\]\s*$/i.test(s || '') ? '' : (s || ''));
  const debounce = (fn, ms) => { let h; return (...a) => { clearTimeout(h); h = setTimeout(() => fn(...a), ms); }; };

  /** Subscribe to everything that can change which track is shown. */
  /** Cheap identity of whatever track the panels should show (+ play state). */
  function trackKey() {
    if (safe(() => H.isPlaying, false)) return 'P|' + safe(() => H.nowPlaying('[%path%]|[%subsong%]|[%title%]')) + '|' + safe(() => H.isPaused, false);
    const pl = safe(() => H.activePlaylist, -1);
    const idx = pl >= 0 ? safe(() => H.getFocusedPlaylistItem(pl), -1) : -1;
    return 'F|' + pl + '|' + idx + '|' + (idx >= 0 ? safe(() => H.getPlaylistItemFormattedText(pl, idx, '[%path%]|[%subsong%]')) : '');
  }

  function onTrackContextChange(cb) {
    let last = trackKey();
    const fire = (why) => { last = trackKey(); cb(why); };
    const d = debounce(fire, 120);
    ['playback:trackChanged', 'playback:starting', 'playback:stopped', 'playback:edited', 'playback:dynamicInfo',
      'playlist:focusChanged', 'playlist:activated', 'playlist:itemsModified', 'playlist:selectionChanged']
      .forEach((e) => fb2k.on(e, () => d(e)));
    // Watchdog: events can race the host's now-playing context, so also poll a cheap key.
    setInterval(() => { if (document.hidden) return; const k = trackKey(); if (k !== last) fire('watchdog'); }, 600);
    document.addEventListener('visibilitychange', () => { if (!document.hidden && trackKey() !== last) fire('visible'); });
  }

  /* --------------------------------------------------------------- thumbnails (IndexedDB cache) */
  const idb = (() => {
    let dbp;
    const open = () => dbp || (dbp = new Promise((res, rej) => {
      const r = indexedDB.open('y2k-thumbs', 1);
      r.onupgradeneeded = () => r.result.createObjectStore('t');
      r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error);
    }));
    return {
      get: (k) => open().then((db) => new Promise((res) => { const q = db.transaction('t').objectStore('t').get(k); q.onsuccess = () => res(q.result); q.onerror = () => res(undefined); })).catch(() => undefined),
      set: (k, v) => open().then((db) => new Promise((res) => { const tx = db.transaction('t', 'readwrite'); tx.objectStore('t').put(v, k); tx.oncomplete = () => res(); tx.onerror = () => res(); })).catch(() => {}),
    };
  })();

  /** Best cover image file in an album folder (same priority as the deck), or ''. */
  function findDirArtFile(dirFwd, depth = 0) {
    if (!dirFwd) return '';
    const files = listDir(dirFwd);
    const imgs = files.filter((f) => !f.isDirectory && IMG.test(f.name));
    for (const stem of ['folder', 'cover', 'front']) {
      const f = imgs.find((x) => x.name.replace(IMG, '').toLowerCase() === stem);
      if (f) return dirFwd + '/' + f.name;
    }
    const named = imgs.find((x) => /front|cover|folder|album/i.test(x.name));
    if (named) return dirFwd + '/' + named.name;
    const sub = files.find((f) => f.isDirectory && /^[-_ ]*(scans?|artwork|covers?)$/i.test(f.name));
    if (sub && depth === 0) { const s = findDirArtFile(dirFwd + '/' + sub.name, 1); if (s && /front|cover|folder/i.test(s.split('/').pop())) return s; }
    if (imgs.length) return dirFwd + '/' + imgs.slice().sort((a, b) => b.size - a.size)[0].name;
    // multi-disc albums: "CD1", "Disc 2" ... -> look in the parent folder
    if (depth === 0 && /[/](cd|disc|disk)[ _-]?\d+[^/]*$/i.test(dirFwd)) return findDirArtFile(dirFwd.replace(/[/][^/]+$/, ''), 1);
    return '';
  }

  // one-at-a-time worker so big JPEG decodes never stall the UI
  const thumbQueue = []; let thumbBusy = false; const thumbMem = new Map();
  /** Album thumbnail: the folder's cover image, else the art embedded in `trackPath`
      (a file path, or { pl, idx, path } for an item already in a playlist). */
  function thumb(dirFwd, size = 160, trackPath = '') {
    if (!dirFwd) return Promise.resolve('');
    const key = 'v2|' + size + '|' + dirFwd.toLowerCase();
    if (thumbMem.has(key)) return Promise.resolve(thumbMem.get(key));
    return new Promise((resolve) => { thumbQueue.push({ key, dirFwd, size, trackPath, resolve }); pumpThumbs(); });
  }

  /* Embedded art for tracks that aren't playing: foo_webview2 can only read artwork of
     playlist items, so tracks are loaded in batches into a short-lived helper playlist
     (one per panel, removed as soon as the batch is read).                              */
  const ARTPL = 'Y2K art lookup';
  const isArtPl = (name) => String(name || '').startsWith(ARTPL);
  const embJobs = []; let embBusy = false;
  const until = (cond, ms) => new Promise((res) => { const t0 = Date.now(); (function tick() { if (cond() || Date.now() - t0 > ms) res(); else setTimeout(tick, 40); })(); });
  const artPlName = () => ARTPL + ' · ' + (location.pathname.split('/').pop() || 'panel').replace(/\.html$/, '');
  // a helper left behind by a crash or an exit mid-batch
  setTimeout(() => { if (embBusy) return; const pl = safe(() => H.findPlaylist(artPlName()), -1); if (pl >= 0) safe(() => H.deletePlaylist(pl)); }, 2000);
  function embeddedArt(path) {
    if (!path) return Promise.resolve('');
    return new Promise((resolve) => { embJobs.push({ path, resolve }); if (!embBusy) setTimeout(pumpEmbedded, 30); });
  }
  async function pumpEmbedded() {
    if (embBusy) return;
    embBusy = true;
    const name = artPlName();
    while (embJobs.length) {
      const batch = embJobs.splice(-24).reverse(); // newest first: what's on screen now
      let pl = safe(() => H.findPlaylist(name), -1);
      if (pl < 0) pl = safe(() => H.createPlaylist(H.playlistCount, name), -1);
      if (pl < 0) { batch.forEach((j) => j.resolve('')); continue; }
      safe(() => H.clearPlaylist(pl));
      await until(() => safe(() => H.getPlaylistItemCount(pl), 0) === 0, 3000);
      batch.forEach((j, k) => safe(() => H.addPath(pl, k, j.path, false)));
      await until(() => safe(() => H.getPlaylistItemCount(pl), 0) >= batch.length, 5000);
      // match by path: unreadable files are skipped and cue sheets can expand
      const n = safe(() => H.getPlaylistItemCount(pl), 0), at = new Map();
      for (let i = 0; i < n; i++) { const p = safe(() => H.getPlaylistItemFormattedText(pl, i, '%path%'), '').toLowerCase(); if (p && !at.has(p)) at.set(p, i); }
      for (const j of batch) {
        const i = at.get(j.path.toLowerCase());
        j.resolve(i === undefined ? '' : safe(() => H.getPlaylistArtwork('front', pl, i), '') || '');
        await new Promise((r) => setTimeout(r, 0));
      }
    }
    const pl = safe(() => H.findPlaylist(name), -1);
    if (pl >= 0) safe(() => H.deletePlaylist(pl));
    embBusy = false;
  }
  async function pumpThumbs() {
    if (thumbBusy) return;
    thumbBusy = true;
    while (thumbQueue.length) {
      const job = thumbQueue.pop(); // newest first: what's on screen now
      let v = thumbMem.get(job.key);
      if (v === undefined) {
        const c = await idb.get(job.key);
        if (c && (c.v || Date.now() - c.t < 3 * DAY)) v = c.v;
        else {
          v = '';
          const file = findDirArtFile(job.dirFwd);
          let uri = file ? readImage(file) : '';
          const src = job.trackPath;
          if (!uri && src && typeof src === 'object') { // an item that's already in a playlist: read it directly
            const same = safe(() => H.getPlaylistItemFormattedText(src.pl, src.idx, '%path%'), '') === src.path;
            uri = same ? safe(() => H.getPlaylistArtwork('front', src.pl, src.idx), '') || '' : await embeddedArt(src.path);
          } else if (!uri && src) uri = await embeddedArt(src);
          if (uri) {
            try {
              const img = new Image(); img.src = uri; await img.decode();
              const s = job.size, cv = document.createElement('canvas'); cv.width = cv.height = s;
              const k = Math.max(s / img.naturalWidth, s / img.naturalHeight), w = img.naturalWidth * k, h = img.naturalHeight * k;
              cv.getContext('2d').drawImage(img, (s - w) / 2, (s - h) / 2, w, h);
              v = cv.toDataURL('image/jpeg', 0.82);
            } catch (e) { v = ''; }
          }
          idb.set(job.key, { t: Date.now(), v });
        }
        if (thumbMem.size > 4000) thumbMem.clear();
        thumbMem.set(job.key, v);
      }
      job.resolve(v);
      await new Promise((r) => setTimeout(r, 0));
    }
    thumbBusy = false;
  }

  /* --------------------------------------------------------------- playlist helpers */
  const LIBSEL = 'Library Selection';
  function playlistIndexByName(name, create) {
    let i = safe(() => H.findPlaylist(name), -1);
    if (i < 0 && create) i = safe(() => H.createPlaylist(H.playlistCount, name), -1);
    return i;
  }
  /** Append unique file paths to a playlist (cue/subsong files are added once). */
  function addPaths(pl, paths, select = false) {
    // foobar2000 processes insertions asynchronously, so precompute each target index
    const uniq = [...new Set(paths.filter(Boolean))];
    const start = safe(() => H.getPlaylistItemCount(pl), 0);
    uniq.forEach((p, k) => safe(() => H.addPath(pl, start + k, p, select)));
  }
  /** Replace "Library Selection" with these tracks and start playing them. */
  function playPaths(paths, startPath) { loadPaths(paths, startPath, true); }
  /** Replace "Library Selection" with these tracks; play, or just focus `startPath`. */
  function loadPaths(paths, startPath, play) {
    const pl = playlistIndexByName(LIBSEL, true);
    if (pl < 0) return;
    const uniq = [...new Set(paths.filter(Boolean))];
    if (!uniq.length) return;
    const start = Math.max(0, startPath ? uniq.indexOf(startPath) : 0);
    safe(() => H.clearPlaylist(pl));
    // clearing and inserting are processed asynchronously by foobar2000: wait for the clear,
    // insert from index 0, then wait until every track has landed before starting playback
    const t0 = Date.now();
    const waitFor = (cond, then) => { if (cond() || Date.now() - t0 > 4000) then(); else setTimeout(() => waitFor(cond, then), 40); };
    waitFor(() => safe(() => H.getPlaylistItemCount(pl), 0) === 0, () => {
      uniq.forEach((p, k) => safe(() => H.addPath(pl, k, p, false)));
      safe(() => { H.activePlaylist = pl; });
      waitFor(() => safe(() => H.getPlaylistItemCount(pl), 0) >= uniq.length, () => {
        const i = Math.min(start, Math.max(0, safe(() => H.getPlaylistItemCount(pl), 1) - 1));
        if (play) { safe(() => H.executePlaylistDefaultAction(pl, i)); return; }
        safe(() => { H.clearPlaylistSelection(pl); H.selectPlaylistItem(pl, i); H.setFocusedPlaylistItem(pl, i); H.ensurePlaylistItemVisible(pl, i); });
      });
    });
  }

  /* ------------------------------------------------------------------ colour scheme
     Every green in the skin is an r,g,b triplet variable (--cXXXXXX, defined in common.css). A "spec" says how to
     recolour them: null = as designed (lime), else { h: hue, s: saturation factor, l: lightness lift }; each shade
     keeps its own lightness, so the whole ramp (glows, LCD tint, dark ink on lime) follows.
     There are three accent channels. Fixed colours use the same spec for all three; ALBUM ART takes them from the
     cover (the deck extracts them): MONO = the main cover colour everywhere, MULTI = three cover colours, with
     channel 0 on the page root and channels 1/2 on elements given to scopeAccent() (centerpiece, pod, library...).
     Every change cross-fades. Choices live in localStorage, shared by all panels. */
  const PALETTES = {
    lime:    { name: 'Toxic lime', c: [156, 255, 46], hi: [234, 255, 196], deep: [22, 74, 2] },
    cyan:    { name: 'Aqua',       c: [70, 220, 255], hi: [214, 250, 255], deep: [2, 44, 74], h: 191 },
    ice:     { name: 'Ice blue',   c: [150, 190, 255], hi: [244, 248, 255], deep: [20, 34, 86], h: 217, s: 0.75, l: 0.6 },
    magenta: { name: 'Magenta',    c: [255, 84, 204], hi: [255, 218, 246], deep: [74, 0, 56], h: 318 },
    amber:   { name: 'Amber',      c: [255, 182, 39], hi: [255, 240, 204], deep: [86, 40, 0], h: 40 },
    ember:   { name: 'Ember red',  c: [255, 86, 60], hi: [255, 222, 206], deep: [80, 8, 4], h: 8 },
  };
  const ACCENTS = ('0b1c01 0d1a0b 061005 0d1f02 0d2401 0f2402 143003 173005 192c0c 1d3f05 1d4203 1f5a00 2f6b07 2f6b08 346e0e ' +
    '4f8f1d 5f8f2d 5fc410 8fcf4f 9cff2e b9ff66 c6ff6b d6ff9e eaffc4 f4ffe0').split(' ');
  const hexRgb = (x) => [0, 2, 4].map((i) => parseInt(x.slice(i, i + 2), 16));
  const ACCENT_RGB = ACCENTS.map(hexRgb);
  function rgb2hsl([r, g, b]) {
    r /= 255; g /= 255; b /= 255;
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2, d = mx - mn;
    if (!d) return [0, 0, l];
    const s = d / (1 - Math.abs(2 * l - 1));
    const h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
    return [(h * 60 + 360) % 360, s, l];
  }
  function hsl2rgb(h, s, l) {
    const c = (1 - Math.abs(2 * l - 1)) * s, x = c * (1 - Math.abs(((h / 60) % 2) - 1)), m = l - c / 2;
    const [r, g, b] = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
    return [r, g, b].map((v) => Math.round((v + m) * 255));
  }
  const specOf = (id) => { const p = PALETTES[id]; return !p || p.h == null ? null : { h: p.h, s: p.s ?? 1, l: p.l || 0 }; };
  function tintWith(rgb, sp) {
    if (!sp) return rgb.slice();
    let [, s, l] = rgb2hsl(rgb);
    s = Math.min(1, s * sp.s);
    l = Math.min(1, l + (1 - l) * sp.l * l); // lighter schemes lift the bright shades more than the dark ones
    return hsl2rgb(sp.h, s, l);
  }
  /** The spec that turns the skin's lime (#9cff2e) into roughly this colour, kept bright enough to read on the dark skin. */
  function specFor(rgb) {
    const [h, s, l] = rgb2hsl(rgb);
    return { h: Math.round(h), s: +Math.max(0.08, Math.min(1, s * 1.15)).toFixed(3), l: +Math.max(0, Math.min(0.9, (l - 0.59) / 0.242)).toFixed(3) };
  }

  let scheme = 'lime', mode = 'mono', rawState = '';
  let from = [null, null, null], to = [null, null, null], fadeT = 1, fadeStart = 0, animating = false;
  const FADE = 900, ease = (t) => t * t * (3 - 2 * t);
  const schemeFns = [], scopes = [];
  /** Current colour of one of the skin's greens ([r,g,b]) in accent channel i — a blend while a fade is running. */
  function tint(rgb, i = 0) {
    const a = tintWith(rgb, to[i] ?? to[0]);
    if (fadeT >= 1) return a;
    const b = tintWith(rgb, from[i] ?? from[0]), e = ease(fadeT);
    return a.map((v, k) => Math.round(b[k] + (v - b[k]) * e));
  }
  function readState() {
    let id = safe(() => localStorage.getItem('y2k:scheme'), '');
    if (!PALETTES[id] && id !== 'album') id = 'lime';
    const m = safe(() => localStorage.getItem('y2k:schemeMode'), '') === 'multi' ? 'multi' : 'mono';
    const ap = safe(() => JSON.parse(localStorage.getItem('y2k:albumPal')), null);
    return { id, m, ap };
  }
  function targets(st) {
    if (st.id === 'album') {
      const a = (st.ap && st.ap.accents) || [];
      if (!a.length) return [null, null, null]; // no cover read yet: stay lime
      return st.m === 'multi' ? [a[0], a[1] || a[0], a[2] || a[0]] : [a[0], a[0], a[0]];
    }
    const sp = specOf(st.id);
    return [sp, sp, sp];
  }
  /* All the triplets go into one <style> element, rewritten once per frame: a single style invalidation instead of
     ~25 per element. :root carries channel 0, [data-accent="i"] the others (common.css re-derives --lime-* there). */
  const sheet = document.createElement('style');
  (document.head || document.documentElement).appendChild(sheet);
  const used = new Set();
  function paint() {
    const decl = (i) => ACCENTS.map((x, k) => '--c' + x + ':' + tint(ACCENT_RGB[k], i).join(',')).join(';');
    let css = ':root{' + decl(0) + '}';
    used.forEach((i) => { css += '[data-accent="' + i + '"]{' + decl(i) + '}'; });
    sheet.textContent = css;
    schemeFns.forEach((fn) => safe(() => fn(scheme)));
  }
  /* The deck and the seek bar fade at full frame rate; the busy list panels (thousands of rows) restyle at ~25 fps
     so they don't starve the deck, which shares their rendering thread. */
  let fadeFps = 25, lastPaint = 0;
  const fadePriority = () => { fadeFps = 0; };
  function step(now) {
    fadeT = Math.min(1, (now - fadeStart) / FADE);
    if (fadeT >= 1 || !fadeFps || now - lastPaint >= 1000 / fadeFps - 4) { lastPaint = now; paint(); }
    if (fadeT < 1) requestAnimationFrame(step); else animating = false;
  }
  /** Re-reads the stored choice and fades to it (instantly on first load). */
  function applyScheme(instant) {
    const st = readState(), raw = JSON.stringify([st.id, st.m, st.ap]);
    if (raw === rawState && instant !== true) return;
    rawState = raw; scheme = st.id; mode = st.m;
    const t = targets(st);
    if (instant === true) { from = to = t; fadeT = 1; paint(); return; }
    if (JSON.stringify(t) === JSON.stringify(to)) { schemeFns.forEach((fn) => safe(() => fn(scheme))); return; }
    from = fadeT >= 0.5 ? to : from; to = t; fadeT = 0; fadeStart = performance.now();
    if (!animating) { animating = true; requestAnimationFrame(step); }
    setTimeout(() => { if (fadeT < 1) { fadeT = 1; animating = false; paint(); } }, FADE + 600); // hidden panels get no frames
  }
  function setScheme(id) { safe(() => localStorage.setItem('y2k:scheme', id)); applyScheme(); }
  function setSchemeMode(m) { safe(() => localStorage.setItem('y2k:schemeMode', m === 'multi' ? 'multi' : 'mono')); applyScheme(); }
  /** Called by the deck with the colours it read from the current cover. */
  function setAlbumPalette(key, accents) {
    const cur = safe(() => JSON.parse(localStorage.getItem('y2k:albumPal')), null);
    if (cur && JSON.stringify(cur.accents) === JSON.stringify(accents)) return;
    safe(() => localStorage.setItem('y2k:albumPal', JSON.stringify({ key, accents })));
    applyScheme();
  }
  /** Give an element (and everything inside it) accent channel i. */
  function scopeAccent(el, i) { if (!el) return; el.setAttribute('data-accent', i); scopes.push([el, i]); used.add(i); paint(); }
  const onSchemeChange = (fn) => schemeFns.push(fn);
  applyScheme(true);
  window.addEventListener('storage', (e) => { if (/^y2k:(scheme|schemeMode|albumPal)$/.test(e.key || '')) applyScheme(); });
  setInterval(applyScheme, 1500);

  return {
    PALETTES, tint, applyScheme, setScheme, fadePriority, setSchemeMode, setAlbumPalette, scopeAccent, specFor, rgb2hsl, onSchemeChange,
    get scheme() { return scheme; }, get schemeMode() { return mode; },
    thumb, embeddedArt, isArtPl, findDirArtFile, idb, addPaths, playPaths, loadPaths, playlistIndexByName, toFwd, SEP,
    H, BS, esc, log, safe, getTrack, listDir, readText, readImage, resolveArt, findRipLog, parseRipLog,
    countryName, flagHTML, flagFile, barcodeSVG, mb, getJSON, store, artistCountry, openUrl, openFile, runCommand,
    fmtTime, qualityOf, firstOf, clean, debounce, onTrackContextChange, trackKey, profileDir, exePath, DAY,
  };
})();
