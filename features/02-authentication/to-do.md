# 02 - Authentication (Kullanıcı Doğrulama)

**Öncelik:** P1 (Should Have)
**Tahmini Süre:** 2-3 gün
**User Story:** US-009
**Durum:** TAMAMLANDI ✓

---

## Açıklama
Kullanıcı kayıt, giriş, şifre sıfırlama ve oturum yönetimi işlevlerini içeren kimlik doğrulama sistemi.

---

## Yapılacaklar

### Backend - Auth Module
- [x] Auth module oluştur
- [x] Auth service oluştur
- [x] Auth controller oluştur
- [x] JWT strategy implement et (Passport.js)
- [x] Refresh token mekanizması ekle
- [x] Password hashing (bcrypt) implement et

### Backend - User Module
- [x] User modeli Prisma'da tanımlı
- [x] Get user profile endpoint (/auth/me)

### Backend - Auth Endpoints
- [x] POST /auth/register - Kullanıcı kayıt
- [x] POST /auth/login - Kullanıcı girişi
- [x] POST /auth/logout - Çıkış (token silme)
- [x] POST /auth/refresh - Token yenileme
- [x] POST /auth/forgot-password - Şifre sıfırlama isteği
- [x] POST /auth/reset-password - Şifre sıfırlama
- [x] GET /auth/me - Mevcut kullanıcı bilgisi

### Backend - Security
- [x] Global rate limiting (ThrottlerModule)
- [x] Password validation rules (min 8 karakter, büyük/küçük harf, rakam)
- [ ] CAPTCHA entegrasyonu (opsiyonel - ileride eklenebilir)
- [ ] Redis ile token blacklist (opsiyonel - ileride eklenebilir)
- [ ] Email verification flow (opsiyonel - ileride eklenebilir)

### Frontend - Auth Pages
- [x] Login sayfası oluştur
  - [x] Email input field
  - [x] Password input field
  - [x] "Beni Hatırla" checkbox
  - [x] "Şifremi Unuttum" linki
  - [x] Giriş butonu
  - [x] Hata mesajları
- [x] Register sayfası oluştur
  - [x] Email input
  - [x] Name input
  - [x] Password input
  - [x] Password confirm input
  - [x] Kayıt butonu
- [x] Forgot Password sayfası oluştur

### Frontend - Auth State
- [x] Auth store oluştur (Zustand)
- [x] Token storage (localStorage via Zustand persist)
- [x] Auto-refresh token mekanizması
- [x] Auth loading state
- [x] Logout fonksiyonu
- [x] Login/Register fonksiyonları

### Email Service
- [ ] Email service module oluştur (ileride eklenecek)
- [ ] SMTP yapılandırması (nodemailer)
- [ ] Şifre sıfırlama email template
- [ ] Email verification template

---

## Kabul Kriterleri
- [x] AC-009.1: Email ve şifre ile login form çalışır
- [x] AC-009.2: Hatalı giriş "E-posta veya şifre hatalı" mesajı gösterir
- [x] AC-009.3: Başarılı giriş dashboard'a yönlendirir
- [x] AC-009.4: "Beni Hatırla" ile oturum 30 gün sürer
- [x] AC-009.5: "Şifremi Unuttum" linki şifre sıfırlama akışını başlatır
- [ ] AC-009.6: Şifre sıfırlama emaili gönderilir (email servisi ileride)
- [x] AC-009.7: Header'da logout butonu vardır
- [x] AC-009.8: Logout yapıldığında token silinir

---

## Teknik Notlar
- JWT + Refresh Token pattern
- NestJS Passport entegrasyonu
- bcrypt ile password hashing
- Zustand ile frontend state management

---

## Bağımlılıklar
- 01-project-setup tamamlanmış ✓

---

## Commit Mesajı
```
feat(auth): Implement complete authentication system

Backend:
- Add Auth module with JWT and Passport.js
- Implement register, login, logout, refresh token endpoints
- Add forgot-password and reset-password endpoints
- Create JWT strategy and auth guards
- Add password validation (min 8 chars, uppercase, lowercase, digit)
- Update Prisma schema with resetToken fields
- Add 9 unit tests for AuthService (16 total tests passing)

Frontend:
- Create Login page with email/password form
- Create Register page with validation
- Create Forgot Password page
- Update authStore with login/register/logout actions
- Add shadcn form components (checkbox, label, form)
- Update API client for auth endpoints
```

---

## Proje Kuralları

> **Detaylı kurallar için bkz:** [RULES.md](../../RULES.md)

### Teknoloji
- **Dil:** TypeScript (strict mode)
- **ORM:** Prisma
- **Test:** Jest
- **Frontend:** Next.js + Tailwind CSS + shadcn/ui

### Kod Yapısı
- Modüler yapı kullan
- Ortak kodlar `src/common/` altında
- Tekrar eden kod yazma (DRY)

### Çevre Değişkenleri
- `.env` dosyası **ASLA** git'e eklenmez
- `.env.example` örnek olarak git'e eklenir
- Hassas bilgiler sadece `.env`'de tutulur

### Test Kuralları
- Feature tamamlanınca testler yazılmalı
- `npm run test` başarılı olmadan commit atılmaz
- Minimum %70 code coverage

### Clean Code
- Fonksiyonlar tek sorumluluk taşımalı
- Anlaşılır değişken/fonksiyon isimleri
- Maksimum 30 satır fonksiyon

### Feature Tamamlama Checklist
- [x] TypeScript strict mode hataları yok
- [x] Kod modüler ve tekrar yok
- [x] Ortak kodlar common'da
- [x] .env'de hassas bilgi yok (git'te)
- [x] Unit testler yazıldı (16 test)
- [x] Testler başarılı geçiyor (`npm run test`)
- [x] Clean code kurallarına uygun
- [x] Git commit atıldı
