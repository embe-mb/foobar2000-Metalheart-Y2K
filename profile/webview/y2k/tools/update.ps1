# METALHEART // Y2K - theme updater. Started by the deck's update notice (or CUSTOMIZE DECK > PERFORMANCE > Theme version).
#   1. downloads the new release zip from the theme's GitHub page into your Downloads folder,
#   2. unpacks it to a temporary folder,
#   3. on CLOSE FOOBAR2000 & INSTALL: closes foobar2000, waits for it to exit and starts the new package's installer
#      (the same one as a first install: it keeps your components, backs up your Columns UI settings and restarts foobar2000).
# Your deck settings, caches and library are not touched.
param([Parameter(Mandatory)][string]$Url, [Parameter(Mandatory)][string]$Version, [string]$From = '', [long]$Size = 0)
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Windows.Forms, System.Drawing, System.IO.Compression.FileSystem
[Windows.Forms.Application]::EnableVisualStyles()
[Net.ServicePointManager]::SecurityProtocol = [Net.ServicePointManager]::SecurityProtocol -bor [Net.SecurityProtocolType]::Tls12
Add-Type @"
using System; using System.Runtime.InteropServices;
public static class MhUpd {
  [DllImport("user32.dll", CharSet = CharSet.Unicode)] public static extern IntPtr FindWindowEx(IntPtr parent, IntPtr after, string cls, string title);
  [DllImport("user32.dll")] public static extern uint GetWindowThreadProcessId(IntPtr h, out uint pid);
  [DllImport("user32.dll")] public static extern bool PostMessage(IntPtr h, uint m, IntPtr w, IntPtr l);
  // the top-level window of this class that belongs to process pid (another foobar2000 may be open too)
  public static IntPtr FindForPid(string cls, uint pid) {
    IntPtr h = IntPtr.Zero;
    while ((h = FindWindowEx(IntPtr.Zero, h, cls, null)) != IntPtr.Zero) { uint p; GetWindowThreadProcessId(h, out p); if (p == pid) return h; }
    return IntPtr.Zero;
  }
}
"@

# only ever download this theme's own release files
if ($Url -notmatch '^https://github\.com/embe-mb/foobar2000-Metalheart-Y2K/releases/download/[^/?#]+/[^/?#]+\.zip$' -or $Version -notmatch '^\d+(\.\d+){0,3}$') {
  [Windows.Forms.MessageBox]::Show("Not a Metalheart release download:`n$Url", 'METALHEART // Y2K update') | Out-Null; exit 1
}

# the foobar2000 that started this script (its parent process); any running foobar2000 otherwise
$fb = $null
try { $ppid = (Get-CimInstance Win32_Process -Filter "ProcessId=$PID").ParentProcessId; $fb = Get-Process -Id $ppid -ErrorAction Stop | Where-Object { $_.ProcessName -eq 'foobar2000' } } catch {}
if (-not $fb) { $fb = Get-Process foobar2000 -ErrorAction SilentlyContinue | Where-Object { $_.Path } | Select-Object -First 1 }
$FbExe = $(if ($fb) { $fb.Path } else { '' })
if (-not $FbExe) {   # portable install: foobar2000.exe sits next to the profile folder (tools -> y2k -> webview -> profile -> install)
  $guess = Join-Path (Resolve-Path (Join-Path $PSScriptRoot '..\..\..\..')).Path 'foobar2000.exe'
  if (Test-Path $guess) { $FbExe = $guess }
}

$Downloads = try { (New-Object -ComObject Shell.Application).NameSpace('shell:Downloads').Self.Path } catch { '' }
if (-not $Downloads -or -not (Test-Path $Downloads)) { $Downloads = Join-Path $env:USERPROFILE 'Downloads' }
New-Item -ItemType Directory -Path $Downloads -Force | Out-Null
$Zip = Join-Path $Downloads "Metalheart-Y2K-theme-v$Version.zip"
$Part = "$Zip.part"
$Unpack = Join-Path $env:TEMP "metalheart-update-v$Version"
$Installer = ''

# ---------------------------------------------------------------- window (same look as the installer)
$bg = [Drawing.Color]::FromArgb(14, 18, 24); $panel = [Drawing.Color]::FromArgb(24, 31, 40)
$fg = [Drawing.Color]::FromArgb(214, 224, 236); $lime = [Drawing.Color]::FromArgb(156, 255, 46); $dim = [Drawing.Color]::FromArgb(120, 136, 156)

