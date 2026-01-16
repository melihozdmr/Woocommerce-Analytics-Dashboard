# WooCommerce Multi-Store Analytics Dashboard - Teknik Spesifikasyon

**Versiyon:** 1.0
**Tarih:** 16 Ocak 2026
**Durum:** Taslak

---

## 1. Ozet (Executive Summary)

Bu proje, birden fazla WooCommerce magazasini tek bir panelde birlestirerek satis, stok, finansal metrikler ve iade verilerini gercek zamanli olarak izlemeyi saglayan kapsamli bir e-ticaret analitik dashboard'udur. Baslangicta dahili kullanim (magaza sahipleri) icin tasarlanmis olup, ilerleyen surecte SaaS mikro-urun olarak piyasaya sunulacaktir. Sistem, magaza bazli komisyon ve kargo maliyeti hesaplamalari, kar marji analizleri, kritik stok uyarilari ve esnek fiyatlandirma sistemi ile donatilmistir.

---

## 2. Problem Tanimi (Problem Statement)

### 2.1 Cozulen Problem
Birden fazla WooCommerce magazasi yoneten isletmeler, her magazanin ayri yonetim paneline girip verileri manuel olarak toplamak ve analiz etmek zorunda kalmaktadir. Bu durum:
- Zaman kaybina yol acmakta
- Hata riskini artirmakta
- Butunsel bir bakis acisi kazanmayi zorlastirmakta
- Ani karar almada gecikmelere sebep olmaktadir

### 2.2 Etkilenen Kullanici Grubu
- Coklu WooCommerce magazasi yoneten e-ticaret girisimcileri
- Dropshipping ve marketplace operatorleri
- E-ticaret ajanslari ve danismanlar
- KOBi segmentindeki dijital isletmeler

### 2.3 Cozumsuzlugun Etkisi
- Gunluk 2-4 saat manuel veri toplama ve analiz sureci
- Yanlis veya geciken envanter kararlari nedeniyle kayip satislar
- Kar marji hesaplamalarinda hatalar
- Kritik stok durumlarinin fark edilememesi
- Stratejik karar alma sureclerinde yavaslik

---

## 3. Hedefler ve Amaclar (Goals & Objectives) - SMART Format

### 3.1 Spesifik (Specific)
- 2+ WooCommerce magazasini tek panelde birlestiren web tabanli dashboard gelistirmek
- Stok, satis, finansal ve iade verilerini gercek zamanli gorsellestirmek
- Magaza bazli komisyon ve kargo maliyeti hesaplamalari yapmak
- SaaS hazir, togglable fiyatlandirma sistemi olusturmak

### 3.2 Olculebilir (Measurable)
- Dashboard yukleme suresi < 3 saniye
- API veri senkronizasyonu < 30 saniye
- %99.5 uptime hedefi
- Kullanici basina maksimum 10 magaza baglantisi (Enterprise tier)

### 3.3 Ulasilabilir (Achievable)
- MVP 8 hafta icinde tamamlanacak
- Mevcut WooCommerce REST API v3 kullanilacak
- Modern web teknolojileri (Next.js, Node.js) ile hizli gelistirme

### 3.4 Ilgili (Relevant)
- E-ticaret pazarinin buyumesiyle artan coklu magaza yonetimi ihtiyaci
- Manuel raporlama sureclerinin otomasyonu talebi
- SaaS mikro-urun pazarindaki firsat

### 3.5 Zaman Sinirli (Time-bound)
| Kilometre Tasi | Hedef Tarih |
|----------------|-------------|
| MVP (P0 ozellikleri) | 8 hafta |
| P1 ozellikleri | 12 hafta |
| SaaS lansmansi | 16 hafta |
| P2 ozellikleri | 20 hafta |

---

## 4. Hedef Kullanicilar (Target Users)

### Persona 1: Magaza Sahibi Mehmet

```
Rol: E-ticaret Girisimcisi
Deneyim: 3-5 yil e-ticaret deneyimi
Magaza Sayisi: 3 WooCommerce magazasi (farkli nislerde)
Hedefler:
  - Tum magazalarini tek yerden izlemek
  - Hangi magazanin daha karli oldugunu anlamak
  - Stok durumunu anlik gormek
Sikinti Noktalari:
  - Her magazaya ayri ayri giris yapmak zorunda
  - Excel'de manuel kar hesaplamasi
  - Kritik stok seviyelerini kacirmak
Teknik Yetkinlik: Orta (WordPress kullanabiliyor)
Butce Hassasiyeti: Orta (faydali araca aylik 50-100 TL odeyebilir)
```

### Persona 2: Ajans Yoneticisi Ayse

```
Rol: E-ticaret Ajans Sahibi
Deneyim: 7+ yil dijital pazarlama ve e-ticaret
Magaza Sayisi: 15+ musteri magazasi
Hedefler:
  - Musterilere anlik raporlar sunmak
  - Tum musterilerin performansini tek panelden izlemek
  - Otomatik raporlama ile zaman kazanmak
Sikinti Noktalari:
  - Her musteri icin ayri login ve raporlama
  - Manuel PDF/Excel rapor hazirlama
  - Musterilere anlik veri saglayamamak
Teknik Yetkinlik: Yuksek
Butce Hassasiyeti: Dusuk (deger saglayan araca premium odeyebilir)
```

