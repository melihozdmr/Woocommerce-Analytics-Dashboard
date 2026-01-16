# 01 - Project Setup (Proje Altyapisi)

**Oncelik:** P0 (Must Have)
**Tahmini Sure:** 2-3 gun
**Durum:** TAMAMLANDI ✓

---

## Aciklama
Projenin temel altyapisini kurmak. Frontend (Next.js + Tailwind CSS), Backend (NestJS), veritabani (PostgreSQL + Prisma) ve cache (Redis) yapilandirmasi.

---

## Yapilacaklar

### Backend Setup
- [x] NestJS projesi olustur (`nest new backend`)
- [x] TypeScript konfigurasyonu ayarla (strict mode)
- [x] Environment degiskenleri yapilandir (.env, .env.example)
- [x] PostgreSQL baglantisi kur
- [x] Prisma ORM entegre et
- [x] Prisma schema olustur (users, stores, plans tablolari)
- [x] Redis baglantisi kur (docker-compose'da hazir)
- [x] Swagger/OpenAPI dokumantasyonu ayarla
- [x] CORS ayarlarini yapilandir
- [x] Global exception filter ekle
- [x] Request logging middleware ekle
- [x] Health check endpoint olustur (`/health`)

### Frontend Setup
- [x] Next.js 14 projesi olustur
- [x] Tailwind CSS yukle ve yapilandir
- [x] React Query yukle ve provider ayarla
- [x] Zustand yukle (global state icin)
- [x] API client olustur (axios instance)
- [x] Environment degiskenleri yapilandir
- [x] Temel layout komponenti olustur (Sidebar, Header)
- [x] Dashboard sayfasi olustur

### Database Schema
- [x] Users tablosu olustur
- [x] Plans tablosu olustur (Free, Pro, Enterprise)
- [x] Stores tablosu olustur
- [x] Settings tablosu olustur
- [x] Analytics_cache tablosu olustur
- [x] Products tablosu olustur
- [x] Orders tablosu olustur
- [x] RefreshTokens tablosu olustur
- [x] Seed data ekle (planlar icin)

### DevOps & Tooling
- [x] ESLint + Prettier ayarla (frontend & backend)
- [x] Jest test yapilandirmasi
- [x] Docker Compose dosyasi olustur (PostgreSQL, Redis)
- [x] README.md guncelle (kurulum talimatlari)

---

## Kabul Kriterleri
- [x] Backend localhost:3001'de calisiyor
- [x] Frontend localhost:3000'de calisiyor
- [x] PostgreSQL baglantisi basarili (docker-compose)
- [x] Redis baglantisi basarili (docker-compose)
- [x] Swagger UI eriselebilir (/api/docs)
- [x] Temel layout goruntulenebiliyor

---

## Teknik Notlar
- Node.js 20+ gerekli
- PostgreSQL 15.x
- Redis 7.x
- Next.js 14.x
- NestJS 10.x
- Prisma 6.x

---

## Iliskili User Stories
- Tum feature'lar icin temel altyapi

---

## Commit Mesaji
```
feat(setup): Initialize project infrastructure

- Add Docker Compose with PostgreSQL 15 and Redis 7
- Create NestJS 10 backend with modular architecture
- Setup Prisma ORM with complete database schema
- Add health check module with API endpoints
- Configure Swagger/OpenAPI documentation
- Setup global exception filter and logging interceptor
- Create Next.js 14 frontend with TypeScript
- Add Tailwind CSS and dashboard layout
- Setup React Query, Zustand, and API client
- Add 7 passing unit tests for health module
```

---

## Proje Kurallari

> **Detayli kurallar icin bkz:** [RULES.md](../../RULES.md)

### Teknoloji
- **Dil:** TypeScript (strict mode)
- **ORM:** Prisma / Drizzle / TypeORM / MikroORM
- **Test:** Jest
- **Frontend:** Next.js + Tailwind CSS

### Kod Yapisi
- Moduler yapi kullan
- Ortak kodlar `src/common/` altinda
- Tekrar eden kod yazma (DRY)

### Cevre Degiskenleri
- `.env` dosyasi **ASLA** git'e eklenmez
- `.env.example` ornek olarak git'e eklenir
- Hassas bilgiler sadece `.env`'de tutulur

### Test Kurallari
- Feature tamamlaninca testler yazilmali
- `npm run test` basarili olmadan commit atilmaz
- Minimum %70 code coverage

### Clean Code
- Fonksiyonlar tek sorumluluk tasimali
- Anlasilir degisken/fonksiyon isimleri
- Maksimum 30 satir fonksiyon

### Feature Tamamlama Checklist
- [x] TypeScript strict mode hatalari yok
- [x] Kod moduler ve tekrar yok
- [x] Ortak kodlar common'da
- [x] .env'de hassas bilgi yok (git'te)
- [x] Unit testler yazildi
- [x] Testler basarili geciyor (`npm run test`)
- [x] Clean code kurallarina uygun
- [x] Dokumantasyon guncellendi
- [x] Git commit atildi
