@echo off
rem Runs dev.ps1 without requiring a changed PowerShell execution policy.
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0dev.ps1" %*
