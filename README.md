# METALHEART // Y2K

A portable **foobar2000** music player skin with a chrome, steel-blue and toxic-lime look.

It runs on foobar2000 v2.26 (64-bit, portable) with Columns UI and WebView2 HTML panels.

## Download

Get **`foobar2000-Metalheart-Y2K.zip`** from the [Releases page](../../releases/latest).

1. Unzip it anywhere, for example your Desktop or a USB stick.
2. Run `foobar2000.exe`.

Nothing is installed into Windows, and every setting stays in the `profile` folder.

**Requirements:**
- Windows 10 or 11, 64-bit.
- The Microsoft Edge WebView2 Runtime. It is already built into Windows 11 and current Windows 10.

## Features

- **The deck.** It has:
  - a jewel case with your cover art and a spinning CD;
  - an LCD screen showing the track details, badges, the artist's country flag, a karaoke line of synced lyrics with a preview of the next line, and a spectrum analyser;
  - a control pod with a stereo VU meter and an oscilloscope.
- **CUSTOMIZE DECK.** Changes apply live, and the customizer sets:
  - **Centerpiece:** ORB (liquid goo in a wireframe cage with orbit rings), TOWERS (PS2-style glass data towers), HELIX (a Y2K DNA double helix), or CYCLE (a different one on every new track).
  - **LCD backgrounds:** bubbles, TV static, digital rain and a retro grid.
  - **Theme colour:** lime, aqua, ice blue, magenta, amber or ember red, cross-fading over the whole skin. The **ALBUM ART** option takes its colours from the cover of what's playing, in MONO (one colour) or MULTI (up to three).
- **Seek bar.** It is built in, shows the track's waveform, and follows the theme colour. The styles are bars, wave and LED.
- **Info tabs.** Dossier and Bio tabs show artist biographies, discographies and credits.
- **Built-in panels.** OpenLyrics, the ListenBrainz scrobbler, a Navidrome / Subsonic browser, the MilkDrop visualiser and the Album List.

The full guide is in [`README - METALHEART Y2K.txt`](README%20-%20METALHEART%20Y2K.txt).

## What's in this repo

| Folder | Contents |
|---|---|
| `webview/y2k/` | The HTML/JS/CSS panels: deck, seek bar, library, playlist, headers, dossier, bio. In the player they live in `profile\webview\y2k\`. |
| `themes/` | The Columns UI layouts (`Metalheart-Y2K.fcl` and the `classic` variant). |

The ready-to-run player, with foobar2000 and all the components, is only in the release zip.

## Credits

- [foobar2000](https://www.foobar2000.org/) by Peter Pawlowski.
- Components: Columns UI, foo_webview2, OpenLyrics, ListenBrainz 2, Navidrome, MilkDrop 2, Album List, Waveform Seekbar. Each belongs to its own author.
- Fonts: DSEG, Orbitron and Silkscreen, all under the SIL Open Font License.
- Flags: [flag-icons](https://github.com/lipis/flag-icons), under the MIT licence.
