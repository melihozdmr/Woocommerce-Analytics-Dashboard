# 05 - Inventory Analytics (Stok Analitikleri)

**Oncelik:** P0 (Must Have)
**Tahmini Sure:** 3-4 gun
**User Story:** US-003, US-004
**Functional Requirement:** FR-003

---

## Aciklama
Tum magazalardaki stok durumunu izlemek, toplam stok degeri ve tahmini geliri hesaplamak, kritik stok uyarilari gostermek.

---

## Yapilacaklar

### Backend - Product Sync
- [ ] Products tablosu olustur (Prisma)
- [ ] WooCommerce'den urunleri cek
- [ ] Variable products ve variations destegi
- [ ] _purchase_price meta field'ini oku
- [ ] Sync job scheduler (5 dakikada bir)

### Backend - Inventory Endpoints
- [ ] GET /inventory/summary - Genel stok ozeti
- [ ] GET /inventory/products - Urun listesi (pagination)
- [ ] GET /inventory/critical - Kritik stok listesi
- [ ] GET /inventory/by-store - Magaza bazli dagilim

### Backend - Calculations
- [ ] Toplam stok miktari hesaplama
- [ ] Stok degeri hesaplama (alis fiyati x adet)
- [ ] Tahmini gelir hesaplama (satis fiyati x adet)
- [ ] Kritik stok tespiti (esik degeri)
- [ ] Stok trendi hesaplama (7 gunluk karsilastirma)

### Backend - Caching
- [ ] Redis'te stok verileri cache'le
- [ ] Cache invalidation on sync
- [ ] Cache TTL: 5 dakika

### Frontend - Inventory Dashboard
- [ ] Stok ozeti kartlari
  - [ ] Toplam Stok Miktari
  - [ ] Toplam Stok Degeri (TL)
  - [ ] Tahmini Gelir (TL)
  - [ ] Kritik Stok Urun Sayisi
- [ ] Magaza bazli dagilim (expandable section)
- [ ] Stok trendi gostergesi (+/-% vs 7 gun once)

### Frontend - Critical Stock Panel
- [ ] Kritik stok listesi komponenti
- [ ] Liste gorunumu:
  - [ ] Urun adi
  - [ ] SKU
  - [ ] Mevcut stok
  - [ ] Magaza adi
- [ ] Renk kodlamasi:
  - [ ] 0 stok: Kirmizi
  - [ ] 1-5 stok: Turuncu
- [ ] Urun tiklandiginda WooCommerce admin'e yonlendir
- [ ] Siralama: Stok seviyesine gore (artan)
- [ ] Magaza filtresi
- [ ] CSV export butonu

### Frontend - Inventory Table
- [ ] Tum urunler tablosu (IndexTable)
- [ ] Kolonlar: Urun, SKU, Stok, Alis Fiyati, Satis Fiyati, Magaza
- [ ] Siralama ve filtreleme
- [ ] Pagination
- [ ] Alis fiyati eksik uyarisi (warning icon)

### Frontend - Auto-refresh
- [ ] 5 dakikada bir otomatik yenileme
- [ ] Manuel yenileme butonu
- [ ] "Son guncelleme: 10:30" gosterimi
- [ ] Loading skeleton

### Frontend - Stock Threshold Settings
- [ ] Kritik stok esigi ayari (varsayilan: 5)
- [ ] Kullanici tarafindan degistirilebilir (1-100)

---

## Kabul Kriterleri
- [ ] AC-003.1: Toplam stok miktari gosterilir
- [ ] AC-003.2: Toplam stok degeri (alis fiyati x adet) gosterilir
- [ ] AC-003.3: Tahmini gelir (satis fiyati x adet) gosterilir
- [ ] AC-003.4: Magaza bazli dagilim expandable section'da gosterilir
- [ ] AC-003.5: Veriler 5 dakikada bir otomatik yenilenir
- [ ] AC-003.6: Manuel yenileme butonu ve loading indicator vardir
- [ ] AC-003.7: Son senkronizasyon zamani gosterilir
- [ ] AC-003.8: Alis fiyati olmayan urunler warning icon ile isaretlenir
- [ ] AC-003.9: Stok=0 urunler sayilir ve vurgulanir
- [ ] AC-003.10: 7 gunluk stok trendi karsilastirmasi gosterilir

### Kritik Stok Kabul Kriterleri (US-004)
- [ ] AC-004.1: Stok <= esik deger olan urunler kritik listede gosterilir
- [ ] AC-004.2: Varsayilan esik degeri 5 (kullanici degistirebilir 1-100)
- [ ] AC-004.3: Dashboard'da kritik stok sayisi badge olarak gosterilir
- [ ] AC-004.4: Liste: urun adi, SKU, stok, magaza adi icerir
- [ ] AC-004.5: Stok=0 urunler kirmizi vurgulanir
- [ ] AC-004.6: Stok 1-5 urunler turuncu vurgulanir
- [ ] AC-004.7: Urune tiklaninca WooCommerce admin acilir
- [ ] AC-004.8: Liste stok seviyesine gore sirali (artan)
- [ ] AC-004.9: Magaza filtresi vardir
- [ ] AC-004.10: CSV export mumkundur

---

## Teknik Notlar
- Background job ile stok verilerini sync et
- Redis cache ile hizli erisim
- Variable products handling
- _purchase_price custom field from WooCommerce

---

## Bagimliliklar
- 01-project-setup tamamlanmis olmali
- 03-store-connection tamamlanmis olmali

---

## Commit Mesaji Formati
```
feat(inventory): Implement inventory analytics dashboard

- Add product sync from WooCommerce stores
- Create inventory summary calculations
- Implement critical stock alerts system
- Add auto-refresh and manual sync functionality
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
