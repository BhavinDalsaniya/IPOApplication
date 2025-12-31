# Supabase Setup Guide - Remote Database for Local + Production

This guide shows how to setup **Supabase** as your remote PostgreSQL database that works from both local development and AWS EC2 production.

---

## Why This Architecture?

```
┌─────────────────────────────────────────────────────────────┐
│                    Your Workflow                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Local PC                 Supabase (Cloud)      AWS EC2     │
│  ┌────────┐               ┌──────────┐        ┌────────┐   │
│  │ Admin  │ ──read/write─→│          │←───────│  App   │   │
│  │ Panel  │               │ Database │        │ (Next) │   │
│  └────────┘               │          │        └────────┘   │
│                            └──────────┘                      │
│                                 ↑                            │
│                                 │                            │
│                            Auto backups                     │
│                            Ready in 50ms                    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Benefits:**
- ✅ Add/update IPOs from your local PC admin panel
- ✅ No need to access EC2 server for data changes
- ✅ Both local and production use same database
- ✅ Automatic backups handled by Supabase
- ✅ Real-time data sync across all environments
- ✅ FREE for development (500 MB storage)

---

## Step 1: Create Supabase Account

### 1.1 Sign Up
1. Go to [supabase.com](https://supabase.com)
2. Click **"Start your project"**
3. Sign up with **GitHub** (recommended) or Email

### 1.2 Create New Project
1. Click **"New Project"**
2. Fill in the form:
   | Field | Value |
   |-------|-------|
   | **Name** | ipo-application |
   | **Database Password** | Generate strong password (SAVE IT!) |
   | **Region** | Singapore (closest to India) |
   | **Pricing Plan** | Free (confirmed) |

3. Click **"Create new project"**
4. Wait 2-3 minutes for project to be ready

---

## Step 2: Get Database Connection Strings

### 2.1 Navigate to Project Settings
1. In your Supabase project, click **Settings** (left sidebar)
2. Click **Database**
3. Scroll down to **Connection String** section

### 2.2 Get Connection Strings

You'll see two connection strings:

#### **A. Transaction Pooling (Port 6543)** - For Application
```
postgresql://postgres.xxxxx:PASSWORD@aws-0-ap-south-1.pooler.supabase.com:6543/postgres
```

#### **B. Direct Connection (Port 5432)** - For Migrations
```
postgresql://postgres.xxxxx:PASSWORD@aws-0-ap-south-1.pooler.supabase.com:5432/postgres
```

---

## Step 3: Setup Local Development

### 3.1 Create `.env.local` File

Create or edit `.env.local` in your project root:

```bash
# Database Connection (Transaction Pooling - for app)
DATABASE_URL="postgresql://postgres.YOUR_PROJECT_ID:YOUR_PASSWORD@aws-0-ap-south-1.pooler.supabase.com:6543/postgres"

# Direct Connection (for Prisma migrations)
DIRECT_URL="postgresql://postgres.YOUR_PROJECT_ID:YOUR_PASSWORD@aws-0-ap-south-1.pooler.supabase.com:5432/postgres"

# Cron secret
CRON_SECRET="local-dev-secret"

# App URL
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 3.2 Update Prisma Schema

Edit `prisma/schema.prisma`:

```prisma
datasource db {
  provider          = "postgresql"
  url               = env("DATABASE_URL")
  directUrl         = env("DIRECT_URL")  // Add this line
}

// ... rest of your schema
```

### 3.3 Install Dependencies & Generate Prisma Client

```bash
# Install dependencies (if not already installed)
npm install

# Generate Prisma client for Supabase
npx prisma generate

# Push schema to Supabase
npx prisma db push

# Or create migration (recommended for production)
npx prisma migrate dev --name init
```

### 3.4 Verify Connection

```bash
# Start local development
npm run dev
```

Visit `http://localhost:3000` and verify it works!

---

## Step 4: Test Local Admin Panel

