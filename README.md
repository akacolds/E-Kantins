# E-Kantin Sekolah (Android)

Aplikasi Android modern untuk E-Kantin Sekolah yang dibangun dengan **Kotlin** dan **Jetpack Compose** (Material Design 3). Memungkinkan siswa memesan makanan dan minuman tanpa antre panjang di jam istirahat sekolah, serta memungkinkan pemilik stand kantin mengelola pesanan, stok menu, dan berkomunikasi langsung melalui chat realtime.

## Fitur Utama

- **Autentikasi Multi-Peran**:
  - **🎓 Murid**: Masuk menggunakan Nama Lengkap, Kelas, dan Kode Unik (4 digit). Dilengkapi pintasan demo 1-klik.
  - **🏪 Penjual Kantin**: Masuk memilih Stand Kantin (Kantin 1 - Makanan Berat, Kantin 2 - Minuman & Snaking, Kantin 3 - Aneka Jajan) dengan proteksi password.
- **Katalog Menu Interaktif**:
  - Pencarian menu makanan/minuman realtime.
  - Filter Stand Kantin & Kategori (Makanan, Minuman, Camilan).
  - Informasi harga Rupiah, deskripsi, foto makanan, dan status ketersediaan stok.
- **Pemesanan Mudah**:
  - Pilihan varian menu (contoh: Level Kepedasan, Takaran Es, Rasa).
  - Pemilihan jumlah porsi dengan pembatasan otomatis sesuai sisa stok.
  - Catatan khusus untuk penjual kantin.
- **Status & Riwayat Pesanan**:
  - Pelacakan status berjenjang: *Menunggu*, *Sedang Dimasak*, dan *Siap Diambil*.
- **💬 Obrolan Realtime Terintegrasi**:
  - Fitur chat interaktif pada setiap pesanan antara murid dan penjual kantin untuk koordinasi langsung.
- **Panel Pengelola Kantin**:
  - Pemantauan pesanan masuk dengan badge counter.
  - Pembaruan status pesanan (Dimasak & Siap Diambil).
  - Pengelolaan stok menu dengan kontrol stepper.
  - Penambahan menu baru lengkap dengan varian dan harga.
  - Riwayat pesanan selesai.
- **Penyimpanan Lokal**:
  - Data pesanan, stok, obrolan, dan akun tersimpan secara lokal dan reaktif menggunakan Kotlin Coroutines & Flow.

## Teknologi

- **Bahasa**: Kotlin
- **UI Framework**: Jetpack Compose & Material 3
- **Arsitektur**: MVVM (Model-View-ViewModel) + Repository Pattern
- **Reactive Stream**: StateFlow & Kotlin Coroutines
- **Image Loading**: Coil Compose
- **Target SDK**: Android 36 (Min SDK 24)
