# Quick Start Guide

Follow these steps to get Siara Bar running quickly.

## Prerequisites

- Node.js 18+ installed
- PostgreSQL 14+ installed and running
- Git (optional, for cloning)

## Local Development Setup (5 minutes)

### 1. Database Setup

```bash
# Create database
createdb siara_bar

# Navigate to project
cd siara-bar

# Create database tables
psql -d siara_bar -f database/schema.sql
```

### 2. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Create .env file
cp ../.env.example .env

# Edit .env file - set your database password
# DB_PASSWORD=your_postgres_password

# Create admin user
node utils/createAdmin.js
# Follow prompts to create your admin user

# Start backend server
npm start
```

Backend should now be running on http://localhost:3000

### 3. Frontend Setup (in new terminal)

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

Frontend should now be running on http://localhost:5173

### 4. Access the App

1. Open browser to http://localhost:5173
2. Log in with the admin credentials you created
3. Start adding sales and expenses!

## VPS Deployment

For deploying to your Hostinger VPS, see the complete [DEPLOYMENT.md](docs/DEPLOYMENT.md) guide.

### Transfer to VPS

```bash
# From your local machine, in the siara-bar directory
scp -r * your-username@your-vps-ip:/path/to/destination/
```

Then follow the deployment guide on your VPS.

## Default Environment Variables

The `.env.example` file contains all required variables with sensible defaults for local development. For production, make sure to:

1. Change `JWT_SECRET` to a long random string
2. Set `NODE_ENV=production`
3. Update `FRONTEND_URL` to your actual domain/IP
4. Use strong database passwords

## Troubleshooting

### "Database connection failed"
- Make sure PostgreSQL is running: `pg_isready`
- Check database credentials in `.env`
- Verify database exists: `psql -l`

### "Port already in use"
- Backend (3000): Change `PORT` in `.env`
- Frontend (5173): Change in `vite.config.js`

### "Cannot find module"
- Run `npm install` in both backend and frontend directories

### Admin user creation fails
- Make sure database schema is loaded
- Check PostgreSQL is running
- Verify database connection settings

## Next Steps

1. **Read the User Guide**: See [docs/USER_GUIDE.md](docs/USER_GUIDE.md)
2. **Create staff users**: Log in as admin and create user accounts for your team
3. **Customize categories**: Edit sales/expense categories to match your business
4. **Deploy to production**: Follow [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)

## Getting Help

- Check [README.md](README.md) for project overview
- Read [USER_GUIDE.md](docs/USER_GUIDE.md) for usage instructions
- See [DEPLOYMENT.md](docs/DEPLOYMENT.md) for production deployment
