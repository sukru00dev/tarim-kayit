import 'dotenv/config';
import mongoose from 'mongoose';
import Asset from './src/models/Asset.js';

const MONGODB_URI = 'mongodb+srv://admin:Admin12345@cluster0.u8en29i.mongodb.net/test?retryWrites=true&w=majority';

async function runBenchmark() {
  await mongoose.connect(MONGODB_URI);
  console.log("Gelişmiş Veritabanı ve Mongoose Performans Testleri Başlıyor...\n");

  // --- TEST 1: Mongoose Belgeleri vs .lean() ---
  // Uygulama sadece okuma (read-only) yapacaksa Mongoose dokümanına çevirmek ağır bir işlemdir.
  // .lean() fonksiyonu veriyi saf JSON olarak döndürerek hızı inanılmaz artırır.
  console.log("--- TEST 1: Mongoose Nesnesi Oluşturma vs Saf JSON (.lean()) ---");
  
  // Önce belleği ısıtalım
  await Asset.findOne(); 

  const startNorm = Date.now();
  const docsNorm = await Asset.find({}); // Mongoose, dönen veriye save(), update() gibi metotları ekler.
  const timeNorm = Date.now() - startNorm;
  
  const startLean = Date.now();
  const docsLean = await Asset.find({}).lean(); // MongoDB'den ne gelirse onu döndürür, metot eklemez.
  const timeLean = Date.now() - startLean;
  
  console.log(`Yöntem A: Normal .find() kullanımı -> ${timeNorm} ms (Kayıt sayısı: ${docsNorm.length})`);
  console.log(`Yöntem B: .find().lean() kullanımı -> ${timeLean} ms`);
  console.log(`Açıklama: .lean() kullandığınızda Node.js belleği çok daha az yorulur. API saniyede daha fazla istek karşılayabilir.\n`);

  // --- TEST 2: N+1 Sorgu Problemi (For döngüsünde DB çağrısı vs Populate) ---
  console.log("--- TEST 2: N+1 Sorgu Problemi (For Döngüsü vs .populate()) ---");
  const seasons = await Asset.find({ type: 'PlantingSeason' }).lean();
  
  // Kötü Yöntem (N+1 Problemi): Her sezonun tarlasını bulmak için tek tek DB'ye gitmek
  const startLoop = Date.now();
  for (let season of seasons) {
    if (season.fieldId) {
      await Asset.findById(season.fieldId).lean(); // Ağa gidip gelme gecikmesi
    }
  }
  const timeLoop = Date.now() - startLoop;

  // İyi Yöntem: MongoDB sunucusunda ilişkileri birleştirip (Join) tek pakette getirmek
  const startPopulate = Date.now();
  await Asset.find({ type: 'PlantingSeason' }).populate('fieldId').lean(); // Tek ağ isteği
  const timePopulate = Date.now() - startPopulate;

  console.log(`Kötü Yöntem (Döngü içinde ${seasons.length} kere veritabanına bağlanmak): ${timeLoop} ms`);
  console.log(`İyi Yöntem (.populate() ile tek seferde JOIN yapmak): ${timePopulate} ms`);
  console.log(`Açıklama: For döngüsü içinde DB isteği atıldığında, her istek için "Gidiş-Dönüş" (Round-Trip) gecikmesi yaşanır.\n`);

  await mongoose.disconnect();
  process.exit(0);
}

runBenchmark().catch(console.error);
