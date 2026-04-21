# Hostinger Deployment Guide

## Marketing CRM - Next.js Application

This guide covers deploying your Marketing CRM application on Hostinger.

---

## Option 1: Node.js Web Apps (Recommended)

Hostinger's managed Node.js hosting with GitHub integration.

### Requirements
- Business or Cloud hosting plan
- GitHub repository with your code
- Node.js 20.x

### Deployment Steps

#### 1. Push Code to GitHub
```bash
cd marketing-crm
git init (if not already initialized)
git add .
git commit -m "Initial deployment commit"
git remote add origin https://github.com/YOUR_USERNAME/marketing-crm.git
git push -u origin main
```

#### 2. Connect GitHub in Hostinger
1. Log into **Hostinger hPanel**
2. Go to **Websites** → **Add Website**
3. Select **Node.js Apps**
4. Choose **Import Git Repository**
5. Authorize GitHub access
6. Select your repository

#### 3. Configure Build Settings

| Setting | Value |
|---------|-------|
| **Install command** | `npm ci` |
| **Build command** | `npm run build` |
| **Start command** | `npm run start -- -p $PORT` |
| **Node.js version** | `20` |

#### 4. Add Environment Variables

In Hostinger dashboard, go to **Environment Variables** and add:

```
AUTH_SECRET=generate-with-openssl-rand-base64-32
NEXT_PUBLIC_BETTER_AUTH_URL=https://yourdomain.com
```

To generate AUTH_SECRET locally:
```bash
openssl rand -base64 32
```

#### 5. Deploy
Click **Deploy** and wait for build to complete.

---

## Option 2: VPS Deployment

For full control, use a Hostinger VPS.

### Prerequisites
- Hostinger VPS (Ubuntu 22.04 or 24.04)
- SSH access configured

### Step 1: Connect via SSH
```bash
ssh root@YOUR_VPS_IP
```

### Step 2: Install Node.js
```bash
curl -fsSL https://deb.nodesource.com/setup_lts.x | bash -
apt install -y nodejs
node -v  # Verify installation
npm -v
```

### Step 3: Install PM2 (Process Manager)
```bash
npm install -g pm2
```

### Step 4: Create App Directory
```bash
mkdir -p /var/www/marketing-crm
cd /var/www/marketing-crm
```

### Step 5: Pull Code from Git
```bash
# Clone or pull your repository
git clone https://github.com/YOUR_USERNAME/marketing-crm.git .
```

### Step 6: Install Dependencies
```bash
npm ci
```

### Step 7: Configure Environment
```bash
# Create .env.local
nano .env.local
```

Add these variables:
```
AUTH_SECRET=YOUR_GENERATED_SECRET
NEXT_PUBLIC_BETTER_AUTH_URL=https://yourdomain.com
NODE_ENV=production
```

### Step 8: Build Application
```bash
npm run build
```

### Step 9: Start with PM2
```bash
pm2 start npm --name "marketing-crm" -- start -- -p $PORT
pm2 save
pm2 startup
```

### Step 10: Configure Nginx Reverse Proxy
```bash
apt install -y nginx
```

Create nginx config:
```bash
nano /etc/nginx/sites-available/marketing-crm
```

Add configuration:
```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable the site:
```bash
ln -s /etc/nginx/sites-available/marketing-crm /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx
```

### Step 11: Set Up SSL (Let's Encrypt)
```bash
apt install -y certbot python3-certbot-nginx
certbot --nginx -d yourdomain.com
```

### Step 12: Firewall Setup
```bash
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable
```

---

## Environment Variables Reference

### Required Variables
| Variable | Description | Example |
|----------|-------------|---------|
| `AUTH_SECRET` | NextAuth secret (generate with openssl) | `2XhIw4zAXxl73lC+d5xk...` |
| `NEXT_PUBLIC_BETTER_AUTH_URL` | Production URL | `https://yourdomain.com` |
| `NODE_ENV` | Environment | `production` |

### Database
Your app uses **SQLite** by default (file: `data.db`).

For PostgreSQL (optional):
```
DATABASE_URL=postgresql://user:password@host:5432/database
```

### Email (Optional)
```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM="Marketing CRM" <noreply@yourdomain.com>
```

---

## Post-Deployment Checklist

- [ ] Push code to GitHub
- [ ] Create Hostinger Node.js app
- [ ] Connect GitHub repository
- [ ] Configure build commands
- [ ] Add environment variables
- [ ] Deploy and verify build
- [ ] Test authentication (sign in/out)
- [ ] Test session timeout
- [ ] Test all navigation pages
- [ ] Connect custom domain (if applicable)
- [ ] Enable SSL certificate
- [ ] Test on mobile device

---

## Troubleshooting

### Build Fails
1. Check environment variables are set
2. Verify Node.js version (use 20.x)
3. Check build logs in Hostinger dashboard
4. Ensure all dependencies are in package.json

### App Won't Start
1. Check if port 3000 is in use: `lsof -i :3000`
2. Verify environment variables: `pm2 logs`
3. Check data.db file permissions

### Database Errors
1. Verify data.db exists and is writable
2. Check DATABASE_URL if using PostgreSQL
3. Run migrations if needed

### SSL Certificate Issues
```bash
certbot --nginx -d yourdomain.com --force-renewal
```

---

## Useful Commands

### PM2 Commands
```bash
pm2 status           # Check app status
pm2 logs             # View logs
pm2 restart marketing-crm   # Restart app
pm2 stop marketing-crm      # Stop app
pm2 delete all       # Remove all processes
```

### Nginx Commands
```bash
nginx -t            # Test config
systemctl restart nginx   # Restart nginx
```

### Database Commands
```bash
# Backup SQLite database
cp data.db data.db.backup

# Check database size
ls -lh data.db
```

---

## Support Links

- [Hostinger Node.js Hosting](https://www.hostinger.com/support/how-to-add-a-front-end-website-in-hostinger/)
- [Official Next.js Deployment](https://nextjs.org/docs/app/building-your-application/deploying)
- [Hostinger GitHub Integration](https://www.hostinger.com/support/how-to-update-github-repository-permissions-for-nodejs-hosting/)