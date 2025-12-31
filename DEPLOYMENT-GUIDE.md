# Complete Deployment Guide: GitHub → AWS EC2 + Supabase

Deploy your IPO application using **FREE** AWS EC2 + **FREE** Supabase database.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    YOUR ARCHITECTURE                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   Local PC          GitHub          AWS EC2          Supabase    │
│   ┌──────┐         ┌──────┐         ┌──────┐         ┌──────┐   │
│   │ Dev  │──push──→│ Code  │──pull──→│ App  │──read──→│  DB  │   │
│   │      │         │ Repo  │         │      │         │      │   │
│   └──────┘         └──────┘         └──────┘         └──────┘   │
│                                             │                    │
│                          Users ──access─────┘                    │
│                                                                  │
│   - Code stored on GitHub                                       │
│   - App runs on AWS EC2 (FREE tier)                             │
│   - Database on Supabase (FREE)                                 │
│   - You can update data from local OR Supabase dashboard        │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Step 1: Push Code to GitHub

### 1.1 Initialize Git Repository

```bash
cd "c:\Game Cards\IPO Application"

# Initialize git (if not already done)
git init

# Check status
git status
```

### 1.2 Create `.gitignore`

Already created for you! It excludes:
- `.env`, `.env.local`, `.env.production` (sensitive!)
- `node_modules`
- `.next` build files
- Local database files

### 1.3 Commit Your Code

```bash
# Add all files
git add .

# Commit
git commit -m "Ready for deployment - IPO application with Supabase"

# Create GitHub repository first at github.com/new
# Then add remote (replace with your repo URL)
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git

# Push to GitHub
git branch -M main
git push -u origin main
```

---

## Step 2: Setup AWS EC2 Instance

### 2.1 Go to AWS Console

