=====================================================================
  M E T A L H E A R T  //  Y 2 K
  A portable foobar2000 music player skin — chrome, steel blue & toxic lime
=====================================================================

  foobar2000 v2.26 (64-bit, portable) + Columns UI + WebView2 panels.
  Unzip anywhere (Desktop, USB stick, D:\Apps ...) and run foobar2000.exe.
  Nothing is installed into Windows; every setting lives in .\profile\.


---------------------------------------------------------------------
 REQUIREMENTS
---------------------------------------------------------------------
  * Windows 10 or 11, 64-bit
  * Microsoft Edge WebView2 Runtime — already built into Windows 11 and
    current Windows 10. If the top "deck" and the Dossier / Bio tabs stay
    blank, install the Evergreen runtime:
    https://developer.microsoft.com/microsoft-edge/webview2/
  * Internet connection for the optional online features (artist bios,
    artist-country flags, discography covers, lyrics, ListenBrainz).


---------------------------------------------------------------------
 FIRST RUN — 3 QUICK STEPS
---------------------------------------------------------------------
  1. Add your music
     Click  + MUSIC  in the control pod (or Library > Configure) and add your
     music folder(s). The Media Library panel on the left fills in as
     foobar2000 scans. Loose files: File > Add files / Add folder.

  2. ListenBrainz scrobbling (optional)
     File > Preferences > Tools > ListenBrainz 2
     Paste your User Token from https://listenbrainz.org/settings/ and tick
     "Enable submission". Every track you play is then logged to your profile.

  3. Navidrome / Subsonic server (optional)
     File > Preferences > Tools > Navidrome — enter server URL, user, password,
     press "Test connection". Open the server browser with the NAVIDROME
     button in the control pod (or File > Open Navidrome Browser).


---------------------------------------------------------------------
 WHAT'S ON SCREEN
