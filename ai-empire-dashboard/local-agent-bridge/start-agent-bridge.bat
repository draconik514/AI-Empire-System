@echo off
chcp 65001 >nul
title AI Empire - Local Agent Bridge (MSI RAM 8GB Safe Mode)
echo ===========================================================================
echo   MENJALANKAN JEMBATAN AI LOKAL (SUPABASE - TELEGRAM - OBSIDIAN - FFMPEG)
echo ===========================================================================
python "%~dp0agent_bridge.py"
echo.
pause
