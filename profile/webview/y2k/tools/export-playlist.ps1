# METALHEART // Y2K - writes a saved playlist to an .m3u8 file. Started by the SAVED PLAYLISTS window (EXPORT) and,
# once a playlist has been exported, again whenever it changes, so the file stays up to date.
# The panels can't write files themselves, so they pass the playlist here: UTF-8 M3U text, gzipped and base64'd, in one
# or more parts (a command line holds about 32,000 characters). Each part is one run of this script; the run that
# brings the last part puts the file together. Without -OutB64 it asks where to save (a normal Save As box).
# The result ({ status, path, message }) goes to <y2k>\exportcache\<job>.json, where the panel reads it.
param([Parameter(Mandatory)][string]$Job, [int]$Part = 0, [int]$Parts = 1, [Parameter(Mandatory)][string]$Data,
      [string]$NameB64 = '', [string]$OutB64 = '')
$ErrorActionPreference = 'Stop'
if ($Job -notmatch '^[a-z0-9]{6,40}$' -or $Part -lt 0 -or $Parts -lt 1 -or $Part -ge $Parts -or $Parts -gt 500 -or $Data -notmatch '^[A-Za-z0-9+/=]*$') { exit 1 }

$ResDir = Join-Path $PSScriptRoot '..\exportcache'
$TmpDir = Join-Path $env:TEMP 'metalheart-export'
New-Item -ItemType Directory -Path $ResDir, $TmpDir -Force | Out-Null
function Write-Result($o) {
  $json = $o | ConvertTo-Json -Compress
  $tmp = Join-Path $ResDir "$Job.tmp"
  [IO.File]::WriteAllText($tmp, $json, (New-Object Text.UTF8Encoding $false))
  Move-Item -LiteralPath $tmp -Destination (Join-Path $ResDir "$Job.json") -Force
}
$b64 = { param($s) if ($s) { [Text.Encoding]::UTF8.GetString([Convert]::FromBase64String($s)) } else { '' } }

# this part (written whole, then renamed, so a half-written part is never read)
$mine = Join-Path $TmpDir "$Job.$Part"
[IO.File]::WriteAllText("$mine.tmp", $Data)
Move-Item -LiteralPath "$mine.tmp" -Destination $mine -Force
$have = @(0..($Parts - 1) | Where-Object { Test-Path (Join-Path $TmpDir "$Job.$_") })
if ($have.Count -lt $Parts) { exit 0 }
# every part is here: only one run carries on
try { $lock = [IO.File]::Open((Join-Path $TmpDir "$Job.lock"), 'CreateNew', 'Write') } catch { exit 0 }

try {
  # old results and leftovers from runs that never finished
  Get-ChildItem $ResDir -File | Where-Object { $_.LastWriteTime -lt (Get-Date).AddHours(-1) } | Remove-Item -Force -ErrorAction SilentlyContinue
  Get-ChildItem $TmpDir -File | Where-Object { $_.LastWriteTime -lt (Get-Date).AddHours(-1) } | Remove-Item -Force -ErrorAction SilentlyContinue

  $all = -join (0..($Parts - 1) | ForEach-Object { [IO.File]::ReadAllText((Join-Path $TmpDir "$Job.$_")) })
  $gz = New-Object IO.Compression.GZipStream((New-Object IO.MemoryStream(, [Convert]::FromBase64String($all))), [IO.Compression.CompressionMode]::Decompress)
  $text = (New-Object IO.StreamReader($gz, [Text.Encoding]::UTF8)).ReadToEnd()
  if (-not $text.StartsWith('#EXTM3U')) { throw 'Not a playlist' }

  $out = & $b64 $OutB64
  if (-not $out) {
    Add-Type -AssemblyName System.Windows.Forms
    [Windows.Forms.Application]::EnableVisualStyles()
    $name = (& $b64 $NameB64) -replace '[\\/:*?"<>|]', '_'
    if (-not $name.Trim()) { $name = 'Playlist' }
    $dlg = New-Object Windows.Forms.SaveFileDialog
    $dlg.Title = 'Export playlist - METALHEART // Y2K'
    $dlg.Filter = 'M3U8 playlist (*.m3u8)|*.m3u8|M3U playlist (*.m3u)|*.m3u'
    $dlg.FileName = "$name.m3u8"
    $dlg.InitialDirectory = [Environment]::GetFolderPath('MyMusic')
    $dlg.OverwritePrompt = $true
    # an invisible topmost owner, so the box opens in front of foobar2000
    $owner = New-Object Windows.Forms.Form -Property @{ TopMost = $true; ShowInTaskbar = $false; Opacity = 0; StartPosition = 'CenterScreen' }
    $owner.Show(); $owner.Activate()
    $ok = $dlg.ShowDialog($owner) -eq 'OK'
    $owner.Close()
    if (-not $ok) { Write-Result @{ status = 'cancel' }; exit 0 }
    $out = $dlg.FileName
  }
  if ($out -notmatch '\.m3u8?$') { throw 'Only .m3u8 / .m3u files are written' }
  $dir = Split-Path $out -Parent
  if (-not (Test-Path -LiteralPath $dir)) { throw "The folder $dir isn't there any more" }
  [IO.File]::WriteAllText($out, $text, (New-Object Text.UTF8Encoding $false))
  Write-Result @{ status = 'ok'; path = $out }
} catch {
  Write-Result @{ status = 'error'; message = $_.Exception.Message }
} finally {
  $lock.Close()
  Get-ChildItem $TmpDir -File -Filter "$Job.*" | Remove-Item -Force -ErrorAction SilentlyContinue
}
