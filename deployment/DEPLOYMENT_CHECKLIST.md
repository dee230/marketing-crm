# Deployment Checklist

## Pre-Deployment Checklist

### Code Preparation
- [ ] All features complete and tested locally
- [ ] No console errors in development
- [ ] Environment variables configured in `.env.local`
- [ ] Database migrated and seeded (if needed)
- [ ] Code pushed to GitHub repository

### Account Setup
- [ ] Hostinger account created
- [ ] Domain purchased (if applicable)
- [ ] Domain connected to Hostinger
- [ ] SSH access configured (for VPS)

---

## Hostinger Node.js Web Apps Deployment

### Step 1: Repository Setup
- [ ] Code pushed to GitHub
- [ ] GitHub repository is public or permissions granted

### Step 2: Hostinger Setup
- [ ] Log into hPanel
- [ ] Navigate to Websites → Add Website
- [ ] Select Node.js Apps
- [ ] Choose Import Git Repository
- [ ] Connect GitHub account
- [ ] Select repository

### Step 3: Configuration
- [ ] Node.js version: `20`
- [ ] Build command: `npm ci`
- [ ] Start command: `npm run start -- -p $PORT`
- [ ] Add environment variables

### Step 4: Environment Variables
- [ ] `AUTH_SECRET` - Generate with `openssl rand -base64 32`
- [ ] `NEXT_PUBLIC_BETTER_AUTH_URL` - Your production URL
- [ ] `NODE_ENV` - `production`

### Step 5: Deployment
- [ ] Click Deploy
- [ ] Wait for build to complete
- [ ] Verify no build errors
- [ ] Note deployment URL

---

## Post-Deployment Verification

### Basic Functionality
- [ ] Homepage loads
- [ ] Sign in page accessible
- [ ] Can log in with test credentials
- [ ] Can log out

### Navigation
- [ ] Dashboard loads
- [ ] Clients page accessible
- [ ] Leads page accessible
- [ ] Invoices page (admin only)
- [ ] Accounting page (admin only)
- [ ] Tasks page accessible
- [ ] Reports page accessible

### Admin Features
- [ ] Users page (admin only)
- [ ] Password Resets page (admin only)
- [ ] Audit Logs page (admin only)

### Session Management
- [ ] Session timeout works (5 minutes)
- [ ] Warning modal appears before logout
- [ ] "Stay Logged In" resets timer
- [ ] Auto-logout after inactivity

### API Endpoints
- [ ] Clients API works
- [ ] Leads API works
- [ ] Invoices API works
- [ ] Tasks API works

### Email (if configured)
- [ ] Password reset emails send
- [ ] Invoice reminders work
- [ ] Overdue notices work

---

## Domain & SSL

### Domain Setup
- [ ] Custom domain connected
- [ ] DNS configured correctly
- [ ] Domain propagates (may take 24-48 hours)

### SSL Certificate
- [ ] SSL auto-enabled (Hostinger provides)
- [ ] HTTPS works
- [ ] No certificate warnings

---

## Security Checklist

### Authentication
- [ ] Strong AUTH_SECRET generated
- [ ] HTTPS enforced
- [ ] Session timeout enabled
- [ ] No session fixation

### Authorization
- [ ] Admin pages protected
- [ ] Role-based access working
- [ ] Non-admins redirected properly

### Data Protection
- [ ] `.env.local` not committed to git
- [ ] Sensitive data not in code
- [ ] Database backups configured

---

## Performance

### Build Optimization
- [ ] Static pages optimized
- [ ] Images optimized
- [ ] CSS/JS minified
- [ ] Bundle size acceptable

### Server Performance
- [ ] Response time < 2 seconds
- [ ] No memory leaks
- [ ] Database queries optimized

---

## Backup & Recovery

### Database
- [ ] Manual backup tested
- [ ] Backup location secure
- [ ] Recovery procedure documented

### Code
- [ ] Git repository up to date
- [ ] Deployment history in Hostinger

---

## Monitoring Setup

### Logging
- [ ] Error logs accessible
- [ ] Access logs configured
- [ ] Log retention policy

### Alerts
- [ ] Uptime monitoring set up
- [ ] Error alert configured
- [ ] Contact information updated

---

## Documentation

### For Users
- [ ] User guide created
- [ ] Login instructions provided
- [ ] Support contact info

### For Admins
- [ ] Admin documentation complete
- [ ] User management guide
- [ ] Troubleshooting steps

---

## Sign-Off

### Testing Completed By:
**Name**: ___________________
**Date**: ___________________

### Issues Found:
_________________________________
_________________________________

### Approved for Production:
- [ ] Yes - Ready for production
- [ ] No - Pending fixes above

---

## Quick Start Test Account

```
Email: admin@example.com
Password: admin123
Role: super_admin
```

```
Email: user@example.com  
Password: user123
Role: member
```

> ⚠️ **Change these passwords immediately after deployment!**