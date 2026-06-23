import Asset from '../models/Asset.js';
import ActivityLog from '../models/ActivityLog.js';
import { asyncHandler } from '../middleware/auth.js';

// 1. ÇKS (Çiftçi Kayıt Sistemi) Mock API
export const fetchCKSData = asyncHandler(async (req, res) => {
  const { tcIdentity } = req.body;
  const userId = req.user._id;

  if (!tcIdentity || tcIdentity.length !== 11) {
    return res.status(400).json({ success: false, error: 'Geçerli bir 11 haneli TC Kimlik numarası giriniz.' });
  }

  const mockFields = [
    { name: 'ÇKS - Kuzey Parsel', areaDecare: 45.5, cropType: 'Buğday', polygon: { type: 'Polygon', coordinates: [] } },
    { name: 'ÇKS - Dere Kenarı', areaDecare: 22.0, cropType: 'Mısır', polygon: { type: 'Polygon', coordinates: [] } },
  ];

  const createdAssets = [];

  for (const field of mockFields) {
    const existing = await Asset.findOne({ userId, type: 'Land', name: field.name });
    if (!existing) {
      const newAsset = await Asset.create({
        userId,
        name: field.name,
        type: 'Land',
        areaDecare: field.areaDecare,
        cropType: field.cropType,
        polygon: field.polygon,
        notes: 'e-Devlet ÇKS Sisteminden otomatik aktarıldı.',
      });
      createdAssets.push(newAsset);
    }
  }

  res.json({
    success: true,
    message: `${createdAssets.length} adet tarla ÇKS'den başarıyla sisteme eklendi.`,
    data: createdAssets,
  });
});

// 2. HKS (Hal Kayıt Sistemi) & E-Müstahsil Makbuzu
export const createEInvoice = asyncHandler(async (req, res) => {
  const { lotNumber, quantityKg, unitPriceTry } = req.body;
  
  if (req.user.role !== 'farmer' && req.user.role !== 'enterprise' && req.user.role !== 'market_trader' && req.user.role !== 'admin') {
    return res.status(403).json({ success: false, error: 'Bu işlem için yetkiniz yok.' });
  }

  if (!lotNumber || !quantityKg || !unitPriceTry) {
    return res.status(400).json({ success: false, error: 'E-Fatura için lot numarası, miktar ve birim fiyat zorunludur.' });
  }

  const grossTotalTry = quantityKg * unitPriceTry;
  const taxDeductionTry = grossTotalTry * 0.02; // %2 Stopaj vb.
  const netTotalTry = grossTotalTry - taxDeductionTry;

  const mockInvoice = {
    invoiceNo: `GIB-${new Date().getFullYear()}-${Math.floor(100000000 + Math.random() * 900000000)}`,
    date: new Date(),
    seller: req.user.fullName,
    buyer: 'Hal Komisyoncusu A.Ş.',
    buyerTaxNumber: '1234567890',
    lotNumber,
    quantityKg,
    unitPriceTry,
    grossTotalTry,
    taxDeductionTry,
    netTotalTry,
    status: 'GİB Onaylı (Mock)',
  };

  res.status(201).json({ success: true, message: 'e-Müstahsil Makbuzu başarıyla oluşturuldu.', data: mockInvoice });
});

// 3. OGM ORBİS (Orman Bilgi Sistemi) Entegrasyonu
export const fetchOrbisData = asyncHandler(async (req, res) => {
  if (req.user.role !== 'ogm_officer' && req.user.role !== 'admin') {
    return res.status(403).json({ success: false, error: 'Bu veriye sadece OGM personeli erişebilir.' });
  }

  const orbisData = {
    fireRiskZones: [
      { region: 'Muğla / Marmaris', riskLevel: 'CRITICAL', coordinates: [28.27, 36.85] },
      { region: 'Antalya / Manavgat', riskLevel: 'HIGH', coordinates: [31.43, 36.78] },
    ],
    cuttingQuotas: [
      { district: 'Kastamonu', allowedM3: 45000, utilizedM3: 12000, species: 'Karaçam' },
      { district: 'Bolu', allowedM3: 35000, utilizedM3: 34000, species: 'Göknar' },
    ],
    lastSync: new Date(),
  };

  res.json({ success: true, data: orbisData });
});