### Persona 3: Dropshipper Emre

```
Rol: Dropshipping Operatoru
Deneyim: 1-2 yil
Magaza Sayisi: 2 WooCommerce magazasi
Hedefler:
  - Kar marjlarini net gormek
  - Komisyon ve kargo maliyetlerini hesaplamak
  - Hangi urunlerin karli oldugunu anlamak
Sikinti Noktalari:
  - Alis fiyati takibi zor
  - Gercek kar hesaplamasi belirsiz
  - Iade oranlarinin etkisini olcememek
Teknik Yetkinlik: Orta-Dusuk
Butce Hassasiyeti: Yuksek (ucretsiz veya dusuk maliyetli cozum arıyor)
```

---

## 5. Kullanici Hikayeleri (User Stories)

### US-001: Magaza Baglantisi Ekleme

**Kullanici olarak** bir magaza sahibi
**Istiyorum ki** WooCommerce magazami API ile baglayabileyim
**Boylece** tum satis ve stok verilerimi dashboard'da gorebilirim

**Kabul Kriterleri:**
- [ ] Kullanici WooCommerce API URL girebilmeli
- [ ] Consumer Key ve Consumer Secret alanlari olmali
- [ ] Baglanti testi butonu ile API erisimi dogrulanmali
- [ ] Basarili baglantida magaza listesine eklenmeli
- [ ] Basarisiz baglantida anlasilir hata mesaji gosterilmeli
- [ ] Maksimum magaza limiti kullanici planina gore kontrol edilmeli
- [ ] Baglanti bilgileri sifrelenerek veritabaninda saklanmali

**Oncelik:** P0 (Must Have)
**Tahmin:** L (Large)

---

### US-002: Magaza Ayarlarini Duzenleme

**Kullanici olarak** bir magaza sahibi
**Istiyorum ki** her magaza icin komisyon ve kargo maliyeti ayarlayabileyim
**Boylece** dogru kar marji hesaplamalari yapilabilsin

**Kabul Kriterleri:**
- [ ] Her magaza icin POS komisyon orani (%) girilebilmeli
- [ ] Her magaza icin sabit kargo maliyeti (TL) girilebilmeli
- [ ] Ayarlar anlik olarak kaydedilmeli
- [ ] Kayit basarili/basarisiz durumu gosterilmeli
- [ ] Varsayilan degerler (komisyon: 0%, kargo: 0 TL) atanmali
- [ ] Negatif deger girisine izin verilmemeli

**Oncelik:** P0 (Must Have)
**Tahmin:** M (Medium)

---

### US-003: Stok Ozeti Goruntuleme

**Kullanici olarak** bir magaza sahibi
**Istiyorum ki** tum magazalarimdaki toplam stok durumunu gorebilmeyim
**Boylece** envanter durumumu anlik takip edebilirim

**Kabul Kriterleri:**
- [ ] Toplam stok adedi (tum magazalar toplami) gosterilmeli
- [ ] Toplam stok degeri (TL) hesaplanmali (alis fiyati x adet)
- [ ] Tahmini gelir (tum stok satilirsa) gosterilmeli (satis fiyati x adet)
- [ ] Magaza bazli stok dagilimi gosterilmeli
- [ ] Veriler otomatik yenilenmeli (5 dakikada bir)
- [ ] Manuel yenileme butonu olmali

**Oncelik:** P0 (Must Have)
**Tahmin:** M (Medium)

---

### US-004: Kritik Stok Uyarilari

**Kullanici olarak** bir magaza sahibi
**Istiyorum ki** dusuk stoklu urunler icin uyari alabileyim
**Boylece** stok tukenmeden once siparis verebilirim

**Kabul Kriterleri:**
- [ ] Stok seviyesi 5 ve altindaki urunler listelenmelI
- [ ] Uyari seviyesi kullanici tarafindan ayarlanabilmeli (varsayilan: 5)
- [ ] Kritik stok sayisi dashboard ana sayfasinda gosterilmeli
- [ ] Urun adi, mevcut stok, magaza bilgisi gosterilmeli
- [ ] Listeye tiklayinca detay sayfasina yonlendirilmeli
- [ ] Stok 0 olan urunler kirmizi ile vurgulanmali

**Oncelik:** P0 (Must Have)
**Tahmin:** M (Medium)

---

### US-005: Siparis Analitikleri Goruntuleme

**Kullanici olarak** bir magaza sahibi
**Istiyorum ki** farkli zaman dilimlerinde siparis verilerimi gorebilmeyim
**Boylece** satis trendlerimi analiz edebilirim

**Kabul Kriterleri:**
- [ ] Bugun, 1 hafta, 1 ay, 1 yil filtreleri olmali
- [ ] Toplam siparis sayisi gosterilmeli
- [ ] Toplam siparis tutari (TL) gosterilmeli
- [ ] Ortalama siparis degeri hesaplanmali
- [ ] Magaza bazli siparis dagilimi gosterilmeli
- [ ] Cizgi grafik ile trend gosterilmeli
- [ ] Onceki donemlere kiyasla degisim yuzdesi gosterilmeli

**Oncelik:** P0 (Must Have)
**Tahmin:** L (Large)

---

### US-006: Odeme Analitikleri Goruntuleme

