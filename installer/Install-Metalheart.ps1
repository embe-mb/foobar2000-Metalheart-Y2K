# METALHEART // Y2K - theme installer for an existing foobar2000 v2 (64-bit), portable or standard install.
# Started by "Install Metalheart Y2K.cmd". It:
#   1. downloads the components the theme needs from their official pages (foobar2000.org / GitHub),
#   2. copies the theme's panels into <profile>\webview\y2k,
#   3. starts foobar2000 and imports the Metalheart layout (your previous layout is backed up first).
# Nothing from foobar2000 itself is shipped or changed.
param([string]$Folder = '')
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Windows.Forms, System.Drawing, System.IO.Compression.FileSystem
[Windows.Forms.Application]::EnableVisualStyles()
[Net.ServicePointManager]::SecurityProtocol = [Net.ServicePointManager]::SecurityProtocol -bor [Net.SecurityProtocolType]::Tls12
$ProgressPreference = 'SilentlyContinue'

$PackRoot = Split-Path $PSScriptRoot -Parent
$ThemeSrc = Join-Path $PackRoot 'profile\webview\y2k'

# --- components: Name = folder/dll name, From = foobar2000.org component page or GitHub repo (latest release)
$Components = @(
  @{ Name = 'foo_ui_columns';    Title = 'Columns UI (the window layout)';       Page = 'https://www.foobar2000.org/components/view/foo_ui_columns';    Required = $true },
  @{ Name = 'foo_webview2';      Title = 'WebView2 panel (deck, library, tabs)'; Page = 'https://www.foobar2000.org/components/view/foo_webview2';      Required = $true },
  @{ Name = 'foo_uie_albumlist'; Title = 'Album List panel';                     Page = 'https://www.foobar2000.org/components/view/foo_uie_albumlist'; Required = $true },
  @{ Name = 'foo_openlyrics';    Title = 'OpenLyrics (lyrics panel)';            Page = 'https://www.foobar2000.org/components/view/foo_openlyrics';    Required = $true },
  @{ Name = 'foo_vis_milk2';     Title = 'MilkDrop 2 visualiser';                Page = 'https://www.foobar2000.org/components/view/foo_vis_milk2';     Required = $true },
  @{ Name = 'foo_listenbrainz2'; Title = 'ListenBrainz scrobbler (optional)';    GitHub = 'phw/foo_listenbrainz2';                                       Required = $false },
  @{ Name = 'foo_navidrome';     Title = 'Navidrome / Subsonic browser (optional)'; Page = 'https://www.foobar2000.org/components/view/foo_navidrome';  Required = $false }
)

Add-Type @"
using System; using System.Text; using System.Runtime.InteropServices;
public static class MhWin {
  delegate bool EP(IntPtr h, IntPtr l);
  [DllImport("user32.dll")] static extern bool EnumWindows(EP f, IntPtr l);
  [DllImport("user32.dll")] static extern uint GetWindowThreadProcessId(IntPtr h, out uint p);
  [DllImport("user32.dll")] static extern bool IsWindowVisible(IntPtr h);
  [DllImport("user32.dll")] static extern int GetClassName(IntPtr h, StringBuilder s, int n);
  [DllImport("user32.dll", CharSet = CharSet.Unicode)] static extern int GetWindowText(IntPtr h, StringBuilder s, int n);
  [DllImport("user32.dll")] public static extern bool PostMessage(IntPtr h, uint m, IntPtr w, IntPtr l);
  // first visible top-level window of process pid with this class (null = any) whose title starts with titlePrefix (null = any)
  public static IntPtr Find(int pid, string cls, string titlePrefix) {
    IntPtr found = IntPtr.Zero;
    EnumWindows((h, x) => {
      uint p; GetWindowThreadProcessId(h, out p);
      if (p != (uint)pid || !IsWindowVisible(h)) return true;
      var c = new StringBuilder(256); GetClassName(h, c, 256);
      var t = new StringBuilder(256); GetWindowText(h, t, 256);
      if ((cls == null || c.ToString() == cls) && (titlePrefix == null || t.ToString().StartsWith(titlePrefix))) { found = h; return false; }
      return true;
    }, IntPtr.Zero);
    return found;
  }
}
"@
$CuiMainClass = '{E7076D1C-A7BF-4f39-B771-BCBE88F2A2A8}'   # Columns UI's main window

