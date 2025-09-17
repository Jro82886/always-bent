# 🚀 SQUARESPACE INTEGRATION GUIDE FOR ABFI

## Quick Start (5 Minutes)

### Step 1: Add ABFI Button to Your Squarespace Site

**Location:** Any page where you want the ABFI access button

1. Edit any page on your Squarespace site
2. Add a **Code Block**
3. Paste this code:

```html
<!-- ABFI Access Button -->
<div style="text-align: center; margin: 40px 0;">
  <a href="https://always-bent.vercel.app/auth/login" 
     target="_blank"
     style="
       display: inline-block;
       padding: 20px 40px;
       background: linear-gradient(135deg, #00bcd4 0%, #2196f3 100%);
       color: white;
       text-decoration: none;
       border-radius: 8px;
       font-weight: bold;
       font-size: 18px;
       box-shadow: 0 4px 15px rgba(0, 188, 212, 0.3);
       transition: all 0.3s ease;
     "
     onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 20px rgba(0, 188, 212, 0.4)';"
     onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 15px rgba(0, 188, 212, 0.3)';">
    Launch ABFI Platform →
  </a>
</div>
```

---

## Advanced Integration Options

### Option 1: Member-Only Access Page

**Best for:** Restricting ABFI to paying members only

1. Go to **Pages** → **+ Add Page** → **Member Area**
2. Create a new page called "ABFI Platform"
3. Add a **Code Block** with this enhanced version:

```html
<!-- ABFI Member Portal -->
<div style="max-width: 800px; margin: 0 auto; padding: 40px 20px;">
  
  <!-- Header -->
  <div style="text-align: center; margin-bottom: 40px;">
    <h1 style="color: #00bcd4; font-size: 36px; margin-bottom: 10px;">
      ABFI Platform Access
    </h1>
    <p style="color: #666; font-size: 18px;">
      Always Bent Fishing Intelligence - Exclusive Member Access
    </p>
  </div>
  
  <!-- Features Grid -->
  <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 40px;">
    
    <div style="text-align: center; padding: 20px; background: #f8f9fa; border-radius: 8px;">
      <div style="font-size: 32px; margin-bottom: 10px;">🌡️</div>
      <h3 style="margin: 10px 0; color: #333;">Real-Time SST</h3>
      <p style="color: #666; font-size: 14px;">Live ocean temperature data</p>
    </div>
    
    <div style="text-align: center; padding: 20px; background: #f8f9fa; border-radius: 8px;">
      <div style="font-size: 32px; margin-bottom: 10px;">🚢</div>
      <h3 style="margin: 10px 0; color: #333;">Vessel Tracking</h3>
      <p style="color: #666; font-size: 14px;">Commercial & recreational</p>
    </div>
    
    <div style="text-align: center; padding: 20px; background: #f8f9fa; border-radius: 8px;">
      <div style="font-size: 32px; margin-bottom: 10px;">🎯</div>
      <h3 style="margin: 10px 0; color: #333;">AI Analysis</h3>
      <p style="color: #666; font-size: 14px;">Smart fishing predictions</p>
    </div>
    
    <div style="text-align: center; padding: 20px; background: #f8f9fa; border-radius: 8px;">
      <div style="font-size: 32px; margin-bottom: 10px;">🌊</div>
      <h3 style="margin: 10px 0; color: #333;">Bathymetry</h3>
      <p style="color: #666; font-size: 14px;">NOAA depth charts</p>
    </div>
    
  </div>
  
  <!-- Launch Button -->
  <div style="text-align: center;">
    <a href="https://always-bent.vercel.app/auth/login"
       target="_blank"
       style="
         display: inline-block;
         padding: 24px 48px;
         background: linear-gradient(135deg, #00bcd4 0%, #2196f3 100%);
         color: white;
         text-decoration: none;
         border-radius: 12px;
         font-weight: bold;
         font-size: 20px;
         box-shadow: 0 6px 30px rgba(0, 188, 212, 0.4);
         transition: all 0.3s ease;
       "
       onmouseover="this.style.transform='scale(1.05)';"
       onmouseout="this.style.transform='scale(1)';">
      Access ABFI Platform →
    </a>
    
    <p style="margin-top: 20px; color: #999; font-size: 14px;">
      Opens in a new window • Secure connection
    </p>
  </div>
  
</div>
```

---

### Option 2: Navigation Menu Integration

**Best for:** Quick access from anywhere on your site

1. Go to **Settings** → **Advanced** → **Code Injection**
2. Add to **HEADER** section:

