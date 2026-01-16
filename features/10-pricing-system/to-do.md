# Feature 10: Fiyatlandirma Sistemi (Pricing System)

## Ilgili User Stories
**US-014: Fiyatlandirma Sistemi Yonetimi**
- **Oncelik:** P0 (Must Have)
- **Tahmin:** M (Medium)

**US-015: Plan Bazli Magaza Limiti**
- **Oncelik:** P0 (Must Have)
- **Tahmin:** M (Medium)

## Ilgili Fonksiyonel Gereksinim
**FR-008: Fiyatlandirma Sistemi**
- Database toggle mekanizmasi
- Plan tanimlari (Free, Pro, Enterprise)
- Magaza limiti kontrolu
- Ozellik kisitlamalari (plan bazli)

---

## Kabul Kriterleri (US-014)
- [ ] Database toggle ile fiyatlandirma aktif/pasif yapilabilmeli
- [ ] Pasifken tum ozellikler ucretsiz erisime acik
- [ ] Aktifken plan bazli kisitlamalar devreye girmeli
- [ ] Mevcut kullanicilar etkilenmemeli (grandfathering opsiyonu)
- [ ] Toggle degisikligi anlik yansimali

## Kabul Kriterleri (US-015)
- [ ] Free tier: 2 magaza limiti
- [ ] Pro tier: 5 magaza limiti
- [ ] Enterprise tier: 10 magaza limiti (veya sinirsiz)
- [ ] Limit asildiginda uyari mesaji gosterilmeli
- [ ] Plan yukseltme yonlendirmesi yapilmali
- [ ] Mevcut kullanim / limit gosterilmeli

---

## Fiyatlandirma Tablosu

| Ozellik | Free | Pro | Enterprise |
|---------|------|-----|------------|
| Magaza limiti | 2 | 5 | 10 (veya sinirsiz) |
| Veri guncelleme | 15 dakika | 5 dakika | 1 dakika |
| Gecmis veri | 30 gun | 1 yil | 2 yil |
| CSV export | Hayir | Evet | Evet |
| PDF export | Hayir | Evet | Evet |
| Email raporlari | Hayir | Hayir | Evet |
| API erisimi | Hayir | Hayir | Evet |
| Oncelikli destek | Hayir | Hayir | Evet |
| **Aylik fiyat** | 0 TL | 99 TL | 299 TL |
| **Yillik fiyat** | 0 TL | 990 TL | 2,990 TL |

---

## Yapilacaklar

### Aşama 1: Veritabani - Plan Tablolari
- [ ] 1.1. `plans` tablosu olustur
  - id, name, store_limit, price_monthly, price_yearly, features_json, is_active
- [ ] 1.2. Varsayilan planlari ekle (Free, Pro, Enterprise)
- [ ] 1.3. `settings` tablosuna `pricing_enabled` key ekle
- [ ] 1.4. `users` tablosuna `plan_id` foreign key ekle
- [ ] 1.5. `users` tablosuna `grandfathered` boolean ekle

### Aşama 2: Backend - Pricing Toggle Mekanizmasi
- [ ] 2.1. `PricingService` olustur
- [ ] 2.2. `isPricingEnabled()` fonksiyonu
- [ ] 2.3. Toggle state cache'leme (Redis)
- [ ] 2.4. Admin toggle endpoint: `PUT /api/admin/pricing/toggle`

### Aşama 3: Backend - Plan Yonetimi
- [ ] 3.1. `PlanService` olustur
- [ ] 3.2. `getUserPlan(userId)` fonksiyonu
- [ ] 3.3. `getStoreLimit(planId)` fonksiyonu
- [ ] 3.4. `canAddStore(userId)` fonksiyonu
- [ ] 3.5. `getFeatureAccess(userId, featureName)` fonksiyonu

### Aşama 4: Backend - Limit Kontrol Middleware
- [ ] 4.1. `checkStoreLimit` middleware olustur
- [ ] 4.2. Magaza ekleme endpoint'ine middleware ekle
- [ ] 4.3. Limit asimi durumunda 403 + upgrade mesaji dondur

