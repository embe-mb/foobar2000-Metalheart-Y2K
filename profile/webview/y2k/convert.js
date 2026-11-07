/* METALHEART // Y2K - CONVERT window (right-click in Library Selection > Convert...)
   Like foobar2000's own Converter Setup, in the theme's style. Pick a format and quality, the encoder (from the
   theme's encoders folder), where the files go, and START. tools\convert.ps1 does the work in the background:
   it decodes each track, encodes it with the chosen encoder, tags it (and embeds the cover), several at a time.

   Where the files go:
     NEXT TO THE ALBUM   a folder beside the album's, named the same with the format in square brackets at the end
                         ("1987 - Out of the Blue (ZGK 35530) [FLAC]" -> "1987 - Out of the Blue (ZGK 35530) [MP3]")
     ANOTHER FOLDER      the same album folder name, inside the folder you pick
   Disc subfolders (CD1, Disc 2 ...) and file names are kept; only the extension changes. */
(() => {
  'use strict';
  const { esc, safe, H, BS } = Y2K;
  const ENC_DIR = Y2K.profileDir + '/webview/y2k/encoders';
  const PS1 = (Y2K.profileDir + '/webview/y2k/tools/convert.ps1').split('/').join(BS);
  const CACHE = Y2K.profileDir + '/webview/y2k/convcache';
  // formats only foobar2000's input components decode (PSF, 2SF, GSF, USF, NCSF, QSF, SSF, SPC, NSF, VGM ...); no
  // command-line decoder the converter knows can read them, so they're left out with a note instead of failing in ffmpeg
  const FB_ONLY = /\.(mini)?(psf2?|2sf|gsf|usf|ncsf|qsf|ssf|snsf)$|\.(spc|nsf|nsfe|gbs|hes|kss|ay|sap|vgm|vgz|s98|sid|mdx|pmd)$/i;
  const win = (p) => p.split('/').join(BS);

  /* formats: the folder tag, the extension, the encoders that make it (exe names, best first; ffmpeg does them all
     except Monkey's Audio), qualities [value, label] and the default */
  const FORMATS = {
    flac: { name: 'FLAC', tag: 'FLAC', ext: '.flac', enc: ['flac', 'ffmpeg'], q: [['0', 'Level 0 (fastest)'], ['3', 'Level 3'], ['5', 'Level 5 (standard)'], ['8', 'Level 8 (smallest)']], def: '5',
      get: 'flac.exe from xiph.org/flac (Windows release zip, the win64 folder)' },
    mp3: { name: 'MP3 (LAME)', tag: 'MP3', ext: '.mp3', enc: ['lame', 'ffmpeg'], q: [['V0', 'VBR V0 (~245 kbps)'], ['V2', 'VBR V2 (~190 kbps)'], ['V4', 'VBR V4 (~165 kbps)'], ['320', 'CBR 320 kbps'], ['256', 'CBR 256 kbps'], ['192', 'CBR 192 kbps'], ['128', 'CBR 128 kbps']], def: 'V0',
      get: 'lame.exe from rarewares.org (LAME bundles)' },
    aac: { name: 'AAC (M4A)', tag: 'AAC', ext: '.m4a', enc: ['qaac64', 'qaac', 'fdkaac', 'ffmpeg'], q: [['320', '320 kbps'], ['256', '256 kbps'], ['192', '192 kbps'], ['160', '160 kbps'], ['128', '128 kbps']], def: '256',
      get: 'qaac64.exe from github.com/nu774/qaac (needs Apple\'s AAC encoder from iTunes), or fdkaac.exe from rarewares.org' },
    alac: { name: 'ALAC (Apple Lossless)', tag: 'ALAC', ext: '.m4a', enc: ['refalac64', 'refalac', 'qaac64', 'qaac', 'ffmpeg'], q: [], def: '',
      get: 'refalac64.exe from the qaac download (github.com/nu774/qaac)' },
    opus: { name: 'Opus', tag: 'OPUS', ext: '.opus', enc: ['opusenc', 'ffmpeg'], q: [['256', '256 kbps'], ['192', '192 kbps'], ['160', '160 kbps'], ['128', '128 kbps'], ['96', '96 kbps'], ['64', '64 kbps']], def: '160',
      get: 'opusenc.exe from opus-codec.org (opus-tools for Windows)' },
    ogg: { name: 'Ogg Vorbis', tag: 'OGG', ext: '.ogg', enc: ['oggenc2', 'oggenc', 'ffmpeg'], q: [['10', 'Quality 10 (~500 kbps)'], ['8', 'Quality 8 (~256 kbps)'], ['6', 'Quality 6 (~192 kbps)'], ['5', 'Quality 5 (~160 kbps)'], ['4', 'Quality 4 (~128 kbps)']], def: '6',
      get: 'oggenc2.exe from rarewares.org' },
    wv: { name: 'WavPack', tag: 'WAVPACK', ext: '.wv', enc: ['wavpack', 'ffmpeg'], q: [['f', 'Fast'], ['h', 'High'], ['hh', 'Very high']], def: 'h',
      get: 'wavpack.exe from wavpack.com (Windows x64 zip)' },
    ape: { name: 'Monkey\'s Audio (APE)', tag: 'APE', ext: '.ape', enc: ['mac'], q: [['1000', 'Fast'], ['2000', 'Normal'], ['3000', 'High'], ['4000', 'Extra high'], ['5000', 'Insane']], def: '2000',
      get: 'MAC.exe from monkeysaudio.com (the SDK / command line download). Tags are not written for APE.' },
    wav: { name: 'WAV (uncompressed)', tag: 'WAV', ext: '.wav', enc: [], q: [], def: '',
      get: 'no encoder needed, only a decoder for the source (flac.exe for FLAC, or ffmpeg.exe for anything)' },
  };
  // tags carried over (TF field -> tag name written)
  const TAGS = ['title', 'artist', 'album', 'album artist', 'date', 'originaldate', 'tracknumber', 'totaltracks', 'discnumber', 'totaldiscs', 'discsubtitle',
    'genre', 'composer', 'performer', 'conductor', 'label', 'catalognumber', 'barcode', 'isrc', 'media', 'releasecountry', 'releasetype', 'comment', 'lyrics',
    'musicbrainz_trackid', 'musicbrainz_albumid', 'musicbrainz_artistid', 'musicbrainz_albumartistid', 'musicbrainz_releasegroupid', 'musicbrainz_releasetrackid'];
  const TAG_TF = TAGS.map((t) => "$meta_sep(" + t + ",'; ')").join('$char(30)') + '$char(30)[%path%]$char(30)[%subsong%]';
  const tagName = (t) => (t === 'album artist' ? 'ALBUMARTIST' : t.toUpperCase());

  /** The tracks of playlist pl at these indices, with their tags. */
  function tracksOf(pl, indices) {
    const out = [];
    for (const i of indices) {
      const v = String(safe(() => H.getPlaylistItemFormattedText(pl, i, TAG_TF), '')).split(String.fromCharCode(30));
      const path = v[TAGS.length] || '', sub = v[TAGS.length + 1] || '0';
      const tags = {}; TAGS.forEach((t, k) => { if (v[k]) tags[tagName(t)] = v[k]; });
      out.push({ path, sub: +sub || 0, tags });
    }
    return out;
  }

  /* ---------------------------------------------------------------- encoders on disk */
  function scanEncoders() {
    const found = {};
    const add = (dir) => { for (const f of Y2K.listDir(dir)) { if (f.isDirectory) continue; const m = /^(.+)\.exe$/i.exec(f.name); if (m && !found[m[1].toLowerCase()]) found[m[1].toLowerCase()] = win(dir + '/' + f.name); } };
    add(ENC_DIR);
    for (const f of Y2K.listDir(ENC_DIR)) if (f.isDirectory) { add(ENC_DIR + '/' + f.name); for (const g of Y2K.listDir(ENC_DIR + '/' + f.name)) if (g.isDirectory) add(ENC_DIR + '/' + f.name + '/' + g.name); }
    return found;
  }

  /* ---------------------------------------------------------------- where files go */
  const DISC_DIR = /^(cd|disc|disk|dvd|side)\s*[-_]?\s*\d+\b/i;
  const dirOf = (p) => Y2K.toFwd(p).replace(/\/[^/]*$/, '');
  function albumRoot(tracks) {
    const dirs = tracks.map((t) => dirOf(t.path).split('/'));
    let n = dirs[0].length;
    for (const d of dirs) { let k = 0; while (k < n && k < d.length && d[k].toLowerCase() === dirs[0][k].toLowerCase()) k++; n = k; }
    let root = dirs[0].slice(0, n).join('/');
    if (DISC_DIR.test(root.split('/').pop()) && root.split('/').length > 2) root = root.replace(/\/[^/]+$/, '');
    return root;
  }
  // "Album (CAT) [FLAC]" -> "Album (CAT) [MP3]"; "Album" -> "Album [MP3]"
  const tagged = (leaf, tag) => (/\s*\[[^\]]*\]\s*$/.test(leaf) ? leaf.replace(/\s*\[[^\]]*\]\s*$/, ' [' + tag + ']') : leaf + ' [' + tag + ']');
  function outRoot(root, cfg) {
    const leaf = root.split('/').pop(), parent = root.replace(/\/[^/]+$/, '');
    let name = tagged(leaf, FORMATS[cfg.fmt].tag);
    const base = cfg.dest === 'other' && cfg.other ? Y2K.toFwd(cfg.other).replace(/\/+$/, '') : parent;
    if ((base + '/' + name).toLowerCase() === root.toLowerCase()) name += ' (converted)';   // never onto the source
    return base + '/' + name;
  }
  const IMG = /\.(jpe?g|png|webp|gif|bmp)$/i, ART_SUB = /^[-_ #]*(scans?|artwork|covers?|images?|art|pictures?|booklet)$/i;
  function coverOf(dirFwd) {
    const imgs = Y2K.listDir(dirFwd).filter((f) => !f.isDirectory && IMG.test(f.name));
    for (const stem of ['folder', 'cover', 'front']) { const f = imgs.find((x) => x.name.replace(IMG, '').toLowerCase() === stem); if (f) return dirFwd + '/' + f.name; }
    return '';
  }
  function extrasOf(root, dest) {
    const out = [];
    for (const f of Y2K.listDir(root)) {
      if (!f.isDirectory && IMG.test(f.name)) out.push({ src: win(root + '/' + f.name), dst: win(dest + '/' + f.name) });
      else if (f.isDirectory && (ART_SUB.test(f.name) || DISC_DIR.test(f.name)))
        for (const g of Y2K.listDir(root + '/' + f.name)) if (!g.isDirectory && IMG.test(g.name)) out.push({ src: win(root + '/' + f.name + '/' + g.name), dst: win(dest + '/' + f.name + '/' + g.name) });
    }
    return out;
  }

  /* ---------------------------------------------------------------- the window */
  const CFG_KEY = 'y2k:convert';
  const loadCfg = () => Object.assign({ fmt: 'mp3', q: {}, enc: {}, dest: 'next', other: '', copyArt: true, embedArt: true, overwrite: false,
    threads: Math.max(1, Math.min(4, Math.floor((navigator.hardwareConcurrency || 2) / 2))) }, safe(() => JSON.parse(localStorage.getItem(CFG_KEY)), null) || {});
  let open = null;

  const CSS = `
  .cv { position: absolute; inset: 0; display: flex; flex-direction: column; color: #dfe7ef; font: 12px/1.35 var(--ui); background: linear-gradient(180deg, #1a222b, #0d1218); }
  .cv-head { display: flex; align-items: center; gap: 10px; padding: 10px 14px; border-bottom: 1px solid #000; background: linear-gradient(180deg, #2a3440, #151b22); box-shadow: inset 0 1px 0 rgba(255,255,255,.12); }
  .cv-head b { font: 900 14px/1 var(--display); letter-spacing: .22em; color: var(--lime-1); text-shadow: 0 0 8px var(--lime-glow); }
  .cv-head span { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font: 400 8px/1 var(--pixel); letter-spacing: .1em; color: var(--text-dim); }
  .cv-body { flex: 1; min-height: 0; display: flex; flex-direction: column; gap: 9px; padding: 12px 14px; }
  .cv-row { display: grid; grid-template-columns: 92px 1fr; align-items: center; gap: 8px; }
  .cv-row > label { font: 400 8px/1 var(--pixel); letter-spacing: .12em; color: var(--blue-1); text-transform: uppercase; }
  .cv-ctl { display: flex; gap: 6px; align-items: center; min-width: 0; flex-wrap: wrap; }
  .cv select, .cv input[type=text] { height: 24px; min-width: 0; border-radius: 5px; border: 1px solid var(--blue-5); background: #0b1016; color: #dfe7ef; font: 12px var(--ui); padding: 0 6px; outline: none;
    box-shadow: inset 0 1px 3px rgba(0,0,0,.8); }
  .cv select:focus, .cv input[type=text]:focus { border-color: var(--lime-3); box-shadow: inset 0 1px 3px rgba(0,0,0,.8), 0 0 6px var(--lime-glow); }
  .cv select { flex: 1; } .cv input[type=text] { flex: 1; }
  .cv option { background: #0b1016; }
  .cv .btn { flex: none; height: 24px; padding: 0 11px; border-radius: 12px; cursor: pointer; display: inline-flex; align-items: center; gap: 5px; user-select: none;
    font: 600 10px/1 "Bahnschrift SemiBold", Bahnschrift, "Segoe UI", sans-serif; letter-spacing: .07em; color: #fff; text-shadow: 0 1px 1px rgba(0,0,0,.5);
    background: linear-gradient(180deg, rgba(255,255,255,.5), rgba(255,255,255,.08) 50%, transparent 51%), linear-gradient(180deg, var(--blue-2), var(--blue-4)); border: 1px solid var(--blue-5); }
  .cv .btn:hover { filter: brightness(1.15); }
  .cv .btn.lime { color: #0d1a04; text-shadow: 0 1px 0 rgba(255,255,255,.4); background: linear-gradient(180deg, rgba(255,255,255,.6), rgba(255,255,255,.1) 50%, transparent 51%), linear-gradient(180deg, var(--lime-1), var(--lime-3)); border-color: #2c4a08; }
  .cv .btn.off { opacity: .4; pointer-events: none; }
  .cv .btn.dark { background: linear-gradient(180deg, rgba(255,255,255,.4), rgba(255,255,255,.06) 50%, transparent 51%), linear-gradient(180deg, #4b5562, #232a33); border-color: #0b0e12; }
  .cv .radio { display: inline-flex; align-items: center; gap: 5px; cursor: pointer; white-space: nowrap; }
  .cv .chk { display: inline-flex; align-items: center; gap: 5px; cursor: pointer; margin-right: 10px; white-space: nowrap; }
  .cv input[type=radio], .cv input[type=checkbox] { accent-color: var(--lime-2); margin: 0; }
  .cv .note { font-size: 11px; color: var(--text-dim); }
  .cv .note.warn { color: #ffcf6b; }
  .cv .path { font: 11px/1.3 Consolas, monospace; color: #cfe0ef; background: #070a0d; border: 1px solid #000; border-radius: 5px; padding: 5px 7px; word-break: break-all; box-shadow: inset 0 1px 3px rgba(0,0,0,.8); }
  .cv-list { flex: 1; min-height: 80px; overflow: auto; border-radius: 6px; background: #070a0d; border: 1px solid #000; box-shadow: inset 0 2px 6px rgba(0,0,0,.9); }
  .cv-list .it { display: grid; grid-template-columns: 24px 1fr auto; gap: 8px; align-items: center; padding: 3px 8px; border-bottom: 1px solid rgba(255,255,255,.04); font-size: 11.5px; }
  .cv-list .it .n { font: 400 8px/1 var(--pixel); color: var(--text-dim); text-align: right; }
  .cv-list .it .t { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .cv-list .it .s { font: 400 7px/1 var(--pixel); letter-spacing: .1em; padding: 3px 6px; border-radius: 8px; color: var(--text-dim); background: rgba(255,255,255,.05); }
  .cv-list .it .s.run { color: #0d1a04; background: var(--lime-2); box-shadow: 0 0 6px var(--lime-glow); }
  .cv-list .it .s.ok { color: var(--lime-1); background: rgba(var(--c9cff2e),.12); }
  .cv-list .it .s.skip { color: #9fc4ea; background: rgba(80,140,210,.15); }
  .cv-list .it .s.fail { color: #fff; background: #b3262b; }
  .cv-list .it .err { grid-column: 2 / 4; color: #ff9c9c; font-size: 10.5px; white-space: normal; }
  .cv-foot { display: flex; align-items: center; gap: 8px; padding: 10px 14px; border-top: 1px solid #000; background: linear-gradient(180deg, #1d252e, #10151b); }
  .cv-bar { flex: 1; height: 10px; border-radius: 5px; background: #070a0d; border: 1px solid #000; overflow: hidden; box-shadow: inset 0 1px 3px #000; }
  .cv-bar i { display: block; height: 100%; width: 0; background: linear-gradient(180deg, var(--lime-1), var(--lime-3)); box-shadow: 0 0 6px var(--lime-glow); transition: width .3s; }
  .cv-stat { font: 400 8px/1 var(--pixel); letter-spacing: .1em; color: var(--text-dim); min-width: 90px; text-align: right; }
  `;

  function showConverter(tracks) {
    tracks = (tracks || []).filter((t) => /^[A-Za-z]:|^\\\\/.test(t.path));
    if (!tracks.length) { alert('CONVERT works on files on this computer (not Navidrome streams).'); return; }
    if (open) safe(() => open.close());
    const cfg = loadCfg();
    const save = () => safe(() => localStorage.setItem(CFG_KEY, JSON.stringify(cfg)));
    const W = Y2K.themedWindow('y2kConvert', 'Convert', 720, 640, () => { open = null; });
    if (!W) { alert('The CONVERT window could not open.'); return; }
    const d = W.doc;
    const st = d.createElement('style'); st.textContent = CSS; d.head.appendChild(st);
    const root = d.createElement('div'); root.className = 'cv'; d.body.appendChild(root);
    const $ = (id) => d.getElementById(id);
    const album = tracks[0].tags.ALBUM || '', aroot = albumRoot(tracks);
    const cue = tracks.some((t) => t.sub > 0);
    let encs = scanEncoders(), job = null, poll = 0;

    root.innerHTML = '<div class="cv-head"><b>CONVERT</b><span id="cvSub"></span></div>' +
      '<div class="cv-body">' +
      '<div class="cv-row"><label>Format</label><div class="cv-ctl"><select id="cvFmt"></select><select id="cvQ"></select></div></div>' +
      '<div class="cv-row"><label>Encoder</label><div class="cv-ctl"><select id="cvEnc"></select><span class="btn dark" id="cvFolder" title="Put encoder .exe files in here (subfolders are fine)">ENCODERS FOLDER</span><span class="btn dark" id="cvRescan">RESCAN</span></div></div>' +
      '<div class="cv-row"><label></label><div class="note" id="cvEncNote"></div></div>' +
      '<div class="cv-row"><label>Save to</label><div class="cv-ctl"><label class="radio"><input type="radio" name="cvDest" value="next" id="cvNext">Next to the album</label>' +
      '<label class="radio"><input type="radio" name="cvDest" value="other" id="cvOtherR">Another folder:</label><input type="text" id="cvOther" placeholder="D:\\Music\\MP3" spellcheck="false" autocomplete="off"><span class="btn dark" id="cvBrowse">BROWSE…</span></div></div>' +
      '<div class="cv-row"><label>Output</label><div class="path" id="cvOut"></div></div>' +
      '<div class="cv-row"><label>Options</label><div class="cv-ctl"><label class="chk"><input type="checkbox" id="cvArt">Copy artwork &amp; scans</label>' +
      '<label class="chk"><input type="checkbox" id="cvEmbed">Embed the cover</label><label class="chk"><input type="checkbox" id="cvOver">Replace files already there</label>' +
      '<label class="chk">At once <select id="cvThr" style="flex:none;width:52px"></select></label></div></div>' +
      (cue ? '<div class="cv-row"><label></label><div class="note warn">Some of these tracks are inside a single CUE image file: those are skipped.</div></div>' : '') +
      '<div class="cv-list" id="cvList"></div></div>' +
      '<div class="cv-foot"><div class="cv-bar"><i id="cvBar"></i></div><span class="cv-stat" id="cvStat"></span>' +
      '<span class="btn dark off" id="cvOpen">OPEN FOLDER</span><span class="btn dark off" id="cvCancel">CANCEL</span><span class="btn lime" id="cvStart">START</span></div>';

    $('cvSub').textContent = tracks.length + ' TRACK' + (tracks.length === 1 ? '' : 'S') + (album ? ' · ' + album : '');
    $('cvFmt').innerHTML = Object.entries(FORMATS).map(([k, f]) => '<option value="' + k + '">' + esc(f.name) + '</option>').join('');
    $('cvThr').innerHTML = [1, 2, 3, 4, 6, 8].map((n) => '<option>' + n + '</option>').join('');
    $('cvList').innerHTML = tracks.map((t, i) => '<div class="it" data-i="' + i + '"><span class="n">' + esc(t.tags.TRACKNUMBER || i + 1) + '</span><span class="t" title="' + esc(t.path) + '">' +
      esc((t.tags.ARTIST ? t.tags.ARTIST + ' - ' : '') + (t.tags.TITLE || t.path.split(/[\\/]/).pop())) + '</span><span class="s">' + (t.sub > 0 ? 'CUE' : 'READY') + '</span></div>').join('');

    function encChoices(fk) {
      const f = FORMATS[fk];
      return f.enc.filter((n) => encs[n]).map((n) => [encs[n], n]).concat(Object.keys(encs).filter((n) => !f.enc.includes(n) && fk !== 'wav').map((n) => [encs[n], n + ' (other)']));
    }
    function sync() {
      const fk = cfg.fmt, f = FORMATS[fk];
      $('cvFmt').value = fk;
      $('cvQ').innerHTML = f.q.length ? f.q.map(([v, l]) => '<option value="' + esc(v) + '">' + esc(l) + '</option>').join('') : '<option value="">—</option>';
      $('cvQ').disabled = !f.q.length; $('cvQ').value = cfg.q[fk] || f.def;
      const ch = encChoices(fk);
      if (fk === 'wav') $('cvEnc').innerHTML = '<option value="">(no encoder needed)</option>';
      else $('cvEnc').innerHTML = ch.length ? ch.map(([p, n]) => '<option value="' + esc(p) + '">' + esc(n + '.exe') + '</option>').join('') : '<option value="">— none found —</option>';
      $('cvEnc').disabled = fk === 'wav' || !ch.length;
      if (fk !== 'wav') $('cvEnc').value = ch.some(([p]) => p === cfg.enc[fk]) ? cfg.enc[fk] : ch.length ? ch[0][0] : '';
      const encOk = fk === 'wav' || !!$('cvEnc').value;
      const encN = ($('cvEnc').value.split(BS).pop() || '').toLowerCase();
      const needsDec = tracks.some((t) => { const x = (t.path.match(/\.[^.\\/]+$/) || [''])[0].toLowerCase(); return x !== '.wav' && !(x === '.flac' && encs.flac) && !(x === '.mp3' && encs.lame) && !(x === '.wv' && encs.wvunpack) && !(x === '.ape' && encs.mac) && !(x === '.opus' && encs.opusdec) && !(x === '.ogg' && encs.oggdec); });
      const decOk = encN === 'ffmpeg.exe' || !needsDec || !!encs.ffmpeg;
      $('cvEncNote').className = 'note' + (encOk && decOk ? '' : ' warn');
      $('cvEncNote').textContent = !encOk ? 'No encoder for ' + f.name + ' yet. Get ' + f.get + ', put it in the encoders folder, then RESCAN.'
        : !decOk ? 'These files need a decoder too: put ffmpeg.exe in the encoders folder (gyan.dev / BtbN builds), or flac.exe for FLAC sources.'
        : fk === 'wav' ? 'Decoded with ' + (encs.flac ? 'flac.exe / ' : '') + (encs.ffmpeg ? 'ffmpeg.exe' : 'the source format\'s own tool') + '.'
        : 'Using ' + encN + (f.q.length ? ' at ' + ($('cvQ').selectedOptions[0] || {}).textContent : '') + '.';
      [...d.querySelectorAll('input[name=cvDest]')].forEach((r) => { r.checked = r.value === cfg.dest; });
      $('cvOther').value = cfg.other; $('cvOther').disabled = cfg.dest !== 'other'; $('cvBrowse').classList.toggle('off', !!job);
      $('cvArt').checked = cfg.copyArt; $('cvEmbed').checked = cfg.embedArt; $('cvOver').checked = cfg.overwrite; $('cvThr').value = String(cfg.threads);
      $('cvOut').textContent = cfg.dest === 'other' && !cfg.other.trim() ? '(pick a folder)' : win(outRoot(aroot, cfg));
      $('cvStart').classList.toggle('off', !!job || !encOk || !decOk || (cfg.dest === 'other' && !cfg.other.trim()));
    }
    $('cvFmt').onchange = () => { cfg.fmt = $('cvFmt').value; save(); sync(); };
    $('cvQ').onchange = () => { cfg.q[cfg.fmt] = $('cvQ').value; save(); sync(); };
    $('cvEnc').onchange = () => { cfg.enc[cfg.fmt] = $('cvEnc').value; save(); sync(); };
    d.querySelectorAll('input[name=cvDest]').forEach((r) => { r.onchange = () => { cfg.dest = r.value; save(); sync(); if (r.value === 'other' && !cfg.other) $('cvOther').focus(); }; });
    $('cvOther').oninput = () => { cfg.other = $('cvOther').value; save(); $('cvOut').textContent = cfg.other.trim() ? win(outRoot(aroot, cfg)) : '(pick a folder)'; $('cvStart').classList.toggle('off', !cfg.other.trim()); };
    $('cvArt').onchange = () => { cfg.copyArt = $('cvArt').checked; save(); };
    $('cvEmbed').onchange = () => { cfg.embedArt = $('cvEmbed').checked; save(); };
    $('cvOver').onchange = () => { cfg.overwrite = $('cvOver').checked; save(); };
    $('cvThr').onchange = () => { cfg.threads = +$('cvThr').value; save(); };
    $('cvFolder').onclick = () => { ensureEncDir(); Y2K.openFile(ENC_DIR); };
    $('cvRescan').onclick = () => { encs = scanEncoders(); sync(); };
    $('cvBrowse').onclick = () => {
      const id = 'b' + Date.now().toString(36), out = CACHE + '/' + id + '.browse';
      const start = btoa(String.fromCharCode(...new TextEncoder().encode(win(cfg.other || aroot.replace(/\/[^/]+$/, '')))));
      ps('-STA -File "' + PS1 + '" -Id ' + id + ' -Browse -Data ' + start);
      const t0 = Date.now(), iv = W.win.setInterval(() => {
        const raw = Y2K.readText(out), there = raw.startsWith('>'), v = there ? raw.slice(1).trim() : '';   // '>' + the folder, or just '>' if cancelled
        if (there || Date.now() - t0 > 600000) { W.win.clearInterval(iv); if (v) { cfg.other = v; cfg.dest = 'other'; save(); sync(); } }
      }, 400);
    };
    function ps(args) { return safe(() => { H.execute('powershell.exe', '-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden ' + args, '', 'open', 0); return true; }, false); }
    function ensureEncDir() { if (!Y2K.listDir(Y2K.profileDir + '/webview/y2k').some((f) => f.isDirectory && f.name.toLowerCase() === 'encoders')) ps('-Command "New-Item -ItemType Directory -Force -Path \'' + win(ENC_DIR) + '\' | Out-Null"'); }

    $('cvStart').onclick = () => {
      if (job) return;
      const f = FORMATS[cfg.fmt], dest = outRoot(aroot, cfg), toolset = {};
      for (const [n, p] of Object.entries(encs)) toolset[n] = p;
      const items = [], rows = [];
      let fbOnly = 0;
      tracks.forEach((t, i) => {
        if (t.sub > 0) return;
        if (FB_ONLY.test(t.path)) {   // game-music rips: only foobar2000's own input components can play these
          fbOnly++;
          const row = $('cvList').querySelector('.it[data-i="' + i + '"]');
          if (row && !row.querySelector('.err')) {
            const sEl = row.querySelector('.s'); sEl.textContent = 'SKIPPED'; sEl.className = 's skip';
            row.insertAdjacentHTML('beforeend', '<span class="err">No outside decoder reads this format: use foobar2000’s own Convert (right-click › Convert in a stock playlist)</span>');
          }
          return;
        }
        const src = Y2K.toFwd(t.path), rel = src.slice(aroot.length + 1).replace(/\.[^./]+$/, f.ext);
        items.push({ src: win(src), dst: win(dest + '/' + rel), tags: t.tags, cover: cfg.embedArt ? win(coverOf(dirOf(src)) || coverOf(aroot)) : '' });
        rows.push(i);
      });
      if (!items.length) { if (fbOnly) $('cvStat').textContent = 'NEEDS FOOBAR2000’S CONVERTER'; return; }
      const spec = { format: cfg.fmt, quality: cfg.q[cfg.fmt] || f.def, encoder: cfg.fmt === 'wav' ? '' : $('cvEnc').value, tools: toolset,
        threads: cfg.threads, overwrite: cfg.overwrite, embedArt: cfg.embedArt, items, extras: cfg.copyArt ? extrasOf(aroot, dest) : [] };
      const id = 'c' + Date.now().toString(36), b64 = btoa(String.fromCharCode(...new TextEncoder().encode(JSON.stringify(spec))));
      const parts = []; for (let i = 0; i < b64.length; i += 24000) parts.push(b64.slice(i, i + 24000));
      parts.forEach((p, n) => ps('-File "' + PS1 + '" -Id ' + id + ' -Part ' + n + ' -Of ' + parts.length + ' -Data ' + p));
      ps('-File "' + PS1 + '" -Id ' + id + ' -Of ' + parts.length + ' -Run');
      job = { id, rows, dest, t0: Date.now() };
      $('cvStat').textContent = 'STARTING…'; $('cvCancel').classList.remove('off'); $('cvOpen').classList.add('off');
      d.querySelectorAll('.cv-body select, .cv-body input').forEach((x) => { x.disabled = true; });
      sync();
      poll = W.win.setInterval(tick, 500);
    };
    function tick() {
      const raw = Y2K.readText(CACHE + '/' + job.id + '.json');
      const s = safe(() => JSON.parse(raw), null);
      if (!s) { if (Date.now() - job.t0 > 45000) { finish('The converter did not start (is PowerShell blocked?)'); } return; }
      const items = s.items || [];
      items.forEach((r, k) => {
        const row = $('cvList').querySelector('.it[data-i="' + job.rows[k] + '"]'); if (!row) return;
        const lab = { wait: 'QUEUED', run: 'CONVERTING', ok: 'DONE', skip: 'SKIPPED', fail: 'FAILED', cancel: 'CANCELLED' }[r.st] || r.st;
        const sEl = row.querySelector('.s'); if (sEl.textContent !== lab) { sEl.textContent = lab; sEl.className = 's ' + r.st; if (r.st === 'run') row.scrollIntoView({ block: 'nearest' }); }
        if (r.msg && r.st === 'fail' && !row.querySelector('.err')) row.insertAdjacentHTML('beforeend', '<span class="err">' + esc(r.msg) + '</span>');
      });
      $('cvBar').style.width = (s.total ? (100 * s.done) / s.total : 0) + '%';
      const fails = items.filter((r) => r.st === 'fail').length;
      $('cvStat').textContent = s.state === 'error' ? 'ERROR' : s.done + ' / ' + s.total + (fails ? ' · ' + fails + ' FAILED' : '');
      if (s.state !== 'running') finish(s.state === 'error' ? s.msg : s.state === 'cancelled' ? 'CANCELLED' : fails ? '' : 'DONE');
    }
    function finish(msg) {
      W.win.clearInterval(poll);
      if (msg) $('cvStat').textContent = msg.toUpperCase().slice(0, 60);
      $('cvCancel').classList.add('off'); $('cvOpen').classList.remove('off');
      const dest = job.dest; job = null;
      d.querySelectorAll('.cv-body select, .cv-body input').forEach((x) => { x.disabled = false; });
      $('cvOpen').onclick = () => Y2K.openFile(dest);
      $('cvStart').textContent = 'START AGAIN'; sync();
    }
    $('cvCancel').onclick = () => { if (job) { ps('-File "' + PS1 + '" -Id ' + job.id + ' -Cancel'); $('cvStat').textContent = 'CANCELLING…'; } };
    sync();
    open = W;
  }

  Y2K.showConverter = showConverter;
  Y2K.convertTracksOf = tracksOf;
})();
