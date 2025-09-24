// Simple, explainable rules that map SST (°F) + CHL (mg/m³) → 'good' | 'possible' | 'unlikely'.
// Optional activityScore (0–5) lets us bump later when vessels are added.

export type Outlook = 'good' | 'possible' | 'unlikely';

type Samp = {
  sst?: { min: number; max: number; mean: number }; // sampler may be °C
  chl?: { min: number; max: number; mean: number }; // mg/m³
};

function cToF(c: number) { return (c * 9) / 5 + 32; }

function catFrom(cond: boolean, borderline: boolean): Outlook {
  if (cond) return 'good';
  if (borderline) return 'possible';
  return 'unlikely';
}

function applyActivityBump(base: Outlook, activityScore?: number): Outlook {
  if (activityScore == null) return base;
  if (activityScore >= 4) {
    if (base === 'possible') return 'good';
    if (base === 'unlikely') return 'possible';
  }
  return base;
}

export function computeSpeciesOutlook(
  samp: Samp,
  opts?: { activityScore?: number }
): { tuna: Outlook; mahi: Outlook; billfish: Outlook } {
  if (!samp) return { tuna: 'unlikely', mahi: 'unlikely', billfish: 'unlikely' };

  // Convert SST to °F if sampler is °C
  const sstF = samp.sst
    ? { min: cToF(samp.sst.min), max: cToF(samp.sst.max), mean: cToF(samp.sst.mean) }
    : undefined;

  const chl = samp.chl?.mean;

  // Thresholds (tunable)
  const tunaGood = !!sstF && sstF.mean >= 68 && sstF.mean <= 76;
  const tunaBorderline = !!sstF && sstF.mean >= 64 && sstF.mean <= 80;

  const mahiGood = !!sstF && sstF.mean >= 74 && sstF.mean <= 86;
  const mahiBorderline = !!sstF && sstF.mean >= 70 && sstF.mean <= 90;

  const billGood = !!sstF && sstF.mean >= 78 && sstF.mean <= 86;
  const billBorderline = !!sstF && sstF.mean >= 74 && sstF.mean <= 90;

  const isClear = chl != null && chl <= 0.20;
  const isGreen = chl != null && chl >= 0.80;

  function adjustForChl(base: Outlook, species: 'tuna'|'mahi'|'billfish'): Outlook {
    if (isClear && (species === 'mahi' || species === 'billfish')) {
      if (base === 'possible') return 'good';
    }
    if (isGreen && (species === 'mahi' || species === 'billfish')) {
      if (base === 'good') return 'possible';
      if (base === 'possible') return 'unlikely';
    }
    if (species === 'tuna') {
      if (isGreen && base === 'good') return 'possible';
    }
    return base;
  }

  let tuna: Outlook = catFrom(tunaGood, tunaBorderline);
  let mahi: Outlook = catFrom(mahiGood, mahiBorderline);
  let bill: Outlook = catFrom(billGood, billBorderline);

  tuna = adjustForChl(tuna, 'tuna');
  mahi = adjustForChl(mahi, 'mahi');
  bill = adjustForChl(bill, 'billfish');

  tuna = applyActivityBump(tuna, opts?.activityScore);
  mahi = applyActivityBump(mahi, opts?.activityScore);
  bill = applyActivityBump(bill, opts?.activityScore);

  return { tuna, mahi, billfish: bill };
}


