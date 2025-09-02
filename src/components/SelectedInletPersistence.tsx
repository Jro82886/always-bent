'use client';

import { useEffect } from 'react';
import { useAppState } from '@/store/appState';

const STORAGE_KEY = 'abfi_selected_inlet';

export default function SelectedInletPersistence() {
  const { selectedInletId, setSelectedInletId } = useAppState();

  // Hydrate from localStorage once
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved && saved !== selectedInletId) {
        setSelectedInletId(saved);
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist on changes
  useEffect(() => {
    try {
      if (selectedInletId) localStorage.setItem(STORAGE_KEY, selectedInletId);
    } catch {}
  }, [selectedInletId]);

  return null;
}


