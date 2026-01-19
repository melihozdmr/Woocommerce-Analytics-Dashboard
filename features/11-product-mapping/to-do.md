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
- [x] SKU bazli otomatik eslestirme yapilabilmeli
- [x] Manuel eslestirme secenegi olmali
- [x] Eslesmis urunler tek satirda gosterilmeli
- [x] Toplam stok eslesmis urunler icin birlesmeli (kaynak sitenin stogu)
- [x] Eslestirme kaldirabilmeli
- [x] Eslestirme onerileri sunulmali
- [x] Hatali oneri reddedilebilmeli

---

## Yapilacaklar

### Aşama 1: Veritabani - Eslestirme Tablolari
- [x] 1.1. `product_mappings` tablosu olustur
  - id, company_id, master_sku, name, created_at, updated_at
- [x] 1.2. `product_mapping_items` tablosu olustur
  - id, mapping_id, store_id, product_id, sku, is_source
- [x] 1.3. `dismissed_mapping_suggestions` tablosu olustur
  - id, company_id, suggestion_key
- [x] 1.4. Indexler olustur (company_id, master_sku)

### Aşama 2: Backend - Otomatik Eslestirme Servisi
- [x] 2.1. `ProductMappingService` olustur
- [x] 2.2. SKU eslestirme algoritmasi
  - Ayni SKU'ya sahip urunleri grupla
  - Farkli magazalardaki eslesmeleri bul
- [x] 2.3. Eslestirme onerileri olusturma
- [x] 2.4. Urun adindaki SKU kodunu cikarma (0101, SZ4590 gibi)

### Aşama 3: Backend - Manuel Eslestirme
- [x] 3.1. Eslestirme olusturma fonksiyonu
- [x] 3.2. Eslestirme guncelleme fonksiyonu
- [x] 3.3. Eslestirme silme fonksiyonu
- [x] 3.4. Eslestirmeye urun ekleme/cikarma
- [x] 3.5. Oneri reddetme fonksiyonu

### Aşama 4: Backend - Konsolide Veri
- [x] 4.1. Eslenmis urunler icin gercek stok hesaplama (kaynak site)
- [x] 4.2. Eslenmis urunler icin tahmini gelir hesaplama
- [x] 4.3. Kaynak/hedef magaza belirleme (is_source)

### Aşama 5: Backend - API Endpoints
- [x] 5.1. `GET /company/:id/products/mappings` - Eslestirme listesi
- [x] 5.2. `POST /company/:id/products/mappings` - Yeni eslestirme olustur
- [x] 5.3. `PUT /company/:id/products/mappings/:id` - Eslestirme guncelle
- [x] 5.4. `DELETE /company/:id/products/mappings/:id` - Eslestirme sil
- [x] 5.5. `GET /company/:id/products/mappings/suggestions` - Eslestirme onerileri
- [x] 5.6. `POST /company/:id/products/mappings/auto` - Otomatik eslestirme calistir
- [x] 5.7. `POST /company/:id/products/mappings/suggestions/dismiss` - Oneri reddet

### Aşama 6: Frontend - Eslestirme Listesi Sayfasi
- [x] 6.1. `/products/mappings` sayfasi olustur
- [x] 6.2. Eslenmis urun gruplari listesi
- [x] 6.3. Her grup icin: Master SKU, Magaza sayisi, Gercek stok
- [x] 6.4. Grup detayini acma (expand)
- [x] 6.5. Sidebar'a link ekleme

### Aşama 7: Frontend - Eslestirme Olusturma
- [x] 7.1. Oneriden eslestirme olusturma
- [x] 7.2. Eslestirme adi belirleme (opsiyonel)
- [x] 7.3. Otomatik eslestir butonu

### Aşama 8: Frontend - Eslestirme Onerileri
- [x] 8.1. Oneri listesi komponenti
- [x] 8.2. Ayni SKU'lu urunleri gosterme
- [x] 8.3. "Esleştir" ve "Reddet" butonlari
- [x] 8.4. Toplu onaylama secenegi (Otomatik Eslestir)

