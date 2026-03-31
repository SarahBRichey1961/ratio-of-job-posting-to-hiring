# PayPal Sandbox Testing - Beginner Guide

**Goal:** Test your payment system without using real money. PayPal automatically creates test accounts for you.

---

## Step 1: Open PayPal Developer Dashboard

1. Click this link: https://developer.paypal.com
2. Log in with your PayPal account (sarah@websepic.com)
3. You should see a dashboard

---

## Step 2: Find Your Test Buyer Account

1. On the left menu, click **Accounts** (or **Sandbox** → **Accounts**)
2. You should see something like:
   ```
   sb-xxxxx@personal.example.com
   ```
   This is your TEST BUYER account
3. **Copy this email** - you'll use it to test payments
4. The password should be something like: `111111111` (check PayPal dashboard for the exact password)

---

## Step 3: Test a Payment

### On your website (takethereins.com):

1. Go to: https://takethereins.com/monetization/pricing
2. Click any "Get Started" button (e.g., Sponsor Monthly)
3. Sign in to Take The Reins if needed
4. You'll be redirected to PayPal

### On PayPal:

5. **IMPORTANT:** When PayPal asks you to log in:
   - **Do NOT use** sarah@websepic.com (that's your merchant account)
   - **Do USE** the test buyer email from Step 2 (looks like `sb-xxxxx@personal.example.com`)
   - Password: `111111111` (or whatever it shows in the dashboard)

6. Click "Approve payment"
7. You'll be sent back to your website with a success message
8. **Check your database** - the payment should be recorded

---

## Step 4: Verify Payment was Recorded

Open a terminal and run this SQL query:

```sql
SELECT * FROM sponsor_memberships 
ORDER BY created_at DESC 
LIMIT 5;
```

You should see:
- ✅ `payment_status: 'paid'`
- ✅ `is_active: true`
- ✅ `subscription_end_date: ` (today + 1 month)

---

## Troubleshooting

### "I can't find the test buyer email"

Go to: https://developer.paypal.com/dashboard/accounts
- Look for accounts with `@personal.example.com` or `@business.example.com`
- These are automatically created for you

### "Payment failed with 'CANNOT_PAY_SELF'"

This means you logged in with your merchant account (sarah@websepic.com). 
- Log out and try again
- Use the test buyer email instead

### "I don't see my payment in the database"

1. Check the URL you're sent to after payment - does it say "success"?
2. Check Netlify logs for errors
3. Make sure `SUPABASE_SERVICE_ROLE_KEY` is set in Netlify

---

## What's Happening Behind the Scenes

1. You click "Get Started" on pricing page
2. Your browser sends a request to `/api/paypal/checkout`
3. Our server creates a PayPal order
4. PayPal redirects you to their payment page
5. You approve with your test account
6. PayPal sends you back to `/monetization/checkout/success`
7. Your browser calls `/api/paypal/capture` to finalize the payment
8. Our server records the payment in Supabase database
9. You see "Payment successful!" on the page

---

## Next Steps After Testing

Once you've successfully tested:
1. ✅ Payment completes without errors
2. ✅ Database records the payment correctly
3. ✅ Subscription end date is calculated correctly

You're ready to switch to production! 🎉

Just let me know when you've tested and I can help you set up production credentials.
