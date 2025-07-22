
# RBAC Node.js Package

You are working on a reusable RBAC (Role-Based Access Control) Node.js package that will be published to the npm registry. The goal is to build a plug-and-play RBAC system with middleware, configuration-based control, and optional dashboard UI. This package will support seamless integration into Express-based backends while keeping user identity management decoupled.

Your job is to complete, refine, and make the package robust, configurable, and production-ready.

---

## ✅ Core Objectives

- Provide easy-to-use middleware for permission checks.
- Support configuration hooks and exposed utility functions.
- Allow users to integrate with their own auth system and user DB.
- Provide optional dashboard UI for managing roles and permissions.
- Database: MongoDB (for now), configurable via the user.

---

## 🔧 Core Features to Implement or Refine

### 1. `checkPermissions` Middleware

- Usage:
  ```ts
  app.use("/billing/update", RBAC.checkPermissions({
    feature: "billing",
    permission: "update"
  }))
  ```

- If no options are passed:
  - Infer feature and permission from the route path and method.
    - Example:
      - `POST /billing/add/card` → feature: `billing`, permission: `create`
      - `PUT /billing/update/card` → feature: `billing`, permission: `update`
      - `GET /billing/card` → feature: `billing`, permission: `read`

- Determine the user identity using either:
  - `req.user_id` or `req.email` (must be attached before this middleware runs)
  - Or via a config-defined `authAdapter(req)` function that returns `{ user_id, email }`

---

### 2. `registerUser` Middleware

- Usage:
  ```ts
  app.post("/signup", RBAC.registerUser(), yourController)
  ```

- Captures the new user's `user_id`, `name`, `email` and stores a reference in the RBAC system.
- Supports custom user extraction via:
  ```ts
  userExtractor: (req) => ({
    user_id: req.body.id,
    email: req.body.email,
    name: req.body.name
  })
  ```

---

### 3. Exposed Utility Functions

These should be callable manually by the developer:

- `RBAC.registerUser(user_id, { name, email })`
- `RBAC.updateUser(user_id, { name, email })`
- `RBAC.assignRole(user_id, role)`
- `RBAC.getUserRole(user_id)`
- `RBAC.getFeaturePermissions(user_id, feature)`

---

### 4. Config Hooks

Support hooks via config:

```ts
RBAC.init({
  db: mongooseConnection,
  authAdapter: async (req) => ({ user_id: req.user?.id }),
  onUserRegister: (user) => { ... },
  onRoleUpdate: (payload) => { ... }
});
```

---

### 5. Admin Dashboard (Optional UI)

- Provide a way to mount a lightweight dashboard:
  ```ts
  app.use("/rbac-admin", RBAC.adminDashboard({
    user: "email/username"
    pass: "your-secure-passowrd"
  }))
  ```

- The dashboard allows:
  - Viewing and assigning roles to users
  - Creating/editing features and permissions
  - Managing role-based access visually

- Support theming or simple branding if possible.

---

### 6. MongoDB Usage

- Use the MongoDB connection provided via config.
- Do **not** store full user details — only reference:
  - `user_id` (immutable key)
  - `name`, `email` (optional, updatable)
  - Role assignments and permissions

---

## 📦 Developer Experience (DX) Features

- Document clearly how to:
  - Register users
  - Protect routes
  - Manage permissions
  - Use hooks and override behavior

---

## ✅ Final Notes

- The primary user system and authentication (e.g., JWT) will be **owned by the integrating app**, not by this package.
- Your RBAC system only references users and provides centralized permission logic.
- Everything should be modular, well-documented, and pluggable.
- Plan for future extensibility: multiple DB support, role inheritance, field-level permissions, etc.

---
