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

- [ ] Payment analytics icin cache tablosu olustur (analytics_cache)
- [ ] Payment method enum tanimla (credit_card, bank_transfer, cash_on_delivery)
- [ ] Payment status tracking icin gerekli alanlari ekle

### API Endpoints

- [ ] `GET /api/payments/summary` - Donem bazli odeme ozeti
- [ ] `GET /api/payments/methods` - Odeme yontemi dagilimi
- [ ] `GET /api/payments/pending` - Bekleyen odemeler listesi
- [ ] `GET /api/payments/trends` - Odeme trend verileri
- [ ] `GET /api/payments/transactions/:methodId` - Yonteme gore detayli islemler

### Service Katmani

- [ ] PaymentAnalyticsService olustur
- [ ] WooCommerce'den odeme verilerini cek (order payment_method, payment_method_title)
- [ ] Donem bazli filtreleme implementasyonu (today, 7d, 30d, 365d, custom)
- [ ] Toplam odeme tutari hesaplama
- [ ] Odeme yontemi dagilimi analizi
- [ ] Bekleyen odeme tutari hesaplama
- [ ] Tamamlanan vs iptal edilen odeme karsilastirmasi
- [ ] Ortalama odeme isleme suresi hesaplama
- [ ] Odeme basari orani hesaplama (%)
- [ ] Magaza bazli filtreleme
- [ ] Redis cache entegrasyonu (5 dakika TTL)

### Veri Senkronizasyonu

- [ ] Payment data sync job olustur
- [ ] Incremental sync implementasyonu
- [ ] Cache invalidation mekanizmasi

---

## Frontend Gorevleri

### Sayfalar

- [ ] `/payments` - Odeme analitikleri sayfasi olustur
- [ ] Sayfa layout'unu Polaris Frame ile olustur

### Bilesenler

- [ ] PaymentSummaryCard - Toplam odeme tutari karti
- [ ] PaymentMethodsChart - Odeme yontemi dagilimi (Bar chart)
- [ ] PendingPaymentsSection - Bekleyen odemeler bolumu
- [ ] PaymentTrendChart - Odeme trend grafigi (Line chart)
- [ ] PaymentSuccessRateCard - Basari orani karti
- [ ] TransactionDetailModal - Islem detay modal

### UI/UX

- [ ] Time period filter (Order analytics ile tutarli)
- [ ] Store filter dropdown
- [ ] Loading skeleton states
- [ ] Empty state tasarimi
- [ ] Error state handling
- [ ] Responsive tasarim (tablet/mobile)

### State Management

- [ ] Payment analytics icin React Query hooks
- [ ] Filter state yonetimi (Zustand)
- [ ] Cache invalidation stratejisi

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

- [ ] AC-006.1: Time period filters order analytics ile tutarli
- [ ] AC-006.2: Toplam odeme tutari donem icin gosteriliyor
- [ ] AC-006.3: Odeme yontemi dagilimi: kredi karti, banka transferi, kapida odeme
- [ ] AC-006.4: Bar chart ile odeme yontemleri gorsellestiriliyor
- [ ] AC-006.5: Bekleyen odemeler bolumu toplam tutarla birlikte
- [ ] AC-006.6: Tamamlanan vs iptal edilen odeme karsilastirmasi
- [ ] AC-006.7: Ortalama odeme isleme suresi gosteriliyor
- [ ] AC-006.8: Odeme basari orani yuzde olarak gosteriliyor
- [ ] AC-006.9: Magaza filtresi mevcut
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
| Backend Baslangic | [ ] | |
| Backend Tamamlandi | [ ] | |
| Frontend Baslangic | [ ] | |
| Frontend Tamamlandi | [ ] | |
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
