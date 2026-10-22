# Changelog

## v1.3 — 2026-10-21

> **Updating from v1.2:** the deck tells you about this update itself. Press **DOWNLOAD & INSTALL** on the notice at the top of the deck, or go to **CUSTOMIZE DECK › SCREEN › PERFORMANCE › Theme version**. It downloads the new version, closes foobar2000 when you press **CLOSE FOOBAR2000 & INSTALL**, and starts the installer, which restarts foobar2000 when it's done. Your deck settings, caches and library aren't touched. To install by hand instead, close foobar2000, extract `Metalheart-Y2K-theme.zip` and run **`Install Metalheart Y2K.cmd`**.

### New

**REACTOR, a new centerpiece**

<img width="520" alt="REACTOR centerpiece" src="https://raw.githubusercontent.com/embe-mb/foobar2000-Metalheart-Y2K/main/docs/v1.3/reactor.gif" />

- An icosahedral speaker cabinet with a core of light inside. It stands on one corner, so its 20 triangular panels form four rings of five around the top: a crown of spikes, a band of woofers, a band of spikes and a cap of woofers. Every spike sits opposite a woofer.
- **Woofers (10):** the cones punch out on each bass hit and ring back past their resting point like a real cone. They also wobble with the low end, and their rims light up with the bass. The bottom five carry the sub-bass.
- **Spikes (10):** each spike follows its own slice of the treble and jets out of its hole on that slice's peaks, so they fire one after another rather than all at once. They glow white-hot at the tip as they shoot out.
- **Core:** the light inside shows through the seams between the panels and brightens with the music. When it fires, the panels part and thin beams shoot out through the corners and seams, with a different set of seams each time.
- **Extras:** pressure rings and puffs of dust blown out of the woofers, sparks flicking off the spike tips, embers thrown out with the beams, and a flash of light when the core fires. Hard bass hits give it an extra spin.
- **Settings (CUSTOMIZE DECK › REACTOR):**
  - **Woofer boom** and **Spike reach:** how far each moves.
  - **Air & sparks:** the extra particles on or off.
  - **Beams:** when the core fires. **BARS** is the first beat of every bar, **BEATS** is every bass hit, **DROPS** is only when the track kicks in after a quieter stretch, and **OFF** never fires.
  - **Panel split:** how far the panels part when it fires.
  - **Shell:** **METAL** (gunmetal with chrome trim) or **GLASS** (the core glowing inside).
  - **Camera:** **ORBIT**, **FRONT** (a woofer facing you), **TUMBLE** (rolling end over end) or **AUTO** (cuts between them).
- REACTOR is also part of **CYCLE**.

<img width="380" alt="REACTOR, metal shell" src="https://raw.githubusercontent.com/embe-mb/foobar2000-Metalheart-Y2K/main/docs/v1.3/reactor-fire.png" /> <img width="380" alt="REACTOR, glass shell" src="https://raw.githubusercontent.com/embe-mb/foobar2000-Metalheart-Y2K/main/docs/v1.3/reactor-glass.png" />

**Media Library**

<img width="880" alt="RECORD LABEL sort" src="https://raw.githubusercontent.com/embe-mb/foobar2000-Metalheart-Y2K/main/docs/v1.3/library-label.png" />

- **Letter rail:** a strip down the left of ARTISTS, GENRES and ALBUMS that jumps through long lists. Click a letter or drag along the rail, and the current section's letter lights up. **#** at the top holds names starting with a symbol, a number or a non-Latin script. Accented names file under their letter, so Ásgeir goes under A.
- **Album sorts** (ALBUMS tab):
  - **ALL:** A to Z by title, ignoring a leading *The*, *A* or *An*.
  - **YEAR:** a header for each year and a decade rail, with **EARLIEST FIRST** or **LATEST FIRST**.
  - **RANDOM:** a shuffled order that stays the same until you press **SHUFFLE AGAIN**.
  - **RECENTLY ADDED:** newest first, with a header for each month.
  - **RECORD LABEL:** a header for each label with its number of releases, and a rail by label name. Labels spelt slightly differently ("Warp Records", "WARP RECORDS") count as one. Each label's releases are listed **BY RELEASE DATE** or **BY CATALOGUE NO.**, and numbers compare as numbers, so CAT-9 comes before CAT-10. Albums without a label tag are listed last.
