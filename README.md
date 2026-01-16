# WooCommerce Analytics Dashboard

Birden fazla WooCommerce magazasini tek bir panelde birlestirerek satis, stok, finansal metrikler ve iade verilerini gercek zamanli olarak izlemeyi saglayan kapsamli bir e-ticaret analitik dashboard'udur.

## Ozellikler

- **Coklu Magaza Yonetimi:** 2-10 WooCommerce magazasini tek panelden yonetin
- **Stok Analitikleri:** Toplam stok, stok degeri, kritik stok uyarilari
- **Siparis Analitikleri:** Donem bazli siparis takibi, trendler
- **Odeme Analitikleri:** Odeme yontemi dagilimi, nakit akisi
- **Kar Hesaplama:** Brut kar, net kar, kar marji analizi
- **Iade Takibi:** Iade oranlari, iade nedenleri analizi
- **Veri Disa Aktarma:** CSV ve PDF export
- **Bildirimler:** Gercek zamanli bildirimler ve email raporlari

## Teknoloji Stack

| Katman | Teknoloji |
|--------|-----------|
| **Frontend** | Next.js 14+, React 18+, Tailwind CSS |
| **Backend** | Node.js 20+, NestJS 10+ |
| **Database** | PostgreSQL 15+ |
| **Cache** | Redis 7+ |
| **ORM** | Prisma |
| **Test** | Jest |

## Kurulum

### Gereksinimler

- Node.js 20+
- PostgreSQL 15+
- Redis 7+
- npm veya yarn

### Adimlar

1. **Repoyu klonlayin:**
```bash
git clone https://github.com/melihozdmr/Woocommerce-Analytics-Dashboard.git
cd Woocommerce-Analytics-Dashboard
```

2. **Cevre degiskenlerini ayarlayin:**
```bash
cp .env.example .env
# .env dosyasini duzenleyin
```

3. **Backend kurulumu:**
```bash
cd backend
npm install
npx prisma migrate dev
npm run start:dev
```

4. **Frontend kurulumu:**
```bash
cd frontend
npm install
npm run dev
```

5. **Uygulamaya erisin:**
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- API Docs: http://localhost:3001/api/docs

## Proje Yapisi

```
Woocommerce-Analytics-Dashboard/
├── backend/                 # NestJS Backend
│   ├── src/
│   │   ├── common/          # Ortak kodlar
│   │   ├── modules/         # Feature modulleri
│   │   ├── config/          # Konfigurasyonlar
│   │   └── database/        # Prisma schema, migrations
│   └── tests/               # Backend testleri
├── frontend/                # Next.js Frontend
│   ├── src/
│   │   ├── components/      # React komponentleri
│   │   ├── pages/           # Next.js sayfalari
│   │   ├── hooks/           # Custom hooks
│   │   ├── stores/          # Zustand stores
│   │   └── services/        # API client
│   └── tests/               # Frontend testleri
├── features/                # Feature to-do listleri
├── PRD.md                   # Proje spesifikasyonu
├── RULES.md                 # Gelistirme kurallari
└── README.md
```

## Feature Listesi

| # | Feature | Oncelik | Durum |
|---|---------|---------|-------|
| 01 | Project Setup | P0 | Beklemede |
| 02 | Authentication | P1 | Beklemede |
| 03 | Store Connection | P0 | Beklemede |
| 04 | Store Settings | P0 | Beklemede |
| 05 | Inventory Analytics | P0 | Beklemede |
| 06 | Order Analytics | P0 | Beklemede |
| 07 | Payment Analytics | P0 | Beklemede |
| 08 | Profit Calculation | P0 | Beklemede |
| 09 | Refund Tracking | P0 | Beklemede |
| 10 | Pricing System | P0 | Beklemede |
| 11 | Product Mapping | P1 | Beklemede |
| 12 | Data Export | P1 | Beklemede |
| 13 | Notifications | P2 | Beklemede |
| 14 | Email Reports | P2 | Beklemede |
| 15 | External API | P2 | Beklemede |

## Gelistirme

### Komutlar

```bash
# Test calistirma
npm run test

# Test coverage
npm run test:coverage

# Lint
npm run lint

# Build
npm run build
```

### Kurallar

Detayli gelistirme kurallari icin [RULES.md](./RULES.md) dosyasina bakiniz.

- TypeScript strict mode
- Jest ile test (min %70 coverage)
- Moduler yapi
- Clean code prensipleri

## Fiyatlandirma Planlari (SaaS)

| Ozellik | Free | Pro | Enterprise |
|---------|------|-----|------------|
| Magaza limiti | 2 | 5 | 10+ |
| Veri guncelleme | 15 dk | 5 dk | 1 dk |
| CSV/PDF Export | - | ✓ | ✓ |
| Email Raporlari | - | - | ✓ |
| API Erisimi | - | - | ✓ |
| **Aylik** | 0 TL | 99 TL | 299 TL |

## Lisans

Bu proje ozel bir projedir.

## Iletisim

- GitHub: [@melihozdmr](https://github.com/melihozdmr)
