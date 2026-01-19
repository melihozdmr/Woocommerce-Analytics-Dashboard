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
- [x] Database toggle ile fiyatlandirma aktif/pasif yapilabilmeli
- [x] Pasifken tum ozellikler ucretsiz erisime acik
- [x] Aktifken plan bazli kisitlamalar devreye girmeli
- [x] Mevcut kullanicilar etkilenmemeli (grandfathering opsiyonu)
- [x] Toggle degisikligi anlik yansimali

## Kabul Kriterleri (US-015)
- [x] Free tier: 2 magaza limiti
- [x] Pro tier: 5 magaza limiti
- [x] Enterprise tier: 10 magaza limiti (veya sinirsiz)
- [x] Limit asildiginda uyari mesaji gosterilmeli
- [x] Plan yukseltme yonlendirmesi yapilmali
- [x] Mevcut kullanim / limit gosterilmeli

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
- [x] 1.1. `plans` tablosu olustur
  - id, name, store_limit, price_monthly, price_yearly, features_json, is_active
- [x] 1.2. Varsayilan planlari ekle (Free, Pro, Enterprise)
- [x] 1.3. `settings` tablosuna `pricing_enabled` key ekle
- [x] 1.4. `users` tablosuna `plan_id` foreign key ekle
- [x] 1.5. `users` tablosuna `grandfathered` boolean ekle

### Aşama 2: Backend - Pricing Toggle Mekanizmasi
- [x] 2.1. `PricingService` olustur
- [x] 2.2. `isPricingEnabled()` fonksiyonu
- [x] 2.3. Toggle state cache'leme (Redis)
- [x] 2.4. Admin toggle endpoint: `PUT /api/pricing/toggle`

### Aşama 3: Backend - Plan Yonetimi
- [x] 3.1. `PlanService` olustur
- [x] 3.2. `getUserPlan(userId)` fonksiyonu
- [x] 3.3. `getStoreLimit(planId)` fonksiyonu
- [x] 3.4. `canAddStore(userId)` fonksiyonu
- [x] 3.5. `getFeatureAccess(userId, featureName)` fonksiyonu

### Aşama 4: Backend - Limit Kontrol Middleware
- [x] 4.1. `StoreLimitGuard` olustur
- [x] 4.2. Magaza ekleme endpoint'ine guard ekle
- [x] 4.3. Limit asimi durumunda 403 + upgrade mesaji dondur

### Aşama 5: Backend - Ozellik Kisitlama
- [x] 5.1. `FeatureAccessGuard` olustur
- [x] 5.2. `RequireFeature` decorator olustur
- [ ] 5.3. Export endpoint'lerine middleware ekle (Phase 2)
- [ ] 5.4. API erisim endpoint'lerine middleware ekle (Phase 2)

### Aşama 6: Backend - API Endpoints
- [x] 6.1. `GET /api/pricing/plans` - Tum planlari listele
- [x] 6.2. `GET /api/pricing/my-plan` - Kullanicinin mevcut plani
- [x] 6.3. `GET /api/pricing/usage` - Kullanim durumu (magaza kullanimi)
- [x] 6.4. `POST /api/pricing/upgrade` - Plan yukseltme istegi

### Aşama 7: Backend - Grandfathering
- [x] 7.1. Mevcut kullanicilari grandfathered olarak isaretle
- [x] 7.2. Grandfathered kullanicilara mevcut limitleri koru
- [x] 7.3. POST /api/pricing/grandfather-users endpoint

### Aşama 8: Frontend - Plan Gosterimi
- [x] 8.1. `PlanBadge` komponenti (Free, Pro, Enterprise)
- [x] 8.2. Sidebar'da "Planlar" linki
- [x] 8.3. Kullanim durumu gosterimi (UsageWarning)

### Aşama 9: Frontend - Plan Karsilastirma Sayfasi
- [x] 9.1. `/pricing` sayfasi olustur
- [x] 9.2. Plan ozellik karsilastirma tablosu
- [x] 9.3. Plan secim kartlari
- [x] 9.4. Aylik/Yillik toggle

### Aşama 10: Frontend - Limit Uyarilari
- [x] 10.1. Limit yaklasildiginda uyari banner'i
- [x] 10.2. Limit asildiginda modal gosterimi (StoreLimitModal)
- [x] 10.3. "Plan Yukselt" CTA butonu

### Aşama 11: Frontend - Ozellik Kisitlama UI
- [ ] 11.1. Kisitli ozellikler icin "Pro'da mevcut" badge'i (Phase 2)
- [ ] 11.2. Disabled state butonlar (Phase 2)
- [ ] 11.3. Upgrade modal/tooltip (Phase 2)

### Aşama 12: Admin Panel (Opsiyonel - SaaS Sonrasi)
- [ ] 12.1. Admin pricing toggle UI
- [ ] 12.2. Plan duzenleme arayuzu
- [ ] 12.3. Kullanici plan atama

### Aşama 13: Test
- [x] 13.1. Plan limit kontrol testleri
- [x] 13.2. Feature access testleri
- [x] 13.3. Toggle mekanizmasi testleri
- [x] 13.4. Grandfathering testleri

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
- [x] TypeScript strict mode hatalari yok
- [x] Kod moduler ve tekrar yok
- [x] Ortak kodlar common'da
- [x] .env'de hassas bilgi yok (git'te)
- [x] Unit testler yazildi
- [x] Testler basarili geciyor (`npm run test`)
- [x] Clean code kurallarina uygun
- [x] Dokumantasyon guncellendi
- [x] Git commit atildi
