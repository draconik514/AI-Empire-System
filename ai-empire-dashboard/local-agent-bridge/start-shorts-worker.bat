@echo off
chcp 65001 >nul
title AI Empire - Shorts Video Factory Worker (Z-Code & 3D Edukasi)
echo ===========================================================================
echo   PABRIK OTOMATIS VIDEO SHORTS (ISLAMIC Z-CODE + EDUKASI 5-SCENE)
echo   Status: Standby memantau antrean Web Dashboard / Supabase setiap 10 detik...
echo ===========================================================================
python "%~dp0shorts_factory_worker.py" --loop
pause
