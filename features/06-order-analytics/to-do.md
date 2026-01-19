# 06 - Order Analytics (Siparis Analitikleri)

**Oncelik:** P0 (Must Have)
**Tahmini Sure:** 3-4 gun
**User Story:** US-005
**Functional Requirement:** FR-004

---

## Aciklama
Farkli zaman dilimlerinde siparis verilerini goruntuleme, satis trendlerini analiz etme ve magaza bazli dagilim gosterme.

---

## Yapilacaklar

### Backend - Order Sync
- [x] Orders tablosu olustur (Prisma)
- [ ] Order items tablosu olustur
- [x] WooCommerce'den siparisleri cek
- [x] Siparis durumlari: completed, processing, pending, cancelled, refunded
- [x] Sync job scheduler

### Backend - Order Endpoints
- [x] GET /orders/summary - Siparis ozeti (period parametresi ile)
- [x] GET /orders/trend - Siparis trendi (line chart data)
- [x] GET /orders/store-distribution - Magaza dagilimi (pie chart data)
- [x] GET /orders/recent - Son siparisler listesi
- [x] GET /orders/status-breakdown - Durum dagilimi

### Backend - Calculations
- [x] Toplam siparis sayisi (period bazli)
- [x] Toplam siparis tutari
- [x] Ortalama siparis degeri (AOV)
- [x] Period-over-period karsilastirma (%)
- [x] Gunluk/Haftalik granularity

### Backend - Caching
- [ ] Redis'te siparis aggregations cache'le
- [ ] Period bazli cache keys
- [ ] Cache invalidation on sync

### Frontend - Order Analytics Dashboard
- [x] Zaman filtresi
  - [x] Bugun
  - [x] Son 7 gun
  - [x] Son 30 gun
  - [x] Son 365 gun
  - [x] Ozel tarih araligi (date picker)
- [x] KPI Kartlari
  - [x] Toplam Siparis Sayisi
  - [x] Toplam Siparis Tutari (TL)
  - [x] Ortalama Siparis Degeri
  - [x] Period-over-period degisim (%)

### Frontend - Charts
- [x] Siparis Trendi (Line Chart)
  - [x] <30 gun: gunluk granularity
  - [x] >30 gun: haftalik granularity
  - [ ] Veri noktasina tikla -> detay goster
- [x] Magaza Dagilimi (Pie Chart)
  - [x] Magazalara gore siparis dagilimi
  - [x] Tutar ve yuzde gosterimi
- [x] Durum Dagilimi (Bar Chart)
  - [x] completed, processing, pending, cancelled

### Frontend - Recent Orders
- [x] Son 20 siparis listesi
- [x] Kolonlar: Siparis No, Tarih, Musteri, Tutar, Durum, Magaza
- [x] Siparisa tikla -> detay modal

### Frontend - Loading States
- [x] Skeleton loader for KPIs
- [x] Chart loading spinner
- [x] Table loading skeleton

---

## Kabul Kriterleri
- [x] AC-005.1: Zaman filtresi calisir (Bugun, 7 gun, 30 gun, 365 gun, Ozel)
- [x] AC-005.2: Toplam siparis sayisi dogru gosterilir
- [x] AC-005.3: Toplam siparis tutari TL ile binlik ayirici gosterilir
- [x] AC-005.4: Ortalama siparis degeri hesaplanir ve gosterilir
- [x] AC-005.5: Magaza dagilimi pie chart'ta gosterilir
- [x] AC-005.6: Siparis trendi line chart'ta gosterilir (gunluk/haftalik)
- [x] AC-005.7: Period-over-period karsilastirma yuzde olarak gosterilir (+12%)
- [x] AC-005.8: Siparis durum dagilimi gosterilir
- [ ] AC-005.9: Chart veri noktasina tiklaninca detay gosterilir
- [x] AC-005.10: Veriler yuklenirken loading skeleton gosterilir

---

## Teknik Notlar
- Polaris data visualization entegrasyonu
- Recharts veya Polaris chart components
- Server-side aggregation for performance
- Period-based caching strategy

---

## Bagimliliklar
- 01-project-setup tamamlanmis olmali
- 03-store-connection tamamlanmis olmali

---

## Commit Mesaji Formati
```
feat(orders): Implement order analytics dashboard

- Add order sync from WooCommerce stores
- Create period-based analytics calculations
- Implement trend and distribution visualizations
- Add recent orders list with filtering
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
