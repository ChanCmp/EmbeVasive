# Ringkasan Project — Automatic Pet Feeder dengan Monitoring Nafsu Makan

> Dokumen ini merangkum seluruh keputusan desain, kode, dan diskusi dari sesi sebelumnya.
> Upload file ini di awal chat baru supaya Claude punya konteks penuh tanpa perlu mengulang dari awal.

## 1. Latar Belakang & Problem Statement

Kelompok: Chandra Firdaus, Marchel Raikonnen, Muhammad Syafa Adha, Handri Suhandi
Mata kuliah: CE631 Embedded System Design

**Masalah**: Kasus nyata teman & kakaknya — bekerja 07:00–18:00, memelihara kucing dengan gangguan pencernaan. Dokter hewan menyarankan porsi kecil terjadwal (bukan bulk feeding), sambil dipantau nafsu makannya. Karena rumah kosong seharian, pemberian makan manual jadi satu-satunya opsi — tidak sesuai anjuran dokter dan tidak menghasilkan data nafsu makan.

**Solusi**: Automatic pet feeder dengan porsi **tetap** (bukan adaptif) di setiap sesi + monitoring sisa makanan sebagai sinyal kesehatan murni (bukan untuk menyesuaikan porsi berikutnya), supaya baseline deteksi anomali tidak terganggu oleh perubahan porsi sendiri.

**Target user**: Pemilik kucing bekerja penuh waktu, tidak selalu di rumah.

**Constraint penting yang sudah diidentifikasi**:
- Porsi dispense tetap (disengaja) → sistem tidak mengurangi pemborosan makanan, murni untuk monitoring
- Threshold severity (mild/moderate/severe) belum final angkanya — perlu ditentukan
- Belum ada penyimpanan lokal permanen untuk baseline di ESP32 (risiko hilang saat reboot) → **sudah diputuskan: baseline dihitung on-the-fly dari tabel `feedings` di backend**, bukan disimpan terpisah
- Tidak ada baterai cadangan — mati listrik saat rumah kosong = jadwal makan bisa terlewat total
- Load cell + HX711 presisi ±1–5gr
- Belum ada data daya tahan servo jangka panjang
- Hanya untuk dry food, 1 device = 1 kucing (load cell tunggal tidak bisa bedakan multi-pet)
- Kucing bisa mengganggu pembacaan sensor secara fisik (belum ada filter noise untuk ini)

## 2. Komponen Hardware (Final)

| Komponen | Fungsi | Spesifikasi kunci |
|---|---|---|
| **ESP32** | Microcontroller utama, WiFi bawaan, jalankan semua logika | GPIO cukup, WiFi built-in, didukung Arduino IDE |
| **Load cell 1kg + HX711** | Ukur berat makanan di bowl | Load cell: 1kg, sensitivitas 1.0mV/V, IP65. HX711: ADC 24-bit, operasi 2.6–5.5V |
| **Servo MG996R** | Aktuator buka mekanisme dispenser/auger | Torsi 9.4–11 kg·cm, 4.8–7.2V, PWM, arus ~500–900mA (puncak bisa 1–2A) |
| **DS3231 RTC** | Jaga waktu akurat untuk scheduling walau WiFi putus | Akurasi ±2ppm, baterai cadangan, I2C |
| **HLK-10M05** | AC-DC converter, 220V → 5V DC untuk seluruh sistem | Output 5V/2A (2000mA) |
| **Sensor Ultrasonic (HC-SR04)** | Ukur level stok makanan di hopper | Jangkauan 2–400cm, akurasi ±3mm, operasi 5V |

### Alokasi pin GPIO (contoh, sesuaikan dengan board spesifik)
| Komponen | Pin | Catatan |
|---|---|---|
| Servo (PWM) | GPIO 13 | Power dari rail 5V |
| HX711 DT | GPIO 16 | **VCC dari 3.3V ESP32** (bukan 5V, supaya logic level aman) |
| HX711 SCK | GPIO 17 | VCC dari 3.3V ESP32 |
| RTC SDA | GPIO 21 | VCC dari 3.3V ESP32 |
| RTC SCL | GPIO 22 | VCC dari 3.3V ESP32 |
| Ultrasonic TRIG | GPIO 5 | Power dari rail 5V |
| Ultrasonic ECHO | GPIO 18 | **Wajib voltage divider** (1kΩ+2kΩ) karena ECHO output 5V, GPIO ESP32 max 3.3V |

