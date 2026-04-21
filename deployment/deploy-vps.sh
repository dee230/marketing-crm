#!/bin/bash
# ============================================
# Marketing CRM - VPS Auto Deploy Script
# Run as: bash deploy-vps.sh
# ============================================

set -e

echo "============================================"
echo "Marketing CRM - VPS Deployment"
echo "============================================"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}Please run as root (sudo bash deploy-vps.sh)${NC}"
    exit 1
fi

echo -e "${YELLOW}Starting deployment...${NC}"

# ============================================
# Step 1: Install Node.js
# ============================================
echo -e "${YELLOW}Installing Node.js...${NC}"
curl -fsSL https://deb.nodesource.com/setup_lts.x | bash -
apt install -y nodejs
node -v
npm -v

# ============================================
# Step 2: Install Nginx
# ============================================
echo -e "${YELLOW}Installing Nginx...${NC}"
apt install -y nginx
systemctl enable nginx

# ============================================
# Step 3: Install PM2
# ============================================
echo -e "${YELLOW}Installing PM2...${NC}"
npm install -g pm2
pm2 install signup || true

# ============================================
# Step 4: Create App Directory
# ============================================
echo -e "${YELLOW}Setting up app directory...${NC}"
mkdir -p /var/www/marketing-crm
cd /var/www/marketing-crm

# Ask for GitHub repo if not cloned
if [ ! -f package.json ]; then
    echo "Enter your GitHub repository URL:"
    echo "Example: https://github.com/username/marketing-crm.git"
    read -r GITHUB_REPO
    
    if [ -n "$GITHUB_REPO" ]; then
        git clone "$GITHUB_REPO" .
    else
        echo -e "${RED}No repository provided. Please manually upload files first.${NC}"
        exit 1
    fi
fi

# ============================================
# Step 5: Environment Variables
# ============================================
echo -e "${YELLOW}Setting up environment variables...${NC}"

# Ask for domain
echo "Enter your domain (or press Enter to skip SSL):"
read -r DOMAIN

# Generate AUTH_SECRET if not exists
if ! grep -q "AUTH_SECRET" .env.local 2>/dev/null; then
    AUTH_SECRET=$(openssl rand -base64 32)
    echo "AUTH_SECRET=$AUTH_SECRET" >> .env.local
fi

# Update NEXT_PUBLIC_BETTER_AUTH_URL
if [ -n "$DOMAIN" ]; then
    echo "NEXT_PUBLIC_BETTER_AUTH_URL=https://$DOMAIN" >> .env.local
else
    echo "NEXT_PUBLIC_BETTER_AUTH_URL=http://$(hostname -I | awk '{print $1}')" >> .env.local
fi

echo "NODE_ENV=production" >> .env.local

# ============================================
# Step 6: Install Dependencies & Build
# ============================================
echo -e "${YELLOW}Installing dependencies...${NC}"
npm ci

echo -e "${YELLOW}Building application...${NC}"
npm run build

# ============================================
# Step 7: Start with PM2
# ============================================
echo -e "${YELLOW}Starting application with PM2...${NC}"
pm2 delete marketing-crm 2>/dev/null || true
pm2 start npm --name "marketing-crm" -- start -- -p 3000
pm2 save

# ============================================
# Step 8: Configure Nginx
# ============================================
if [ -n "$DOMAIN" ]; then
    echo -e "${YELLOW}Configuring Nginx for $DOMAIN...${NC}"
    
    cat > /etc/nginx/sites-available/marketing-crm <<EOF
server {
    listen 80;
    server_name $DOMAIN;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

    ln -sf /etc/nginx/sites-available/marketing-crm /etc/nginx/sites-enabled/
    nginx -t
    systemctl restart nginx

    # ============================================
    # Step 9: Set Up SSL
    # ============================================
    echo -e "${YELLOW}Setting up SSL certificate...${NC}"
    apt install -y certbot python3-certbot-nginx
    
    certbot --nginx -d "$DOMAIN" --non-interactive --agree-tos --email admin@"$DOMAIN"
fi

# ============================================
# Step 10: Firewall
# ============================================
echo -e "${YELLOW}Configuring firewall...${NC}"
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

# ============================================
# Done
# ============================================
echo ""
echo -e "${GREEN}============================================"
echo "Deployment Complete!"
echo "============================================${NC}"
echo ""

if [ -n "$DOMAIN" ]; then
    echo -e "Your site: https://$DOMAIN"
else
    echo -e "Your site: http://YOUR_VPS_IP"
fi

echo ""
echo "Useful commands:"
echo "  pm2 status          - Check app status"
echo "  pm2 logs            - View logs"
echo "  pm2 restart marketing-crm  - Restart app"
echo ""
echo "Deployment files location: /var/www/marketing-crm"
echo "============================================"