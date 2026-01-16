# Feature 08: Kar Marji Hesaplama (Profit Calculation)

## Ilgili User Story
**US-007: Kar Marji Hesaplama**
- **Oncelik:** P0 (Must Have)
- **Tahmin:** L (Large)

## Ilgili Fonksiyonel Gereksinim
**FR-006: Finansal Hesaplamalar**
- Alis fiyati cekme (custom field: `_purchase_price`)
- Brut kar hesaplama
- Komisyon kesintisi hesaplama
- Kargo maliyeti kesintisi
- Net kar ve kar marji hesaplama

---

## Kabul Kriterleri
- [ ] Brut kar = Satis fiyati - Alis fiyati
- [ ] Net kar = Brut kar - Komisyon - Kargo maliyeti
- [ ] Kar marji yuzdesi hesaplanmali
- [ ] Urun bazli kar analizi yapilabilmeli
- [ ] Donem bazli kar karsilastirmasi olmali
- [ ] Negatif kar (zarar) durumu kirmizi ile gosterilmeli

---

## Yapilacaklar

### Aşama 1: Backend - Veritabani Hazirlik
- [ ] 1.1. Kar hesaplama icin gerekli tablo yapisi kontrol et
- [ ] 1.2. WooCommerce'den `_purchase_price` meta verisi cekme fonksiyonu
- [ ] 1.3. Alis fiyati olmayan urunler icin fallback mekanizmasi

### Aşama 2: Backend - Kar Hesaplama Servisi
- [ ] 2.1. `ProfitService` olustur
- [ ] 2.2. Brut kar hesaplama fonksiyonu: `calculateGrossProfit(salePrice, purchasePrice)`
- [ ] 2.3. Net kar hesaplama fonksiyonu: `calculateNetProfit(grossProfit, commission, shippingCost)`
- [ ] 2.4. Kar marji hesaplama fonksiyonu: `calculateProfitMargin(netProfit, salePrice)`
- [ ] 2.5. Urun bazli kar hesaplama
- [ ] 2.6. Siparis bazli kar hesaplama (coklu urun)
- [ ] 2.7. Donem bazli toplam kar hesaplama

### Aşama 3: Backend - API Endpoints
- [ ] 3.1. `GET /api/analytics/profit` - Genel kar ozeti
- [ ] 3.2. `GET /api/analytics/profit/products` - Urun bazli kar listesi
- [ ] 3.3. `GET /api/analytics/profit/orders` - Siparis bazli kar listesi
- [ ] 3.4. `GET /api/analytics/profit/trends` - Kar trend verileri
- [ ] 3.5. Tarih araligi filtreleme (bugun, hafta, ay, yil)
- [ ] 3.6. Magaza bazli filtreleme

### Aşama 4: Backend - Validasyon ve Hata Yonetimi
- [ ] 4.1. Negatif fiyat kontrolu
- [ ] 4.2. Eksik veri durumunda hata mesaji
- [ ] 4.3. Buyuk veri setleri icin pagination

### Aşama 5: Frontend - Kar Dashboard Komponenti
- [ ] 5.1. `ProfitSummaryCard` komponenti (Toplam Kar, Kar Marji)
- [ ] 5.2. Negatif kar (zarar) icin kirmizi stil
- [ ] 5.3. Pozitif kar icin yesil stil
- [ ] 5.4. Onceki doneme gore degisim yuzdesi gosterimi

### Aşama 6: Frontend - Urun Bazli Kar Tablosu
- [ ] 6.1. `ProductProfitTable` komponenti
- [ ] 6.2. Kolonlar: Urun Adi, Satis Fiyati, Alis Fiyati, Brut Kar, Net Kar, Kar Marji
- [ ] 6.3. Siralama ozelligi (kar marjina gore)
- [ ] 6.4. Arama/filtreleme ozelligi

### Aşama 7: Frontend - Kar Trend Grafigi
- [ ] 7.1. Cizgi grafik komponenti (Recharts)
- [ ] 7.2. Donem bazli kar gosterimi
- [ ] 7.3. Brut kar vs Net kar karsilastirmasi

### Aşama 8: Frontend - Donem Karsilastirma
- [ ] 8.1. Onceki donem ile karsilastirma ozelligi
- [ ] 8.2. Aylik/Haftalik kar karsilastirmasi
- [ ] 8.3. Yuzdesel degisim gosterimi

### Aşama 9: Test
- [ ] 9.1. Backend unit testleri (kar hesaplama fonksiyonlari)
- [ ] 9.2. API endpoint testleri
- [ ] 9.3. Frontend component testleri

### Aşama 10: Entegrasyon ve Son Kontrol
- [ ] 10.1. Ana dashboard'a kar widget'i ekle
- [ ] 10.2. Magaza ayarlarindan komisyon/kargo degerleri ile entegrasyon
- [ ] 10.3. End-to-end test

---

## Ornek Hesaplama

```
Urun: Ornek T-Shirt
Satis Fiyati: 299.00 TL
Alis Fiyati: 120.00 TL
Magaza Komisyonu: %10 (29.90 TL)
Kargo Maliyeti: 15.00 TL

Brut Kar = 299.00 - 120.00 = 179.00 TL
Net Kar = 179.00 - 29.90 - 15.00 = 134.10 TL
Kar Marji = (134.10 / 299.00) * 100 = %44.85
```

---

## Teknik Notlar
- Alis fiyati WooCommerce'de `_purchase_price` custom field'inda saklanir
- Alis fiyati yoksa, bu urun kar hesaplamasinda "belirsiz" olarak isaretlenir
- Komisyon ve kargo maliyeti magaza ayarlarindan alinir

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