- **One label's releases:** click a label's header, click the label name on an album's page, or right-click an album and choose **More on [label]**. The cards show each release's catalogue number.

  <img width="880" alt="One label's releases" src="https://raw.githubusercontent.com/embe-mb/foobar2000-Metalheart-Y2K/main/docs/v1.3/library-label-page.png" />

- **Artist search:** click an artist's name on an album page, or in the **Library Selection** playlist, to see every album they're on. That includes albums where they're a track artist or a featured guest.
- **GENRES** is grouped by letter, like ARTISTS.
- **Remembers where you were:** the tab, sort, search and scroll position of every screen, through BACK and across restarts.
- There's no longer a 4,000-album limit, and the edition line on duplicate albums is easier to read.

**Dossier (Track Info)**

<img width="400" alt="Dossier with VGMdb tags" src="https://raw.githubusercontent.com/embe-mb/foobar2000-Metalheart-Y2K/main/docs/v1.3/dossier-vgmdb.png" />

- **Discogs and VGMdb tags.** Albums tagged with Mp3tag's Discogs or VGMdb sources, or with foo_discogs, now fill the Release section: catalogue number, label, media, country, barcode and date.
  - MusicBrainz tags always win; the others only fill what's empty.
  - Discogs formats are tidied up: "Vinyl (7", 45 RPM, Single)" shows as **7" Vinyl** plus a Single release type.
  - Country names get their flag. Multi-country releases such as "UK & Europe" keep their wording.
- **Tag source boxes** for Discogs (release, master, artist and label links), VGMdb (album link) and store or site links in the URL tags: Bandcamp, Beatport, Apple Music, Deezer, Spotify, Qobuz, TIDAL, AllMusic, SoundCloud, Juno, Traxsource and RYM.
- VGMdb extras when tagged: **Release Notes**, **Event**, **Distributor**, **Manufacturer**, **Classification**, **Publish format** and **Involved** people.
- **More rippers:** CUERipper, dBpoweramp, whipper and CUETools .accurip files (old and new formats) are read, alongside EAC and XLD. CUERipper logs used to be labelled as EAC.
- When an album folder has more than one log, the main one is chosen in the order EAC, XLD, CUERipper, dBpoweramp, whipper. The others are listed under **ALSO IN THIS FOLDER**, each with its own **VIEW** button.

  <img width="400" alt="Rip log with a second document" src="https://raw.githubusercontent.com/embe-mb/foobar2000-Metalheart-Y2K/main/docs/v1.3/dossier-rip.png" />

- **Rip log window.** **VIEW RIP LOG** in the Dossier and the deck's **CD RIP** badge now open the log in a themed window of its own, like the Deck Customizer, instead of Notepad. It has:
  - a tab for each document;
  - summary chips for AccurateRip, errors, date, drive, offset, read mode and checksum;
  - good lines in green and problem lines in amber;
  - a **▸ TRACK n** button that jumps to the playing track;
  - **OPEN FILE** if you still want your text editor.

<img width="880" alt="Rip log window" src="https://raw.githubusercontent.com/embe-mb/foobar2000-Metalheart-Y2K/main/docs/v1.3/riplog-window.png" />

### Changes and fixes

- **Source medium for MP3s.** MusicBrainz Picard stores an MP3's media in a tag that foobar2000 names MEDIA TYPE rather than MEDIA. It's now read, so vinyl, cassette and CD-R rips in MP3 get the right badge and spinning icon. Every format of media tag is now tidied the same way, including Picard's own, Discogs' and hand-typed ones like "Vinyl 7", Single Sided".
- **MD5 readout** now has its own line under NOW PLAYING, so long values no longer squeeze the top line. It also shows on medium-width decks now.

  <img width="760" alt="Top line" src="https://raw.githubusercontent.com/embe-mb/foobar2000-Metalheart-Y2K/main/docs/v1.3/deck-topline.png" />

