# METALHEART // Y2K - builds the launcher, splash\Metalheart.exe, from MetalheartSplash.cs on this PC.
# The theme ships the launcher as source, not as a program: it is compiled here with the C# compiler that comes with
# Windows (.NET Framework 4.x, part of every Windows 10 and 11), so nothing is downloaded. Run by the installer (and so
# by every update); it can also be run by hand:
#   powershell -NoProfile -ExecutionPolicy Bypass -File build.ps1 [-Shortcuts]
# -Shortcuts then runs Metalheart.exe --install: Desktop + Start menu "Metalheart" shortcuts (they start foobar2000
# with the splash screen) and Metalheart in Settings > Default apps (only listed there; no default is changed).
# Exit code 0 = built (and shortcuts made, if asked); 1 = not.
param([switch]$Shortcuts)
$ErrorActionPreference = 'Stop'
$src = $PSScriptRoot
$splash = Split-Path $src -Parent
$out = Join-Path $splash 'Metalheart.exe'
$cs = Join-Path $src 'MetalheartSplash.cs'
$ico = Join-Path $splash 'metalheart.ico'
try {
  if (-not (Test-Path $cs)) { throw "MetalheartSplash.cs is missing from $src" }
  $fw = @("$env:WINDIR\Microsoft.NET\Framework64\v4.0.30319", "$env:WINDIR\Microsoft.NET\Framework\v4.0.30319") | Where-Object { Test-Path (Join-Path $_ 'csc.exe') } | Select-Object -First 1
  if (-not $fw) { throw 'the .NET Framework 4 C# compiler (csc.exe) was not found' }
  $refs = 'WPF\PresentationFramework.dll', 'WPF\PresentationCore.dll', 'WPF\WindowsBase.dll', 'System.Xaml.dll' | ForEach-Object { '/r:' + (Join-Path $fw $_) }
  # built next to the old one, then swapped in: a failed build leaves a working launcher in place
  $tmp = Join-Path $splash 'Metalheart.new.exe'
  Remove-Item $tmp -Force -ErrorAction SilentlyContinue
  $cargs = @('/nologo', '/target:winexe', '/optimize+', '/platform:anycpu', "/out:$tmp") + $(if (Test-Path $ico) { "/win32icon:$ico" }) + $refs + $cs
  $msg = & (Join-Path $fw 'csc.exe') @cargs 2>&1 | Out-String
  if ($LASTEXITCODE -ne 0 -or -not (Test-Path $tmp)) { throw ('the compiler failed: ' + ($msg -split "`r?`n" | Where-Object { $_ -match 'error' } | Select-Object -First 3) -join ' / ') }
  # a launcher still running from here (a splash, or a --tag waiting for foobar2000) would hold the file
  Get-Process Metalheart -ErrorAction SilentlyContinue | Where-Object { $_.Path -eq $out } | ForEach-Object { try { $_.Kill(); $_.WaitForExit(3000) | Out-Null } catch {} }
  Move-Item $tmp $out -Force
  Write-Output "launcher built: $out"
  if ($Shortcuts) {
    $p = Start-Process -FilePath $out -ArgumentList '--install', '--quiet' -Wait -PassThru
    if ($p.ExitCode -ne 0) { throw 'the launcher could not make its shortcuts' }
    Write-Output 'Metalheart shortcuts made (Desktop + Start menu) and listed in Default apps'
  }
  exit 0
} catch {
  Write-Output "launcher not built: $($_.Exception.Message)"
  exit 1
}