$form = New-Object Windows.Forms.Form
$form.Text = 'METALHEART // Y2K - update'
$form.ClientSize = New-Object Drawing.Size 560, 330
$form.FormBorderStyle = 'FixedDialog'; $form.MaximizeBox = $false; $form.StartPosition = 'CenterScreen'; $form.TopMost = $true
$form.BackColor = $bg; $form.ForeColor = $fg; $form.Font = New-Object Drawing.Font 'Segoe UI', 9.5

$l1 = New-Object Windows.Forms.Label
$l1.Text = 'METALHEART // Y2K'; $l1.Location = New-Object Drawing.Point 18, 12; $l1.Size = New-Object Drawing.Size 400, 34
$l1.ForeColor = $lime; $l1.Font = New-Object Drawing.Font 'Segoe UI', 17, ([Drawing.FontStyle]::Bold)
$form.Controls.Add($l1)
$l2 = New-Object Windows.Forms.Label
$l2.Text = $(if ($From) { "Update from v$From to v$Version" } else { "Update to v$Version" })
$l2.Location = New-Object Drawing.Point 20, 48; $l2.Size = New-Object Drawing.Size 520, 20; $l2.ForeColor = $dim
$form.Controls.Add($l2)

$bar = New-Object Windows.Forms.ProgressBar
$bar.Location = New-Object Drawing.Point 22, 78; $bar.Size = New-Object Drawing.Size 516, 16; $bar.Maximum = 1000
$form.Controls.Add($bar)

$log = New-Object Windows.Forms.TextBox
$log.Multiline = $true; $log.ReadOnly = $true; $log.ScrollBars = 'Vertical'
$log.Location = New-Object Drawing.Point 22, 104; $log.Size = New-Object Drawing.Size 516, 166
$log.BackColor = [Drawing.Color]::FromArgb(8, 11, 15); $log.ForeColor = $lime; $log.BorderStyle = 'FixedSingle'
$log.Font = New-Object Drawing.Font 'Consolas', 9
$form.Controls.Add($log)
function Write-Log([string]$s) { $log.AppendText($s + "`r`n") }

$bInstall = New-Object Windows.Forms.Button
$bInstall.Text = 'CLOSE FOOBAR2000 && INSTALL'; $bInstall.Location = New-Object Drawing.Point 298, 282; $bInstall.Size = New-Object Drawing.Size 240, 34
$bInstall.FlatStyle = 'Flat'; $bInstall.BackColor = [Drawing.Color]::FromArgb(40, 70, 14); $bInstall.ForeColor = $lime
$bInstall.Font = New-Object Drawing.Font 'Segoe UI', 10, ([Drawing.FontStyle]::Bold); $bInstall.Enabled = $false
$form.Controls.Add($bInstall)
$bLater = New-Object Windows.Forms.Button
$bLater.Text = 'Later'; $bLater.Location = New-Object Drawing.Point 188, 282; $bLater.Size = New-Object Drawing.Size 100, 34
$bLater.FlatStyle = 'Flat'; $bLater.BackColor = $panel
$bLater.Add_Click({ $form.Close() })
$form.Controls.Add($bLater)

# ---------------------------------------------------------------- 1. download (polled by a timer so the window stays live)
$wc = New-Object Net.WebClient
$wc.Headers.Add('User-Agent', 'Metalheart-Y2K-updater')
$script:task = $null
$timer = New-Object Windows.Forms.Timer
$timer.Interval = 200

function Complete-Download {
  try {
    if (Test-Path $Zip) { Remove-Item $Zip -Force }
    Move-Item $Part $Zip
    Write-Log "Saved: $Zip"
    Write-Log 'Unpacking...'
    if (Test-Path $Unpack) { Remove-Item $Unpack -Recurse -Force }
    [IO.Compression.ZipFile]::ExtractToDirectory($Zip, $Unpack)
    $script:Installer = Get-ChildItem $Unpack -Recurse -Filter 'Install-Metalheart.ps1' | Select-Object -First 1 -ExpandProperty FullName
    if (-not $script:Installer) { throw 'the download has no installer in it' }
    Get-ChildItem $Unpack -Recurse -File | Unblock-File
    $bar.Value = 1000
    Write-Log ''
    Write-Log 'Ready. Installing needs foobar2000 closed: press CLOSE FOOBAR2000 & INSTALL.'
    Write-Log 'Playback stops; the installer starts foobar2000 again when it is done.'
    Write-Log "(Later: the zip stays in $Downloads - unzip it and run Install Metalheart Y2K.cmd.)"
    $bInstall.Enabled = $true; $bInstall.Focus()
  } catch {
    Write-Log "ERROR: $($_.Exception.Message)"
  }
}

