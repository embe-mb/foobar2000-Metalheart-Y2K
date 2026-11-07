# METALHEART // Y2K - converter
# Started hidden by the CONVERT window (right-click in Library Selection > Convert...). A web page can't write files, so
# the job (UTF-8 JSON) arrives in pieces: "-Part n -Of N -Id x -Data <base64>" calls drop numbered pieces in convcache\,
# and the "-Run -Id x -Of N" call waits for all of them, joins them and runs the job. Progress goes to convcache\<id>.json
# (the window polls it); the window's CANCEL drops convcache\<id>.cancel.
#
# Each track: decode to a temporary WAV (flac.exe / lame.exe / wvunpack.exe / MAC.exe / opusdec.exe / oggdec.exe for
# their own formats, ffmpeg.exe for anything), encode it with the chosen encoder, tag it, then move it into place.
# With ffmpeg.exe as the encoder, ffmpeg does all of it (and copies the tags itself). Temp files use plain ASCII names
# so every encoder can open them, whatever characters the real file names have.
param([string]$Id, [int]$Part = -1, [int]$Of = 0, [string]$Data = '', [switch]$Run, [switch]$Browse, [switch]$Cancel)
$ErrorActionPreference = 'Stop'
$utf8 = New-Object System.Text.UTF8Encoding($false)
$cache = Join-Path $PSScriptRoot '..\convcache'
if (-not (Test-Path -LiteralPath $cache)) { New-Item -ItemType Directory -Path $cache -Force | Out-Null }
$cache = (Resolve-Path -LiteralPath $cache).Path

if ($Part -ge 0) { [IO.File]::WriteAllText((Join-Path $cache "$Id.part$Part"), $Data, $utf8); exit 0 }
# CANCEL button: leave the flag the running job looks for
if ($Cancel) { [IO.File]::WriteAllText((Join-Path $cache "$Id.cancel"), '1', $utf8); exit 0 }
# BROWSE... button: a folder picker; the choice (or nothing) goes to convcache\<id>.browse for the window to read
if ($Browse) {
  Add-Type -AssemblyName System.Windows.Forms
  $d = New-Object System.Windows.Forms.FolderBrowserDialog
  $d.Description = 'Where should the converted album go?'; $d.ShowNewFolderButton = $true
  if ($Data) { try { $d.SelectedPath = [Text.Encoding]::UTF8.GetString([Convert]::FromBase64String($Data)) } catch { } }
  # a tiny topmost owner that's actually shown, so the picker comes up in front of foobar2000
  $top = New-Object System.Windows.Forms.Form
  $top.TopMost = $true; $top.ShowInTaskbar = $false; $top.FormBorderStyle = 'None'; $top.StartPosition = 'Manual'
  $top.Location = New-Object System.Drawing.Point(-2000, -2000); $top.Size = New-Object System.Drawing.Size(1, 1); $top.Opacity = 0
  $top.Show(); $top.Activate()
  $r = $d.ShowDialog($top)
  $top.Close()
  [IO.File]::WriteAllText((Join-Path $cache "$Id.browse"), ('>' + $(if ($r -eq 'OK') { $d.SelectedPath } else { '' })), $utf8)
  exit 0
}
if (-not $Run) { exit 1 }

$statusPath = Join-Path $cache "$Id.json"; $cancelPath = Join-Path $cache "$Id.cancel"
function Put-Status($o) { $tmp = $statusPath + '.tmp'; [IO.File]::WriteAllText($tmp, ($o | ConvertTo-Json -Depth 5 -Compress), $utf8); Move-Item -LiteralPath $tmp -Destination $statusPath -Force }

