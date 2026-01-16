# Feature 14: Email Raporlari (Email Reports)

## Ilgili User Story
**US-013: Email Raporlari**
- **Oncelik:** P2 (Nice to Have)
- **Tahmin:** M (Medium)

## Ilgili Fonksiyonel Gereksinim
**FR-014: Email Raporlari**
- Zamanlanmis email gonderimi
- Rapor sablonlari
- Gonderim sikligi ayarlari

---

## Kabul Kriterleri
- [ ] Gunluk ozet raporu secenegi
- [ ] Haftalik detayli rapor secenegi
- [ ] Rapor icerigi ozellestirilebilmeli
- [ ] Gonderim saati ayarlanabilmeli
- [ ] Email raporlari acilip kapatilabilmeli
- [ ] HTML formatinda gorsel rapor

---

## Yapilacaklar

### Aşama 1: Veritabani - Email Rapor Ayarlari
- [ ] 1.1. `email_report_settings` tablosu olustur
  - user_id, report_type, frequency, send_time, sections_json, is_enabled
- [ ] 1.2. `email_report_logs` tablosu olustur
  - id, user_id, report_type, sent_at, status, error_message
- [ ] 1.3. Varsayilan ayarlari ekle

### Aşama 2: Backend - Email Servisi
- [ ] 2.1. Email kutuphanesi entegrasyonu (nodemailer)
- [ ] 2.2. SMTP/Transactional email konfigurasyonu (SendGrid/Mailgun)
- [ ] 2.3. Email gonderme fonksiyonu
- [ ] 2.4. Email sablon engine (Handlebars/React Email)

### Aşama 3: Backend - Rapor Tipleri
- [ ] 3.1. Gunluk Ozet Raporu
  - Bugunun siparisleri
  - Bugunun geliri
  - Kritik stok sayisi
  - Gunun ozeti
- [ ] 3.2. Haftalik Detayli Rapor
  - Haftalik satis ozeti
  - En cok satan urunler
  - Kar marji analizi
  - Iade orani
  - Onceki haftaya kiyasla performans

### Aşama 4: Backend - Rapor Icerik Servisi
- [ ] 4.1. `EmailReportService` olustur
- [ ] 4.2. Gunluk rapor verisi toplama
- [ ] 4.3. Haftalik rapor verisi toplama
- [ ] 4.4. Magaza bazli filtreleme
- [ ] 4.5. Rapor bolumlerini dinamik olusturma

### Aşama 5: Backend - Email Sablonlari
- [ ] 5.1. Temel email sablon yapisi
- [ ] 5.2. Gunluk rapor HTML sablonu
- [ ] 5.3. Haftalik rapor HTML sablonu
- [ ] 5.4. Responsive email tasarimi
- [ ] 5.5. Dark mode destegi (opsiyonel)

### Aşama 6: Backend - Zamanlama Sistemi
- [ ] 6.1. Cron job kutuphanesi entegrasyonu (node-cron)
- [ ] 6.2. Gunluk rapor zamanlama (her gun belirli saatte)
- [ ] 6.3. Haftalik rapor zamanlama (her Pazartesi)
- [ ] 6.4. Kullanici timezone destegi
- [ ] 6.5. Job queue yonetimi (Bull/Agenda)

### Aşama 7: Backend - API Endpoints
- [ ] 7.1. `GET /api/settings/email-reports` - Rapor ayarlari
- [ ] 7.2. `PUT /api/settings/email-reports` - Ayarlari guncelle
- [ ] 7.3. `POST /api/settings/email-reports/preview` - Onizleme
- [ ] 7.4. `POST /api/settings/email-reports/test` - Test email gonder
- [ ] 7.5. `GET /api/settings/email-reports/history` - Gonderim gecmisi

### Aşama 8: Frontend - Email Rapor Ayarlari Sayfasi
- [ ] 8.1. `/settings/email-reports` sayfasi
- [ ] 8.2. Rapor turu secimi (gunluk/haftalik)
- [ ] 8.3. Gonderim saati secimi (TimePicker)
- [ ] 8.4. Rapor bolum secimi (checkbox listesi)
- [ ] 8.5. Email adresi dogrulama

### Aşama 9: Frontend - Rapor Onizleme
- [ ] 9.1. "Onizle" butonu
- [ ] 9.2. Modal/sayfa icinde HTML onizleme
- [ ] 9.3. "Test Email Gonder" butonu

