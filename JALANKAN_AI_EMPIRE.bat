@echo off
chcp 65001 >nul
title AI Empire System - Pusat Kendali Otomatisasi
color 0A

:: 1. Pastikan PATH ke Node.js dan Python tersedia
set "PATH=D:\node.js;C:\Users\draconik\AppData\Local\Programs\Python\Python311;C:\Users\draconik\AppData\Local\Programs\Python\Python311\Scripts;%PATH%"

echo ===============================================================================
echo            🚀 AI EMPIRE SYSTEM - PUSAT KENDALI OTOMATISASI 🚀
echo ===============================================================================
echo.
echo [1/3] Menyiapkan Direktori & Environment...
cd /d "D:\AI-Empire-System\ai-empire-dashboard"

echo [2/3] Menjalankan Background Worker (Pabrik Shorts Otomatis)...
start "AI Empire - Shorts Video Factory Worker" cmd /k "cd /d D:\AI-Empire-System\ai-empire-dashboard\local-agent-bridge && python shorts_factory_worker.py --loop"

echo [3/3] Menyalakan Web Dashboard di http://localhost:3000...
echo.
echo Jendela browser akan terbuka otomatis dalam beberapa detik.
echo JANGAN TUTUP jendela terminal ini agar server dashboard tetap menyala!
echo ===============================================================================

:: Buka browser secara otomatis setelah jeda 4 detik agar Next.js siap
start /b "" cmd /c "timeout /t 4 /nobreak >nul && start http://localhost:3000"

:: Jalankan server Next.js
call npm run dev

echo.
echo Server terhenti.
pause
