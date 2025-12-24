# Bar Tracker - Sales & Expense Management System

A modern, secure Progressive Web App (PWA) for tracking daily, weekly, monthly, and annual sales and expenses for your bar.

## Features

### Core Functionality
- **Sales Tracking**: Record and monitor all sales transactions
- **Expense Management**: Track business expenses by category
- **Financial Reports**: Comprehensive daily, weekly, monthly, and annual reports
- **Dashboard Analytics**: Real-time insights with interactive charts
- **Role-Based Access**: Admin, Manager, and Staff roles with different permissions

### Security
- **Individual User Accounts**: No shared passwords
- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcrypt encryption for passwords
- **Rate Limiting**: Protection against brute force attacks
- **Activity Logging**: Track all user actions
- **Input Validation**: Server-side validation for all inputs
- **SQL Injection Protection**: Parameterized queries
- **HTTPS Support**: SSL/TLS encryption ready

### Technical Features
- **Progressive Web App (PWA)**: Install on iPhone/iPad like a native app
- **Offline Support**: View data without internet connection
- **Responsive Design**: Works on all devices
- **Real-time Updates**: Instant data synchronization
- **Data Export**: Export reports to various formats
- **Modern UI**: Clean, intuitive interface

## Tech Stack

### Backend
- Node.js + Express
- PostgreSQL database
- JWT authentication
- bcrypt password hashing
- Helmet security middleware
- Express rate limiting
- Input validation

### Frontend
- React 18
- Vite build tool
- React Router for navigation
- Recharts for data visualization
- Axios for API calls
- PWA support with service workers

## Project Structure

```
bar-tracker/
├── backend/
│   ├── config/          # Database & JWT configuration
│   ├── controllers/     # Route controllers
│   ├── middleware/      # Authentication & validation
│   ├── models/          # Database models
│   ├── routes/          # API routes
│   ├── utils/           # Utility functions
│   ├── server.js        # Main server file
│   └── package.json
├── frontend/
│   ├── public/          # Static assets
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── pages/       # Page components
│   │   ├── services/    # API services
│   │   ├── styles/      # CSS styles
│   │   └── utils/       # Helper functions
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
├── database/
│   ├── schema.sql       # Database schema
│   └── seed.sql         # Seed data
├── docs/
│   ├── DEPLOYMENT.md    # Deployment guide
│   └── USER_GUIDE.md    # User manual
├── .env.example         # Environment variables template
└── README.md
```

## Quick Start

### Local Development

#### Prerequisites
- Node.js 18+ and npm
- PostgreSQL 14+

#### Backend Setup

```bash
cd backend
npm install
cp ../.env.example .env
# Edit .env with your database credentials
npm run dev
```

#### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Visit `http://localhost:5173` to see the app.

### Database Setup

```bash
# Create database
createdb bar_tracker

# Run schema
psql -d bar_tracker -f database/schema.sql

# Create admin user (see DEPLOYMENT.md for details)
```

## Deployment

See [DEPLOYMENT.md](docs/DEPLOYMENT.md) for complete VPS deployment instructions.

## User Guide

See [USER_GUIDE.md](docs/USER_GUIDE.md) for detailed usage instructions.

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - Register new user (admin only)
- `GET /api/auth/profile` - Get user profile
- `POST /api/auth/change-password` - Change password

### Sales
- `GET /api/sales` - Get all sales (with filters)
- `POST /api/sales` - Create new sale
- `GET /api/sales/:id` - Get sale by ID
- `PUT /api/sales/:id` - Update sale (manager/admin)
- `DELETE /api/sales/:id` - Delete sale (admin)
- `GET /api/sales/summary` - Get sales summary

### Expenses
- `GET /api/expenses` - Get all expenses (with filters)
- `POST /api/expenses` - Create new expense (manager/admin)
- `GET /api/expenses/:id` - Get expense by ID
- `PUT /api/expenses/:id` - Update expense (manager/admin)
- `DELETE /api/expenses/:id` - Delete expense (admin)
- `GET /api/expenses/summary` - Get expenses summary

### Reports
- `GET /api/reports/dashboard` - Get dashboard data
- `GET /api/reports/financial` - Get financial report (manager/admin)
- `GET /api/reports/activity-logs` - Get activity logs (admin)

## User Roles

| Feature | Staff | Manager | Admin |
|---------|-------|---------|-------|
| View Dashboard | ✓ | ✓ | ✓ |
| Add Sales | ✓ | ✓ | ✓ |
| Add Expenses | ✗ | ✓ | ✓ |
| Edit Entries | ✗ | ✓ | ✓ |
| Delete Entries | ✗ | ✗ | ✓ |
| View Reports | ✗ | ✓ | ✓ |
| Manage Users | ✗ | ✗ | ✓ |
| View Activity Logs | ✗ | ✓ | ✓ |

## Environment Variables

```env
# Server
NODE_ENV=production
PORT=3000
FRONTEND_URL=http://your-domain.com

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=bar_tracker
DB_USER=your_db_user
DB_PASSWORD=your_db_password

# JWT
JWT_SECRET=your-super-secret-key
```

## Security Features

1. **Authentication**: JWT-based with secure token storage
2. **Authorization**: Role-based access control (RBAC)
3. **Password Security**: bcrypt hashing with salt
4. **Rate Limiting**: Prevent brute force attacks
5. **Input Validation**: Server-side validation for all inputs
6. **SQL Injection Protection**: Parameterized queries
7. **XSS Protection**: Input sanitization
8. **HTTPS**: SSL/TLS encryption support
9. **Activity Logging**: Audit trail for all actions
10. **Session Management**: Automatic token expiration

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- iOS Safari 14+
- Android Chrome 90+

## License

MIT

## Support

For technical issues, see:
- [Deployment Guide](docs/DEPLOYMENT.md)
- [User Guide](docs/USER_GUIDE.md)

---

**Version:** 1.0.0
**Built with:** Node.js, React, PostgreSQL
**Deployment:** Ubuntu 24.04 VPS
