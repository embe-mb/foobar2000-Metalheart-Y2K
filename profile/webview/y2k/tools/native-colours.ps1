# METALHEART // Y2K - recolours the lyrics panel (OpenLyrics), the one built-in panel the web skin can't reach,
# live and without touching the layout: imports colours-<scheme>.fcl, a Columns UI colours-only preset that gives
# OpenLyrics' highlight (and the focus frame) the theme colour. The seek bar is a web panel and follows the theme itself.
# Started by CUSTOMIZE DECK > APPLY TO LYRICS PANEL; it can also be run by hand:  native-colours.ps1 -Scheme magenta
param([ValidateSet('lime', 'cyan', 'ice', 'magenta', 'amber', 'ember')][string]$Scheme = 'lime')
$log = Join-Path $PSScriptRoot 'native-colours.log'
$root = (Resolve-Path (Join-Path $PSScriptRoot '..\..\..\..')).Path          # tools -> y2k -> webview -> profile -> install
# portable install: foobar2000.exe sits next to the profile folder; standard install (%APPDATA% profile): ask the running player
$exe = Join-Path $root 'foobar2000.exe'
if (-not (Test-Path $exe)) { $p = Get-Process foobar2000 -ErrorAction SilentlyContinue | Select-Object -First 1; if ($p) { $exe = $p.Path } }
try {
  & $exe /columnsui:import-quiet (Join-Path $PSScriptRoot "colours-$Scheme.fcl")
  Set-Content -Path $log -Value ("{0:HH:mm:ss}  lyrics colours -> {1}" -f (Get-Date), $Scheme)
} catch { Set-Content -Path $log -Value ("error: " + $_.Exception.Message) }
