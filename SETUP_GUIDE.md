# Hotel Luxury System - Complete Setup Guide

This guide will walk you through setting up the Hotel Luxury Management System from scratch.

## 📋 Prerequisites

Before starting, ensure you have the following installed:

### Required Software
- **Node.js 18+** - [Download here](https://nodejs.org/)
- **XAMPP** - [Download here](https://www.apachefriends.org/)
- **Git** - [Download here](https://git-scm.com/)

### Verify Installations
```bash
# Check Node.js version
node --version  # Should be 18.0.0 or higher

# Check npm version
npm --version

# Check Git version
git --version
```

## 🚀 Step-by-Step Setup

### Step 1: Clone the Repository

```bash
# Clone the repository
git clone <your-repository-url>
cd hotel-luxury-system

# Verify the project structure
ls -la
```

### Step 2: Install Dependencies

```bash
# Install all dependencies
npm install

# Or if you prefer pnpm
npm install -g pnpm
pnpm install
```

### Step 3: Start XAMPP

1. **Launch XAMPP Control Panel**
   - Open XAMPP Control Panel
   - Click "Start" for Apache
   - Click "Start" for MySQL
   - Both should show green status

2. **Verify MySQL is Running**
   - Open browser and go to `http://localhost/phpmyadmin`
   - You should see the phpMyAdmin interface

### Step 4: Create Database

1. **Open phpMyAdmin**
   - Go to `http://localhost/phpmyadmin`

2. **Create New Database**
   - Click "New" in the left sidebar
   - Enter database name: `hotel_luxury`
   - Click "Create"

3. **Import Database Schema**
   - Select the `hotel_luxury` database
   - Click "Import" tab
   - Click "Choose File" and select `db/001_create_tables.sql`
   - Click "Go" to import

4. **Import Seed Data**
   - Stay in the same database
   - Click "Import" tab again
   - Click "Choose File" and select `db/002_seed_data.sql`
   - Click "Go" to import

### Step 5: Configure Environment Variables

1. **Create Environment File**
   ```bash
   # Create .env.local file
   touch .env.local
   ```

2. **Add Configuration**
   ```env
   # Database Configuration
   DATABASE_URL=mysql://root:@localhost:3306/hotel_luxury

   # JWT Secret (generate a secure random string)
   JWT_SECRET=your-super-secret-jwt-key-here-change-this-in-production

   # Cron Job Secret (for automated tasks)
   CRON_SECRET_TOKEN=your-cron-secret-token-here-change-this-in-production

   # Next.js Configuration
   NEXTAUTH_URL=http://localhost:3000
   NEXTAUTH_SECRET=your-nextauth-secret-here-change-this-in-production
   ```

3. **Generate Secure Secrets**
   ```bash
   # Generate JWT secret
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

   # Generate cron secret
   node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"
   ```

### Step 6: Start Development Server

```bash
# Start the development server
npm run dev

# Or with pnpm
pnpm dev
```

The application should now be running at `http://localhost:3000`

## ✅ Verification Steps

### 1. Check Database Connection
- Open `http://localhost:3000`
- You should see the hotel homepage
- No database errors in the console

### 2. Test User Login
Try logging in with these test accounts:

**Customer Account:**
- Email: `customer@hotel.com`
- Password: `password`

**Clerk Account:**
- Email: `clerk@hotel.com`
- Password: `password`

**Manager Account:**
- Email: `manager@hotel.com`
- Password: `password`

### 3. Verify Dashboard Access
- **Customer**: Should see reservation management
- **Clerk**: Should see check-in/check-out options
- **Manager**: Should see reports and analytics

## 🔧 Troubleshooting

### Common Issues

#### 1. Database Connection Error
```
Error: DATABASE_URL is missing or invalid
```

**Solution:**
- Verify XAMPP MySQL is running
- Check DATABASE_URL in `.env.local`
- Ensure database `hotel_luxury` exists

#### 2. Port Already in Use
```
Error: listen EADDRINUSE: address already in use :::3000
```

**Solution:**
```bash
# Kill process on port 3000
npx kill-port 3000

# Or use a different port
npm run dev -- -p 3001
```

#### 3. Module Not Found Errors
```
Error: Cannot find module 'next/server'
```

**Solution:**
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

#### 4. MySQL Connection Refused
```
Error: connect ECONNREFUSED 127.0.0.1:3306
```

**Solution:**
- Check XAMPP MySQL is running
- Verify MySQL port in XAMPP Control Panel
- Restart XAMPP services

### Database Issues

#### Reset Database
```bash
# Drop and recreate database
mysql -u root -p -e "DROP DATABASE IF EXISTS hotel_luxury; CREATE DATABASE hotel_luxury;"

# Reimport schema and data
# Follow Step 4 above
```

#### Check Database Tables
```sql
-- Run in phpMyAdmin SQL tab
SHOW TABLES;
SELECT COUNT(*) FROM users;
SELECT COUNT(*) FROM reservations;
```

## 🧪 Testing the System

### 1. Customer Flow Test
1. Login as customer
2. Create a new reservation
3. Add credit card information
4. Verify reservation appears in pending list

### 2. Clerk Flow Test
1. Login as clerk
2. View pending reservations
3. Check in a guest
4. Assign a room
5. Add service charges
6. Check out guest

### 3. Manager Flow Test
1. Login as manager
2. View daily reports
3. Check occupancy statistics
4. Review financial reports

### 4. Travel Company Flow Test
1. Login as travel company
2. Create bulk reservation (3+ rooms)
3. Verify company billing

## 🤖 Setting Up Automated Tasks

### 1. Manual Cron Job Test
```bash
# Test the cron endpoint manually
curl -X POST http://localhost:3000/api/cron/daily-tasks \
  -H "Authorization: Bearer your-cron-secret-token-here"
```

### 2. System Cron Job (Linux/Mac)
```bash
# Edit crontab
crontab -e

# Add this line for 7 PM daily
0 19 * * * curl -X POST http://localhost:3000/api/cron/daily-tasks \
  -H "Authorization: Bearer your-cron-secret-token-here"
```

### 3. Windows Task Scheduler
1. Open Task Scheduler
2. Create Basic Task
3. Set trigger to daily at 7 PM
4. Set action to run program: `curl`
5. Add arguments: `-X POST http://localhost:3000/api/cron/daily-tasks -H "Authorization: Bearer your-cron-secret-token-here"`

## 📊 Database Verification

### Check All Tables Exist
```sql
SHOW TABLES;
```

Expected tables:
- users
- reservations
- rooms
- room_types
- payments
- service_charges
- billing_records
- daily_reports
- loyalty_programs
- travel_companies
- room_assignments

### Verify Seed Data
```sql
-- Check users
SELECT role, COUNT(*) FROM users GROUP BY role;

-- Check reservations
SELECT status, COUNT(*) FROM reservations GROUP BY status;

-- Check rooms
SELECT status, COUNT(*) FROM rooms GROUP BY status;
```

## 🚀 Production Deployment

### 1. Build for Production
```bash
npm run build
```

### 2. Environment Variables for Production
```env
DATABASE_URL=mysql://user:password@host:3306/hotel_luxury
JWT_SECRET=production-jwt-secret-32-chars
CRON_SECRET_TOKEN=production-cron-token-16-chars
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=production-nextauth-secret
```

### 3. Start Production Server
```bash
npm start
```

## 📞 Support

If you encounter issues:

1. **Check the logs**: Look at browser console and server logs
2. **Verify database**: Ensure all tables exist and have data
3. **Test endpoints**: Use browser dev tools to test API calls
4. **Check environment**: Verify all environment variables are set

### Common Support Commands
```bash
# Check Node.js version
node --version

# Check npm version
npm --version

# List installed packages
npm list --depth=0

# Check for TypeScript errors
npx tsc --noEmit

# Run linting
npm run lint
```

---

**🎉 Congratulations! Your Hotel Luxury Management System is now running.**

You can now:
- Create and manage reservations
- Process check-ins and check-outs
- Generate reports and analytics
- Handle automated tasks

For more information, see the main README.md file. 