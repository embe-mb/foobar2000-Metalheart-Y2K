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
    /* Other tag sources (Mp3tag's Discogs source, the VGMdb scripts, foo_discogs, ...). Kept apart from the
       MusicBrainz/Picard fields above so those always win; normalizeTags() fills the gaps from these. */
    alt_catalog: ['catalog #', 'catalog', 'catalogid', 'catalog number', 'catalogno', 'discogs_catalog', 'vgmdb_catalog_number', 'labelno'],
    alt_label: ['discogs_label', 'vgmdb_label', 'vgmdb_publisher'],
    alt_media: ['mediatype', 'media type', 'discogs_mediatype', 'discogs_format', 'vgmdb_media_format'],
    alt_country: ['discogs_country', 'country'],
    alt_barcode: ['vgmdb_barcode', 'discogs_barcode'],
    alt_date: ['discogs_released', 'vgmdb_release_date', 'releasedate', 'release date'],
    notes: ['notes', 'vgmdb_notes', 'discogs_release_notes'],
    event: ['event', 'vgmdb_event'],
    pubformat: ['vgmdb_publish_format', 'publish format'],
    classification: ['vgmdb_classification', 'classification'],
    distributor: ['distributor', 'vgmdb_distributor'],
    manufacturer: ['manufacturer', 'vgmdb_manufacturer'],
    involved: ['involvedpeople', 'involved people', 'vgmdb_all_credits'],
    discogs_release: ['discogs_release_id', 'discogs release id', 'discogs_releaseid', 'discogsid', 'discogs-id', 'discogs_id'],
    discogs_master: ['discogs_master_release_id', 'discogs_master_id', 'discogs_master_release', 'discogs_masterid'],
    discogs_artist: ['discogs_artist_id', 'discogs_artistid'],
    discogs_labelid: ['discogs_label_id', 'discogs_labelid'],
    vgmdb_url: ['vgmdb_url', 'vgmdb album url', 'vgmdb_album_url'],
    vgmdb_id: ['vgmdb_album_id', 'vgmdb_id', 'vgmdbid'],
    www: ['www', 'url', 'website', 'wwwaudiosource', 'www audio source', 'wwwaudiofile', 'www audio file', 'discogs_release_url', 'url_discogs_release_site'],
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
    normalizeTags(o);
    return o;
  };

  /* -------------------------------------------------------- other tag sources
     MusicBrainz (Picard) fields always win. Where they are empty, values written by other taggers fill in:
     Mp3tag's Discogs source (CATALOGNUMBER, PUBLISHER, MEDIATYPE "CD (Album, Reissue)", COUNTRY "UK & Europe",
     WWW, DISCOGS_RELEASE_ID), the VGMdb scripts (CATALOG, LABEL, MEDIATYPE, NOTES, EVENT, WWW / VGMDB_*),
     foo_discogs (DISCOGS_*). t.sources lists where the tags came from, MusicBrainz first. */
  const FORMAT_SIZE = /\b(7|10|12)\s*("|''|”|″|inch\b)/i;
  // a piece of a format list that starts a new format (rather than describing the one before it)
  const FORMAT_WORD = /vinyl|\bcd|\bcdr\b|cassette|\bfile\b|digital|flexi|shellac|lathe|acetate|minidisc|\bdat\b|reel|8-track|\bdvd|blu-?ray|laser ?disc|\bvhs\b|\bsacd\b|\bhdcd\b|all media|^\s*(7|10|12)\s*("|'')\s*\S/i;
  const RELEASE_TYPES = [['album', 'album'], ['lp', 'album'], ['mini-album', 'ep'], ['ep', 'ep'], ['single', 'single'], ['maxi-single', 'single'],
    ['compilation', 'compilation'], ['mixtape', 'mixtape'], ['mixed', 'dj-mix'], ['soundtrack', 'soundtrack']];
  /* "Vinyl (7", 45 RPM, Single), CD (Album)" -> [{ name, desc: [] }]. Also takes the loose forms found in real tags:
     'Vinyl 7", Single Sided', 'File MP3', 'CDr (EP, Promo)', and Picard's own '12" Vinyl' / 'Digital Media'. */
  function splitFormats(s) {
    const parts = []; let depth = 0, cur = '', hard = true;   // hard: the piece followed a ';' (always a new format)
    for (const ch of String(s || '').replace(/^﻿/, '') + '\0') {
      if (ch === '(') depth++;
      if (ch === ')') depth = Math.max(0, depth - 1);
      if ((ch === ',' || ch === ';' || ch === '\0') && !depth) { if (cur.trim()) parts.push([cur.trim(), hard]); cur = ''; hard = ch === ';'; }
      else cur += ch;
    }
    const out = [];
    for (const [p, hard] of parts) {
      const m = p.match(/^(.*?)\s*\((.*)\)/), name = m ? m[1] : p, desc = m ? m[2].split(/\s*,\s*/) : [];
      if (!out.length || hard || FORMAT_WORD.test(name)) out.push({ name, desc });
      else out[out.length - 1].desc.push(p);   // 'Single Sided', '45 RPM' ... belong to the format before
    }
    return out;
  }
  function mediaName(f) {
    let n = f.name.trim().replace(/^\d+\s*x\s*/i, '').replace(/^\d+\s+(?=[a-z])/i, '');   // "2 x CD", "3 CD" (VGMdb) — not '12" Vinyl'
    const size = (n.match(FORMAT_SIZE) || f.desc.join(',').match(FORMAT_SIZE) || [])[1];
    if (/^all media$/i.test(n)) return '';
    if (/vinyl/i.test(n) && !/flexi|lathe/i.test(n)) return size ? size + '" Vinyl' : 'Vinyl';
    if (/^(file|digital)\b|^download/i.test(n)) return 'Digital Media';
    if (/^cd-?r$/i.test(n)) return 'CD-R';
    return n;
  }
  /** Any media tag value (Picard, Discogs, VGMdb, hand-typed) -> Picard-style names, e.g. '12" Vinyl; CD'. */
  const mediaLabel = (s) => [...new Set(splitFormats(s).map(mediaName).filter(Boolean))].join('; ');
  let nameToCC = null;
  function countryCode(name) {
    name = String(name || '').trim();
    if (/^[A-Za-z]{2}$/.test(name)) return name.toUpperCase();
    if (!nameToCC) {
      nameToCC = new Map([['uk', 'GB'], ['us', 'US'], ['usa', 'US'], ['europe', 'XE'], ['worldwide', 'XW'], ['russia', 'RU'], ['south korea', 'KR'],
        ['korea', 'KR'], ['taiwan', 'TW'], ['czech republic', 'CZ'], ['ussr', 'SU'], ['yugoslavia', 'YU'], ['german democratic republic (gdr)', 'XG'], ['east germany', 'XG']]);
      const A = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      if (regionNames) for (const a of A) for (const b of A) { const n = safe(() => regionNames.of(a + b), ''); if (n && n !== a + b && !nameToCC.has(n.toLowerCase())) nameToCC.set(n.toLowerCase(), a + b); }
    }
    for (const part of name.split(/\s*(?:&|,|\/|\band\b)\s*/i)) { const cc = nameToCC.get(part.toLowerCase()); if (cc) return cc; }
    return '';
  }
  const hostOf = (u) => { const m = String(u || '').match(/^(?:https?:\/\/)?(?:www\.)?([^/\s?#]+)/i); return m ? m[1].toLowerCase() : ''; };
  const WEB_SOURCES = [[/discogs\.com$/, 'discogs', 'Discogs'], [/vgmdb\.(net|info)$/, 'vgmdb', 'VGMdb'], [/bandcamp\.com$/, 'bandcamp', 'Bandcamp'],
    [/beatport\.com$/, 'beatport', 'Beatport'], [/(music|itunes)\.apple\.com$/, 'apple', 'Apple Music'], [/deezer\.com$/, 'deezer', 'Deezer'],
    [/spotify\.com$/, 'spotify', 'Spotify'], [/qobuz\.com$/, 'qobuz', 'Qobuz'], [/tidal\.com$/, 'tidal', 'TIDAL'], [/allmusic\.com$/, 'allmusic', 'AllMusic'],
    [/soundcloud\.com$/, 'soundcloud', 'SoundCloud'], [/junodownload\.com$|juno\.co\.uk$/, 'juno', 'Juno'], [/traxsource\.com$/, 'traxsource', 'Traxsource'],
    [/rateyourmusic\.com$/, 'rym', 'RateYourMusic'], [/musicbrainz\.org$/, 'mb', 'MusicBrainz']];
  function normalizeTags(o) {
    if (!o.catalognumber && o.alt_catalog) o.catalognumber = o.alt_catalog;
    if (!o.label && o.alt_label) o.label = o.alt_label;
    if (!o.barcode && o.alt_barcode) o.barcode = o.alt_barcode;
    if (!o.date && o.alt_date) o.date = o.alt_date.replace(/[./]/g, '-');
    /* MP3s: Picard's media goes in the ID3 TMED frame, which foobar2000 reads as MEDIA TYPE / MEDIATYPE, not MEDIA,
       so for those files it arrives through alt_media. Every media value goes through the same clean-up. */
    const rawMedia = (o.media || o.alt_media).replace(/^﻿/, '');
    if (rawMedia) {
      const fm = splitFormats(rawMedia);
      o.media = mediaLabel(rawMedia) || rawMedia;
      if (o.media !== rawMedia) o.mediaDetail = rawMedia;   // the dossier shows "CD (Album, Reissue)", "3 CD" in full
      if (!o.releasetype) {
        const ds = fm.flatMap((f) => f.desc.map((d) => d.trim().toLowerCase()));
        const hit = RELEASE_TYPES.find(([d]) => ds.includes(d));
        if (hit) o.releasetype = hit[1];
      }
    }
    if (!o.releasecountry && o.alt_country) {
      const cc = countryCode(o.alt_country);
      if (cc) o.releasecountry = cc;
      if (!cc || /&|,|\//.test(o.alt_country)) o.countryText = o.alt_country;   // "UK & Europe" keeps its words
    }
    // where the tags came from
    const src = [], add = (id, name, url, ids) => { if (!src.some((s) => s.id === id)) src.push({ id, name, url, ids: ids || [] }); };
    if (o.mb_release || o.mb_recording) add('mb', 'MusicBrainz', o.mb_release ? 'https://musicbrainz.org/release/' + firstOf(o.mb_release) : '');
    const urls = String(o.www || '').split(/;\s*/).concat(o.vgmdb_url || []).filter(Boolean);
    const dRel = firstOf(o.discogs_release).replace(/^\[?r/i, '').replace(/\]$/, ''), dMas = firstOf(o.discogs_master).replace(/^\[?m/i, '').replace(/\]$/, '');
    const dUrl = urls.find((u) => /discogs\.com/i.test(u));
    if (dRel || dMas || dUrl) add('discogs', 'Discogs', dRel ? 'https://www.discogs.com/release/' + dRel : dUrl || 'https://www.discogs.com/master/' + dMas, [
      ['Release', dRel, dRel && 'https://www.discogs.com/release/' + dRel], ['Master', dMas, dMas && 'https://www.discogs.com/master/' + dMas],
      ['Artist', firstOf(o.discogs_artist), o.discogs_artist && 'https://www.discogs.com/artist/' + firstOf(o.discogs_artist)],
      ['Label', firstOf(o.discogs_labelid), o.discogs_labelid && 'https://www.discogs.com/label/' + firstOf(o.discogs_labelid)]]);
    const vUrl = urls.find((u) => /vgmdb\.(net|info)/i.test(u)), vId = firstOf(o.vgmdb_id) || ((vUrl || '').match(/album\/(\d+)/) || [])[1] || '';
    if (vUrl || vId) add('vgmdb', 'VGMdb', vUrl || 'https://vgmdb.net/album/' + vId, [['Album', vId, vId && 'https://vgmdb.net/album/' + vId]]);
    for (const u of urls) {
      const h = hostOf(u); if (!h) continue;
      const w = WEB_SOURCES.find(([re]) => re.test(h));
      add(w ? w[1] : 'web:' + h, w ? w[2] : h, /^https?:/i.test(u) ? u : 'https://' + u);
    }
    o.sources = src;
  }

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
    // CUERipper writes an EAC-style log ("EAC extraction logfile from ..."): it must be recognised before EAC
    [/^\s*CUERipper\s*v?([\d.]+)/im, 'CUERipper'],
    [/\[CUETools log; Date: [^;\]]*; Version: ([^\]]+)\]/i, 'CUETools'],
    [/^\[Verification date: [^\]]+\]()/m, 'CUETools'],   // older CUETools .accurip
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
  // which document is "the" verification: EAC first, then the others; the rest are listed as extra documentation
  const RIP_RANK = ['EAC', 'XLD', 'CUERipper', 'dBpoweramp', 'whipper', 'Rubyripper', 'EZ CD Audio Converter', 'morituri', 'CUETools'];
  const ripRank = (r) => { const i = RIP_RANK.indexOf(r.ripper); return i < 0 ? RIP_RANK.length : i; };

  function parseRipLog(text, trackNo) {
    const r = { ripper: '', version: '' };
    for (const [re, name] of RIPPERS) {
      const m = text.match(re);
      if (m) { r.ripper = name; r.version = (m[1] || '').replace(/[,;]$/, ''); break; }
    }
    if (!r.ripper) return null;
    const g = (re) => { const m = text.match(re); return m ? m[1].trim() : ''; };
    if (r.ripper === 'whipper') return parseWhipper(text, trackNo, r, g);
    if (r.ripper === 'dBpoweramp') return parseDBpa(text, trackNo, r, g);
    if (r.ripper === 'CUETools') return parseAccurip(text, trackNo, r, g);
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
      } else {
        // whole-CD image rips ("Range status") have no per-track sections: use the track's AccurateRip summary line
        const ar = text.match(new RegExp('^\\s*Track\\s+0*' + n + '\\s+((?:accurately ripped|cannot be verified|not present)[^\\r\\n]*)', 'im'));
        if (ar) r.track = { ar: ar[1].replace(/\s+/g, ' ').trim().replace(/^./, (c) => c.toUpperCase()) };
      }
    }
    return r;
  }

  /* UTF-16 logs (what EAC writes): H.readAllText stops at the first NUL byte, and UTF-16 text has one after almost
     every character, so only the first letter comes through. foo_webview2 can't write or download files, but the page
     itself is served from this folder (http://foo_uie_webview.local/), where fetch() returns raw bytes. So Windows'
     own robocopy copies the log, unchanged, into logcache\<id>\ next to the page; the page then fetches it and decodes
     the UTF-16 itself. Each log is copied once; the copies stay as a cache (a few KB each). */
  const utf16Text = new Map(), utf16Busy = new Set(), ripLogCbs = [];
  const onRipLog = (cb) => ripLogCbs.push(cb);
  const pathId = (s) => { let h = 0x811c9dc5; for (const ch of s.toLowerCase()) { h ^= ch.codePointAt(0); h = Math.imul(h, 0x01000193); } return (h >>> 0).toString(16).padStart(8, '0'); };
  function decodeLogBytes(buf) {
    const b = new Uint8Array(buf);
    if (b[0] === 0xFE && b[1] === 0xFF) return new TextDecoder('utf-16be').decode(b);
    if (b[0] === 0xFF && b[1] === 0xFE) return new TextDecoder('utf-16le').decode(b);
    return new TextDecoder(b[1] === 0 ? 'utf-16le' : 'utf-8').decode(b);
  }
  async function loadUtf16Log(p, dirKey) {
    if (utf16Busy.has(p)) return;
    utf16Busy.add(p);
    const id = pathId(p), name = p.slice(p.lastIndexOf('/') + 1);
    const url = 'logcache/' + id + '/' + encodeURIComponent(name);
    const grab = async () => { try { const r = await fetch(url, { cache: 'no-store' }); return r.ok ? decodeLogBytes(await r.arrayBuffer()) : null; } catch (e) { return null; } };
    let text = await grab();
    if (text === null && safe(() => H.canExecuteShellOperations, true)) {
      // every panel runs its own copy of this file: only one of them launches the copy
      const lock = 'logcopy:' + id, busy = +(safe(() => localStorage.getItem(lock)) || 0);
      if (Date.now() - busy > 15000) {
        safe(() => localStorage.setItem(lock, String(Date.now())));
        const srcDir = p.slice(0, p.lastIndexOf('/')).split('/').join(BS);
        const dstDir = (profileDir.replace(/\/$/, '') + '/webview/y2k/logcache/' + id).split('/').join(BS);
        safe(() => H.execute('robocopy.exe', '"' + srcDir + '" "' + dstDir + '" "' + name + '" /R:0 /W:0 /NJH /NJS /NFL /NDL /NP', '', 'open', 0));
      }
      for (let i = 0; i < 40 && text === null; i++) { await new Promise((r) => setTimeout(r, 150)); text = await grab(); }
    }
    if (text) {
      utf16Text.set(p, text.replace(/^﻿/, ''));
      for (const k of [...logCache.keys()]) if (k.startsWith(dirKey + '|')) logCache.delete(k);
      ripLogCbs.forEach((cb) => safe(() => cb(p)));
    } else utf16Busy.delete(p); // try again next time this album comes up
  }

  /* whipper (Linux): YAML-style report — "Log created by: whipper 0.10.0", "Ripping phase information:",
     "Tracks:" / "  3:" / "    Copy CRC: ...", "Conclusive status report:" with "AccurateRip summary" + "Health status" */
  function parseWhipper(text, trackNo, r, g) {
    r.date = g(/Log creation date:\s*([^\r\n]+)/i);
    r.drive = g(/^\s*Drive:\s*([^\r\n]+)/im);
    r.readMode = g(/Extraction engine:\s*([^\r\n]+)/i);
    r.offset = g(/Read offset correction:\s*([-+\d]+)/i);
    r.gap = g(/Gap detection:\s*([^\r\n]+)/i);
    r.ar = g(/AccurateRip summary:\s*([^\r\n]+)/i);
    r.errors = /Health status:\s*No errors occurr?ed/i.test(text) ? 'No errors' : g(/Health status:\s*([^\r\n]+)/i);
    r.checksum = /SHA-256 hash:\s*[0-9A-F]{64}/i.test(text) ? 'whipper SHA-256 hash present' : '';
    r.ok = r.errors === 'No errors' || (/^All tracks accurately ripped/i.test(r.ar) && !r.errors);
    const ti = text.search(/^Tracks:\s*$/m);
    if (trackNo && ti >= 0) {
      const n = parseInt(trackNo, 10);
      const m = text.slice(ti).match(new RegExp('^ {2}0*' + n + ':\\s*\\r?\\n([\\s\\S]*?)(?=^ {2}\\d+:\\s*$|^\\S)', 'm'));
      if (m) {
        const s = m[1], tg = (x) => { const k = s.match(x); return k ? k[1].trim() : ''; };
        const res = tg(/AccurateRip v2:\s*\r?\n\s*Result:\s*([^\r\n]+)/i) || tg(/Result:\s*([^\r\n]+)/i);
        const conf = tg(/AccurateRip v2:[\s\S]*?Confidence:\s*(\d+)/i) || tg(/Confidence:\s*(\d+)/i);
        const peak = tg(/Peak level:\s*([\d.]+)/i);
        r.track = {
          peak: peak ? (+peak <= 1 ? (+peak * 100).toFixed(1) : peak) + ' %' : '',
          copyCRC: tg(/Copy CRC:\s*([0-9A-F]{8})/i), testCRC: tg(/Test CRC:\s*([0-9A-F]{8})/i),
          ar: /exact match/i.test(res) ? 'Accurately ripped' + (conf ? ' (confidence ' + conf + ')' : '') : res,
          status: tg(/^\s*Status:\s*([^\r\n]+)/im),
        };
      }
    }
    return r;
  }
  /* dBpoweramp: "dBpoweramp Release 17.3 Digital Audio Extraction Log from ...", settings lines
     ("Ripping with drive '...', Drive offset: 667", "Using C2: No", "Encoder: FLAC ..."), then per track
     "Track 1:  Ripped LBA 0 to 13893 (3:05) in 0:21. Filename: ..." / "AccurateRip: Accurate (confidence 31) [...]" / "CRC32: ..." */
  function parseDBpa(text, trackNo, r, g) {
    r.date = g(/Extraction Log from\s*([^\r\n]+)/i);
    r.drive = g(/Ripping with drive\s*'([^']+)'/i).replace(/\s+/g, ' ');
    r.offset = g(/Drive offset:\s*([-+\d]+)/i);
    r.c2 = g(/Using C2:\s*([A-Za-z]+)/i);
    r.format = g(/^\s*Encoder:\s*([^\r\n]+)/im);
    const blocks = [...text.matchAll(/^\s*Track\s+(\d+):\s*Ripped([\s\S]*?)(?=^\s*Track\s+\d+:|^\s*-{2,}|(?![\s\S]))/gim)];
    const checked = blocks.filter((b) => /AccurateRip:/i.test(b[2])).length;
    const acc = blocks.filter((b) => /AccurateRip:\s*Accurate/i.test(b[2])).length;
    const absent = blocks.filter((b) => /not (?:present|in database)|Unable to verify/i.test(b[2])).length;
    const insecure = blocks.filter((b) => /\bInsecure\b/i.test(b[2])).length;
    r.readMode = /^\s*Ultra::/im.test(text) ? 'Secure (Ultra)' : blocks.some((b) => /\bSecure\b/.test(b[2])) ? 'Secure' : '';
    if (blocks.length) {
      // old logs / vinyl-side rips have no AccurateRip lines at all: say so instead of "0 out of N"
      r.ar = !checked ? '' : acc === blocks.length ? 'All tracks accurately ripped' : absent === checked ? 'None of the tracks are present in the AccurateRip database'
        : acc + ' out of ' + blocks.length + ' tracks accurately ripped';
      r.errors = insecure ? insecure + ' insecure track' + (insecure === 1 ? '' : 's') : 'No errors';
    }
    r.ok = blocks.length > 0 && !insecure;
    if (trackNo) {
      const b = blocks.find((x) => +x[1] === parseInt(trackNo, 10));
      if (b) {
        const s = b[2], tg = (x) => { const k = s.match(x); return k ? k[1].trim() : ''; };
        r.track = { copyCRC: tg(/CRC32:\s*([0-9A-F]{8})/i), ar: tg(/AccurateRip:\s*([^\r\n[]+)/i), status: tg(/\b(Insecure|Secure(?: \(Warning\))?)\b/i) };
      }
    }
    return r;
  }
  /* CUETools .accurip: an AccurateRip / CTDB check of the ripped files, not a rip log —
     "[CUETools log; Date: ...; Version: 2.1.6]", " 01     [0d6a1e8a|8d5f3d1b] (05/12) Accurately ripped" */
  function parseAccurip(text, trackNo, r, g) {
    r.date = g(/\[CUETools log; Date: ([^;\]]+)/i) || g(/\[Verification date: ([^\]]+)\]/i);
    r.readMode = 'Verification of the ripped files';
    const rows = new Map();
    for (const m of text.matchAll(/^\s*(\d+)\s+\[[0-9a-f]{8}(?:\|[0-9a-f]{8})?\]\s+\(([^)]*)\)\s+([^\r\n]+)/gim)) if (!rows.has(+m[1])) rows.set(+m[1], m);
    const acc = [...rows.values()].filter((m) => /Accurately ripped/i.test(m[3])).length;
    if (rows.size) r.ar = acc === rows.size ? 'All tracks accurately ripped' : acc + ' out of ' + rows.size + ' tracks accurately ripped';
    const ctdb = g(/\[CTDB TOCID:[^\]]*\]\s*([^\r\n]+)/i);
    if (ctdb) r.checksum = 'CTDB: ' + ctdb;
    r.ok = rows.size > 0 && acc === rows.size;
    const row = trackNo && rows.get(parseInt(trackNo, 10));
    if (row) r.track = { ar: row[3].trim() + ' (' + row[2] + ')' };
    return r;
  }

  /* All rip documentation in the album folder (.log, .accurip, and .txt files whose first lines name a ripper).
     Returns the main one — EAC first, see RIP_RANK — with the rest in .others. */
  const logCache = new Map();
  const DOC_FILE = /\.(log|txt|accurip)$/i, NOT_RIP = /audiochecker|spectro|lac\b|auCDtect|install|debug|lyric|readme|\bnfo\b/i;
  const namesRipper = (text) => RIPPERS.some(([re]) => re.test(text.slice(0, 400)));
  function findRipLog(t) {
    if (!t || !t._local) return null;
    const ck = t.dir + '|' + t.tracknum;
    if (logCache.has(ck)) return logCache.get(ck);
    const files = listDir(t._dirFwd).filter((f) => !f.isDirectory && DOC_FILE.test(f.name) && !NOT_RIP.test(f.name) && f.size < 2e6);
    files.sort((a, b) => b.size - a.size);
    const docs = [];
    for (const f of files) {
      const p = t._dirFwd + '/' + f.name, isTxt = /\.txt$/i.test(f.name);
      const txt = readText(p);
      const looksUtf16 = !txt || txt.length < Math.min(64, f.size / 4) || txt.charCodeAt(0) === 0xFFFD || txt.startsWith('ÿþ');
      let d = null;
      if (!looksUtf16 || utf16Text.has(p)) {
        const body = looksUtf16 ? utf16Text.get(p) : txt;
        if (!isTxt || namesRipper(body)) d = parseRipLog(body, t.tracknum);
        if (d) d.encoding = looksUtf16 ? 'UTF-16' : 'UTF-8';
      } else {
        // not decoded yet: identify the ripper from the first character (read as ANSI) and decode in the background
        const ansi = safe(() => H.readAllText(p, 1252), '');
        const first = ansi.replace(/^ÿþ|^﻿/, '').charAt(0);
        if (UTF16_FIRST[first]) {
          // a .txt only counts once its decoded header names a ripper (it could be any UTF-16 text file)
          if (!isTxt) d = { ripper: UTF16_FIRST[first], version: '', encoding: 'UTF-16', utf16: true };
          loadUtf16Log(p, t.dir);
        }
      }
      if (d) docs.push(Object.assign(d, { file: f.name, path: p, dirKey: t.dir, track: d.track || null }));
    }
    docs.sort((a, b) => ripRank(a) - ripRank(b));   // stable: biggest file first within a ripper
    const out = docs[0] || null;
    if (out) out.others = docs.slice(1);
    if (logCache.size > 40) logCache.clear();
    logCache.set(ck, out);
    return out;
  }
  /** Full text of a rip document (UTF-16 logs are decoded through logcache first). */
  async function ripLogText(doc) {
    if (!doc.utf16 && doc.encoding !== 'UTF-16') return readText(doc.path);
    if (!utf16Text.has(doc.path)) {
      loadUtf16Log(doc.path, doc.dirKey || '');
      for (let i = 0; i < 60 && !utf16Text.has(doc.path) && utf16Busy.has(doc.path); i++) await new Promise((r) => setTimeout(r, 150));
    }
    return utf16Text.get(doc.path) || '';
  }

  /* ------------------------------------------------------------ rip log window
     Opened from the deck's CD RIP badge or the dossier tab, styled like the deck customizer.
     One tab per document; the main one (EAC first) opens first. */
  const LOG_OK = /accurately ripped|exact match|No errors occurr?ed|Copy OK|AccurateRip:\s*Accurate\b|Health status:\s*No errors/i;
  const LOG_BAD = /suspicious|insecure|inaccurate|cannot be verified|not present in|could not be verified|no match|There were errors|errors occurr?ed|Read error|Skip error|Timing problem|Missing samples|mismatch|Some tracks/i;
  const LOG_HEAD = /^\s*(Track\s+\d+:?|Tracks:|TOC:|Range status and errors|AccurateRip summary|Conclusive status report:?|Ripping phase information:|CD metadata:|Extraction Log|Drive & Settings|-{4,}|={4,}.*)\s*$/i;
  function trackLineRe(ripper, n) {
    if (ripper === 'dBpoweramp') return new RegExp('^\\s*Track\\s+0*' + n + ':', 'i');
    if (ripper === 'whipper') return new RegExp('^ {2}0*' + n + ':\\s*$');
    if (ripper === 'CUETools') return new RegExp('^\\s*0*' + n + '\\s+\\[', 'i');
    return new RegExp('^\\s*Track\\s+0*' + n + '\\s*$', 'i');
  }
  /* Like CUSTOMIZE DECK, it opens in a window of its own (the panel's stylesheets and live theme colours copied
     across); if no window can be opened it shows over the panel instead. */
  let logWin = null, logPop = null, logPopDoc = null, logStyles = [], logPoll = 0, logSyncOn = false;
  function syncLogStyles() {
    if (!logPop || logPop.closed) return;
    for (const [src, dst] of logStyles) if (src.tagName === 'STYLE' && dst.textContent !== src.textContent) dst.textContent = src.textContent;
  }
  function closeRipLog() {
    if (logWin) { logWin.remove(); logWin = null; document.removeEventListener('keydown', logKey, true); }
    const w = logPop;
    logPop = null; logPopDoc = null; logStyles = []; clearInterval(logPoll);
    if (w && !w.closed) safe(() => w.close());
  }
  function logKey(e) { if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); closeRipLog(); } }
  // the log's own window, reused while open; null when the browser won't open one
  function popLog() {
    if (logPop && !logPop.closed && logPopDoc && safe(() => logPop.document === logPopDoc, false)) return logPopDoc;
    const W = Math.min(900, screen.availWidth - 40), Hh = Math.min(680, screen.availHeight - 60);
    const L = Math.max(screen.availLeft || 0, Math.round(window.screenX + (window.outerWidth - W) / 2)), T = Math.max(screen.availTop || 0, Math.round(window.screenY + 40));
    const w = safe(() => window.open('', 'metalheart-riplog', 'popup,width=' + W + ',height=' + Hh + ',left=' + L + ',top=' + T), null);
    if (!w || !safe(() => w.document, null)) return null;
    const d = w.document;
    d.open();
    d.write('<!doctype html><html><head><meta charset="utf-8"><base href="' + esc(document.baseURI) + '"><title>Rip Log — Metalheart</title></head><body></body></html>');
    d.close();
    logStyles = [...document.querySelectorAll('link[rel=stylesheet], style')].map((n) => [n, d.head.appendChild(d.importNode(n, true))]);
    const st = d.createElement('style');
    st.textContent = 'html, body { margin: 0; height: 100%; overflow: hidden; background: #121820; }'
      + ' .logv.popped { position: static; height: 100%; padding: 0; display: block; background: none; }'
      + ' .logv.popped .logv-win { width: 100%; height: 100%; border-radius: 0; border: none; box-shadow: none; }';
    d.head.appendChild(st);
    if (!logSyncOn) { logSyncOn = true; onSchemeChange(syncLogStyles); }
    /* keep it a log window, not a browser (same rules as the customizer): leaving the page closes it, and browser
       shortcuts, back/forward mouse buttons, the right-click menu and drag-and-drop are switched off */
    w.addEventListener('pagehide', () => { if (logPop === w) { logWin = null; closeRipLog(); } setTimeout(() => safe(() => w.close()), 0); });
    w.addEventListener('keydown', (e) => {
      const k = (e.key || '').toLowerCase();
      if (k === 'escape') { e.preventDefault(); closeRipLog(); return; }
      const edit = ['c', 'a'].includes(k) && !e.altKey;
      if (((e.ctrlKey || e.metaKey) && !edit) || (e.altKey && k !== 'alt') || /^f\d+$/.test(k) || k.startsWith('browser')) e.preventDefault();
    }, true);
    for (const ev of ['mousedown', 'mouseup', 'auxclick']) w.addEventListener(ev, (e) => { if (e.button === 3 || e.button === 4) e.preventDefault(); }, true);
    w.addEventListener('contextmenu', (e) => e.preventDefault(), true);
    w.addEventListener('dragover', (e) => e.preventDefault(), true);
    w.addEventListener('drop', (e) => e.preventDefault(), true);
    logPop = w; logPopDoc = d;
    window.addEventListener('pagehide', closeRipLog, { once: true });   // the panel reloads: its window goes too
    // closed with its X, or showing some other page: tidy up; also keeps the look colours in step
    logPoll = setInterval(() => {
      if (!logPop) return clearInterval(logPoll);
      if (logPop.closed || !safe(() => logPop.document === logPopDoc, false)) { logWin = null; closeRipLog(); return; }
      syncLogStyles();
    }, 250);
    return d;
  }
  function showRipLog(rip, trackNo, start = 0) {
    if (!rip) { closeRipLog(); return; }
    if (logWin) { logWin.remove(); logWin = null; document.removeEventListener('keydown', logKey, true); }
    const docs = [rip, ...(rip.others || [])];
    const pd = popLog(), host = pd || document;
    logWin = host.createElement('div');
    logWin.className = 'logv' + (pd ? ' popped' : '');
    logWin.innerHTML = '<div class="logv-win"><div class="logv-head"><b>RIP LOG</b><span class="logv-sub"></span><span class="logv-sp"></span>' +
      '<span class="logv-btn" data-act="track" hidden></span><span class="logv-btn" data-act="file" title="Open this file in your text editor">OPEN FILE</span>' +
      '<span class="logv-btn lime" data-act="close" title="Close (Esc)">DONE</span></div>' +
      (docs.length > 1 ? '<div class="logv-tabs">' + docs.map((d, i) => '<i data-i="' + i + '" title="' + esc(d.file) + '">' + esc(d.ripper + (i === 0 ? ' · MAIN' : '')) + '</i>').join('') + '</div>' : '') +
      '<div class="logv-sum"></div><div class="logv-text"><div class="logv-wait">READING LOG…</div></div></div>';
    host.body.appendChild(logWin);
    if (pd) { pd.title = 'Rip Log — ' + (rip.file || 'Metalheart'); safe(() => logPop.focus()); }
    else {
      document.addEventListener('keydown', logKey, true);
      logWin.addEventListener('mousedown', (e) => { if (e.target === logWin) closeRipLog(); });
    }
    let cur = 0, seq = 0;
    const $l = (s) => logWin.querySelector(s);
    async function show(i) {
      cur = i; const d = docs[i], my = ++seq;
      logWin.querySelectorAll('.logv-tabs i').forEach((el) => el.classList.toggle('on', +el.dataset.i === i));
      $l('.logv-sub').textContent = [d.ripper + (d.version ? ' ' + d.version : ''), d.file].join(' · ');
      const chip = (label, v, cls) => (v ? '<span class="logv-chip ' + (cls || '') + '"><em>' + label + '</em>' + esc(v) + '</span>' : '');
      const arOk = d.ar && /^All tracks accurately ripped/i.test(d.ar);
      $l('.logv-sum').innerHTML = chip('ACCURATERIP', d.ar, d.ar ? (arOk ? 'ok' : 'bad') : '') + chip('ERRORS', d.errors, d.errors ? (d.errors === 'No errors' ? 'ok' : 'bad') : '') +
        chip('RIPPED', d.date) + chip('DRIVE', d.drive) + chip('OFFSET', d.offset) + chip('MODE', d.readMode) + chip('CHECKSUM', d.checksum);
      const box = $l('.logv-text');
      box.innerHTML = '<div class="logv-wait">READING LOG…</div>';
      const text = await ripLogText(d);
      if (!logWin || my !== seq) return;
      if (!text) { box.innerHTML = '<div class="logv-wait">COULD NOT READ THIS FILE<br><span>Use OPEN FILE to view it in your text editor</span></div>'; return; }
      const lines = text.replace(/^﻿/, '').split(/\r?\n/);
      const n = parseInt(trackNo, 10), re = n ? trackLineRe(d.ripper, n) : null;
      const from = d.ripper === 'whipper' ? Math.max(0, lines.findIndex((l) => /^Tracks:\s*$/.test(l))) : 0;
      const hit = re ? lines.findIndex((l, k) => k >= from && re.test(l)) : -1;
      box.innerHTML = lines.map((l, k) => {
        const c = LOG_HEAD.test(l) ? 'hd' : LOG_BAD.test(l) && !/Re-?Rip Insecure Sectors|No errors/i.test(l) ? 'bad' : LOG_OK.test(l) ? 'ok' : '';
        return '<div' + (c ? ' class="' + c + '"' : '') + (k === hit ? ' id="logvTrack"' : '') + '>' + (esc(l) || ' ') + '</div>';
      }).join('');
      box.scrollTop = 0;
      const tb = $l('[data-act="track"]');
      tb.hidden = hit < 0; tb.textContent = '▸ TRACK ' + n; tb.title = 'Jump to this track in the log';
    }
    logWin.querySelectorAll('.logv-tabs i').forEach((el) => { el.onclick = () => show(+el.dataset.i); });
    logWin.querySelector('.logv-head').addEventListener('click', (e) => {
      const act = e.target.dataset && e.target.dataset.act;
      if (act === 'close') closeRipLog();
      else if (act === 'file') openFile(docs[cur].path);
      else if (act === 'track') { const el = $l('#logvTrack'), box = $l('.logv-text'); if (el) box.scrollTop = el.offsetTop - 6; }
    });
    show(Math.min(Math.max(0, start | 0), docs.length - 1));
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
  /* --------------------------------------------------------------- theme updates
     VERSION is this copy of the theme: bump it for every GitHub release and tag the release v<VERSION>.
     checkUpdate asks GitHub for the latest release (cached an hour unless forced). */
  const VERSION = '1.4';
  const REPO = 'embe-mb/foobar2000-Metalheart-Y2K';
  const verNum = (s) => String(s || '').replace(/^v/i, '').split('.').map((n) => parseInt(n, 10) || 0);
  function isNewer(a, b) {
    const x = verNum(a), y = verNum(b);
    for (let i = 0; i < Math.max(x.length, y.length); i++) if ((x[i] || 0) !== (y[i] || 0)) return (x[i] || 0) > (y[i] || 0);
    return false;
  }
  async function checkUpdate(force) {
    let r = force ? undefined : store.get('y2k:update', DAY / 24);
    if (!r) {
      const res = await fetch('https://api.github.com/repos/' + REPO + '/releases/latest', { headers: { Accept: 'application/vnd.github+json' }, cache: 'no-store' });
      if (!res.ok) throw new Error('GitHub ' + res.status);
      const j = await res.json();
      const a = (j.assets || []).find((x) => /^metalheart.*\.zip$/i.test(x.name || ''));
      r = { latest: String(j.tag_name || '').replace(/^v/i, ''), page: j.html_url || 'https://github.com/' + REPO + '/releases/latest',
        url: a ? a.browser_download_url : '', size: a ? a.size : 0, date: j.published_at || '' };
      store.set('y2k:update', r);
    }
    return Object.assign({ current: VERSION, newer: !!r.url && isNewer(r.latest, VERSION) }, r);
  }

  async function artistCountry(mbid) {
    if (!mbid) return '';
    const a = await mb('artist/' + mbid).catch(() => null);
    if (!a) return '';
    return a.country || (a.area && a.area['iso-3166-1-codes'] && a.area['iso-3166-1-codes'][0]) || '';
  }

  /* --------------------------------------------------------------- shell / commands
     Main-menu commands go through foobar2000.exe /command:"Name" (the running foobar2000 gets them). A portable
     install keeps foobar2000.exe next to its profile folder; a standard install keeps the profile in
     %APPDATA%\foobar2000-v2 and the program elsewhere, so the installer leaves the program's path in fb2k-exe.txt
     and the usual install folders come after that. */
  const profileDir = toFwd(safe(() => H.profilePath)).replace(/\/$/, '');
  const exePath = (() => {
    const has = (dir) => !!dir && listDir(dir).some((f) => !f.isDirectory && f.name.toLowerCase() === 'foobar2000.exe');
    const saved = toFwd(readText(profileDir + '/webview/y2k/fb2k-exe.txt')).trim().replace(/\/foobar2000\.exe$/i, '');
    const dir = [saved, profileDir.replace(/\/[^/]+$/, ''), 'C:/Program Files/foobar2000', 'C:/Program Files (x86)/foobar2000'].find(has);
    return dir ? dir + '/foobar2000.exe' : '';
  })();
  const openUrl = (url) => safe(() => H.execute(url, '', '', 'open', 1));
  const openFile = (pathFwd) => safe(() => H.execute(pathFwd.split('/').join(BS), '', '', 'open', 1));
  /** Runs foobar2000.exe with these arguments; says so once when foobar2000.exe can't be found. */
  let exeWarned = false;
  function runFb2k(args) {
    if (exePath) return safe(() => { H.execute(exePath.split('/').join(BS), args, '', 'open', 1); return true; }, false);
    if (!exeWarned) {
      exeWarned = true;
      alert('METALHEART // Y2K can\'t find foobar2000.exe, so this button can\'t reach foobar2000.\n\n' +
        'Run "Install Metalheart Y2K.cmd" again and pick your foobar2000 folder: the theme remembers it from then on.');
    }
    return false;
  }
  const runCommand = (name) => runFb2k('/command:"' + name + '"');

  /* --------------------------------------------------------------- Navidrome / Subsonic
     One server for every panel (Media Library, Artist Bio): its address, the user and a salted token (Subsonic token
     auth, md5(password + salt); the password itself is never kept) in localStorage 'y2k:navidrome'.
     Tracks go into playlists as the server's own stream URLs (format=raw = the original file, so seeking works).
     foobar2000 plays and tags those by itself; foo_navidrome's navidrome:// paths would only play once that
     component has the same server in its own preferences. */
  const ND_KEY = 'y2k:navidrome';
  const ndCfg = () => safe(() => JSON.parse(localStorage.getItem(ND_KEY)), null) || null;
  const ndAuth = (c) => 'u=' + encodeURIComponent(c.user) + '&t=' + c.token + '&s=' + c.salt + '&v=1.16.1&c=metalheart';
  async function nd(ep, q, c = ndCfg(), ms = 8000) {
    if (!c) throw new Error('Navidrome is not set up');
    const ctl = new AbortController(), timer = setTimeout(() => ctl.abort(), ms);
    try {
      const res = await fetch(c.url + '/rest/' + ep + '.view?' + ndAuth(c) + '&f=json' + (q ? '&' + q : ''), { signal: ctl.signal, cache: 'no-store' });
      const r = (await res.json())['subsonic-response'];
      if (!r || r.status !== 'ok') throw new Error(r && r.error && r.error.message || 'unexpected reply');
      return r;
    } finally { clearTimeout(timer); }
  }
  const ndCover = (id, size, c = ndCfg()) => c && id ? c.url + '/rest/getCoverArt.view?' + ndAuth(c) + '&id=' + encodeURIComponent(id) + (size ? '&size=' + size : '') : '';
  const ndStream = (id, c = ndCfg()) => c.url + '/rest/stream.view?id=' + encodeURIComponent(id) + '&' + ndAuth(c) + '&format=raw';
  /** An album's songs in disc / track order. */
  async function ndSongs(albumId) {
    const r = await nd('getAlbum', 'id=' + encodeURIComponent(albumId));
    return ((r.album || {}).song || []).slice().sort((x, y) => (x.discNumber || 1) - (y.discNumber || 1) || (x.track || 0) - (y.track || 0));
  }
  const ndPaths = async (albumId) => (await ndSongs(albumId)).map((s) => ndStream(s.id));
  /** Every album on the server (getAlbumList2 pages of 500); onPage(albumsSoFar) after each page. */
  async function ndAllAlbums(onPage) {
    const all = [];
    for (let off = 0; off < 200000; off += 500) {
      const r = await nd('getAlbumList2', 'type=alphabeticalByName&size=500&offset=' + off, undefined, 20000);
      const page = (r.albumList2 || {}).album || [];
      all.push(...page);
      if (onPage) onPage(all);
      if (page.length < 500) break;
    }
    return all;
  }
  /** Checks the server with these details and saves them; throws an Error with a short message to show. */
  async function ndConnect(typed, user, pass) {
    typed = String(typed || '').trim().replace(/\/+$/, '').replace(/\/(app|rest)(\/.*)?$/i, '').replace(/\/#.*$/, '');
    user = String(user || '').trim();
    const old = ndCfg();
    if (!typed || !user) throw new Error('Enter the server and user');
    let c;
    if (pass) { const salt = [...crypto.getRandomValues(new Uint8Array(8))].map((b) => b.toString(16).padStart(2, '0')).join(''); c = { user, salt, token: md5(pass + salt) }; }
    else if (old && old.user === user) c = { user, salt: old.salt, token: old.token };
    else throw new Error('Enter the password');
    // no http:// or https:// typed: try plain http (home servers) and then https
    const urls = /^https?:\/\//i.test(typed) ? [typed] : ['http://' + typed, 'https://' + typed];
    let err = null;
    for (const url of urls) {
      try { await nd('ping', '', { ...c, url }); c.url = url; err = null; break; }
      catch (e) { if (!err || err.name === 'TypeError' || err.name === 'AbortError') err = e; }
    }
    if (err) throw new Error(err.name === 'TypeError' || err.name === 'AbortError' ? 'Can\'t reach the server' : String(err.message || err));
    localStorage.setItem(ND_KEY, JSON.stringify(c));
    return c;
  }
  const ndForget = () => safe(() => localStorage.removeItem(ND_KEY));

  /** MD5 (hex) of a UTF-8 string: Subsonic's token is md5(password + salt). */
  function md5(str) {
    const b = new TextEncoder().encode(str), n = ((b.length + 8) >>> 6) + 1, w = new Int32Array(n * 16);
    for (let i = 0; i < b.length; i++) w[i >> 2] |= b[i] << ((i % 4) * 8);
    w[b.length >> 2] |= 0x80 << ((b.length % 4) * 8);
    w[n * 16 - 2] = b.length * 8;
    const S = [7, 12, 17, 22, 5, 9, 14, 20, 4, 11, 16, 23, 6, 10, 15, 21];
    const K = Array.from({ length: 64 }, (_, i) => Math.floor(Math.abs(Math.sin(i + 1)) * 2 ** 32) | 0);
    let a0 = 0x67452301, b0 = 0xefcdab89 | 0, c0 = 0x98badcfe | 0, d0 = 0x10325476;
    for (let o = 0; o < w.length; o += 16) {
      let A = a0, B = b0, C = c0, D = d0;
      for (let i = 0; i < 64; i++) {
        let F, g;
        if (i < 16) { F = (B & C) | (~B & D); g = i; }
        else if (i < 32) { F = (D & B) | (~D & C); g = (5 * i + 1) % 16; }
        else if (i < 48) { F = B ^ C ^ D; g = (3 * i + 5) % 16; }
        else { F = C ^ (B | ~D); g = (7 * i) % 16; }
        F = (F + A + K[i] + w[o + g]) | 0;
        A = D; D = C; C = B;
        const s = S[(i >> 4) * 4 + (i % 4)];
        B = (B + ((F << s) | (F >>> (32 - s)))) | 0;
      }
      a0 = (a0 + A) | 0; b0 = (b0 + B) | 0; c0 = (c0 + C) | 0; d0 = (d0 + D) | 0;
    }
    return [a0, b0, c0, d0].map((x) => [0, 8, 16, 24].map((s) => ((x >>> s) & 255).toString(16).padStart(2, '0')).join('')).join('');
  }

  /* --------------------------------------------------------------- synced lyrics (LRC)
     parseLRC(text) -> [{ t, s, w }] sorted by time. Plain LRC: "[01:02.50]words". Enhanced / word-synced LRC (A2,
     as Spotify / Apple Music style files have): "<mm:ss.xx>" stamps before each word, e.g.
     "[00:12.00]<00:12.00>Hold <00:12.40>on <00:12.90>tight<00:13.60>"; a stamp with no word after it ends the last
     word. w = [{ t, s }] (s keeps its trailing space) for such lines, else null. [offset:+/-ms] is honoured. */
  const LRC_T = (m, s) => +m * 60 + parseFloat(String(s).replace(':', '.'));
  function parseLRC(text) {
    const out = [];
    if (!text) return out;
    const off = +((text.match(/\[offset:\s*([+-]?\d+)\s*\]/i) || [])[1] || 0) / 1000;
    // tag values sometimes arrive without line breaks: break before every timestamp that starts a line
    if (!/\n/.test(text)) text = text.replace(/(?<!\])(\[\d+:\d+(?:[.:]\d+)?\])/g, '\n$1');
    for (const raw of text.split(/\r?\n/)) {
      const tags = [...raw.matchAll(/\[(\d+):(\d+(?:[.:]\d+)?)\]/g)];
      if (!tags.length) continue;
      const body = raw.replace(/\[[^\]]*\]/g, '');
      const s = body.replace(/<\d+:\d+(?:[.:]\d+)?>/g, '').replace(/\s+/g, ' ').trim();
      let w = null;
      if (/<\d+:\d+(?:[.:]\d+)?>/.test(body)) {
        w = []; let t = null, end = null;
        for (const part of body.split(/(<\d+:\d+(?:[.:]\d+)?>)/)) {
          const m = part.match(/^<(\d+):(\d+(?:[.:]\d+)?)>$/);
          if (m) { t = LRC_T(m[1], m[2]) - off; end = t; continue; }
          if (!part.trim()) continue;
          w.push({ t, s: part.replace(/\s+/g, ' ').replace(/^ /, '') });
        }
        if (end !== null && w.length && w[w.length - 1].t !== end) w.end = end;
        if (!w.length) w = null;
      }
      for (const m of tags) {
        const t = Math.max(0, LRC_T(m[1], m[2]) - off);
        out.push({ t, s, w: w && w.map((x) => ({ t: x.t === null ? t : Math.max(0, x.t), s: x.s })), end: w && w.end });
      }
    }
    return out.sort((a, b) => a.t - b.t);
  }
  /** One line's words with start/end times: the file's own word stamps, or paced by word length within the line's slot. */
  function lyricWords(line, nextT) {
    if (!line || !line.s) return [];
    const slot = Math.max(0.3, (nextT ?? line.t + 6) - line.t);
    if (line.w && line.w.length) {
      return line.w.map((x, i) => {
        const nx = line.w[i + 1], t1 = nx ? nx.t : line.end ?? Math.min(line.t + slot, x.t + Math.max(0.4, x.s.length * 0.12));
        return { s: x.s, t0: x.t, t1: Math.max(x.t + 0.05, t1) };
      });
    }
    // no word stamps: sing the line over about as long as it takes to say it (never past the next line), each
    // word getting a share of that by its length
    const words = line.s.match(/\S+\s*/g) || [line.s];
    const chars = words.reduce((a, x) => a + x.trim().length + 1, 0), dur = Math.min(slot * 0.92, 0.45 + chars * 0.085);
    let t = line.t;
    return words.map((x) => { const d = (dur * (x.trim().length + 1)) / chars, r = { s: x, t0: t, t1: t + d }; t += d; return r; });
  }

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
  /** Insert paths at the end of a playlist strictly in order. foobar2000 handles every addPath asynchronously and
      finishes them in whatever order the files are read, so firing them all at once jumbles big albums: each path
      is only sent once the previous one has landed. onItem(k, index) reports where path k went (a cue sheet adds
      several items at once); alive() returning false stops a load that has been superseded. */
  function insertInOrder(pl, paths, select, { onItem, done, alive } = {}) {
    let k = 0;
    const next = () => {
      if (alive && !alive()) return;
      if (k >= paths.length) { if (done) done(); return; }
      const before = safe(() => H.getPlaylistItemCount(pl), 0), t0 = Date.now(), i = k++;
      safe(() => H.addPath(pl, before, paths[i], select));
      const wait = () => {
        if (alive && !alive()) return;
        if (safe(() => H.getPlaylistItemCount(pl), 0) > before) { if (onItem) onItem(i, before); next(); }
        else if (Date.now() - t0 > 1500) next(); // unreadable file: skip it
        else setTimeout(wait, 4);
      };
      wait();
    };
    next();
  }
  /** Append unique file paths to a playlist, in order (cue/subsong files are added once). */
  function addPaths(pl, paths, select = false) {
    insertInOrder(pl, [...new Set(paths.filter(Boolean))], select);
  }
  /** Replace "Library Selection" with these tracks and start playing them. */
  function playPaths(paths, startPath) { loadPaths(paths, startPath, true); }
  /** Replace "Library Selection" with these tracks; play, or just focus `startPath`. */
  let loadJob = 0;
  function loadPaths(paths, startPath, play) {
    const pl = playlistIndexByName(LIBSEL, true);
    if (pl < 0) return;
    const uniq = [...new Set(paths.filter(Boolean))];
    if (!uniq.length) return;
    const start = Math.max(0, startPath ? uniq.indexOf(startPath) : 0);
    // a newer load (another double-click) cancels this one, so two albums never mix
    const job = ++loadJob, alive = () => job === loadJob;
    safe(() => H.clearPlaylist(pl));
    // clearing is asynchronous too: wait for it, then insert track by track in order
    const t0 = Date.now();
    const cleared = () => {
      if (!alive()) return;
      if (safe(() => H.getPlaylistItemCount(pl), 0) !== 0 && Date.now() - t0 < 4000) { setTimeout(cleared, 10); return; }
      safe(() => { H.activePlaylist = pl; });
      let started = false;
      // start playing (or focus) as soon as the chosen track has landed; the rest keep arriving behind it
      const begin = (i) => {
        if (started || !alive()) return;
        started = true;
        if (play) { safe(() => H.executePlaylistDefaultAction(pl, i)); return; }
        safe(() => { H.clearPlaylistSelection(pl); H.selectPlaylistItem(pl, i); H.setFocusedPlaylistItem(pl, i); H.ensurePlaylistItemVisible(pl, i); });
      };
      insertInOrder(pl, uniq, false, { alive, onItem: (k, index) => { if (k === start) begin(index); }, done: () => begin(0) });
    };
    cleared();
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

  /* ------------------------------------------------------------------ look: finish + chrome + header colours
     Separate from the accent scheme above. 'y2k:look' = { mode: 'light' | 'dark', chrome: id, caps: id }:
     mode   LIGHT = the brushed silver bezels as designed; DARK = black-chrome bezels with light ink
     chrome tints the bezel surfaces (top bar, control pod, info heads, pills, round buttons)
     caps   recolours the steel blue: panel headers, tabs, buttons and the list selection
     'accent' follows the theme colour. Written as CSS variables (--cr-*, --ink-*, --blue-*, --sel-*) for all panels. */
  const LOOK_CHROME = {
    silver: { name: 'Silver' }, ice: { name: 'Ice', h: 205, s: 0.34 }, rose: { name: 'Rose', h: 342, s: 0.3 }, gold: { name: 'Gold', h: 42, s: 0.42 },
    mint: { name: 'Mint', h: 150, s: 0.26 }, violet: { name: 'Violet', h: 266, s: 0.3 }, accent: { name: 'Theme colour', s: 0.32 },
  };
  const LOOK_CAPS = {
    steel: { name: 'Steel blue' }, ruby: { name: 'Ruby', h: 350 }, violet: { name: 'Violet', h: 272 }, emerald: { name: 'Emerald', h: 152 },
    tangerine: { name: 'Tangerine', h: 24 }, gold: { name: 'Gold', h: 44 }, graphite: { name: 'Graphite', s: 0.1 }, accent: { name: 'Theme colour' },
  };
  const CR_LIGHT = ['ffffff', 'e8edf2', 'c5cdd6', '98a4b1', '6b7786', '3d4753'], CR_DARK = ['a3adb9', '5d6873', '3e4752', '2b323a', '1d232a', '07090c'];
  const CAPS_BASE = { 'blue-0': 'cfe3f7', 'blue-1': '7fb1e3', 'blue-2': '4a86c5', 'blue-3': '2c5d92', 'blue-4': '183a60', 'blue-5': '0d223a', 'sel-0': '3a72aa', 'sel-1': '2c5d92' };
  const INK = { light: ['1a222b', '2a3440', '3d4753', 'rgba(255,255,255,.7)', 'rgba(255,255,255,.95)'], dark: ['e6edf4', 'c3ccd6', '8e9aa8', 'rgba(0,0,0,.65)', 'rgba(255,255,255,.24)'] };
  const lookState = () => {
    const o = safe(() => JSON.parse(localStorage.getItem('y2k:look')), null) || {};
    return { mode: o.mode === 'dark' ? 'dark' : 'light', chrome: LOOK_CHROME[o.chrome] ? o.chrome : 'silver', caps: LOOK_CAPS[o.caps] ? o.caps : 'steel' };
  };
  const accentHue = () => rgb2hsl(tint([156, 255, 46], 0))[0];
  const lookSheet = document.createElement('style');
  (document.head || document.documentElement).appendChild(lookSheet);
  let lookCss = '', look = lookState();
  function applyLook() {
    look = lookState();
    const ch = LOOK_CHROME[look.chrome], cp = LOOK_CAPS[look.caps], ink = INK[look.mode];
    const chH = look.chrome === 'accent' ? accentHue() : ch.h, cpH = look.caps === 'accent' ? accentHue() : cp.h;
    const hex = (rgb) => '#' + rgb.map((v) => v.toString(16).padStart(2, '0')).join('');
    const surf = (x) => { // keep each shade's lightness, give it the chrome's hue
      const rgb = hexRgb(x); if (chH == null) return '#' + x;
      const [, s, l] = rgb2hsl(rgb); return hex(hsl2rgb(chH, Math.min(1, Math.max(s, ch.s * (1 - Math.abs(2 * l - 1) * 0.55))), l));
    };
    const cap = (x) => {
      const rgb = hexRgb(x); if (cpH == null && cp.s == null) return '#' + x;
      const [h, s, l] = rgb2hsl(rgb); return hex(hsl2rgb(cpH ?? h, Math.min(1, s * (cp.s ?? 1)), l));
    };
    let css = ':root{';
    (look.mode === 'dark' ? CR_DARK : CR_LIGHT).forEach((x, i) => { css += '--cr-' + i + ':' + surf(x) + ';'; });
    css += '--ink-0:#' + ink[0] + ';--ink-1:#' + ink[1] + ';--ink-2:#' + ink[2] + ';--ink-sh:' + ink[3] + ';--cr-hl:' + ink[4] + ';';
    for (const [k, x] of Object.entries(CAPS_BASE)) css += '--' + k + ':' + cap(x) + ';';
    css += '}';
    if (css !== lookCss) { lookCss = css; lookSheet.textContent = css; document.documentElement.dataset.look = look.mode; }
  }
  /** Changes part of the look ({ mode, chrome, caps }); every panel follows within a moment. */
  function setLook(patch) { safe(() => localStorage.setItem('y2k:look', JSON.stringify(Object.assign(lookState(), patch)))); applyLook(); }
  applyLook();
  schemeFns.push(() => { if (look.chrome === 'accent' || look.caps === 'accent') applyLook(); });

  applyScheme(true);
  window.addEventListener('storage', (e) => {
    if (/^y2k:(scheme|schemeMode|albumPal)$/.test(e.key || '')) applyScheme();
    if (e.key === 'y2k:look') applyLook();
  });
  setInterval(applyScheme, 1500);
  setInterval(applyLook, 1500);

  return {
    PALETTES, tint, applyScheme, setScheme, fadePriority, setSchemeMode, setAlbumPalette, scopeAccent, specFor, rgb2hsl, onSchemeChange,
    get scheme() { return scheme; }, get schemeMode() { return mode; },
    LOOK_CHROME, LOOK_CAPS, setLook, applyLook, get look() { return look; },
    thumb, embeddedArt, isArtPl, findDirArtFile, idb, onRipLog, showRipLog, closeRipLog, ripLogText, countryCode, mediaLabel, addPaths, playPaths, loadPaths, playlistIndexByName, toFwd, SEP,
    H, BS, esc, log, safe, getTrack, listDir, readText, readImage, resolveArt, findRipLog, parseRipLog,
    countryName, flagHTML, flagFile, barcodeSVG, mb, getJSON, store, artistCountry, openUrl, openFile, runCommand, runFb2k, VERSION, checkUpdate,
    ND_KEY, ndCfg, nd, ndCover, ndStream, ndSongs, ndPaths, ndAllAlbums, ndConnect, ndForget,
    fmtTime, qualityOf, firstOf, clean, debounce, onTrackContextChange, trackKey, profileDir, exePath, DAY, parseLRC, lyricWords,
  };
})();
