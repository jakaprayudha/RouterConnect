# Panduan Instalasi RouterConnect di Server

Panduan ini menjelaskan cara memasang RouterConnect (billing ISP + FreeRADIUS) di server Linux dari awal sampai bisa login ke panel admin.

> **Catatan penamaan:** script installer di `frontend/vps-install/` masih memakai nama lama **salfanet**
> untuk folder aplikasi, database, dan proses PM2. Semua nama di panduan ini sengaja ditulis sesuai
> perilaku script saat ini (misalnya `/var/www/salfanet-radius`, `salfanet-backend`), bukan nama di README.

---

## 1. Kebutuhan Server

| Komponen | Rekomendasi |
|----------|-------------|
| OS | Ubuntu Server 22.04 / 24.04 LTS (berbasis `apt`; Debian juga bisa) |
| CPU | 2 vCPU |
| RAM | Minimal 2 GB (4 GB disarankan; build Next.js memakai heap sekitar 1,5 GB) |
| Disk | Minimal 20 GB (tambah sekitar 2 GB jika ingin build APK Android) |
| Akses | User `root` atau user dengan `sudo` |
| Jaringan | IP publik (VPS) atau IP LAN (Proxmox LXC/VM, server fisik) |
| Domain (opsional) | DNS A record sudah diarahkan ke IP server jika ingin SSL Let's Encrypt |

Semua komponen di bawah ini **dipasang otomatis** oleh installer:

- Node.js 22 (NodeSource) + pnpm (via corepack)
- MySQL 8
- Redis (cache)
- FreeRADIUS 3
- Nginx + Certbot
- PM2
- fail2ban + UFW

### Port yang Dipakai

| Port | Protokol | Fungsi |
|------|----------|--------|
| 22 | TCP | SSH |
| 80 / 443 | TCP | Web (HTTP/HTTPS) |
| 8080 | TCP | HTTP alternatif (Nginx) |
| 1812 | UDP | RADIUS Authentication |
| 1813 | UDP | RADIUS Accounting |
| 3799 | UDP | RADIUS CoA / Disconnect |
| 1701, 500, 4500 | UDP | L2TP/IPsec (hanya jika VPN L2TP dipasang) |

Port internal (jangan dibuka ke publik): `3000` frontend, `3001` backend, `4000` WhatsApp service, `3306` MySQL, `6379` Redis.

---

## 2. Persiapan Khusus Proxmox LXC (lewati jika VPS/VM biasa)

Jalankan di **host Proxmox** (ganti `100` dengan ID container):

```bash
pct set 100 --features nesting=1,tun=1
```

Atau tambahkan manual di `/etc/pve/lxc/100.conf`:

```
lxc.cgroup2.devices.allow: c 108:0 rwm
lxc.cgroup2.devices.allow: c 10:200 rwm
lxc.mount.entry: /dev/net dev/net none bind,create=dir
```

Di LXC, UFW dilewati oleh installer. Buka port pada tabel di atas lewat **Proxmox Firewall**.

---

## 3. Ambil Source Code ke Server

### Opsi A — Git clone (disarankan)

```bash
ssh root@IP_SERVER

apt-get update && apt-get install -y git
git clone https://github.com/jakaprayudha/RouterConnect.git /root/RouterConnect
cd /root/RouterConnect
```

### Opsi B — Upload manual (jika server tidak bisa akses GitHub)

Jalankan di komputer **lokal**:

```bash
scp -r ./RouterConnect root@IP_SERVER:/root/RouterConnect
```

Lalu login ke server:

```bash
ssh root@IP_SERVER
cd /root/RouterConnect
```

> Folder hasil clone hanya dipakai sebagai sumber. Installer akan **menyalin** isinya ke
> `/var/www/salfanet-radius`, dan aplikasi berjalan dari sana.

---

## 4. Jalankan Installer

```bash
cd /root/RouterConnect
bash frontend/vps-install/vps-installer.sh
```

Installer bersifat interaktif dan akan menanyakan:

1. **Environment**: `1` Public VPS, `2` Proxmox LXC, `3` Proxmox VM/VirtualBox, `4` Bare Metal. Pilihan default diambil dari deteksi otomatis.
2. **IP server**: tekan Enter untuk memakai IP yang terdeteksi, atau ketik IP lain.
3. **Domain & email SSL** (hanya mode VPS): isi domain untuk SSL Let's Encrypt otomatis, atau kosongkan untuk akses via IP.
4. **Konfirmasi**: ringkasan instalasi ditampilkan, lalu jawab `Y` untuk mulai.

> Beberapa pertanyaan memakai batas waktu (15–30 detik). Jika tidak dijawab, installer memakai nilai default.

### Mode non-interaktif / paksa environment

