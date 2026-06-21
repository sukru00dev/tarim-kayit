#!/bin/bash
echo "Uygulama güncelleniyor ve derleniyor..."

# En son kodları çekin (Eğer git kullanıyorsanız aktifleştirin)
# git pull origin main

# Sunucu bağımlılıklarını kur
echo "Sunucu (Backend) paketleri yükleniyor..."
cd server
npm install
cd ..

# İstemci bağımlılıklarını kur ve derle
echo "İstemci (Frontend) paketleri yükleniyor ve derleniyor..."
cd client
npm install
npm run build
cd ..

# PM2 ile uygulamayı yeniden başlat
echo "PM2 yeniden başlatılıyor..."
pm2 restart ecosystem.config.cjs || pm2 start ecosystem.config.cjs

echo "Dağıtım tamamlandı!"
