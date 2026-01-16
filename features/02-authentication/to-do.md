# 02 - Authentication (Kullanici Dogrulama)

**Oncelik:** P1 (Should Have)
**Tahmini Sure:** 2-3 gun
**User Story:** US-009

---

## Aciklama
Kullanici kayit, giris, sifre sifirlama ve oturum yonetimi islevlerini iceren kimlik dogrulama sistemi.

---

## Yapilacaklar

### Backend - Auth Module
- [ ] Auth module olustur (`nest g module auth`)
- [ ] Auth service olustur
- [ ] Auth controller olustur
- [ ] JWT strategy implement et (Passport.js)
- [ ] Refresh token mekanizmasi ekle
- [ ] Password hashing (bcrypt) implement et

### Backend - User Module
- [ ] User module olustur
- [ ] User service olustur
- [ ] User entity/model tanimla
- [ ] Create user endpoint
- [ ] Get user profile endpoint

### Backend - Auth Endpoints
- [ ] POST /auth/register - Kullanici kayit
- [ ] POST /auth/login - Kullanici girisi
- [ ] POST /auth/logout - Cikis (token blacklist)
- [ ] POST /auth/refresh - Token yenileme
- [ ] POST /auth/forgot-password - Sifre sifirlama istegi
- [ ] POST /auth/reset-password - Sifre sifirlama
- [ ] GET /auth/me - Mevcut kullanici bilgisi

### Backend - Security
- [ ] Rate limiting ekle (5 basarisiz giris = 15 dk kilitleme)
- [ ] CAPTCHA entegrasyonu (3 basarisiz giristen sonra)
- [ ] JWT blacklist mekanizmasi (Redis)
- [ ] Password validation rules (min 8 karakter, buyuk/kucuk harf, rakam)
- [ ] Email verification flow

### Frontend - Auth Pages
- [ ] Login sayfasi olustur
  - [ ] Email input field
  - [ ] Password input field
  - [ ] "Beni Hatirla" checkbox
  - [ ] "Sifremi Unuttum" linki
  - [ ] Giris butonu
  - [ ] Hata mesajlari (Toast)
- [ ] Register sayfasi olustur
  - [ ] Email input
  - [ ] Password input
  - [ ] Password confirm input
  - [ ] Kayit butonu
- [ ] Forgot Password sayfasi olustur
- [ ] Reset Password sayfasi olustur

### Frontend - Auth State
- [ ] Auth context/store olustur (Zustand)
- [ ] Token storage (localStorage/httpOnly cookie)
- [ ] Auto-refresh token mekanizmasi
- [ ] Protected route wrapper
- [ ] Auth loading state
- [ ] Logout fonksiyonu

### Email Service
- [ ] Email service module olustur
- [ ] SMTP yapilandirmasi (nodemailer)
- [ ] Sifre sifirlama email template
- [ ] Email verification template

---

## Kabul Kriterleri
- [ ] AC-009.1: Email ve sifre ile login form calisir
- [ ] AC-009.2: Hatali giris "E-posta veya sifre hatali" mesaji gosterir
- [ ] AC-009.3: Basarili giris dashboard'a yonlendirir
- [ ] AC-009.4: "Beni Hatirla" ile oturum 7 gun surer
- [ ] AC-009.5: "Sifremi Unuttum" linki sifre sifirlama akisini baslatir
- [ ] AC-009.6: Sifre sifirlama emaili 30 saniye icinde gonderilir
- [ ] AC-009.7: Header'da logout butonu vardir
- [ ] AC-009.8: Logout yapildiginda token gecersizlestirilir
- [ ] AC-009.9: 5 basarisiz giris 15 dakika kilitleme uygular
- [ ] AC-009.10: 3 basarisiz giristen sonra CAPTCHA gosterilir

---

## Teknik Notlar
- JWT + Refresh Token pattern
- NestJS Passport entegrasyonu
- bcrypt ile password hashing
- Redis ile token blacklist
- nodemailer ile email gonderimi

---

## Bagimliliklar
- 01-project-setup tamamlanmis olmali

---

## Commit Mesaji Formati
```
feat(auth): Implement user authentication system

- Add JWT-based authentication with refresh tokens
- Create login, register, and password reset flows
- Implement rate limiting and security measures
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
