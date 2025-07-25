# 🔐 RBAC System

A **revolutionary, fully dynamic** Role-Based Access Control (RBAC) package for Node.js applications with intelligent middleware, modern admin dashboard, and zero configuration constraints.

[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Supported-green.svg)](https://www.mongodb.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Supported-blue.svg)](https://www.postgresql.org/)

## 📦 How do I install this?

```bash
npm install @mamoorali295/rbac
```

**Framework Support:**
- ✅ **Express** - Built-in middleware and admin dashboard
- ✅ **NestJS** - Decorators, guards, modules, and services  
- ✅ **GraphQL** - Directives, resolvers, and schema transformers
- ✅ **Framework-agnostic** - Use with any Node.js framework

## 🤔 Why should I choose this?

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

### **🌐 Multi-Framework Support**
First RBAC library with native support for multiple Node.js frameworks:

- 🚀 **Express** - Traditional middleware with auto-inference and admin dashboard
- 🎯 **NestJS** - Modern decorators, guards, dependency injection, and modules
- 📊 **GraphQL** - Schema directives, resolvers, and Apollo Server integration
- 🎨 **Consistent API** - Same permission logic across all frameworks

### **🗄️ Multi-Database Support**
Works seamlessly with your preferred database through unified adapter pattern:

- 🍃 **MongoDB** - Document-based storage with nested role structures
- 🐘 **PostgreSQL** - Relational database with ACID compliance and foreign key constraints
- 🔄 **Identical API** - Same methods and admin dashboard regardless of database choice
- 📊 **Performance Optimized** - Database-specific query optimizations for each platform
- 🚀 **Easy Migration** - Switch databases without changing application code

### **🔧 Zero Configuration Constraints**
Create roles with **ANY custom names** you want - `PowerUser`, `BillingTeam`, `ReadOnlyAuditor`, or `CustomRole123`. Unlike other libraries that force predefined roles, our system gives you complete freedom to design your permission structure exactly how your business needs it.

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
| **Database Support** | ✅ MongoDB + PostgreSQL | ❌ Usually single DB only |

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

---

## 🚀 How do I use it?

Choose your framework and follow the appropriate setup guide:

### 🎯 Quick Framework Selection

| Framework | Use Case | Setup Time |
|-----------|----------|------------|
| **Express** | Traditional apps, REST APIs | 2 minutes |
| **NestJS** | Enterprise apps, microservices | 3 minutes |
| **GraphQL** | Modern APIs, real-time apps | 4 minutes |

---

## 🌟 NestJS Integration

Perfect for enterprise applications with dependency injection and decorators.

### Step 1: Install Dependencies

```bash
npm install @mamoorali295/rbac @nestjs/common @nestjs/core express-session
npm install --save-dev @types/express-session
```

### Step 2: Configure RBAC Module

```typescript
import { Module } from '@nestjs/common';
import { RbacModule } from '@mamoorali295/rbac/nestjs';
import * as mongoose from 'mongoose';

@Module({
  imports: [
    RbacModule.forRoot({
      database: {
        type: 'mongodb',
        connection: mongoose.connection
      },
      authAdapter: async (req) => ({ user_id: req.user?.id }),
      defaultRole: 'user'
    })
  ]
})
export class AppModule {}
```

### Step 3: Protect Controllers

```typescript
import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { CheckPermissions, PermissionsGuard } from '@mamoorali295/rbac/nestjs';

@Controller('billing')
@UseGuards(PermissionsGuard)
export class BillingController {
  @Get('invoices')
  @CheckPermissions() // Auto-infers: feature="billing", permission="read"
  getInvoices() {
    return { invoices: [] };
  }

  @Post('create')
  @CheckPermissions({ feature: 'billing', permission: 'create' })
  createInvoice(@Body() data: any) {
    return { invoice: data, id: Date.now() };
  }
}
```

### Step 4: NestJS Admin Dashboard

**First, setup session middleware in main.ts:**

```typescript
// main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as session from 'express-session';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Required for admin dashboard
  app.use(
    session({
      secret: 'your-secret-key',
      resave: false,
      saveUninitialized: false,
      cookie: {
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        httpOnly: true,
        secure: false // Set to true in production with HTTPS
      }
    })
  );
  
  await app.listen(3000);
}
bootstrap();
```

**Then, add admin module to your app module:**

```typescript
import { RbacAdminModule } from '@mamoorali295/rbac/nestjs';

@Module({
  imports: [
    RbacModule.forRoot({ 
      global: true, // Required for admin module access
      database: {
        type: 'mongodb',
        connection: mongoose.connection
      },
      authAdapter: async (req) => ({ user_id: req.user?.id }),
      defaultRole: 'user'
    }),
    
    // Add admin dashboard module
    RbacAdminModule.forRoot({
      adminCredentials: {
        username: 'admin',
        password: 'secure-password'
      },
      sessionSecret: 'your-secret-key' // Same as main.ts
    })
  ]
})
export class AppModule {}

// Access admin dashboard at: http://localhost:3000/rbac-admin
```

### Step 5: Use RBAC Service

```typescript
import { Injectable } from '@nestjs/common';
import { RbacService } from '@mamoorali295/rbac/nestjs';

@Injectable()
export class UserService {
  constructor(private rbacService: RbacService) {}
  
  async assignRole(userId: string, role: string) {
    return await this.rbacService.assignRole(userId, role);
  }
  
  async checkUserPermissions(userId: string, feature: string) {
    return await this.rbacService.getFeaturePermissions(userId, feature);
  }
}
```

---

## 📊 GraphQL Integration

Modern API protection with schema directives and resolvers.

### Step 1: Install Dependencies

```bash
npm install @mamoorali295/rbac @apollo/server @graphql-tools/schema graphql
```

### Step 2: Setup Schema with Directives

```typescript
import { authDirectiveTransformer, rbacResolvers } from '@mamoorali295/rbac/graphql';
import { makeExecutableSchema } from '@graphql-tools/schema';

const typeDefs = `
  directive @auth(feature: String, permission: String) on FIELD_DEFINITION
  directive @registerUser on FIELD_DEFINITION

  type Query {
    # Auto-inferred: feature="users", permission="read"
    users: [User!]! @auth
    
    # Explicit permissions
    adminDashboard: String! @auth(feature: "admin", permission: "read")
  }

  type Mutation {
    # Auto-registers user in RBAC + checks permissions
    createUser(input: CreateUserInput!): User! @auth @registerUser
    
    # Requires admin sudo permission
    resetSystem: Boolean! @auth(feature: "admin", permission: "sudo")
  }
`;

let schema = makeExecutableSchema({ 
  typeDefs, 
  resolvers: { ...customResolvers, ...rbacResolvers }
});

// Apply RBAC directive transformers
schema = authDirectiveTransformer(schema);
```

### Step 3: Initialize RBAC

```typescript
import { RBAC } from '@mamoorali295/rbac';

await RBAC.init({
  database: {
    type: 'mongodb',
    connection: mongoose.connection
  },
  authAdapter: async (context) => {
    const user_id = context.user?.id || context.req.headers['x-user-id'];
    if (!user_id) throw new Error('User not authenticated');
    return { user_id };
  }
});
```

### Step 4: Apollo Server Setup

```typescript
import { ApolloServer } from '@apollo/server';

const server = new ApolloServer({
  schema,
  context: ({ req }) => ({
    req,
    user: req.user, // From your auth middleware
    user_id: req.user?.id || req.headers['x-user-id']
  })
});
```

---

## 🚀 Express Integration (Traditional)

### Step 1: Basic Setup & Initialization

#### 🍃 **MongoDB Setup**
```javascript
const express = require('express');
const mongoose = require('mongoose');
const { RBAC } = require('@mamoorali295/rbac');

const app = express();
app.use(express.json());

// Connect to MongoDB and initialize RBAC
mongoose.connect('mongodb://localhost:27017/your-app')
  .then(async (result) => {
    await RBAC.init({
      database: {
        type: 'mongodb',
        connection: result.connection
      },
      authAdapter: async (req) => ({
        user_id: req.user?.id || req.headers['user-id']
      })
    });

    app.listen(3000, () => console.log('🚀 Server running with RBAC + MongoDB!'));
  });
```

#### 🐘 **PostgreSQL Setup**
```javascript
const express = require('express');
const { Pool } = require('pg');
const { RBAC } = require('@mamoorali295/rbac');

const app = express();
app.use(express.json());

// PostgreSQL connection pool
const pgPool = new Pool({
  user: 'your_username',
  host: 'localhost',
  database: 'your_database', 
  password: 'your_password',
  port: 5432,
});

// Initialize RBAC with PostgreSQL
pgPool.connect()
  .then(async () => {
    await RBAC.init({
      database: {
        type: 'postgresql',
        connection: pgPool
      },
      authAdapter: async (req) => ({
        user_id: req.user?.id || req.headers['user-id']
      })
    });

    app.listen(3000, () => console.log('🚀 Server running with RBAC + PostgreSQL!'));
  });
```

> **💡 Pro Tip**: The RBAC system automatically creates database schema and standard permissions during initialization!

### Step 2: User Registration

#### 🔥 **Option A: Automatic Registration** (Recommended)
```javascript
app.post('/signup', RBAC.registerUser(), (req, res) => {
  // User automatically registered in RBAC system!
  // Extracts user_id, name, email from req.body
  res.json({ message: 'Account created!' });
});
```

#### 🛠️ **Option B: Manual Registration** (If you prefer control)
```javascript
app.post('/signup', async (req, res) => {
  // Your signup logic here...
  const newUser = { /* your user creation */ };
  
  // Manually register in RBAC
  await RBAC.registerUserManual(newUser.id, {
    name: newUser.name,
    email: newUser.email
  });
  
  res.json({ message: 'Account created!' });
});
```

#### 🎯 **Option C: Custom Data Extraction**
```javascript
app.post('/signup', RBAC.registerUser({
  userExtractor: (req) => ({
    user_id: req.body.userId,      // Custom field mapping
    name: req.body.fullName,       // Your field names
    email: req.body.emailAddress   // Your structure
  })
}), (req, res) => {
  res.json({ message: 'Account created with custom mapping!' });
});
```

### Step 3: Route Protection

#### 🧠 **Option A: Auto-Permission Detection** (Smart & Easy)
```javascript
// ✨ RBAC automatically detects what permissions are needed!

app.get('/billing/invoices', RBAC.checkPermissions(), (req, res) => {
  // Auto-detected: feature="billing", permission="read"
  res.json({ invoices: [] });
});

app.post('/users/create', RBAC.checkPermissions(), (req, res) => {
  // Auto-detected: feature="users", permission="create"
  res.json({ message: 'User created!' });
});

app.delete('/reports/:id', RBAC.checkPermissions(), (req, res) => {
  // Auto-detected: feature="reports", permission="delete"
  res.json({ message: 'Report deleted!' });
});
```

#### 🎯 **Option B: Explicit Permission Control** (Full Control)
```javascript
// Specify exactly what permissions you want

app.post('/admin/reset-system', RBAC.checkPermissions({
  feature: 'admin',
  permission: 'sudo'  // Requires admin + sudo permission
}), (req, res) => {
  res.json({ message: 'System reset!' });
});

app.get('/sensitive-data', RBAC.checkPermissions({
  feature: 'reports',
  permission: 'read'  // Requires reports + read permission
}), (req, res) => {
  res.json({ data: 'sensitive info' });
});
```

#### 📊 **Auto-Detection Reference Table**
| Your Route | Method | Auto-Detected Feature | Auto-Detected Permission |
|------------|---------|---------------------|------------------------|
| `GET /billing/invoices` | GET | `billing` | `read` |
| `POST /billing/create` | POST | `billing` | `create` |
| `PUT /users/update/:id` | PUT | `users` | `update` |
| `DELETE /reports/:id` | DELETE | `reports` | `delete` |
| `POST /admin/sudo/reset` | POST | `admin` | `sudo` |

### Step 4: Admin Dashboard

#### 🎨 **Option A: Simple Dashboard** (Quick Setup)
```javascript
// Mount admin dashboard - that's it!
app.use('/rbac-admin', RBAC.adminDashboard({
  user: 'admin',
  pass: 'yourpassword'
}));
```

#### 🔐 **Option B: Secure Dashboard** (Production Ready)
```javascript
app.use('/rbac-admin', RBAC.adminDashboard({
  user: process.env.ADMIN_USER,
  pass: process.env.ADMIN_PASS,
  sessionSecret: process.env.SESSION_SECRET,
  sessionName: 'rbac.admin.session'
}));
```

**🎉 Visit `/rbac-admin` to:**
- 👥 Manage users and assign roles
- 🎭 Create custom roles with any names
- ⚙️ Define your app's features
- 🔐 Control granular permissions
- 📊 View live statistics

### Step 5: Check User Permissions (Optional)

#### 🔍 **Query User Information**
```javascript
// Check what role a user has
const userRole = await RBAC.getUserRole('user123');
console.log(userRole); // 'admin', 'manager', etc.

// Check what permissions user has for a specific feature
const permissions = await RBAC.getFeaturePermissions('user123', 'billing');
console.log(permissions); // ['read', 'create', 'update']

// Assign roles programmatically
await RBAC.assignRole('user123', 'manager');
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
// MongoDB
await RBAC.init({
  database: {
    type: 'mongodb',
    connection: mongoose.connection
  },
  defaultRole: 'user' // Assign 'user' role to all new signups
});

// PostgreSQL
await RBAC.init({
  database: {
    type: 'postgresql', 
    connection: pgPool
  },
  defaultRole: 'user' // Works the same way
});

// Legacy format (still supported for MongoDB)
await RBAC.init({
  db: mongoose.connection, // ⚠️ Deprecated but functional
  defaultRole: 'user'
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

## 📝 TypeScript Support

Full TypeScript definitions included with IntelliSense support:

```typescript
import { RBAC, RBACConfig, PermissionCheckOptions } from '@mamoorali295/rbac';
import { Pool } from 'pg';

// MongoDB configuration
const mongoConfig: RBACConfig = {
  database: {
    type: 'mongodb',
    connection: mongoose.connection
  },
  authAdapter: async (req): Promise<{ user_id: string }> => ({
    user_id: req.user.id
  })
};

// PostgreSQL configuration  
const pgConfig: RBACConfig = {
  database: {
    type: 'postgresql',
    connection: new Pool({ /* pg config */ })
  },
  authAdapter: async (req): Promise<{ user_id: string }> => ({
    user_id: req.user.id
  })
};

await RBAC.init(pgConfig); // or mongoConfig
```

## 🔒 Security Best Practices

1. **Environment Variables**: Store admin credentials securely
2. **HTTPS Only**: Always use HTTPS in production
3. **Regular Audits**: Review roles and permissions regularly
4. **Principle of Least Privilege**: Grant minimal necessary permissions
5. **Session Management**: Implement proper session handling
6. **Database Isolation**: RBAC uses separate `Rbac*` collections to avoid conflicts with your data

---

## 🔧 How do I do advanced stuff?

### 🛠️ Complete Initialization Configuration

```javascript
await RBAC.init({
  db: mongoose.connection,
  
  // Custom user identity extraction
  authAdapter: async (req) => {
    // Option 1: JWT Token
    const token = req.headers.authorization?.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return { user_id: decoded.id, email: decoded.email };
    
    // Option 2: Session-based
    return { user_id: req.user?.id, email: req.user?.email };
    
    // Option 3: Custom headers
    return { 
      user_id: req.headers['x-user-id'], 
      email: req.headers['x-user-email'] 
    };
  },
  
  // Hooks for custom logic
  onUserRegister: (user) => {
    console.log('New user registered:', user);
    // Send welcome email, update analytics, etc.
  },
  
  onRoleUpdate: (payload) => {
    console.log('Role updated:', payload);
    // Log security events, invalidate caches, etc.
  },
  
  // Auto-assign default role to new users
  defaultRole: 'user' // This role must exist in your database
});
```

### 📱 Advanced User Registration

```typescript
// Custom user data extraction
app.post('/signup', RBAC.registerUser({
  userExtractor: (req) => ({
    user_id: req.body.userId || req.body.id,
    name: req.body.fullName || req.body.displayName,
    email: req.body.emailAddress
  })
}), (req, res) => {
  res.json({ message: 'User registered with RBAC!' });
});

// Manual user operations
await RBAC.registerUserManual('user123', { 
  name: 'John Doe', 
  email: 'john@example.com' 
});

await RBAC.updateUser('user123', { name: 'John Smith' });
```

### 🎭 Advanced Role & Permission Management

```typescript
// Using built-in controllers for complex operations
// ⚠️ IMPORTANT: Always use RBAC.controllers methods - never access models directly!
const { userRole, feature } = RBAC.controllers;

// Create a complex role with multiple features
// Using RBAC's safe controller methods (no direct DB access)

// Step 1: Create features first (if they don't exist)
await feature.createFeature('users', 'User management system');
await feature.createFeature('reports', 'Reporting and analytics');
await feature.createFeature('billing', 'Billing and payments');

// Step 2: Get all available features and permissions using RBAC methods
const { features } = await feature.getAllFeatures();
const { permissions } = await userRole.getPermissions();

// Find the features and permissions we need
const usersFeature = features.find(f => f.name === 'users');
const reportsFeature = features.find(f => f.name === 'reports');
const billingFeature = features.find(f => f.name === 'billing');

const readPerm = permissions.find(p => p.name === 'read');
const createPerm = permissions.find(p => p.name === 'create');
const updatePerm = permissions.find(p => p.name === 'update');
const sudoPerm = permissions.find(p => p.name === 'sudo');

// Step 3: Create the role with proper ObjectIds
const managerRoleFeatures = [
  {
    feature: usersFeature._id,
    permissions: [readPerm._id, createPerm._id, updatePerm._id] // No delete permission
  },
  {
    feature: reportsFeature._id,
    permissions: [readPerm._id, createPerm._id, sudoPerm._id] // Can generate all reports
  },
  {
    feature: billingFeature._id,
    permissions: [readPerm._id] // Read-only billing access
  }
];

await userRole.createRole('manager', 'Department manager with limited admin access', managerRoleFeatures);
```

#### 🔒 **Safe Data Access Methods**

```typescript
// ✅ CORRECT: Use RBAC controller methods (secure & encapsulated)
const { userRole, feature } = RBAC.controllers;

// Get all available data safely
const { features } = await feature.getAllFeatures();
const { permissions } = await userRole.getPermissions();
const { userRoles } = await userRole.getAllRoles();

// Create new entities
await feature.createFeature('inventory', 'Inventory management system');
await feature.createFeature('analytics', 'Business analytics dashboard');

// Advanced permission queries using RBAC methods
const allUserPermissions = await RBAC.getFeaturePermissions('user123', 'billing');
const currentUserRole = await RBAC.getUserRole('user123');
```

### 🔌 Integration with Popular Auth Systems

#### With JWT + Express

```typescript
const jwt = require('jsonwebtoken');

await RBAC.init({
  db: mongoose.connection,
  authAdapter: async (req) => {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      return {
        user_id: decoded.sub || decoded.id,
        email: decoded.email
      };
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }
});
```

#### With Passport.js

```typescript
const passport = require('passport');

await RBAC.init({
  db: mongoose.connection,
  authAdapter: async (req) => {
    if (!req.user) throw new Error('User not authenticated');
    
    return {
      user_id: req.user._id.toString(),
      email: req.user.email
    };
  },
  onUserRegister: (user) => {
    // Send welcome email through your email service
    emailService.sendWelcomeEmail(user.email);
  }
});
```

#### With Custom Authentication

```typescript
await RBAC.init({
  db: mongoose.connection,
  authAdapter: async (req) => {
    // Custom authentication logic
    const apiKey = req.headers['x-api-key'];
    const user = await YourUserModel.findOne({ apiKey });
    
    if (!user) throw new Error('Invalid API key');
    
    return {
      user_id: user._id.toString(),
      email: user.email
    };
  }
});
```

### 🧪 Testing & Development

```typescript
// Testing permission checking
const mockReq = {
  method: 'GET',
  path: '/billing/invoices',
  headers: { 'user-id': 'test-user' }
};

// Test if user has specific permissions
const permissions = await RBAC.getFeaturePermissions('test-user', 'billing');
console.log('User permissions:', permissions); // ['read', 'create']

// Verify role assignment
const role = await RBAC.getUserRole('test-user');
console.log('User role:', role); // 'manager'
```

### ⚙️ Production Configuration

```typescript
// Production-ready setup with error handling
const initRBAC = async () => {
  try {
    await RBAC.init({
      db: mongoose.connection,
      authAdapter: async (req) => {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) throw new Error('No token provided');
        
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        return { user_id: decoded.id, email: decoded.email };
      },
      defaultRole: process.env.DEFAULT_USER_ROLE || 'user',
      onUserRegister: async (user) => {
        // Log to your monitoring system
        console.log(`New user registered: ${user.user_id}`);
        
        // Update your analytics
        await analytics.track('user_registered', {
          user_id: user.user_id,
          email: user.email
        });
      }
    });
    
    console.log('✅ RBAC System initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize RBAC:', error);
    process.exit(1);
  }
};

