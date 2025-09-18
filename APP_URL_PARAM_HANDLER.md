# 📥 How to Handle Member Data from Webflow in Your App

## The Flow:
1. **Webflow/Memberstack:** User signs up/logs in
2. **Redirect with params:** `https://always-bent.vercel.app/legendary?memberId=123&email=user@email.com&authenticated=true`
3. **Your app:** Reads URL params and stores locally

## Add This to Your App (legendary/page.tsx or layout.tsx):

```typescript
// Add this to your component
useEffect(() => {
  // Check for member data from Webflow redirect
  const urlParams = new URLSearchParams(window.location.search);
  const memberId = urlParams.get('memberId');
  const email = urlParams.get('email');
  const authenticated = urlParams.get('authenticated');
  
  if (authenticated === 'true' && memberId && email) {
    // Store in localStorage for your app's domain
    localStorage.setItem('abfi_authenticated', 'true');
    localStorage.setItem('abfi_member_id', memberId);
    localStorage.setItem('abfi_member_email', email);
    
    // Optional: Store boat name if not already set
    if (!localStorage.getItem('abfi_boat_name')) {
      // Could prompt user or use email prefix
      const boatName = email.split('@')[0]; // temporary
      localStorage.setItem('abfi_boat_name', boatName);
    }
    
    // Clean URL (remove params from address bar)
    window.history.replaceState({}, document.title, '/legendary');
    
    // Optional: Show welcome message
    console.log(`Welcome ${email}!`);
  }
}, []);
```

## Alternative: Use Session Token (More Secure)

If you want more security, have the Fiverr developer implement:

**Webflow side:**
```javascript
// After successful auth
const token = btoa(member.id + ':' + Date.now()); // Basic token
const redirectUrl = `https://always-bent.vercel.app/legendary?token=${token}`;
```

**Your app side:**
```typescript
// Decode and validate token
const token = urlParams.get('token');
if (token) {
  const decoded = atob(token);
  const [memberId, timestamp] = decoded.split(':');
  
  // Check if token is recent (within 5 minutes)
  const tokenAge = Date.now() - parseInt(timestamp);
  if (tokenAge < 300000) { // 5 minutes
    // Valid token, store user data
    localStorage.setItem('abfi_authenticated', 'true');
    localStorage.setItem('abfi_member_id', memberId);
  }
}
```

## For Your Fiverr Developer:

Tell them:
> "After successful Memberstack signup/login, redirect to:
> `https://always-bent.vercel.app/legendary?memberId=[MEMBER_ID]&email=[MEMBER_EMAIL]&authenticated=true`
> 
> The app will handle reading these parameters. No localStorage needed on the Webflow side."

## Security Note:

- URL params are visible in browser history
- For beta, this is fine
- For production, consider:
  - JWT tokens
  - Server-side session validation
  - Memberstack webhooks to your backend

But for now, URL params will work perfectly for your beta launch!
