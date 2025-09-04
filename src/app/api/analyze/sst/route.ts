import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest){
  const { bbox, date } = await req.json().catch(()=>({}));
  const fakeSstMin = 24.1, fakeSstMax = 27.8;
  const gradient = 'weak-to-moderate break along the NE edge';
  return NextResponse.json({
    sstRange: `${fakeSstMin.toFixed(1)}–${fakeSstMax.toFixed(1)} °C`,
    gradientHint: gradient,
    recs: [
      'Primary: troll the temp edge on the NE line',
      'Secondary: check inside corner at dawn',
      'Timing: 1–2 hrs around tide change'
    ]
  });
}
