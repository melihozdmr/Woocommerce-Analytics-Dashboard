# Feature 11: Urun Eslestirme (Product Mapping)

## Ilgili User Story
**US-010: Urun Eslestirme (Cross-Store)**
- **Oncelik:** P1 (Should Have)
- **Tahmin:** L (Large)

## Ilgili Fonksiyonel Gereksinim
**FR-011: Urun Eslestirme**
- SKU bazli otomatik eslestirme
- Manuel eslestirme arayuzu
- Eslestirme onerileri
- Konsolide raporlama

---

## Kabul Kriterleri
- [ ] SKU bazli otomatik eslestirme yapilabilmeli
- [ ] Manuel eslestirme secenegi olmali
- [ ] Eslesmis urunler tek satirda gosterilmeli
- [ ] Toplam stok eslesmis urunler icin birlesmeli
- [ ] Eslestirme kaldirabilmeli
- [ ] Eslestirme onerileri sunulmali

---

## Yapilacaklar

### Aşama 1: Veritabani - Eslestirme Tablolari
- [ ] 1.1. `product_mappings` tablosu olustur
  - id, user_id, master_sku, created_at
- [ ] 1.2. `product_mapping_items` tablosu olustur
  - id, mapping_id, store_id, product_id, sku
- [ ] 1.3. Indexler olustur (user_id, master_sku)

### Aşama 2: Backend - Otomatik Eslestirme Servisi
- [ ] 2.1. `ProductMappingService` olustur
- [ ] 2.2. SKU eslestirme algoritmasi
  - Ayni SKU'ya sahip urunleri grupla
  - Farkli magazalardaki eslesmeleri bul
- [ ] 2.3. Eslestirme onerileri olusturma
- [ ] 2.4. Benzer isim/SKU eslestirme (fuzzy matching)

### Aşama 3: Backend - Manuel Eslestirme
- [ ] 3.1. Eslestirme olusturma fonksiyonu
- [ ] 3.2. Eslestirme guncelleme fonksiyonu
- [ ] 3.3. Eslestirme silme fonksiyonu
- [ ] 3.4. Eslestirmeye urun ekleme/cikarma

### Aşama 4: Backend - Konsolide Veri
- [ ] 4.1. Eslenmis urunler icin toplam stok hesaplama
- [ ] 4.2. Eslenmis urunler icin toplam satis hesaplama
- [ ] 4.3. Eslenmis urunler icin birlesik kar hesaplama

### Aşama 5: Backend - API Endpoints
- [ ] 5.1. `GET /api/products/mappings` - Eslestirme listesi
- [ ] 5.2. `POST /api/products/mappings` - Yeni eslestirme olustur
- [ ] 5.3. `PUT /api/products/mappings/:id` - Eslestirme guncelle
- [ ] 5.4. `DELETE /api/products/mappings/:id` - Eslestirme sil
- [ ] 5.5. `GET /api/products/mappings/suggestions` - Eslestirme onerileri
- [ ] 5.6. `POST /api/products/mappings/auto` - Otomatik eslestirme calistir

### Aşama 6: Frontend - Eslestirme Listesi Sayfasi
- [ ] 6.1. `/products/mappings` sayfasi olustur
- [ ] 6.2. Eslenmis urun gruplari listesi
- [ ] 6.3. Her grup icin: Master SKU, Magaza sayisi, Toplam stok
- [ ] 6.4. Grup detayini acma (expand)

### Aşama 7: Frontend - Eslestirme Olusturma
- [ ] 7.1. "Yeni Eslestirme" butonu ve modal
- [ ] 7.2. Urun arama (tum magazalardan)
- [ ] 7.3. Secilen urunleri gruplama
- [ ] 7.4. Master SKU belirleme

### Aşama 8: Frontend - Eslestirme Onerileri
- [ ] 8.1. Oneri listesi komponenti
- [ ] 8.2. Ayni SKU'lu urunleri gosterme
- [ ] 8.3. "Onayla" ve "Reddet" butonlari
- [ ] 8.4. Toplu onaylama secenegi

### Aşama 9: Frontend - Eslestirme Duzenleme
- [ ] 9.1. Eslestirme detay sayfasi
- [ ] 9.2. Grupta urunleri gorme
- [ ] 9.3. Urun ekleme/cikarma
- [ ] 9.4. Eslestirmeyi silme

### Aşama 10: Frontend - Konsolide Gosterim
- [ ] 10.1. Stok listesinde eslenmis urunleri birlestir
- [ ] 10.2. "Eslenmis" badge gosterimi
- [ ] 10.3. Toplam stok gosterimi (tum magazalar)

### Aşama 11: Test
- [ ] 11.1. Otomatik eslestirme algoritmasi testleri
- [ ] 11.2. Konsolide hesaplama testleri
- [ ] 11.3. API endpoint testleri
- [ ] 11.4. Frontend component testleri

---

## Database Schema

```sql
-- Ana eslestirme tablosu
CREATE TABLE product_mappings (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id),
  master_sku VARCHAR(100) NOT NULL,
  name VARCHAR(255), -- Grup adi (opsiyonel)
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, master_sku)
);

-- Eslestirme detaylari
CREATE TABLE product_mapping_items (
  id SERIAL PRIMARY KEY,
  mapping_id INT REFERENCES product_mappings(id) ON DELETE CASCADE,
  store_id INT REFERENCES stores(id),
  product_id VARCHAR(100) NOT NULL, -- WooCommerce urun ID
  sku VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(mapping_id, store_id, product_id)
);

-- Index
CREATE INDEX idx_mappings_user ON product_mappings(user_id);
CREATE INDEX idx_mapping_items_mapping ON product_mapping_items(mapping_id);
```

---

## Eslestirme Algoritmasi

```javascript
// Otomatik SKU eslestirme pseudocode
function autoMatchProducts(userId) {
  // 1. Tum magazalardaki urunleri SKU'ya gore grupla
  const productsBySku = groupProductsBySku(userId);

  // 2. Birden fazla magazada bulunan SKU'lari bul
  const suggestions = [];
  for (const [sku, products] of productsBySku) {
    const uniqueStores = new Set(products.map(p => p.storeId));
    if (uniqueStores.size > 1) {
      suggestions.push({
        masterSku: sku,
        products: products,
        storeCount: uniqueStores.size
      });
    }
  }

  return suggestions;
}
```

---

## UI/UX Notlari
- Eslenmis urunler farkli renk/badge ile vurgulanmali
- Drag-and-drop eslestirme destegi (opsiyonel)
- Otomatik eslestirme sonuclarini onay bekleyen olarak goster
- Eslestirme islemlerinde undo destegi

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
