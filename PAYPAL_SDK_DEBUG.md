# PayPal SDK Loading Debug Guide

## Issue
PayPal script loads (`onLoad fired`) but `window.paypal.Buttons` never becomes available. Polling tries up to 100 attempts (5 seconds) with no result.

## Causes & Solutions

### 1. **Browser Console - Check for Errors**

Open the browser console (F12 → Console tab) and look for any error messages:

```javascript
// Run this in console
console.log('PayPal object:', window.paypal)
console.log('Has Buttons:', window.paypal?.Buttons ? 'YES' : 'NO')
console.log('All keys:', Object.keys(window.paypal || {}))
```

**If console shows:**
- `PayPal object: undefined` → Script didn't execute
- `PayPal object: {...}` but no `Buttons` → SDK loaded but incomplete
- Any red errors → Script execution error

### 2. **Check Network Tab**

1. Open DevTools (F12)
2. Go to **Network** tab
3. Reload page
4. Look for `sdk/js` requests
5. Check the response:
   - **Status 200** = Loaded successfully
   - **Status 404/403** = Server rejected the request
   - **Blocked** = Browser blocked the request
   - **Failed** = Network error

### 3. **Check CSP Headers**

In DevTools → Network tab → Response headers for PayPal SDK request:

Look for `Content-Security-Policy` headers. The issue might be a CSP policy blocking script execution.

### 4. **Try These Quick Fixes**

#### A. Disable All Browser Extensions
1. Chrome: Menu → Settings → Extensions → Disable all
2. Firefox: Menu → Add-ons → Disable all
3. Reload page

If PayPal works with extensions disabled, one of your extensions is blocking it.

#### B. Clear Browser Cache
- Chrome/Edge: Ctrl+Shift+Delete → Select "All time" → Clear data
- Firefox: Ctrl+Shift+Delete → Select "Everything" → Clear Now
- Reload page

#### C. Try Private/Incognito Mode
- Chrome: Ctrl+Shift+N
- Firefox: Ctrl+Shift+P
- Safari: Cmd+Shift+N
- Edge: Ctrl+Shift+M

If it works in Incognito, your browser extensions or cached data are the issue.

#### D. Try a Different Browser
Test on Chrome, Firefox, Safari, or Edge to isolate the issue.

### 5. **Check Network Connectivity**

The PayPal SDK might be timing out. Try:

```javascript
// Run in console to test PayPal connectivity
fetch('https://www.paypal.com/sdk/js?client-id=test')
  .then(r => console.log('Status:', r.status))
  .catch(e => console.error('Blocked:', e.message))
```

If this fails with CORS or network error, PayPal is unreachable from your location.

### 6. **VPN/Proxy Issues**

If you're using a VPN or corporate proxy:
- **Try without VPN** - Some VPNs block PayPal
- **Check proxy settings** - Might be blocking the request
- **Try from a different network** - Mobile hotspot, etc.

---

## Advanced Debugging

### Check PayPal Script URL
```javascript
// Run in console
const scriptUrl = `https://www.paypal.com/sdk/js?client-id=${process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID}&currency=USD&intent=capture&components=buttons&disable-funding=credit,paylater`
console.log('PayPal URL:', scriptUrl)

// Try loading manually
const script = document.createElement('script')
script.src = scriptUrl
script.onload = () => console.log('Script loaded manually')
script.onerror = (err) => console.error('Script error:', err)
document.head.appendChild(script)
```

### Check Environment Variables
```javascript
// Verify client ID is set
console.log('Client ID:', process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID)
console.log('Client ID from window:', window.paypal?.clientId)
```

### Monitor Network Requests
```javascript
// Run AFTER PayPal SDK tries to load
const requests = window.performance.getEntries()
  .filter(r => r.name.includes('paypal'))
requests.forEach(r => {
  console.log(`${r.name}: ${r.duration.toFixed(2)}ms, size: ${r.transferSize}`)
})
```

---

## When to Contact Support

Provide support with:

1. **Browser & Version**
   ```javascript
   console.log(navigator.userAgent)
   ```

2. **Console Output**
   - Copy entire console (F12 → Console → Right-click → Save)
   - Include any red errors

3. **Network Tab Screenshot**
   - F12 → Network tab
   - Reload and take screenshot
   - Show PayPal SDK request status

4. **Test Results**
   - Does Incognito work?
   - Does private browsing work?
   - Different browser?
   - With VPN off?

---

## If It Still Doesn't Work

1. **Use Fallback Payment Button**
   - All pricing pages show "Continue to PayPal Payment"
   - Click this button to pay directly through PayPal

2. **Try Later**
   - PayPal occasionally has incidents
   - Wait 30 minutes and try again

3. **Contact PayPal Support**
   - If this only happens with PayPal
   - Check PayPal's status page: https://status.paypal.com

---

## Quick Diagnostic Command

Run this in browser console to get all diagnostics at once:

```javascript
const diagnostics = {
  paypal: typeof window.paypal !== 'undefined',
  buttons: window.paypal?.Buttons ? true : false,
  clientId: !!process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID,
  userAgent: navigator.userAgent,
  online: navigator.onLine,
  language: navigator.language,
  vendor: navigator.vendor,
}
console.table(diagnostics)
```

Copy the output and include in support tickets.