### Aşama 10: Frontend - Gonderim Gecmisi
- [ ] 10.1. Gonderilen raporlar listesi
- [ ] 10.2. Gonderim durumu (basarili/basarisiz)
- [ ] 10.3. Hata mesajlari gosterimi

### Aşama 11: Frontend - Plan Kisitlama
- [ ] 11.1. Enterprise-only badge gosterimi
- [ ] 11.2. Upgrade CTA butonu
- [ ] 11.3. Ozellik aciklamasi

### Aşama 12: Test
- [ ] 12.1. Email gonderim testleri
- [ ] 12.2. Sablon render testleri
- [ ] 12.3. Zamanlama testleri
- [ ] 12.4. API endpoint testleri

---

## Database Schema

```sql
-- Email rapor ayarlari
CREATE TABLE email_report_settings (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id) UNIQUE,
  daily_enabled BOOLEAN DEFAULT false,
  daily_time TIME DEFAULT '09:00',
  weekly_enabled BOOLEAN DEFAULT false,
  weekly_day INT DEFAULT 1, -- 1=Monday
  weekly_time TIME DEFAULT '09:00',
  timezone VARCHAR(50) DEFAULT 'Europe/Istanbul',
  sections_json JSONB DEFAULT '{"orders": true, "revenue": true, "stock": true, "profit": true}',
  stores_json JSONB, -- null = all stores
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Email rapor loglari
CREATE TABLE email_report_logs (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id),
  report_type VARCHAR(20) NOT NULL, -- daily, weekly
  sent_at TIMESTAMP DEFAULT NOW(),
  status VARCHAR(20) NOT NULL, -- sent, failed
  error_message TEXT,
  email_address VARCHAR(255)
);

-- Index
CREATE INDEX idx_email_logs_user ON email_report_logs(user_id, sent_at DESC);
```

---

## Email Sablon Yapisi

### Gunluk Rapor
```html
<!DOCTYPE html>
<html>
<head>
  <style>
    /* Responsive email styles */
  </style>
</head>
<body>
  <div class="header">
    <img src="logo.png" />
    <h1>Gunluk Ozet Raporu</h1>
    <p>15 Ocak 2026</p>
  </div>

  <div class="summary-cards">
    <div class="card">
      <h3>Bugunun Siparisleri</h3>
      <p class="big-number">24</p>
      <p class="change positive">+15% dunden</p>
    </div>
    <div class="card">
      <h3>Bugunun Geliri</h3>
      <p class="big-number">4.250 TL</p>
      <p class="change positive">+8% dunden</p>
    </div>
    <!-- ... -->
  </div>

  <div class="section">
    <h2>Kritik Stok Uyarisi</h2>
    <table>
      <tr><th>Urun</th><th>Stok</th><th>Magaza</th></tr>
      <tr><td>Urun A</td><td>2</td><td>E-Shop</td></tr>
    </table>
  </div>

  <div class="footer">
    <a href="{{dashboardUrl}}">Dashboard'a Git</a>
    <p>Bu raporu almak istemiyorsaniz, ayarlarinizi degistirin.</p>
  </div>
</body>
</html>
```

---

## Zamanlama Ornegi

```javascript
// Gunluk rapor job (her gun 09:00)
cron.schedule('0 9 * * *', async () => {
  const users = await getUsersWithDailyReportEnabled();
  for (const user of users) {
    const userTime = convertToUserTimezone(user.timezone);
    if (userTime === user.dailyTime) {
      await sendDailyReport(user);
    }
  }
});

// Haftalik rapor job (her Pazartesi 09:00)
cron.schedule('0 9 * * 1', async () => {
  const users = await getUsersWithWeeklyReportEnabled();
  for (const user of users) {
    await sendWeeklyReport(user);
  }
});
```

---

## Teknik Notlar
- Email gonderimi asenkron ve queue bazli olmali
- Basarisiz gonderimlerde 3 deneme yapilmali
- Email bounce/complaint tracking (SES/SendGrid callback)
- Unsubscribe link zorunlu (GDPR/spam compliance)
- Plan kontrolu: Sadece Enterprise kullanicilari
- Rate limiting: Kullanici basina max 2 email/gun

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