**Kullanici olarak** bir magaza sahibi
**Istiyorum ki** odeme verilerimi donem bazli gorebilmeyim
**Boylece** nakit akisimi takip edebilirim

**Kabul Kriterleri:**
- [ ] Bugun, 1 hafta, 1 ay, 1 yil filtreleri olmali
- [ ] Toplam odeme tutari (TL) gosterilmeli
- [ ] Odeme yontemi bazli dagilim (kredi karti, havale, kapida odeme)
- [ ] Bar chart ile gorsellestirme
- [ ] Bekleyen odemeler ayri gosterilmeli
- [ ] Tamamlanan vs iptal edilen odeme karsilastirmasi

**Oncelik:** P0 (Must Have)
**Tahmin:** L (Large)

---

### US-007: Kar Marji Hesaplama

**Kullanici olarak** bir magaza sahibi
**Istiyorum ki** gercek kar marjimi gorebilmeyim
**Boylece** isletmemin karliligi hakkinda dogru bilgi edinirim

**Kabul Kriterleri:**
- [ ] Brut kar = Satis fiyati - Alis fiyati
- [ ] Net kar = Brut kar - Komisyon - Kargo maliyeti
- [ ] Kar marji yuzdesi hesaplanmali
- [ ] Urun bazli kar analizi yapilabilmeli
- [ ] Donem bazli kar karsilastirmasi olmali
- [ ] Negatif kar (zarar) durumu kirmizi ile gosterilmeli

**Oncelik:** P0 (Must Have)
**Tahmin:** L (Large)

---

### US-008: Iade/Iptal Takibi

**Kullanici olarak** bir magaza sahibi
**Istiyorum ki** iade ve iptal edilen siparisleri takip edebilmeyim
**Boylece** iade oranlarimi ve kayiplarimi analiz edebilirim

**Kabul Kriterleri:**
- [ ] Toplam iade sayisi gosterilmeli
- [ ] Toplam iade tutari (TL) gosterilmeli
- [ ] Iade orani (%) hesaplanmali
- [ ] Iade nedenleri (varsa) listelenmelI
- [ ] Donem bazli iade trend grafigi
- [ ] Magaza bazli iade karsilastirmasi

**Oncelik:** P0 (Must Have)
**Tahmin:** M (Medium)

---

### US-009: Kullanici Girisi

**Kullanici olarak** bir kayitli kullanici
**Istiyorum ki** email ve sifre ile giris yapabileyim
**Boylece** kendi verilerime guvenli erisim saglayabilirim

**Kabul Kriterleri:**
- [ ] Email ve sifre alanlari olmali
- [ ] Gecersiz bilgilerde anlasilir hata mesaji
- [ ] Basarili giriste dashboard'a yonlendirme
- [ ] Oturum 7 gun boyunca acik kalmali
- [ ] "Beni hatirla" secenegi olmali
- [ ] Sifremi unuttum akisi olmali
- [ ] Cikis yapma butonu olmali

**Oncelik:** P1 (Should Have)
**Tahmin:** M (Medium)

---

### US-010: Urun Eslestirme (Cross-Store)

**Kullanici olarak** bir magaza sahibi
**Istiyorum ki** farkli magazalardaki ayni urunleri eslestirebilmeyim
**Boylece** konsolide stok ve satis raporlari gorebilirim

**Kabul Kriterleri:**
- [ ] SKU bazli otomatik eslestirme yapilabilmeli
- [ ] Manuel eslestirme secenegi olmali
- [ ] Eslesmis urunler tek satirda gosterilmeli
- [ ] Toplam stok eslesmis urunler icin birlesmeli
- [ ] Eslestirmeyi kaldirilabilmeli
- [ ] Eslestirme onerileri sunulmali

**Oncelik:** P1 (Should Have)
**Tahmin:** L (Large)

---

### US-011: Veri Disa Aktarma

**Kullanici olarak** bir magaza sahibi
**Istiyorum ki** raporlarimi CSV veya PDF olarak indirebilmeyim
**Boylece** verilerimi disarida kullanabilir veya paylasabilirim

**Kabul Kriterleri:**
- [ ] CSV formati desteklenmeli
- [ ] PDF formati desteklenmeli
- [ ] Tarih araligi secimi yapilabilmeli
- [ ] Magaza filtresi uygulanabilmeli
- [ ] Dosya otomatik indirilmeli
- [ ] Turkce karakter destegi olmali

**Oncelik:** P1 (Should Have)
**Tahmin:** M (Medium)

---

### US-012: Gercek Zamanli Bildirimler

**Kullanici olarak** bir magaza sahibi
**Istiyorum ki** onemli olaylar icin anlik bildirim alabileyim
**Boylece** kritik durumlari hemen fark edebilirim

**Kabul Kriterleri:**
- [ ] Yeni siparis bildirimi
- [ ] Kritik stok uyarisi bildirimi
- [ ] Yuksek tutarli siparis bildirimi (esik deger ayarlanabilir)
- [ ] Browser push notification destegi
- [ ] Bildirim gecmisi gorulebilmeli
- [ ] Bildirim turleri acilip kapatilabilmeli

**Oncelik:** P2 (Nice to Have)
**Tahmin:** L (Large)

---

### US-013: Email Raporlari

