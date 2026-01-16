# Proje Kurallari (Project Rules)

Bu dokuman, projenin tum gelistirme surecinde uyulmasi gereken kurallari icerir.

---

## 1. Teknoloji Stack

| Katman | Teknoloji | Notlar |
|--------|-----------|--------|
| **Dil** | TypeScript | Strict mode aktif |
| **Frontend** | Next.js 14+ | React 18+ |
| **Backend** | Node.js 20+ | NestJS 10+ |
| **ORM** | Prisma / Drizzle / TypeORM / MikroORM | Tercih: Prisma |
| **Database** | PostgreSQL 15+ | Primary DB |
| **Cache** | Redis 7+ | Session & Cache |
| **Test** | Jest | Unit & Integration tests |
| **Styling** | Tailwind CSS 3+ | - |

---

## 2. Kod Yapisi (Code Structure)

### 2.1 Moduler Yapi
```
src/
├── common/              # Ortak kodlar, utilities, helpers
│   ├── utils/           # Yardimci fonksiyonlar
│   ├── types/           # Ortak TypeScript tipleri
│   ├── constants/       # Sabit degerler
│   ├── middlewares/     # Ortak middleware'ler
│   └── validators/      # Ortak validasyon semalari
├── modules/             # Feature-based moduller
│   ├── auth/
│   ├── stores/
│   ├── analytics/
│   └── ...
├── config/              # Konfigurasyon dosyalari
├── database/            # DB migrations, seeds
└── tests/               # Test dosyalari
```

### 2.2 Ortak Kodlar (Common)
- Tekrar eden kodlar `src/common/` altinda tutulmali
- Her modul kendi icinde bagimsiz olmali
- Moduller arasi bagimlilik minimize edilmeli
- Shared tipler `common/types/` altinda olmali

---

## 3. TypeScript Kurallari

### 3.1 Strict Mode
```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true
  }
}
```

### 3.2 Type Tanimlari
- `any` tipi kullanilmamali (zorunlu durumlar haric)
- Interface'ler `I` prefix'i ile baslamali: `IUser`, `IStore`
- Type'lar aciklayici olmali
- Generic tipler tercih edilmeli

---

## 4. Cevre Degiskenleri (Environment Variables)

### 4.1 .env Dosyasi
```env
# .env.example (Git'e dahil edilir)
NODE_ENV=development
PORT=3000

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/dbname

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d

# WooCommerce Encryption
ENCRYPTION_KEY=your-encryption-key

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXT_PUBLIC_APP_NAME=WooCommerce Analytics
```

### 4.2 Guvenlik Kurallari
- `.env` dosyasi **ASLA** git'e eklenmemeli
- `.env.example` dosyasi ornek olarak git'e eklenmeli
- Hassas bilgiler (API keys, secrets) sadece .env'de tutulmali
- Production'da environment variables kullanilmali

---

## 5. Test Kurallari (Jest)

### 5.1 Test Yapisi
```
tests/
├── unit/                # Unit testler
│   ├── services/
│   └── utils/
├── integration/         # Integration testler
│   └── api/
└── e2e/                 # End-to-end testler (opsiyonel)
```

### 5.2 Test Kurallari
- Her feature tamamlandiginda testler yazilmali
- Minimum %90 code coverage hedeflenmeli
- Test dosyalari `*.test.ts` veya `*.spec.ts` ile bitmeli
- Mock'lar `__mocks__/` klasorunde olmali

### 5.3 Test Komutlari
```bash
npm run test           # Tum testleri calistir
npm run test:watch     # Watch mode
npm run test:coverage  # Coverage raporu
npm run test:unit      # Sadece unit testler
npm run test:int       # Sadece integration testler
```

### 5.4 Her Feature Sonrasi
- Feature tamamlaninca `npm run test` calistirilmali
- Testler gecmeden commit atilmamali
- Basarisiz testler duzeltilmeli

---

## 6. Clean Code Prensipleri

### 6.1 Naming Conventions
| Tur | Convention | Ornek |
|-----|------------|-------|
| Degisken | camelCase | `userName`, `orderTotal` |
| Fonksiyon | camelCase | `calculateProfit()`, `getUser()` |
| Class | PascalCase | `UserService`, `OrderController` |
| Interface | IPascalCase | `IUser`, `IOrderResponse` |
| Constant | UPPER_SNAKE | `MAX_RETRY_COUNT`, `API_VERSION` |
| Dosya (component) | PascalCase | `UserProfile.tsx` |
| Dosya (util) | camelCase | `dateUtils.ts` |

### 6.2 Fonksiyon Kurallari
- Tek sorumluluk prensibi (SRP)
- Fonksiyonlar 30 satirdan uzun olmamali
- Maksimum 3 parametre (fazlasi icin object kullan)
- Early return tercih edilmeli

### 6.3 Dosya Organizasyonu
- Bir dosya tek bir sorumluluk taşimali
- Dosya 300 satirdan uzun olmamali
- Import siralama: external -> internal -> relative

---

## 7. Git Kurallari

### 7.1 Commit Mesajlari
```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

**Types:**
- `feat`: Yeni ozellik
- `fix`: Bug fix
- `docs`: Dokumantasyon
- `style`: Kod formatlama
- `refactor`: Refactoring
- `test`: Test ekleme/duzeltme
- `chore`: Build, config degisiklikleri

**Ornekler:**
```
feat(auth): add JWT authentication
fix(stores): fix API connection timeout
docs(readme): update installation steps
test(profit): add unit tests for profit calculation
```

### 7.2 Branch Stratejisi
```
main (production)
├── develop (development)
│   ├── feature/01-project-setup
│   ├── feature/02-authentication
│   └── feature/XX-feature-name
```

---

## 8. Dokumantasyon Kurallari

### 8.1 Kod Icinde
- Public fonksiyonlar JSDoc ile dokumante edilmeli
- Kompleks logic'ler yorum satiri ile aciklanmali
- TODO/FIXME notlari birakılabilir

```typescript
/**
 * Calculates net profit for a given order
 * @param order - The order object
 * @param commission - Commission rate (0-100)
 * @param shippingCost - Fixed shipping cost
 * @returns Net profit amount
 */
function calculateNetProfit(
  order: IOrder,
  commission: number,
  shippingCost: number
): number {
  // ...
}
```

### 8.2 API Dokumantasyonu
- OpenAPI/Swagger kullanilmali
- Her endpoint dokumante edilmeli
- Request/Response ornekleri verilmeli

---

## 9. Guvenlik Kurallari

- SQL injection onlenmeli (ORM kullan)
- XSS onlenmeli (input sanitization)
- CSRF token kullanilmali
- Rate limiting uygulanmali
- Hassas veriler sifrelenmeli (AES-256)
- HTTPS zorunlu
- Helmet.js kullanilmali

---

## 10. Performans Kurallari

- N+1 query problemi onlenmeli
- Uygun indexler olusturulmali
- Cache stratejisi uygulanmali
- Lazy loading kullanilmali
- Bundle size optimize edilmeli

---

## Checklist (Her Feature Icin)

```markdown
## Feature Tamamlama Checklist

- [ ] TypeScript strict mode hatalari yok
- [ ] Kod moduler ve tekrar yok
- [ ] Ortak kodlar common'da
- [ ] .env'de hassas bilgi yok (git'te)
- [ ] Unit testler yazildi
- [ ] Testler basarili geciyor
- [ ] Clean code kurallarina uygun
- [ ] Dokumantasyon guncellendi
- [ ] Code review yapildi
- [ ] Git commit atildi
```

---

**Son Guncelleme:** 16 Ocak 2026
