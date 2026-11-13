# TEDUH LAPAK

Web interaktif untuk menjelajahi pola panas Jakarta dan mencatat kebutuhan perlindungan di Loksem Pulo Gadung.

## Membuka web

Alamat lokal: **http://127.0.0.1:3000**. Web dapat dibuka selama server berjalan.

Untuk menjalankan kembali, buka `MULAI_TEDUH_LAPAK.cmd`, atau jalankan:

```powershell
npm install
npm run build
npm run start
```

Untuk mengedit dengan pembaruan langsung: `npm run dev`. Hentikan server sebelumnya dengan `Ctrl+C` sebelum memakai port yang sama.

## Fitur

- Beranda dengan ilustrasi vektor, animasi ringan, grafik suhu per jam, dan alur solusi.
- Peta lokal MapLibre: suhu permukaan, NDVI, empat kelompok median, K-Means, serta LISA setelah BH-FDR.
- Pencarian kelurahan, filter calon wilayah peninjauan, zoom, pemilihan area, dan detail nilai.
- Sepuluh kartu Loksem: alamat, jadwal, jumlah pedagang, dan kondisi fasilitas terbaru.
- Pemeriksaan peneduh, air minum, tempat jeda, nama pencatat, catatan, serta foto opsional.
- Laporan kebutuhan dengan status baru, diproses, dan selesai.
- Evaluasi cakupan pemeriksaan dan kesiapan fasilitas, serta ekspor CSV.
- Penyusunan pesan operasional untuk disalin secara manual. Tidak mengirim pesan otomatis.
- Desain responsif, navigasi keyboard, dialog dengan pengelolaan fokus, dan pengurangan animasi mengikuti pengaturan perangkat.

## Teknologi

Next.js App Router, React, TypeScript, CSS khusus, Motion, MapLibre GL JS, Recharts, Lucide, dan validasi Zod. Font Bricolage Grotesque dan DM Sans disimpan lokal beserta lisensi OFL.

Versi ini memakai penyimpanan JSON di server lokal, sehingga dapat dijalankan tanpa akun atau kredensial layanan eksternal. Belum menggunakan Supabase atau autentikasi multi-pengguna. Server terikat ke `127.0.0.1`, untuk penggunaan di komputer ini.

## Data dan batas interpretasi

- Sumber lokal: `../Visualisasi_Infografis_Final/`, dibaca dan disalin tanpa mengubah berkas sumber.
- 261 kelurahan daratan, komposit Landsat Agustus–September 2026 dengan cakupan valid minimal 70%.
- Empat kategori panas–vegetasi menggunakan median. Sebanyak 89 calon wilayah peninjauan; ini berbeda dari hasil K-Means dan LISA serta bukan klasifikasi bahaya kesehatan.
- K-Means k=3 mengikuti hasil sumber terbaru: 150, 84, dan 27 kelurahan. Indikator: LST, NDVI, log kepadatan WNI, dan proporsi WNI usia 65+ (2025). K=3 dipilih untuk rincian profil, bukan optimum silhouette. Jumlah dan label pada web dibaca dari data.
- LISA: bobot Queen, p dua sisi, BH-FDR 5%. Sebanyak 29 kelurahan High-High.
- Jadwal 10 Loksem dan 436 pedagang berasal dari daftar administratif 2023; tidak membuktikan kehadiran individu.
- Posisi penanda Loksem mewakili titik dalam kelurahan. Koordinat lapak tidak tersedia dan tidak direkayasa.
- Profil jam: NASA POWER, grid sekitar Monas, Juli–Oktober 2026. Tidak ada informasi cuaca langsung atau integrasi peringatan BMKG.
- Suhu permukaan bukan suhu udara dan bukan pengukuran paparan pedagang.
- Kondisi fasilitas dimulai dengan status belum diperiksa. Tidak ada data fasilitas contoh yang diklaim sebagai temuan lapangan.
- Efek perlindungan belum diukur; tidak ada klaim penurunan suhu atau dampak kesehatan tertentu.

Data operasional disimpan di `.data/operations.json`; foto di `.data/photos/`. Cadangkan seluruh folder `.data` untuk mempertahankan catatan. Folder ini tidak masuk Git. Jangan memuat data sensitif saat berbagi demonstrasi.

## Pemeriksaan

```powershell
npm run check
npm run build
node scripts/verify.mjs
```

Jalankan pemeriksaan API ketika web sedang berjalan. Hasilnya tersimpan di `verification/api-check.json`. Alur pemeriksaan, muat ulang, laporan, pembaruan status, ekspor, dan tata letak ponsel juga diperiksa melalui browser.

`scripts/prepare_data.py` meregenerasi data web dari hasil analisis sumber; membutuhkan Shapely dan PyProj (tersedia pada `.venv_eda` di folder induk). Ekspor menghormati deklarasi CRS GeoJSON EPSG:32648 dengan northing negatif, kemudian memvalidasi koordinat hasil di wilayah Jakarta. Atribut `srs_id` pada berkas sumber tidak dipakai karena tidak konsisten dengan koordinat.
