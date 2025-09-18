# Webflow Torch Template Customization Guide

## 🎨 Brand Colors to Apply

### Primary Colors
- **Background:** #030712 (gray-950) or #111827 (gray-900)
- **Primary Accent:** #22d3ee (cyan-400)
- **Secondary Accent:** #06b6d4 (cyan-500)
- **Text Primary:** #f9fafb (gray-50)
- **Text Secondary:** #9ca3af (gray-400)

### Gradient Backgrounds
Use these CSS gradients in Webflow:
```css
background: linear-gradient(to bottom right, #111827, #030712, #0f172a);
```

## 📝 Content Updates

### Hero Section
**Headline:** "Always Bent Fishing Intelligence"
**Subheadline:** "Powered by AI. Driven by Community."
**Description:** "Water bathymetry, vessel patterns, and hot spots. All your fishing tools in one place."

**CTA Buttons:**
- Primary: "Start Free Beta" → Links to app
- Secondary: "View Features" → Scrolls to features section

### Features Section
Replace default features with:

1. **AI-Powered Analysis**
   - "Real-time SST and chlorophyll mapping"
   - "Hotspot detection with SnipTool"
   - "Bathymetry and depth analysis"

2. **Community Intelligence**
   - "Share catches and reports"
   - "Real-time fleet tracking"
   - "Community chat and insights"

3. **Weather & Conditions**
   - "Live weather updates"
   - "Tide and moon phases"
   - "7-day marine forecast"

4. **Vessel Tracking**
   - "AIS vessel monitoring"
   - "Commercial fleet patterns"
   - "Historical vessel data"

### Pricing Section
**Beta Tier (Free)**
- "Join our exclusive beta"
- "Full access to all features"
- "Help shape the platform"
- CTA: "Join Beta"

**Pro Tier ($39/month)**
- "Everything in Beta"
- "Priority support"
- "Advanced analytics"
- "Commercial vessel data"
- CTA: "Coming Soon"

**Fleet Tier ($99/month)**
- "Everything in Pro"
- "Multi-user accounts"
- "Fleet management"
- "API access"
- CTA: "Contact Us"

## 🎯 Navigation Updates

### Top Navigation
- Logo: "ABFI" or "Always Bent"
- Menu Items:
  - Features
  - Pricing
  - Community
  - About
- CTA Button: "Launch App" → links to always-bent.vercel.app

### Footer
- **Company:** About, Contact, Privacy, Terms
- **Product:** Features, Pricing, Roadmap, API
- **Community:** Discord, Facebook, Instagram, YouTube
- **Support:** Help Center, Documentation, Status

## 🔧 Technical Settings

### Custom Code (Head)
```html
<style>
  /* Override Torch template colors */
  :root {
    --primary: #22d3ee;
    --primary-dark: #06b6d4;
    --background: #030712;
    --background-light: #111827;
    --text: #f9fafb;
    --text-muted: #9ca3af;
  }
  
  /* Smooth transitions */
  * {
    transition: all 0.3s ease;
  }
  
  /* Cyan glow effect for buttons */
  .btn-primary {
    background: #22d3ee;
    box-shadow: 0 0 20px rgba(34, 211, 238, 0.5);
  }
  
  .btn-primary:hover {
    box-shadow: 0 0 30px rgba(34, 211, 238, 0.8);
    transform: translateY(-2px);
  }
</style>
```

### Custom Code (Body)
```html
<script>
  // Smooth scroll for anchor links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      document.querySelector(this.getAttribute('href')).scrollIntoView({
        behavior: 'smooth'
      });
    });
  });
</script>
```

## 🚀 Memberstack Integration

1. **In Webflow Project Settings:**
   - Go to Integrations
   - Add Memberstack
   - Paste your Memberstack project ID

2. **Add Memberstack Attributes:**
   - Login button: `ms-modal="login"`
   - Signup button: `ms-modal="signup"`
   - Member-only content: `ms-hide="all"`
   - Profile link: `ms-profile="true"`

3. **Protected App Link:**
   - Add attribute `ms-gate="member"` to "Launch App" button
   - Set redirect URL to: `https://always-bent.vercel.app/legendary`

## 📱 Mobile Optimization

Ensure all sections are:
- **Stack vertically** on mobile
- **Text size:** Min 16px on mobile
- **Buttons:** Min 44px height for touch
- **Padding:** Add extra padding on mobile views

## ✅ Checklist Before Publishing

- [ ] All colors match ABFI brand (dark + cyan)
- [ ] Hero messaging is correct
- [ ] Features reflect actual app capabilities
- [ ] Pricing tiers are set up
- [ ] Memberstack attributes added
- [ ] Mobile responsive tested
- [ ] Custom domain connected
- [ ] SSL certificate active
- [ ] Analytics connected

## 🎯 Final Goal

The website should feel like a natural extension of the app. When users click "Launch App", they should experience a seamless visual transition from the marketing site to the actual application.
