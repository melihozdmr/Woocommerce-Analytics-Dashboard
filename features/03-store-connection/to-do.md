# 03 - Store Connection (Magaza Baglantisi)

**Oncelik:** P0 (Must Have)
**Tahmini Sure:** 3-4 gun
**User Story:** US-001
**Functional Requirement:** FR-001, FR-002

---

## Aciklama
WooCommerce magazalarini API uzerinden baglamak, baglanti test etmek ve ilk veri senkronizasyonunu baslatmak.

---

## Yapilacaklar

### Backend - Store Module
- [ ] Store module olustur
- [ ] Store service olustur
- [ ] Store controller olustur
- [ ] Store entity/model tanimla

### Backend - WooCommerce Integration
- [ ] WooCommerce client service olustur
- [ ] OAuth 1.0a authentication implement et
- [ ] API baglanti test fonksiyonu
- [ ] Hata mesajlari tanimlari:
  - [ ] "Gecersiz URL formati"
  - [ ] "Kimlik dogrulama basarisiz"
  - [ ] "Magaza erisilemedik"
  - [ ] "API devrede degil"

### Backend - Store Endpoints
- [ ] POST /stores - Yeni magaza ekle
- [ ] GET /stores - Kullanicinin magazalarini listele
- [ ] GET /stores/:id - Magaza detayi
- [ ] PUT /stores/:id - Magaza guncelle
- [ ] DELETE /stores/:id - Magaza sil
- [ ] POST /stores/:id/test-connection - Baglanti test et
- [ ] POST /stores/:id/sync - Manuel senkronizasyon baslat

### Backend - Security
- [ ] API credentials AES-256 ile sifrele
- [ ] Credentials decryption sadece sync sirasinda
- [ ] Plan bazli magaza limiti kontrolu
- [ ] Store limit middleware

### Backend - Initial Sync
- [ ] Urunleri cek ve kaydet (pagination ile)
- [ ] Siparisleri cek ve kaydet
- [ ] Sync durumu takibi
- [ ] Sync hata yonetimi

### Frontend - Store Connection Wizard
- [ ] "Magaza Ekle" sayfasi/modal olustur
- [ ] Adim 1: Magaza URL girisi
  - [ ] HTTPS URL validasyonu
  - [ ] URL format kontrolu
- [ ] Adim 2: API Credentials girisi
  - [ ] Consumer Key input (32+ karakter)
  - [ ] Consumer Secret input (32+ karakter)
  - [ ] Nasil alinir? yardim linki
- [ ] Adim 3: Baglanti Testi
  - [ ] "Baglantiyi Test Et" butonu
  - [ ] Loading state (max 10 saniye)
  - [ ] Basari: Yesil toast + magaza adi
  - [ ] Hata: Kirmizi toast + spesifik hata mesaji
- [ ] Adim 4: Magaza Ayarlari
  - [ ] Magaza takma adi (nickname)
  - [ ] Varsayilan ayarlar

### Frontend - Store List
- [ ] Magazalar listesi sayfasi
- [ ] Magaza karti komponenti
  - [ ] Magaza adi
  - [ ] URL
  - [ ] Baglanti durumu (yesil/kirmizi badge)
  - [ ] Son senkronizasyon zamani
  - [ ] Aksiyonlar (duzenle, sil, test et)
- [ ] Bos state ("Henuz magaza eklenmemis")
- [ ] Plan limiti uyarisi

### Frontend - Store State
- [ ] Stores store olustur (Zustand)
- [ ] API client fonksiyonlari
- [ ] Loading ve error states

---

## Kabul Kriterleri
- [ ] AC-001.1: Gecerli HTTPS URL girilir
- [ ] AC-001.2: Consumer Key girisi (32+ karakter)
- [ ] AC-001.3: Consumer Secret girisi (32+ karakter)
- [ ] AC-001.4: "Baglantiyi Test Et" 10 saniye icinde sonuc verir
- [ ] AC-001.5: Basarili baglanti yesil toast gosterir
- [ ] AC-001.6: Basarisiz baglanti spesifik hata mesaji gosterir
- [ ] AC-001.7: Plan bazli magaza limiti uygulanir (Free:2, Pro:5, Enterprise:10)
- [ ] AC-001.8: Limit asildiginda upgrade prompt gosterilir
- [ ] AC-001.9: API credentials AES-256 ile sifrelenir
- [ ] AC-001.10: Basarili baglanti ilk senkronizasyonu baslatir

---

## Teknik Notlar
- WooCommerce REST API v3 kullan
- OAuth 1.0a authentication
- AES-256 encryption for credentials
- Batch API requests (pagination)
- Rate limiting: 100 requests/minute/store

---

## Bagimliliklar
- 01-project-setup tamamlanmis olmali

---

## Commit Mesaji Formati
```
feat(stores): Implement WooCommerce store connection

- Add store connection wizard with API validation
- Implement OAuth 1.0a authentication
- Add AES-256 encryption for API credentials
- Create initial data sync mechanism
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
