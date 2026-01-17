# 03 - Store Connection (Magaza Baglantisi)

**Oncelik:** P0 (Must Have)
**Tahmini Sure:** 3-4 gun
**User Story:** US-001
**Functional Requirement:** FR-001, FR-002
**Durum:** TAMAMLANDI

---

## Aciklama
WooCommerce magazalarini API uzerinden baglamak, baglanti test etmek ve ilk veri senkronizasyonunu baslatmak.

---

## Yapilacaklar

### Backend - Store Module
- [x] Store module olustur
- [x] Store service olustur
- [x] Store controller olustur
- [x] Store entity/model tanimla

### Backend - WooCommerce Integration
- [x] WooCommerce client service olustur
- [x] Basic Auth authentication implement et (WooCommerce REST API v3)
- [x] API baglanti test fonksiyonu
- [x] Hata mesajlari tanimlari:
  - [x] "Gecersiz URL formati"
  - [x] "Kimlik dogrulama basarisiz"
  - [x] "Magaza erisilemedik"
  - [x] "API devrede degil"

### Backend - Store Endpoints
- [x] POST /stores - Yeni magaza ekle
- [x] GET /stores - Kullanicinin magazalarini listele
- [x] GET /stores/:id - Magaza detayi
- [x] PUT /stores/:id - Magaza guncelle
- [x] DELETE /stores/:id - Magaza sil
- [x] POST /stores/:id/test-connection - Baglanti test et
- [x] POST /stores/:id/sync - Manuel senkronizasyon baslat
- [x] POST /stores/test - Baglanti test et (magaza olusturmadan)

### Backend - Security
- [x] API credentials AES-256-GCM ile sifrele
- [x] Credentials decryption sadece sync sirasinda
- [x] Plan bazli magaza limiti kontrolu
- [x] Store limit middleware

### Backend - Data Sync
- [x] Urunleri cek ve kaydet (pagination ile)
- [x] Siparisleri cek ve kaydet (son 30 gun)
- [x] Sync durumu takibi
- [x] Sync hata yonetimi
- [x] Otomatik senkronizasyon (cron job - her saat)

### Frontend - Store Connection Wizard
- [x] "Magaza Ekle" sayfasi/modal olustur
- [x] Adim 1: Magaza adi girisi
- [x] Adim 2: Magaza URL girisi
  - [x] URL validasyonu
  - [x] URL format kontrolu
- [x] Adim 3: Consumer Key girisi (32+ karakter)
- [x] Adim 4: Consumer Secret girisi (32+ karakter)
- [x] Adim 5: Baglanti Testi
  - [x] "Baglantiyi Test Et" butonu
  - [x] Loading state
  - [x] Basari: Yesil sonuc
  - [x] Hata: Kirmizi hata mesaji
- [x] Nasil alinir? yardim linki (dokumantasyon)

### Frontend - Store List
- [x] Magazalar listesi sayfasi
- [x] Magaza karti komponenti
  - [x] Magaza adi
  - [x] URL
  - [x] Son senkronizasyon zamani
  - [x] Aksiyonlar (senkronize et, sil)
  - [x] Durum toggle (aktif/pasif)
- [x] Bos state ("Henuz bagli magaza yok")
- [x] Upgrade prompt (limit asildiginda)

### Frontend - Store State
- [x] Stores store olustur (Zustand)
- [x] API client fonksiyonlari
- [x] Loading ve error states

---

## Kabul Kriterleri
- [x] AC-001.1: Gecerli URL girilir
- [x] AC-001.2: Consumer Key girisi (32+ karakter)
- [x] AC-001.3: Consumer Secret girisi (32+ karakter)
- [x] AC-001.4: "Baglantiyi Test Et" sonuc verir
- [x] AC-001.5: Basarili baglanti yesil sonuc gosterir
- [x] AC-001.6: Basarisiz baglanti spesifik hata mesaji gosterir
- [x] AC-001.7: Plan bazli magaza limiti uygulanir
- [x] AC-001.8: Limit asildiginda upgrade prompt gosterilir
- [x] AC-001.9: API credentials AES-256-GCM ile sifrelenir
- [x] AC-001.10: Basarili baglanti sonrasi senkronizasyon baslatilabilir

---

## Teknik Notlar
- WooCommerce REST API v3 kullanildi
- Basic Auth authentication (WooCommerce HTTPS icin destekliyor)
- AES-256-GCM encryption for credentials
- Batch API requests (pagination)
- Otomatik senkronizasyon: @nestjs/schedule ile cron job (EVERY_HOUR)

---

## Senkronize Edilen Veriler
- **Urunler:** id, name, sku, price, stock_quantity, stock_status, status
- **Siparisler:** id, number, status, total, subtotal, tax, shipping, discount, payment_method, customer info, line_items

---

## Bagimliliklar
- 01-project-setup tamamlanmis olmali

---

## Commit Mesaji Formati
```
feat(stores): Implement WooCommerce store connection

- Add store connection wizard with API validation
- Implement Basic Auth authentication
- Add AES-256-GCM encryption for API credentials
- Create initial data sync mechanism
- Add automatic sync with cron job (hourly)
- Add upgrade prompt for store limits
```

---

## Feature Tamamlama Checklist
- [x] TypeScript strict mode hatalari yok
- [x] Kod moduler ve tekrar yok
- [x] Ortak kodlar common'da
- [x] .env'de hassas bilgi yok (git'te)
- [x] Clean code kurallarina uygun
- [x] Feature tamamlandi ve test edildi
