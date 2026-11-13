@echo off
cd /d "%~dp0"
if not exist node_modules (
  call npm.cmd ci
  if errorlevel 1 goto gagal
)
if not exist .next\BUILD_ID (
  call npm.cmd run build
  if errorlevel 1 goto gagal
)
echo.
echo TEDUH LAPAK dapat dibuka di http://127.0.0.1:3000
echo Biarkan jendela ini terbuka selama menggunakan web.
echo Tekan Ctrl+C untuk menghentikan server.
echo.
call npm.cmd run start
goto selesai
:gagal
echo Web belum dapat dijalankan. Periksa pesan di atas.
pause
:selesai
