'use client';
import { Suspense } from 'react';
import ReportsFilters from './ReportsFilters';

export default function ReportsFiltersWrapper() {
  return (
    <Suspense fallback={<div className="h-14 bg-black/40 animate-pulse" />}>
      <ReportsFilters />
    </Suspense>
  );
}
