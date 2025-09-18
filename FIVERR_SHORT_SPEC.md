# Webflow + Memberstack Landing Page

## Project Overview
Build a single-page SaaS landing with Memberstack authentication that redirects to our existing React app.

## What This Is
**The App:** A fishing intelligence platform that helps anglers find fish using:
- Real-time ocean temperature maps (SST/chlorophyll)
- Commercial vessel tracking (see where the pros fish)
- Weather and tide data
- Community features (share catches, chat)

**Your Task:** Build ONLY the marketing landing page with signup/login. The actual app is already built and working. When users sign up through your landing page, they get redirected to our app at [URL provided during testing].

**Think of it like:** You're building the front door (landing page + auth) for an already-built house (our app).

## Technical Requirements

**Webflow:**
- Dark theme landing page (#030712 background, #22d3ee accent)
- Mobile responsive
- Use Torch or similar template as base

**Memberstack 2.0:**
- Email/password authentication
- Single paid plan: "Pro Access" ($39/month or your pricing)
- Custom fields: boatName, homePort (optional)
- Stripe integration for payments

**Authentication Flow:**
```
User clicks "Get Started" →
├─ If logged in → Redirect to app with member ID
└─ If not → Show signup modal → Create account → Payment → Redirect to app
```

**Data Handoff via URL:** 
After successful auth, redirect with member data as URL parameters:
```javascript
// After successful signup/login:
const redirectUrl = `https://always-bent.vercel.app/legendary?memberId=${member.id}&email=${member.email}&authenticated=true`;
window.location.href = redirectUrl;
```

**Note:** The app will read these URL params and store them locally on its own domain.

## Content

**Hero Section:**
- H1: Always Bent Fishing Intelligence
- H2: Powered by AI. Driven by Community.
- Body: Real-time ocean data, vessel tracking, and hotspot analysis.
- CTA: "Get Started" or "Start Your Trial"

**Colors:**
- Background: #030712
- Primary: #22d3ee
- Text: #f9fafb

## Deliverables
1. Configured Webflow project
2. Memberstack integration
3. Custom auth flow JavaScript
4. Dark-themed Memberstack modals
5. Documentation for maintenance

## What I Provide
- Webflow account access
- Memberstack account access
- Logo assets
- App redirect URL (during testing)

## Timeline & Budget
- Delivery: 3-5 days
- Budget: $300-500
- Revisions: 2 rounds
- Support: 14 days for bugs

## To Apply
Confirm you have:
- Webflow + Memberstack 2.0 experience
- Custom JavaScript skills
- Dark/modern SaaS portfolio examples

**Note:** The app exists. You're just building the authenticated landing page.