### Catatan desain hardware penting
- **Tidak perlu relay** untuk servo — servo dikontrol via sinyal PWM, bukan on/off power switching. Relay salah tempat; kalaupun pakai relay tetap butuh pin PWM terpisah.
- **Risiko brownout**: HLK-10M05 (2A) bisa kewalahan kalau ESP32 (WiFi TX ~300-500mA) + servo (stall ~1-2A) narik bersamaan → pasang **kapasitor buffer ~1000-2200µF** dekat kaki power servo.
- **Risiko noise ke HX711**: HLK-10M05 adalah switching converter, bisa menghasilkan ripple/noise yang mengganggu pembacaan load cell presisi tinggi. Mitigasi: kapasitor kecil (100nF+10µF) dekat VCC HX711, hindari satu titik ground persis dengan servo.
- **Wiring AC ke HLK-10M05**: solder kabel Live/Neutral ke pin L/N modul, isolasi tiap sambungan pakai heat shrink, tambahkan fuse inline (250V 0.5A fast-blow) di jalur Live, taruh seluruh modul dalam enclosure tertutup, tes tegangan output dengan multimeter sebelum sambung ke ESP32. **Alternatif lebih aman**: pakai adaptor charger 5V/2A siap pakai (sudah bersertifikasi), potong ujung DC-nya saja.

## 3. Cara Kerja Sistem (High-Level)

Siklus terjadwal harian (misal 08:00 & 17:00): ESP32 aktifkan servo → buka dispenser → makanan jatuh ke bowl dengan porsi **tetap**. Sebelum sesi berikutnya, load cell baca sisa makanan, dibandingkan dengan baseline (rata-rata beberapa sesi sebelumnya). Jika sisa meningkat signifikan & konsisten dari baseline → klasifikasi severity (mild/watch, moderate/notify, severe/urgent) → notifikasi ke pemilik via WiFi/app.

## 4. Software Modules (Embedded — ESP32)

| Module | Fungsi | Interface |
|---|---|---|
| `init_wifi` | Connect ke WiFi | In: ssid, password → Return: bool |
| `wifi_connect` / `start_ap_mode_provisioning` | Handle koneksi WiFi, retry, AP-mode untuk setup kredensial baru | Return: status |
| `init_rtc` / `get_rtc_time` | Baca waktu dari DS3231 | Return: struct {hour, minute, second, date} |
| `read_load_cell` | Baca HX711, convert ke gram | Return: float (gram) |
| `control_servo_dispense` | Gerakkan servo, buka auger, dispense porsi tetap | Return: status (success/fail) |
| `check_feeding_schedule` | Bandingkan waktu RTC dengan jadwal | In: current_time, schedule_list → Return: bool |
| `log_feeding_event` | Simpan hasil sesi ke buffer lokal | In: timestamp, weight_before, weight_after → Return: none |
| `read_hopper_level` | Baca ultrasonic, convert ke persentase stok | Return: int (0-100%) |
| `check_stock_level` | Bandingkan level stok dengan threshold | In: level_percent, threshold → Return: bool is_low_stock |
| `log_stock_alert` | Simpan status stok rendah ke buffer | In: timestamp, level_percent → Return: none |
| `sync_to_backend` | Kirim buffer ke Supabase via HTTPS + API key | Return: status (synced/failed) |
| `buffer_manager` | Simpan data saat offline, hapus yang sudah sync | In: data to store/clear → Return: none |

### Pseudocode Main Program

```
INIT:
  init_load_cell()
  init_rtc()
  wifi_status = wifi_connect()
  IF wifi_status == failed:
      start_ap_mode_provisioning()

LOOP:
  current_time = get_rtc_time()
  IF wifi_status == disconnected:
      wifi_status = wifi_reconnect()

  IF check_feeding_schedule(current_time, schedule) == true:
      weight_before = read_load_cell()
      dispense_status = control_servo_dispense()
      wait(monitoring_delay) // misal 30 menit, biar cat sempat makan
      weight_after = read_load_cell()
      log_feeding_event(current_time, weight_before, weight_after)

  hopper_level = read_hopper_level()
  IF check_stock_level(hopper_level, STOCK_THRESHOLD) == true:
      log_stock_alert(current_time, hopper_level)

  IF buffer_manager has unsynced data:
      IF wifi_status == connected:
          sync_status = sync_to_backend()
          IF sync_status == synced:
              clear_synced_data()

  sleep(polling_interval) // misal 1 menit
END LOOP
```

