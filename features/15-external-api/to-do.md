# Feature 15: Harici API (External API)

## Ilgili Fonksiyonel Gereksinim
**FR-015: Harici API**
- **Oncelik:** P2 (Nice to Have)
- RESTful API endpoints
- API key yonetimi
- Rate limiting
- API dokumantasyonu

---

## Kabul Kriterleri
- [ ] RESTful API endpoints mevcut olmali
- [ ] API key ile authentication yapilabilmeli
- [ ] Rate limiting uygulanmali
- [ ] API dokumantasyonu saglanmali
- [ ] Sadece Enterprise kullanicilari erisebilmeli

---

## Yapilacaklar

### Aşama 1: Veritabani - API Key Yonetimi
- [ ] 1.1. `api_keys` tablosu olustur
  - id, user_id, key_hash, name, permissions_json, last_used_at, expires_at, is_active
- [ ] 1.2. `api_usage_logs` tablosu olustur
  - id, api_key_id, endpoint, method, status_code, response_time, created_at
- [ ] 1.3. Index olusturma

### Aşama 2: Backend - API Key Servisi
- [ ] 2.1. `ApiKeyService` olustur
- [ ] 2.2. API key olusturma (hash ile saklama)
- [ ] 2.3. API key dogrulama
- [ ] 2.4. API key iptal etme
- [ ] 2.5. API key yenileme (rotation)
- [ ] 2.6. Kullanim istatistikleri

### Aşama 3: Backend - Authentication Middleware
- [ ] 3.1. API key authentication middleware
- [ ] 3.2. Bearer token veya X-API-Key header destegi
- [ ] 3.3. Plan kontrolu (Enterprise only)
- [ ] 3.4. Permission kontrolu

### Aşama 4: Backend - Rate Limiting
- [ ] 4.1. Rate limiter middleware (express-rate-limit)
- [ ] 4.2. Redis bazli rate limiting
- [ ] 4.3. Limitler: 100 istek/dakika/API key
- [ ] 4.4. Rate limit headers (X-RateLimit-*)
- [ ] 4.5. 429 Too Many Requests response

### Aşama 5: Backend - Public API Endpoints
- [ ] 5.1. **Stores**
  - `GET /api/v1/stores` - Magaza listesi
  - `GET /api/v1/stores/:id` - Magaza detayi
- [ ] 5.2. **Products**
  - `GET /api/v1/products` - Urun listesi
  - `GET /api/v1/products/:id` - Urun detayi
  - `GET /api/v1/products/critical-stock` - Kritik stok
- [ ] 5.3. **Orders**
  - `GET /api/v1/orders` - Siparis listesi
  - `GET /api/v1/orders/:id` - Siparis detayi
- [ ] 5.4. **Analytics**
  - `GET /api/v1/analytics/overview` - Genel ozet
  - `GET /api/v1/analytics/sales` - Satis verileri
  - `GET /api/v1/analytics/inventory` - Stok verileri
  - `GET /api/v1/analytics/profit` - Kar verileri

### Aşama 6: Backend - Response Formatlama
- [ ] 6.1. Standart response yapisi
- [ ] 6.2. Pagination destegi (limit, offset, cursor)
- [ ] 6.3. Filtering destegi (query params)
- [ ] 6.4. Sorting destegi
- [ ] 6.5. Error response formati

### Aşama 7: Backend - API Versioning
- [ ] 7.1. URL bazli versioning (/api/v1/...)
- [ ] 7.2. Version deprecation stratejisi
- [ ] 7.3. Version header (X-API-Version)

### Aşama 8: Backend - Logging ve Monitoring
- [ ] 8.1. API isteklerini loglama
- [ ] 8.2. Response time olcumu
- [ ] 8.3. Error tracking
- [ ] 8.4. Kullanim analizleri