1. Login to [AWS Console](https://console.aws.amazon.com/)
2. Search for **EC2** and click it
3. Click **"Launch Instance"**

### 2.2 Configure EC2 Instance

| Setting | Value |
|---------|-------|
| **Name** | ipo-application |
| **OS** | Ubuntu Server 24.04 LTS (HVM), SSD Volume Type |
| **Architecture** | 64-bit (x86) |
| **Instance Type** | t2.micro (Free Tier eligible) ✅ |
| **Key Pair** | Create or use existing (save `.pem` file safely!) |

### 2.3 Configure Network (Security Group)

Click **"Edit"** on Network settings and add:

| Type | Protocol | Port Range | Source | Description |
|------|----------|------------|--------|-------------|
| SSH | TCP | 22 | My IP | For SSH access |
| HTTP | TCP | 80 | 0.0.0.0/0 | For web access |
| Custom TCP | TCP | 3000 | 0.0.0.0/0 | For Next.js app |

### 2.4 Storage

- Keep default: 8 GB gp2 General Purpose SSD (FREE tier)

### 2.5 Launch Instance

1. Click **"Launch Instance"**
2. Wait 2-3 minutes for instance to be **"Running"**
3. Note your **Instance Public IPv4 address** (e.g., `54.123.45.67`)

---

## Step 3: Connect to EC2 Instance

### Option A: EC2 Instance Connect (Easiest)

1. In EC2 Console, select your instance
2. Click **"Connect"** tab
3. Select **"EC2 Instance Connect"**
4. Click **"Connect"**

### Option B: SSH (From your terminal)

```bash
# On Windows (PowerShell)
ssh -i "your-key-pair.pem" ubuntu@YOUR_EC2_PUBLIC_IP

# On Linux/Mac
chmod 400 your-key-pair.pem
ssh -i your-key-pair.pem ubuntu@YOUR_EC2_PUBLIC_IP
```

---

## Step 4: Install Docker on EC2

Run these commands one by one:

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add ubuntu user to docker group
sudo usermod -aG docker ubuntu

# Install Docker Compose
sudo apt install docker-compose-plugin -y

# Enable Docker on boot
sudo systemctl enable docker

# Verify installation
docker --version
docker compose version
```

**Logout and login again** for group changes to take effect:
```bash
exit
# Then reconnect using EC2 Instance Connect
```

---

## Step 5: Clone Your Code

```bash
# Install Git
sudo apt install git -y

# Clone your repository (replace with your repo URL)
git clone https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git ipo-app

# Go to project directory
cd ipo-app

# List files to verify
ls -la
```

You should see:
```
Dockerfile
docker-compose.prod.yml
.env.production.example
app/
lib/
prisma/
package.json
```

---

## Step 6: Configure Environment Variables

### 6.1 Create `.env.production` File

```bash
nano .env.production
```

### 6.2 Add Your Supabase Credentials

Copy this content (replace with YOUR values):

```bash
# Production Environment - AWS EC2 + Supabase

# Supabase Session Pooler (URL-encoded password)
DATABASE_URL="postgresql://postgres.lcuchhopliktfqrhkrxf:j%23%2Az%3Fy5%40N86UYnkG@aws-1-ap-northeast-2.pooler.supabase.com:5432/postgres"

# Direct Connection (for migrations)
DIRECT_URL="postgresql://postgres:j%23%2Az%3Fy5%40N86UYnkG@db.lcuchhopliktfqrhkrxf.supabase.co:5432/postgres"

# Cron secret - USE A STRONG RANDOM STRING!
CRON_SECRET="prod-secret-$(openssl rand -hex 32)"

# App URL - Replace with your EC2 public IP
NEXT_PUBLIC_APP_URL="http://YOUR_EC2_PUBLIC_IP:3000"
```

**Save and exit:** `Ctrl+X`, then `Y`, then `Enter`

---

## Step 7: Deploy Application

### 7.1 Build and Start Docker Containers

```bash
# Build and start (using production docker-compose)
docker compose -f docker-compose.prod.yml up -d --build

# Check if containers are running
docker ps

# View logs (if any issues)
docker compose -f docker-compose.prod.yml logs -f
```

You should see:
```
ipo-app   → Running (Up)
```

### 7.2 Run Database Migrations

```bash
# Generate Prisma client
docker compose -f docker-compose.prod.yml exec app npx prisma generate

# Push schema to Supabase (if not already done)
docker compose -f docker-compose.prod.yml exec app npx prisma db push
```

---

## Step 8: Access Your Application

### 8.1 Test Your Application

Open browser: **`http://YOUR_EC2_PUBLIC_IP:3000`**

You should see:
- **Home page** at `http://YOUR_EC2_PUBLIC_IP:3000`
- **IPO listing** at `http://YOUR_EC2_PUBLIC_IP:3000/ipos`
- **Admin panel** at `http://YOUR_EC2_PUBLIC_IP:3000/admin`

### 8.2 Verify Database Connection

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Click your project
3. Click **Table Editor** → **IPO**
4. You should see your IPO data! ✅

---

## Step 9: Setup Custom Domain (Optional)

### Option A: Use Cloudflare (FREE + SSL)

1. Add your domain to [Cloudflare](https://cloudflare.com)
2. Point **A record** to your EC2 public IP
3. Enable **"Proxied"** (orange cloud) - FREE SSL!
4. Update `.env.production`:
   ```bash
   NEXT_PUBLIC_APP_URL="https://your-domain.com"
   ```

### Option B: Direct Domain (No SSL)

1. Buy domain from any provider
2. Add **A record** pointing to your EC2 IP
3. DNS propagation takes 1-24 hours

---

## Step 10: Managing Your Application

### Common Commands

```bash
# View logs
docker compose -f docker-compose.prod.yml logs -f app

# Stop application
docker compose -f docker-compose.prod.yml down

# Start application
docker compose -f docker-compose.prod.yml up -d

# Restart application
docker compose -f docker-compose.prod.yml restart app

# Update application (after git pull)
git pull
docker compose -f docker-compose.prod.yml up -d --build
```

### Add IPO Data from Local

You can add IPOs from your **local machine**:
```bash
# Locally
npm run dev
# Visit http://localhost:3001/admin
# Add IPO → Instantly appears on production!
```

OR from **Supabase Dashboard**:
1. Go to Table Editor → IPO
2. Click **"Insert row"**
3. Add data directly

---

## Troubleshooting

### Container won't start?

```bash
# Check logs
docker compose -f docker-compose.prod.yml logs app

# Common issues:
# 1. Database connection error → Check .env.production credentials
# 2. Port 3000 already in use → Stop other containers
# 3. Build error → Check Dockerfile syntax
```

### Database connection error?

```bash
# Verify Supabase is accessible
docker compose -f docker-compose.prod.yml exec app sh
curl https://db.lcuchhopliktfqrhkrxf.supabase.co:5432

# Check credentials in .env.production
cat .env.production

# Restart container
docker compose -f docker-compose.prod.yml restart app
```

### Page not loading?

1. Check EC2 Security Group allows port 3000
2. Check if container is running: `docker ps`
3. Check logs: `docker compose logs`

### Out of memory on t2.micro?

Upgrade instance type:
1. Stop instance
2. Change instance type to **t3.small** or **t3.medium**
3. Start instance

Or add swap space:
```bash
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

---

## Cost Summary

| Service | Monthly Cost |
|---------|--------------|
| AWS EC2 t2.micro | **FREE** (12 months) or ~$8-10/month after |
| Supabase PostgreSQL | **FREE** (500 MB) |
| Cloudflare SSL | **FREE** |
| **Total** | **$0-10/month** |

---

## Security Checklist

- [x] `.gitignore` excludes `.env` files
- [x] Strong `CRON_SECRET` in production
- [x] EC2 Security Group restricts SSH to your IP
- [x] Supabase password is URL-encoded
- [ ] Enable HTTPS (Cloudflare recommended)
- [ ] Setup regular database backups
- [ ] Monitor EC2 CPU/Memory usage

---

## Workflow Summary

```
┌─────────────────────────────────────────────────────────────┐
│                    YOUR WORKFLOW                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. Make changes locally                                   │
│  2. Test locally: npm run dev                              │
│  3. Commit: git add . && git commit -m "message"           │
│  4. Push: git push                                         │
│  5. On EC2: git pull && docker compose up -d --build       │
│                                                             │
│  For data updates:                                          │
│  - Use local admin: http://localhost:3001/admin            │
│  - OR use Supabase Dashboard → Table Editor                │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Quick Reference Commands

### Local (Your PC)
```bash
npm run dev                # Start development
npm run build              # Build for production
npm run start              # Start production
npm run db:studio          # Prisma Studio
```

### EC2 (Production)
```bash
git pull                   # Pull latest code
docker compose -f docker-compose.prod.yml up -d --build   # Deploy
docker compose -f docker-compose.prod.yml logs -f         # View logs
docker compose -f docker-compose.prod.yml restart app     # Restart
```

### Supabase
```
Dashboard: https://supabase.com/dashboard
Table Editor: Add/Edit IPOs directly
SQL Editor: Run custom queries
```

---

## Next Steps

1. ✅ Push code to GitHub
2. ✅ Launch AWS EC2 instance
3. ✅ Connect and install Docker
4. ✅ Clone code and configure environment
5. ✅ Deploy with Docker Compose
6. ✅ Test application
7. ⬜ Setup custom domain (optional)
8. ⬜ Enable HTTPS (optional)
9. ⬜ Setup monitoring (optional)

---

## Support

### Files Referenced in This Guide
- [.gitignore](.gitignore) - Excludes sensitive files from git
- [.env.production.example](.env.production.example) - Template for production env
- [docker-compose.prod.yml](docker-compose.prod.yml) - Production docker config
- [Dockerfile](Dockerfile) - Container definition
- [prisma/schema.prisma](prisma/schema.prisma) - Database schema

### Useful Links
- [AWS EC2 Console](https://console.aws.amazon.com/ec2/)
- [Supabase Dashboard](https://supabase.com/dashboard)
- [Docker Documentation](https://docs.docker.com/)
- [Prisma Documentation](https://www.prisma.io/docs)

---

**Your IPO application is now live on AWS EC2 with Supabase database! 🎉**