**Kullanici olarak** bir magaza sahibi
**Istiyorum ki** periyodik email raporlari alabileyim
**Boylece** dashboard'a girmeden ozet bilgileri gorebilirim

**Kabul Kriterleri:**
- [ ] Gunluk ozet raporu secenegi
- [ ] Haftalik detayli rapor secenegi
- [ ] Rapor icerigi ozellestirilebilmeli
- [ ] Gonderim saati ayarlanabilmeli
- [ ] Email raporlari acilip kapatilabilmeli
- [ ] HTML formatinda gorsel rapor

**Oncelik:** P2 (Nice to Have)
**Tahmin:** M (Medium)

---

### US-014: Fiyatlandirma Sistemi Yonetimi

**Sistem yoneticisi olarak**
**Istiyorum ki** fiyatlandirma sistemini veritabanindan acip kapayabileyim
**Boylece** SaaS lansmanindan once ucretsiz kullanim saglayabilirim

**Kabul Kriterleri:**
- [ ] Database toggle ile fiyatlandirma aktif/pasif yapilabilmeli
- [ ] Pasifken tum ozellikler ucretsiz erisime acik
- [ ] Aktifken plan bazli kisitlamalar devreye girmeli
- [ ] Mevcut kullanicilar etkilenmemeli (grandfathering opsiyonu)
- [ ] Toggle degisikligi anlik yansimali

**Oncelik:** P0 (Must Have)
**Tahmin:** M (Medium)

---

### US-015: Plan Bazli Magaza Limiti

**Kullanici olarak** bir abone
**Istiyorum ki** planima gore magaza baglanti limitimi bilmek
**Boylece** ihtiyacima uygun plani secebilirim

**Kabul Kriterleri:**
- [ ] Free tier: 2 magaza limiti
- [ ] Pro tier: 5 magaza limiti
- [ ] Enterprise tier: 10 magaza limiti (veya sinirsiz)
- [ ] Limit asildiginda uyari mesaji gosterilmeli
- [ ] Plan yukseltme yonlendirmesi yapilmali
- [ ] Mevcut kullanim / limit gosterilmeli

**Oncelik:** P0 (Must Have)
**Tahmin:** M (Medium)

---

## 6. Fonksiyonel Gereksinimler (Functional Requirements)

### 6.1 P0 - Must Have (MVP)

#### FR-001: WooCommerce API Entegrasyonu
- WooCommerce REST API v3 ile baglanti
- OAuth 1.0a authentication destegi
- Consumer Key / Consumer Secret ile yetkilendirme
- API rate limiting yonetimi
- Baglanti durumu izleme ve hata yonetimi

#### FR-002: Coklu Magaza Yonetimi
- Magaza ekleme, duzenleme, silme
- Magaza bazli ayarlar (komisyon, kargo)
- Magaza durumu (aktif/pasif)
- Baglanti testi fonksiyonu

#### FR-003: Stok Analitikleri
- Toplam stok adedi hesaplama
- Stok degeri hesaplama (alis fiyati bazli)
- Potansiyel gelir hesaplama (satis fiyati bazli)
- Kritik stok listesi ve uyarilari
- Magaza bazli stok dagilimi

#### FR-004: Siparis Analitikleri
- Donem bazli siparis sayisi (bugun, hafta, ay, yil)
- Donem bazli siparis tutari
- Ortalama siparis degeri
- Siparis trend grafikleri
- Magaza bazli siparis dagilimi

#### FR-005: Odeme Analitikleri
- Donem bazli odeme tutarlari
- Odeme yontemi dagilimi
- Bekleyen odeme takibi
- Odeme trend grafikleri

#### FR-006: Finansal Hesaplamalar
- Alis fiyati cekme (custom field: `_purchase_price`)
- Brut kar hesaplama
- Komisyon kesintisi hesaplama
- Kargo maliyeti kesintisi
- Net kar ve kar marji hesaplama

#### FR-007: Iade Takibi
- Iade edilen siparis listesi
- Toplam iade tutari
- Iade orani hesaplama
- Donem bazli iade trend

#### FR-008: Fiyatlandirma Sistemi
- Database toggle mekanizmasi
- Plan tanimlari (Free, Pro, Enterprise)
- Magaza limiti kontrolu
- Ozellik kisitlamalari (plan bazli)