# ---------------------------------------------------------------- helpers
function Test-X64Exe([string]$path) {
  try {
    $b = [IO.File]::ReadAllBytes($path)
    $pe = [BitConverter]::ToInt32($b, 0x3C)
    return [BitConverter]::ToUInt16($b, $pe + 4) -eq 0x8664
  } catch { return $false }
}

function Get-ProfileDir([string]$dir) {
  if (Test-Path (Join-Path $dir 'portable_mode_enabled')) { return (Join-Path $dir 'profile') }
  return (Join-Path $env:APPDATA 'foobar2000-v2')
}

function Find-Foobar {
  $p = Get-Process foobar2000 -ErrorAction SilentlyContinue | Where-Object { $_.Path } | Select-Object -First 1
  if ($p) { return (Split-Path $p.Path -Parent) }
  foreach ($d in @("$env:ProgramFiles\foobar2000", "${env:ProgramFiles(x86)}\foobar2000", 'C:\foobar2000', "$env:USERPROFILE\Desktop\foobar2000")) {
    if ($d -and (Test-Path (Join-Path $d 'foobar2000.exe'))) { return $d }
  }
  return ''
}

function Get-ComponentUrl($c) {
  if ($c.GitHub) {
    $rel = Invoke-RestMethod -UseBasicParsing "https://api.github.com/repos/$($c.GitHub)/releases/latest"
    $a = $rel.assets | Where-Object { $_.name -like '*.fb2k-component' } | Select-Object -First 1
    if (-not $a) { throw "no .fb2k-component in the latest $($c.GitHub) release" }
    return $a.browser_download_url
  }
  $html = (Invoke-WebRequest -UseBasicParsing $c.Page).Content
  $m = [regex]::Match($html, 'href="(/getcomponent/[^"]+\.fb2k-component)"')
  if (-not $m.Success) { throw "no download link found on $($c.Page)" }
  return 'https://www.foobar2000.org' + $m.Groups[1].Value
}

# A .fb2k-component is a zip. Multi-architecture ones keep the 64-bit build in x64\ - that's the one we want.
function Install-Component($c, [string]$compDir) {
  $dest = Join-Path $compDir $c.Name
  if (Test-Path (Join-Path $dest "$($c.Name).dll")) { Write-Log "  $($c.Name): already installed, kept as is"; return }
  $url = Get-ComponentUrl $c
  $tmp = Join-Path $env:TEMP ('metalheart-' + [guid]::NewGuid().ToString('N'))
  New-Item -ItemType Directory -Path $tmp | Out-Null
  try {
    $zip = Join-Path $tmp 'c.zip'
    Write-Log "  $($c.Name): downloading $(Split-Path $url -Leaf)"
    Invoke-WebRequest -UseBasicParsing $url -OutFile $zip
    $x = Join-Path $tmp 'x'
    [IO.Compression.ZipFile]::ExtractToDirectory($zip, $x)
    $x64 = Join-Path $x 'x64'
    $multi = Test-Path $x64
    $bin = $(if ($multi) { $x64 } else { $x })
    if (-not (Test-Path (Join-Path $bin "$($c.Name).dll"))) { throw "$($c.Name).dll (64-bit) not found in the download" }
    New-Item -ItemType Directory -Path $dest -Force | Out-Null
    # shared files (presets, data folders...) sit at the top; in a multi-architecture package the top-level .dlls are 32-bit
    Get-ChildItem $x | Where-Object { $_.Name -notin @('x86', 'x64', 'arm64', 'arm64ec', 'mac') -and -not ($multi -and $_.Extension -eq '.dll') } |
      Copy-Item -Destination $dest -Recurse -Force
    if ($multi) { Get-ChildItem $x64 | Copy-Item -Destination $dest -Recurse -Force }
    Get-ChildItem $dest -Recurse -File | Unblock-File
    Write-Log "  $($c.Name): installed"
  } finally { Remove-Item $tmp -Recurse -Force -ErrorAction SilentlyContinue }
}

# ---------------------------------------------------------------- window
$bg = [Drawing.Color]::FromArgb(14, 18, 24); $panel = [Drawing.Color]::FromArgb(24, 31, 40)
$fg = [Drawing.Color]::FromArgb(214, 224, 236); $lime = [Drawing.Color]::FromArgb(156, 255, 46); $dim = [Drawing.Color]::FromArgb(120, 136, 156)

$form = New-Object Windows.Forms.Form
$form.Text = 'METALHEART // Y2K - theme installer'
$form.ClientSize = New-Object Drawing.Size 620, 560
$form.FormBorderStyle = 'FixedDialog'; $form.MaximizeBox = $false; $form.StartPosition = 'CenterScreen'
$form.BackColor = $bg; $form.ForeColor = $fg; $form.Font = New-Object Drawing.Font 'Segoe UI', 9.5

