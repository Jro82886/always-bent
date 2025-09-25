'use client';

import { useState, useEffect } from 'react';

export default function VersionIndicator() {
  const [version, setVersion] = useState<string>('');
  
  useEffect(() => {
    fetch('/api/version')
      .then(r => r.json())
      .then(data => setVersion(data.version))
      .catch(() => setVersion('error'));
  }, []);
  
  if (!version) return null;
  
  return (
    <div className="fixed bottom-2 right-2 text-xs text-gray-500 opacity-50 hover:opacity-100 transition-opacity">
      v{version}
    </div>
  );
}
