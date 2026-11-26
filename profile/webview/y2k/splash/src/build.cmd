@echo off
rem Builds ..\Metalheart.exe (with its icon) using the C# compiler that ships with Windows (.NET Framework 4.x).
set FW=%WINDIR%\Microsoft.NET\Framework64\v4.0.30319
"%FW%\csc.exe" /nologo /target:winexe /optimize+ /platform:anycpu /win32icon:"%~dp0..\metalheart.ico" /out:"%~dp0..\Metalheart.exe" ^
  /r:"%FW%\WPF\PresentationFramework.dll" /r:"%FW%\WPF\PresentationCore.dll" /r:"%FW%\WPF\WindowsBase.dll" /r:"%FW%\System.Xaml.dll" ^
  "%~dp0MetalheartSplash.cs"
