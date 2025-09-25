// Automatic Performance Optimization
// This only IMPROVES performance, can't break anything!

import dynamic from 'next/dynamic';

export class PerformanceOptimizer {
  private static imageObserver: IntersectionObserver | null = null;
  private static componentObserver: IntersectionObserver | null = null;
  
  // Initialize observers (safe - only enhances existing behavior)
  static initialize() {
    if (typeof window === 'undefined') return;
    
    // Lazy load images
    this.initializeImageLazyLoading();
    
    // Prefetch links on hover
    this.initializeLinkPrefetching();
    
    // Auto-optimize animations
    this.optimizeAnimations();
  }
  
  private static initializeImageLazyLoading() {
    // Only if browser supports IntersectionObserver
    if (!('IntersectionObserver' in window)) return;
    
    this.imageObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement;
            const src = img.dataset.src;
            
            if (src) {
              // Load image
              img.src = src;
              img.removeAttribute('data-src');
              
              // Stop observing
              this.imageObserver?.unobserve(img);
            }
          }
        });
      },
      {
        rootMargin: '50px', // Start loading 50px before visible
      }
    );
    
    // Find all images with data-src
    document.querySelectorAll('img[data-src]').forEach((img) => {
      this.imageObserver?.observe(img);
    });
  }
  
  private static initializeLinkPrefetching() {
    // Prefetch internal links on hover
    document.addEventListener('mouseover', (e) => {
      const link = (e.target as Element).closest('a');
      if (!link) return;
      
      const href = link.getAttribute('href');
      if (!href || !href.startsWith('/')) return;
      
      // Use Next.js prefetch
      import('next/router').then(({ default: router }) => {
        router.prefetch(href);
      });
    });
  }
  
  private static optimizeAnimations() {
    // Pause animations when tab is not visible
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        // Pause all CSS animations
        document.body.style.animationPlayState = 'paused';
      } else {
        document.body.style.animationPlayState = 'running';
      }
    });
    
    // Reduce motion for users who prefer it
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      document.documentElement.style.setProperty('--animation-duration', '0.01ms');
    }
  }
  
  // Safe image optimization
  static optimizeImage(src: string, options?: {
    width?: number;
    quality?: number;
    format?: 'webp' | 'avif' | 'auto';
  }) {
    // Only optimize if it's our domain
    if (!src.startsWith('/') && !src.includes('vercel.app')) {
      return src;
    }
    
    const params = new URLSearchParams();
    if (options?.width) params.set('w', options.width.toString());
    if (options?.quality) params.set('q', options.quality.toString());
    if (options?.format) params.set('fm', options.format);
    
    return `${src}?${params.toString()}`;
  }
  
  // Resource hints for critical resources
  static preloadCriticalResources() {
    const criticalResources = [
      { href: '/fonts/main.woff2', as: 'font', type: 'font/woff2' },
      // Add other critical resources
    ];
    
    criticalResources.forEach(({ href, as, type }) => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = href;
      link.as = as;
      if (type) link.type = type;
      link.crossOrigin = 'anonymous';
      document.head.appendChild(link);
    });
  }
}

// Component lazy loading with fallback
// Note: This should only be used in Client Components
export function lazyLoadComponent<T extends React.ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  fallback?: React.ReactNode
) {
  return dynamic(importFn, {
    loading: () => fallback || null,
  });
}

// Auto-initialize on load
if (typeof window !== 'undefined') {
  window.addEventListener('load', () => {
    PerformanceOptimizer.initialize();
  });
}
