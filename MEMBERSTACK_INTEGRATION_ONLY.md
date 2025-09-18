# 🔐 Memberstack Integration Guide - Don't Break Amanda's Landing!

## ✅ **What Amanda Has Done:**
- Created a clean landing page in Webflow
- Applied dark theme CSS
- Set up hero with "Launch App" button
- Page is live and looking good

## 🎯 **Your Focus: Add Auth Logic Only**

### **DO NOT CHANGE:**
- ❌ Hero text or design
- ❌ CSS styles or colors  
- ❌ Page layout
- ❌ Any visual elements Amanda has set

### **ONLY ADD:**
- ✅ Memberstack authentication logic
- ✅ Login state detection
- ✅ Modal triggers for non-logged users
- ✅ Pass-through for logged-in users

---

## 📋 **Step 1: Memberstack Script Installation**

Add to Webflow Project Settings → Custom Code → **Head** (if not already there):

```html
<!-- Memberstack 2.0 -->
<script src="https://api.memberstack.io/static/memberstack.js" data-memberstack-app="YOUR_APP_ID_HERE"></script>

<script>
// Auth state handler - controls Launch App behavior
window.$memberstackDom.getCurrentMember().then(({ data: member }) => {
  // Store auth state
  window.isLoggedIn = !!member;
  
  if (member) {
    // Pass member data to app
    localStorage.setItem('abfi_authenticated', 'true');
    localStorage.setItem('abfi_member_id', member.id);
    localStorage.setItem('abfi_member_email', member.email);
  }
});
</script>
```

---

## 📋 **Step 2: Smart Launch Button**

Find Amanda's "Launch App" button and ADD these attributes (don't change anything else):

```html
<!-- Add to the Launch App button -->
data-ms-action="launch"
href="https://always-bent.vercel.app/legendary"
```

Then add this script to handle the click:

```javascript
<script>
document.addEventListener('DOMContentLoaded', function() {
  // Smart launch button - checks auth state
  const launchButton = document.querySelector('[data-ms-action="launch"]');
  
  if (launchButton) {
    launchButton.addEventListener('click', function(e) {
      e.preventDefault();
      
      window.$memberstackDom.getCurrentMember().then(({ data: member }) => {
        if (member) {
          // User is logged in - go straight to app
          window.location.href = 'https://always-bent.vercel.app/legendary';
        } else {
          // Not logged in - show signup modal
          window.$memberstackDom.openModal('signup').then(() => {
            // After successful signup, redirect to app
            window.location.href = 'https://always-bent.vercel.app/legendary';
          });
        }
      });
    });
  }
});
</script>
```

---

## 📋 **Step 3: Add Hidden Auth Modals**

Add these INVISIBLE elements anywhere on the page (they're hidden by default):

```html
<!-- Hidden login/signup triggers (not visible) -->
<div style="display: none;">
  <a href="#" ms-modal="login" id="hidden-login">Login</a>
  <a href="#" ms-modal="signup" id="hidden-signup">Signup</a>
</div>
```

---

## 📋 **Step 4: Memberstack Dashboard Setup**

1. **Login:** app.memberstack.com
2. **Create/Access:** "Always Bent" project
3. **Configure Plans:**

### Beta Plan (Free)
```
Name: Beta Access
Price: $0
ID: plan_beta_free
```

### Custom Fields (Settings → Custom Fields):
```
boatName - Text (optional for now)
homePort - Text (optional for now)
```

### Post-Signup Redirect:
```
Settings → Redirects → After Signup:
https://always-bent.vercel.app/legendary
```

---

## 📋 **Step 5: Test Flow**

### Test as NEW User:
1. Click "Launch App"
2. Should see signup modal
3. Create account
4. Auto-redirects to app
5. App receives member data via localStorage

### Test as EXISTING User:
1. Already logged in
2. Click "Launch App"
3. Goes straight to app (no modal)

---

## 🎨 **Optional: Style Memberstack Modals**

If the default modals look bad, add this CSS (but ONLY for modals):

```css
<style>
/* ONLY style Memberstack modals - don't touch anything else */
.ms-modal-overlay {
  background: rgba(3, 7, 18, 0.95) !important;
}

.ms-modal {
  background: #111827 !important;
  border: 1px solid #22d3ee !important;
}

.ms-modal input {
  background: #1f2937 !important;
  border: 1px solid #374151 !important;
  color: #f9fafb !important;
}

.ms-modal button[type="submit"] {
  background: #22d3ee !important;
  color: #030712 !important;
}
</style>
```

---

## ⚠️ **DO NOT:**

1. **Don't add** pricing cards yet (Amanda will do that later)
2. **Don't add** navigation changes
3. **Don't modify** the hero section
4. **Don't add** multiple buttons or links
5. **Don't change** any existing CSS

---

## ✅ **Success Criteria:**

- [ ] Landing page still looks exactly as Amanda designed
- [ ] "Launch App" button detects login state
- [ ] Non-logged users see signup modal
- [ ] Logged users go straight to app
- [ ] Member data passes to app via localStorage
- [ ] No visual changes to the page

---

## 🚀 **Result:**

Amanda gets a clean landing page that:
1. Looks professional (her design intact)
2. Has smart auth detection
3. Smoothly onboards new users
4. Passes existing users through
5. Ready for beta testers TODAY

---

## 💡 **Remember:**

- **Amanda owns the design** - Don't touch it
- **You own the auth logic** - Make it seamless
- **Keep it simple** - Just make the button smart
- **Test thoroughly** - Both logged in/out states
- **Don't overthink** - Landing → Auth Check → App
