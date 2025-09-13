# ABFI Mobile & Notification Implementation Plan

## 🔔 Push Notifications with Supabase

### Option 1: Browser Push Notifications
```typescript
// 1. Request permission
const permission = await Notification.requestPermission();

// 2. Subscribe to push notifications
const registration = await navigator.serviceWorker.register('/sw.js');
const subscription = await registration.pushManager.subscribe({
  userVisibleOnly: true,
  applicationServerKey: urlBase64ToUint8Array(publicVapidKey)
});

// 3. Store subscription in Supabase
await supabase.from('push_subscriptions').insert({
  user_id: userId,
  subscription: subscription.toJSON(),
  inlet_id: selectedInlet
});

// 4. Trigger from Supabase Edge Functions
await supabase.functions.invoke('send-notification', {
  body: {
    title: '🎣 Hotspot Alert!',
    body: 'SST break detected near Montauk Canyon',
    users: ['inlet:montauk']
  }
});
```

### Option 2: Real-time In-App Notifications
```typescript
// Subscribe to Supabase Realtime
supabase
  .channel('notifications')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'notifications',
    filter: `user_id=eq.${userId}`
  }, (payload) => {
    showToast(payload.new);
  })
  .subscribe();
```

### Option 3: Email/SMS via Supabase
```sql
-- Database trigger for catch reports
CREATE OR REPLACE FUNCTION notify_inlet_users()
RETURNS trigger AS $$
BEGIN
  -- Send email to all users in same inlet
  PERFORM net.http_post(
    'https://api.sendgrid.com/v3/mail/send',
    jsonb_build_object(
      'personalizations', jsonb_build_array(
        jsonb_build_object(
          'to', jsonb_build_array(
            jsonb_build_object('email', user_email)
          )
        )
      ),
      'from', jsonb_build_object('email', 'alerts@alwaysbent.com'),
      'subject', 'New catch reported in your inlet!',
      'content', jsonb_build_array(
        jsonb_build_object(
          'type', 'text/plain',
          'value', format('Captain %s just caught %s', NEW.captain_name, NEW.species)
        )
      )
    ),
    headers := jsonb_build_object('Authorization', 'Bearer ' || current_setting('app.sendgrid_api_key'))
  )
  FROM users
  WHERE inlet_id = NEW.inlet_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

## 📱 Mobile Optimization

### 1. Add Viewport Meta Tag
```tsx
// src/app/layout.tsx
export const metadata: Metadata = {
  title: 'Always Bent - Fishing Intelligence',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1',
  themeColor: '#06b6d4',
};
```

### 2. Create Mobile-First Components
```tsx
// Mobile Navigation
<div className="md:hidden fixed bottom-0 left-0 right-0 bg-black/90">
  <nav className="flex justify-around py-2">
    <button>Map</button>
    <button>Chat</button>
    <button>Layers</button>
  </nav>
</div>

// Responsive Map Controls
<div className="fixed top-4 left-4 md:top-20 md:left-20">
  <button className="p-2 md:p-4">SST</button>
</div>
```

### 3. Progressive Web App (PWA)
```json
// public/manifest.json
{
  "name": "Always Bent Fishing Intelligence",
  "short_name": "ABFI",
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    }
  ],
  "start_url": "/",
  "display": "standalone",
  "theme_color": "#06b6d4",
  "background_color": "#000000"
}
```

### 4. Service Worker for Offline
```javascript
// public/sw.js
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open('abfi-v1').then((cache) => {
      return cache.addAll([
        '/',
        '/offline.html',
        '/manifest.json'
      ]);
    })
  );
});

self.addEventListener('push', (event) => {
  const data = event.data.json();
  self.registration.showNotification(data.title, {
    body: data.body,
    icon: '/icon-192.png',
    badge: '/badge-72.png',
    vibrate: [200, 100, 200],
    data: { url: data.url }
  });
});
```

## 🎯 Notification Types to Implement

1. **Hotspot Alerts**
   - SST breaks detected
   - Chlorophyll blooms
   - Eddy formations

2. **Community Notifications**
   - New catches in your inlet
   - Captain mentions
   - Fleet movements

3. **Weather Alerts**
   - Wind changes
   - Storm warnings
   - Optimal conditions

4. **Analysis Complete**
   - Snip tool results ready
   - Daily report available

## 📊 Database Schema

```sql
-- Notification preferences
CREATE TABLE notification_preferences (
  user_id UUID PRIMARY KEY,
  push_enabled BOOLEAN DEFAULT false,
  email_enabled BOOLEAN DEFAULT false,
  sms_enabled BOOLEAN DEFAULT false,
  hotspot_alerts BOOLEAN DEFAULT true,
  community_alerts BOOLEAN DEFAULT true,
  weather_alerts BOOLEAN DEFAULT true,
  quiet_hours_start TIME,
  quiet_hours_end TIME
);

-- Push subscriptions
CREATE TABLE push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  subscription JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Notification queue
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  type VARCHAR(50) NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  data JSONB,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);
```

## 🚀 Implementation Priority

1. **Phase 1: Mobile Basics** (1 day)
   - Add viewport meta
   - Fix overflow issues
   - Basic responsive breakpoints

2. **Phase 2: In-App Notifications** (2 days)
   - Toast component
   - Real-time Supabase subscription
   - Notification center

3. **Phase 3: Push Notifications** (3 days)
   - Service worker
   - Push subscription
   - Supabase Edge Functions

4. **Phase 4: Mobile UI** (1 week)
   - Bottom navigation
   - Touch-friendly controls
   - Swipe gestures for layers

## 🔧 Quick Start Commands

```bash
# Install PWA dependencies
npm install --save-dev @ducanh2912/next-pwa

# Install notification library
npm install react-hot-toast

# Install mobile detection
npm install react-device-detect
```

## 📝 Next Steps

1. **Decide notification priority**: Which alerts are most valuable?
2. **Choose implementation**: Start with in-app or go straight to push?
3. **Mobile-first or responsive**: Redesign for mobile or adapt desktop?
4. **User preferences**: How much control over notifications?

---

**Note**: Supabase Realtime + Edge Functions make this very achievable. The main work is UI/UX for mobile and setting up the service worker for push notifications.
