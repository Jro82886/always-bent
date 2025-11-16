'use client';

import { useEffect, useState } from 'react';

export type LocationPermissionStatus = 'granted' | 'denied' | 'prompt';

interface UseLocationPermissionReturn {
  status: LocationPermissionStatus;
  isGranted: boolean;
  requestPermission: () => Promise<LocationPermissionStatus>;
  setGlobalPermission: (granted: boolean) => void;
}

export function useLocationPermission(): UseLocationPermissionReturn {
  const [status, setStatus] = useState<LocationPermissionStatus>('prompt');

  useEffect(() => {
    // Check stored permission on mount
    const stored = localStorage.getItem('abfi_location_permission');
    if (stored === 'granted' || stored === 'denied') {
      setStatus(stored as LocationPermissionStatus);
    }

    // Listen for permission changes from other components
    const handlePermissionChange = (event: CustomEvent) => {
      const newStatus = event.detail?.status;
      if (newStatus === 'granted' || newStatus === 'denied') {
        setStatus(newStatus);
      }
    };

    window.addEventListener('abfi-location-permission-changed', handlePermissionChange as EventListener);

    return () => {
      window.removeEventListener('abfi-location-permission-changed', handlePermissionChange as EventListener);
    };
  }, []);

  const requestPermission = async (): Promise<LocationPermissionStatus> => {
    try {
      // First check browser permission
      const result = await navigator.permissions.query({ name: 'geolocation' });
      
      if (result.state === 'denied') {
        setStatus('denied');
        localStorage.setItem('abfi_location_permission', 'denied');
        return 'denied';
      }

      // If browser allows, request actual position to trigger prompt
      return new Promise((resolve) => {
        navigator.geolocation.getCurrentPosition(
          () => {
            // Success - user granted permission
            setStatus('granted');
            localStorage.setItem('abfi_location_permission', 'granted');
            resolve('granted');
          },
          () => {
            // Error - user denied or error occurred
            setStatus('denied');
            localStorage.setItem('abfi_location_permission', 'denied');
            resolve('denied');
          }
        );
      });
    } catch (error) {
      console.error('Error requesting location permission:', error);
      setStatus('denied');
      return 'denied';
    }
  };

  const setGlobalPermission = (granted: boolean) => {
    const newStatus = granted ? 'granted' : 'denied';
    setStatus(newStatus);
    localStorage.setItem('abfi_location_permission', newStatus);
    
    // Dispatch event so other components can react
    window.dispatchEvent(new CustomEvent('abfi-location-permission-changed', {
      detail: { status: newStatus }
    }));
  };

  return {
    status,
    isGranted: status === 'granted',
    requestPermission,
    setGlobalPermission
  };
}
