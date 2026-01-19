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
- [x] RESTful API endpoints mevcut olmali
- [x] API key ile authentication yapilabilmeli
- [x] Rate limiting uygulanmali
- [x] API dokumantasyonu saglanmali
- [x] Sadece Enterprise kullanicilari erisebilmeli

---

## Yapilacaklar

### Aşama 1: Veritabani - API Key Yonetimi ✅
- [x] 1.1. `api_keys` tablosu olustur
  - id, company_id, key_hash, key_prefix, name, permissions, last_used_at, expires_at, is_active
- [x] 1.2. `api_usage_logs` tablosu olustur
  - id, api_key_id, endpoint, method, status_code, response_time_ms, ip_address, user_agent, created_at
- [x] 1.3. Index olusturma

### Aşama 2: Backend - API Key Servisi ✅
- [x] 2.1. `ApiKeyService` olustur
- [x] 2.2. API key olusturma (SHA-256 hash ile saklama)
- [x] 2.3. API key dogrulama
- [x] 2.4. API key iptal etme (revoke)
- [x] 2.5. API key yenileme (rotation)
- [x] 2.6. Kullanim istatistikleri

### Aşama 3: Backend - Authentication Guard ✅
- [x] 3.1. API key authentication guard
- [x] 3.2. Bearer token veya X-API-Key header destegi
- [x] 3.3. Plan kontrolu (Enterprise only)
- [x] 3.4. Permission kontrolu (read/write)

### Aşama 4: Backend - Rate Limiting ✅
- [x] 4.1. Rate limiter guard
- [x] 4.2. Redis bazli rate limiting
- [x] 4.3. Limitler: 100 istek/dakika/API key
- [x] 4.4. Rate limit headers (X-RateLimit-*)
- [x] 4.5. 429 Too Many Requests response

### Aşama 5: Backend - Public API Endpoints ✅
- [x] 5.1. **Stores**
  - `GET /api/v1/stores` - Magaza listesi
  - `GET /api/v1/stores/:id` - Magaza detayi
- [x] 5.2. **Products**
  - `GET /api/v1/products` - Urun listesi
  - `GET /api/v1/products/:id` - Urun detayi
  - `GET /api/v1/products/critical-stock` - Kritik stok
- [x] 5.3. **Orders**
  - `GET /api/v1/orders` - Siparis listesi
  - `GET /api/v1/orders/:id` - Siparis detayi
- [x] 5.4. **Analytics**
  - `GET /api/v1/analytics/overview` - Genel ozet
  - `GET /api/v1/analytics/sales` - Satis verileri
  - `GET /api/v1/analytics/inventory` - Stok verileri
  - `GET /api/v1/analytics/profit` - Kar verileri

### Aşama 6: Backend - Response Formatlama ✅
- [x] 6.1. Standart response yapisi (success, data, meta)
- [x] 6.2. Pagination destegi (limit, offset, hasMore)
- [x] 6.3. Filtering destegi (query params)
- [x] 6.4. Sorting destegi
- [x] 6.5. Error response formati (code, message, details)

### Aşama 7: Backend - API Versioning ✅
- [x] 7.1. URL bazli versioning (/api/v1/...)
- [ ] 7.2. Version deprecation stratejisi (v2 icin)
- [ ] 7.3. Version header (X-API-Version) (v2 icin)

### Aşama 8: Backend - Logging ve Monitoring ✅
- [x] 8.1. API isteklerini loglama (ApiLoggingInterceptor)
- [x] 8.2. Response time olcumu
- [x] 8.3. Error tracking
- [x] 8.4. Kullanim analizleri (usage stats endpoint)

### Aşama 9: Backend - API Key Yonetim Endpoints ✅
- [x] 9.1. `POST /api/settings/api-keys` - Yeni key olustur
- [x] 9.2. `GET /api/settings/api-keys` - Key listesi
- [x] 9.3. `DELETE /api/settings/api-keys/:id` - Key sil
- [x] 9.4. `PUT /api/settings/api-keys/:id/rotate` - Key yenile
- [x] 9.5. `GET /api/settings/api-keys/:id/usage` - Kullanim istatistikleri
- [x] 9.6. `PUT /api/settings/api-keys/:id/revoke` - Key iptal et

### Aşama 10: Frontend - API Key Yonetim Sayfasi ✅
- [x] 10.1. `/settings/api` sayfasi
- [x] 10.2. API key listesi tablosu
- [x] 10.3. "Yeni Key Olustur" butonu ve modal
- [x] 10.4. Key gosterim (sadece olusturulurken)
- [x] 10.5. Key iptal etme / silme
- [ ] 10.6. Kullanim istatistikleri grafigi (ileride)

### Aşama 11: Dokumantasyon ✅
- [x] 11.1. OpenAPI/Swagger spesifikasyonu
- [x] 11.2. Swagger UI entegrasyonu (/api/docs)
- [x] 11.3. Endpoint aciklamalari
- [x] 11.4. Request/Response ornekleri (Swagger)
- [x] 11.5. Authentication rehberi (main.ts description)
- [x] 11.6. Rate limiting aciklamasi
- [ ] 11.7. Error kodlari listesi (ayri dokuman - ileride)

### Aşama 12: Test ✅
- [x] 12.1. API key service unit testleri (22 test)
- [x] 12.2. Authentication testleri
- [ ] 12.3. Rate limiting testleri (e2e - ileride)
- [x] 12.4. Permission testleri
- [ ] 12.5. Load testing (ileride)

### Aşama 13: WC Stock Connector WordPress Eklentisi Entegrasyonu

> **Bu aşama ayrı bir feature olarak taşındı.**
>
> Detaylar için bkz: [Feature 15 - WordPress Stock Sync](../15-wordpress-stock-sync/to-do.md)
>
> Bu feature şunları kapsar:
> - WordPress eklentisi (WC Stock Connector)
> - Dashboard ↔ WooCommerce stok/fiyat senkronizasyonu
> - Site A ↔ Site B çapraz stok senkronizasyonu
> - Webhook yönetimi

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