### Aşama 9: Backend - API Key Yonetim Endpoints
- [ ] 9.1. `POST /api/settings/api-keys` - Yeni key olustur
- [ ] 9.2. `GET /api/settings/api-keys` - Key listesi
- [ ] 9.3. `DELETE /api/settings/api-keys/:id` - Key sil
- [ ] 9.4. `PUT /api/settings/api-keys/:id/rotate` - Key yenile
- [ ] 9.5. `GET /api/settings/api-keys/:id/usage` - Kullanim istatistikleri

### Aşama 10: Frontend - API Key Yonetim Sayfasi
- [ ] 10.1. `/settings/api` sayfasi
- [ ] 10.2. API key listesi tablosu
- [ ] 10.3. "Yeni Key Olustur" butonu ve modal
- [ ] 10.4. Key gosterim (sadece olusturulurken)
- [ ] 10.5. Key iptal etme
- [ ] 10.6. Kullanim istatistikleri grafigi

### Aşama 11: Dokumantasyon
- [ ] 11.1. OpenAPI/Swagger spesifikasyonu
- [ ] 11.2. Swagger UI entegrasyonu (/api/docs)
- [ ] 11.3. Endpoint aciklamalari
- [ ] 11.4. Request/Response ornekleri
- [ ] 11.5. Authentication rehberi
- [ ] 11.6. Rate limiting aciklamasi
- [ ] 11.7. Error kodlari listesi

### Aşama 12: Test
- [ ] 12.1. API endpoint testleri
- [ ] 12.2. Authentication testleri
- [ ] 12.3. Rate limiting testleri
- [ ] 12.4. Permission testleri
- [ ] 12.5. Load testing

### Aşama 13: WC Stock Connector WordPress Eklentisi Entegrasyonu
> **Not:** Eklenti temel yapısı `wordpress-plugin/wc-stock-connector.php` dosyasında hazır. Bu aşamada API ile otomatik eşleşme yapılacak.

- [ ] 13.1. **Eklenti Tarafı - Otomatik Bağlantı**
  - [ ] Kullanıcı API key girince otomatik store eşleştirme
  - [ ] Site URL'i ile mağaza eşleştirme
  - [ ] Bağlantı durumu göstergesi (bağlı/bağlı değil)
  - [ ] Hata mesajları ve troubleshooting

- [ ] 13.2. **Backend - Eklenti Bağlantı Endpoint'leri**
  - [ ] `POST /api/v1/wcsc/register` - Eklenti ilk bağlantı kaydı
  - [ ] `POST /api/v1/wcsc/verify` - Bağlantı doğrulama
  - [ ] `GET /api/v1/wcsc/status` - Bağlantı durumu kontrolü

- [ ] 13.3. **Backend - Stok Yönetimi Endpoint'leri**
  - [ ] `POST /api/v1/wcsc/stock/update` - Tekli stok güncelle
  - [ ] `POST /api/v1/wcsc/stock/bulk-update` - Toplu stok güncelle
  - [ ] `GET /api/v1/wcsc/stock/:productId` - Stok bilgisi al

- [ ] 13.4. **Backend - Alış Fiyatı Endpoint'leri**
  - [ ] `POST /api/v1/wcsc/purchase-price/update` - Tekli alış fiyatı güncelle
  - [ ] `POST /api/v1/wcsc/purchase-price/bulk-update` - Toplu alış fiyatı güncelle
  - [ ] `GET /api/v1/wcsc/purchase-price/:productId` - Alış fiyatı al

- [ ] 13.5. **Eklenti Tarafı - Webhook Dinleme**
  - [ ] Dashboard'dan gelen stok güncelleme isteklerini işle
  - [ ] Dashboard'dan gelen alış fiyatı güncelleme isteklerini işle
  - [ ] İşlem logları ve hata yönetimi

- [ ] 13.6. **Frontend - Eklenti Bağlantı Yönetimi**
  - [ ] Mağaza ayarlarında "WC Stock Connector" bölümü
  - [ ] API key gösterme/kopyalama
  - [ ] Bağlantı durumu göstergesi
  - [ ] Eklenti kurulum rehberi modal

