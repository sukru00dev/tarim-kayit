const SEASON_ORDER = ['İlkbahar', 'Yaz', 'Sonbahar', 'Kış'];

export function calculateInputTotal(amount, unitPrice) {
  return Math.round(amount * unitPrice * 100) / 100;
}

export function calculateSeasonTotals(inputs, areaDecare) {
  const normalizedInputs = inputs.map((input) => {
    const total = calculateInputTotal(input.amount, input.unitPrice);
    return {
      name: input.name,
      category: input.category || 'Diğer',
      amount: input.amount,
      unit: input.unit || 'adet',
      unitPrice: input.unitPrice,
      total,
    };
  });

  const totalCost =
    Math.round(normalizedInputs.reduce((sum, i) => sum + i.total, 0) * 100) / 100;
  const costPerDecare =
    areaDecare > 0
      ? Math.round((totalCost / areaDecare) * 100) / 100
      : 0;

  return { inputs: normalizedInputs, totalCost, costPerDecare };
}

export function buildSeasonLabel(year, seasonPeriod) {
  return `${year} ${seasonPeriod}`;
}

export function getCostBreakdown(inputs) {
  const breakdown = {};
  for (const input of inputs) {
    const key = input.category || 'Diğer';
    breakdown[key] = (breakdown[key] || 0) + input.total;
  }
  return Object.entries(breakdown).map(([category, total]) => ({
    category,
    total: Math.round(total * 100) / 100,
  }));
}

export function generateInsights(records, field, benchmark) {
  const insights = [];
  if (!records.length) {
    insights.push({
      type: 'info',
      title: 'Henüz sezon kaydı yok',
      message: 'Maliyet analizi için en az bir sezon kaydı ekleyin.',
    });
    return insights;
  }

  const sorted = [...records].sort(
    (a, b) => b.year - a.year || SEASON_ORDER.indexOf(b.seasonPeriod) - SEASON_ORDER.indexOf(a.seasonPeriod)
  );
  const latest = sorted[0];
  const previous = sorted[1];

  if (previous) {
    const change =
      ((latest.totalCost - previous.totalCost) / previous.totalCost) * 100;
    const direction = change > 0 ? 'arttı' : 'azaldı';
    insights.push({
      type: change > 15 ? 'warning' : change < -5 ? 'success' : 'info',
      title: 'Sezon karşılaştırması',
      message: `${latest.seasonLabel} döneminde toplam maliyet, ${previous.seasonLabel} dönemine göre %${Math.abs(change).toFixed(1)} ${direction}.`,
    });
  }

  const fuelInputs = latest.inputs.filter((i) => i.category === 'Yakıt');
  const fuelTotal = fuelInputs.reduce((s, i) => s + i.total, 0);
  const fuelShare = latest.totalCost > 0 ? (fuelTotal / latest.totalCost) * 100 : 0;
  if (fuelShare > 35) {
    insights.push({
      type: 'warning',
      title: 'Yakıt maliyeti yüksek',
      message: `Yakıt giderleri toplam maliyetin %${fuelShare.toFixed(0)}'ını oluşturuyor. Operasyon planlaması gözden geçirilebilir.`,
    });
  }

  if (benchmark && latest.costPerDecare > 0) {
    const diff =
      ((latest.costPerDecare - benchmark.regionAvgCostPerDecare) /
        benchmark.regionAvgCostPerDecare) *
      100;
    if (Math.abs(diff) > 10) {
      insights.push({
        type: diff > 0 ? 'warning' : 'success',
        title: 'Bölgesel kıyas',
        message:
          diff > 0
            ? `Dekar başı maliyetiniz (${latest.costPerDecare} ₺), ${field.cropType} için bölge ortalamasından (%${diff.toFixed(0)}) yüksek.`
            : `Dekar başı maliyetiniz (${latest.costPerDecare} ₺), bölge ortalamasının altında — verimli bir sezon.`,
      });
    } else {
      insights.push({
        type: 'success',
        title: 'Bölgesel kıyas',
        message: `Dekar başı maliyetiniz bölge ortalamasıyla uyumlu (${benchmark.regionAvgCostPerDecare} ₺/dekar).`,
      });
    }
  }

  return insights;
}
