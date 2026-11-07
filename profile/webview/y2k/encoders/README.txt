METALHEART // Y2K - ENCODERS FOLDER
===================================
The CONVERT window (right-click in Library Selection > Convert...) uses the encoder programs
you put in this folder. Subfolders are fine. Press RESCAN in the window after adding one.

  FLAC .................. flac.exe            https://xiph.org/flac/download.html (Windows zip, win64 folder)
  MP3 ................... lame.exe            https://www.rarewares.org/mp3-lame-bundle.php
  AAC (.m4a) ............ qaac64.exe          https://github.com/nu774/qaac/releases (needs Apple's AAC encoder,
                                              which comes with iTunes / Apple Application Support)
                          or fdkaac.exe       https://www.rarewares.org/aac-encoders.php
  ALAC (Apple Lossless) . refalac64.exe       comes in the qaac download above (no iTunes needed)
  Opus .................. opusenc.exe         https://opus-codec.org/downloads/ (opus-tools)
  Ogg Vorbis ............ oggenc2.exe         https://www.rarewares.org/ogg-oggenc.php
  WavPack ............... wavpack.exe         https://www.wavpack.com/downloads.html
  Monkey's Audio ........ MAC.exe             https://www.monkeysaudio.com/download.html
  Anything, and decoding  ffmpeg.exe          https://www.gyan.dev/ffmpeg/builds/  (or BtbN's builds on GitHub)

Decoding: FLAC sources are decoded with flac.exe; for anything else (ALAC, APE, WavPack, MP3, AAC, Opus ...)
put ffmpeg.exe in here too (or that format's own tool: wvunpack.exe, MAC.exe, opusdec.exe, oggdec.exe).
ffmpeg.exe can also be picked as the encoder for every format except Monkey's Audio.
