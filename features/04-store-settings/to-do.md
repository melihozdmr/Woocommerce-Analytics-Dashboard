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
- [ ] Store settings endpoint'lerini ekle
- [ ] PUT /stores/:id/settings - Ayarlari guncelle
- [ ] GET /stores/:id/settings - Ayarlari getir
- [ ] Settings validation rules:
  - [ ] Commission: 0-100 arasi (%)
  - [ ] Shipping cost: 0-10000 arasi (TL)
  - [ ] Negatif deger kabul edilmez

### Backend - Audit Log
- [ ] Settings degisiklik loglama
- [ ] Timestamp ile kayit
- [ ] Eski ve yeni deger kaydi

### Frontend - Store Settings Panel
- [ ] Magaza ayarlari sayfasi/modal
- [ ] Komisyon orani input
  - [ ] Numeric input (% simgesi ile)
  - [ ] 0-100 arasi validasyon
  - [ ] Varsayilan: 0%
- [ ] Kargo maliyeti input
  - [ ] Numeric input (TL simgesi ile)
  - [ ] 0-10000 arasi validasyon
  - [ ] Varsayilan: 0 TL
- [ ] Para birimi gosterimi (varsayilan TL)

### Frontend - Auto-save Mechanism
- [ ] Debounced auto-save (500ms)
- [ ] "Kaydediliyor..." durumu goster
- [ ] "Kaydedildi" durumu goster (checkmark)
- [ ] Hata durumunda rollback
- [ ] Optimistic UI update

### Frontend - Visual Feedback
- [ ] Input degisikliginde "Kaydediliyor..." spinner
- [ ] Basarili kayit "Kaydedildi" checkmark
- [ ] Hata durumunda kirmizi uyari
- [ ] Son guncelleme zamani gosterimi

---

## Kabul Kriterleri
- [ ] AC-002.1: POS komisyon orani alani gorunur (0-100%)
- [ ] AC-002.2: Kargo maliyeti alani gorunur (0-10000 TL)
- [ ] AC-002.3: Negatif degerler engellenir
- [ ] AC-002.4: Komisyon > 100% engellenir
- [ ] AC-002.5: Auto-save 500ms debounce ile calisir
- [ ] AC-002.6: "Kaydediliyor..." ve "Kaydedildi" gosterilir
- [ ] AC-002.7: Varsayilan degerler uygulanir (komisyon 0%, kargo 0 TL)
- [ ] AC-002.8: Degisiklikler kar hesaplamalarinda hemen yansir
- [ ] AC-002.9: Magaza para birimi desteklenir (varsayilan TL)
- [ ] AC-002.10: Tum degisiklikler audit log'a kaydedilir

---

## Teknik Notlar
- Optimistic UI updates with rollback
- Debounce 500ms for auto-save
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
- [ ] TypeScript strict mode hatalari yok
- [ ] Kod moduler ve tekrar yok
- [ ] Ortak kodlar common'da
- [ ] .env'de hassas bilgi yok (git'te)
- [ ] Unit testler yazildi
- [ ] Testler basarili geciyor (`npm run test`)
- [ ] Clean code kurallarina uygun
- [ ] Dokumantasyon guncellendi
- [ ] Git commit atildi