### Aşama 5: Backend - Ozellik Kisitlama
- [ ] 5.1. `checkFeatureAccess` middleware olustur
- [ ] 5.2. Export endpoint'lerine middleware ekle
- [ ] 5.3. API erisim endpoint'lerine middleware ekle
- [ ] 5.4. Veri guncelleme sikligini plan bazli ayarla

### Aşama 6: Backend - API Endpoints
- [ ] 6.1. `GET /api/settings/plans` - Tum planlari listele
- [ ] 6.2. `GET /api/settings/my-plan` - Kullanicinin mevcut plani
- [ ] 6.3. `GET /api/settings/usage` - Kullanim durumu (magaza kullanimi)
- [ ] 6.4. `POST /api/settings/upgrade` - Plan yukseltme istegi

### Aşama 7: Backend - Grandfathering
- [ ] 7.1. Mevcut kullanicilari grandfathered olarak isaretle
- [ ] 7.2. Grandfathered kullanicilara mevcut limitleri koru
- [ ] 7.3. Migration scripti olustur

### Aşama 8: Frontend - Plan Gosterimi
- [ ] 8.1. `PlanBadge` komponenti (Free, Pro, Enterprise)
- [ ] 8.2. Header'da mevcut plan gosterimi
- [ ] 8.3. Kullanim durumu gosterimi (2/5 magaza)

### Aşama 9: Frontend - Plan Karsilastirma Sayfasi
- [ ] 9.1. `/pricing` sayfasi olustur
- [ ] 9.2. Plan ozellik karsilastirma tablosu
- [ ] 9.3. Plan secim kartlari
- [ ] 9.4. Aylik/Yillik toggle

### Aşama 10: Frontend - Limit Uyarilari
- [ ] 10.1. Limit yaklasildiginda uyari banner'i
- [ ] 10.2. Limit asildiginda modal gosterimi
- [ ] 10.3. "Plan Yukselt" CTA butonu

### Aşama 11: Frontend - Ozellik Kisitlama UI
- [ ] 11.1. Kisitli ozellikler icin "Pro'da mevcut" badge'i
- [ ] 11.2. Disabled state butonlar
- [ ] 11.3. Upgrade modal/tooltip

### Aşama 12: Admin Panel (Opsiyonel - SaaS Sonrasi)
- [ ] 12.1. Admin pricing toggle UI
- [ ] 12.2. Plan duzenleme arayuzu
- [ ] 12.3. Kullanici plan atama

### Aşama 13: Test
- [ ] 13.1. Plan limit kontrol testleri
- [ ] 13.2. Feature access testleri
- [ ] 13.3. Toggle mekanizmasi testleri
- [ ] 13.4. Grandfathering testleri

---

## Database Schema

```sql
-- Plans tablosu
CREATE TABLE plans (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  store_limit INT NOT NULL,
  price_monthly DECIMAL(10,2) NOT NULL,
  price_yearly DECIMAL(10,2) NOT NULL,
  refresh_interval INT DEFAULT 15, -- dakika
  history_days INT DEFAULT 30,
  features_json JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Varsayilan planlar
INSERT INTO plans (name, store_limit, price_monthly, price_yearly, refresh_interval, history_days, features_json)
VALUES
  ('Free', 2, 0, 0, 15, 30, '{"csv_export": false, "pdf_export": false, "email_reports": false, "api_access": false}'),
  ('Pro', 5, 99, 990, 5, 365, '{"csv_export": true, "pdf_export": true, "email_reports": false, "api_access": false}'),
  ('Enterprise', 10, 299, 2990, 1, 730, '{"csv_export": true, "pdf_export": true, "email_reports": true, "api_access": true}');

-- Settings toggle
INSERT INTO settings (key, value) VALUES ('pricing_enabled', 'false');
```

---

## Teknik Notlar
- Toggle degisikligi Redis cache'i invalidate etmeli
- Grandfathered kullanicilar icin ozel kontrol
- SaaS oncesi `pricing_enabled = false` olmali
- Plan upgrade akisi odeme entegrasyonu ile birlikte gelecek (Phase 2)

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
