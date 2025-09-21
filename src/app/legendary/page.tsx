// src/app/legendary/page.tsx
import { redirect } from 'next/navigation';

export default function LegendaryIndex() {
  redirect('/legendary/analysis');
}