```bash
bash frontend/vps-install/vps-installer.sh --env vps
bash frontend/vps-install/vps-installer.sh --env lxc --ip 192.168.1.50
```

Nilai `--env` yang valid: `vps`, `lxc`, `vm`, `bare`.

### Mengganti nilai default (opsional, sangat disarankan untuk produksi)

Password database default lemah. Ganti lewat environment variable sebelum menjalankan installer:

```bash
export DB_PASSWORD='PasswordDbYangKuat'
export DB_ROOT_PASSWORD='PasswordRootMysqlYangKuat'
bash frontend/vps-install/vps-installer.sh
```

Variabel lain yang bisa diganti: `DB_NAME`, `DB_USER`, `APP_DIR`, `SYSTEM_TIMEZONE` (default `Asia/Jakarta`), `NODE_VERSION` (default `22`).

### Tahapan yang dijalankan installer

| Step | Script | Yang dilakukan |
|------|--------|----------------|
| 1 | `install-system.sh` | Update OS, paket dasar, PPP/TUN, timezone, swap |
| 2 | `install-nodejs.sh` | Node.js 22 |
| 3 | `install-mysql.sh` | MySQL 8, buat database & user |
| 4 | `install-app.sh` | Salin kode, buat `.env`, `pnpm install`, Prisma `db push`, seed data, VAPID key |
| 4b | `install-redis.sh` | Redis |
| 5 | `install-freeradius.sh` | FreeRADIUS + modul SQL/REST |
| 6 | `install-nginx.sh` | Nginx reverse proxy (+ SSL jika domain diisi) |
| 7 | `install-pm2.sh` | Build frontend & backend, jalankan PM2 |
| 8 | `install-security.sh` | fail2ban, UFW, cron cleanup |
| 9 | `fix-auth-after-update.sh` | Memastikan akun SUPER_ADMIN aktif tersedia |

Total waktu sekitar 20–40 menit, tergantung spesifikasi server dan koneksi internet.
Log lengkap tersimpan di `/var/log/salfanet-vps-install.log`.

---

## 5. Setelah Instalasi Selesai

### Login pertama

| | |
|--|--|
| URL Admin | `http://IP_SERVER/admin/login` (atau `https://DOMAIN/admin/login`) |
| Username | `superadmin` |
| Password | `admin123` |

⚠️ **Segera ganti password admin setelah login pertama.**

Ringkasan hasil instalasi (IP, kredensial database, secret) tersimpan di:

```
/var/www/salfanet-radius/INSTALLATION_INFO.txt
```

File ini berisi data sensitif. Simpan isinya di tempat aman, lalu batasi aksesnya (`chmod 600`).

### Verifikasi layanan

```bash
pm2 status                                   # harus ada 4 proses: online
curl -I http://127.0.0.1:3000                # frontend
curl http://127.0.0.1:3001/api/health        # backend health check
systemctl status nginx freeradius mysql redis-server --no-pager
redis-cli ping                               # harus PONG
```

Proses PM2 yang berjalan:

| Proses | Port | Fungsi |
|--------|------|--------|
| `salfanet-frontend` | 3000 | UI Next.js + NextAuth |
| `salfanet-backend` | 3001 | API Next.js + Prisma |
| `salfanet-cron` | — | Penjadwal job otomatis (invoice, isolir, sync) |
| `salfanet-wa` | 4000 (internal) | WhatsApp Baileys |

---

## 6. Konfigurasi Lanjutan

### File `.env`

Satu file `.env` berada di `/var/www/salfanet-radius/.env` dan di-symlink ke `backend/.env` dan `frontend/.env`.
Installer sudah mengisi `DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, dan VAPID key. Periksa juga nilai berikut:

| Variabel | Keterangan |
|----------|------------|
| `RADIUS_SERVER_IP` | IP server yang dipakai saat generate script RADIUS untuk MikroTik |
| `RADIUS_COA_SECRET` | Harus sama dengan secret RADIUS di MikroTik/NAS |
| `CRON_SECRET` | Autentikasi cron-runner ke backend (`openssl rand -hex 32`) |
| `ENCRYPTION_KEY` | Enkripsi password GenieACS/VPN di database (`openssl rand -hex 16`) |
| `REDIS_URL` | Default `redis://127.0.0.1:6379` |

Referensi lengkap variabel ada di [backend/.env.example](backend/.env.example). Setelah mengubah `.env`, restart semua proses:

```bash
cd /var/www/salfanet-radius
pm2 restart all --update-env
```

### Menghubungkan MikroTik ke RADIUS

1. Login admin → **Router/NAS** → tambahkan router.
2. Klik **Setup RADIUS** untuk menghasilkan script RouterOS.
3. Tempel script tersebut di terminal MikroTik.
4. Pastikan UDP 1812, 1813, dan 3799 dari MikroTik bisa mencapai server.

