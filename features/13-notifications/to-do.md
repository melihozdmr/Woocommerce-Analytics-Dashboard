# Feature 13: Gercek Zamanli Bildirimler (Real-time Notifications)

## Ilgili User Story
**US-012: Gercek Zamanli Bildirimler**
- **Oncelik:** P2 (Nice to Have)
- **Tahmin:** L (Large)

## Ilgili Fonksiyonel Gereksinim
**FR-013: Bildirim Sistemi**
- Browser push notifications
- In-app bildirimler
- Bildirim tercihleri
- Bildirim gecmisi

---

## Kabul Kriterleri
- [ ] Yeni siparis bildirimi
- [ ] Kritik stok uyarisi bildirimi
- [ ] Yuksek tutarli siparis bildirimi (esik deger ayarlanabilir)
- [ ] Browser push notification destegi
- [ ] Bildirim gecmisi gorulebilmeli
- [ ] Bildirim turleri acilip kapatilabilmeli

---

## Yapilacaklar

### Aşama 1: Veritabani - Bildirim Tablolari
- [ ] 1.1. `notifications` tablosu olustur
  - id, user_id, type, title, message, data_json, is_read, created_at
- [ ] 1.2. `notification_settings` tablosu olustur
  - user_id, notification_type, in_app_enabled, push_enabled, threshold_value
- [ ] 1.3. Varsayilan ayarlari ekle

### Aşama 2: Backend - Bildirim Servisi
- [ ] 2.1. `NotificationService` olustur
- [ ] 2.2. Bildirim olusturma fonksiyonu
- [ ] 2.3. Bildirim okuma isareti
- [ ] 2.4. Toplu bildirim silme
- [ ] 2.5. Bildirim tercihi kontrolu

### Aşama 3: Backend - Bildirim Tipleri
- [ ] 3.1. `NEW_ORDER` - Yeni siparis
- [ ] 3.2. `CRITICAL_STOCK` - Kritik stok uyarisi
- [ ] 3.3. `HIGH_VALUE_ORDER` - Yuksek tutarli siparis
- [ ] 3.4. `REFUND_RECEIVED` - Iade talebi
- [ ] 3.5. `SYNC_ERROR` - Senkronizasyon hatasi

### Aşama 4: Backend - Bildirim Tetikleyiciler
- [ ] 4.1. Siparis senkronizasyonunda yeni siparis kontrolu
- [ ] 4.2. Stok senkronizasyonunda kritik stok kontrolu
- [ ] 4.3. Siparis tutari esik degeri kontrolu
- [ ] 4.4. Iade senkronizasyonunda iade kontrolu

### Aşama 5: Backend - Push Notification Altyapisi
- [ ] 5.1. Web Push kutuphanesi entegrasyonu (web-push)
- [ ] 5.2. VAPID key olusturma
- [ ] 5.3. Push subscription kaydetme
- [ ] 5.4. Push notification gonderme fonksiyonu
- [ ] 5.5. Service Worker dosyasi

### Aşama 6: Backend - API Endpoints
- [ ] 6.1. `GET /api/notifications` - Bildirim listesi
- [ ] 6.2. `PUT /api/notifications/:id/read` - Okundu isareti
- [ ] 6.3. `PUT /api/notifications/read-all` - Tumunu okundu yap
- [ ] 6.4. `DELETE /api/notifications/:id` - Bildirim sil
- [ ] 6.5. `GET /api/notifications/settings` - Bildirim ayarlari
- [ ] 6.6. `PUT /api/notifications/settings` - Ayarlari guncelle
- [ ] 6.7. `POST /api/notifications/subscribe` - Push subscription

### Aşama 7: Frontend - Bildirim Zili
- [ ] 7.1. Header'da bildirim ikonu
- [ ] 7.2. Okunmamis bildirim sayaci (badge)
- [ ] 7.3. Dropdown ile son bildirimler
- [ ] 7.4. "Tumunu Gor" linki

### Aşama 8: Frontend - Bildirim Listesi Sayfasi
- [ ] 8.1. `/notifications` sayfasi
- [ ] 8.2. Bildirim karti komponenti
- [ ] 8.3. Okundu/okunmadi durumu
- [ ] 8.4. Bildirim tipine gore ikon
- [ ] 8.5. Tarih gosterimi (relative time)
- [ ] 8.6. Pagination / infinite scroll

