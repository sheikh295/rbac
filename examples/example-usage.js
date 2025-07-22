// Example of how to use the RBAC admin dashboard without route conflicts

const express = require('express');
const mongoose = require('mongoose');
const { RBAC } = require('../dist/index');  // After building with npm run build

const app = express();

// Your app routes (no conflicts)
app.get('/', (req, res) => {
  res.json({ message: 'Your main app' });
});

app.get('/api/users', (req, res) => {
  res.json({ message: 'Your API routes' });
});

// Your app might have its own login at /login
app.get('/login', (req, res) => {
  res.json({ message: 'Your app login page' });
});

async function startApp() {
  // Connect to MongoDB
  await mongoose.connect('mongodb://localhost:27017/your-app');
  
  // Initialize RBAC
  await RBAC.init({
    db: mongoose.connection,
    authAdapter: async (req) => ({ 
      user_id: req.user?.id || 'anonymous' 
    }),
    defaultRole: 'user'
  });

  // Mount RBAC admin dashboard at /rbac-admin
  // This creates these routes WITHOUT conflicts:
  // GET  /rbac-admin/login          <- Admin login page
  // POST /rbac-admin/login          <- Admin login handler
  // POST /rbac-admin/logout         <- Admin logout
  // GET  /rbac-admin/               <- Dashboard home
  // GET  /rbac-admin/users          <- User management
  // GET  /rbac-admin/roles          <- Role management
  // etc.
  
  app.use('/rbac-admin', RBAC.adminDashboard({
    user: 'admin',
    pass: 'secure-password-123',
    sessionSecret: 'your-super-secret-key-here',
    sessionName: 'rbac.admin.session'
  }));

  app.listen(3000, () => {
    console.log('🚀 Server running on http://localhost:3000');
    console.log('📊 RBAC Admin: http://localhost:3000/rbac-admin');
    console.log('🔐 Admin Login: http://localhost:3000/rbac-admin/login');
    console.log('');
    console.log('Admin Credentials:');
    console.log('Username: admin');
    console.log('Password: secure-password-123');
  });
}

startApp().catch(console.error);

/* 
ROUTE STRUCTURE (NO CONFLICTS):

Your App Routes:
├── GET  /                  <- Your home page
├── GET  /login             <- Your app login  
├── GET  /api/users         <- Your API
└── ... your other routes

RBAC Admin Routes (completely separate):
├── GET  /rbac-admin/login          <- Admin login page
├── POST /rbac-admin/login          <- Admin authentication
├── POST /rbac-admin/logout         <- Admin logout
├── GET  /rbac-admin/               <- Admin dashboard
├── GET  /rbac-admin/users          <- User management (with pagination & search)
├── GET  /rbac-admin/users/:id      <- User details
├── POST /rbac-admin/users/create   <- Create user
├── GET  /rbac-admin/roles          <- Role management
├── GET  /rbac-admin/features       <- Feature management
└── GET  /rbac-admin/permissions    <- Permission management

LOGIN FLOW:
1. Visit /rbac-admin (any route) -> Redirects to /rbac-admin/login
2. Enter credentials on /rbac-admin/login
3. POST to /rbac-admin/login -> Creates session -> Redirects to /rbac-admin/
4. Session persists for current browser session
5. Logout via POST /rbac-admin/logout -> Destroys session -> Redirects to /rbac-admin/login

SECURITY:
- Sessions are HTTP-only cookies
- Session secret should be environment variable in production
- Sessions expire after 24 hours
- All admin routes protected except /login
- No interference with your app's authentication
*/