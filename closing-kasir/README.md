# Closing Kasir

Aplikasi web sederhana untuk closing harian.

## Fitur
- Input penjualan tunai dan QRIS/Transfer
- Otomatis menghitung omzet
- Input pajak yang sudah diambil dari kas
- Pengeluaran dinamis (keterangan + nominal)
- Saldo awal / uang lama
- Cash di luar laci, uang di laci, dan uang lain yang belum dihitung
- Otomatis menghitung cash seharusnya, cash aktual, dan selisih
- Riwayat closing per tanggal
- Edit/hapus closing
- Export riwayat ke CSV
- Responsif untuk HP

## Rumus utama
Omzet = Tunai + QRIS/Transfer

Total Pengeluaran = jumlah seluruh pengeluaran

Cash Seharusnya = Saldo Awal + Tunai - Total Pengeluaran - Pajak

Cash Aktual = Cash Luar Laci + Uang di Laci + Uang Lain yang Belum Dihitung

Selisih = Cash Aktual - Cash Seharusnya

## Cara deploy
Aplikasi ini adalah static site, jadi tidak membutuhkan server/database untuk versi dasar.

### Netlify
1. Buka Netlify dan buat site baru.
2. Upload folder proyek ini (atau ZIP).
3. Deploy.

### Vercel
1. Upload project ke GitHub.
2. Import repository tersebut ke Vercel.
3. Framework: Other / static.
4. Deploy.

### GitHub Pages
1. Upload `index.html`, `styles.css`, dan `app.js` ke repository.
2. Aktifkan Pages dari branch utama.

## Catatan penting tentang data
Versi ini menyimpan riwayat memakai `localStorage`, sehingga riwayat hanya tersedia di browser/perangkat yang digunakan.

Jika ingin dipakai oleh beberapa kasir/perangkat dan semua riwayat tersimpan online, versi berikutnya sebaiknya memakai database seperti Supabase/Firebase.