function Add-Label($text, $x, $y, $w, $h, $color, $size, $bold) {
  $l = New-Object Windows.Forms.Label
  $l.Text = $text; $l.Location = New-Object Drawing.Point $x, $y; $l.Size = New-Object Drawing.Size $w, $h
  $l.ForeColor = $color
  if ($size) { $l.Font = New-Object Drawing.Font 'Segoe UI', $size, $(if ($bold) { [Drawing.FontStyle]::Bold } else { [Drawing.FontStyle]::Regular }) }
  $form.Controls.Add($l); return $l
}

Add-Label 'METALHEART // Y2K' 18 12 400 34 $lime 17 $true | Out-Null
Add-Label 'Installs the theme into the foobar2000 you already have (v2, 64-bit, portable or standard).' 20 48 590 20 $dim 0 $false | Out-Null

Add-Label '1.  Your foobar2000 folder (the one with foobar2000.exe in it)' 20 82 590 20 $fg 0 $false | Out-Null
$tbFolder = New-Object Windows.Forms.TextBox
$tbFolder.Location = New-Object Drawing.Point 22, 106; $tbFolder.Size = New-Object Drawing.Size 480, 26
$tbFolder.BackColor = $panel; $tbFolder.ForeColor = $fg; $tbFolder.BorderStyle = 'FixedSingle'
$form.Controls.Add($tbFolder)
$bBrowse = New-Object Windows.Forms.Button
$bBrowse.Text = 'Browse...'; $bBrowse.Location = New-Object Drawing.Point 510, 104; $bBrowse.Size = New-Object Drawing.Size 90, 28
$bBrowse.FlatStyle = 'Flat'; $bBrowse.BackColor = $panel
$form.Controls.Add($bBrowse)
$lInfo = Add-Label '' 22 136 580 20 $dim 0 $false

Add-Label '2.  Components to download (from their official pages)' 20 166 590 20 $fg 0 $false | Out-Null
$clb = New-Object Windows.Forms.CheckedListBox
$clb.Location = New-Object Drawing.Point 22, 190; $clb.Size = New-Object Drawing.Size 578, 128
$clb.BackColor = $panel; $clb.ForeColor = $fg; $clb.BorderStyle = 'FixedSingle'; $clb.CheckOnClick = $true
foreach ($c in $Components) { [void]$clb.Items.Add($c.Title, $true) }
$clb.Add_ItemCheck({ param($s, $e) if ($Components[$e.Index].Required) { $e.NewValue = 'Checked' } })
$form.Controls.Add($clb)

$log = New-Object Windows.Forms.TextBox
$log.Multiline = $true; $log.ReadOnly = $true; $log.ScrollBars = 'Vertical'
$log.Location = New-Object Drawing.Point 22, 330; $log.Size = New-Object Drawing.Size 578, 170
$log.BackColor = [Drawing.Color]::FromArgb(8, 11, 15); $log.ForeColor = $lime; $log.BorderStyle = 'FixedSingle'
$log.Font = New-Object Drawing.Font 'Consolas', 9
$form.Controls.Add($log)

$bInstall = New-Object Windows.Forms.Button
$bInstall.Text = 'INSTALL'; $bInstall.Location = New-Object Drawing.Point 450, 512; $bInstall.Size = New-Object Drawing.Size 150, 34
$bInstall.FlatStyle = 'Flat'; $bInstall.BackColor = [Drawing.Color]::FromArgb(40, 70, 14); $bInstall.ForeColor = $lime
$bInstall.Font = New-Object Drawing.Font 'Segoe UI', 10, ([Drawing.FontStyle]::Bold)
$form.Controls.Add($bInstall)
$bClose = New-Object Windows.Forms.Button
$bClose.Text = 'Close'; $bClose.Location = New-Object Drawing.Point 340, 512; $bClose.Size = New-Object Drawing.Size 100, 34
$bClose.FlatStyle = 'Flat'; $bClose.BackColor = $panel
$bClose.Add_Click({ $form.Close() })
$form.Controls.Add($bClose)

function Write-Log([string]$s) { $log.AppendText($s + "`r`n"); [Windows.Forms.Application]::DoEvents() }

