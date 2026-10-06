/* METALHEART // Y2K — capsule header strips that sit above the native Columns UI panels. */
'use strict';
(() => {
  const { H, esc, safe } = Y2K;
  const kind = document.body.dataset.kind;          // library | playlist | info
  const $t = document.getElementById('title'), $m = document.getElementById('meta');
  const fmtDur = (s) => {
    s = Math.round(s || 0);
    const d = Math.floor(s / 86400), h = Math.floor((s % 86400) / 3600), m = Math.floor((s % 3600) / 60);
    return d ? d + 'd ' + h + 'h' : h ? h + 'h ' + String(m).padStart(2, '0') + 'm' : m + 'm ' + String(s % 60).padStart(2, '0') + 's';
  };
  const listStats = (getList) => {
    const l = safe(() => getList(), 0);
    if (!l) return null;
    const n = safe(() => H.getMetaDBHandleListCount(l), 0), d = safe(() => H.calculateMetaDBHandleListDuration(l), 0);
    safe(() => H.releaseMetaDBHandleList(l));
    return { n, d };
  };

  function render() {
    if (kind === 'playlist') {
      const pl = safe(() => H.activePlaylist, -1);
      const name = pl >= 0 ? safe(() => H.getPlaylistName(pl), 'Playlist') : 'No playlist';
      const st = pl >= 0 ? listStats(() => H.getPlaylistItemHandles(pl)) : null;
      const playing = safe(() => H.isPlaying, false) && safe(() => H.playingPlaylist, -2) === pl;
      $t.textContent = name;
      $m.innerHTML = (playing ? '<span class="pill lime"><span class="dot"></span>ON AIR</span>' : '') +
        (st ? '<span class="pill dark">' + st.n + ' TRACK' + (st.n === 1 ? '' : 'S') + '</span><span class="pill dark">' + fmtDur(st.d) + '</span>' : '');
    } else if (kind === 'library') {
      $t.textContent = 'Media Library';
      const enabled = safe(() => H.isLibraryEnabled, true);
      const st = enabled ? listStats(() => H.getLibraryItems()) : null;
      $m.innerHTML = st && st.n ? '<span class="pill dark">' + st.n.toLocaleString() + ' TRACKS</span>'
        : '<span class="pill blue clickable" id="add">+ ADD MUSIC</span>';
      const a = document.getElementById('add'); if (a) a.onclick = () => Y2K.runCommand('Configure');
    } else {
      const t = Y2K.getTrack();
      $t.textContent = 'Track Info';
      $m.innerHTML = t._src === 'none' ? '<span class="pill dark">NO SIGNAL</span>'
        : '<span class="pill ' + (t._src === 'playing' ? 'lime' : 'blue') + '"><span class="dot"></span>' + (t._src === 'playing' ? (t._paused ? 'PAUSED' : 'NOW PLAYING') : 'SELECTED') + '</span>';
    }
  }
  const d = Y2K.debounce(render, 150);
  ['playlist:activated', 'playlist:itemsAdded', 'playlist:itemsRemoved', 'playlist:renamed', 'playlist:created', 'playlist:removed',
    'playback:starting', 'playback:stopped', 'playback:paused', 'playback:trackChanged',
    'library:itemsAdded', 'library:itemsRemoved', 'playlist:focusChanged'].forEach((e) => fb2k.on(e, d));
  setInterval(() => { if (kind !== 'library') render(); }, 3000);
  render();
})();