# wait (up to 30 s) for every piece of the job
$t0 = Get-Date
while ($true) {
  $have = @(0..($Of - 1) | Where-Object { Test-Path -LiteralPath (Join-Path $cache "$Id.part$_") }).Count
  if ($have -eq $Of) { break }
  if (((Get-Date) - $t0).TotalSeconds -gt 30) { Put-Status @{ state = 'error'; msg = 'The job did not arrive in full'; done = 0; total = 0; items = @() }; exit 1 }
  Start-Sleep -Milliseconds 150
}
$b64 = (0..($Of - 1) | ForEach-Object { [IO.File]::ReadAllText((Join-Path $cache "$Id.part$_")) }) -join ''
0..($Of - 1) | ForEach-Object { Remove-Item -LiteralPath (Join-Path $cache "$Id.part$_") -Force -ErrorAction SilentlyContinue }
$job = [Text.Encoding]::UTF8.GetString([Convert]::FromBase64String($b64)) | ConvertFrom-Json
# old progress files
Get-ChildItem -LiteralPath $cache -File -ErrorAction SilentlyContinue | Where-Object { $_.LastWriteTime -lt (Get-Date).AddDays(-2) } | Remove-Item -Force -ErrorAction SilentlyContinue

$items = @($job.items)
$state = [hashtable]::Synchronized(@{ cancel = $false; pids = @{} })
$res = @(); foreach ($it in $items) { $res += @{ st = 'wait'; msg = '' } }
$tmpRoot = Join-Path ([IO.Path]::GetTempPath()) ('y2kconv-' + $Id)
New-Item -ItemType Directory -Path $tmpRoot -Force | Out-Null

