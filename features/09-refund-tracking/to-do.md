# Feature 09: Iade/Iptal Takibi (Refund Tracking)

## Ilgili User Story
**US-008: Iade/Iptal Takibi**
- **Oncelik:** P0 (Must Have)
- **Tahmin:** M (Medium)

## Ilgili Fonksiyonel Gereksinim
**FR-007: Iade Takibi**
- Iade edilen siparis listesi
- Toplam iade tutari
- Iade orani hesaplama
- Donem bazli iade trend

---

## Kabul Kriterleri
- [ ] Toplam iade sayisi gosterilmeli
- [ ] Toplam iade tutari (TL) gosterilmeli
- [ ] Iade orani (%) hesaplanmali
- [ ] Iade nedenleri (varsa) listelenmeli
- [ ] Donem bazli iade trend grafigi
- [ ] Magaza bazli iade karsilastirmasi

---

## Yapilacaklar

### Aşama 1: Backend - WooCommerce Iade Verisi Cekme
- [ ] 1.1. WooCommerce API'den `refunded` statuslu siparisleri cekme
- [ ] 1.2. Kismi iade (partial refund) verilerini cekme
- [ ] 1.3. Iade nedeni (refund reason) alanini cekme
- [ ] 1.4. Iade tarihini cekme

### Aşama 2: Backend - Veritabani
- [ ] 2.1. Iade verilerini cache'leme yapisi
- [ ] 2.2. `store_data` tablosunda `refunds` data_type ekleme
- [ ] 2.3. Iade verilerini senkronize etme

### Aşama 3: Backend - Iade Hesaplama Servisi
- [ ] 3.1. `RefundService` olustur
- [ ] 3.2. Toplam iade sayisi hesaplama
- [ ] 3.3. Toplam iade tutari hesaplama
- [ ] 3.4. Iade orani hesaplama: `(iade_sayisi / toplam_siparis) * 100`
- [ ] 3.5. Iade nedeni gruplama
- [ ] 3.6. Donem bazli iade agregasyonu

### Aşama 4: Backend - API Endpoints
- [ ] 4.1. `GET /api/analytics/refunds` - Iade ozeti
- [ ] 4.2. `GET /api/analytics/refunds/list` - Iade listesi (detayli)
- [ ] 4.3. `GET /api/analytics/refunds/reasons` - Iade nedenleri dagilimi
- [ ] 4.4. `GET /api/analytics/refunds/trends` - Iade trend verileri
- [ ] 4.5. Tarih araligi filtreleme
- [ ] 4.6. Magaza bazli filtreleme

### Aşama 5: Frontend - Iade Ozet Karti
- [ ] 5.1. `RefundSummaryCard` komponenti
- [ ] 5.2. Toplam iade sayisi gosterimi
- [ ] 5.3. Toplam iade tutari gosterimi
- [ ] 5.4. Iade orani gosterimi (yuzde)
- [ ] 5.5. Onceki doneme gore degisim

### Aşama 6: Frontend - Iade Listesi Tablosu
- [ ] 6.1. `RefundListTable` komponenti
- [ ] 6.2. Kolonlar: Siparis No, Tarih, Tutar, Neden, Magaza
- [ ] 6.3. Siralama ozelligi
- [ ] 6.4. Pagination
- [ ] 6.5. Arama/filtreleme

### Aşama 7: Frontend - Iade Trend Grafigi
- [ ] 7.1. Cizgi grafik komponenti (Recharts)
- [ ] 7.2. Gunluk/Haftalik/Aylik iade trendi
- [ ] 7.3. Onceki donem karsilastirmasi

### Aşama 8: Frontend - Iade Nedenleri Grafigi
- [ ] 8.1. Pie chart komponenti
- [ ] 8.2. Iade nedenlerinin dagilimi
- [ ] 8.3. En sik iade nedeni vurgulama

### Aşama 9: Frontend - Magaza Karsilastirmasi
- [ ] 9.1. Bar chart komponenti
- [ ] 9.2. Magaza bazli iade orani karsilastirmasi
- [ ] 9.3. Hangi magazada daha cok iade var gosterimi

### Aşama 10: Test
- [ ] 10.1. Backend unit testleri
- [ ] 10.2. API endpoint testleri
- [ ] 10.3. Frontend component testleri

### Aşama 11: Entegrasyon
- [ ] 11.1. Ana dashboard'a iade widget'i ekle
- [ ] 11.2. Kar hesaplamasinda iade etkisini dahil et
- [ ] 11.3. End-to-end test

---

## WooCommerce API Notlari

```javascript
// Iade edilmis siparisleri cekme
GET /wp-json/wc/v3/orders?status=refunded&per_page=100

// Siparis detayinda iade bilgisi
// Response icinde refunds array'i:
{
  "refunds": [
    {
      "id": 123,
      "reason": "Urun hasarli geldi",
      "total": "-150.00"
    }
  ]
}
```

---

## Metrik Formuller

```
Iade Orani = (Iade Edilen Siparis Sayisi / Toplam Siparis Sayisi) * 100

Ornek:
Toplam Siparis: 500
Iade Edilen: 25
Iade Orani = (25 / 500) * 100 = %5
```

---

## UI/UX Notlari
- Yuksek iade orani (>%10) kirmizi ile vurgulanmali
- Normal iade orani (%5-%10) sari ile gosterilmeli
- Dusuk iade orani (<%5) yesil ile gosterilmeli

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