- **Full screen:** the format line ("FLAC · 16-BIT · 44.1 KHZ · 1411 KBPS · STEREO") is no longer cut short when the track counter is long (e.g. "TRK 01/32 · DISC 2/2") or when Windows display scaling is set to 125% or 150%.
- **Lyrics:** the highlighted lyric line on the deck no longer shaves off the edge of its last letter. In the Lyrics tab, the enlarged current line no longer runs off the sides of a narrow panel.
- **Deck Customizer:** in a narrow window the tabs wrap onto a second row instead of running off the edge.
- **Updater:** it now closes only the foobar2000 that started the update. This matters if you run more than one copy, and applies to updates after this one.

<img width="960" alt="Full-screen deck with REACTOR" src="https://raw.githubusercontent.com/embe-mb/foobar2000-Metalheart-Y2K/main/docs/v1.3/deck-fullscreen.png" />

*Screenshots use made-up demo albums and artists.*

## v1.2 — 2026-10-10

> **Updating from v1.1:** v1.1 has no built-in updater, so this update is done by hand, once. Close foobar2000, extract `Metalheart-Y2K-theme.zip` and run **`Install Metalheart Y2K.cmd`** again. Your components are kept, your Columns UI settings are backed up first, and your deck settings and caches are not touched. The installer re-applies the main Metalheart layout, which brings in the new Track Info panel. From v1.2 on, the deck tells you about new versions itself.

### New

**Built-in updater**

<img width="340" height="76" alt="update" src="https://github.com/user-attachments/assets/e1db701b-0f11-4762-9087-3338059722f6" />

- When the deck opens, it checks this GitHub page for a newer release, at most once an hour. If there is one, a notice slides in at the top of the deck with **DOWNLOAD & INSTALL**, **WHAT'S NEW** and **✕**. ✕ hides the notice for that version only.
- **DOWNLOAD & INSTALL** opens a small window with a progress bar:
  - It saves the new zip to your Downloads folder and unpacks it.
  - **CLOSE FOOBAR2000 & INSTALL** closes foobar2000, waits for it to exit and starts the new installer. Press INSTALL there and it restarts foobar2000 with the new version.
  - **Later** keeps the zip in Downloads for a manual install.
- **CUSTOMIZE DECK › SCREEN › PERFORMANCE › Theme version** shows your version. It has a **CHECK FOR UPDATE** button, or **DOWNLOAD & INSTALL** and **WHAT'S NEW** when a newer release is out.
- The updater only accepts downloads from this repository's releases.

**Two new centerpieces**
- **PYRAMID**
  
  <img width="926" height="720" alt="pyramid" src="https://github.com/user-attachments/assets/bd4a6ffe-9124-46b4-8982-e2a013550f3a" />
  
  - Four tiers (base, two middles, capstone) turn in alternating directions, faster as the track gets more intense.
  - Each bass hit ripples down the tiers from the capstone to the base.
  - Loud passages lift the tiers apart, and a core light shines out of the gaps. Big hits fire a beam from the apex.
  - **Shatter on drops:** when a track drops after a quieter stretch, the pyramid bursts into tumbling glass shards with the core blazing through. Everything slams back together on the beat with a ripple and an apex beam.
  - **Glyph bands:** carved pixel symbols on each tier light up with that tier's frequencies, and a sweep runs through them on the beat.
  - Styles: GLASS, WIRE or SOLID. Options for same-direction tiers, shatter and glyphs.
    
