'use client';

import { useEffect, useRef, useState } from 'react';

export function useImageLazyLoad(imageSrc: string) {
  const imgRef = useRef<HTMLImageElement>(null);
  const [loaded, setLoaded] = useState(false);
  
  useEffect(() => {
    if (!imgRef.current) return;
    
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          const img = entry.target as HTMLImageElement;
          img.src = imageSrc;
          img.onload = () => setLoaded(true);
          observer.unobserve(img);
        }
      },
      { rootMargin: '50px' }
    );
    
    observer.observe(imgRef.current);
    
    return () => observer.disconnect();
  }, [imageSrc]);
  
  return { imgRef, loaded };
}
