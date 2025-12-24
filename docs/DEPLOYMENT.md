# Bar Tracker - VPS Deployment Guide

This guide will help you deploy the Bar Tracker application to your Hostinger VPS running Ubuntu 24.04.

## Prerequisites

- Hostinger VPS with Ubuntu 24.04
- SSH access to your VPS
- Root or sudo privileges
- Domain name (optional, can use IP address)

## Step 1: Connect to Your VPS

```bash
ssh your-username@your-vps-ip-address
```

## Step 2: Update System

```bash
sudo apt update
sudo apt upgrade -y
```

## Step 3: Install Required Software

### Install Node.js 20.x

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
node --version  # Should show v20.x.x
npm --version
```

### Install PostgreSQL

```bash
sudo apt install -y postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### Install Nginx

```bash
sudo apt install -y nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

### Install Git (if not already installed)

```bash
sudo apt install -y git
```

## Step 4: Set Up PostgreSQL Database

```bash
# Switch to postgres user
sudo -u postgres psql

# In PostgreSQL console, run these commands:
CREATE DATABASE bar_tracker;
CREATE USER baruser WITH ENCRYPTED PASSWORD 'your-secure-password';
GRANT ALL PRIVILEGES ON DATABASE bar_tracker TO baruser;
\q
```

## Step 5: Transfer and Set Up Application

### Option A: Transfer from Local Machine

```bash
# On your local machine (from the bar-tracker directory):
scp -r * your-username@your-vps-ip:/home/your-username/bar-tracker/
```

### Option B: Use Git (if you have a repository)

```bash
# On VPS:
cd /var/www
sudo mkdir bar-tracker
sudo chown your-username:your-username bar-tracker
cd bar-tracker
git clone your-repo-url .
```

## Step 6: Set Up Backend

```bash
cd /path/to/bar-tracker/backend

# Install dependencies
npm install

# Create .env file
cp ../.env.example .env
nano .env
```

Edit the .env file with your settings:

```env
NODE_ENV=production
PORT=3000
FRONTEND_URL=http://your-vps-ip

DB_HOST=localhost
DB_PORT=5432
DB_NAME=bar_tracker
DB_USER=baruser
DB_PASSWORD=your-secure-password

JWT_SECRET=generate-a-long-random-secret-key-here
```

Generate a secure JWT secret:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Initialize Database

```bash
# Run the schema
PGPASSWORD=your-secure-password psql -U baruser -d bar_tracker -h localhost -f ../database/schema.sql
```

### Create Admin User

```bash
# Connect to database
PGPASSWORD=your-secure-password psql -U baruser -d bar_tracker -h localhost

# Generate password hash (use Node.js)
node -e "const bcrypt = require('bcryptjs'); bcrypt.hash('YourAdminPassword123!', 10, (err, hash) => console.log(hash));"

# Copy the hash and insert user in PostgreSQL:
INSERT INTO users (username, email, password_hash, full_name, role)
VALUES ('admin', 'admin@yourbar.com', 'paste-hash-here', 'Administrator', 'admin');
\q
```

### Test Backend

```bash
npm start
# Should see: "Bar Tracker API Server running on port 3000"
# Press Ctrl+C to stop
```

## Step 7: Set Up Frontend

```bash
cd /path/to/bar-tracker/frontend

# Install dependencies
npm install

# Create production .env
echo "VITE_API_URL=http://your-vps-ip/api" > .env.production

# Build for production
npm run build
# This creates a 'dist' folder
```

## Step 8: Set Up PM2 (Process Manager)

```bash
# Install PM2 globally
sudo npm install -g pm2

# Start backend with PM2
cd /path/to/bar-tracker/backend
pm2 start server.js --name bar-tracker-api

# Save PM2 configuration
pm2 save

# Set PM2 to start on boot
pm2 startup
# Follow the command it outputs
```

## Step 9: Configure Nginx

```bash
sudo nano /etc/nginx/sites-available/bar-tracker
```

Add this configuration:

```nginx
server {
    listen 80;
    server_name your-vps-ip;  # or your-domain.com

    # Frontend
    location / {
        root /path/to/bar-tracker/frontend/dist;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api {
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
sudo ln -s /etc/nginx/sites-available/bar-tracker /etc/nginx/sites-enabled/
sudo nginx -t  # Test configuration
sudo systemctl reload nginx
```

## Step 10: Set Up Firewall

```bash
# Install UFW if not installed
sudo apt install -y ufw

# Allow SSH (IMPORTANT - do this first!)
sudo ufw allow OpenSSH

# Allow HTTP and HTTPS
sudo ufw allow 'Nginx Full'

# Enable firewall
sudo ufw enable
sudo ufw status
```

## Step 11: (Optional) Set Up SSL with Let's Encrypt

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Get SSL certificate (requires domain name)
sudo certbot --nginx -d your-domain.com

# Auto-renewal is configured automatically
```

## Step 12: Test Your Application

Open your browser and go to:
- `http://your-vps-ip` (or your domain)
- Login with admin credentials you created

## Maintenance Commands

```bash
# View backend logs
pm2 logs bar-tracker-api

# Restart backend
pm2 restart bar-tracker-api

# Stop backend
pm2 stop bar-tracker-api

# Restart Nginx
sudo systemctl restart nginx

# View Nginx logs
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log

# Database backup
pg_dump -U baruser -h localhost bar_tracker > backup_$(date +%Y%m%d).sql

# Database restore
psql -U baruser -h localhost bar_tracker < backup_file.sql
```

## Security Best Practices

1. **Change default admin password** immediately after first login
2. **Keep system updated**: `sudo apt update && sudo apt upgrade`
3. **Use strong passwords** for database and user accounts
4. **Enable fail2ban** to prevent brute force attacks:
   ```bash
   sudo apt install fail2ban
   sudo systemctl enable fail2ban
   sudo systemctl start fail2ban
   ```
5. **Regular backups** of database
6. **Monitor logs** regularly for suspicious activity
7. **Use SSL/HTTPS** in production (with domain name)

## Troubleshooting

### Backend won't start
- Check logs: `pm2 logs bar-tracker-api`
- Check database connection: Test with `psql -U baruser -d bar_tracker -h localhost`
- Verify .env file settings

### Frontend shows blank page
- Check if build succeeded: `ls /path/to/bar-tracker/frontend/dist`
- Check Nginx error logs: `sudo tail -f /var/log/nginx/error.log`
- Verify Nginx configuration: `sudo nginx -t`

### Can't connect to database
- Check PostgreSQL is running: `sudo systemctl status postgresql`
- Verify database credentials in .env file
- Check PostgreSQL logs: `sudo tail -f /var/log/postgresql/postgresql-*.log`

### API requests failing
- Check PM2 process: `pm2 status`
- Verify Nginx proxy configuration
- Check firewall: `sudo ufw status`

## Support

For issues, check:
- Application logs: `pm2 logs`
- Nginx logs: `/var/log/nginx/`
- PostgreSQL logs: `/var/log/postgresql/`
