
# METALHEART // Y2K

A **foobar2000** theme with a chrome, steel-blue and toxic-lime look. It is built with Columns UI and WebView2 HTML panels.

### ▶ Watch the demo (54 s, WebM)
[demo.webm](https://github.com/user-attachments/assets/306fbc62-f122-443c-9090-d0fe6273c32d)

The demo shows the default theme playing a synthetic test track. It goes through:
- the liquid orb, synced lyrics and spectrum;
- the TOWERS and HELIX centerpieces;
- the digital rain and retro grid backgrounds;
- theme colours and album-art colours;
- the waveform seek bar styles and the lyrics tab.

foobar2000 itself is **not included**. Install it first from [foobar2000.org](https://www.foobar2000.org/download). The standard installer and the portable option both work.

## Requirements

- Windows 10 or 11, 64-bit.
- foobar2000 v2.x, **64-bit**.
- The Microsoft Edge WebView2 Runtime. It is already built into Windows 11 and current Windows 10.

## Download

Get **`Metalheart-Y2K-theme.zip`** from the [Releases page](../../releases/latest), then extract it (right-click > Extract All).

## Installing

### Option A: the installer (recommended)

1. Close foobar2000.
2. Double-click **`Install Metalheart Y2K.cmd`**.
3. Check that the foobar2000 folder it found is right (use **Browse...** to change it), then press **INSTALL**.
4. If foobar2000 asks which user interface to use, pick **Columns UI** and press OK.

During step 3 the installer:
- downloads the components the theme needs, straight from their official pages;
- copies the theme files into your foobar2000 settings folder;
- starts foobar2000.

After step 4 it applies the Metalheart layout on its own.

Your previous Columns UI settings are backed up first, to `<settings folder>\metalheart-backup\<date>\`.

> Windows may warn about a downloaded script. Choose **More info > Run anyway**. The installer is plain PowerShell, and you can read it in [`installer/Install-Metalheart.ps1`](installer/Install-Metalheart.ps1).

### Option B: drag and drop

1. Close foobar2000.
2. Open your foobar2000 **settings folder**:
   - for a **portable** install, the `profile` folder inside your foobar2000 folder;
   - for a **standard** install, `%APPDATA%\foobar2000-v2` (paste it into Explorer's address bar).
3. Drag the **contents** of this pack's `profile` folder (`webview` and `milkdrop2`) into it, and let Windows merge the folders.
4. Start foobar2000 and install each [component](#components):
   1. Download its `.fb2k-component` file.
   2. Open **File > Preferences > Components** and press **Install...**.
   3. Press **Apply** and let foobar2000 restart.
5. When asked which user interface to use, pick **Columns UI**.
6. Go to **File > Preferences > Display > Columns UI > Import configuration...** and pick `<settings folder>\webview\y2k\layouts\Metalheart-Y2K.fcl`.
7. Optionally, for the clean look, untick these in the **View** menu:
   1. **Show status pane**.
   2. **Show toolbars**. This also hides the menu bar; the PREFS button in the control pod still opens Preferences.

### Going back

You have two ways back:
- import another Columns UI configuration;
- close foobar2000 and copy the backed-up `foo_ui_columns.dll.cfg` back into `<settings folder>\configuration`.

## Components

| Component | Author | Used for |
|---|---|---|
| [Columns UI](https://www.foobar2000.org/components/view/foo_ui_columns) | reupen | the window layout |
| [WebView2](https://www.foobar2000.org/components/view/foo_webview2) | J. Cassis | the deck, seek bar, library, playlist and info tabs |
| [OpenLyrics](https://www.foobar2000.org/components/view/foo_openlyrics) | jacquesh | the LYRICS tab and the deck's lyric line |
| [MilkDrop 2](https://www.foobar2000.org/components/view/foo_vis_milk2) | J. Cassis | the MILKDROP window |
| [Album List Panel](https://www.foobar2000.org/components/view/foo_uie_albumlist) | reupen | the library in the classic layout |
| [ListenBrainz 2](https://github.com/phw/foo_listenbrainz2/releases) | phw | scrobbling (optional) |
| [Navidrome / Subsonic](https://www.foobar2000.org/components/view/foo_navidrome) | santiagorod92 | the NAVIDROME button's server browser (optional; the Media Library connects to Navidrome without it) |

## Features

This theme is primarily catered to those who use MusicBrainz Picard and scrobble their information to ListenBrainz. Various parts of this theme pull information from MusicBrainz to further enhance the experience of those that love to see data represented in multitudes of ways.

- **The main deck.** It has:
  - a jewel case with your cover art and a spinning source icon (CD, vinyl with a moving tonearm, 7" single, tape, MiniDisc and more);
  - a simulated LCD screen showing the track details, badges, the artist's country flag, a karaoke-style lyric line that lights up word by word, a spectrum analyser and a BPM readout that flashes on the beat;
  - a progress strip you can drag to scan the track, styled as a bar, VCR tape counter, Y2K blocks or a comet;
  - a control pod with a stereo VU meter, an oscilloscope, a FULL SCREEN button and a little game screen (RUNNER, SHIP or BLOB) that plays along to the beat.
- **3D centerpieces, synced to the beat.** A built-in BPM scanner finds each track's tempo and beats, and the centerpieces hit on them:
  - **ORB:** liquid goo in a wireframe cage that spins up like a top on bass-heavy songs;
  - **TOWERS:** PS2-style glass data towers, one per frequency band;
  - **HELIX:** a Y2K DNA double helix with a scanner ring;
  - **PYRAMID:** counter-rotating glass tiers that shatter on drops;
  - **CUBE:** a glass cube with energy balls bouncing off its walls on the beat, tesla arcs and orbiting mini-cubes;
  - **REACTOR:** an icosahedral speaker cabinet whose woofers boom on the bass, whose spikes jet out on the treble, and whose glowing core fires beams through the seams;
  - **CYCLE:** a different one on every new track.
- **CUSTOMIZE DECK.** It opens in its own window and changes apply live:
  - every centerpiece has its own tab of settings;
  - **LCD backgrounds:** bubbles, TV static, digital rain and a retro grid;
  - **Theme colour:** lime, aqua, ice blue, magenta, amber or ember red, cross-fading over the whole skin. The **ALBUM ART** option takes its colours from the cover of what's playing, in MONO (one colour) or MULTI (up to three);
  - **THEME:** light or dark chrome, the chrome's tint, and the colour of the headers and tabs.
- **Seek bar.** It is built in, shows the track's whole waveform (Apple Lossless included), and follows the theme colour. The styles are bars, wave and LED.
- **Media Library.** Browse by artist, album, genre or year, with a letter rail to jump through long lists. Albums sort A–Z, by year, at random, by date added or by record label. Click an artist or a label to see everything by them, and it remembers where you were. Connect a **Navidrome / Subsonic** server and its albums show up next to yours, playing straight from the server.
- **Track Info panel**, with a hi-fi push-button tab bar:
  - **Dossier:** release and credits from MusicBrainz tags (Discogs and VGMdb tags fill the gaps), the rip-log report for EAC, XLD, CUERipper, dBpoweramp, whipper and CUETools in its own log window, and MusicBrainz details.
  - **Lyrics:** synced lyrics with word-by-word highlighting. OpenLyrics still does the searching, from a 2-pixel panel tucked under the tabs, because it only works while one of its own panels is on screen.
  - **Artist Bio:** biography and discography; click an album to play it from your library or Navidrome.
  - **Tags**, and **MilkDrop** (about 900 public domain presets) in its own window.
- **Updates itself.** The deck tells you when a new version is out and can download and install it for you. See the [changelog](CHANGELOG.md).

The full guide is in [`README - METALHEART Y2K.txt`](README%20-%20METALHEART%20Y2K.txt).

## What's in this repo

| Path | Contents |
|---|---|
| `Install Metalheart Y2K.cmd`, `installer/` | The installer. |
| `profile/webview/y2k/` | The HTML/JS/CSS panels, plus the Columns UI layouts in `layouts/`. |
| `profile/milkdrop2/` | The MilkDrop preset and texture pack. |

## Licence

The theme is under the [MIT licence](LICENSE).

Bundled assets keep their own licences:
- Fonts: DSEG, Orbitron and Silkscreen, under the SIL Open Font License.
- Flags: [flag-icons](https://github.com/lipis/flag-icons), under MIT.
- MilkDrop presets: from the projectM collection (see `PRESETS-LICENSE.md`).

foobar2000 is © Peter Pawlowski and is not included. Each component belongs to its own author.
