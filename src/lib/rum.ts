// Real User Monitoring - Track actual user experience
import * as Sentry from '@sentry/nextjs';

interface PerformanceMetrics {
  fcp: number; // First Contentful Paint
  lcp: number; // Largest Contentful Paint
  fid: number; // First Input Delay
  cls: number; // Cumulative Layout Shift
  ttfb: number; // Time to First Byte
}

class RealUserMonitoring {
  private metrics: PerformanceMetrics = {
    fcp: 0,
    lcp: 0,
    fid: 0,
    cls: 0,
    ttfb: 0,
  };
  
  private rageClicks = 0;
  private deadClicks = 0;
  private errors: Error[] = [];
  
  constructor() {
    if (typeof window !== 'undefined') {
      this.initializeObservers();
      this.trackUserFrustration();
      this.trackCoreWebVitals();
    }
  }
  
  private initializeObservers() {
    // Performance Observer for Core Web Vitals
    if ('PerformanceObserver' in window) {
      // LCP
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        this.metrics.lcp = lastEntry.startTime;
        this.reportMetric('LCP', lastEntry.startTime);
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
      
      // FID
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          this.metrics.fid = entry.processingStart - entry.startTime;
          this.reportMetric('FID', this.metrics.fid);
        });
      });
      fidObserver.observe({ entryTypes: ['first-input'] });
      
      // CLS
      let clsValue = 0;
      const clsObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry: any) => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
            this.metrics.cls = clsValue;
          }
        });
      });
      clsObserver.observe({ entryTypes: ['layout-shift'] });
    }
  }
  
  private trackUserFrustration() {
    let clickCount = 0;
    let clickTimer: NodeJS.Timeout;
    
    document.addEventListener('click', (e) => {
      clickCount++;
      
      // Rage click detection (3+ clicks in 1 second)
      clearTimeout(clickTimer);
      clickTimer = setTimeout(() => {
        if (clickCount >= 3) {
          this.rageClicks++;
          this.reportFrustration('rage-click', {
            target: (e.target as HTMLElement).tagName,
            count: clickCount,
          });
        }
        clickCount = 0;
      }, 1000);
      
      // Dead click detection (click with no response)
      const target = e.target as HTMLElement;
      const hasHandler = target.onclick || target.getAttribute('onClick');
      const isLink = target.tagName === 'A' || target.closest('a');
      const isButton = target.tagName === 'BUTTON' || target.closest('button');
      
      if (!hasHandler && !isLink && !isButton) {
        this.deadClicks++;
        this.reportFrustration('dead-click', {
          target: target.tagName,
          text: target.textContent?.slice(0, 50),
        });
      }
    });
  }
  
  private trackCoreWebVitals() {
    // TTFB
    if (window.performance && window.performance.timing) {
      const timing = window.performance.timing;
      this.metrics.ttfb = timing.responseStart - timing.navigationStart;
    }
    
    // FCP
    if ('PerformanceObserver' in window) {
      const fcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          if (entry.name === 'first-contentful-paint') {
            this.metrics.fcp = entry.startTime;
            this.reportMetric('FCP', entry.startTime);
          }
        });
      });
      fcpObserver.observe({ entryTypes: ['paint'] });
    }
  }
  
  private reportMetric(name: string, value: number) {
    // Send to analytics
    Sentry.addBreadcrumb({
      category: 'performance',
      message: `${name}: ${value}ms`,
      level: 'info',
      data: { metric: name, value },
    });
    
    // Alert on poor performance
    const thresholds = {
      FCP: 1800,
      LCP: 2500,
      FID: 100,
      CLS: 0.1,
      TTFB: 800,
    };
    
    if (value > thresholds[name as keyof typeof thresholds]) {
      console.warn(`Poor ${name} performance: ${value}ms`);
      Sentry.captureMessage(`Poor ${name} performance`, 'warning');
    }
  }
  
  private reportFrustration(type: string, data: any) {
    Sentry.addBreadcrumb({
      category: 'user-frustration',
      message: type,
      level: 'warning',
      data,
    });
    
    // Track patterns
    if (this.rageClicks > 5) {
      Sentry.captureMessage('High user frustration detected', 'error');
    }
  }
  
  public getMetrics() {
    return {
      performance: this.metrics,
      frustration: {
        rageClicks: this.rageClicks,
        deadClicks: this.deadClicks,
      },
      errors: this.errors.length,
    };
  }
}

// Singleton
export const rum = new RealUserMonitoring();
