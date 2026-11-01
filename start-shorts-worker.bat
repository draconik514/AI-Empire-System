@echo off
title AI Empire - Shorts Factory Worker (Divisi 3)
color 0b
echo ============================================================
echo   AI EMPIRE SYSTEM - SHORTS FACTORY LOCAL WORKER
echo   Render Video YouTube Shorts Otomatis (Rp 0 Cloud GPU)
echo ============================================================
echo.
echo Laptop: MSI Modern 14 (Intel Iris Xe)
echo Mode: Standby Polling ke Supabase (Setiap 15 Detik)
echo.
cd /d "d:\AI-Empire-System\ai-empire-dashboard\local-agent-bridge"
python shorts_factory_worker.py --loop
pause
