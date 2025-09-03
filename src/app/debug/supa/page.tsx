'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function Page() {
  const [result, setResult] = useState<'loading' | 'ok' | 'error'>('loading');
  const [rows, setRows] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.from('profiles').select('*').limit(5);
      if (error) {
        setResult('error');
        return;
      }
      setRows(data ?? []);
      setResult('ok');
    })();
  }, []);

  return (
    <div style={{ padding: 16 }}>
      <h1>Supabase Client Test</h1>
      <p>Status: {result}</p>
      <pre>{JSON.stringify(rows, null, 2)}</pre>
    </div>
  );
}



