import assert from 'assert';
import {
  calculateInputTotal,
  calculateSeasonTotals,
  buildSeasonLabel,
  getCostBreakdown
} from './src/utils/calculations.js';

console.log("🧪 Sistem Birim Testleri (Unit Tests) Başlatılıyor...\n");

let passed = 0;
let failed = 0;

function runTest(name, testFn) {
  try {
    testFn();
    console.log(`✅ BAŞARILI: ${name}`);
    passed++;
  } catch (error) {
    console.error(`❌ BAŞARISIZ: ${name}`);
    console.error(`   Beklenen: ${error.expected}, Gelen: ${error.actual}`);
    failed++;
  }
}

// TEST 1: Basit Çarpım Testi
runTest("calculateInputTotal - Doğru maliyet hesaplama (Miktar * Birim Fiyat)", () => {
  const result = calculateInputTotal(10, 15.5);
  assert.strictEqual(result, 155, "10 * 15.5 işlemi 155 sonucunu vermelidir.");
});

// TEST 2: Küsurat/Yuvarlama Testi (Finansal verilerde çok önemlidir)
runTest("calculateInputTotal - Küsurat yuvarlama hassasiyeti (Financial Rounding)", () => {
  const result = calculateInputTotal(10.333, 12.111);
  assert.strictEqual(result, 125.14, "Hassas çarpım sonucu iki ondalık basamağa yuvarlanmalıdır (125.14).");
});

// TEST 3: Ana İş Mantığı ve Karbon Ayak İzi Formülü Doğrulaması
runTest("calculateSeasonTotals - Genel maliyet ve Karbon Ayak İzi (CO2e) algoritması", () => {
  const inputs = [
    { name: "Mazot", category: "Yakıt", amount: 100, unitPrice: 40 }, // 4000 TL, 100*2.68 = 268 kg CO2
    { name: "Üre", category: "Gübre", amount: 50, unitPrice: 15 }     // 750 TL, 50*2.5 = 125 kg CO2
  ];
  const areaDecare = 10; // 10 Dekar Tarla
  
  const result = calculateSeasonTotals(inputs, areaDecare);
  
  assert.strictEqual(result.totalCost, 4750, "Toplam maliyet 4000 + 750 = 4750 TL olmalıdır.");
  assert.strictEqual(result.costPerDecare, 475, "Dekar başı maliyet 4750 / 10 = 475 TL olmalıdır.");
  assert.strictEqual(result.carbonFootprint, 393, "Toplam Karbon Ayak İzi (268 + 125) = 393 kg CO2e olmalıdır.");
});

// TEST 4: String Manipülasyonu
runTest("buildSeasonLabel - Periyodik etiket birleştirme", () => {
  const result = buildSeasonLabel(2026, "İlkbahar");
  assert.strictEqual(result, "2026 İlkbahar", "Yıl ve sezon doğru formatta birleştirilmelidir.");
});

// TEST 5: Veri Gruplama (Aggregation) Testi
runTest("getCostBreakdown - Kategorik maliyet dağılımı gruplama doğruluğu", () => {
  const inputs = [
    { category: "Yakıt", total: 1000 },
    { category: "Yakıt", total: 500 },
    { category: "Gübre", total: 300 }
  ];
  const result = getCostBreakdown(inputs);
  
  const yakit = result.find(r => r.category === "Yakıt");
  const gubre = result.find(r => r.category === "Gübre");
  
  assert.strictEqual(yakit.total, 1500, "Aynı kategorideki (Yakıt) veriler toplanarak 1500 olmalıdır.");
  assert.strictEqual(gubre.total, 300, "Tekil kategori (Gübre) değeri 300 olarak kalmalıdır.");
});

console.log("\n📊 Test Raporu Özeti:");
console.log(`------------------------`);
console.log(`Toplam Çalıştırılan Test: ${passed + failed}`);
console.log(`Geçen (Passed) : ${passed}`);
console.log(`Kalan (Failed) : ${failed}`);
console.log(`Başarı Oranı   : %${((passed / (passed+failed))*100).toFixed(0)}`);
console.log(`------------------------`);

if (failed > 0) process.exit(1);
else process.exit(0);