1. Open `http://localhost:3000/admin`
2. Create a test IPO
3. Go to [Supabase Dashboard](https://supabase.com/dashboard)
4. Click **Table Editor** → Select `IPO` table
5. You should see your test IPO there! ✅

---

## Step 5: Setup Production (AWS EC2)

### 5.1 Update Environment on EC2

SSH into your EC2 instance and edit `.env`:

```bash
cd ipo-app
nano .env
```

```bash
# Production Environment with Supabase
DATABASE_URL="postgresql://postgres.YOUR_PROJECT_ID:YOUR_PASSWORD@aws-0-ap-south-1.pooler.supabase.com:6543/postgres"

DIRECT_URL="postgresql://postgres.YOUR_PROJECT_ID:YOUR_PASSWORD@aws-0-ap-south-1.pooler.supabase.com:5432/postgres"

CRON_SECRET="strong-production-secret"

NEXT_PUBLIC_APP_URL="http://your-ec2-ip:3000"
```

### 5.2 Update Docker Compose

Edit `docker-compose.yml` on EC2:

```yaml
services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: ipo-app
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - DIRECT_URL=${DIRECT_URL}
      - NODE_ENV=production
      - CRON_SECRET=${CRON_SECRET}
      - NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL}
    # Remove postgres service and depends_on
```

**Note:** We don't need the `postgres` service anymore since we're using Supabase!

### 5.3 Deploy

```bash
# Rebuild and restart
docker compose down
docker compose up -d --build

# Run migrations
docker compose exec app npx prisma migrate deploy
```

---

## Step 6: Verify Production Setup

1. Access your EC2 app: `http://your-ec2-ip:3000`
2. Add IPO from local admin: `http://localhost:3000/admin`
3. Refresh EC2 app - You should see the new IPO! ✅

**Both local and production are now using the SAME Supabase database!**

---

## Step 7: Managing Database (Optional)

### View Data in Supabase Dashboard
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Click your project
3. Click **Table Editor** (left sidebar)
4. View/edit/delete IPOs directly

### Use Prisma Studio (Local Only)
```bash
npm run db:studio
```

Opens at `http://localhost:5555` - GUI to edit data

### SQL Editor in Supabase
1. In Supabase Dashboard, click **SQL Editor**
2. Run custom queries
3. Example:
```sql
SELECT * FROM "IPO" WHERE status = 'listed';
```

---

## Step 8: Backup & Restore

### Automatic Backups
Supabase automatically backs up your database daily (included in free tier)

### Manual Backup
```bash
# From your local machine
docker run -v $(pwd):/backup --rm \
  -e PGPASSWORD=YOUR_PASSWORD \
  postgres:16 \
  pg_dump -h aws-0-ap-south-1.pooler.supabase.com \
  -U postgres.YOUR_PROJECT_ID \
  -d postgres > backup.sql
```

### Restore Backup
```bash
# Restore from SQL file
docker run -v $(pwd):/backup --rm \
  -e PGPASSWORD=YOUR_PASSWORD \
  postgres:16 \
  psql -h aws-0-ap-south-1.pooler.supabase.com \
  -U postgres.YOUR_PROJECT_ID \
  -d postgres < backup.sql
```

---

## Troubleshooting

### Error: "Connection refused"
- Check your `DATABASE_URL` (port should be 6543 for Supabase)
- Verify password is correct
- Check Supabase project is active (not paused)

### Error: "Prisma schema mismatch"
```bash
# Regenerate Prisma client
npx prisma generate

# Push schema to database
npx prisma db push
```

### Local shows old data
- Clear browser cache: Ctrl+Shift+R
- Restart Next.js: Ctrl+C, then `npm run dev`

### Production shows old data
```bash
# Restart container on EC2
docker compose restart app
```

### Free tier limits exceeded
- Check Supabase Dashboard → Settings → Billing
- Free tier: 500 MB storage, 1 GB bandwidth/month
- Upgrade to Pro ($25/month) if needed

---

## Supabase Free Tier Limits

| Resource | Limit |
|----------|-------|
| Database Storage | 500 MB |
| Bandwidth | 1 GB / month |
| Database Rows | No limit (within storage) |
| API Requests | 50,000 / month |
| Connection Timeouts | 60 seconds |
| File Storage | 50 MB |

**For IPO tracking app**, these limits are more than enough!

---

## Security Checklist

- [ ] Never commit `.env.local` or `.env` to Git
- [ ] Use strong database password (Supabase auto-generates one)
- [ ] Enable Row Level Security (RLS) in Supabase if adding Auth later
- [ ] Use different `CRON_SECRET` for local and production
- [ ] Don't share your Supabase project URL publicly

---

## Quick Commands Reference

```bash
# Local Development
npm run dev                    # Start Next.js locally
npm run db:studio             # Open Prisma Studio
npx prisma db push            # Push schema changes
npx prisma generate           # Generate Prisma client

# Production (on EC2)
docker compose up -d --build  # Deploy app
docker compose logs -f app    # View logs
docker compose restart app    # Restart app
docker compose exec app npx prisma migrate deploy  # Run migrations
```

---

## Next Steps

1. ✅ Setup Supabase account
2. ✅ Configure `.env.local` for local development
3. ✅ Test admin panel from local machine
4. ✅ Deploy to AWS EC2 with same DATABASE_URL
5. ✅ Both environments now share same database!

---

## Architecture Summary

| Component | Location | Purpose |
|-----------|----------|---------|
| **Next.js App (Local)** | Your PC | Development, Admin Panel |
| **Next.js App (Prod)** | AWS EC2 | Production server for users |
| **PostgreSQL** | Supabase (Cloud) | Shared database for both |
| **Backups** | Supabase | Automatic daily backups |

**You can now update IPO data from your local admin panel, and it instantly reflects on production!**