function Update-Info {
  $d = $tbFolder.Text.Trim('" ')
  $exe = Join-Path $d 'foobar2000.exe'
  if (-not $d -or -not (Test-Path $exe)) { $lInfo.Text = 'No foobar2000.exe in this folder yet.'; $lInfo.ForeColor = $dim; return }
  $mode = if (Test-Path (Join-Path $d 'portable_mode_enabled')) { 'portable' } else { 'standard install' }
  $lInfo.Text = "Found foobar2000 ($mode). Settings folder: $(Get-ProfileDir $d)"; $lInfo.ForeColor = $lime
}
$tbFolder.Add_TextChanged({ Update-Info })
$bBrowse.Add_Click({
  $dlg = New-Object Windows.Forms.FolderBrowserDialog
  $dlg.Description = 'Choose the folder that contains foobar2000.exe'
  if ($tbFolder.Text -and (Test-Path $tbFolder.Text)) { $dlg.SelectedPath = $tbFolder.Text }
  if ($dlg.ShowDialog() -eq 'OK') { $tbFolder.Text = $dlg.SelectedPath }
})

# ---------------------------------------------------------------- install
$bInstall.Add_Click({
  $d = $tbFolder.Text.Trim('" ')
  $exe = Join-Path $d 'foobar2000.exe'
  if (-not (Test-Path $exe)) { [Windows.Forms.MessageBox]::Show('Pick the folder that contains foobar2000.exe first.', 'METALHEART // Y2K') | Out-Null; return }
  if (-not (Test-X64Exe $exe)) { [Windows.Forms.MessageBox]::Show('This is the 32-bit foobar2000. The theme needs the 64-bit version (foobar2000 v2 x64).', 'METALHEART // Y2K') | Out-Null; return }
  $ver = [Diagnostics.FileVersionInfo]::GetVersionInfo($exe).FileMajorPart
  if ($ver -lt 2) { [Windows.Forms.MessageBox]::Show('This is foobar2000 v1. The theme needs foobar2000 v2 (64-bit).', 'METALHEART // Y2K') | Out-Null; return }
  while (Get-Process foobar2000 -ErrorAction SilentlyContinue | Where-Object { $_.Path -eq (Resolve-Path $exe).Path }) {
    $r = [Windows.Forms.MessageBox]::Show("foobar2000 is running. Close it (File > Exit), then press Retry.", 'METALHEART // Y2K', 'RetryCancel', 'Warning')
    if ($r -ne 'Retry') { return }
  }
  $prof = Get-ProfileDir $d
  if (-not (Test-Path $ThemeSrc)) { Write-Log "ERROR: theme files not found next to the installer ($ThemeSrc). Unzip the whole download first."; return }

  $bInstall.Enabled = $false; $bBrowse.Enabled = $false; $clb.Enabled = $false
  $ok = $true
  try {
    Write-Log "foobar2000:  $d"
    Write-Log "settings:    $prof"
    New-Item -ItemType Directory -Path $prof -Force | Out-Null

    # back up the current Columns UI settings (layout, colours, fonts) so the old look can be restored
    $cuiCfg = Join-Path $prof 'configuration\foo_ui_columns.dll.cfg'
    if (Test-Path $cuiCfg) {
      $bk = Join-Path $prof ('metalheart-backup\' + (Get-Date -Format 'yyyy-MM-dd_HHmmss'))
      New-Item -ItemType Directory -Path $bk -Force | Out-Null
      Copy-Item $cuiCfg $bk
      Write-Log "Backed up your current Columns UI settings to $bk"
    }

    Write-Log 'Components:'
    $compDir = Join-Path $prof 'user-components-x64'
    New-Item -ItemType Directory -Path $compDir -Force | Out-Null
    for ($i = 0; $i -lt $Components.Count; $i++) {
      if (-not $clb.GetItemChecked($i)) { continue }
      try { Install-Component $Components[$i] $compDir }
      catch {
        Write-Log "  $($Components[$i].Name): FAILED - $($_.Exception.Message)"
        if ($Components[$i].Required) { $ok = $false }
      }
    }
    if (-not $ok) { throw 'A required component could not be downloaded. Check your internet connection and press INSTALL again.' }

    # the package's profile folder = the theme panels (webview\y2k) + the MilkDrop preset pack (milkdrop2)
    Write-Log 'Copying the theme files...'
    foreach ($sub in 'webview\y2k', 'milkdrop2') {
      $from = Join-Path $PackRoot "profile\$sub"
      if (-not (Test-Path $from)) { continue }
      $to = Join-Path $prof $sub
      New-Item -ItemType Directory -Path $to -Force | Out-Null
      Copy-Item (Join-Path $from '*') $to -Recurse -Force
      Get-ChildItem $to -Recurse -File | Unblock-File
      Write-Log "  -> $to"
    }
    $dest = Join-Path $prof 'webview\y2k'

    # The layout can only be imported once Columns UI is the running interface, so start foobar2000 and wait for it
    Write-Log 'Starting foobar2000...'
    Start-Process -FilePath $exe -WorkingDirectory $d
    $script:apply = @{ Exe = (Resolve-Path $exe).Path; Dir = $d; Fcl = (Join-Path $dest 'layouts\Metalheart-Y2K.fcl'); FreshCui = -not (Test-Path $cuiCfg); Start = Get-Date; Seen = $null; AskedUi = $false; ToldPrefs = $false }
    $bInstall.Text = 'WAITING...'
    $timer.Start()
  } catch {
    Write-Log ''
    Write-Log "ERROR: $($_.Exception.Message)"
    $bInstall.Enabled = $true; $bBrowse.Enabled = $true; $clb.Enabled = $true
  }
})

# ---------------------------------------------------------------- apply the layout once foobar2000 runs Columns UI
$timer = New-Object Windows.Forms.Timer
$timer.Interval = 1000
$timer.Add_Tick({
  $a = $script:apply
  $elapsed = ((Get-Date) - $a.Start).TotalSeconds
  if ($elapsed -gt 900) { $timer.Stop(); Write-Log 'Gave up waiting for Columns UI. Start this installer again once foobar2000 uses Columns UI.'; $bInstall.Text = 'INSTALL'; $bInstall.Enabled = $true; return }
  $p = Get-Process foobar2000 -ErrorAction SilentlyContinue | Where-Object { $_.Path -eq $a.Exe } | Select-Object -First 1
  if (-not $p) { $a.Seen = $null; return }   # not started yet, or restarting after a user-interface switch

  if (-not $a.AskedUi -and [MhWin]::Find($p.Id, '#32770', 'New user interface module') -ne [IntPtr]::Zero) {
    $a.AskedUi = $true
    Write-Log '>>> foobar2000 asks which user interface to use: select  Columns UI  and press OK.'
    return
  }
  if ([MhWin]::Find($p.Id, $CuiMainClass, $null) -eq [IntPtr]::Zero) {
    if (-not $a.ToldPrefs -and $elapsed -gt 25 -and [MhWin]::Find($p.Id, '#32770', 'New user interface module') -eq [IntPtr]::Zero) {
      $a.ToldPrefs = $true
      Write-Log '>>> foobar2000 is not using Columns UI yet. In foobar2000: File > Preferences > Display >'
      Write-Log '    User interface module: Columns UI, then OK and let it restart. The layout is applied right after.'
    }
    return
  }
  if (-not $a.Seen) { $a.Seen = Get-Date; return }                     # give Columns UI a moment to finish starting
  if (((Get-Date) - $a.Seen).TotalSeconds -lt 3) { return }
  # Columns UI's first-run "Quick setup" would overwrite the layout when closed later: close it first
  $qs = [MhWin]::Find($p.Id, '#32770', 'Quick setup')
  if ($qs -ne [IntPtr]::Zero) { [MhWin]::PostMessage($qs, 0x0010, [IntPtr]::Zero, [IntPtr]::Zero) | Out-Null; return }

  $timer.Stop()
  Write-Log 'Applying the Metalheart layout...'
  Start-Process -FilePath $a.Exe -WorkingDirectory $a.Dir -ArgumentList @('/columnsui:import-quiet', "`"$($a.Fcl)`"") -Wait
  # these are on/off toggles outside the layout file: only flip them on a fresh Columns UI (where both are known to be on)
  if ($a.FreshCui) {
    Start-Sleep -Milliseconds 800
    foreach ($cmd in 'Show toolbars', 'Show status pane') {
      Start-Process -FilePath $a.Exe -WorkingDirectory $a.Dir -ArgumentList "`"/command:$cmd`"" -Wait
      Start-Sleep -Milliseconds 500
    }
  } else {
    Write-Log 'Tip: the theme looks best without the toolbar row and status pane (View > Show toolbars / Show status pane).'
  }
  Write-Log ''
  Write-Log 'DONE. Enjoy METALHEART // Y2K.'
  Write-Log 'Add your music with  + MUSIC  in the control pod, and try CUSTOMIZE DECK (the green button).'
  $bInstall.Text = 'INSTALLED'
})

$tbFolder.Text = $(if ($Folder) { $Folder } else { Find-Foobar })
Update-Info
[void]$form.ShowDialog()
