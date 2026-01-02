# 🚀 Vercel Deployment Guide for IPO Tracker

## 📋 Prerequisites Checklist

- [x] GitHub repository with code pushed
- [x] Supabase project with PostgreSQL database
- [x] Vercel account (free at vercel.com)

---

## 🛠️ Step 1: Prepare Your Supabase Database

### 1.1 Get Your Database URLs

Go to your Supabase project → **Settings** → **Database**

You need two connection strings:

**1. Session Pooler URL (for app runtime)**
```
postgresql://postgres.lcuchhopliktfqrhkrxf:YOUR_PASSWORD@aws-1-ap-northeast-2.pooler.supabase.com:5432/postgres
```

**2. Direct URL (for Prisma migrations)**
```
postgresql://postgres:YOUR_PASSWORD@db.lcuchhopliktfqrhkrxf.supabase.co:5432/postgres
```

⚠️ **Important:** URL-encode your password if it contains special characters (like `@`, `:`, `/`)
- Replace `@` with `%40`
- Replace `:` with `%3A`
- Replace `/` with `%2F`

---

## 🔧 Step 2: Deploy Database Schema to Supabase

Since you already have the schema locally, you need to run migrations on Supabase:

```bash
# Option 1: Push schema directly (quick method)
npx prisma db push --skip-generate

# Option 2: Create and deploy migration (recommended for production)
npx prisma migrate deploy
```

**Or run via Docker if using EC2:**
```bash
docker exec -it ipo-app-db npx prisma db push
```

---

## 📦 Step 3: Deploy to Vercel

### 3.1 Go to Vercel
1. Visit [vercel.com](https://vercel.com)
2. Sign up/login with GitHub
3. Click **"Add New Project"**

### 3.2 Import Your Repository
1. Search for `IPOApplication` (your repo name)
2. Click **Import**

### 3.3 Configure Project

**Framework Preset:** Next.js

**Root Directory:** `./` (leave as default)

**Build Command:**
```bash
prisma generate && next build
```

**Output Directory:** `.next`

**Install Command:**
```bash
npm install
```

### 3.4 Add Environment Variables

Click **"Environment Variables"** and add these:

| Name | Value | Environment |
|------|-------|-------------|
| `DATABASE_URL` | Your Session Pooler URL | Production, Preview |
| `DIRECT_URL` | Your Direct Connection URL | Production, Preview |
| `NEXT_PUBLIC_APP_URL` | Your Vercel URL (after deploy) | Production, Preview |
| `CRON_SECRET` | Generate random string | Production, Preview |

**Example:**
```
DATABASE_URL=postgresql://postgres.lcuchhopliktfqrhkrxf:pass%40word@aws-1-ap-northeast-2.pooler.supabase.com:5432/postgres
```

### 3.5 Deploy!

Click **"Deploy"** and wait 2-3 minutes.

✅ **Success!** Your app will be at: `https://ipo-application.vercel.app`

---

## 🔐 Step 4: Configure Supabase Security

### 4.1 Allow Vercel IPs in Supabase

Go to Supabase → **Settings** → **Database** → **Connection Pooling**

Add these Vercel IPs to allowed list (if required):
```
0.0.0.0/0  # For testing (allow all)
```

Or find Vercel's IP ranges in their docs.

### 4.2 Enable Row Level Security (Optional but Recommended)

Go to Supabase **SQL Editor** and run:
```sql
-- Enable RLS
ALTER TABLE "IPO" ENABLE ROW LEVEL SELECT;

-- For public API access (adjust based on your needs)
CREATE POLICY "Allow all access" ON "IPO" FOR ALL USING (true);
```

---

## 🌐 Step 5: Custom Domain (Optional)

### 5.1 Add Custom Domain in Vercel
1. Go to **Settings** → **Domains**
2. Add your domain (e.g., `ipo-tracker.yourdomain.com`)
3. Update DNS records as shown

### 5.2 Free Domain Options
- **DuckDNS:** `your-ipo-tracker.duckdns.org` (free)
- **FreeDNS:** `ipo-tracker.freedomains.org` (free)
- **Freenom:** `ipo-tracker.tk`, `.ml`, `.ga` (free)

---

## ⚡ Step 6: Post-Deployment Checklist

- [ ] Test homepage loads: `https://your-app.vercel.app`
- [ ] Test IPO listing page: `/ipos`
- [ ] Test admin page: `/admin`
- [ ] Test API: `https://your-app.vercel.app/api/ipos`
- [ ] Check database connection works
- [ ] Verify stock price updates work

---

## 🐛 Common Issues & Fixes

### Issue 1: Database Connection Error
**Fix:** Make sure you're using **Session Pooler URL** (not Direct URL) for `DATABASE_URL`

### Issue 2: Prisma Client Not Generated
**Fix:** Added `prisma generate` to build command in vercel.json

### Issue 3: CORS Errors
**Fix:** Add `NEXT_PUBLIC_APP_URL` to environment variables

### Issue 4: Build Fails
**Fix:** Check that all dependencies are in package.json

---

## 📊 Monitor Your App

### Vercel Dashboard
- **Deployments:** See build logs
- **Analytics:** Page views, bandwidth
- **Functions:** API route performance

### Supabase Dashboard
- **Database:** Slow queries, connections
- **API Requests:** Rate limits

---

## 💡 Pro Tips

1. **Automatic Deployments:** Every push to `master` triggers auto-deploy
2. **Preview Deployments:** Every PR gets a preview URL
3. **Environment Variables:** Different for Production/Preview/Development
4. **Database Backups:** Supabase auto-backs up daily
5. **Rate Limiting:** Consider adding API rate limiting for public use

---

## 🔄 Update Workflow

```bash
# Make changes locally
git add .
git commit -m "Add new feature"
git push

# Vercel auto-deploys! ✨
```

---

## 📞 Support

- **Vercel Docs:** https://vercel.com/docs
- **Supabase Docs:** https://supabase.com/docs
- **Next.js Docs:** https://nextjs.org/docs

---

## 🎉 You're Live!

Your IPO Tracker is now live on Vercel with:
- ✅ Free SSL certificate
- ✅ Global CDN
- ✅ Automatic HTTPS
- ✅ GitHub integration
- ✅ Preview deployments
- ✅ Analytics

**Your URL:** `https://ipo-application.vercel.app` (or your custom domain)
