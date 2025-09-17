# SUPABASE EMAIL CONFIGURATION - CRITICAL FOR NEW SIGNUPS!

## 1. GO TO SUPABASE DASHBOARD:
https://supabase.com/dashboard/project/hobvjmmambhonsugehge/auth/templates

## 2. UPDATE "Confirm signup" TEMPLATE:

### Subject Line:
```
Welcome to Always Bent Fishing Intelligence - Confirm Your Account
```

### Email Body:
```html
<h2>Welcome to ABFI, Captain!</h2>
<p>You're one click away from accessing the most advanced fishing intelligence platform.</p>
<p>Click below to confirm your email and start tracking:</p>
<p><a href="{{ .ConfirmationURL }}">Confirm Your Email</a></p>
<p>This link will expire in 1 hour.</p>
<p>If you didn't create an account, you can safely ignore this email.</p>
<br>
<p>Tight lines,<br>The Always Bent Team</p>
```

### Redirect URL (CRITICAL!):
```
https://always-bent.vercel.app/auth/confirm
```

## 3. UPDATE "Magic Link" TEMPLATE:

### Subject Line:
```
Your ABFI Login Link
```

### Email Body:
```html
<h2>Sign in to ABFI</h2>
<p>Click the link below to instantly sign in:</p>
<p><a href="{{ .ConfirmationURL }}">Sign In to ABFI</a></p>
<p>This link expires in 1 hour and can only be used once.</p>
<br>
<p>Tight lines,<br>The Always Bent Team</p>
```

### Redirect URL:
```
https://always-bent.vercel.app/auth/callback
```

## 4. UPDATE AUTH SETTINGS:

Go to: https://supabase.com/dashboard/project/hobvjmmambhonsugehge/auth/url-configuration

### Site URL:
```
https://always-bent.vercel.app
```

### Redirect URLs (add all of these):
```
https://always-bent.vercel.app/auth/confirm
https://always-bent.vercel.app/auth/callback
https://always-bent.vercel.app/legendary
http://localhost:3000/auth/confirm
http://localhost:3000/auth/callback
```

## 5. EMAIL SENDER SETTINGS:

Go to: https://supabase.com/dashboard/project/hobvjmmambhonsugehge/settings/auth

### From Email:
```
no-reply@alwaysbent.com
```
(or use default if you don't have domain email yet)

### From Name:
```
Always Bent Fishing Intelligence
```

## TESTING:
1. Create a new account with a REAL email
2. Check inbox (and spam folder)
3. Click confirmation link
4. Should redirect to app and auto-login

## IF EMAIL DOESN'T ARRIVE:
- Check spam/junk folder
- Supabase free tier has email limits (3/hour)
- Use the manual confirm script: `node scripts/fix-auth.js confirm user@email.com`
