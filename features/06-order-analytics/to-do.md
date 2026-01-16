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
- [ ] Orders tablosu olustur (Prisma)
- [ ] Order items tablosu olustur
- [ ] WooCommerce'den siparisleri cek
- [ ] Siparis durumlari: completed, processing, pending, cancelled, refunded
- [ ] Sync job scheduler

### Backend - Order Endpoints
- [ ] GET /orders/summary - Siparis ozeti (period parametresi ile)
- [ ] GET /orders/trend - Siparis trendi (line chart data)
- [ ] GET /orders/distribution - Magaza dagilimi (pie chart data)
- [ ] GET /orders/recent - Son siparisler listesi
- [ ] GET /orders/status-breakdown - Durum dagilimi

### Backend - Calculations
- [ ] Toplam siparis sayisi (period bazli)
- [ ] Toplam siparis tutari
- [ ] Ortalama siparis degeri (AOV)
- [ ] Period-over-period karsilastirma (%)
- [ ] Gunluk/Haftalik granularity

### Backend - Caching
- [ ] Redis'te siparis aggregations cache'le
- [ ] Period bazli cache keys
- [ ] Cache invalidation on sync

### Frontend - Order Analytics Dashboard
- [ ] Zaman filtresi
  - [ ] Bugun
  - [ ] Son 7 gun
  - [ ] Son 30 gun
  - [ ] Son 365 gun
  - [ ] Ozel tarih araligi (date picker)
- [ ] KPI Kartlari
  - [ ] Toplam Siparis Sayisi
  - [ ] Toplam Siparis Tutari (TL)
  - [ ] Ortalama Siparis Degeri
  - [ ] Period-over-period degisim (%)

### Frontend - Charts
- [ ] Siparis Trendi (Line Chart)
  - [ ] <30 gun: gunluk granularity
  - [ ] >30 gun: haftalik granularity
  - [ ] Veri noktasina tikla -> detay goster
- [ ] Magaza Dagilimi (Pie Chart)
  - [ ] Magazalara gore siparis dagilimi
  - [ ] Tutar ve yuzde gosterimi
- [ ] Durum Dagilimi (Bar Chart)
  - [ ] completed, processing, pending, cancelled

### Frontend - Recent Orders
- [ ] Son 20 siparis listesi
- [ ] Kolonlar: Siparis No, Tarih, Musteri, Tutar, Durum, Magaza
- [ ] Siparisa tikla -> detay modal

### Frontend - Loading States
- [ ] Skeleton loader for KPIs
- [ ] Chart loading spinner
- [ ] Table loading skeleton

---

## Kabul Kriterleri
- [ ] AC-005.1: Zaman filtresi calisir (Bugun, 7 gun, 30 gun, 365 gun, Ozel)
- [ ] AC-005.2: Toplam siparis sayisi dogru gosterilir
- [ ] AC-005.3: Toplam siparis tutari TL ile binlik ayirici gosterilir
- [ ] AC-005.4: Ortalama siparis degeri hesaplanir ve gosterilir
- [ ] AC-005.5: Magaza dagilimi pie chart'ta gosterilir
- [ ] AC-005.6: Siparis trendi line chart'ta gosterilir (gunluk/haftalik)
- [ ] AC-005.7: Period-over-period karsilastirma yuzde olarak gosterilir (+12%)
- [ ] AC-005.8: Siparis durum dagilimi gosterilir
- [ ] AC-005.9: Chart veri noktasina tiklaninca detay gosterilir
- [ ] AC-005.10: Veriler yuklenirken loading skeleton gosterilir

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
