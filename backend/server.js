require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');

// Import routes
const authRoutes = require('./routes/auth');
const salesRoutes = require('./routes/sales');
const expensesRoutes = require('./routes/expenses');
const reportsRoutes = require('./routes/reports');
const ladiesRoutes = require('./routes/ladies');
const employeesRoutes = require('./routes/employees');
const salariesRoutes = require('./routes/salaries');

// Import database config to test connection
const pool = require('./config/database');
const multer = require('multer');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Trust proxy - required when running behind nginx/reverse proxy
app.set('trust proxy', true);

// Security middleware - configure helmet for serving frontend
app.use(
  helmet({
    contentSecurityPolicy: false, // Disable CSP for frontend assets
  })
);

// CORS configuration
const corsOptions = {
  origin: process.env.FRONTEND_URL || '*',
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging middleware
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiting to auth routes
app.use('/api/auth/login', rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // 5 login attempts per 15 minutes
  message: 'Too many login attempts, please try again later.'
}));

app.use('/api/', limiter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/expenses', expensesRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/ladies', ladiesRoutes);
app.use('/api/employees', employeesRoutes);
app.use('/api/salaries', salariesRoutes);

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../frontend/public');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Get file extension from original filename
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `login-background${ext}`);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Upload endpoint
app.post('/api/upload-background', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).send('No file uploaded');
  }

  // Remove old background images with different extensions
  const publicDir = path.join(__dirname, '../frontend/public');
  const distDir = path.join(__dirname, '../frontend/dist');
  const oldExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];

  oldExtensions.forEach(ext => {
    const publicFile = path.join(publicDir, `login-background${ext}`);
    const distFile = path.join(distDir, `login-background${ext}`);
    if (fs.existsSync(publicFile) && publicFile !== req.file.path) {
      fs.unlinkSync(publicFile);
    }
    if (fs.existsSync(distFile)) {
      fs.unlinkSync(distFile);
    }
  });

  // Copy to dist folder
  const destPath = path.join(distDir, req.file.filename);
  fs.copyFileSync(req.file.path, destPath);

  res.send('Image uploaded successfully');
});

// Upload favicon endpoint
app.post('/api/upload-favicon', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).send('No file uploaded');
  }

  const publicDir = path.join(__dirname, '../frontend/public');
  const distDir = path.join(__dirname, '../frontend/dist');

  // Copy uploaded file to create favicon.ico
  const faviconPath = path.join(publicDir, 'favicon.ico');
  const distFaviconPath = path.join(distDir, 'favicon.ico');

  fs.copyFileSync(req.file.path, faviconPath);
  fs.copyFileSync(req.file.path, distFaviconPath);

  // Also create icon-192.png and icon-512.png for PWA
  const icon192Path = path.join(publicDir, 'icon-192.png');
  const icon512Path = path.join(publicDir, 'icon-512.png');
  const distIcon192Path = path.join(distDir, 'icon-192.png');
  const distIcon512Path = path.join(distDir, 'icon-512.png');

  fs.copyFileSync(req.file.path, icon192Path);
  fs.copyFileSync(req.file.path, icon512Path);
  fs.copyFileSync(req.file.path, distIcon192Path);
  fs.copyFileSync(req.file.path, distIcon512Path);

  // Remove the temporary upload file
  fs.unlinkSync(req.file.path);

  res.send('Favicon uploaded successfully');
});

// Configure multer for Excel file uploads
const excelStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    cb(null, `sales_import_${timestamp}${ext}`);
  }
});

const excelUpload = multer({
  storage: excelStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext === '.xlsx' || ext === '.xls') {
      cb(null, true);
    } else {
      cb(new Error('Only Excel files (.xlsx, .xls) are allowed'));
    }
  }
});

// Excel upload and import endpoint
app.post('/api/upload-sales-excel', excelUpload.single('excelFile'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { dryRun } = req.body;

    // Import the utility
    const importSalesFromExcel = require('./utils/importSalesFromExcel');

    // Get user ID from auth token (if available)
    let userId = null;
    if (req.user) {
      userId = req.user.id;
    }

    // Process the Excel file
    const results = await importSalesFromExcel(req.file.path, {
      userId: userId,
      dryRun: dryRun === 'true' || dryRun === true
    });

    // Clean up uploaded file after processing
    if (!dryRun && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.json({
      success: true,
      message: dryRun ? 'Dry run completed' : 'Import completed successfully',
      results: results
    });

  } catch (error) {
    console.error('Excel upload error:', error);

    // Clean up file on error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Serve background image with correct extension
app.get('/login-background', (req, res) => {
  const publicDir = path.join(__dirname, '../frontend/public');
  const distDir = path.join(__dirname, '../frontend/dist');
  const extensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];

  // Check dist folder first (production), then public folder
  for (const dir of [distDir, publicDir]) {
    for (const ext of extensions) {
      const filePath = path.join(dir, `login-background${ext}`);
      if (fs.existsSync(filePath)) {
        return res.sendFile(filePath);
      }
    }
  }

  res.status(404).send('Background image not found');
});

// Serve static files from the React app in production
if (process.env.NODE_ENV === 'production') {
  const frontendPath = path.join(__dirname, '../frontend/dist');
  app.use(express.static(frontendPath));

  // Serve index.html for all non-API routes (SPA fallback)
  app.get('*', (req, res) => {
    res.sendFile(path.join(frontendPath, 'index.html'));
  });
} else {
  // Root endpoint for development
  app.get('/', (req, res) => {
    res.json({
      name: 'Siara Bar API',
      version: '1.0.0',
      description: 'Sales and Expense Tracking System',
      endpoints: {
        health: '/health',
        auth: '/api/auth/*',
        sales: '/api/sales/*',
        expenses: '/api/expenses/*',
        reports: '/api/reports/*'
      }
    });
  });

  // 404 handler for development
  app.use((req, res) => {
    res.status(404).json({
      error: 'Not Found',
      message: `Route ${req.method} ${req.url} not found`,
      availableEndpoints: ['/api/auth', '/api/sales', '/api/expenses', '/api/reports']
    });
  });
}

// Global error handler
app.use((err, req, res, next) => {
  console.error('Global error handler:', err);

  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
});

// Test database connection and start server
async function startServer() {
  try {
    // Test database connection
    await pool.query('SELECT NOW()');
    console.log('✓ Database connection successful');

    // Start server
    app.listen(PORT, () => {
      console.log(`\n🚀 Siara Bar API Server running on port ${PORT}`);
      console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔗 API URL: http://localhost:${PORT}`);
      console.log(`💚 Health Check: http://localhost:${PORT}/health\n`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM signal received: closing HTTP server');
  await pool.end();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('\nSIGINT signal received: closing HTTP server');
  await pool.end();
  process.exit(0);
});

// Start the server
startServer();

module.exports = app;
