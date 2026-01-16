# 01 - Project Setup (Proje Altyapisi)

**Oncelik:** P0 (Must Have)
**Tahmini Sure:** 2-3 gun

---

## Aciklama
Projenin temel altyapisini kurmak. Frontend (React + Shopify Polaris), Backend (NestJS), veritabani (PostgreSQL + Prisma) ve cache (Redis) yapilandirmasi.

---

## Yapilacaklar

### Backend Setup
- [ ] NestJS projesi olustur (`nest new backend`)
- [ ] TypeScript konfigurasyonu ayarla (strict mode)
- [ ] Environment degiskenleri yapilandir (.env, .env.example)
- [ ] PostgreSQL baglantisi kur
- [ ] Prisma ORM entegre et
- [ ] Prisma schema olustur (users, stores, plans tablolari)
- [ ] Redis baglantisi kur
- [ ] Swagger/OpenAPI dokumantasyonu ayarla
- [ ] CORS ayarlarini yapilandir
- [ ] Global exception filter ekle
- [ ] Request logging middleware ekle
- [ ] Health check endpoint olustur (`/health`)

### Frontend Setup
- [ ] React 18 projesi olustur (Vite)
- [ ] Shopify Polaris yukle ve yapilandir
- [ ] React Query yukle ve provider ayarla
- [ ] Zustand yukle (global state icin)
- [ ] React Router DOM yukle ve route yapisi olustur
- [ ] API client olustur (axios instance)
- [ ] Environment degiskenleri yapilandir
- [ ] Polaris AppProvider ile uygulamayi sar
- [ ] Temel layout komponenti olustur (Frame, Navigation, TopBar)
- [ ] Loading ve Error boundary komponentleri olustur

### Database Schema
- [ ] Users tablosu olustur
- [ ] Plans tablosu olustur (Free, Pro, Enterprise)
- [ ] Stores tablosu olustur
- [ ] Settings tablosu olustur
- [ ] Analytics_cache tablosu olustur
- [ ] Product_mappings tablosu olustur
- [ ] Seed data ekle (planlar icin)

### DevOps & Tooling
- [ ] ESLint + Prettier ayarla (frontend & backend)
- [ ] Husky pre-commit hooks ekle
- [ ] Jest test yapilandirmasi
- [ ] Docker Compose dosyasi olustur (PostgreSQL, Redis)
- [ ] README.md guncelle (kurulum talimatlari)

---

## Kabul Kriterleri
- [ ] Backend localhost:3001'de calisiyor
- [ ] Frontend localhost:3000'de calisiyor
- [ ] PostgreSQL baglantisi basarili
- [ ] Redis baglantisi basarili
- [ ] Swagger UI eriselebilir (/api/docs)
- [ ] Polaris komponentleri dogru render ediliyor
- [ ] Temel layout goruntulenebiliyor

---

## Teknik Notlar
- Node.js 18+ gerekli
- PostgreSQL 15.x
- Redis 7.x
- React 18.x
- NestJS 10.x
- Prisma 5.x

---

## Iliskili User Stories
- Tum feature'lar icin temel altyapi

---

## Commit Mesaji Formati
```
feat(setup): Initialize project infrastructure

- Set up NestJS backend with PostgreSQL and Redis
- Set up React frontend with Shopify Polaris
- Configure Prisma ORM and create initial schema
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
- [ ] TypeScript strict mode hatalari yok
- [ ] Kod moduler ve tekrar yok
- [ ] Ortak kodlar common'da
- [ ] .env'de hassas bilgi yok (git'te)
- [ ] Unit testler yazildi
- [ ] Testler basarili geciyor (`npm run test`)
- [ ] Clean code kurallarina uygun
- [ ] Dokumantasyon guncellendi
- [ ] Git commit atildi
