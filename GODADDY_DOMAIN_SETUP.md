# GoDaddy Domain Setup for Webflow

## 🌐 Connect alwaysbentfishingintelligence.com to Webflow

### Step 1: Get Webflow DNS Records

1. **In Webflow:**
   - Go to Project Settings → Publishing → Custom Domains
   - Click "+ Add Custom Domain"
   - Enter: `alwaysbentfishingintelligence.com`
   - Click "Add Domain"
   - Webflow will show you DNS records to add

2. **You'll see two types of records:**
   - **A Records** (2 records):
     - `75.2.70.75`
     - `99.83.190.102`
   - **CNAME Record** (for www):
     - `proxy-ssl.webflow.com`

### Step 2: Login to GoDaddy

1. Go to [godaddy.com](https://godaddy.com)
2. Login with:
   - **Email:** hiamandak@gmail.com
   - **Password:** Alwaysbent82886!

### Step 3: Access DNS Settings

1. Click "My Products"
2. Find `alwaysbentfishingintelligence.com`
3. Click "DNS" or "Manage DNS"

### Step 4: Remove Existing Records

⚠️ **Important:** Delete these existing records (if present):
- Any existing A records for `@`
- Any existing CNAME for `www`
- Keep MX records (for email) if you have any

### Step 5: Add Webflow Records

#### Add A Records
1. Click "Add Record"
2. Choose Type: "A"
3. **First A Record:**
   - Name: `@`
   - Value: `75.2.70.75`
   - TTL: 1 hour
   - Click "Save"

4. **Second A Record:**
   - Click "Add Record" again
   - Type: "A"
   - Name: `@`
   - Value: `99.83.190.102`
   - TTL: 1 hour
   - Click "Save"

#### Add CNAME Record
1. Click "Add Record"
2. Choose Type: "CNAME"
3. Settings:
   - Name: `www`
   - Value: `proxy-ssl.webflow.com`
   - TTL: 1 hour
   - Click "Save"

### Step 6: Verify in Webflow

1. **Back in Webflow:**
   - Go to Project Settings → Publishing → Custom Domains
   - You should see your domain with "Checking DNS records..."
   - Wait 5-10 minutes
   - Status should change to "Connected" ✅

2. **Set as Default Domain:**
   - Click the gear icon next to your domain
   - Select "Set as Default"
   - This makes `alwaysbentfishingintelligence.com` your primary domain

### Step 7: SSL Certificate

1. **Webflow automatically provides SSL:**
   - Once DNS is verified, Webflow issues an SSL certificate
   - This can take up to 48 hours (usually faster)
   - You'll see a green lock icon when ready

## 🔧 Troubleshooting

### DNS Not Propagating?
- Use [whatsmydns.net](https://whatsmydns.net) to check propagation
- Enter your domain and check A records
- Should show Webflow IPs globally

### "Check DNS Configuration" Error?
Common fixes:
1. **Double-check records:**
   - A records: exactly `75.2.70.75` and `99.83.190.102`
   - CNAME: exactly `proxy-ssl.webflow.com`
   - No trailing dots or spaces

2. **Clear old records:**
   - Remove any Squarespace records
   - Remove any forwarding rules
   - Remove any parking pages

3. **Wait longer:**
   - DNS can take up to 48 hours
   - Usually works within 1-2 hours

### Email Still Working?
- **MX records are separate** from website hosting
- Keep existing MX records for email
- Only change A and CNAME records

## 📧 Email Configuration (If Needed)

If you need email on this domain:

### Option 1: Keep Existing Email
- Don't touch MX records in GoDaddy
- Your email continues working as before

### Option 2: Set Up Google Workspace
1. Sign up for Google Workspace
2. Add these MX records:
   ```
   Priority 1: aspmx.l.google.com
   Priority 5: alt1.aspmx.l.google.com
   Priority 5: alt2.aspmx.l.google.com
   Priority 10: alt3.aspmx.l.google.com
   Priority 10: alt4.aspmx.l.google.com
   ```

### Option 3: Email Forwarding
1. In GoDaddy → Email → Forwarding
2. Set up: `info@alwaysbentfishingintelligence.com`
3. Forward to: `amanda@alwaysbent.com`

## 🚀 Final Checklist

### In GoDaddy:
- [ ] Logged in successfully
- [ ] Found domain in dashboard
- [ ] Removed old A records
- [ ] Added 2 Webflow A records
- [ ] Added www CNAME record
- [ ] Saved all changes

### In Webflow:
- [ ] Added custom domain
- [ ] Domain shows "Connected"
- [ ] Set as default domain
- [ ] SSL certificate issued
- [ ] Published site to custom domain

### Testing:
- [ ] Visit http://alwaysbentfishingintelligence.com (redirects to https)
- [ ] Visit http://www.alwaysbentfishingintelligence.com (works)
- [ ] Check SSL padlock in browser
- [ ] Test on mobile device

## 🎯 Expected Timeline

1. **DNS Changes:** 5 minutes in GoDaddy
2. **Propagation:** 30 minutes to 2 hours
3. **Webflow Verification:** 1-2 hours
4. **SSL Certificate:** 2-24 hours
5. **Fully Live:** Within 24 hours

## 💡 Pro Tips

1. **Don't Panic:** DNS changes take time
2. **Screenshot Everything:** Before changing DNS records
3. **Test Incrementally:** Check each step works
4. **Keep Records:** Save DNS settings in a document
5. **Support:** Webflow has excellent support if needed

## 🔗 Quick Links

- **GoDaddy DNS:** [manage.godaddy.com](https://dcc.godaddy.com/domains)
- **Webflow Domains:** Project Settings → Publishing → Custom Domains
- **DNS Checker:** [whatsmydns.net](https://whatsmydns.net)
- **SSL Checker:** [sslchecker.com](https://sslchecker.com)

## 📞 Support Contacts

- **Webflow Support:** support@webflow.com
- **GoDaddy Support:** 1-480-463-8333
- **Memberstack Support:** support@memberstack.com

---

Once complete, your professional platform will be live at:
**https://alwaysbentfishingintelligence.com** 🎣
