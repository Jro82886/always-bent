'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useMemberstack } from '@memberstack/react';

export const dynamic = 'force-dynamic';

export default function RegisterPage() {
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-950 to-slate-950 flex items-center justify-center">
        <div className="text-cyan-400 animate-pulse">Loading...</div>
      </div>
    );
  }

  return <RegisterForm />;
}

function RegisterForm() {
  const router = useRouter();
  const memberstack = useMemberstack();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    captainName: '',
    boatName: '',
    homePort: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Sign up with Memberstack
      // @ts-ignore - Memberstack types are incomplete
      const result = await memberstack?.signupMemberEmailPassword({
        email: formData.email,
        password: formData.password,
        customFields: {
          captainName: formData.captainName,
          boatName: formData.boatName,
          homePort: formData.homePort,
          betaTester: true,
        },
        plans: ['pln_beta_free'], // Assign beta plan
      });

      // Store user data in localStorage
      localStorage.setItem('abfi_captain_name', formData.captainName);
      localStorage.setItem('abfi_boat_name', formData.boatName);
      localStorage.setItem('abfi_home_port', formData.homePort);

      // Redirect to welcome/onboarding
      router.push('/legendary/welcome');
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-950 to-slate-950 flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full">
        <div className="bg-slate-900/50 backdrop-blur-xl rounded-lg border border-cyan-500/20 p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Join the Fleet</h1>
            <p className="text-gray-400">Create your Always Bent account</p>
            <div className="mt-2 inline-flex items-center px-3 py-1 bg-cyan-500/10 border border-cyan-500/20 rounded-full">
              <span className="text-sm text-cyan-400">🎣 Free Beta Access</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-slate-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                placeholder="captain@boat.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                minLength={8}
                value={formData.password}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-slate-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                placeholder="••••••••"
              />
              <p className="mt-1 text-xs text-gray-500">Minimum 8 characters</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="captainName" className="block text-sm font-medium text-gray-300 mb-2">
                  Captain Name
                </label>
                <input
                  id="captainName"
                  name="captainName"
                  type="text"
                  required
                  value={formData.captainName}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-slate-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  placeholder="Captain Smith"
                />
              </div>

              <div>
                <label htmlFor="boatName" className="block text-sm font-medium text-gray-300 mb-2">
                  Boat Name
                </label>
                <input
                  id="boatName"
                  name="boatName"
                  type="text"
                  required
                  value={formData.boatName}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-slate-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  placeholder="Reel Deal"
                />
              </div>
            </div>

            <div>
              <label htmlFor="homePort" className="block text-sm font-medium text-gray-300 mb-2">
                Home Port
              </label>
              <input
                id="homePort"
                name="homePort"
                type="text"
                required
                value={formData.homePort}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-slate-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                placeholder="Ocean City, MD"
              />
            </div>

            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-cyan-500 hover:bg-cyan-400 text-gray-900 font-semibold rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-400">
              Already have an account?{' '}
              <Link href="/auth/login" className="text-cyan-400 hover:text-cyan-300 transition-colors">
                Log in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