```html
<script>
document.addEventListener('DOMContentLoaded', function() {
  // Wait for navigation to load
  setTimeout(function() {
    // Find the navigation menu
    const nav = document.querySelector('.header-nav-list');
    if (nav) {
      // Create ABFI menu item
      const abfiItem = document.createElement('div');
      abfiItem.className = 'header-nav-item';
      abfiItem.innerHTML = `
        <a href="https://always-bent.vercel.app/auth/login" 
           target="_blank"
           style="color: #00bcd4 !important; font-weight: bold;">
          ABFI
        </a>
      `;
      nav.appendChild(abfiItem);
    }
    
    // Also add to mobile menu
    const mobileNav = document.querySelector('.header-menu-nav-list');
    if (mobileNav) {
      const mobileItem = document.createElement('div');
      mobileItem.className = 'header-menu-nav-item';
      mobileItem.innerHTML = `
        <a href="https://always-bent.vercel.app/auth/login" 
           target="_blank"
           style="font-weight: bold;">
          ABFI Platform
        </a>
      `;
      mobileNav.appendChild(mobileItem);
    }
  }, 1000);
});
</script>
```

---

### Option 3: Embedded Dashboard (Premium)

**Best for:** Seamless integration without leaving your site

1. Create a new page called "Fishing Intelligence"
2. Add a **Code Block**:

```html
<!-- ABFI Embedded Dashboard -->
<div style="position: relative; width: 100%; height: 80vh; min-height: 600px;">
  
  <!-- Loading Message -->
  <div id="abfi-loading" style="
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    text-align: center;
    z-index: 10;
  ">
    <div style="
      width: 50px;
      height: 50px;
      border: 3px solid #f3f3f3;
      border-top: 3px solid #00bcd4;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 20px;
    "></div>
    <p style="color: #666;">Loading ABFI Platform...</p>
  </div>
  
  <!-- iFrame Container -->
  <iframe 
    id="abfi-frame"
    src="https://always-bent.vercel.app" 
    style="
      width: 100%;
      height: 100%;
      border: none;
      border-radius: 12px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.1);
    "
    allow="geolocation; camera"
    onload="document.getElementById('abfi-loading').style.display='none';"
  ></iframe>
  
</div>

<style>
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>
```

---

### Option 4: Homepage Banner

**Best for:** Promoting ABFI to all visitors

1. Go to your **Homepage**
2. Add a **Code Block** at the top:

```html
<!-- ABFI Banner -->
<div style="
  background: linear-gradient(135deg, #001f3f 0%, #003366 100%);
  color: white;
  padding: 30px 20px;
  text-align: center;
  margin: -20px -20px 40px -20px;
  position: relative;
  overflow: hidden;
">
  
  <!-- Background Animation -->
  <div style="
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: url('data:image/svg+xml,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 1440 320\"><path fill=\"%2300bcd4\" fill-opacity=\"0.1\" d=\"M0,96L48,112C96,128,192,160,288,160C384,160,480,128,576,112C672,96,768,96,864,112C960,128,1056,160,1152,160C1248,160,1344,128,1392,112L1440,96L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z\"></path></svg>') no-repeat bottom;
    background-size: cover;
    opacity: 0.3;
  "></div>
  
  <!-- Content -->
  <div style="position: relative; z-index: 1;">
    <h2 style="margin: 0 0 10px 0; font-size: 28px;">
      🎣 NEW: ABFI Platform Now Live!
    </h2>
    <p style="margin: 0 0 20px 0; font-size: 16px; opacity: 0.9;">
      Access real-time fishing intelligence with your Always Bent membership
    </p>
    <a href="https://always-bent.vercel.app/auth/login"
       target="_blank"
       style="
         display: inline-block;
         padding: 12px 30px;
         background: white;
         color: #003366;
         text-decoration: none;
         border-radius: 25px;
         font-weight: bold;
         transition: all 0.3s ease;
       "
       onmouseover="this.style.background='#00bcd4'; this.style.color='white';"
       onmouseout="this.style.background='white'; this.style.color='#003366';">
      Launch Platform →
    </a>
  </div>
  
</div>
```

---

## Mobile Optimization

Add this to **Settings** → **Advanced** → **Code Injection** → **HEADER**:

```html
<style>
/* Mobile-friendly ABFI buttons */
@media (max-width: 768px) {
  .abfi-button {
    width: 100% !important;
    padding: 20px !important;
    font-size: 18px !important;
  }
}
</style>
```

---

## Testing Your Integration

1. **Save** your changes
2. **Preview** your site
3. **Click** the ABFI button/link
4. **Verify** it opens the ABFI platform

---

## Troubleshooting

### Button not appearing?
- Make sure you're in a Code Block, not a Text Block
- Check that JavaScript is enabled in Code Injection

### Link not working?
- Verify the URL: `https://always-bent.vercel.app/auth/login`
- Ensure target="_blank" is included

### Members can't access?
- Make sure the page is set to "Members Only" in Page Settings
- Check member area permissions

---

## Support

Need help? The ABFI platform is live at:
**https://always-bent.vercel.app**

For Squarespace-specific issues, check your:
- Member Areas settings
- Code Injection settings
- Custom CSS settings
