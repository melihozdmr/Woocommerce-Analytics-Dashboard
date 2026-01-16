# Feature 12: Veri Disa Aktarma (Data Export)

## Ilgili User Story
**US-011: Veri Disa Aktarma**
- **Oncelik:** P1 (Should Have)
- **Tahmin:** M (Medium)

## Ilgili Fonksiyonel Gereksinim
**FR-012: Disa Aktarma**
- CSV export
- PDF export
- Tarih araligi filtresi
- Magaza filtresi

---

## Kabul Kriterleri
- [ ] CSV formati desteklenmeli
- [ ] PDF formati desteklenmeli
- [ ] Tarih araligi secimi yapilabilmeli
- [ ] Magaza filtresi uygulanabilmeli
- [ ] Dosya otomatik indirilmeli
- [ ] Turkce karakter destegi olmali

---

## Yapilacaklar

### Aşama 1: Backend - CSV Export Servisi
- [ ] 1.1. `ExportService` olustur
- [ ] 1.2. CSV dosya olusturma fonksiyonu
- [ ] 1.3. Turkce karakter destegi (UTF-8 BOM)
- [ ] 1.4. Buyuk veri setleri icin streaming

### Aşama 2: Backend - PDF Export Servisi
- [ ] 2.1. PDF kutuphanesi entegrasyonu (pdfkit veya puppeteer)
- [ ] 2.2. PDF sablon tasarimi
- [ ] 2.3. Tablo formatinda veri gosterimi
- [ ] 2.4. Logo ve baslik ekleme
- [ ] 2.5. Turkce font destegi

### Aşama 3: Backend - Rapor Tipleri
- [ ] 3.1. Stok raporu export
  - Urun adi, SKU, Stok adedi, Stok degeri, Magaza
- [ ] 3.2. Siparis raporu export
  - Siparis no, Tarih, Musteri, Tutar, Durum, Magaza
- [ ] 3.3. Odeme raporu export
  - Tarih, Tutar, Yontem, Siparis no, Magaza
- [ ] 3.4. Kar raporu export
  - Urun, Satis, Alis, Brut Kar, Net Kar, Marj
- [ ] 3.5. Iade raporu export
  - Siparis no, Tarih, Tutar, Neden, Magaza

### Aşama 4: Backend - Filtreleme
- [ ] 4.1. Tarih araligi filtresi
- [ ] 4.2. Magaza filtresi (tekli/coklu)
- [ ] 4.3. Durum filtresi (siparis durumu vb.)
- [ ] 4.4. Filtre parametrelerini validate et

### Aşama 5: Backend - API Endpoints
- [ ] 5.1. `POST /api/export/csv` - CSV export
  - Body: { reportType, filters, columns }
- [ ] 5.2. `POST /api/export/pdf` - PDF export
  - Body: { reportType, filters, columns }
- [ ] 5.3. Content-Disposition header ile dosya adi
- [ ] 5.4. Plan bazli erisim kontrolu (Pro+ only)

### Aşama 6: Backend - Performans
- [ ] 6.1. Buyuk veri setleri icin pagination/chunking
- [ ] 6.2. Background job olarak export (cok buyuk veriler)
- [ ] 6.3. Export status endpoint (opsiyonel)

### Aşama 7: Frontend - Export Modal
- [ ] 7.1. `ExportModal` komponenti
- [ ] 7.2. Rapor tipi secimi
- [ ] 7.3. Format secimi (CSV/PDF)
- [ ] 7.4. Tarih araligi secimi (DatePicker)
- [ ] 7.5. Magaza filtresi (multi-select)

### Aşama 8: Frontend - Kolon Secimi
- [ ] 8.1. Export edilecek kolonlari secme
- [ ] 8.2. Varsayilan kolon secimi
- [ ] 8.3. "Tumunu Sec" / "Temizle" butonlari

### Aşama 9: Frontend - Indirme Deneyimi
- [ ] 9.1. Export butonu (her rapor sayfasinda)
- [ ] 9.2. Loading state gosterimi
- [ ] 9.3. Basarili indirme mesaji
- [ ] 9.4. Hata durumunda mesaj

### Aşama 10: Frontend - Plan Kisitlama UI
- [ ] 10.1. Free kullanicilar icin "Pro'da mevcut" mesaji
- [ ] 10.2. Upgrade CTA butonu
- [ ] 10.3. Disabled export butonu (Free tier)

### Aşama 11: Test
- [ ] 11.1. CSV olusturma testleri
- [ ] 11.2. PDF olusturma testleri
- [ ] 11.3. Turkce karakter testleri
- [ ] 11.4. Buyuk veri seti testleri
- [ ] 11.5. API endpoint testleri

---

## API Request/Response Ornekleri

```javascript
// CSV Export Request
POST /api/export/csv
{
  "reportType": "orders", // orders, products, payments, profits, refunds
  "format": "csv",
  "filters": {
    "startDate": "2026-01-01",
    "endDate": "2026-01-31",
    "storeIds": [1, 2],
    "status": ["completed", "processing"]
  },
  "columns": ["orderNo", "date", "customer", "total", "status", "store"]
}

// Response: File download (application/octet-stream)
// Content-Disposition: attachment; filename="orders_2026-01-01_2026-01-31.csv"
```

---

## CSV Format Ornegi

```csv
Siparis No,Tarih,Musteri,Tutar,Durum,Magaza
#1234,2026-01-15,Ahmet Yilmaz,"250,00 TL",Tamamlandi,E-Shop TR
#1235,2026-01-15,Mehmet Demir,"180,50 TL",Beklemede,ModaStore
#1236,2026-01-14,Ayse Kaya,"420,00 TL",Tamamlandi,E-Shop TR
```

---

## PDF Sablon Yapisi

```
┌─────────────────────────────────────────────────────────┐
│  [Logo]    WooCommerce Analytics Dashboard              │
│            Siparis Raporu                               │
│            01.01.2026 - 31.01.2026                     │
├─────────────────────────────────────────────────────────┤
│  Magaza: E-Shop TR, ModaStore                          │
│  Olusturulma: 16.01.2026 15:30                         │
├─────────────────────────────────────────────────────────┤
│  Siparis No │ Tarih    │ Musteri      │ Tutar    │ ... │
│  ───────────┼──────────┼──────────────┼──────────┼─────│
│  #1234      │ 15.01.26 │ Ahmet Yilmaz │ 250,00TL │ ... │
│  #1235      │ 15.01.26 │ Mehmet Demir │ 180,50TL │ ... │
└─────────────────────────────────────────────────────────┘
│  Sayfa 1/5                                              │
└─────────────────────────────────────────────────────────┘
```

---

## Teknik Notlar
- CSV icin UTF-8 BOM eklenmeli (Excel uyumlulugu)
- PDF icin Turkce font embed edilmeli (Noto Sans vb.)
- Buyuk veri setlerinde (>10.000 satir) background job kullan
- Export dosyalari gecici olarak saklanip temizlenmeli
- Plan kontrolu middleware ile yapilmali

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
