const express = require('express');
const mongoose = require('mongoose');
const { RBAC } = require('@sheikh295/rbac');

const app = express();
app.use(express.json());

// Connect to MongoDB
mongoose
  .connect('mongodb://localhost:27017/rbac-demo')
  .then((result) => {
    RBAC.init({
      db: result.connection, // or real MongoDB
      authAdapter: async (req) => {
        // Extract user identity from JWT or session
        // This would typically decode a JWT token
        return {
          user_id: req.headers['user-id'], // Your auth system provides this
          email: req.headers['user-email']
        };
      },
      onUserRegister: (user) => {
        console.log('User registered in RBAC:', user);
      },
      onRoleUpdate: (payload) => {
        console.log('Role updated:', payload);
      }
    }).then(() => {
      app.listen(3000, '0.0.0.0', () => {
        console.info(`connected to db and app listening on port ${3000}`);
      });
    });
  })
  .catch((err) => {
    console.error('Error connecting to MongoDB:', err);
  });

// Register new users (captures them in RBAC system)
app.post('/signup', RBAC.registerUser(), (req, res) => {
  // OR
  RBAC.registerUserManual('test-user', { name: 'Test user', email: 'testing@email.com' })
  res.json({ message: 'User registered successfully' });
});

// Protected routes with automatic permission inference
app.get('/billing/invoices', RBAC.checkPermissions(), (req, res) => {
  // Requires: feature: "billing", permission: "read"
  res.json({ invoices: [] });
});

app.post('/billing/create/invoice', RBAC.checkPermissions(), (req, res) => {
  // Requires: feature: "billing", permission: "create"
  res.json({ message: 'Invoice created' });
});

// Explicit permission specification
app.post('/users/delete', RBAC.checkPermissions({
  feature: 'users',
  permission: 'delete'
}), (req, res) => {
  res.json({ message: 'User deleted' });
});

// Admin dashboard (optional)
app.use('/rbac-admin', RBAC.adminDashboard({
  user: 'admin',
  pass: 'secure-password'
}));

// Manual RBAC operations
app.post('/admin/assign-role', async (req, res) => {
  try {
    await RBAC.assignRole(req.body.user_id, req.body.role_name);
    res.json({ message: 'Role assigned successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get('/user/permissions/:feature', async (req, res) => {
  try {
    const permissions = await RBAC.getFeaturePermissions(
      req.headers['user-id'],
      req.params.feature
    );
    res.json({ permissions });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.listen(3000, () => {
  console.log('Server running on port 3000');
  console.log('Admin dashboard: http://localhost:3000/rbac-admin');
});