# METALHEART // Y2K - synced lyrics helper
# The theme searches LRCLIB itself (it answers web pages directly). NetEase and QQ Music don't, so the page starts
# this script, hidden, with the track in -Job (base64 of a UTF-8 JSON object):
#   { artist, title, album, duration, out, status, text, sources }
#   out     the .lrc file to write (OpenLyrics' save folder, so every panel and OpenLyrics itself find it)
#   status  a small file the page polls: "ok <source>" or "miss"
#   text    (optional) base64 lyrics the page already found: just save them
#   sources (optional) "netease,qq" (default)
param([Parameter(Mandatory = $true)][string]$Job)
$ErrorActionPreference = 'Stop'
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
$utf8 = New-Object System.Text.UTF8Encoding($false)
$j = [Text.Encoding]::UTF8.GetString([Convert]::FromBase64String($Job)) | ConvertFrom-Json

function Save-Lrc([string]$text, [string]$src) {
  $dir = Split-Path -Parent $j.out
  if (-not (Test-Path -LiteralPath $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }
  if ($text -notmatch '^\[re:') { $text = "[re:$src]`n" + $text.Trim() + "`n" }
  $tmp = $j.out + '.part'
  [IO.File]::WriteAllText($tmp, $text, $utf8)
  Move-Item -LiteralPath $tmp -Destination $j.out -Force
  if ($j.status) { [IO.File]::WriteAllText($j.status, "ok $src", $utf8) }
}
function Get-Text([string]$url, [string]$referer) {
  $wc = New-Object Net.WebClient
  $wc.Encoding = [Text.Encoding]::UTF8
  $wc.Headers.Add('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Metalheart-Y2K')
  if ($referer) { $wc.Headers.Add('Referer', $referer) }
  try { return $wc.DownloadString($url) } finally { $wc.Dispose() }
}
# compare names loosely: lower case, no brackets / feat. / punctuation
function Norm([string]$s) {
  $s = ($s -replace '\s*[\(\[][^\)\]]*[\)\]]', '' -replace '\s+(feat\.?|ft\.?|featuring)\s.*$', '').ToLowerInvariant()
  return ($s -replace '[^\p{L}\p{N}]+', '')
}
# drop credit lines (lyricist / composer ...) and the "Title - Artist" header line some services put at 0:00
function Clean-Lrc([string]$t) {
  $credit = '^\[[\d:.]+\]\s*(作词|作曲|编曲|制作人|混音|母带|和声|吉他|贝斯|鼓|弦乐|录音|监制|出品|词|曲|OP|SP|Lyricist|Lyrics by|Composer|Composed by|Producer|Arranger|Written by)\s*[:：]'
  $lines = ($t -replace "`r", '') -split "`n" | Where-Object { $_ -notmatch $credit }
  $lines = $lines | Where-Object { -not ($_ -match '^\[00:00[.:]0+\](.+?) - (.+)$' -and (Norm $matches[1]) -eq (Norm $j.title)) }
  return ($lines -join "`n").Trim()
}
$wantT = Norm $j.title; $wantA = Norm (($j.artist -split '[;,&/]| feat\.? | x ')[0])
$dur = [double]($j.duration)
function Good($name, $artists, $sec) {
  $n = Norm $name
  if (-not $n -or ($n -ne $wantT -and -not $n.StartsWith($wantT) -and -not $wantT.StartsWith($n))) { return $false }
  $am = $false; foreach ($a in $artists) { $x = Norm $a; if ($x -and ($x.Contains($wantA) -or $wantA.Contains($x))) { $am = $true } }
  if (-not $am) { return $false }
  return ($dur -le 0 -or $sec -le 0 -or [math]::Abs($sec - $dur) -le 4)
}
$synced = '\[\d+:\d+([.:]\d+)?\]\S'

# status files older than a day are left over from earlier searches
if ($j.status) { try { Get-ChildItem -LiteralPath (Split-Path -Parent $j.status) -Filter *.txt -ErrorAction SilentlyContinue | Where-Object { $_.LastWriteTime -lt (Get-Date).AddDays(-1) } | Remove-Item -Force -ErrorAction SilentlyContinue } catch { }
  $sd = Split-Path -Parent $j.status; if (-not (Test-Path -LiteralPath $sd)) { New-Item -ItemType Directory -Path $sd -Force | Out-Null } }
try {
  if ($j.text) { Save-Lrc ([Text.Encoding]::UTF8.GetString([Convert]::FromBase64String($j.text))) 'LRCLIB'; exit 0 }
  $q = [Uri]::EscapeDataString(($j.artist + ' ' + $j.title).Trim())
  $order = if ($j.sources) { $j.sources -split ',' } else { @('netease', 'qq') }
  foreach ($s in $order) {
    try {
      if ($s -eq 'netease') {
        $r = (Get-Text "https://music.163.com/api/search/get?s=$q&type=1&limit=12" 'https://music.163.com/') | ConvertFrom-Json
        foreach ($song in @($r.result.songs)) {
          if (-not $song -or -not (Good $song.name @($song.artists | ForEach-Object { $_.name }) ($song.duration / 1000))) { continue }
          $l = (Get-Text "https://music.163.com/api/song/lyric?id=$($song.id)&lv=1&kv=1&tv=-1" 'https://music.163.com/') | ConvertFrom-Json
          $t = Clean-Lrc ([string]$l.lrc.lyric)
          if ($t -match $synced) { Save-Lrc $t 'NETEASE'; exit 0 }
        }
      }
      elseif ($s -eq 'qq') {
        $r = (Get-Text "https://c.y.qq.com/splcloud/fcgi-bin/smartbox_new.fcg?format=json&key=$q" 'https://y.qq.com/') | ConvertFrom-Json
        foreach ($song in @($r.data.song.itemlist)) {
          if (-not $song -or -not (Good $song.name @($song.singer -split '/') 0)) { continue }
          $l = (Get-Text "https://c.y.qq.com/lyric/fcgi-bin/fcg_query_lyric_new.fcg?songmid=$($song.mid)&format=json&nobase64=1&g_tk=5381" 'https://y.qq.com/') | ConvertFrom-Json
          $t = Clean-Lrc ([Net.WebUtility]::HtmlDecode([string]$l.lyric))
          if ($t -match $synced) { Save-Lrc $t 'QQMUSIC'; exit 0 }
        }
      }
    } catch { }
  }
  if ($j.status) { [IO.File]::WriteAllText($j.status, 'miss', $utf8) }
} catch {
  if ($j.status) { [IO.File]::WriteAllText($j.status, 'miss', $utf8) }
}
