const express = require('express');
const { Pool } = require('pg');
const { RBAC } = require('@mamoorali295/rbac');

const app = express();
app.use(express.json());

// PostgreSQL connection setup
const pgPool = new Pool({
  user: 'your_username',
  host: 'localhost',
  database: 'your_database',
  password: 'your_password',
  port: 5432,
});

// Initialize RBAC with PostgreSQL
async function initRBAC() {
  try {
    await RBAC.init({
      database: {
        type: 'postgresql',
        connection: pgPool
      },
      authAdapter: async (req) => ({
        user_id: req.headers['user-id'] || 'user123',
        email: 'user@example.com'
      }),
      defaultRole: 'user'
    });

    console.log('✅ RBAC initialized with PostgreSQL');
  } catch (error) {
    console.error('❌ Failed to initialize RBAC:', error.message);
  }
}

// Sample routes with RBAC protection
app.get('/api/billing/invoices', RBAC.checkPermissions(), (req, res) => {
  res.json({ invoices: ['invoice1', 'invoice2'] });
});

app.post('/api/billing/create', RBAC.checkPermissions(), (req, res) => {
  res.json({ message: 'Invoice created' });
});

app.post('/api/admin/reset', RBAC.checkPermissions({
  feature: 'admin',
  permission: 'sudo'
}), (req, res) => {
  res.json({ message: 'System reset performed' });
});

// User registration route
app.post('/api/register', RBAC.registerUser(), (req, res) => {
  res.json({ message: 'User registered successfully' });
});

// Admin dashboard (session-based authentication)
app.use('/rbac-admin', RBAC.adminDashboard({
  user: 'admin',
  pass: 'secure-password',
  sessionSecret: 'your-secret-key',
  sessionName: 'rbac.admin.sid'
}));

// Manual user management examples
app.post('/api/setup', async (req, res) => {
  try {
    // Register sample users manually
    await RBAC.registerUserManual('john123', {
      name: 'John Doe',
      email: 'john@example.com'
    });

    await RBAC.registerUserManual('admin123', {
      name: 'Admin User',
      email: 'admin@example.com'
    });

    // PostgreSQL setup complete
    // Use the admin dashboard at /rbac-admin to:
    // 1. Create roles (manager, admin, etc.)
    // 2. Create features (billing, users, reports)
    // 3. Assign permissions to roles
    // 4. Assign roles to users
    
    res.json({ 
      message: 'PostgreSQL setup completed successfully',
      users_created: ['john123', 'admin123'],
      next_steps: 'Visit /rbac-admin to configure roles and permissions'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Error handling
app.use((error, req, res, next) => {
  console.error('Error:', error.message);
  res.status(500).json({ error: 'Internal server error' });
});

// Start the server
async function startServer() {
  await initRBAC();
  
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📊 Admin dashboard: http://localhost:${PORT}/rbac-admin`);
    console.log('📖 API endpoints:');
    console.log('   GET  /api/billing/invoices - Protected route (auto-inferred permissions)');
    console.log('   POST /api/billing/create - Protected route (auto-inferred permissions)');
    console.log('   POST /api/admin/reset - Protected route (explicit permissions)');
    console.log('   POST /api/register - User registration');
    console.log('   POST /api/setup - Initial setup (creates sample data)');
  });
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('🔌 Closing PostgreSQL connection...');
  await pgPool.end();
  process.exit(0);
});

startServer().catch(console.error);