- **CUBE**
  
  <img width="851" height="669" alt="cube" src="https://github.com/user-attachments/assets/138631d4-fa70-473f-8961-e25e7371f371" />
  
  - A big glass cube with a glowing, pulsing ball of energy inside. The ball hits a different wall exactly on each beat, sending rings across the glass, lighting it up and throwing sparks.
  - The struck glass panel pops out of the frame on thin struts, with light showing through the gap, then springs back. The frame itself stays still.
  - Up to 2 extra free balls that bounce off the walls and each other, and get knocked away when the beat ball hits them.
  - **Tesla arcs:** lightning crackles from the balls to the nearest wall (more with treble), between balls that pass close, and in a burst when they collide.
  - **Orbiters:** up to 3 small translucent cubes ride a tilted circular rail around the big one. They tumble, speed up with the music, get a push on each beat and light up in turn. Hard hits can throw a bolt out to them. A light runs around the rail and flashes on the beat, and the rail can be hidden.
  - **Camera:** ORBIT (the same angle as TOWERS, the default), SPIN (the original turning view), CORNER (a corner points at you, so the cube turns like a spinning hexagon) or AUTO (glides between them).
  - Settings: number of balls, free-ball speed, tesla arcs, trails, glass or wire style, ripple strength, panel pop, orbiters, rail, camera.

**BPM scanner and beat sync**
- The waveform seek bar now also finds each track's exact tempo and where every beat falls. It works in the background from the same read it uses to draw the waveform.
  - Tracks with a BPM tag use the tag's tempo, and only the beat positions are scanned.
  - Streams and other files that can't be read get a live tempo estimate from the music as it plays.
  - Tested blind on 15 tagged tracks: 13 matched to within 0.05 BPM.
- Centerpiece bass hits now land on the detected beat, sized by how intense the music is; strong off-beat accents still get through. The helix scanner sweeps once every 8 beats, and the towers' AUTO camera cuts on 16-beat boundaries.
- **BPM readout** in the deck's top line, before the MD5. The number flashes on every beat.
- **Beat sync** settings: lock to the beat on/off, and **Beat timing** (±0.3 s) in case beats look early or late on your setup.

**Pod screen** (a pocket-LCD game screen in the control pod, above the VU meter)
- A 4-shade screen with slow, ghosting pixels and a red power LED while music plays.
- **RUNNER:** a stick figure runs in tempo, crouches just before the beat and jumps a cube right on it, kicking up dust. The sun rises at the start of the track, crosses the sky and sets at the end, with rays flickering on the beat. Birds sometimes fly over, flapping in time. When stopped he stands still and blinks.
  
  <img width="280" height="58" alt="runner" src="https://github.com/user-attachments/assets/d5a5fd30-96b2-489e-b10c-32ed9ddf3830" />

- **SHIP:** a small fighter shoots incoming stars so each explodes on the beat, with a white-hot flash, blast ring, debris, screen flash and a one-pixel jolt. Ringed planets, moons, a gas giant, a blinking satellite and the odd comet drift past. Background stars speed up with the music and streak on treble peaks.
  
  <img width="286" height="56" alt="ship" src="https://github.com/user-attachments/assets/673578f5-b514-4a16-a472-05bda4f85607" />

- **BLOB:** lands on every beat and squashes harder on bigger kicks. It grins when the music is energetic, squints with its mouth open on big kicks, goes wide-eyed with a wiggling antenna and popping notes on treble peaks, and sleeps with floating Z's when stopped.
  
  <img width="281" height="59" alt="blob" src="https://github.com/user-attachments/assets/a21250a5-4584-452d-a7ed-eb2f471777bc" />

  - A **little blob** sleeps beside it. Hard bass slams startle it awake with a "!". While awake it watches, hops along every other beat and sweats on slams. A few seconds after the slams stop it gets drowsy, yawns and dozes off again.
  - Slams shake the screen and throw bouncing pebbles. Landings kick up dust, flatten the grass tufts and make a flower sway on its springy stem.
  - A speaker stack on each side: the woofers pump with the bass and kick on landings, and sound rings roll out on beats in busy parts.
- **CYCLE** picks a different game each track. Busy parts get more cubes and stars, quiet parts fewer.
- Settings: on/off, show, screen tint (DMG green, POCKET grey or THEME colour) and ghosting.

**Themed Track Info panel** (replaces the Columns UI tab stack on the right)

<img width="599" height="72" alt="trackinfo" src="https://github.com/user-attachments/assets/a85d7596-ff2c-4d8b-9783-b3a26dfdefb1" />

