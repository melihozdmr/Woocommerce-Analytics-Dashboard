# 07 - Payment Analytics (Odeme Analitikleri)

**Oncelik:** P0 (Must Have)
**Tahmini Sure:** Large (5 story points)
**Bagimliliklar:** 06-order-analytics

---

## Ozet

Kullanici olarak bir magaza sahibi, odeme verilerini donem bazli gorebilmeli ve nakit akisini takip edebilmelidir.

---

## Backend Gorevleri

### Veritabani

- [x] Payment analytics icin cache tablosu olustur (analytics_cache)
- [x] Payment method enum tanimla (credit_card, bank_transfer, cash_on_delivery)
- [x] Payment status tracking icin gerekli alanlari ekle

### API Endpoints

- [x] `GET /api/payments/summary` - Donem bazli odeme ozeti
- [x] `GET /api/payments/methods` - Odeme yontemi dagilimi
- [x] `GET /api/payments/pending` - Bekleyen odemeler listesi
- [ ] `GET /api/payments/trends` - Odeme trend verileri
- [ ] `GET /api/payments/transactions/:methodId` - Yonteme gore detayli islemler

### Service Katmani

- [x] PaymentAnalyticsService olustur (OrderService icinde)
- [x] WooCommerce'den odeme verilerini cek (order payment_method, payment_method_title)
- [x] Donem bazli filtreleme implementasyonu (today, 7d, 30d, 365d, custom)
- [x] Toplam odeme tutari hesaplama
- [x] Odeme yontemi dagilimi analizi
- [x] Bekleyen odeme tutari hesaplama
- [x] Tamamlanan vs iptal edilen odeme karsilastirmasi
- [ ] Ortalama odeme isleme suresi hesaplama
- [x] Odeme basari orani hesaplama (%)
- [x] Magaza bazli filtreleme
- [x] Redis cache entegrasyonu (5 dakika TTL)

### Veri Senkronizasyonu

- [x] Payment data sync job olustur (Order sync ile birlikte)
- [x] Incremental sync implementasyonu
- [x] Cache invalidation mekanizmasi

---

## Frontend Gorevleri

### Sayfalar

- [x] `/payments` - Odeme analitikleri sayfasi olustur
- [x] Sayfa layout'unu Polaris Frame ile olustur

### Bilesenler

- [x] PaymentSummaryCard - Toplam odeme tutari karti
- [x] PaymentMethodsChart - Odeme yontemi dagilimi (Bar chart)
- [x] PendingPaymentsSection - Bekleyen odemeler bolumu
- [ ] PaymentTrendChart - Odeme trend grafigi (Line chart)
- [x] PaymentSuccessRateCard - Basari orani karti
- [ ] TransactionDetailModal - Islem detay modal

### UI/UX

- [x] Time period filter (Order analytics ile tutarli)
- [x] Store filter dropdown
- [x] Loading skeleton states
- [x] Empty state tasarimi
- [ ] Error state handling
- [ ] Responsive tasarim (tablet/mobile)

### State Management

- [x] Payment analytics icin Zustand store
- [x] Filter state yonetimi (Zustand)
- [x] Cache invalidation stratejisi

---

## Polaris Bilesenleri Kullanilacak

- Card, Badge, Text (KPI kartlari)
- Select (filtreler)
- Spinner (loading)
- Banner (hata/uyari)
- Modal (detay goruntuleme)
- Recharts entegrasyonu (grafikler)

---

## Acceptance Criteria

- [x] AC-006.1: Time period filters order analytics ile tutarli
- [x] AC-006.2: Toplam odeme tutari donem icin gosteriliyor
- [x] AC-006.3: Odeme yontemi dagilimi: kredi karti, banka transferi, kapida odeme
- [x] AC-006.4: Bar chart ile odeme yontemleri gorsellestiriliyor
- [x] AC-006.5: Bekleyen odemeler bolumu toplam tutarla birlikte
- [x] AC-006.6: Tamamlanan vs iptal edilen odeme karsilastirmasi
- [ ] AC-006.7: Ortalama odeme isleme suresi gosteriliyor
- [x] AC-006.8: Odeme basari orani yuzde olarak gosteriliyor
- [x] AC-006.9: Magaza filtresi mevcut
- [ ] AC-006.10: Odeme yontemine tiklandiginda detayli islemler gosteriliyor

---

## Test Gereksinimleri

- [ ] Unit tests: PaymentAnalyticsService
- [ ] Unit tests: Payment hesaplama fonksiyonlari
- [ ] Integration tests: Payment API endpoints
- [ ] E2E tests: Odeme analitikleri sayfasi akisi
- [ ] Edge case: Odeme verisi olmayan magaza
- [ ] Edge case: Farkli odeme gateway'leri

---

## Notlar

- WooCommerce payment gateway verileri farklilik gosterebilir, graceful handling gerekli
- Farkli odeme yontemlerinin isimleri WooCommerce ayarlarina gore degisebilir
- Bekleyen odemeler icin "on-hold" ve "pending" statusleri kontrol edilmeli

---

## Ilerleme

| Asama | Durum | Tarih |
|-------|-------|-------|
| Backend Baslangic | [x] | 2026-01-19 |
| Backend Tamamlandi | [x] | 2026-01-19 |
| Frontend Baslangic | [x] | 2026-01-19 |
| Frontend Tamamlandi | [x] | 2026-01-19 |
| Testler Tamamlandi | [ ] | |
| Code Review | [ ] | |
| **TAMAMLANDI** | [ ] | |

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
