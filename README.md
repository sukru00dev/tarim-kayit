# Web Tabanlı Tarımsal Maliyet ve Girdi Yönetim Sistemi

Harran Üniversitesi · Yazılım Mühendisliği · Çok Disiplinli Mühendislik Projesi

**Öğrenciler:** Şükrü Baş (Yazılım Müh.) · Dilara Koşar (Ziraat Müh.)  
**Danışman:** Prof. Dr. Dursun Akaslan

## Proje Özeti

Çiftçilerin tarla bazında dönemsel girdi maliyetlerini (tohum, gübre, yakıt, ilaç, işçilik) kaydetmesini, dekar başına maliyet analizlerini görselleştirmesini ve ziraat bilgisine dayalı karar destek önerileri almasını sağlayan MERN Stack web uygulaması.

## Teknoloji Yığını

| Katman | Teknoloji |
|--------|-----------|
| Frontend | React, Vite, Tailwind CSS, Recharts |
| Backend | Node.js, Express.js, JWT Auth |
| Veritabanı | MongoDB (Mongoose ODM) |
| API Docs | Swagger UI |

## Kurulum

### Gereksinimler

- Node.js 18+
- MongoDB (yerel veya MongoDB Atlas)

### 1. Backend

```bash
cd server
cp .env.example .env
npm install
npm run seed    # Demo verileri yükle
npm run dev     # http://localhost:5000
```

### 2. Frontend

```bash
cd client
npm install
npm run dev     # http://localhost:5173
```

## Demo Hesapları

| Rol | Kullanıcı adı | Şifre |
|-----|---------------|-------|
| Admin | `admin` | `admin123` |
| Çiftçi | `ahmet_ciftci` | `ciftci123` |

## Özellikler

- Kullanıcı adı + şifre ile giriş (admin tarafından kullanıcı ekleme)
- Tarla yönetimi (CRUD)
- Yıl + dönem bazlı sezon kayıtları (Yaz, Kış, İlkbahar, Sonbahar)
- Default girdiler + serbest girdi ekleme
- Backend'de dekar başına maliyet hesaplama
- Dashboard: KPI kartları, pasta grafik, trend grafiği
- Karar Destek: sezon karşılaştırma, bölgesel kıyas, kural tabanlı uyarılar
- Yazdırılabilir sezon raporu
- Admin paneli + Swagger API dokümantasyonu

## API

- Health: `GET /api/health`
- Swagger: `http://localhost:5000/api/docs`

## MongoDB Atlas

`.env` dosyasında `MONGODB_URI` değerini Atlas connection string ile değiştirin:

```
MONGODB_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/tarimsal_maliyet
```

## Proje Yapısı

```
cok_disiplinli_proje/
├── client/          # React frontend
├── server/          # Express backend
│   └── src/
│       ├── models/
│       ├── controllers/
│       ├── routes/
│       └── utils/
└── README.md
```

## Sunum Demo Akışı

1. Landing sayfası → proje tanıtımı
2. Çiftçi girişi → Dashboard KPI + grafikler
3. Sezon kaydı ekle → maliyet önizleme
4. Karar Destek → sezon karşılaştırma + uyarılar
5. Rapor → yazdır/PDF
6. Admin paneli → kullanıcı yönetimi + Swagger