Uji autentikasi dari server:

```bash
radtest 'user@realm' password 127.0.0.1 0 testing123
freeradius -XC        # cek konfigurasi FreeRADIUS
```

### Komponen opsional

```bash
cd /var/www/salfanet-radius/frontend/vps-install

bash install-wg-server.sh       # WireGuard server (VPN ke MikroTik)
bash install-l2tp-server.sh     # L2TP/IPsec server (RouterOS 6)
bash install-vpn-client.sh      # VPN client tools (SSTP)
bash install-apk.sh             # Build APK Android (butuh JDK 17 + Android SDK)
bash install-redis.sh           # Jika Redis gagal/terlewat saat instalasi
```

### WhatsApp (Baileys)

Admin → **Pengaturan → WhatsApp → Penyedia** → **+ Tambah Provider** → pilih **Baileys** → scan QR dari HP.
Sesi tersimpan di `/var/data/salfanet/baileys_auth/`.

---

## 7. Update ke Versi Terbaru

Cara yang disarankan. Data upload (logo, foto KTP, bukti bayar) dan `.env` tetap aman.

```bash
bash /var/www/salfanet-radius/frontend/vps-install/updater.sh
```

Opsi tambahan:

```bash
bash updater.sh --branch main          # update dari branch git
bash updater.sh --version v5.22.0      # update ke versi tertentu
bash updater.sh --skip-backup          # tanpa backup (tidak disarankan di produksi)
```

Backup otomatis sebelum update disimpan di `/root/salfanet-backups/`.

> Sebelum update besar, tetap buat backup database manual (lihat bagian 8).

---

## 8. Backup Database

```bash
mysqldump -u salfanet_user -p salfanet_radius > backup-$(date +%F).sql
```

Restore:

```bash
mysql -u salfanet_user -p salfanet_radius < backup-YYYY-MM-DD.sql
```

Juga backup folder upload: `/var/www/salfanet-radius/public/uploads/`.

---

## 9. Troubleshooting

| Masalah | Langkah |
|---------|---------|
| Web tidak bisa diakses dari luar | Cek `ss -tulpn \| grep -E ':80\|:443'`. Jika `curl -I http://127.0.0.1` dari server berhasil, masalahnya ada di firewall cloud/NAT/port-forward, bukan di aplikasi. |
| Halaman blank / error 502 | `pm2 logs salfanet-frontend --lines 100` dan `pm2 logs salfanet-backend --lines 100` |
| API 404 | Pastikan Nginx mengarahkan `/api/auth/*` ke port 3000 dan `/api/*` ke port 3001: `nginx -T \| grep -A2 'location.*api'` |
| Tidak bisa login admin | `bash /var/www/salfanet-radius/frontend/vps-install/fix-auth-after-update.sh` |
| Error permission file | `bash /var/www/salfanet-radius/frontend/vps-install/fix-permissions.sh` |
| Error Prisma engine | `bash /var/www/salfanet-radius/frontend/vps-install/fix-prisma-engines.sh` |
| Cek port bentrok | `bash /var/www/salfanet-radius/frontend/vps-install/check-port.sh` |
| FreeRADIUS mati | `systemctl restart freeradius`, lalu `freeradius -X` untuk debug |
| Diagnosa Nginx | `bash /var/www/salfanet-radius/frontend/vps-install/install-nginx.sh` (menjalankan self-check) |

Build ulang manual jika diperlukan:

```bash
cd /var/www/salfanet-radius
cd backend  && npx prisma generate && NODE_OPTIONS='--max-old-space-size=1536' npx next build && node scripts/postbuild.js && cd ..
cd frontend && NODE_OPTIONS='--max-old-space-size=1536' npx next build && node scripts/postbuild.js && cd ..
pm2 restart salfanet-frontend salfanet-backend salfanet-cron --update-env
```

---

## 10. Uninstall

```bash
bash /var/www/salfanet-radius/frontend/vps-install/vps-uninstaller.sh
```

⚠️ Backup database dan folder `public/uploads/` sebelum uninstall.

---

## 11. Checklist Keamanan Produksi

- [ ] Ganti password `superadmin`
- [ ] Ganti `DB_PASSWORD` / `DB_ROOT_PASSWORD` dari nilai default
- [ ] Aktifkan HTTPS (domain + Let's Encrypt, atau Cloudflare)
- [ ] Pastikan UFW aktif (`ufw status`) atau firewall Proxmox/cloud sudah dikonfigurasi
- [ ] Jangan buka port 3000, 3001, 3306, 6379, 4000, dan 7557 (GenieACS NBI) ke publik
- [ ] Ganti secret RADIUS default `testing123`
- [ ] Amankan `INSTALLATION_INFO.txt` dan `.env` (`chmod 600`)
- [ ] Jadwalkan backup database rutin
