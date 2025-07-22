# 🔐 RBAC System

A **revolutionary, fully dynamic** Role-Based Access Control (RBAC) package for Node.js applications with intelligent middleware, modern admin dashboard, and zero configuration constraints.

[![npm version](https://badge.fury.io/js/%40sheikh295%2Frbac-system.svg)](https://badge.fury.io/js/%40sheikh295%2Frbac-system)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)

## 🚀 What Makes This RBAC Library Unique?

### **🎯 Truly Dynamic & Flexible**
Unlike other RBAC libraries that force you into predefined roles like "admin", "manager", "user" with hardcoded routes, our system is **completely dynamic**:

- ✅ **Create ANY role names** - `SuperUser`, `ContentEditor`, `BillingManager`, `CustomRole123` - your choice!
- ✅ **No route restrictions** - A `user` role can access admin routes, a `manager` can be restricted from certain features
- ✅ **Feature-based permissions** - Access control is based on **features + permissions**, not role names
- ✅ **Runtime flexibility** - Change permissions without code changes or deployments

### **🧠 Intelligent Permission System**
Our access control doesn't just check "Is user an admin?". Instead, it asks:
1. **Does this user's role have access to this FEATURE?** (e.g., `billing`, `user-management`)  
2. **Does this role have the required PERMISSION for this feature?** (e.g., `read`, `create`, `delete`)

```javascript
// ❌ Traditional RBAC: "Only admins can access /admin routes"
if (user.role === 'admin') { /* allow */ }

// ✅ Our RBAC: "Does user have 'delete' permission for 'user-management' feature?"
app.delete('/users/:id', RBAC.checkPermissions({
  feature: 'user-management',  
  permission: 'delete'
}), handler);

// This means ANY role can be granted this permission!
// Even a "customer-support" role can have delete permissions if you configure it
```

### **🎨 Built-in Modern Admin Dashboard**
While other libraries make you build your own admin interface, we provide a **production-ready, beautiful dashboard**:

- 🖥️ **Modern UI** - Professional gradient design, responsive layout, mobile-friendly
- 🔐 **Session-based auth** - Beautiful login page, secure session management  
- 👥 **User management** - Create, edit, delete users with advanced pagination & search
- 🎭 **Dynamic role creation** - Create roles with any name, assign any features/permissions
- ⚙️ **Feature management** - Define your app's features (billing, reports, settings, etc.)
- 🔐 **Permission assignment** - Granular control over what each role can do
- 📊 **Live statistics** - Real-time dashboard with database counts

### **🔧 Zero Configuration Constraints**
```javascript
// Create roles with ANY names you want
await RBAC.createRole('PowerUser', 'Advanced user with special access');
await RBAC.createRole('BillingTeam', 'Team that handles billing operations');
await RBAC.createRole('ReadOnlyAuditor', 'Can view everything but modify nothing');

// Assign ANY features to ANY roles
await RBAC.assignFeatureToRole('BillingTeam', 'billing', ['read', 'create', 'update']);
await RBAC.assignFeatureToRole('PowerUser', 'user-management', ['read', 'create']);
await RBAC.assignFeatureToRole('ReadOnlyAuditor', 'reports', ['read']);
```

## 📊 Why Choose Us Over Other RBAC Libraries?

| Feature | **Our RBAC** | Traditional Libraries |
|---------|-------------|---------------------|
| **Role Names** | ✅ ANY custom names | ❌ Predefined (admin, user, etc.) |
| **Route Access** | ✅ Feature + Permission based | ❌ Role-name hardcoded |
| **Flexibility** | ✅ Runtime permission changes | ❌ Code-level restrictions |
| **Admin Dashboard** | ✅ Built-in modern UI | ❌ Build your own |
| **User Management** | ✅ Full CRUD with pagination | ❌ Basic or none |
| **Search & Filter** | ✅ Advanced search built-in | ❌ Manual implementation |
| **Permission Logic** | ✅ `role → feature → permission` | ❌ `role → route` mapping |
| **Dynamic Roles** | ✅ Create/modify anytime | ❌ Fixed role structure |

### **Real-World Example: Traditional vs Our Approach**

**❌ Traditional RBAC:**
```javascript
// Fixed roles, route-based access
if (req.user.role === 'admin') {
  // Only admins can access admin routes
}
if (req.user.role === 'manager') {
  // Only managers can access manager routes  
}
// Want customer-support to delete users? Tough luck, change code!
```

**✅ Our Dynamic RBAC:**
```javascript
// Any role can access any route if they have the right feature + permission
app.delete('/users/:id', RBAC.checkPermissions({
  feature: 'user-management',
  permission: 'delete'
}));

// Want to give 'customer-support' delete access? Just update in dashboard!
// No code changes, no deployments - pure configuration!
```

## ✨ Core Features

- 🚀 **Plug & Play** - Integrate with existing Express apps in minutes
- 🧠 **Intelligent Middleware** - Auto-infer permissions from routes or define explicitly  
- 🎨 **Production-Ready Dashboard** - Modern admin UI with search, pagination, and real-time stats
- 🔧 **Completely Dynamic** - No predefined roles, create your own permission structure
- 📊 **MongoDB Integration** - Efficient, scalable data storage with Mongoose
- 🎯 **TypeScript Support** - Full type safety and IntelliSense
- 🔌 **Auth System Agnostic** - Works with JWT, sessions, or any authentication method

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

// Connect to MongoDB
mongoose
  .connect('mongodb://localhost:27017/rbac-demo')
  .then((result) => {
    // Initialize RBAC (automatically creates standard permissions)
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
      },
      defaultRole: 'user' // Auto-assign 'user' role to new signups
    }).then(() => {
      app.listen(3000, '0.0.0.0', () => {
        console.info(`connected to db and app listening on port ${3000}`);
      });
    });
  })
  .catch((err) => {
    console.error('Error connecting to MongoDB:', err);
  });

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

- 📖 [Documentation](https://sheikh295.github.io/rbac-system)
- 🐛 [Issue Tracker](https://github.com/sheikh295/rbac/issues)
- 💬 [Discussions](https://github.com/sheikh295/rbac/discussions)

## 🎯 Roadmap

- [ ] **Multi-Framework Support** - NestJS
- [ ] **Multi-Database Support** - PostgreSQL, MySQL adapters
- [ ] **Audit Logging** - Track all permission changes

---

**Made with ❤️ for the Node.js community**

*Secure your applications with enterprise-grade role-based access control.*