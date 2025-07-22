# RBAC Admin Dashboard - Authentication Guide

## 🔐 How Admin Login Works

The RBAC admin dashboard uses **session-based authentication** that is completely isolated from your main application's authentication system.

## 📍 Route Structure

When you mount the admin dashboard at `/rbac-admin`, these routes are created:

```
GET  /rbac-admin/login          <- Admin login page (beautiful UI)
POST /rbac-admin/login          <- Admin login handler
POST /rbac-admin/logout         <- Admin logout
GET  /rbac-admin/               <- Dashboard home
GET  /rbac-admin/users          <- User management (paginated)
GET  /rbac-admin/roles          <- Role management  
GET  /rbac-admin/features       <- Feature management
GET  /rbac-admin/permissions    <- Permission management
```

## 🚀 Setup Example

```javascript
const express = require('express');
const { RBAC } = require('@sheikh295/rbac');

const app = express();

// Your app routes (completely separate)
app.get('/', (req, res) => res.send('Your main app'));
app.get('/login', (req, res) => res.send('Your app login'));

// Mount RBAC admin at /rbac-admin
app.use('/rbac-admin', RBAC.adminDashboard({
  user: 'admin',                           // Admin username
  pass: 'secure-password-123',             // Admin password  
  sessionSecret: 'your-secret-key',        // Session encryption key
  sessionName: 'rbac.admin.sid'            // Session cookie name
}));
```

## 🔄 Authentication Flow

### 1. **First Visit**
```
User visits: /rbac-admin/users
↓
Not authenticated → Redirect to /rbac-admin/login
↓
Beautiful login page loads
```

### 2. **Login Process**
```
User enters credentials on /rbac-admin/login
↓
POST to /rbac-admin/login
↓  
Credentials valid? → Create session → Redirect to /rbac-admin/
↓
Credentials invalid? → Redirect to /rbac-admin/login?error=1
```

### 3. **Authenticated Access**
```
User visits any /rbac-admin/* route
↓
Session exists? → Allow access to admin dashboard
↓
Session expired? → Redirect to /rbac-admin/login
```

### 4. **Logout**
```
User clicks logout button
↓
POST to /rbac-admin/logout
↓
Destroy session → Redirect to /rbac-admin/login
```

## 🔒 Security Features

- **Session-only authentication** (no cookies persist after browser close)
- **HTTP-only cookies** (protected from XSS)
- **Session encryption** using configurable secret
- **CSRF protection** via POST-only logout
- **No route conflicts** with your main app
- **Configurable session name** to avoid conflicts

## 🎯 No Route Conflicts

The admin dashboard is completely isolated:

```javascript
// ✅ Your app routes work normally
app.get('/login', yourLoginHandler);          // Your login
app.get('/users', yourUsersHandler);          // Your users API
app.get('/dashboard', yourDashboardHandler);  // Your dashboard

// ✅ Admin routes are separate  
// /rbac-admin/login    <- Admin login (different!)
// /rbac-admin/users    <- Admin user management (different!)
// /rbac-admin/         <- Admin dashboard (different!)
```

## ⚙️ Configuration Options

```javascript
app.use('/rbac-admin', RBAC.adminDashboard({
  user: 'admin',                    // Required: Admin username
  pass: 'your-password',            // Required: Admin password
  sessionSecret: 'secret-key',      // Optional: Session encryption key
  sessionName: 'rbac.admin.sid'     // Optional: Session cookie name
}));
```

## 🔧 Production Setup

```javascript
// Use environment variables in production
app.use('/rbac-admin', RBAC.adminDashboard({
  user: process.env.RBAC_ADMIN_USER || 'admin',
  pass: process.env.RBAC_ADMIN_PASS || 'change-me',
  sessionSecret: process.env.RBAC_SESSION_SECRET || crypto.randomBytes(32).toString('hex'),
  sessionName: 'rbac.admin.sid'
}));
```

## 📱 Features

- **Modern UI** with gradient design
- **Mobile responsive** sidebar navigation
- **User pagination** with search functionality
- **Session management** with proper cleanup
- **Professional login page** with error handling
- **Logout confirmation** and session destruction

## 🔍 Testing the Login

1. Start your server
2. Visit `http://localhost:3000/rbac-admin`
3. You'll be redirected to the login page
4. Enter your credentials (username: `admin`, password: `your-password`)
5. You'll be redirected to the admin dashboard
6. Session persists until browser closes or manual logout

## 🛡️ Security Best Practices

1. **Always use HTTPS in production**
2. **Use strong session secrets** (32+ random characters)
3. **Set secure environment variables**
4. **Regularly rotate passwords**
5. **Monitor admin access logs**

The admin dashboard is now ready with secure, session-based authentication that won't interfere with your main application!