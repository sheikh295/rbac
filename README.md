# 🔐 RBAC System

A powerful, plug-and-play **Role-Based Access Control (RBAC)** package for Node.js applications with Express middleware, MongoDB integration, and a beautiful admin dashboard.

[![npm version](https://badge.fury.io/js/%40your-org%2Frbac-system.svg)](https://badge.fury.io/js/%40your-org%2Frbac-system)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)

## ✨ Features

- 🚀 **Plug & Play** - Integrate with existing Express apps in minutes
- 🔒 **Intelligent Middleware** - Auto-infer permissions from routes and HTTP methods
- 🎨 **Admin Dashboard** - Beautiful web UI for managing roles and permissions
- 🔧 **Flexible Configuration** - Custom auth adapters and hooks
- 📊 **MongoDB Integration** - Efficient data storage with Mongoose
- 🎯 **TypeScript Support** - Full type safety and IntelliSense
- 🔌 **Decoupled Design** - Works with any authentication system

## 🚀 Quick Start

### Installation

```bash
npm install @sheikh295/rbac
```

### Basic Setup

```javascript
const express = require('express');
const mongoose = require('mongoose');
const { RBAC } = require('@sheikh295/rbac');

const app = express();
app.use(express.json());

// Initialize RBAC (automatically creates standard permissions)
await RBAC.init({
  db: mongoose.connection,
  authAdapter: async (req) => ({
    user_id: req.user?.id, // Your auth system provides this
    email: req.user?.email
  }),
  defaultRole: 'user' // Auto-assign 'user' role to new signups
});

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/myapp');

// Protect routes with auto-inferred permissions
app.get('/billing/invoices', RBAC.checkPermissions(), (req, res) => {
  // Requires: feature: "billing", permission: "read"
  res.json({ invoices: [] });
});

app.post('/billing/create', RBAC.checkPermissions(), (req, res) => {
  // Requires: feature: "billing", permission: "create" 
  res.json({ message: 'Invoice created' });
});

// Mount admin dashboard
app.use('/admin', RBAC.adminDashboard({
  user: 'admin',
  pass: 'secure-password'
}));

app.listen(3000);
```

## 📖 Core Concepts

### 🏗️ Architecture

```
User → Role → Features → Permissions
```

- **Users**: References to your app's users (by user_id) - stored in `RbacUsers` collection
- **Roles**: Collections of features with specific permissions - stored in `RbacRoles` collection
- **Features**: Application modules (billing, users, reports) - stored in `RbacFeatures` collection  
- **Permissions**: Granular access rights (read, create, update, delete, sudo) - stored in `RbacPermissions` collection

> **Note**: All collections use `Rbac*` prefixes to avoid conflicts with your existing database tables.

### 🚀 **Auto-Created Permissions**

When you initialize RBAC, these 5 standard permissions are automatically created if they don't exist:

- **`read`** - View and access resources
- **`create`** - Add new resources  
- **`update`** - Modify existing resources
- **`delete`** - Remove resources
- **`sudo`** - Full administrative access

### 🎯 **Auto-Role Assignment**

Configure automatic role assignment for new users:

```javascript
await RBAC.init({
  db: mongoose.connection,
  defaultRole: 'user' // Assign 'user' role to all new signups
});
```

**Behavior:**
- ✅ If role exists → New users automatically get this role
- ✅ If role doesn't exist → Users created without role (no error)
- ✅ Works for both middleware and manual registration

### 🔍 Auto-Permission Inference

The middleware automatically infers permissions from your routes:

| Route | Method | Inferred Feature | Inferred Permission |
|-------|---------|------------------|-------------------|
| `GET /billing/invoices` | GET | billing | read |
| `POST /billing/create` | POST | billing | create |
| `PUT /billing/update/:id` | PUT | billing | update |
| `DELETE /billing/:id` | DELETE | billing | delete |
| `POST /billing/sudo/reset` | POST | billing | sudo |

## 🔧 API Reference

### Initialization

```typescript
await RBAC.init({
  db: mongoose.connection,
  authAdapter?: (req) => ({ user_id: string, email?: string }),
  onUserRegister?: (user) => void,
  onRoleUpdate?: (payload) => void,
  defaultRole?: string // Optional: Auto-assign this role to new users
});
```

> **Note**: `init()` is now async and automatically creates the 5 standard permissions (read, create, update, delete, sudo) if they don't exist.

### Middleware

#### checkPermissions()

```typescript
// Auto-infer from route
app.get('/users', RBAC.checkPermissions(), handler);

// Explicit permissions
app.post('/admin/reset', RBAC.checkPermissions({
  feature: 'admin',
  permission: 'sudo'
}), handler);
```

#### registerUser()

```typescript
// Auto-extract from request body
app.post('/signup', RBAC.registerUser(), handler);

// Custom extraction
app.post('/signup', RBAC.registerUser({
  userExtractor: (req) => ({
    user_id: req.body.id,
    name: req.body.fullName,
    email: req.body.email
  })
}), handler);
```

### Manual Operations

```typescript
// User management
await RBAC.registerUserManual('user123', { name: 'John', email: 'john@example.com' });
await RBAC.updateUser('user123', { name: 'John Doe' });
await RBAC.assignRole('user123', 'admin');

// Query user permissions
const role = await RBAC.getUserRole('user123');
const permissions = await RBAC.getFeaturePermissions('user123', 'billing');
```

## 🎨 Admin Dashboard

Mount the admin dashboard to visually manage your RBAC system:

```typescript
app.use('/rbac-admin', RBAC.adminDashboard({
  user: 'admin',
  pass: 'your-secure-password',
  theme: 'default' // optional
}));
```

### Dashboard Features

- 👥 **User Management** - View users, assign roles, track permissions
- 🎭 **Role Editor** - Create roles with drag-and-drop feature assignment
- ⚙️ **Feature Management** - Define application features
- 🔐 **Permission Control** - Granular permission management
- 📊 **Analytics** - Usage statistics and insights

![Dashboard Preview](https://via.placeholder.com/800x400?text=RBAC+Admin+Dashboard)

## 🔌 Integration Examples

### With JWT Authentication

```typescript
const jwt = require('jsonwebtoken');

await RBAC.init({
  db: mongoose.connection,
  authAdapter: async (req) => {
    const token = req.headers.authorization?.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return {
      user_id: decoded.id,
      email: decoded.email
    };
  }
});
```

### With Passport.js

```typescript
await RBAC.init({
  db: mongoose.connection,
  authAdapter: async (req) => ({
    user_id: req.user.id,
    email: req.user.email
  }),
  onUserRegister: (user) => {
    console.log('New user registered:', user);
    // Send welcome email, analytics, etc.
  }
});
```

### Advanced Role Management

```typescript
// Create a complex role
const adminRole = {
  name: 'admin',
  description: 'Full system administrator',
  features: [
    {
      feature: 'users',
      permissions: ['read', 'create', 'update', 'delete']
    },
    {
      feature: 'billing', 
      permissions: ['read', 'create', 'update', 'sudo']
    },
    {
      feature: 'reports',
      permissions: ['read', 'create', 'sudo']
    }
  ]
};

await RBAC.controllers.userRole.createRole(
  adminRole.name,
  adminRole.description, 
  adminRole.features
);
```

## 🔒 Security Best Practices

1. **Environment Variables**: Store admin credentials securely
2. **HTTPS Only**: Always use HTTPS in production
3. **Regular Audits**: Review roles and permissions regularly
4. **Principle of Least Privilege**: Grant minimal necessary permissions
5. **Session Management**: Implement proper session handling
6. **Database Isolation**: RBAC uses separate `Rbac*` collections to avoid conflicts with your data

## 🧪 Testing

```typescript
// Test permission checking
const mockReq = {
  method: 'GET',
  path: '/billing/invoices',
  user_id: 'test-user'
};

const hasPermission = await RBAC.checkUserPermission(
  mockReq.user_id,
  'billing',
  'read'
);
```

## 📝 TypeScript Support

Full TypeScript definitions included:

```typescript
import { RBAC, RBACConfig, PermissionCheckOptions } from '@sheikh295/rbac';

const config: RBACConfig = {
  db: mongoose.connection,
  authAdapter: async (req): Promise<{ user_id: string }> => ({
    user_id: req.user.id
  })
};

await RBAC.init(config);
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- 📖 [Documentation](https://your-org.github.io/rbac-system)
- 🐛 [Issue Tracker](https://github.com/sheikh295/rbac/issues)
- 💬 [Discussions](https://github.com/sheikh295/rbac/discussions)

## 🎯 Roadmap

- [ ] **Multi-Framework Support** - NestJS
- [ ] **Multi-Database Support** - PostgreSQL, MySQL adapters
- [ ] **Audit Logging** - Track all permission changes

---

**Made with ❤️ for the Node.js community**

*Secure your applications with enterprise-grade role-based access control.*