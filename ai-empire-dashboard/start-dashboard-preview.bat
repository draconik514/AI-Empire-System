@echo off
title AI Empire Command Center - Local Preview
echo ===========================================================================
echo   MENJALANKAN COMMAND CENTER DASHBOARD (LOCAL PREVIEW)
echo   Catatan: Setelah di-deploy ke Vercel, Anda tidak perlu menjalankan ini!
echo ===========================================================================
cd /d "%~dp0"
call npm.cmd run dev
pause

