'use client';

import { useMemberstack } from '@memberstack/react';
import { useRouter } from 'next/navigation';

export default function LogoutButton({ className }: { className?: string }) {
  const memberstack = useMemberstack();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      // Logout from Memberstack
      // @ts-ignore - Memberstack types are incomplete
      await memberstack?.logoutMember?.();
      
      // Clear all local storage
      localStorage.removeItem('abfi_authenticated');
      localStorage.removeItem('abfi_member_id');
      localStorage.removeItem('abfi_member_email');
      localStorage.removeItem('abfi_captain_name');
      localStorage.removeItem('abfi_boat_name');
      localStorage.removeItem('abfi_home_port');
      localStorage.removeItem('abfi_username');
      localStorage.removeItem('abfi_selected_inlet');
      
      // Clear cookies
      document.cookie = 'abfi_onboarded=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      
      // Redirect to login
      router.push('/auth/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <button
      onClick={handleLogout}
      className={className || "text-gray-400 hover:text-white transition-colors"}
    >
      Logout
    </button>
  );
}