- [ ] 13.7. **Frontend - Stok ve Alış Fiyatı Düzenleme**
  - [ ] Ürün listesinde inline stok düzenleme
  - [ ] Ürün listesinde inline alış fiyatı düzenleme
  - [ ] Toplu düzenleme seçimi ve modal
  - [ ] Değişikliklerin WooCommerce'e otomatik sync'i

- [ ] 13.8. **Eklenti Dağıtımı**
  - [ ] WordPress.org için hazırlık (readme.txt, assets)
  - [ ] Versiyon yönetimi
  - [ ] Otomatik güncelleme desteği

---

## Database Schema

```sql
-- API Keys tablosu
CREATE TABLE api_keys (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id),
  key_hash VARCHAR(64) NOT NULL, -- SHA-256 hash
  key_prefix VARCHAR(8) NOT NULL, -- Ilk 8 karakter (gosterim icin)
  name VARCHAR(100) NOT NULL,
  permissions_json JSONB DEFAULT '{"read": true, "write": false}',
  last_used_at TIMESTAMP,
  expires_at TIMESTAMP,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(key_hash)
);

-- API kullanim loglari
CREATE TABLE api_usage_logs (
  id SERIAL PRIMARY KEY,
  api_key_id INT REFERENCES api_keys(id),
  endpoint VARCHAR(255) NOT NULL,
  method VARCHAR(10) NOT NULL,
  status_code INT,
  response_time_ms INT,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexler
CREATE INDEX idx_api_keys_hash ON api_keys(key_hash);
CREATE INDEX idx_api_usage_key ON api_usage_logs(api_key_id, created_at DESC);
```

---

## API Response Formati

### Basarili Response
```json
{
  "success": true,
  "data": {
    "items": [...],
    "pagination": {
      "total": 150,
      "limit": 20,
      "offset": 0,
      "hasMore": true
    }
  },
  "meta": {
    "requestId": "req_abc123",
    "timestamp": "2026-01-16T12:00:00Z"
  }
}
```

### Hata Response
```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Rate limit exceeded. Please try again later.",
    "details": {
      "limit": 100,
      "remaining": 0,
      "resetAt": "2026-01-16T12:01:00Z"
    }
  },
  "meta": {
    "requestId": "req_def456",
    "timestamp": "2026-01-16T12:00:30Z"
  }
}
```

---

## Rate Limit Headers

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1705406400
```

---

## API Key Olusturma Ornegi

```javascript
// API Key generation
const crypto = require('crypto');

function generateApiKey() {
  // 32 byte random key
  const key = crypto.randomBytes(32).toString('hex');
  const prefix = key.substring(0, 8);
  const hash = crypto.createHash('sha256').update(key).digest('hex');

  return {
    key: `wca_${key}`, // wca = woocommerce analytics
    prefix: prefix,
    hash: hash
  };
}

// Kullaniciya key goster: wca_a1b2c3d4e5f6...
// Database'e hash kaydet
```

---

## OpenAPI Spesifikasyonu Ornegi

```yaml
openapi: 3.0.0
info:
  title: WooCommerce Analytics API
  version: 1.0.0
  description: External API for WooCommerce Analytics Dashboard

servers:
  - url: https://api.example.com/api/v1

security:
  - ApiKeyAuth: []

paths:
  /stores:
    get:
      summary: List all stores
      responses:
        '200':
          description: Successful response
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/StoreList'

components:
  securitySchemes:
    ApiKeyAuth:
      type: apiKey
      in: header
      name: X-API-Key
```

---

## Teknik Notlar
- API key plain text olarak saklanMAMALI (hash kullan)
- Rate limiting Redis ile yapilmali (distributed)
- API versioning ileride breaking change icin onemli
- CORS ayarlari dikkatli yapilmali
- Request/response logging GDPR uyumlu olmali
- Plan kontrolu: Sadece Enterprise kullanicilari
- Webhook destegi ileride eklenebilir (v2)

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