# --- the work for one track (runs in its own runspace) ---
$work = {
  param($it, $job, $n, $tmpRoot, $state)
  $ErrorActionPreference = 'Stop'
  $tools = $job.tools
  function Tool($name) { $p = $tools.$name; if ($p -and (Test-Path -LiteralPath $p)) { return $p } return $null }
  function Q([string]$s) { if ($null -eq $s) { $s = '' } return '"' + ($s -replace '(\\*)"', '$1$1\"' -replace '(\\+)$', '$1$1') + '"' }
  function Exec([string]$exe, [string[]]$argv) {
    if ($state.cancel) { throw 'Cancelled' }
    $psi = New-Object Diagnostics.ProcessStartInfo
    $psi.FileName = $exe; $psi.Arguments = ($argv -join ' '); $psi.UseShellExecute = $false; $psi.CreateNoWindow = $true
    $psi.RedirectStandardError = $true; $psi.RedirectStandardOutput = $true
    $p = [Diagnostics.Process]::Start($psi)
    $state.pids[$p.Id] = 1
    $errTask = $p.StandardError.ReadToEndAsync(); $outTask = $p.StandardOutput.ReadToEndAsync()
    $p.WaitForExit(); $state.pids.Remove($p.Id)
    if ($state.cancel) { throw 'Cancelled' }
    if ($p.ExitCode -ne 0) { $e = ($errTask.Result + ' ' + $outTask.Result).Trim(); if ($e.Length -gt 300) { $e = $e.Substring($e.Length - 300) }; throw ([IO.Path]::GetFileName($exe) + ' failed (' + $p.ExitCode + '): ' + $e) }
  }
  $src = $it.src; $dst = $it.dst; $fmt = $job.format; $q = $job.quality
  $enc = $job.encoder; $encName = [IO.Path]::GetFileNameWithoutExtension($enc).ToLower()
  $tags = $it.tags; $cover = if ($job.embedArt -and $it.cover -and (Test-Path -LiteralPath $it.cover)) { $it.cover } else { '' }
  if ((Test-Path -LiteralPath $dst) -and -not $job.overwrite) { return 'skip: already there' }
  $dir = Split-Path -Parent $dst
  if (-not (Test-Path -LiteralPath $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }
  $ext = [IO.Path]::GetExtension($dst)
  $tmpOut = Join-Path $tmpRoot ("t$n" + $ext); $wav = Join-Path $tmpRoot ("t$n.wav")
  # a source with an awkward name gets a plain-named copy first
  $inExt = [IO.Path]::GetExtension($src).ToLower()
  $in = $src
  if ($src -match '[^\x20-\x7E]') { $in = Join-Path $tmpRoot ("s$n" + $inExt); Copy-Item -LiteralPath $src -Destination $in -Force }
  $ff = Tool 'ffmpeg'
  $tagList = @(); foreach ($p in $tags.PSObject.Properties) { if ("$($p.Value)" -ne '') { $tagList += , @($p.Name, "$($p.Value)") } }
  function T($k) { $v = $tags.$k; if ($null -eq $v) { return '' } return "$v" }
  try {
    if ($encName -eq 'ffmpeg') {
      # ffmpeg does everything: decode, encode, copy the tags (and the cover where the format holds one)
      $codec = @{ flac = @('-c:a', 'flac', '-compression_level', $q); mp3 = @('-c:a', 'libmp3lame') + $(if ($q -match '^V(\d)$') { @('-q:a', $matches[1]) } else { @('-b:a', ($q -replace '\D', '') + 'k') });
        aac = @('-c:a', 'aac', '-b:a', ($q -replace '\D', '') + 'k'); alac = @('-c:a', 'alac'); opus = @('-c:a', 'libopus', '-b:a', ($q -replace '\D', '') + 'k');
        ogg = @('-c:a', 'libvorbis', '-q:a', ($q -replace '[^\d.]', '')); wv = @('-c:a', 'wavpack'); wav = @('-c:a', 'pcm_s16le'); ape = @() }[$fmt]
      $a = @('-hide_banner', '-loglevel', 'error', '-y', '-i', (Q $in))
      $keepArt = $cover -and ($fmt -in @('mp3', 'flac', 'aac', 'alac'))
      if ($keepArt) { $a += @('-i', (Q $cover), '-map', '0:a', '-map', '1:0', '-c:v', 'copy', '-disposition:v', 'attached_pic') } else { $a += @('-map', '0:a') }
      $a += @('-map_metadata', '0') + ($codec | ForEach-Object { Q $_ })
      foreach ($tg in $tagList) { $a += @('-metadata', (Q ($tg[0].ToLower() + '=' + $tg[1]))) }
      if ($fmt -eq 'mp3') { $a += @('-id3v2_version', '3') }
      $a += (Q $tmpOut)
      Exec $ff $a
    }
    else {
      # 1. decode to WAV
      if ($inExt -eq '.wav') { $wav = $in }
      elseif ($inExt -eq '.flac' -and (Tool 'flac')) { Exec (Tool 'flac') @('-d', '-s', '-f', '-o', (Q $wav), (Q $in)) }
      elseif ($inExt -eq '.wv' -and (Tool 'wvunpack')) { Exec (Tool 'wvunpack') @('-q', '-y', (Q $in), '-o', (Q $wav)) }
      elseif ($inExt -eq '.ape' -and (Tool 'mac')) { Exec (Tool 'mac') @((Q $in), (Q $wav), '-d') }
      elseif ($inExt -eq '.mp3' -and (Tool 'lame')) { Exec (Tool 'lame') @('--decode', '--quiet', (Q $in), (Q $wav)) }
      elseif ($inExt -eq '.opus' -and (Tool 'opusdec')) { Exec (Tool 'opusdec') @('--quiet', (Q $in), (Q $wav)) }
      elseif ($inExt -eq '.ogg' -and (Tool 'oggdec')) { Exec (Tool 'oggdec') @('-Q', '-o', (Q $wav), (Q $in)) }
      elseif ($ff) { Exec $ff @('-hide_banner', '-loglevel', 'error', '-y', '-i', (Q $in), '-map', '0:a', '-c:a', 'pcm_s24le', (Q $wav)) }
      else { throw "No decoder for $inExt files: put ffmpeg.exe (or that format's own tool) in the encoders folder" }
      # 2. encode (+ tags)
      $tn = (T 'TRACKNUMBER'); if ((T 'TOTALTRACKS')) { $tn2 = "$tn/$(T 'TOTALTRACKS')" } else { $tn2 = $tn }
      $dn = (T 'DISCNUMBER'); if ((T 'TOTALDISCS')) { $dn2 = "$dn/$(T 'TOTALDISCS')" } else { $dn2 = $dn }
      switch ($fmt) {
        'flac' {
          # tag values go through files: flac.exe reads its command line in the ANSI code page, which loses other scripts
          $a = @("-$q", '-s', '-f', '-o', (Q $tmpOut)); $k = 0
          foreach ($tg in $tagList) { $tf = Join-Path $tmpRoot ("g$n-" + $k++ + '.txt'); [IO.File]::WriteAllText($tf, $tg[1], (New-Object Text.UTF8Encoding($false))); $a += (Q ('--tag-from-file=' + $tg[0] + '=' + $tf)) }
          if ($cover) { $a += (Q ('--picture=' + $cover)) }; $a += (Q $wav); Exec $enc $a }
        'mp3' {
          $a = @('--quiet', '--noreplaygain', '--id3v2-only', '--id3v2-utf16'); if ($q -match '^V(\d)$') { $a += @('-V', $matches[1]) } else { $a += @('-b', ($q -replace '\D', ''), '--cbr') }
          $a += @('--tt', (Q (T 'TITLE')), '--ta', (Q (T 'ARTIST')), '--tl', (Q (T 'ALBUM')), '--ty', (Q (T 'DATE')), '--tn', (Q $tn2), '--tg', (Q (T 'GENRE')))
          if ((T 'ALBUMARTIST')) { $a += @('--tv', (Q ('TPE2=' + (T 'ALBUMARTIST')))) }
          if ($dn) { $a += @('--tv', (Q ('TPOS=' + $dn2))) }
          if ((T 'COMPOSER')) { $a += @('--tv', (Q ('TCOM=' + (T 'COMPOSER')))) }
          if ($cover) { $a += @('--ti', (Q $cover)) }
          $a += @((Q $wav), (Q $tmpOut)); Exec $enc $a }
        { $_ -in @('aac', 'alac') } {
          # AAC quality is a bitrate in kbps: qaac's constrained VBR, fdkaac's bitrate
          $kb = ($q -replace '\D', '')
          $a = @('--silent'); if ($_ -eq 'alac') { if ($encName -notlike 'refalac*') { $a += '-A' } } elseif ($encName -like 'fdkaac*') { $a = @('-S', '-b', $kb) } else { $a += @('--cvbr', $kb) }
          if ($encName -like 'fdkaac*') {
            $a += @('--title', (Q (T 'TITLE')), '--artist', (Q (T 'ARTIST')), '--album', (Q (T 'ALBUM')), '--album-artist', (Q (T 'ALBUMARTIST')), '--date', (Q (T 'DATE')), '--genre', (Q (T 'GENRE')), '--track', (Q $tn2), '--disk', (Q $dn2), '-o', (Q $tmpOut), (Q $wav))
          } else {
            $a += @('--title', (Q (T 'TITLE')), '--artist', (Q (T 'ARTIST')), '--album', (Q (T 'ALBUM')), '--band', (Q (T 'ALBUMARTIST')), '--date', (Q (T 'DATE')), '--genre', (Q (T 'GENRE')), '--track', (Q $tn2), '--disk', (Q $dn2), '--composer', (Q (T 'COMPOSER')))
            if ($cover) { $a += @('--artwork', (Q $cover)) }
            $a += @('-o', (Q $tmpOut), (Q $wav))
          }
          Exec $enc $a }
        'opus' {
          $a = @('--quiet', '--bitrate', ($q -replace '\D', '')); foreach ($tg in $tagList) { $a += @('--comment', (Q ($tg[0] + '=' + $tg[1]))) }
          if ($cover) { $a += @('--picture', (Q $cover)) }; $a += @((Q $wav), (Q $tmpOut)); Exec $enc $a }
        'ogg' {
          $a = @('-Q', '-q', ($q -replace '[^\d.]', '')); foreach ($tg in $tagList) { $a += @('-c', (Q ($tg[0] + '=' + $tg[1]))) }
          $a += @('-o', (Q $tmpOut), (Q $wav)); Exec $enc $a }
        'wv' {
          $a = @('-q', '-y', "-$q", '-m'); foreach ($tg in $tagList) { $a += @('-w', (Q ($tg[0] + '=' + $tg[1]))) }
          $a += @((Q $wav), '-o', (Q $tmpOut)); Exec $enc $a }
        'ape' { Exec $enc @((Q $wav), (Q $tmpOut), "-c$q") }
        'wav' { Copy-Item -LiteralPath $wav -Destination $tmpOut -Force }
      }
    }
    Move-Item -LiteralPath $tmpOut -Destination $dst -Force
    return 'ok'
  }
  finally {
    foreach ($f in @($tmpOut, (Join-Path $tmpRoot "t$n.wav"), (Join-Path $tmpRoot ("s$n" + $inExt)))) { if (Test-Path -LiteralPath $f) { Remove-Item -LiteralPath $f -Force -ErrorAction SilentlyContinue } }
    Get-ChildItem -LiteralPath $tmpRoot -Filter "g$n-*.txt" -ErrorAction SilentlyContinue | Remove-Item -Force -ErrorAction SilentlyContinue
  }
}

$threads = [Math]::Max(1, [Math]::Min([int]$job.threads, 8))
$pool = [RunspaceFactory]::CreateRunspacePool(1, $threads); $pool.Open()
$running = @{}; $next = 0; $done = 0
$report = { Put-Status @{ state = 'running'; done = $done; total = $items.Count; items = $res; msg = '' } }
& $report
while ($done -lt $items.Count) {
  if (-not $state.cancel -and (Test-Path -LiteralPath $cancelPath)) {
    $state.cancel = $true
    foreach ($procId in @($state.pids.Keys)) { try { Stop-Process -Id $procId -Force -ErrorAction SilentlyContinue } catch { } }
  }
  while (-not $state.cancel -and $running.Count -lt $threads -and $next -lt $items.Count) {
    $ps = [PowerShell]::Create(); $ps.RunspacePool = $pool
    [void]$ps.AddScript($work).AddArgument($items[$next]).AddArgument($job).AddArgument($next).AddArgument($tmpRoot).AddArgument($state)
    $running[$next] = @{ ps = $ps; h = $ps.BeginInvoke() }; $res[$next].st = 'run'; $next++
  }
  foreach ($k in @($running.Keys)) {
    $r = $running[$k]
    if ($r.h.IsCompleted) {
      try { $out = @($r.ps.EndInvoke($r.h)); $m = "$($out[-1])"; if ($m -like 'skip*') { $res[$k].st = 'skip'; $res[$k].msg = 'Already there' } else { $res[$k].st = 'ok' } }
      catch { $e = $_.Exception; while ($e.InnerException) { $e = $e.InnerException }; $res[$k].st = if ($state.cancel) { 'cancel' } else { 'fail' }; $res[$k].msg = $e.Message }
      $r.ps.Dispose(); $running.Remove($k); $done++; & $report
    }
  }
  if ($state.cancel -and $running.Count -eq 0) { for ($i = $next; $i -lt $items.Count; $i++) { $res[$i].st = 'cancel' }; $done = $items.Count; break }
  Start-Sleep -Milliseconds 200
}
$pool.Close()
# artwork and other images next to the new files
if (-not $state.cancel) { foreach ($x in @($job.extras)) { try { if ($x -and -not (Test-Path -LiteralPath $x.dst)) { $d = Split-Path -Parent $x.dst; if (-not (Test-Path -LiteralPath $d)) { New-Item -ItemType Directory -Path $d -Force | Out-Null }; Copy-Item -LiteralPath $x.src -Destination $x.dst } } catch { } } }
Remove-Item -LiteralPath $tmpRoot -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -LiteralPath $cancelPath -Force -ErrorAction SilentlyContinue
Put-Status @{ state = $(if ($state.cancel) { 'cancelled' } else { 'done' }); done = $done; total = $items.Count; items = $res; msg = '' }