**Keputusan terbuka**: apakah `sync_to_backend()` generic untuk semua jenis data (feeding event + stock alert, dibedakan field `type` di JSON), atau dipisah jadi 2 fungsi? Dan apakah logic klasifikasi severity dihitung di ESP32 atau di backend (Supabase edge function)?

## 5. Arsitektur Pervasive (Web + Backend)

```
Embedded (ESP32) --MQTT--> MQTT Broker (Mosquitto) --subscribe--> Backend (Node.js/Express)
                                                                        |
                                                                        v
                                                                   PostgreSQL/Supabase
                                                                        |
                                                                        v (WebSocket)
                                                                   Web Dashboard (browser)
```

- **Broker**: Mosquitto (disarankan untuk tugas kuliah, simple & banyak tutorial)
- **Struktur topic MQTT**:
  ```
  petfeeder/{device_id}/bowl_weight       <- device publish
  petfeeder/{device_id}/hopper_level      <- device publish
  petfeeder/{device_id}/status            <- device publish (pakai Last Will Testament)
  petfeeder/{device_id}/feeding_event     <- device publish
  petfeeder/{device_id}/command/feed      -> backend publish (trigger manual)
  petfeeder/{device_id}/command/schedule  -> backend publish (update jadwal)
  ```
- **Browser tidak bisa MQTT langsung** → backend jadi jembatan: subscribe MQTT, lalu broadcast ke web client via **WebSocket**.
- **Database**: PostgreSQL (awalnya direncanakan self-host, lalu project berkembang ke **Supabase** sesuai laporan resmi kelompok).

## 6. Database Design (Final, dari laporan resmi kelompok)

### Tables

**users**: id (uuid, PK), email (text, NOT NULL UNIQUE)

**devices**: id (PK), user_id (FK), name, api_key_hash, paired_at, last_seen_at, bowl_weight_g (nullable, CHECK >=0), bowl_read_at, hopper_capacity_g (NOT NULL, CHECK >0), hopper_refilled_at

**pets**: id (PK), device_id (FK), name, watch_pct (default 15), moderate_pct (default 30), urgent_pct (default 50), moderate_session (default 2)

**feeding_schedule**: id (PK), device_id (FK), feed_time, portion_g (CHECK >0), is_active (default true)

**feedings**: id (PK), device_id (FK), pet_id (FK), schedule_id (FK, nullable, ON DELETE SET NULL — untuk feed manual), scheduled_at, dispensed_g (CHECK >=0), leftover_g (nullable, CHECK >=0), status (default 'normal', CHECK IN normal/watch/moderate/urgent), synced_at (default now())

### Kelebihan desain ini (dibanding draft awal Claude)
- `api_key_hash` (bukan plaintext) — lebih aman
- Threshold severity eksplisit per-pet di tabel `pets` (bukan hardcode global) — langsung jawab constraint "threshold belum konkret"
- `schedule_id` nullable + `ON DELETE SET NULL` di `feedings` — elegant handle untuk feed manual
- Baseline dihitung on-the-fly dari `feedings`, tidak perlu tabel `consumption_baselines` terpisah — lebih simpel, tidak ada risiko data basi

### Isu yang masih perlu diputuskan
1. **Sensor ultrasonic tidak pernah dipakai datanya** — `hopper_capacity_g` dihitung murni aritmatika (capacity − total dispensed sejak refill), bukan dari pembacaan sensor asli. Saran: tambah `hopper_level_pct` + `hopper_read_at` di `devices` sebagai ground truth/kalibrasi ulang.
2. **Tidak ada riwayat historis berat bowl** — `bowl_weight_g` cuma simpan pembacaan terakhir, bukan time-series. Perlu diputuskan: apakah fitur grafik tren berat bowl 24 jam masih dipakai?
3. **`pets.device_id` belum `UNIQUE`** — sistem didesain 1 device = 1 pet, tapi constraint DB belum enforce itu.
4. **Konsistensi penamaan**: `feeding_schedule` (singular) vs `feedings` (plural) — sebaiknya konsisten.
5. **Fitur "tandai notifikasi dibaca"** — belum ada kolom/tabel untuk ini kalau mau dipakai di dashboard.

