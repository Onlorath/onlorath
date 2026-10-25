# Yayına alma: Supabase + Render + Vercel (ücretsiz katman)

| Parça | Nerede | Not |
|---|---|---|
| PostgreSQL | Supabase | Bağlantı **Session pooler** üzerinden (Render IPv6 desteklemiyor) |
| Yüklenen dosyalar | Supabase Storage, `uploads` bucket'ı | Render'ın diski geçici; dosyalar orada kalıcı olmaz |
| Go API | Render Web Service | 15 dk boşta kalınca uyur; UptimeRobot uyanık tutar |
| Next.js | Vercel | Sayfalar 60 sn önbellekte; API'ye `API_INTERNAL_URL` ile bağlanır |

> **Önce yedek al.** API ilk açıldığında `backend/migrations` uygulanır. `0002_redesign.sql` eski
> `projects` / `project_images` tablolarını **silip yeniden oluşturur** ve blogları iki dilli yapıya
> çevirir; kullanıcılar ve sohbet geçmişi korunur.

## 1. Supabase

1. **Yedek.** Project → **Connect** → **Session pooler** bağlantı adresini kopyala, sonra:

   ```bash
   & "C:\Program Files\PostgreSQL\16\bin\pg_dump.exe" "SESSION_POOLER_ADRESI" -Fc -f supabase-yedek.dump
   ```

   "server version mismatch" hatası alırsan Supabase daha yeni bir Postgres sürümü kullanıyor
   demektir; aynı ana sürümün `pg_dump` aracını kurup tekrar dene.

2. **Bağlantı adresi (`DATABASE_URL`).** Yine **Session pooler** adresi; sonuna `?sslmode=require` ekle:
   `postgresql://postgres.PROJE:SIFRE@aws-0-eu-central-1.pooler.supabase.com:5432/postgres?sslmode=require`

3. **Storage.** Storage → **New bucket** → adı `uploads`, **Public bucket: açık**.

4. **Service key.** Project Settings → API Keys → `service_role` (secret) anahtarı.
   Bu anahtar yalnızca Render'a girer; tarayıcıya ya da repoya asla girmez.

## 2. Render (Go API)

Mevcut Web Service'in ayarları (Settings):

| Ayar | Değer |
|---|---|
| Root Directory | `backend` |
| Runtime | Go |
| Build Command | `go build -o bin/api ./cmd/api` |
| Start Command | `./bin/api` |
| Health Check Path | `/healthz` |
| Region | Frankfurt (Vercel ile aynı bölge) |

Environment değişkenleri:

| Değişken | Değer |
|---|---|
| `APP_ENV` | `production` (JWT anahtarları eksik/kısaysa API açılmayı reddeder) |
| `DATABASE_URL` | 1.2'deki adres |
| `DB_MAX_OPEN_CONNS` | `5` (ücretsiz pooler bağlantı sınırı için) |
| `JWT_SECRET` | 48+ karakter rastgele (aşağıdaki komut) |
| `JWT_REFRESH_SECRET` | 48+ karakter rastgele, `JWT_SECRET`'tan **farklı** |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | Canlı admin girişi (güçlü bir şifre) |
| `COOKIE_SECURE` | `true` |
| `CLIENT_URL` | `https://onlorath.vercel.app` |
| `GEMINI_API_KEY` | Sohbet asistanı için |
| `SUPABASE_URL` | `https://PROJE.supabase.co` |
| `SUPABASE_SERVICE_KEY` | 1.4'teki anahtar |
| `SUPABASE_BUCKET` | `uploads` |
| `DISCORD_WEBHOOK_URL`, `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID` | İsteğe bağlı bildirimler |

Rastgele anahtar üretmek için (PowerShell, iki kez çalıştır):

```bash
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 48 | ForEach-Object { [char]$_ })
```

Kaydet → **Manual Deploy → Deploy latest commit**. Loglarda sırasıyla
`Applied migration …`, `Admin account ready` ve `HTTP Server listening` görmelisin.
Kontrol: `https://SERVIS.onrender.com/healthz` → `{"status":"ok"}`.

## 3. İçeriği yükle (bir kez)

Veritabanı boşsa siteyi seed ile doldur (kendi bilgisayarında, `backend` klasöründe):

```bash
$env:DATABASE_URL = "1.2'DEKİ ADRES"; go run ./cmd/seed; Remove-Item Env:DATABASE_URL
```

Seed yalnızca boş tablolara yazar. Sonrasını admin panelinden düzenlersin.

## 4. Vercel (Next.js)

1. Settings → Environment Variables → `API_INTERNAL_URL` = `https://SERVIS.onrender.com`
   (sonda `/` yok; Production, Preview ve Development için). Varsa eski `NEXT_PUBLIC_API_URL`'yi sil.
2. Settings → Functions → **Function Region**: Frankfurt (`fra1`).
3. Deployments → son deploy → **Redeploy**. (Değişken build sırasında okunduğu için yeniden deploy şart.)

## 5. UptimeRobot (uyanık tutma)

Ücretsiz hesap → **New monitor** → HTTP(s) → `https://SERVIS.onrender.com/healthz`, aralık **5 dakika**.
Bu hem Render'ın uyumasını hem de Supabase projesinin 7 günlük hareketsizlikte durdurulmasını önler.

## 6. Kontrol listesi

- `https://onlorath.vercel.app/tr` açılıyor.
- `/admin` → canlı admin bilgileriyle giriş yapılıyor.
- Admin'den bir görsel yükle: adres `…supabase.co/storage/v1/object/public/uploads/…` ile başlamalı.
- İletişim formu → admin'de Mesajlar'a düşüyor.

## Bilinen kısıtlar

- Admin'deki değişiklikler sitede **en geç 60 saniye** içinde görünür (sayfa önbelleği).
- Render uyurken (UptimeRobot yoksa) ilk istek ~50 sn sürebilir; site bu sürede önbellekteki sayfayı gösterir.
- Admin yüklemeleri Vercel üzerinden geçer; çok büyük videolarda Vercel'in istek boyutu sınırına
  takılabilirsin. Öyle olursa videoyu küçült ya da Supabase Storage'a elle yükleyip adresini yapıştır.
- Kendi sunucuna geçince `DATABASE_URL` ve `SUPABASE_*` değişkenlerini silmen yeterli:
  API yerel Postgres'e ve yerel diske (`UPLOAD_DIR`) döner.