### Aşama 9: Frontend - Toast Bildirimleri
- [ ] 9.1. In-app toast bildirim komponenti
- [ ] 9.2. Yeni bildirim geldiginde toast goster
- [ ] 9.3. Toast'tan ilgili sayfaya yonlendirme

### Aşama 10: Frontend - Push Notification
- [ ] 10.1. Service Worker register
- [ ] 10.2. Push izni isteme
- [ ] 10.3. Subscription backend'e gonderme
- [ ] 10.4. Push notification gosterimi

### Aşama 11: Frontend - Bildirim Ayarlari
- [ ] 11.1. Ayarlar sayfasinda bildirim bolumu
- [ ] 11.2. Her bildirim tipi icin toggle
- [ ] 11.3. Yuksek tutar esigi ayari (input)
- [ ] 11.4. Push notification izni durumu

### Aşama 12: Backend - WebSocket (Gercek Zamanli)
- [ ] 12.1. Socket.io entegrasyonu
- [ ] 12.2. Kullanici baglantisi yonetimi
- [ ] 12.3. Bildirim broadcast fonksiyonu
- [ ] 12.4. Connection state yonetimi

### Aşama 13: Test
- [ ] 13.1. Bildirim olusturma testleri
- [ ] 13.2. Push notification testleri
- [ ] 13.3. WebSocket baglanti testleri
- [ ] 13.4. Frontend component testleri

---

## Database Schema

```sql
-- Bildirimler tablosu
CREATE TABLE notifications (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id),
  type VARCHAR(50) NOT NULL, -- NEW_ORDER, CRITICAL_STOCK, etc.
  title VARCHAR(255) NOT NULL,
  message TEXT,
  data_json JSONB, -- Ek veri (siparis ID, urun ID vb.)
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Bildirim ayarlari
CREATE TABLE notification_settings (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id),
  notification_type VARCHAR(50) NOT NULL,
  in_app_enabled BOOLEAN DEFAULT true,
  push_enabled BOOLEAN DEFAULT false,
  threshold_value DECIMAL(10,2), -- Yuksek tutar esigi
  UNIQUE(user_id, notification_type)
);

-- Push subscriptions
CREATE TABLE push_subscriptions (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id),
  endpoint TEXT NOT NULL,
  keys_json JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, endpoint)
);

-- Index
CREATE INDEX idx_notifications_user ON notifications(user_id, created_at DESC);
CREATE INDEX idx_notifications_unread ON notifications(user_id) WHERE is_read = false;
```

---

## Bildirim Tipleri ve Ornekleri

| Tip | Baslik | Mesaj Ornegi |
|-----|--------|--------------|
| NEW_ORDER | Yeni Siparis | "E-Shop TR'den #1234 numarali 250 TL'lik siparis alindi" |
| CRITICAL_STOCK | Kritik Stok | "3 urun kritik stok seviyesinde" |
| HIGH_VALUE_ORDER | Yuksek Tutarli Siparis | "ModaStore'dan 2.500 TL'lik buyuk siparis!" |
| REFUND_RECEIVED | Iade Talebi | "#1230 numarali siparis icin iade talebi alindi" |
| SYNC_ERROR | Senkronizasyon Hatasi | "E-Shop TR magazasiyla baglanti kurulamadi" |

---

## Push Notification Ornegi

```javascript
// Service Worker (public/sw.js)
self.addEventListener('push', function(event) {
  const data = event.data.json();
  self.registration.showNotification(data.title, {
    body: data.message,
    icon: '/icon-192.png',
    badge: '/badge-72.png',
    data: data.url
  });
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  event.waitUntil(clients.openWindow(event.notification.data));
});
```

---

## Teknik Notlar
- WebSocket baglantisi authentication gerektirmeli
- Push notification icin VAPID keys guvenli saklanmali
- Bildirimler 30 gun sonra otomatik silinebilir
- Rate limiting: Ayni tip bildirim 5 dakikada bir
- Mobil uyumluluk icin PWA destegi eklenmeli

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
