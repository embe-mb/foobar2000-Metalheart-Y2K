=====================================================================
  M E T A L H E A R T  //  Y 2 K
  A portable foobar2000 music player skin — chrome, steel blue & toxic lime
=====================================================================

  A theme for foobar2000 v2 (64-bit): Columns UI + WebView2 panels.
  foobar2000 itself is not included; install it from https://www.foobar2000.org/
  (the standard installer and the portable option both work).


---------------------------------------------------------------------
 REQUIREMENTS
---------------------------------------------------------------------
  * Windows 10 or 11, 64-bit
  * foobar2000 v2.x, 64-bit (https://www.foobar2000.org/download)
  * Microsoft Edge WebView2 Runtime — already built into Windows 11 and
    current Windows 10. If the top "deck" and the Dossier / Bio tabs stay
    blank, install the Evergreen runtime:
    https://developer.microsoft.com/microsoft-edge/webview2/
  * Internet connection for the optional online features (artist bios,
    artist-country flags, discography covers, lyrics, ListenBrainz).


---------------------------------------------------------------------
 INSTALLING
---------------------------------------------------------------------
  Unzip Metalheart-Y2K-theme.zip first (right-click > Extract All).

  OPTION A — INSTALLER (recommended)
    1. Close foobar2000.
    2. Double-click "Install Metalheart Y2K.cmd".
    3. Check the foobar2000 folder it found (Browse... to change it) and
       press INSTALL. It downloads the components below from their official
       pages, copies the theme files and starts foobar2000.
    4. If foobar2000 asks which user interface to use, pick Columns UI and
       press OK. The installer then applies the Metalheart layout by itself.
    Your previous Columns UI settings are backed up first, to
    <settings folder>\metalheart-backup\<date>\foo_ui_columns.dll.cfg.

  OPTION B — DRAG AND DROP
    1. Close foobar2000.
    2. Open your foobar2000 settings folder:
         portable install  -> the "profile" folder inside your foobar2000 folder
         standard install  -> %APPDATA%\foobar2000-v2  (paste into Explorer)
    3. Drag the CONTENTS of this pack's "profile" folder (webview, milkdrop2)
       into it and allow Windows to merge the folders.
    4. Start foobar2000 and install each component in COMPONENTS below:
       download its .fb2k-component file, then File > Preferences >
       Components > Install... (or drag the file onto that page), Apply,
       and let foobar2000 restart.
    5. When asked which user interface to use, pick Columns UI.
    6. File > Preferences > Display > Columns UI > Import configuration...
       and pick <settings folder>\webview\y2k\layouts\Metalheart-Y2K.fcl
    7. For the clean look, in the View menu untick "Show status pane", then
       "Show toolbars" (that hides the menu bar too; the PREFS button in the
       control pod opens Preferences).

  UPDATING
    When the deck opens it checks the theme's GitHub page for a newer release
    (at most once an hour). If there is one, a notice drops in at the top of the
    deck: DOWNLOAD & INSTALL saves the new zip to your Downloads folder, then
    CLOSE FOOBAR2000 & INSTALL closes foobar2000 and starts the new installer
    (press INSTALL there; it restarts foobar2000 with the new version). The X
    hides the notice for that version. You can also check any time:
    CUSTOMIZE DECK > PERFORMANCE > Theme version > CHECK FOR UPDATE.
    Your deck settings and caches are kept; the Metalheart layout is re-applied
    (your old Columns UI settings are backed up first, as on a first install).

  REMOVING / GOING BACK
    Import another Columns UI configuration, or close foobar2000 and copy the
    backed-up foo_ui_columns.dll.cfg back into <settings folder>\configuration.


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
     Click + NAVIDROME at the top of the Media Library and enter the server's
     address (the one you open Navidrome at in a browser, e.g.
     192.168.1.10:4533), your user and password. The server's albums then show
     up in the Media Library (NAVIDROME badge) and play straight from the
     server; the Artist Bio panel uses the same server. foo_navidrome's own
     browser (NAVIDROME button in the control pod) is set up separately in
     File > Preferences > Tools > Navidrome.


---------------------------------------------------------------------
 WHAT'S ON SCREEN
---------------------------------------------------------------------
  THE DECK (top)
    * Jewel case with your cover art and a CD that spins while playing.
      Art priority: folder.*  >  cover.*  >  front.*  >  embedded art  >
      any other image in the folder (or a Scans/Artwork subfolder).
      The little label on the case tells you which file was used.
    * LCD screen: title, artist (+ artist-country flag), year (a glowing
      segment display), album, badges (CD-rip, lossless/hi-res, release
      country flag, media, release type, label + catalog #, MusicBrainz), a
      karaoke line that lights the current synced lyric word by word, an LCD
      spectrum analyser and the time readout.
    * Top line: spinning reel, status, format, BPM (flashes on every beat),
      MD5, a chevron chaser that sweeps once per beat, L/R meter, track no.
    * Progress strip: click or drag anywhere on it to scan through the
      track, mouse wheel = 5 s. Styles: BAR, TAPE (a VCR tape counter),
      BLOCKS, COMET, or OFF.
    * BPM SCANNER: the seek bar works out every track's tempo and where its
      beats fall (a BPM tag is used if present), and the centerpieces, the
      chevrons and the pod screen hit on the beat. Streams get a live
      estimate. If beats look early or late, adjust CUSTOMIZE DECK > SCREEN >
      BEAT SYNC > Beat timing.
    * CD RIP badge — appears ONLY when the album folder contains a ripping
      log (.log from EAC, XLD, CUERipper, dBpoweramp, whipper, Rubyripper,
      EZ CD...). Click it to open the log. Non-rip logs (e.g. audiochecker)
      are ignored.
    * Control pod: transport, volume (wheel works too), playback order
      (click to cycle, right-click to reset), stop-after-current, the source
      icon (CD, vinyl with a tonearm that follows the song, 7" single, tape,
      MiniDisc...), oscilloscope, stereo LED VU meter, and shortcuts: PREFS,
      NAVIDROME, SEARCH, + MUSIC, CUSTOMIZE DECK and FULL SCREEN (same as
      F11; EXIT or Esc to leave).
    * POD SCREEN: a pocket-LCD game that plays along to the beat — RUNNER
      (jumps a cube on each beat), SHIP (shoots stars on the beat) or BLOB
      (bounces on the beat; heavy bass wakes its little friend), or CYCLE.
    * Click the artist name / album name to open them on MusicBrainz.
    * CUSTOMIZE DECK (green button in the pod) opens the deck customizer in
      its own window. Everything applies live and is remembered:
        - THEME COLOUR: recolours every green part of the skin (lime, aqua,
          ice blue, magenta, amber, ember red), cross-fading to the new
          colour. The rainbow swatch is ALBUM ART: the colours come from the
          cover of what you're playing and fade to the next cover's on every
          new album. MONO uses the cover's main colour everywhere; MULTI uses
          up to three of its colours (screen + info tabs / centerpiece,
          spectrum + media library / control pod + playlist). "APPLY TO LYRICS PANEL"
          gives the native OpenLyrics highlight the same colour.
        - SCREEN: which CENTERPIECE — ORB (liquid goo in a wireframe cage
          that spins up like a top on bass-heavy songs), TOWERS (PS2-style
          glass data towers), HELIX (Y2K DNA double helix), PYRAMID (glass
          tiers that shatter on drops), CUBE (energy balls bouncing off the
          walls of a glass cube on the beat), REACTOR (a speaker cabinet:
          woofers boom on the bass, spikes jet out on the treble, its core
          fires beams through the seams), or CYCLE (a different one on
          every new track); LCD background (bubbles, TV static, digital rain,
          retro grid, scan line, strength); top line; track info & cover;
          beat sync; PERFORMANCE (graphics card in use — red SOFTWARE means
          hardware acceleration is off — and the theme version with CHECK
          FOR UPDATE).
        - LYRICS: lyric ticker, next-line preview, word highlight, line
          transition (RISE / FLIP / DECODE), its length and timing offset.
        - SEEKING: the deck's progress strip and the waveform seek bar.
        - POD: source icon, scope, VU meter and the pod screen.
        - THEME: LIGHT or DARK chrome, the chrome colour and the colour of
          the headers and tabs, for every panel.
        - ORB / TOWERS / HELIX / PYRAMID / CUBE / REACTOR: each centerpiece's own
          settings. While one of these tabs is open it shows on the deck;
          SHOW ON DECK keeps it there.
      While nothing is playing, the effects run on a demo beat so you can
      preview your changes.

  WAVEFORM SEEKBAR — Metalheart's own seek bar (a web panel, so it follows
    the theme colour). Click or drag to seek, mouse wheel = 5 s back/forward,
    hover for the time under the pointer. FLAC, MP3, AAC/M4A, ALAC, Ogg/Opus
    and WAV files show their whole waveform within a second or two of
    starting (the file is copied briefly into profile\webview\y2k\wavecache
    to be read), and the same scan finds the track's BPM; other formats
    (APE, WavPack, DSD, cue sheets, streams) draw their waveform live as they
    play. Waveforms are remembered, so a track is only scanned once. Style
    (bars / wave / LED), stereo halves, colours, glow and time marks:
    CUSTOMIZE DECK > SEEKING.

  MEDIA LIBRARY (left) — custom browser for your whole library
    ARTISTS / ALBUMS / GENRES / YEARS views, cover grid, search box.
    A letter rail down the left jumps through long lists (click or drag).
    ALBUMS sorts: ALL (A-Z), YEAR (earliest or latest first), RANDOM,
    RECENTLY ADDED and RECORD LABEL (each label's releases by date or by
    catalogue number; click a label's header for just its releases).
    Click an artist's name anywhere (here or in Library Selection) to see
    everything they're on, and a label's name on an album page for that
    label. Each view remembers where you were, even after a restart.
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
    Import layouts\Metalheart-Y2K-classic.fcl (see TIPS below).

  TRACK INFO (right) — themed panel with push-button tabs
    DOSSIER    Everything MusicBrainz Picard writes, organised: Release
               (label, catalog #, country + flag, type, status, media,
               script, ASIN, and a rendered EAN-13/UPC barcode), Track,
               Credits, CD Rip (parsed log: ripper, drive, read mode,
               AccurateRip, errors, checksum, this track's CRC/confidence),
               Audio/File, MusicBrainz IDs (all clickable) and Listening
               stats. Click a capsule header to collapse/expand a section.
               Albums tagged from Discogs or VGMdb (e.g. with Mp3tag) fill
               in what MusicBrainz tags leave empty, with their own source
               boxes and links. Rip logs: EAC, XLD, CUERipper, dBpoweramp,
               whipper and CUETools (.accurip); VIEW RIP LOG opens the log
               in its own window, one tab per log in the album folder.
    LYRICS     Synced lyrics that scroll with the song and light up word by
               word (word-synced "enhanced LRC" files too). OpenLyrics finds
               them (LRCLIB first, then QQ/NetEase/Genius) and caches them in
               <settings folder>\lyrics\. Mouse wheel = look around.
               Right-click: search again / manually, edit, mark as
               instrumental, copy, text size.
    ARTIST BIO Photo, origin + flag, years active, genres, band members,
               Wikipedia biography, official/Bandcamp/Discogs/... links and a
               full discography with Cover Art Archive covers. Click an album
               to play it from your Media Library (LIBRARY badge) or your
               Navidrome server (NAVIDROME badge; the Media Library's server);
               otherwise, or with Ctrl+click, it opens on MusicBrainz.
    TAGS       Every common tag, technical info, ReplayGain, file details
               and play stats. Click a value to copy it; right-click to open
               foobar2000's tag editor.
    MILKDROP   (far right key) MilkDrop 2 visualiser with ~900 presets, in
               its own window. Double-click it for full screen, SPACE = next
               preset, BACKSPACE = previous, H = hard cut, F1 = help overlay.
    The classic layout keeps the native Columns UI tabs instead.

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
  * Rip logs are parsed whether they are saved as UTF-8 or as UTF-16 (as EAC
    writes them). A UTF-16 log is copied once, unchanged, into
    profile\webview\y2k\logcache to be read, so the first time a new album
    plays the badge says LOG FOUND for about a second before VERIFIED.
  * Messed up the layout? Re-import the original theme:
    File > Preferences > Display > Columns UI > "Import configuration..." and
    pick <settings folder>\webview\y2k\layouts\Metalheart-Y2K.fcl
    (custom panels) or layouts\Metalheart-Y2K-classic.fcl (native Columns UI library/playlist).
    Afterwards press CUSTOMIZE DECK > APPLY TO LYRICS PANEL once more if
    you use a theme colour other than lime.
  * Edit the look: the deck, dossier and bio are plain HTML/CSS/JS in
    profile\webview\y2k\ (common.css holds every colour). Panels reload
    automatically when you save a file.


---------------------------------------------------------------------
 COMPONENTS  (the installer downloads these; drag-and-drop users install them)
---------------------------------------------------------------------
  Columns UI ........... reupen         https://www.foobar2000.org/components/view/foo_ui_columns
  Album List Panel ..... reupen         https://www.foobar2000.org/components/view/foo_uie_albumlist
  WebView2 ............. J. Cassis      https://www.foobar2000.org/components/view/foo_webview2
  OpenLyrics ........... jacquesh       https://www.foobar2000.org/components/view/foo_openlyrics
  MilkDrop 2 ........... J. Cassis      https://www.foobar2000.org/components/view/foo_vis_milk2
  ListenBrainz 2 ....... phw            https://github.com/phw/foo_listenbrainz2/releases  (optional)
  Navidrome / Subsonic . santiagorod92  https://www.foobar2000.org/components/view/foo_navidrome  (optional)
  Tested with Columns UI 3.7.0, Album List 2.2.0, WebView2 0.3.27, OpenLyrics 1.13,
  MilkDrop 2 0.9.14, ListenBrainz 2 1.5.0, Navidrome 1.19.0.

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
    the projectM texture pack. See <settings folder>\milkdrop2\presets\PRESETS-LICENSE.md
  * Online data: MusicBrainz (CC0), Wikipedia text (CC BY-SA 4.0),
    Cover Art Archive, LRCLIB.
  * The METALHEART // Y2K theme files: MIT licence (LICENSE).
  * foobar2000 (c) Peter Pawlowski (not included) — https://www.foobar2000.org/