$form.Add_Shown({
  Write-Log "Downloading v$Version from GitHub..."
  $script:task = $wc.DownloadFileTaskAsync($Url, $Part)
  $timer.Start()
})

# ---------------------------------------------------------------- 2. close foobar2000, then hand over to the installer
$script:closing = $null
$timer.Add_Tick({
  if ($script:task) {
    if (-not $script:task.IsCompleted) {
      if ($Size -gt 0 -and (Test-Path $Part)) { $bar.Value = [int][Math]::Min(990, 1000 * (Get-Item $Part).Length / $Size) }
      return
    }
    $t = $script:task; $script:task = $null; $timer.Stop()
    if ($t.IsFaulted) {
      $e = $t.Exception.InnerException; while ($e.InnerException) { $e = $e.InnerException }
      Write-Log "Download failed: $($e.Message)"
      Write-Log 'Check your internet connection and try again from CUSTOMIZE DECK > PERFORMANCE.'
      Remove-Item $Part -Force -ErrorAction SilentlyContinue
      return
    }
    Complete-Download
    return
  }
  if ($script:closing) {
    $running = Get-Process foobar2000 -ErrorAction SilentlyContinue | Where-Object { $_.Path -eq $FbExe }
    if ($running) {
      $s = ((Get-Date) - $script:closing).TotalSeconds
      if ($s -gt 20 -and -not $script:told) { $script:told = $true; Write-Log 'foobar2000 is still open (a dialog may be asking something). Close it yourself (File > Exit); the install starts as soon as it is gone.' }
      return
    }
    $timer.Stop()
    Write-Log 'foobar2000 closed. Starting the installer...'
    Start-Process powershell.exe -ArgumentList @('-NoProfile', '-ExecutionPolicy', 'Bypass', '-STA', '-WindowStyle', 'Hidden', '-File', "`"$script:Installer`"", '-Folder', "`"$(Split-Path $FbExe -Parent)`"")
    Start-Sleep -Milliseconds 600
    $form.Close()
  }
})

$bInstall.Add_Click({
  $bInstall.Enabled = $false; $bLater.Enabled = $false
  if (-not $FbExe) {
    Write-Log 'Could not find foobar2000.exe; starting the installer, pick the folder there.'
    $script:FbExe = ''
    Start-Process powershell.exe -ArgumentList @('-NoProfile', '-ExecutionPolicy', 'Bypass', '-STA', '-WindowStyle', 'Hidden', '-File', "`"$script:Installer`"")
    $form.Close(); return
  }
  Write-Log 'Closing foobar2000...'
  # Columns UI's main window takes WM_CLOSE like File > Exit (CloseMainWindow can pick another of its windows).
  # Only this foobar2000's window: another copy of foobar2000 that happens to be open is left alone.
  foreach ($p in Get-Process foobar2000 -ErrorAction SilentlyContinue | Where-Object { $_.Path -eq $FbExe }) {
    $cui = [MhUpd]::FindForPid('{E7076D1C-A7BF-4f39-B771-BCBE88F2A2A8}', [uint32]$p.Id)
    if ($cui -ne [IntPtr]::Zero) { [void][MhUpd]::PostMessage($cui, 0x0010, [IntPtr]::Zero, [IntPtr]::Zero) } else { [void]$p.CloseMainWindow() }
  }
  $script:closing = Get-Date; $script:told = $false
  $timer.Start()
})

$form.Add_FormClosed({
  $timer.Stop()
  if ($script:task -and -not $script:task.IsCompleted) { $wc.CancelAsync(); Start-Sleep -Milliseconds 300; Remove-Item $Part -Force -ErrorAction SilentlyContinue }
  $wc.Dispose()
})
[void]$form.ShowDialog()
