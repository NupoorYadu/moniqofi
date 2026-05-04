# 🚀 MoniqoFi Deployment Guide

## Vercel Deployment (Frontend)

### Step 1: Connect GitHub Repository to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Sign in with your GitHub account (NupoorYadu)
3. Click **Add New** → **Project**
4. Select `moniqofi` repository
5. Click **Import**

### Step 2: Configure Build Settings

**Root Directory**: `./frontend`

This is important because your Next.js app is in the `frontend` folder!

- **Framework Preset**: Next.js (auto-detected)
- **Build Command**: `npm run build`
- **Output Directory**: `.next`
- **Install Command**: `npm install`

### Step 3: Set Environment Variables

In Vercel dashboard, go to **Settings** → **Environment Variables**

Add these variables:

```env
NEXT_PUBLIC_API_URL=https://moniqofi-backend-railway.railway.app
NEXT_PUBLIC_APP_URL=https://moniqofi.vercel.app
```

> Replace `moniqofi-backend-railway` with your actual Railway backend URL (you'll get this after deploying backend)

### Step 4: Deploy

Click **Deploy** - Vercel will build and deploy automatically.

**Expected Duration**: 2-3 minutes

**Your Frontend URL**: `https://moniqofi.vercel.app` (or your custom domain)

---

## Railway Deployment (Backend)

### Step 1: Create Railway Project

1. Go to [railway.app](https://railway.app)
2. Sign in with GitHub (NupoorYadu)
3. Click **New Project**
4. Select **Deploy from GitHub repo**
5. Choose `moniqofi` repository
6. Click **Deploy Now**

### Step 2: Configure Build

Railway will auto-detect because you have `railway.json`:

```json
{
  "build": {
    "builder": "nixpacks",
    "buildCommand": "npm install"
  },
  "deploy": {
    "startCommand": "cd backend && npm start",
    "healthcheckPath": "/",
    "healthcheckTimeout": 30
  }
}
```

However, you may need to update it. Click on your project and set:

- **Root Directory**: `backend`
- **Start Command**: `npm start`

### Step 3: Add Environment Variables

In Railway dashboard for your project:

1. Click **Variables**
2. Add all these environment variables:

```env
NODE_ENV=production
PORT=5000
DATABASE_URL=<your-supabase-database-url>
JWT_SECRET=<generate-random-64-char-secret>
FRONTEND_URL=https://moniqofi.vercel.app
EMAIL_USER=<your-gmail-address>
EMAIL_PASS=<your-16-char-gmail-app-password>
GROQ_API_KEY=<your-groq-api-key-from-console.groq.com>
PLAID_CLIENT_ID=<your-plaid-client-id>
PLAID_SECRET=<your-plaid-secret>
PLAID_ENV=sandbox
SETU_CLIENT_ID=<your-setu-client-id>
SETU_CLIENT_SECRET=<your-setu-client-secret>
SETU_PRODUCT_INSTANCE_ID=<your-setu-product-instance-id>
SETU_BASE_URL=https://fiu-sandbox.setu.co
```

> **Note**: Copy the actual values from your `.env` file in the backend folder. Never commit secrets to GitHub!

### Step 4: Deploy

Railway automatically deploys when you push to GitHub (connected repository).

**Expected Duration**: 3-5 minutes

**Your Backend URL**: You'll see it in Railway dashboard like `https://moniqofi-backend-railway.railway.app`

### Step 5: Update Vercel with Backend URL

Once Railway deployment is complete:

1. Copy your Railway backend URL
2. Go to Vercel → `moniqofi` project → **Settings** → **Environment Variables**
3. Update `NEXT_PUBLIC_API_URL` with your Railway URL
4. Vercel will redeploy automatically

---

## Verification Checklist

After deploying both:

### Backend (Railway)
- [ ] Visit `https://your-railway-url/` - should see JSON response with status "ok"
- [ ] Test API endpoint: `https://your-railway-url/api/auth/me` (should return 401 without token)

### Frontend (Vercel)
- [ ] Visit `https://moniqofi.vercel.app`
- [ ] Try logging in with demo credentials:
  - Email: `priya@moniqofi.com`
  - Password: `Demo@123`
- [ ] Verify dashboard loads with data
- [ ] Check that API calls work (navigate to transactions, goals, etc.)

---

## Post-Deployment Checklist

### Update Your DNS (Optional)
If you have custom domains:
- Vercel: Add CNAME to your domain
- Railway: Add CNAME for API subdomain

### Enable HTTPS
Both Vercel and Railway provide free SSL certificates automatically ✅

### Monitor Deployments
- **Vercel**: Dashboard → Analytics for performance
- **Railway**: Dashboard → Logs for backend errors

### Database Backup
Your Supabase database is already live - no additional setup needed.

---

## Troubleshooting

### "Cannot GET /" on Vercel
- Check Root Directory is set to `./frontend`
- Rebuild: Settings → Deployments → Redeploy

### "Connection refused" from Frontend to Backend
- Verify `NEXT_PUBLIC_API_URL` is correct in Vercel
- Check Railway deployment is running (green status)
- Test backend URL directly in browser

### 502 Bad Gateway on Railway
- Check environment variables are set correctly
- Verify `DATABASE_URL` is accessible
- Check logs in Railway dashboard

### Authentication Fails
- Verify `JWT_SECRET` is same on both services
- Check `FRONTEND_URL` matches Vercel URL
- Clear browser cache and try again

---

## Quick Links

- **Vercel Dashboard**: https://vercel.com/dashboard
- **Railway Dashboard**: https://railway.app/dashboard
- **Supabase Database**: https://app.supabase.com
- **GitHub Repository**: https://github.com/NupoorYadu/moniqofi
- **MoniqoFi Documentation**: [README.md](../README.md)

---

## Support

For issues:
1. Check Railway and Vercel logs
2. Verify all environment variables
3. Test API directly with curl or Postman
4. Check database connectivity in Supabase dashboard

