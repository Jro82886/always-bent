'use client';

import { useEffect, useState } from 'react';
import { useAppState } from '@/lib/store';
import { supabase } from '@/lib/supabase/client';

const STORAGE_KEY = 'abfi_selected_inlet';

export default function SelectedInletPersistence() {
  const { selectedInletId, setSelectedInletId } = useAppState();
  const [initialized, setInitialized] = useState(false);

  // Hydrate from Supabase first (cross-device), then localStorage (fallback)
  useEffect(() => {
    const initInlet = async () => {
      try {
        // Check if user is authenticated
        const { data: { session } } = await supabase.auth.getSession();

        if (session?.user) {
          // User is logged in - check Supabase user_metadata for saved inlet
          const savedInlet = session.user.user_metadata?.selected_inlet;

          if (savedInlet && savedInlet !== selectedInletId) {
            console.log('[INLET PERSISTENCE] Restoring inlet from Supabase:', savedInlet);
            setSelectedInletId(savedInlet);
            localStorage.setItem(STORAGE_KEY, savedInlet);
            setInitialized(true);
            return;
          }
        }

        // Fallback to localStorage if no Supabase inlet or not logged in
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved && saved !== selectedInletId) {
          console.log('[INLET PERSISTENCE] Restoring inlet from localStorage:', saved);
          setSelectedInletId(saved);
        }
      } catch (error) {
        console.error('[INLET PERSISTENCE] Error during init:', error);
      } finally {
        setInitialized(true);
      }
    };

    initInlet();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist changes to both localStorage and Supabase
  useEffect(() => {
    if (!initialized || !selectedInletId) return;

    const persistInlet = async () => {
      try {
        // Save to localStorage
        localStorage.setItem(STORAGE_KEY, selectedInletId);

        // Save to Supabase if user is authenticated
        const { data: { session } } = await supabase.auth.getSession();

        if (session?.user) {
          console.log('[INLET PERSISTENCE] Saving inlet to Supabase:', selectedInletId);

          const { error } = await supabase.auth.updateUser({
            data: {
              ...session.user.user_metadata,
              selected_inlet: selectedInletId
            }
          });

          if (error) {
            console.error('[INLET PERSISTENCE] Failed to save to Supabase:', error);
          } else {
            console.log('[INLET PERSISTENCE] Successfully saved to Supabase');
          }
        }
      } catch (error) {
        console.error('[INLET PERSISTENCE] Error persisting inlet:', error);
      }
    };

    persistInlet();
  }, [selectedInletId, initialized]);

  return null;
}


