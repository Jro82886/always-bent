# Memberstack Setup Guide for Always Bent

## 🔐 Initial Setup

### Step 1: Access Memberstack
1. Go to [memberstack.com](https://memberstack.com)
2. Login with: amanda@alwaysbent.com (Google login)
3. Create new project: "Always Bent Fishing Intelligence"

### Step 2: Configure Authentication

#### Email/Password Setup
1. Go to **Settings → Authentication**
2. Enable:
   - ✅ Email/Password login
   - ✅ Magic link (passwordless)
   - ✅ Remember me option
   - ✅ Email verification

#### Custom Fields
Add these member fields:
- `boatName` (text) - Required
- `homePort` (text) - Required  
- `fishingType` (select): Offshore, Inshore, Both
- `betaTester` (boolean) - Default: true
- `subscriptionTier` (text) - Default: "beta"

### Step 3: Membership Plans

#### Beta Plan (Free)
- **Name:** Beta Access
- **Price:** $0/month
- **ID:** `pln_beta_free`
- **Description:** "Exclusive beta access to all features"
- **Permissions:** 
  - Access to app
  - Community features
  - All analysis tools

#### Pro Plan ($39/month)
- **Name:** Pro Angler
- **Price:** $39/month
- **ID:** `pln_pro_monthly`
- **Description:** "Professional fishing intelligence"
- **Permissions:**
  - Everything in Beta
  - Priority support
  - Advanced analytics
  - No watermarks

#### Fleet Plan ($99/month)
- **Name:** Fleet Captain
- **Price:** $99/month
- **ID:** `pln_fleet_monthly`
- **Description:** "Multi-boat fleet management"
- **Permissions:**
  - Everything in Pro
  - 5 user accounts
  - Fleet tracking
  - API access

## 💳 Stripe Integration

### Connect Stripe
1. Go to **Settings → Payments**
2. Click "Connect Stripe"
3. Use existing Stripe account or create new
4. Enable:
   - ✅ Test mode (initially)
   - ✅ Automatic tax collection
   - ✅ Customer portal

### Payment Settings
- **Currency:** USD
- **Statement Descriptor:** "ABFI"
- **Trial Period:** 7 days (optional)
- **Cancellation:** Immediate access removal

## 🎨 Customization

### Modals & Forms

#### Login Modal
```css
/* Dark theme for Memberstack modals */
.ms-modal {
  background: #030712 !important;
  color: #f9fafb !important;
}

.ms-input {
  background: #111827 !important;
  border: 1px solid #374151 !important;
  color: #f9fafb !important;
}

.ms-button-primary {
  background: #22d3ee !important;
  color: #030712 !important;
}

.ms-button-primary:hover {
  background: #06b6d4 !important;
  box-shadow: 0 0 20px rgba(34, 211, 238, 0.5) !important;
}
```

#### Custom Welcome Email
Subject: "Welcome to Always Bent Fishing Intelligence! 🎣"

```
Hey [Name],

Welcome to the ABFI beta! You're among the first to experience the future of fishing intelligence.

Your account is ready to go:
- Full access to all features
- Real-time ocean data
- Community insights
- Vessel tracking

Launch the app: https://always-bent.vercel.app

Tight lines!
The ABFI Team
```

## 🔗 Webflow Integration

### Install Memberstack in Webflow

1. **Get your Project ID:**
   - In Memberstack → Settings → General
   - Copy Project ID

2. **Add to Webflow:**
   - Webflow → Project Settings → Custom Code
   - Paste in Head Code:
```html
<script src="https://api.memberstack.io/static/memberstack.js" data-memberstack-id="YOUR_PROJECT_ID"></script>
```

### Add Memberstack Attributes

#### Navigation
```html
<!-- Login button -->
<a ms-modal="login" href="#">Log In</a>

<!-- Signup button -->
<a ms-modal="signup" href="#">Start Free</a>

<!-- Profile link (shows when logged in) -->
<a ms-profile="true" href="#">My Account</a>

<!-- Logout link -->
<a ms-logout="true" href="#">Log Out</a>
```

#### Protected Content
```html
<!-- Hide from non-members -->
<div ms-hide="all">
  <!-- Content only for logged-in users -->
</div>

<!-- Show only to members -->
<div ms-show="member">
  <!-- Member-only content -->
</div>

<!-- Show only to specific plan -->
<div ms-show="pln_pro_monthly">
  <!-- Pro plan content -->
</div>
```

## 🚀 App Integration

### Redirect After Login
1. Go to **Settings → Redirects**
2. Set post-login redirect: `https://always-bent.vercel.app/legendary`
3. Set post-signup redirect: `https://always-bent.vercel.app/legendary/welcome`

### Pass Member Data to App
Add this script to Webflow:
```javascript
<script>
MemberStack.onReady.then(function(member) {
  if (member.loggedIn) {
    // Store member data for app
    localStorage.setItem('abfi_member_id', member.id);
    localStorage.setItem('abfi_member_email', member.email);
    localStorage.setItem('abfi_boat_name', member.boatName || '');
    localStorage.setItem('abfi_home_port', member.homePort || '');
  }
});
</script>
```

## 🧪 Testing Checklist

### Before Going Live
- [ ] Test signup flow with new email
- [ ] Test login with existing account
- [ ] Test password reset
- [ ] Test Stripe payment (use test card: 4242 4242 4242 4242)
- [ ] Verify redirect to app works
- [ ] Check member data passes to app
- [ ] Test logout functionality
- [ ] Verify protected content hides/shows correctly

### Test Credit Cards
- **Success:** 4242 4242 4242 4242
- **Decline:** 4000 0000 0000 0002
- **Requires Auth:** 4000 0025 0000 3155

## 📊 Analytics & Tracking

### Enable Tracking
1. Go to **Settings → Analytics**
2. Connect:
   - Google Analytics
   - Facebook Pixel
   - Segment (optional)

### Custom Events to Track
- Signup completed
- Plan selected
- Payment successful
- Login frequency
- Churn risk (no login > 7 days)

## 🔒 Security Settings

### Configure Security
1. **Password Requirements:**
   - Min 8 characters
   - Require uppercase
   - Require number

2. **Session Settings:**
   - Session timeout: 30 days
   - Remember me: Enabled
   - Multi-device login: Allowed

3. **Email Verification:**
   - Required for new signups
   - Resend option available

## 🎯 Go-Live Checklist

- [ ] Stripe connected and tested
- [ ] Email templates customized
- [ ] Plans and pricing configured
- [ ] Webflow integration complete
- [ ] Custom CSS applied
- [ ] Redirects configured
- [ ] Member fields set up
- [ ] Test accounts created
- [ ] Analytics connected
- [ ] Security settings configured

## 💡 Pro Tips

1. **Start in Test Mode:** Keep Stripe in test mode until you've onboarded first 10 beta users
2. **Email List:** Export member emails weekly for backup
3. **Support Widget:** Add Intercom or Crisp for member support
4. **Webhooks:** Set up webhooks for payment events
5. **Dunning:** Configure failed payment retry logic

## 🚨 Important URLs

- **Memberstack Dashboard:** app.memberstack.com
- **Stripe Dashboard:** dashboard.stripe.com
- **Your App:** always-bent.vercel.app
- **Marketing Site:** alwaysbentfishingintelligence.com (after setup)