### Aşama 9: Frontend - Eslestirme Duzenleme
- [x] 9.1. Eslestirme detay (expand) gorunumu
- [x] 9.2. Grupta urunleri gorme
- [x] 9.3. Eslestirmeyi silme

### Aşama 10: Frontend - Konsolide Gosterim
- [x] 10.1. Stok listesinde eslenmis urunleri birlestir
- [x] 10.2. "Eslenmis" badge gosterimi (magaza isimleri)
- [x] 10.3. Gercek stok gosterimi (kaynak sitenin stogu)
- [x] 10.4. Tahmini gelir dogru hesaplama

### Aşama 11: Test
- [ ] 11.1. Otomatik eslestirme algoritmasi testleri
- [ ] 11.2. Konsolide hesaplama testleri
- [ ] 11.3. API endpoint testleri
- [ ] 11.4. Frontend component testleri

---

## Stok Senkronizasyonu (Feature 15)

WordPress eklentisi ile iki site arasinda stok senkronizasyonu icin:
- Bkz: [Feature 15: WordPress Stock Sync](../15-wordpress-stock-sync/to-do.md)

---

## Database Schema

```sql
-- Ana eslestirme tablosu
CREATE TABLE product_mappings (
  id CUID PRIMARY KEY,
  company_id CUID REFERENCES companies(id),
  master_sku VARCHAR(100) NOT NULL,
  name VARCHAR(255), -- Grup adi (opsiyonel)
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(company_id, master_sku)
);

-- Eslestirme detaylari
CREATE TABLE product_mapping_items (
  id CUID PRIMARY KEY,
  mapping_id CUID REFERENCES product_mappings(id) ON DELETE CASCADE,
  store_id CUID REFERENCES stores(id),
  product_id CUID REFERENCES products(id),
  sku VARCHAR(100),
  is_source BOOLEAN DEFAULT FALSE, -- Kaynak magaza mi?
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(mapping_id, store_id, product_id)
);

-- Reddedilen oneriler
CREATE TABLE dismissed_mapping_suggestions (
  id CUID PRIMARY KEY,
  company_id CUID REFERENCES companies(id),
  suggestion_key VARCHAR(255) NOT NULL, -- sku:xxx veya name:xxx
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(company_id, suggestion_key)
);
```

---

## Gercek Stok Hesaplama Mantigi

Iki site ayni fiziksel urunu sattigindan:
- **Gercek Stok = Kaynak sitenin stogu**
- Ilk eklenen magaza otomatik olarak "kaynak" (is_source = true)
- Tahmini gelir = Gercek Stok × Fiyat

Ornek:
- Site A (kaynak): 82 adet
- Site B: 12 adet
- **Gercek Stok = 82** (toplamda 94 degil!)

---

## UI/UX Notlari
- Eslenmis urunler yesil renk ile vurgulanmali
- Hatali oneriler X butonu ile reddedilebilmeli
- Gercek stok yeşil renkte gösterilmeli
- Kaynak magaza bilgisi gorunmeli

---

## Proje Kurallari

> **Detayli kurallar icin bkz:** [RULES.md](../../RULES.md)

### Teknoloji
- **Dil:** TypeScript (strict mode)
- **ORM:** Prisma
- **Test:** Jest
- **Frontend:** Next.js + Tailwind CSS

### Kod Yapisi
- Moduler yapi kullan
- Ortak kodlar `src/common/` altinda
- Tekrar eden kod yazma (DRY)

### Feature Tamamlama Checklist
- [x] TypeScript strict mode hatalari yok
- [x] Kod moduler ve tekrar yok
- [x] Veritabani migration yapildi
- [ ] Unit testler yazildi
- [ ] Testler basarili geciyor (`npm run test`)
- [x] Git commit atildi