## 7. Desain Web Dashboard

**Stack**: Frontend HTML/CSS/JS vanilla (bukan framework, "lebih gampang"), backend Node.js + Express + MQTT client + WebSocket + PostgreSQL.

**Style final** (setelah beberapa iterasi referensi visual):
- Font: `Plus Jakarta Sans` (Google Fonts) — alternatif terdekat dari referensi desain bold-rounded
- Warna aksen utama: **cyan** `#1ec8e6` (dari referensi convodesign101.xyz)
- Background: biru sangat muda `#f5fcfd`
- Border radius besar (24px), shadow lembut — ala kartu "speech bubble"
- Struktur komponen: hero card (gradient cyan→teal, ada tombol "Beri makan sekarang"), 3 stat pill berwarna (berat bowl, rata-rata 24 jam, stok makanan), tabs (Ringkasan/Jadwal/Notifikasi), block chart, table jadwal, list notifikasi
- Semua token warna/radius/spacing terpusat di `:root` CSS variables untuk gampang diedit

**Fitur aplikasi yang sudah di-list**:
- Monitoring real-time (berat bowl, grafik tren, level stok hopper)
- Deteksi nafsu makan rendah dengan alert bertingkat (ringan/sedang/parah)
- Korelasi nafsu makan dengan cuaca (BMKG) — ide awal project, belum diimplementasi di versi Supabase/laporan terbaru
- Scheduling + tombol feed manual ("feed now")
- Notifikasi (nafsu makan rendah, stok rendah, device offline)
- Profil pet dengan threshold custom per pet
- Mode offline: feeder tetap jalan sesuai jadwal terakhir walau koneksi terputus

## 8. File yang Sudah Dibuat (sesi sebelumnya)

1. **`pet-feeder.zip`** — project lengkap: backend (Express + MQTT + WebSocket + PostgreSQL, routes untuk pets/feeding/schedules/alerts/weather, schema.sql) + frontend (index.html, style.css, app.js, petFeederClient.js sebagai modul fungsi tombol terpisah dari desain)
2. **`petFeederClient.js`** — modul JS standalone berisi semua fungsi API (feedNow, getSchedules, addSchedule, toggleSchedule, getAlerts, markAlertRead, connectRealtime, dll) untuk dipasang ke desain custom apapun
3. **`pet-feeder-preview.html`** — versi self-contained dengan data mock untuk preview visual (sudah di-publish sebagai artifact, bisa diakses tanpa backend)
4. **`CE631L_Lab4_Detailing_Software.pdf`** — jawaban tugas Lab 4 (detailing software modules + pseudocode + main program outline)
5. **Diagram/ERD** yang sudah ditampilkan: arsitektur pervasive, arsitektur MQTT+PostgreSQL+Web, ERD database (mermaid), skematik wiring power (HLK→ESP32+servo), skematik wiring sinyal (ESP32→servo/HX711/RTC/ultrasonic dengan pin GPIO)

## 9. Pertanyaan/Keputusan Terbuka untuk Dilanjutkan

- [ ] Angka pasti threshold mild/moderate/severe (saat ini baru default 15%/30%/50% di laporan resmi)
- [ ] Apakah grafik tren berat bowl 24 jam masih jadi fitur, atau di-drop sesuai desain DB resmi yang cuma simpan snapshot terakhir?
- [ ] Logic severity classification: dihitung di ESP32 atau di backend/Supabase edge function?
- [ ] Data cuaca BMKG — masih masuk scope atau sudah di-deprioritize demi fokus ke monitoring nafsu makan?
- [ ] Finalisasi skema database: tambah `UNIQUE(device_id)` di pets, pertimbangkan `hopper_level_pct` dari sensor asli, konsistensi penamaan tabel
- [ ] Implementasi penuh parsing response BMKG (kalau masih dipakai) dan autentikasi user di backend (saat ini endpoint masih terbuka)