---------------------------------------------------------------------
  THE DECK (top)
    * Jewel case with your cover art and a CD that spins while playing.
      Art priority: folder.*  >  cover.*  >  front.*  >  embedded art  >
      any other image in the folder (or a Scans/Artwork subfolder).
      The little label on the case tells you which file was used.
    * LCD screen: title, artist (+ artist-country flag), year, album,
      badges (CD-rip, lossless/hi-res, release country flag, media,
      release type, label + catalog #, MusicBrainz), a karaoke line showing
      the current synced lyric, an LCD spectrum analyser and the time readout.
    * CD RIP badge — appears ONLY when the album folder contains a ripping
      log (.log from EAC, XLD, CUERipper, dBpoweramp, whipper, Rubyripper,
      EZ CD...). Click it to open the log. Non-rip logs (e.g. audiochecker)
      are ignored.
    * Control pod: transport, volume (wheel works too), playback order
      (click to cycle, right-click to reset), stop-after-current, stereo
      LED VU meter, and shortcuts: PREFS, NAVIDROME, SEARCH, + MUSIC.
    * Click the artist name / album name to open them on MusicBrainz.
    * CUSTOMIZE DECK (green button in the pod) opens the deck customizer.
      Everything applies live and is remembered:
        - THEME COLOUR: recolours every green part of the skin (lime, aqua,
          ice blue, magenta, amber, ember red), cross-fading to the new
          colour. The rainbow swatch is ALBUM ART: the colours come from the
          cover of what you're playing and fade to the next cover's on every
          new album. MONO uses the cover's main colour everywhere; MULTI uses
          up to three of its colours (screen + info tabs / centerpiece,
          spectrum + media library / control pod + playlist). "APPLY TO LYRICS PANEL"
          gives the lyrics highlight the same colour (the lyrics panel is a
          built-in foobar2000 panel; everything else follows by itself).
        - CENTERPIECE: ORB (liquid goo in a wireframe cage with orbit
          rings), TOWERS (PS2-style glass data towers), HELIX (Y2K DNA double
          helix), or CYCLE (a different one on every new track); colour,
          speed and the orb's goo / cage / rings / belt / halo / sparks.
        - LCD BACKGROUND: bubbles, TV static, digital rain, retro grid,
          scan line, effect strength.
        - Readouts, lyric ticker fade and timing offset, credits, cover
          shine, source-medium icon, oscilloscope and VU meter on/off.
      While nothing is playing, the effects run on a demo beat so you can
      preview your changes.

  WAVEFORM SEEKBAR — Metalheart's own seek bar (a web panel, so it follows
    the theme colour). Click or drag to seek, mouse wheel = 5 s back/forward,
    hover for the time under the pointer. FLAC, MP3, AAC/M4A, Ogg/Opus and
    WAV files show their whole waveform within a second of starting (the
    file is copied briefly into profile\webview\y2k\wavecache to be read);
    other formats (ALAC, APE, WavPack, DSD, cue sheets, streams) draw their
    waveform live as they play. Waveforms are remembered, so a track is only
    scanned once. Style (bars / wave / LED), stereo halves, colours, glow and
    time marks: CUSTOMIZE DECK > SEEK BAR.

  MEDIA LIBRARY (left) — custom browser for your whole library
    ARTISTS / ALBUMS / GENRES / YEARS views, cover grid, search box.
    Click an album for its tracklist and PLAY / + ADD / NEW PLAYLIST / FOLDER.
    Double-click a cover or track to load it into "Library Selection" without
    interrupting what's playing, then double-click it there to play. PLAY
    starts the album straight away. Right-click a cover for more.
    "Library Selection" is a separate playlist, so your own playlists are
    never overwritten. Covers come from the album folder, or from the art
    embedded in the files when the folder has no image.

  PLAYLIST (centre) — custom playlist view
    Glossy playlist tabs (click to switch, double-click to rename,
    right-click for rename/duplicate/delete, middle-click to close, + for new).
    Album groups with cover, label, country flag, format and running time.
    Click / Ctrl+click / Shift+click to select, double-click or Enter to play,
    Delete to remove, Ctrl+A select all, Ctrl+F filter. Right-click a track for
    queue / send to new playlist / crop / open folder. FOLLOW keeps the playing
    track in view. Files can't be dragged from Explorer onto this panel — use
    File > Add files / Add folder in the menu bar, or the library.
    Prefer the classic foobar2000 panels (tag editing, drag & drop, sorting)?
    Import themes\Metalheart-Y2K-classic.fcl (see TIPS below).

  RIGHT TABS
    DOSSIER    Everything MusicBrainz Picard writes, organised: Release
               (label, catalog #, country + flag, type, status, media,
               script, ASIN, and a rendered EAN-13/UPC barcode), Track,
               Credits, CD Rip (parsed log: ripper, drive, read mode,
               AccurateRip, errors, checksum, this track's CRC/confidence),
               Audio/File, MusicBrainz IDs (all clickable) and Listening
               stats. Click a capsule header to collapse/expand a section.
    LYRICS     OpenLyrics — synced lyrics (LRCLIB first, then QQ/NetEase/
               Genius). Lyrics are cached in profile\lyrics\.
    ARTIST BIO Photo, origin + flag, years active, genres, band members,
               Wikipedia biography, official/Bandcamp/Discogs/... links and a
               full discography with Cover Art Archive covers (click to open).
    MILKDROP   MilkDrop 2 visualiser with ~900 presets. ALT+ENTER = fullscreen
               (ESC exits), SPACE = next preset, BACKSPACE = previous,
               H = hard cut, F1 = help overlay.
    TAGS       Editable tag list (Columns UI Item Properties).

  Panels follow the playing track; when stopped they show the selected one.


---------------------------------------------------------------------
 TIPS
---------------------------------------------------------------------
  * Best results come from tagging with MusicBrainz Picard. Fields used:
    RELEASECOUNTRY, BARCODE, LABEL, CATALOGNUMBER, MEDIA, RELEASETYPE,
    RELEASESTATUS, SCRIPT, ASIN, ISRC, MUSICBRAINZ_* IDs, ACOUSTID_ID,
    credits (COMPOSER, PRODUCER, ENGINEER, MIXER ...), ORIGINALDATE.
    FLAC/Ogg, MP3 (ID3v2) and M4A tag names are all recognised.
  * Artist flags: taken from an ARTISTCOUNTRY tag if present, otherwise looked
    up once on MusicBrainz and cached.
  * EAC writes its logs as UTF-16 text, which the WebView2 panel can identify
    but not decode, so for those the Dossier shows the ripper and a
    "View rip log" button instead of the parsed AccurateRip details. Logs
    saved as UTF-8 (XLD, whipper, dBpoweramp, CUERipper, or EAC logs
    re-saved as UTF-8) are fully parsed.
  * Messed up the layout? Re-import the original theme:
    File > Preferences > Display > Columns UI > "Import configuration..." and
    pick themes\Metalheart-Y2K.fcl (custom panels) or
    themes\Metalheart-Y2K-classic.fcl (native Columns UI library/playlist).
    Afterwards press CUSTOMIZE DECK > APPLY TO LYRICS PANEL once more if
    you use a theme colour other than lime.
  * Edit the look: the deck, dossier and bio are plain HTML/CSS/JS in
    profile\webview\y2k\ (common.css holds every colour). Panels reload
    automatically when you save a file.


---------------------------------------------------------------------
 COMPONENTS INCLUDED  (profile\user-components-x64\)
---------------------------------------------------------------------
  Columns UI 3.7.0 ................. reupen            (UI framework)
  Album List Panel 2.2.0 ........... reupen            (library tree)
  WebView2 0.3.27 .................. J. Cassis         (HTML panels)
  Waveform Seek Bar 0.5.3 .......... J. Cassis         (installed, not in the layout)
  MilkDrop 2 0.9.14 ................ J. Cassis
  OpenLyrics 1.13 .................. jacquesh
  ListenBrainz 2 1.5.0 ............. phw
  Navidrome / Subsonic 1.19.0 ...... santiagorod92

---------------------------------------------------------------------
 CREDITS & LICENCES FOR BUNDLED ASSETS
---------------------------------------------------------------------
  * Flags: flag-icons by Panayiotis Lipiridis — MIT
    (profile\webview\y2k\flags\LICENSE-flag-icons.txt)
  * Fonts: Orbitron (Matt McInerney), Silkscreen (Jason Kottke),
    DSEG7/DSEG14 (keshikan) — SIL Open Font License 1.1
    (profile\webview\y2k\fonts\OFL-*.txt)
  * MilkDrop presets: original MilkDrop 2 pack + a selection from
    "Cream of the Crop" (ISOSCELES) via the projectM project; textures from
    the projectM texture pack. See profile\milkdrop2\presets\PRESETS-LICENSE.md
  * Online data: MusicBrainz (CC0), Wikipedia text (CC BY-SA 4.0),
    Cover Art Archive, LRCLIB.
  * foobar2000 (c) Peter Pawlowski — https://www.foobar2000.org/
