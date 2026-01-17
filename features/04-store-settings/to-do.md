# 04 - Store Settings (Magaza Ayarlari)

**Oncelik:** P0 (Must Have)
**Tahmini Sure:** 1-2 gun
**User Story:** US-002
**Functional Requirement:** FR-002

---

## Aciklama
Her magaza icin komisyon orani ve kargo maliyeti ayarlarini yonetmek. Bu ayarlar kar marji hesaplamalarinda kullanilacak.

---

## Yapilacaklar

### Backend - Store Settings
- [x] Store settings endpoint'lerini ekle
- [x] PUT /stores/:id - Ayarlari guncelle (commissionRate, shippingCost)
- [x] GET /stores - Ayarlari getir (store bilgisi icinde)
- [x] Settings validation rules:
  - [x] Commission: 0-100 arasi (%)
  - [x] Shipping cost: 0-10000 arasi (TL)
  - [x] Negatif deger kabul edilmez

### Backend - Audit Log
- [x] Settings degisiklik loglama (StoreSettingsLog modeli)
- [x] Timestamp ile kayit (createdAt)
- [x] Eski ve yeni deger kaydi (oldValue, newValue)

### Frontend - Store Settings Panel
- [x] Magaza ayarlari modal'i (Settings icon ile acilir)
- [x] Komisyon orani input
  - [x] Numeric input (% simgesi ile)
  - [x] 0-100 arasi validasyon
  - [x] Varsayilan: 0%
- [x] Kargo maliyeti input
  - [x] Numeric input (TL simgesi ile)
  - [x] 0-10000 arasi validasyon
  - [x] Varsayilan: 0 TL
- [x] Para birimi gosterimi (varsayilan TL)

### Frontend - Save Mechanism (Manuel kaydetme)
- [x] "Kaydet" butonu ile manuel kaydetme
- [x] "Kaydediliyor..." durumu goster
- [x] "Ayarlar kaydedildi" toast mesaji
- [x] Hata durumunda toast.error mesaji

### Frontend - Visual Feedback
- [x] Kaydet butonunda "Kaydediliyor..." spinner
- [x] Basarili kayit toast mesaji
- [x] Hata durumunda kirmizi toast uyari
- [x] Son guncelleme zamani gosterimi (modal icinde)

### Ek Ozellikler
- [x] Silme onay dialogu eklendi
- [x] Magaza yoksa "Ilk magazanizi baglayin" banner'i

---

## Kabul Kriterleri
- [x] AC-002.1: POS komisyon orani alani gorunur (0-100%)
- [x] AC-002.2: Kargo maliyeti alani gorunur (0-10000 TL)
- [x] AC-002.3: Negatif degerler engellenir
- [x] AC-002.4: Komisyon > 100% engellenir
- [x] AC-002.5: Manuel kaydetme butonu ile calisir (auto-save yerine)
- [x] AC-002.6: "Kaydediliyor..." spinner gosterilir
- [x] AC-002.7: Varsayilan degerler uygulanir (komisyon 0%, kargo 0 TL)
- [ ] AC-002.8: Degisiklikler kar hesaplamalarinda hemen yansir (kar hesabi henuz yok)
- [x] AC-002.9: Magaza para birimi desteklenir (varsayilan TL)
- [x] AC-002.10: Tum degisiklikler audit log'a kaydedilir

---

## Teknik Notlar
- Manuel kaydetme butonu ile kullanici kontrollu kayit
- Audit trail for compliance
- Currency formatting for TL

---

## Bagimliliklar
- 01-project-setup tamamlanmis olmali
- 03-store-connection tamamlanmis olmali

---

## Commit Mesaji Formati
```
feat(stores): Add store commission and shipping settings

- Implement auto-save with debounce for settings
- Add commission rate and shipping cost configuration
- Create audit logging for settings changes
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
- [x] TypeScript strict mode hatalari yok
- [x] Kod moduler ve tekrar yok
- [x] Ortak kodlar common'da
- [x] .env'de hassas bilgi yok (git'te)
- [x] Unit testler yazildi (auth.service.spec.ts guncellendi)
- [x] Testler basarili geciyor (`npm run test`) - 18 test gecti
- [x] Clean code kurallarina uygun
- [x] Dokumantasyon guncellendi
- [x] Git commit atildi
