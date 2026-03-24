# MertTur - Kurulum Kılavuzu

## Coolify'da Deploy

### 1. PostgreSQL Servisi
Coolify panelinde yeni bir PostgreSQL servisi oluştur.
Bağlantı stringini kopyala: `postgresql://user:pass@host:5432/dbname`

### 2. Yeni Uygulama
- Source: GitHub repo veya dosyaları yükle
- Build Pack: Dockerfile
- Port: 3000

### 3. Ortam Değişkenleri (Environment Variables)
```
DATABASE_URL=postgresql://...
NEXTAUTH_SECRET=openssl rand -base64 32 ile üret
NEXTAUTH_URL=https://merttur.com

ADMIN_EMAIL_1=senin-emailin@gmail.com
ADMIN_PASSWORD_1=güçlü-şifre
ADMIN_NAME_1=Adın

ADMIN_EMAIL_2=baban@gmail.com
ADMIN_PASSWORD_2=güçlü-şifre-2
ADMIN_NAME_2=Baban

ADMIN_EMAIL_3=abin@gmail.com
ADMIN_PASSWORD_3=güçlü-şifre-3
ADMIN_NAME_3=Abin
```

### 4. İlk Deploy Sonrası
Prisma migration + seed:
```bash
# Coolify terminal veya SSH ile:
npx prisma db push
tsx prisma/seed.ts
```

### 5. Logo
`public/logo.png` olarak logonu kaydet.

---

## WhatsApp Bot Kurulumu

```bash
# Bot paketini kur
npm install @whiskeysockets/baileys

# .env'e ekle
WHATSAPP_GROUP_NAME=Mert Tur Yakıt  # Grubun TAM adı

# Botu başlat
npm run bot

# QR kodu çıkacak → fazlalık telefonla tara
```

### Şöförlere Anlatılacak Format
Yakıt aldıklarında gruba şunu atsınlar:
```
📸 Fiş fotoğrafı
Mesajda: 45J9443 - 125400 km
```

---

## Lokal Geliştirme

```bash
cd merttur
npm install
npx prisma db push
npm run db:seed
npm run dev
# http://localhost:3000
```

## Önemli Notlar

- **Muayene 6 ayda bir** — en kritik belge!
- Adli sicil 3 ayda bir yenilenmeli
- J plaka her yıl Eylülde yenilenir