#### FR-009: Grafik ve Gorsellestirme
- Cizgi grafik (trend analizi)
- Bar chart (karsilastirma)
- Pie chart (dagilim)
- Kart gosterimleri (KPI'lar)
- Responsive tasarim

### 6.2 P1 - Should Have

#### FR-010: Kullanici Yetkilendirme Sistemi
- Kayit ol (email, sifre)
- Giris yap
- Sifremi unuttum
- Oturum yonetimi
- JWT token bazli authentication

#### FR-011: Urun Eslestirme
- SKU bazli otomatik eslestirme
- Manuel eslestirme arayuzu
- Eslestirme onerileri
- Konsolide raporlama

#### FR-012: Disa Aktarma
- CSV export
- PDF export
- Tarih araligi filtresi
- Magaza filtresi

### 6.3 P2 - Nice to Have

#### FR-013: Bildirim Sistemi
- Browser push notifications
- In-app bildirimler
- Bildirim tercihleri
- Bildirim gecmisi

#### FR-014: Email Raporlari
- Zamanlanmis email gonderimi
- Rapor sablonlari
- Gonderim sikligi ayarlari

#### FR-015: Harici API
- RESTful API endpoints
- API key yonetimi
- Rate limiting
- API dokumantasyonu

---

## 7. Fonksiyonel Olmayan Gereksinimler (Non-Functional Requirements)

| Kategori | Gereksinim | Hedef |
|----------|-----------|-------|
| **Performans** | Dashboard yukleme suresi | < 3 saniye |
| **Performans** | API yanit suresi | < 500ms |
| **Performans** | Veri senkronizasyonu | < 30 saniye |
| **Olceklenebilirlik** | Esanli kullanici | 500+ |
| **Olceklenebilirlik** | Kullanici basina magaza | 10 (max) |
| **Olceklenebilirlik** | Magaza basina urun | 50,000+ |
| **Erisilebilirlik** | Uptime | %99.5 |
| **Erisilebilirlik** | Planlı bakim penceresi | Haftalik 1 saat (gece) |
| **Guvenlik** | Authentication | JWT + Refresh Token |
| **Guvenlik** | API credentials | AES-256 sifreleme |
| **Guvenlik** | HTTPS | Zorunlu (TLS 1.3) |
| **Guvenlik** | Rate limiting | 100 istek/dakika/kullanici |
| **Uyumluluk** | Tarayici destegi | Chrome, Firefox, Safari, Edge (son 2 versiyon) |
| **Uyumluluk** | Mobil uyumluluk | Responsive tasarim |
| **Veri** | Cache suresi | 5 dakika (yapilandirabilir) |
| **Veri** | Veri saklama | 2 yil gecmis veri |
| **Izleme** | Loglama | Tum API istekleri |
| **Izleme** | Hata takibi | Sentry veya benzeri |

---

## 8. Kisitlamalar (Constraints)

### 8.1 Teknik Kisitlamalar
- **Frontend:** Next.js 14+ (React 18+)
- **Backend:** Node.js 20+ (Express.js veya Fastify)
- **Database:** PostgreSQL 15+ (birincil), Redis (cache)
- **WooCommerce:** REST API v3 (minimum WC 3.5+)
- **Hosting:** Vercel (frontend), Railway/Render (backend)
- **Tarayici:** Modern tarayicilar (IE destegi yok)

### 8.2 Is Kisitlamalari
- **Takvim:** MVP 8 hafta icinde tamamlanmali
- **Ekip:** 1-2 gelistirici
- **Butce:** Bootstrap (dusuk baslangic maliyeti)
- **Dil:** Turkce UI (ilerleyen surecte coklu dil)

### 8.3 Yasal Kisitlamalar
- KVKK uyumlulugu (kisisel veri isleme)
- WooCommerce API kullanim sartlari
- Veri saklama politikalari

---

## 9. Varsayimlar (Assumptions)

1. Kullanicilar stabil internet baglantisina sahip
2. WooCommerce magazalari REST API erisimi acik
3. Kullanici API credentials olusturabilir durumda
4. WooCommerce versiyonu 3.5 veya ustu
5. Urunlerde alis fiyati custom field olarak mevcut (veya eklenecek)
6. Kullanicilar temel web uygulamasi kullanabilir
7. Turkce dil yeterli (MVP icin)
8. Kredi karti odeme entegrasyonu SaaS asamasinda yapilacak

---

## 10. Kapsam Disi (Out of Scope)

MVP ve v1.0 icin asagidakiler kapsam disidir:

- **Mobil uygulama:** Yalnizca responsive web (native app yok)
- **Offline calisma:** Internet baglantisi zorunlu
- **Coklu dil:** Sadece Turkce (v1.0)
- **WooCommerce disindaki platformlar:** Shopify, Magento vb. destegi yok
- **POS entegrasyonu:** Dogrudan POS baglantisi yok
- **Muhasebe entegrasyonu:** Logo, Mikro vb. entegrasyonu yok
- **Otomatik siparis olusturma:** Sadece izleme/raporlama
- **Urun fiyat guncelleme:** WooCommerce'de degisiklik yapma yok
- **Detayli musteri analizi:** Musteri segmentasyonu v2.0'da
- **A/B testing:** Urun/fiyat testleri yok
- **AI/ML tahminleme:** Talep tahmini vb. ilerleyen surece

---

## 11. Basari Metrikleri (Success Metrics)

### 11.1 Kullanici Metrikleri
| Metrik | Hedef (3 ay) | Hedef (6 ay) |
|--------|--------------|--------------|
| Kayitli kullanici | 100 | 500 |
| Aktif kullanici (MAU) | 50 | 250 |
| Bagli magaza sayisi | 200 | 1000 |
| Kullanici basina ortalama magaza | 2 | 2.5 |

### 11.2 Performans Metrikleri
| Metrik | Hedef |
|--------|-------|
| Dashboard yukleme < 3s | %95 |
| API yanit < 500ms | %99 |
| Uptime | %99.5 |
| Hatasiz senkronizasyon | %98 |

### 11.3 Is Metrikleri (SaaS Sonrasi)
| Metrik | Hedef (6 ay) |
|--------|--------------|
| Ucretli donusum orani | %5 |
| Aylik tekrarlayan gelir (MRR) | 5,000 TL |
| Kullanici kayip orani (churn) | <%10 |
| Net Promoter Score (NPS) | >40 |

### 11.4 Kalite Metrikleri
| Metrik | Hedef |
|--------|-------|
| Haftalik bug raporu | <5 |
| Kritik bug cozum suresi | <24 saat |
| Kullanici destek talepleri | <20/hafta |
| Ortalama cozum suresi | <4 saat |

---

## 12. Riskler ve Azaltma Stratejileri (Risks & Mitigations)

| Risk | Olasilik | Etki | Azaltma Stratejisi |
|------|----------|------|--------------------|
| WooCommerce API limitleri | Orta | Yuksek | Aggresif caching, akilli senkronizasyon zamanlama |
| API credentials guvenligi | Dusuk | Cok Yuksek | AES-256 sifreleme, HSM kullanimi |
| Performans sorunlari | Orta | Orta | Erken load testing, CDN kullanimi |
| Kapsam kaymasi (scope creep) | Yuksek | Orta | Siki degisiklik kontrolu, MVP odagi |
| WooCommerce versiyon uyumsuzlugu | Dusuk | Orta | Minimum versiyon kontrolu, fallback mekanizmasi |
| Kullanici benimseme sorunu | Orta | Yuksek | Erken kullanici testleri, feedback dongusu |
| Rakip giris | Orta | Orta | Hizli iterasyon, nis odak |
| Teknik borc | Yuksek | Orta | Code review, refactoring sprintleri |
| Veri kaybi | Dusuk | Cok Yuksek | Otomatik yedekleme, disaster recovery plani |
| Fiyatlandirma hatasi | Orta | Orta | Musteri gorusmeleri, A/B test |

---

## 13. Veri Modeli Genel Bakis (Data Model Overview)

### 13.1 Ana Tablolar

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│     users       │     │     stores      │     │   store_data    │
├─────────────────┤     ├─────────────────┤     ├─────────────────┤
│ id              │────<│ user_id         │     │ store_id        │
│ email           │     │ id              │────<│ id              │
│ password_hash   │     │ name            │     │ data_type       │
│ plan_id         │     │ api_url         │     │ data_json       │
│ created_at      │     │ consumer_key*   │     │ fetched_at      │
│ updated_at      │     │ consumer_secret*│     │ created_at      │
└─────────────────┘     │ commission_rate │     └─────────────────┘
                        │ shipping_cost   │
                        │ status          │
                        │ created_at      │
                        └─────────────────┘

┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│     plans       │     │   settings      │     │ product_mappings│
├─────────────────┤     ├─────────────────┤     ├─────────────────┤
│ id              │     │ id              │     │ id              │
│ name            │     │ key             │     │ user_id         │
│ store_limit     │     │ value           │     │ master_sku      │
│ price_monthly   │     │ updated_at      │     │ store_id        │
│ features_json   │     └─────────────────┘     │ product_id      │
│ is_active       │                             │ created_at      │
└─────────────────┘                             └─────────────────┘

* Sifrelenmis olarak saklanir
```

### 13.2 Cache Yapisi (Redis)

```
store:{store_id}:products      -> Urun listesi cache
store:{store_id}:orders        -> Siparis listesi cache
store:{store_id}:stats         -> Hesaplanmis istatistikler
user:{user_id}:dashboard       -> Dashboard agregat verileri
```

### 13.3 WooCommerce Custom Field

Alis fiyati icin onerilen custom field:

```
Meta Key: _purchase_price
Meta Value: Sayi (ornek: 150.00)
Konum: Urun duzenleme sayfasi, "Genel" sekmesi altinda
```

**WordPress Plugin Onerisi:** "Cost of Goods for WooCommerce" veya ozel mini plugin gelistirme.

Ozel plugin kodu ornegi:
```php
// wc-purchase-price-field.php
add_action('woocommerce_product_options_pricing', function() {
    woocommerce_wp_text_input([
        'id' => '_purchase_price',
        'label' => __('Alis Fiyati (TL)', 'woocommerce'),
        'data_type' => 'price',
        'desc_tip' => true,
        'description' => __('Urunun alis/maliyet fiyati', 'woocommerce')
    ]);
});

add_action('woocommerce_process_product_meta', function($post_id) {
    if (isset($_POST['_purchase_price'])) {
        update_post_meta($post_id, '_purchase_price',
            sanitize_text_field($_POST['_purchase_price']));
    }
});
```

---

## 14. Teknik Mimari Genel Bakis

```
┌────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                            │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    Next.js Frontend                       │  │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────────────┐ │  │
│  │  │Dashboard│ │ Stores  │ │Settings │ │   Analytics     │ │  │
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────────────┘ │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────┘
                              │
                              │ HTTPS/REST
                              ▼
┌────────────────────────────────────────────────────────────────┐
│                         API LAYER                               │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                  Node.js/Express API                      │  │
│  │  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐  │  │
│  │  │  Auth  │ │ Stores │ │Analytics│ │ Sync   │ │Settings│  │  │
│  │  │ Module │ │ Module │ │ Module │ │ Module │ │ Module │  │  │
│  │  └────────┘ └────────┘ └────────┘ └────────┘ └────────┘  │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────┘
                    │                       │
                    ▼                       ▼
┌─────────────────────────┐   ┌─────────────────────────────────┐
│      DATA LAYER         │   │        EXTERNAL APIs            │
│  ┌─────────────────┐   │   │  ┌─────────────────────────┐    │
│  │   PostgreSQL    │   │   │  │   WooCommerce Store 1   │    │
│  │   (Primary DB)  │   │   │  └─────────────────────────┘    │
│  └─────────────────┘   │   │  ┌─────────────────────────┐    │
│  ┌─────────────────┐   │   │  │   WooCommerce Store 2   │    │
│  │     Redis       │   │   │  └─────────────────────────┘    │
│  │    (Cache)      │   │   │  ┌─────────────────────────┐    │
│  └─────────────────┘   │   │  │   WooCommerce Store N   │    │
└─────────────────────────┘   │  └─────────────────────────┘    │
                              └─────────────────────────────────┘
```

---

## 15. API Endpoint Plani

### 15.1 Authentication
```
POST   /api/auth/register       Yeni kullanici kaydi
POST   /api/auth/login          Kullanici girisi
POST   /api/auth/logout         Cikis yap
POST   /api/auth/refresh        Token yenileme
POST   /api/auth/forgot         Sifremi unuttum
POST   /api/auth/reset          Sifre sifirlama
```

### 15.2 Stores
```
GET    /api/stores              Kullanicinin magazalarini listele
POST   /api/stores              Yeni magaza ekle
GET    /api/stores/:id          Magaza detayi
PUT    /api/stores/:id          Magaza guncelle
DELETE /api/stores/:id          Magaza sil
POST   /api/stores/:id/test     Baglanti testi
POST   /api/stores/:id/sync     Manuel senkronizasyon
```

### 15.3 Analytics
```
GET    /api/analytics/overview          Genel ozet
GET    /api/analytics/inventory         Stok analitikleri
GET    /api/analytics/orders            Siparis analitikleri
GET    /api/analytics/payments          Odeme analitikleri
GET    /api/analytics/refunds           Iade analitikleri
GET    /api/analytics/profit            Kar analizi
GET    /api/analytics/trends            Trend verileri
```

### 15.4 Products
```
GET    /api/products                    Tum urunler
GET    /api/products/critical-stock     Kritik stok listesi
GET    /api/products/:id                Urun detayi
POST   /api/products/mappings           Urun eslestirme
DELETE /api/products/mappings/:id       Eslestirme kaldir
```

### 15.5 Settings
```
GET    /api/settings                    Kullanici ayarlari
PUT    /api/settings                    Ayarlari guncelle
GET    /api/settings/plans              Mevcut planlar
```

### 15.6 Export
```
POST   /api/export/csv                  CSV disa aktarma
POST   /api/export/pdf                  PDF disa aktarma
```

---

## 16. UI/UX Wireframe Plani

### 16.1 Ana Sayfa (Dashboard)
```
┌────────────────────────────────────────────────────────────┐
│  [Logo]  Dashboard   Magazalar   Ayarlar      [Profil ▼]  │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐      │
│  │  Toplam  │ │  Bugun   │ │  Toplam  │ │  Kritik  │      │
│  │   Stok   │ │  Satis   │ │   Kar    │ │   Stok   │      │
│  │  12,450  │ │ 4,250 TL │ │ 850 TL   │ │    23    │      │
│  │   adet   │ │  +12%    │ │  +8%     │ │  urun    │      │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘      │
│                                                            │
│  ┌─────────────────────────────┐ ┌─────────────────────┐  │
│  │      Satis Trendi           │ │   Magaza Dagilimi   │  │
│  │    [Cizgi Grafik]           │ │   [Pie Chart]       │  │
│  │                             │ │                     │  │
│  └─────────────────────────────┘ └─────────────────────┘  │
│                                                            │
│  ┌──────────────────────────────────────────────────────┐ │
│  │              Son Siparisler                          │ │
│  │  ┌─────────────────────────────────────────────────┐ │ │
│  │  │ #1234 | Magaza A | 250 TL | Tamamlandi | 10:30 │ │ │
│  │  │ #1235 | Magaza B | 180 TL | Beklemede  | 10:25 │ │ │
│  │  │ #1236 | Magaza A | 420 TL | Tamamlandi | 10:20 │ │ │
│  │  └─────────────────────────────────────────────────┘ │ │
│  └──────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────┘
```

### 16.2 Magaza Yonetimi
```
┌────────────────────────────────────────────────────────────┐
│  Magazalar                              [+ Yeni Magaza]    │
├────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────────┐ │
│  │ [x] Magaza Adi       API Durumu   Komisyon   Islem   │ │
│  ├──────────────────────────────────────────────────────┤ │
│  │ [ ] E-Shop TR        [Bagli]      %8        [...]    │ │
│  │ [ ] ModaStore        [Bagli]      %10       [...]    │ │
│  │ [ ] TechBazaar       [Hata]       %5        [...]    │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                            │
│  2/5 magaza kullaniliyor (Pro Plan)                       │
└────────────────────────────────────────────────────────────┘
```

---

## 17. Fiyatlandirma Plani

### 17.1 Plan Detaylari

| Ozellik | Free | Pro | Enterprise |
|---------|------|-----|------------|
| Magaza limiti | 2 | 5 | 10 (veya sinirsiz) |
| Veri guncelleme | 15 dakika | 5 dakika | 1 dakika |
| Gecmis veri | 30 gun | 1 yil | 2 yil |
| CSV export | Hayir | Evet | Evet |
| PDF export | Hayir | Evet | Evet |
| Email raporlari | Hayir | Hayir | Evet |
| API erisimi | Hayir | Hayir | Evet |
| Oncelikli destek | Hayir | Hayir | Evet |
| **Aylik fiyat** | 0 TL | 99 TL | 299 TL |
| **Yillik fiyat** | 0 TL | 990 TL | 2,990 TL |

### 17.2 Database Toggle

```sql
-- settings tablosunda
INSERT INTO settings (key, value) VALUES ('pricing_enabled', 'false');

-- Pricing aktif etmek icin
UPDATE settings SET value = 'true' WHERE key = 'pricing_enabled';
```

---

## 18. Gelistirme Takvimi

### Hafta 1-2: Temel Altyapi
- [ ] Proje kurulumu (Next.js, Express, PostgreSQL)
- [ ] Veritabani semalari
- [ ] Temel API yapisi
- [ ] WooCommerce API baglanti modulu

### Hafta 3-4: Magaza Yonetimi
- [ ] Magaza CRUD islemleri
- [ ] Baglanti testi
- [ ] Ayarlar paneli
- [ ] Veri senkronizasyonu

### Hafta 5-6: Analytics Dashboard
- [ ] Stok analitikleri
- [ ] Siparis analitikleri
- [ ] Odeme analitikleri
- [ ] Grafik entegrasyonu (Recharts/Chart.js)

### Hafta 7-8: Finansal ve MVP Tamamlama
- [ ] Kar hesaplamalari
- [ ] Iade takibi
- [ ] Kritik stok uyarilari
- [ ] Test ve bug fix
- [ ] MVP lansman

### Hafta 9-12: P1 Ozellikleri
- [ ] Kullanici authentication
- [ ] Urun eslestirme
- [ ] Export fonksiyonlari
- [ ] Fiyatlandirma sistemi

### Hafta 13-16: SaaS Hazirlik
- [ ] Odeme entegrasyonu
- [ ] Plan yonetimi
- [ ] Landing page
- [ ] Dokumantasyon
- [ ] SaaS lansman

---

## 19. Kalite Kontrol Listesi

### Gelistirme Oncesi
- [ ] Tum P0 gereksinimleri kabul kriterleri ile tanimli
- [ ] Kullanici hikayeleri standart formatta
- [ ] Basari metrikleri olculebilir
- [ ] Kisitlamalar acikca belirtilmis
- [ ] Kapsam disi acikca tanimlanmis
- [ ] Belirsiz ifadeler yok ("hizli olmali" -> "3 saniye altinda yuklenmeli")

### Gelistirme Sirasinda
- [ ] Her sprint sonunda calisir demo
- [ ] Code review zorunlu
- [ ] Unit test coverage >70%
- [ ] API dokumantasyonu guncel

### Lansman Oncesi
- [ ] Tum P0 kabul kriterleri karsilanmis
- [ ] Performans testleri basarili
- [ ] Guvenlik taramasi yapilmis
- [ ] Kullanici kabul testleri tamamlanmis
- [ ] Rollback plani hazir

---

## 20. Ekler

### Ek A: WooCommerce API Kullanim Ornekleri

```javascript
// Urunleri cekme
GET /wp-json/wc/v3/products?per_page=100&page=1

// Siparisleri cekme (son 30 gun)
GET /wp-json/wc/v3/orders?after=2026-01-01T00:00:00&per_page=100

// Iadeleri cekme
GET /wp-json/wc/v3/orders?status=refunded&per_page=100

// Urun meta verisi (alis fiyati)
GET /wp-json/wc/v3/products/{id}
// Response: { meta_data: [{ key: "_purchase_price", value: "150.00" }] }
```

### Ek B: Ornek Kar Hesaplama

```
Urun: Ornek T-Shirt
Satis Fiyati: 299.00 TL
Alis Fiyati: 120.00 TL
Magaza Komisyonu: %10 (29.90 TL)
Kargo Maliyeti: 15.00 TL

Brut Kar = 299.00 - 120.00 = 179.00 TL
Net Kar = 179.00 - 29.90 - 15.00 = 134.10 TL
Kar Marji = (134.10 / 299.00) * 100 = %44.85
```

### Ek C: Teknik Stack Detayi

| Katman | Teknoloji | Versiyon |
|--------|----------|----------|
| Frontend | Next.js | 14.x |
| UI Library | React | 18.x |
| Styling | Tailwind CSS | 3.x |
| Charts | Recharts | 2.x |
| State | Zustand | 4.x |
| Backend | Node.js | 20.x |
| Framework | Express.js | 4.x |
| Database | PostgreSQL | 15.x |
| Cache | Redis | 7.x |
| ORM | Prisma | 5.x |
| Auth | JWT | - |
| Validation | Zod | 3.x |
| Testing | Jest + Playwright | - |
| Deployment | Vercel + Railway | - |

---

**Dokuman Sonu**

*Bu spesifikasyon, proje gelistirme surecinde referans olarak kullanilacak olup, gerektiginde guncellenmesi beklenmektedir.*
