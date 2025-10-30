'use client';

import { useState } from 'react';

export default function DemoLogin() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleDemoLogin = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/auth/demo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.ok) {
        setIsLoggedIn(true);
        // Refresh the page to update auth state
        setTimeout(() => window.location.reload(), 500);
      }
    } catch (error) {
      console.error('Demo login failed:', error);
    }
    setLoading(false);
  };

  const checkAuth = async () => {
    const response = await fetch('/api/auth/demo');
    const data = await response.json();
    setIsLoggedIn(data.authenticated);
  };

  // Check auth status on mount
  useState(() => {
    checkAuth();
  });

  return (
    <div className="fixed top-4 right-4 z-[200]">
      {isLoggedIn ? (
        <div className="bg-green-600 text-white px-4 py-2 rounded-lg">
          ✓ Demo User Logged In
        </div>
      ) : (
        <button
          onClick={handleDemoLogin}
          disabled={loading}
          className="bg-cyan-600 hover:bg-cyan-500 text-white px-6 py-2 rounded-lg font-medium transition-colors"
        >
          {loading ? 'Logging in...' : 'Demo Login (Milestone 1)'}
        </button>
      )}
    </div>
  );
}