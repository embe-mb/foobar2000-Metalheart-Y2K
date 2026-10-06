@echo off
rem METALHEART // Y2K - opens the theme installer (a small window; nothing is installed until you press INSTALL)
start "" powershell.exe -NoProfile -ExecutionPolicy Bypass -STA -WindowStyle Hidden -File "%~dp0installer\Install-Metalheart.ps1"
