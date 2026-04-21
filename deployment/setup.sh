#!/bin/bash
# ============================================
# Deployment Setup Script
# Run this to prepare for deployment
# ============================================

set -e

echo "============================================"
echo "Marketing CRM - Deployment Setup"
echo "============================================"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check Node.js version
echo -e "${YELLOW}Checking Node.js version...${NC}"
NODE_VERSION=$(node -v)
echo "Node.js version: $NODE_VERSION"

if [[ ! $NODE_VERSION =~ ^v(18|20|22) ]]; then
    echo -e "${YELLOW}Warning: Node.js 18, 20, or 22 recommended${NC}"
fi

# Check npm
echo -e "${YELLOW}Checking npm...${NC}"
npm --version

# Install dependencies
echo -e "${YELLOW}Installing dependencies...${NC}"
npm ci

# Generate AUTH_SECRET if not set
echo -e "${YELLOW}Checking environment variables...${NC}"

if grep -q "YOUR_AUTH_SECRET" .env.local 2>/dev/null; then
    echo -e "${YELLOW}Generating AUTH_SECRET...${NC}"
    AUTH_SECRET=$(openssl rand -base64 32)
    sed -i.bak "s/YOUR_AUTH_SECRET_HERE/$AUTH_SECRET/" .env.local 2>/dev/null || true
    rm -f .env.local.bak
    echo -e "${GREEN}AUTH_SECRET generated and updated in .env.local${NC}"
fi

# Build check
echo -e "${YELLOW}Running build to verify...${NC}"
npm run build

echo ""
echo -e "${GREEN}============================================"
echo "Setup Complete!"
echo "============================================"
echo ""
echo "Next steps:"
echo "1. Update .env.local with production values"
echo "2. Push code to GitHub"
echo "3. Deploy via Hostinger"
echo ""
echo "See deployment/HOSTINGER_DEPLOY.md for full guide"
echo "============================================"