await initRBAC();
```

### 🎯 Dynamic Role Creation Examples

```javascript
// Create roles with ANY names you want - no restrictions!
await RBAC.controllers.userRole.createRole('PowerUser', 'Advanced user with special access', []);
await RBAC.controllers.userRole.createRole('BillingTeam', 'Team that handles billing operations', []);
await RBAC.controllers.userRole.createRole('ReadOnlyAuditor', 'Can view everything but modify nothing', []);

// Then assign ANY features to ANY roles via the admin dashboard or programmatically:
await RBAC.controllers.userRole.addFeatureToUserRole('role-id', ['billing-feature-id']);
await RBAC.controllers.userRole.addPermissionToFeatureInUserRole(
  'role-id', 
  ['billing-feature-id'], 
  ['read-permission-id', 'create-permission-id', 'update-permission-id']
);
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📚 Documentation

- 📖 [API Documentation](https://sheikh295.github.io/rbac-system)
- 🔄 [Database Comparison Guide](./docs/DATABASE_COMPARISON.md) - MongoDB vs PostgreSQL 
- 💻 [PostgreSQL Example](./examples/postgresql-example.js)
- 🐛 [Issue Tracker](https://github.com/sheikh295/rbac/issues)
- 💬 [Discussions](https://github.com/sheikh295/rbac/discussions)

## 🎯 Roadmap

- [x] **Multi-Database Support** - ✅ MongoDB & PostgreSQL fully supported
- [x] **Multi-Framework Support** - ✅ Express, NestJS, GraphQL fully supported
- [ ] **Additional Frameworks** - Fastify, Koa adapters
- [ ] **Additional Databases** - MySQL, SQLite adapters  
- [ ] **Audit Logging** - Track all permission changes
- [ ] **Role Templates** - Predefined role templates for common use cases
- [ ] **SSO Integration** - SAML, OAuth2, Active Directory support

---

**Made with ❤️ for the Node.js community**

*Secure your applications with enterprise-grade role-based access control.*