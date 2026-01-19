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
- [x] Toplam iade sayisi gosterilmeli
- [x] Toplam iade tutari (TL) gosterilmeli
- [x] Iade orani (%) hesaplanmali
- [x] Iade nedenleri (varsa) listelenmeli
- [x] Donem bazli iade trend grafigi
- [x] Magaza bazli iade karsilastirmasi

---

## Yapilacaklar

### Aşama 1: Backend - WooCommerce Iade Verisi Cekme
- [x] 1.1. WooCommerce API'den `refunded` statuslu siparisleri cekme
- [x] 1.2. Kismi iade (partial refund) verilerini cekme
- [x] 1.3. Iade nedeni (refund reason) alanini cekme
- [x] 1.4. Iade tarihini cekme

### Aşama 2: Backend - Veritabani
- [x] 2.1. Iade verilerini cache'leme yapisi
- [x] 2.2. `Refund` tablosu olusturma
- [x] 2.3. Iade verilerini senkronize etme

### Aşama 3: Backend - Iade Hesaplama Servisi
- [x] 3.1. `RefundService` olustur
- [x] 3.2. Toplam iade sayisi hesaplama
- [x] 3.3. Toplam iade tutari hesaplama
- [x] 3.4. Iade orani hesaplama: `(iade_sayisi / toplam_siparis) * 100`
- [x] 3.5. Iade nedeni gruplama
- [x] 3.6. Donem bazli iade agregasyonu

### Aşama 4: Backend - API Endpoints
- [x] 4.1. `GET /companies/:id/refunds/summary` - Iade ozeti
- [x] 4.2. `GET /companies/:id/refunds/list` - Iade listesi (detayli)
- [x] 4.3. `GET /companies/:id/refunds/reasons` - Iade nedenleri dagilimi
- [x] 4.4. `GET /companies/:id/refunds/trend` - Iade trend verileri
- [x] 4.5. Tarih araligi filtreleme
- [x] 4.6. Magaza bazli filtreleme

### Aşama 5: Frontend - Iade Ozet Karti
- [x] 5.1. KPI kartlari (Toplam Iade, Iade Tutari, Iade Orani, Ort. Iade)
- [x] 5.2. Toplam iade sayisi gosterimi
- [x] 5.3. Toplam iade tutari gosterimi
- [x] 5.4. Iade orani gosterimi (yuzde)
- [x] 5.5. Onceki doneme gore degisim

### Aşama 6: Frontend - Iade Listesi Tablosu
- [x] 6.1. Iade listesi tablosu
- [x] 6.2. Kolonlar: Siparis No, Tarih, Tutar, Neden, Magaza
- [x] 6.3. Siralama ozelligi
- [x] 6.4. Pagination
- [x] 6.5. Arama/filtreleme

### Aşama 7: Frontend - Iade Trend Grafigi
- [x] 7.1. Area chart komponenti (Recharts)
- [x] 7.2. Gunluk iade trendi
- [x] 7.3. Onceki donem karsilastirmasi

### Aşama 8: Frontend - Iade Nedenleri Grafigi
- [x] 8.1. Pie chart komponenti
- [x] 8.2. Iade nedenlerinin dagilimi
- [x] 8.3. En sik iade nedeni vurgulama

### Aşama 9: Frontend - Magaza Karsilastirmasi
- [x] 9.1. Bar chart komponenti
- [x] 9.2. Magaza bazli iade orani karsilastirmasi
- [x] 9.3. Hangi magazada daha cok iade var gosterimi

### Aşama 10: Test
- [x] 10.1. Backend unit testleri
- [x] 10.2. API endpoint testleri
- [ ] 10.3. Frontend component testleri

### Aşama 11: Entegrasyon
- [x] 11.1. Ana dashboard'a iade widget'i ekle
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
- [x] TypeScript strict mode hatalari yok
- [x] Kod moduler ve tekrar yok
- [x] Ortak kodlar common'da
- [x] .env'de hassas bilgi yok (git'te)
- [x] Unit testler yazildi
- [x] Testler basarili geciyor (`npm run test`)
- [x] Clean code kurallarina uygun
- [x] Dokumantasyon guncellendi
- [ ] Git commit atildi
