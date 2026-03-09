# Netlify Deployment Configuration

## Platform Info
- **Production Host:** Netlify (NOT Vercel)
- **Repository:** GitHub (SarahBRichey1961/ratio-of-job-posting-to-hiring)
- **Build Command:** `npm run build`
- **Publish Directory:** `.next`
- **Node Version:** 18+

## Critical Environment Variables
Set these in **Netlify Dashboard** → **Settings** → **Build & Deploy** → **Environment**:

### Supabase Configuration
```
NEXT_PUBLIC_SUPABASE_URL="https://eikhrkharihagaorqqcf.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="sb_publishable_hav_kQ90n--HDGddxsCQgQ_SblKkcnZ"
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVpa2hya2hhcmloYWdhb3JxcWNmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTUxODkyNywiZXhwIjoyMDg3MDk0OTI3fQ.rQnj18ewalzrrYyiFUqI39gDOak1ElpBLupHDnEmHjc"
```

### Stripe (LIVE)
```
STRIPE_SECRET_KEY="ssk_live_51T70UMAx1f1mOFsJ2haCNloJwGcHqOy4wC3dNeTRs4jXFW6fr4OW1enNVKn6ua7JIaJopdMjgUyihsrPaFaxwycx0079obIwso"
NEXT_PUBLIC_STRIPE_PUBLIC_KEY="pk_live_51T70UMAx1f1mOFsJYOQqUPrNzM3XMfsIByoVhAROvbDlsB0KJZ3R0kHi0iTjS85JZdumvlVDVNkFYI8LZDwyWIMy008XxMAYgr"
STRIPE_WEBHOOK_SECRET="whsec_CCtn0ydkxqU6ayaE9HBD0p93gaEmghk5"
```

### Other Services
```
RAPIDAPI_KEY="5cffc5e404msh58a8a4599a5333bp1cbd16jsn958333964e1c"
NEXT_PUBLIC_GA_MEASUREMENT_ID="G-13DDMQLQFZ"
NEXT_PUBLIC_APP_URL="https://your-netlify-domain.netlify.app"
```

## Deployment Steps

### First-Time Setup
1. Connect your GitHub repository to Netlify
2. Go to **Site settings** → **Build & Deploy** → **Environment**
3. Add all variables from "Critical Environment Variables" section above
4. Netlify will automatically rebuild on push to `main` branch

### Important Notes
- **DO NOT** commit `.env.local` to Git (it's in `.gitignore`)
- Use Netlify's environment variables dashboard instead
- The `SUPABASE_SERVICE_ROLE_KEY` is critical for analytics operations
  - Without it: recipient counts won't update, send button stays disabled
  - With it: all marketing features work as expected

## Function Deployments
If using Netlify Functions for cron jobs (scheduled tasks):
- Create functions in [`netlify/functions/`](netlify/functions/)
- Use Netlify's scheduling feature instead of Vercel cron
- Set up in **Site settings** → **Functions** → **Scheduled Functions**

## Troubleshooting

### Build Fails
- Check `npm run build` locally first
- Verify all environment variables are set in Netlify dashboard
- Check Node.js version matches local environment

### Empty Recipient Count After Upload
- Verify `SUPABASE_SERVICE_ROLE_KEY` is set in Netlify
- Check Netlify function logs for errors
- Confirm RLS policies in Supabase are correct

### Production Issues
- Check Netlify deployment logs
- Monitor Supabase dashboard for SQL errors
- Verify API rate limits haven't been exceeded

## Useful Links
- [Netlify Environment Variables Documentation](https://docs.netlify.com/configure-builds/environment-variables/)
- [Netlify Functions Documentation](https://docs.netlify.com/functions/overview/)
- [Supabase Management Dashboard](https://supabase.eikhrkharihagaorqqcf.supabase.co/)
