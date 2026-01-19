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
- [x] Products tablosu olustur (Prisma) - 03-store-connection'da yapildi
- [x] WooCommerce'den urunleri cek - 03-store-connection'da yapildi
- [x] Variable products ve variations destegi
- [x] _purchase_price meta field'ini oku (purchasePrice alani)
- [x] Sync job scheduler (saatlik cron job)

### Backend - Inventory Endpoints
- [x] GET /inventory/summary - Genel stok ozeti
- [x] GET /inventory/products - Urun listesi (pagination)
- [x] GET /inventory/critical - Kritik stok listesi
- [x] GET /inventory/by-store - Magaza bazli dagilim

### Backend - Calculations
- [x] Toplam stok miktari hesaplama
- [x] Stok degeri hesaplama (alis fiyati x adet)
- [x] Tahmini gelir hesaplama (satis fiyati x adet)
- [x] Kritik stok tespiti (esik degeri)
- [ ] Stok trendi hesaplama (7 gunluk karsilastirma) - sonraki iterasyonda

### Backend - Caching
- [ ] Redis'te stok verileri cache'le - sonraki iterasyonda
- [ ] Cache invalidation on sync
- [ ] Cache TTL: 5 dakika

### Frontend - Inventory Dashboard
- [x] Stok ozeti kartlari
  - [x] Toplam Stok Miktari
  - [x] Toplam Stok Degeri (TL)
  - [x] Tahmini Gelir (TL)
  - [x] Kritik Stok Urun Sayisi
- [x] Magaza bazli dagilim (expandable section)
- [ ] Stok trendi gostergesi (+/-% vs 7 gun once) - sonraki iterasyonda

### Frontend - Critical Stock Panel
- [x] Kritik stok listesi komponenti
- [x] Liste gorunumu:
  - [x] Urun adi
  - [x] SKU
  - [x] Mevcut stok
  - [x] Magaza adi
- [x] Renk kodlamasi:
  - [x] 0 stok: Kirmizi
  - [x] 1-5 stok: Turuncu
- [x] Urun tiklandiginda WooCommerce admin'e yonlendir
- [x] Siralama: Stok seviyesine gore (artan)
- [x] Magaza filtresi
- [ ] CSV export butonu - sonraki iterasyonda

### Frontend - Inventory Table
- [x] Tum urunler tablosu (Table)
- [x] Kolonlar: Urun, SKU, Stok, Alis Fiyati, Satis Fiyati, Magaza
- [x] Arama filtreleme
- [x] Pagination
- [x] Alis fiyati eksik uyarisi (warning icon)

### Frontend - Auto-refresh
- [x] Manuel yenileme butonu
- [x] "Son guncelleme" gosterimi
- [x] Loading skeleton
- [ ] 5 dakikada bir otomatik yenileme - sonraki iterasyonda

### Frontend - Stock Threshold Settings
- [x] Kritik stok esigi ayari (varsayilan: 5)
- [ ] Kullanici tarafindan degistirilebilir UI (1-100) - sonraki iterasyonda

---

## Kabul Kriterleri
- [x] AC-003.1: Toplam stok miktari gosterilir
- [x] AC-003.2: Toplam stok degeri (alis fiyati x adet) gosterilir
- [x] AC-003.3: Tahmini gelir (satis fiyati x adet) gosterilir
- [x] AC-003.4: Magaza bazli dagilim expandable section'da gosterilir
- [ ] AC-003.5: Veriler 5 dakikada bir otomatik yenilenir
- [x] AC-003.6: Manuel yenileme butonu ve loading indicator vardir
- [x] AC-003.7: Son senkronizasyon zamani gosterilir
- [x] AC-003.8: Alis fiyati olmayan urunler warning icon ile isaretlenir
- [x] AC-003.9: Stok=0 urunler sayilir ve vurgulanir
- [ ] AC-003.10: 7 gunluk stok trendi karsilastirmasi gosterilir

### Kritik Stok Kabul Kriterleri (US-004)
- [x] AC-004.1: Stok <= esik deger olan urunler kritik listede gosterilir
- [x] AC-004.2: Varsayilan esik degeri 5
- [x] AC-004.3: Dashboard'da kritik stok sayisi badge olarak gosterilir
- [x] AC-004.4: Liste: urun adi, SKU, stok, magaza adi icerir
- [x] AC-004.5: Stok=0 urunler kirmizi vurgulanir
- [x] AC-004.6: Stok 1-5 urunler turuncu vurgulanir
- [x] AC-004.7: Urune tiklaninca WooCommerce admin acilir
- [x] AC-004.8: Liste stok seviyesine gore sirali (artan)
- [x] AC-004.9: Magaza filtresi vardir
- [ ] AC-004.10: CSV export mumkundur

---

## Teknik Notlar
- Background job ile stok verilerini sync et (03-store-connection'da yapildi)
- Variable products handling (variations destegi)
- _purchase_price custom field from WooCommerce (purchasePrice)

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

### Feature Tamamlama Checklist
- [x] TypeScript strict mode hatalari yok
- [x] Kod moduler ve tekrar yok
- [x] Ortak kodlar common'da
- [x] .env'de hassas bilgi yok (git'te)
- [ ] Unit testler yazildi
- [ ] Testler basarili geciyor (`npm run test`)
- [x] Clean code kurallarina uygun
- [x] Dokumantasyon guncellendi
- [ ] Git commit atildi
