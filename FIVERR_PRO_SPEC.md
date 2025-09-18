# 🎯 Webflow + Memberstack Project Specification

## Project: SaaS Landing Page with Authentication Gate

### Stack
- **Webflow:** Landing page & hosting
- **Memberstack 2.0:** Authentication & member management
- **Redirect Target:** External React app (URL provided during testing)

---

## 📋 Deliverables

### 1. Webflow Landing Page
- Single page (no additional pages needed)
- Dark SaaS aesthetic (#030712 background, #22d3ee accent)
- Mobile responsive
- Torch template or similar as base (your choice)

### 2. Memberstack Configuration
- Single free plan: "Beta Access" ($0)
- Email/password authentication
- Custom fields: `boatName` (text), `homePort` (text) - optional on signup
- Post-auth redirect to external app

### 3. Authentication Flow
```javascript
// Launch Button Logic
if (member.loggedIn) {
  -> Redirect to app with member data in localStorage
} else {
  -> Open Memberstack signup modal
  -> After successful signup -> Redirect to app
}
```

### 4. Data Handoff to App
Pass via localStorage before redirect:
```javascript
localStorage.setItem('abfi_authenticated', 'true');
localStorage.setItem('abfi_member_id', member.id);
localStorage.setItem('abfi_member_email', member.email);
localStorage.setItem('abfi_boat_name', member.boatName || '');
localStorage.setItem('abfi_home_port', member.homePort || '');
```

---

## 🎨 Design Requirements

### Hero Section
```
H1: Always Bent Fishing Intelligence
H2: Powered by AI. Driven by Community.
Body: Real-time ocean data, vessel tracking, and hotspot analysis.
CTA: "Start Free Beta" (triggers auth flow)
```

### Color Palette
```css
--background: #030712;
--card-bg: #111827;
--primary: #22d3ee;
--primary-hover: #06b6d4;
--text: #f9fafb;
--text-muted: #9ca3af;
--border: #374151;
```

### Additional Sections (Optional - Nice to Have)
- 3-card value proposition
- Simple footer with legal links
- Social proof numbers (can be static)

---

## 🔧 Technical Requirements

### Webflow Custom Code (Head)
```html
<!-- Memberstack -->
<script src="https://api.memberstack.io/static/memberstack.js" data-memberstack-app="[APP_ID]"></script>

<!-- Custom Styles -->
<style>
  /* Dark theme overrides */
  :root {
    --background: #030712;
    --primary: #22d3ee;
    /* ... rest of palette */
  }
  
  /* Memberstack modal theming */
  .ms-modal {
    background: #111827 !important;
    /* ... dark theme for modals */
  }
</style>
```

### Webflow Custom Code (Body)
```javascript
<script>
// Smart redirect with auth check
document.addEventListener('DOMContentLoaded', function() {
  const ctaButtons = document.querySelectorAll('[data-action="launch-app"]');
  
  ctaButtons.forEach(button => {
    button.addEventListener('click', async (e) => {
      e.preventDefault();
      
      const { data: member } = await window.$memberstackDom.getCurrentMember();
      
      if (member) {
        // Pass member data to app
        localStorage.setItem('abfi_authenticated', 'true');
        localStorage.setItem('abfi_member_id', member.id);
        localStorage.setItem('abfi_member_email', member.email);
        // ... other fields
        
        // Redirect to app
        window.location.href = '[APP_URL]'; // Will provide
      } else {
        // Open signup modal
        window.$memberstackDom.openModal('signup').then(({ data: newMember }) => {
          if (newMember) {
            // Same localStorage setup
            // Then redirect
          }
        });
      }
    });
  });
});
</script>
```

### Memberstack Settings
- **App Name:** Always Bent Fishing Intelligence
- **Signup Mode:** Email/password only (no social auth yet)
- **Email Verification:** Optional (disabled for beta)
- **Custom Redirects:** Handle via JavaScript (not dashboard)
- **Branding:** Hide Memberstack branding

---

## 📦 What I Provide

1. **Webflow Account:** Editor access (you create project)
2. **Memberstack Account:** Admin access (you configure)
3. **Logo Assets:** Will upload to Webflow
4. **App URL:** For redirect testing (provided at testing phase)
5. **Domain:** I'll handle DNS after handoff

---

## ✅ Acceptance Criteria

1. **Desktop:** Landing page looks professional, dark theme applied
2. **Mobile:** Fully responsive, CTA prominent
3. **New User Flow:** Click CTA → Signup modal → Account created → Redirect to app with data
4. **Returning User Flow:** Click CTA → Instant redirect to app
5. **Data Transfer:** localStorage contains member data before redirect
6. **Speed:** Page loads under 3 seconds
7. **Browser Support:** Chrome, Safari, Firefox (latest versions)

---

## 🚫 Out of Scope

- Payment processing (Stripe integration)
- Multiple pages or routing
- Blog/CMS setup
- Email automation (beyond Memberstack defaults)
- Complex animations
- SEO optimization (basic only)
- Custom backend/API work

---

## 📅 Timeline & Communication

- **Delivery:** 3-5 days
- **Revisions:** 2 rounds included
- **Support:** 14 days post-delivery for bugs
- **Updates:** Daily progress message
- **Handoff:** Transfer ownership of both projects

---

## 💰 Budget Range
$300-500 for complete setup (negotiable based on experience)

---

## 🤝 To Apply

Please confirm:
1. You've built Webflow + Memberstack projects before
2. You can deliver in 3-5 days
3. You're comfortable with custom JavaScript for auth flows
4. You can style Memberstack modals to match dark theme

Include 1-2 examples of similar projects if available.

---

## 🔄 Project Phases

**Phase 1:** Webflow setup + basic landing (Day 1-2)
**Phase 2:** Memberstack integration (Day 2-3)
**Phase 3:** Auth flow + testing (Day 3-4)
**Phase 4:** Revisions + handoff (Day 4-5)

---

**Note:** This is a straightforward project for someone experienced with both platforms. The app is already built - you're just creating the authenticated front door.
