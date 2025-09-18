# 📋 Memberstack Redirect Implementation Details

## For Your Fiverr Developer:

### The Redirect URL Format:
```
https://always-bent.vercel.app/legendary?memberId=[MEMBER_ID]&email=[MEMBER_EMAIL]&authenticated=true
```

### How to Implement in Memberstack/Webflow:

**Option 1: JavaScript After Signup Success**
```javascript
// Add this to Webflow custom code
window.$memberstackDom.openModal('signup').then(({ data: member }) => {
  if (member) {
    // Build redirect URL with actual member data
    const redirectUrl = `https://always-bent.vercel.app/legendary?memberId=${member.id}&email=${encodeURIComponent(member.email)}&authenticated=true`;
    
    // Redirect to app
    window.location.href = redirectUrl;
  }
});
```

**Option 2: For Login Flow**
```javascript
// Handle login button click
document.querySelector('[data-action="launch-app"]').addEventListener('click', async (e) => {
  e.preventDefault();
  
  const { data: member } = await window.$memberstackDom.getCurrentMember();
  
  if (member) {
    // Already logged in - redirect with their info
    window.location.href = `https://always-bent.vercel.app/legendary?memberId=${member.id}&email=${encodeURIComponent(member.email)}&authenticated=true`;
  } else {
    // Not logged in - show login modal
    window.$memberstackDom.openModal('login').then(({ data: loggedInMember }) => {
      if (loggedInMember) {
        window.location.href = `https://always-bent.vercel.app/legendary?memberId=${loggedInMember.id}&email=${encodeURIComponent(loggedInMember.email)}&authenticated=true`;
      }
    });
  }
});
```

### Important Notes:

1. **URL Encode the Email:** Use `encodeURIComponent(member.email)` to handle special characters in email addresses

2. **Member ID Format:** Memberstack provides IDs like `mem_abc123xyz` - pass it exactly as provided

3. **Don't Use Dashboard Redirects:** Don't set this in Memberstack dashboard redirects - handle it in JavaScript so you can append the parameters

4. **Test Both Flows:**
   - New user signup → Should redirect with their new member ID
   - Existing user login → Should redirect with their existing member ID

### Example of What the Final URL Should Look Like:
```
https://always-bent.vercel.app/legendary?memberId=mem_abc123xyz&email=john%40example.com&authenticated=true
```

### What NOT to Do:
- ❌ Don't try to use localStorage between domains
- ❌ Don't set a static redirect in Memberstack dashboard
- ❌ Don't forget to URL encode the email
- ❌ Don't redirect without the parameters

### Testing Instructions:
1. Sign up as new user → Check URL has parameters
2. Log out
3. Log back in → Check URL has same member ID
4. Try email with special chars (test+user@email.com)

Let me know if you need the code adjusted for your specific setup!