- A tab bar like old hi-fi push-buttons: raised keys in a recessed strip, with the active key pressed in and a little LED lit. Tabs: **DOSSIER**, **LYRICS**, **ARTIST BIO**, **TAGS**. The last tab used is remembered, and tabs keep their place when you switch.
- **MILKDROP** sits apart at the far end and opens MilkDrop in its own window; double-click that window for full screen.
- **LYRICS** (new themed view; OpenLyrics still finds and saves the lyrics)
  - Synced lyrics scroll with the song, with the current line large and glowing. Unsynced lyrics scroll slowly through the song.
  - The mouse wheel lets you look around; it snaps back after a few seconds.
  - Shows when it's still searching. If nothing is found, you get **SEARCH AGAIN** and **SEARCH MANUALLY** buttons.
  - Right-click: Search for lyrics, Search manually, Edit lyrics, Show saved lyrics, Mark as instrumental (OpenLyrics' own windows, on the playing track). Also copy the lyrics, open the lyrics folder, stop following the song, make the text bigger or smaller, and open OpenLyrics' settings.
  - OpenLyrics stays in the layout as a 2-pixel strip you won't notice, because it only searches while one of its panels is visible.
- **TAGS** (new themed sheet): every common tag, then technical info, ReplayGain, file details and play stats. Click a value to copy it. Right-click for foobar2000's tag editor, copy all, or open the containing folder.
- The classic layout (`Metalheart-Y2K-classic.fcl`) keeps the native Columns UI tabs.

**Deck progress strip**
- Click or drag anywhere on it to scan through the track, with a time readout as you drag. The mouse wheel skips 5 seconds. The click area is much taller than the old thin bar.
- **Styles** (CUSTOMIZE DECK › SEEKING):
  - **BAR:** the classic slider.
    <img width="1156" height="48" alt="bar" src="https://github.com/user-attachments/assets/8a163dcd-b4a2-4058-8f77-6d28bea77e16" />
  
  - **TAPE:** a glowing VCR tape-remaining display. The left spool empties onto the right one, each spinning faster as its pack shrinks. A row of segments counts down, with **REMAIN ▸▸▸** above it.
    <img width="1154" height="50" alt="tape" src="https://github.com/user-attachments/assets/6106bc96-da01-4d39-bb6f-3957265a648d" />

  - **BLOCKS:** a chunky Y2K progress bar with glossy cells, a running shine and a flash on the beat.
    <img width="1158" height="46" alt="blocks" src="https://github.com/user-attachments/assets/c234db94-f450-4bfb-b641-c943559aae7e" />

  - **COMET:** a glowing head that sheds sparks, with a burst on every beat.
    <img width="1159" height="43" alt="comet" src="https://github.com/user-attachments/assets/50544e41-d73e-4922-ac0a-d27c0b73e776" />

  - **OFF:** hides the strip, for when the waveform seek bar is on screen. The times stay.

**FULL SCREEN button** beside CUSTOMIZE DECK in the control pod. It does the same as F11, and switches to **EXIT** while full screen. F11 and Esc still work, and the button follows either way.

<img width="274" height="37" alt="fullscreen" src="https://github.com/user-attachments/assets/71ccc7a3-e081-4f44-9ee2-21afaf7500a3" />

**THEME tab** (applies to every panel, not just the deck)

<img width="1022" height="76" alt="theme" src="https://github.com/user-attachments/assets/7ae33332-7ce2-4828-a56c-ee3a8dad7ac7" />

- **Chrome finish:** LIGHT (brushed silver, as before) or DARK (black chrome with light lettering on the top bar, control pod, info headers, badges and round buttons).
- **Chrome colour:** Silver, Ice, Rose, Gold, Mint, Violet, or the theme colour.
- **Headers & tabs:** recolours the steel blue of the panel headers, buttons and list selection: Steel blue, Ruby, Violet, Emerald, Tangerine, Gold, Graphite, or the theme colour. The waveform seek bar's unplayed part follows it.

**Karaoke lyrics on the deck**
- The deck's lyric line now lights up word by word.
  - **Word-synced files** (enhanced LRC, as used by Spotify- and Apple Music-style lyrics) light each word on its own timestamp. Partly stamped lines and repeated chorus timestamps are handled.
  - **Ordinary synced lyrics** are paced across the line by word length, and never run past the next line.
- **Line transitions:** RISE (the original), FLIP (a rolodex card turning over) or DECODE (the new line resolves out of scrambled glyphs). The transition length slider applies to all three.
- **Word highlight** has its own on/off toggle. The LYRICS tab uses the same word-by-word fill.

**Artist Bio: play from the discography**
- Clicking an album card plays it straight away if it's in your Media Library, in disc and track order, using "Library Selection" like the library's PLAY button.
- If it isn't in your library but is on your **Navidrome** server, it plays from there.
- Otherwise it opens the MusicBrainz page, as before. **Ctrl+click** always opens MusicBrainz.
- Albums you own get a **LIBRARY** (green) or **NAVIDROME** (blue) badge and a play button on hover.
- Matching uses MusicBrainz tags when present. Otherwise it matches album title plus artist, ignoring things like "(Remastered)" or "(Deluxe Edition)". If you have several copies, the most complete one plays.
- **NAVIDROME +** in the Discography box signs in to your server (address, user, password). It stores a sign-in token, never the password, and there's a Forget button.

**Top line extras**
- **Spinning reel icon:** a small reel-to-reel spool beside NOW PLAYING turns with the music and coasts to a stop on pause. Turn it off to get the old blinking square back.
  
  <img width="113" height="29" alt="nowplaying" src="https://github.com/user-attachments/assets/33b3d9ae-9d09-42c7-aa22-c09b0b17219f" />

- **Chevron chaser:** 15 arrows left of the L/R meter light up one after another, one sweep per beat when the beat is locked, otherwise a steady run. They go dark when stopped.
  
  <img width="396" height="26" alt="cheveron" src="https://github.com/user-attachments/assets/a49d1460-dc4a-449a-8bb8-21c5fe98d760" />

**Source icon**
- **Vinyl tonearm:** the arm starts on the outer groove, works its way in to the label as the song plays and lifts off when you stop. It glides when you seek.
- **7" singles** get their own icon: a smaller record at 45 rpm with a big centre hole and a yellow three-armed adapter. It's chosen when the media tag says 7".

**Graphics card readout:** CUSTOMIZE DECK › SCREEN › PERFORMANCE shows which graphics card the deck is drawn with. A red **SOFTWARE** means hardware acceleration is off or blocked, and big decks will be slow.

### Changed

**Centerpieces**
- **ORB**
  - **Spinning top:** every bass hit whips the cage round and friction only slowly slows it, so bass-heavy songs wind it up faster and faster and quiet parts let it coast. At high speed the axis wobbles like a top, with faint motion trails.
  - **Goo:** 8 droplets fly out towards the cage on each beat and are pulled back into the nucleus in under half a second. Sticky strands join them to the nucleus, thinning as they stretch, snapping if pulled too far and reforming.
  - The goo is now drawn by the graphics card at the orb's real on-screen size: sharp edges at any window size, a tighter and clearer glow, and much less load. The old method stays as an automatic fallback.
  - New options: Bass spin-up, Top wobble, Droplet burst, Stringiness.
- **TOWERS**
  - Each tower now follows its own frequency band and jumps when that band suddenly gets louder, instead of all rising together.
  - Brighter, bigger light motes that burst out when a tower jumps.
  - Camera: ORBIT, TOP (straight down, like the PS2 start-up), LOW (floor level) or AUTO.
  - Layout: GRID, RING (three circular equalisers) or SPIRAL.
  - Stacked-block towers with a lit top block, reflections in a glossy floor, and data packets racing along the floor lines.
- **HELIX**
  - The scanner is a solid ring. **BLADES** gives it 24 shaded square blocks that punch out with the music. **BEAMS** fires columns of light. Or BOTH, or OFF.
  - Rungs are shaded tubes with shiny ball joints, and vibrate like plucked strings when their frequency jumps. The spiral and the scanner ring are tubes too.
  - The strands bulge where their frequencies are loud, big drops unzip them apart, the A/T/G/C letters change on the beat, and the twist speeds up with the track.

**Play and pause glide instead of stopping dead**
- On pause, the centerpieces wind down (the orb coasts like a top losing momentum, the towers sink, the goo drifts back to lava-lamp mode). On play, everything builds back up over about 1.5 seconds.
- The spectrum bars sink instead of dropping, the VU and L/R meters fall more slowly, and the grid, rain and bubbles ease between speeds.
- The disc, reels and tape coast to a stop and spin back up instead of freezing.
- The scope's last waveform shrinks into the resting ripple, and the seek bar's playhead glow fades out.

**Deck layout for any window and screen**

<img width="1080" height="1920" alt="Screenshot 2026-10-10 033744" src="https://github.com/user-attachments/assets/535a88ab-195f-4726-bfe0-cad0e70fa297" />


- **Narrow windows** (for example on a vertical monitor): the cover gives up width instead of squeezing the screen. Title, album and artist run across the full width, and the centerpiece sits in the lower-right corner beside the badges and credits instead of disappearing.
- **F11 full screen** (1080p, 1440p, 4K): the whole deck scales up so nothing is tiny, with the track info across the top and a big centerpiece below. Effects are drawn at the higher resolution so they stay sharp.
  - The left side of the top line stacks one item per line (status, format, BPM, MD5). The chevrons, L/R meter and track number stay on the right.
  - Slimmer top bar with smaller logo and indicator text. The MB light no longer crowds the corner screw.
  - Smaller title and artist (title 52 → 40 px, artist 28 → 24 px), so normal titles fit without scrolling. Only titles that are actually too long scroll.
  - Control pod: the source icon centred on top, the oscilloscope across the pod, then the pod screen and the VU meter.
- **Portrait full screen:** the cover and controls share the top row, and the screen with the big centerpiece fills the width below.
  <img width="1920" height="1080" alt="Screenshot 2026-10-10 041218" src="https://github.com/user-attachments/assets/f27a4f8e-b29b-4745-92a4-031bc8865087" />


**CUSTOMIZE DECK**
- Opens in its own resizable window (about 1060×640) instead of squeezing into the deck, so all three columns fit in any display mode. It follows the theme colour and fades. DONE, Esc or the window's X close it. If a window can't be opened, it shows over the deck as before.
- The window can't be used to browse the web: leaving the page closes it. Browser shortcuts, the browser right-click menu, mouse back/forward and drag-and-drop are blocked. Copy, paste, cut, select-all and undo still work.
- Settings regrouped into tabs by what they control:
  - **SCREEN:** centerpiece, LCD background, top line, track info and cover, beat sync, performance.
  - **LYRICS:** ticker, line changes, timing.
  - **SEEKING:** the deck's progress strip and the waveform seek bar.
  - **POD:** source icon, scope and VU meter, pod screen.
  - **THEME:** finish, chrome colour, header colours.
  - Then one tab per centerpiece: ORB, TOWERS, HELIX, PYRAMID, CUBE. While a centerpiece's tab is open it shows on the deck as a preview, **SHOW ON DECK** makes it stay, and a ● marks the one on the deck.

**Smaller changes**
- **Year** is now a small segment display: smoked glass, faint unlit "8" segments behind glowing digits, and a glass highlight. It dims when nothing is loaded.
- **Cover gloss:** light now comes from the top left. A large arc of reflected light ends in a sharp curved edge, brightest in the corner, with a thin bright rim along the top and left.
- **PYRAMID** is about 13% smaller and sits lower, so the apex beam has room.
- **Rip logs from whole-CD image rips** (no per-track sections) now take the track's line from the AccurateRip summary.

### Fixed

- **UTF-16 rip logs** (most EAC logs) are now read in full. The CD RIP badge shows VERIFIED and the Dossier shows the full rip report (drive, read mode, offset, AccurateRip, errors, checksum, this track) instead of LOG FOUND. The panel copies the log once, unchanged, into a small cache with Windows' own `robocopy`, then decodes it. Your files aren't touched.
- **ALAC (Apple Lossless) files** now get a full waveform and BPM. The panels' built-in audio decoder has no ALAC support, so the theme now has its own decoder (`alac.js`), checked sample-for-sample against ffmpeg. A 4-minute track scans in about 2 seconds.
- **FLACs with cover art saved without an image type** (some taggers do this) no longer fail the waveform/BPM scan. The scan ignores tags and art in its own temporary copy.
- **Tracks that couldn't be scanned before** are rescanned once on their next play, so they pick up their BPM.
- **Lyrics picked by hand in OpenLyrics** now show on the deck within about 2 seconds. Before, the deck stopped looking after about 30 seconds, or as soon as it had any lyrics.
- **Double-clicking a big album** no longer loads its tracks jumbled. Tracks are added in disc and track order, the first one plays or is selected as soon as it lands, and starting another album cancels an unfinished load. This also covers PLAY, "Add to current playlist", "Send to new playlist" and the Artist Bio discography. Very large albums fill in visibly over a few seconds (about 4 seconds for 200 tracks).
- **Seeking on the deck** didn't work for many tracks because foobar2000 reported their length as 0. The deck now reads the track's own length, as the waveform seek bar does.
- **The deck could freeze** when switching from PYRAMID to CUBE while playing. The cube's beat counter is fixed, and if any part of the deck ever hits an error now, it's logged and skipped for that frame instead of stopping the whole deck.
- **The tonearm, MiniDisc and floppy shutters** could freeze part-way, because the pause slow-down also caught them. They move at their own pace now.
- **The tonearm stayed tiny in full screen.** It now scales with the record.
- **The pod screen was stretched in full screen**, which magnified the games. It keeps its normal size now.
- **The BPM tooltip** could throw an error while the customizer's demo beat was running.
- **The deck didn't load at all** in the first v1.2 download (reissued the same day). The new Theme version row read the updater's state before it was declared, which stopped the deck's script at startup. If you installed v1.2 before the fix and your deck is blank, run the installer from the current zip once.

### Performance

- **Frame rate no longer drops the further a track plays.** The waveform seek bar redrew its glow over the whole played part every frame, so the cost grew with the position, and all panels share one drawing thread. The waveform is now drawn once per track and reused. Near the end of a track: 17.3 ms per frame with many slow frames before, 13.4 ms after. The deck's BLOCKS, TAPE and COMET styles got the same fix.
- **Track changes no longer stall** (90–110 ms before). The BPM scan no longer copies the whole audio file on the shared thread; a track change now costs one or two frames at most.
- **Full screen on big and vertical screens:** the orb's cage and rings now use a drawing method that costs the same at any size, and the spectrum bars draw about 30 times more cheaply. Towers' tops, Helix's beads and the Cube's frame use cheaper glows. At vertical full screen, load on the shared graphics process went from about 960 to about 650 ms per second.
- **TV static** is made from pre-drawn snow patches instead of recalculating every pixel. **Digital rain** is drawn at lower resolution and scaled up instead of being blurred. Both now add little load at full screen.
- **Orb goo** costs about 0.1 ms instead of 0.8 ms per frame (see above).

### Packaging

- `Metalheart-Y2K.fcl` now includes the themed Track Info panel. `Metalheart-Y2K-classic.fcl` is unchanged.
- New files: `info.html`, `lyrics.html`, `tags.html`, `alac.js`, `tools/update.ps1`.
- The cached rip logs, waveform cache and browser data are never included in the package.

## v1.1 — 2026-10-06

- Theme-only package: no foobar2000 or component binaries.
- Installer (`Install Metalheart Y2K.cmd`): finds foobar2000, checks it's the 64-bit v2, backs up your Columns UI settings, downloads the components from their official pages, copies the theme and applies the layout.
- Drag-and-drop pack and README for manual installs.
- MIT licence.
