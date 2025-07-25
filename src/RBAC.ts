// Express types - only imported if Express is available
type ExpressRequest = any;
type ExpressResponse = any;  
type ExpressNextFunction = any;
import { Connection } from "mongoose";
import { RBACConfig, PermissionCheckOptions, RegisterUserOptions, AdminDashboardOptions, UserReference } from "./types";
import { DatabaseAdapter } from "./adapters/DatabaseAdapter";
import { MongoAdapter } from "./adapters/MongoAdapter";
import { PostgresAdapter } from "./adapters/PostgresAdapter";
import { userRoleController } from "./mongo/controllers/userrole.controller";
import { featureController } from "./mongo/controllers/feature.controller";

/**
 * Role-Based Access Control (RBAC) system for Node.js applications.
 * Provides middleware functions for authentication, authorization, and user management.
 * 
 * @class RBACSystem
 */
class RBACSystem {
  private config: RBACConfig | null = null;
  private initialized = false;
  private dbAdapter: DatabaseAdapter | null = null;

  /**
   * Initialize the RBAC system with the provided configuration.
   * Sets up database connection and creates standard permissions.
   * 
   * @param {RBACConfig} config - Configuration object containing database connection and optional hooks
   * @returns {Promise<void>} Promise that resolves when initialization is complete
   * @throws {Error} If database connection fails or standard permissions cannot be created
   * 
   * @example
   * ```typescript
   * // MongoDB configuration
   * await RBAC.init({
   *   database: {
   *     type: 'mongodb',
   *     connection: mongoose.connection
   *   },
   *   authAdapter: async (req) => ({ user_id: req.user.id }),
   *   defaultRole: 'user'
   * });
   * 
   * // PostgreSQL configuration
   * await RBAC.init({
   *   database: {
   *     type: 'postgresql',
   *     connection: pgPool
   *   },
   *   authAdapter: async (req) => ({ user_id: req.user.id }),
   *   defaultRole: 'user'
   * });
   * 
   * // Legacy MongoDB configuration (deprecated)
   * await RBAC.init({
   *   db: mongoose.connection,
   *   authAdapter: async (req) => ({ user_id: req.user.id }),
   *   defaultRole: 'user'
   * });
   * ```
   */
  async init(config: RBACConfig): Promise<void> {
    this.config = config;
    
    // Handle legacy configuration format
    if (config.db && !config.database) {
      config.database = {
        type: 'mongodb',
        connection: config.db
      };
    }

    // Initialize database adapter based on configuration
    if (config.database) {
      switch (config.database.type) {
        case 'mongodb':
          this.dbAdapter = new MongoAdapter(config.database.connection);
          break;
        case 'postgresql':
          this.dbAdapter = new PostgresAdapter(config.database.connection);
          break;
        default:
          throw new Error(`Unsupported database type: ${(config.database as any).type}`);
      }

      await this.dbAdapter.init();
    } else {
      throw new Error("Database configuration is required. Please provide either 'database' or 'db' in config.");
    }

    this.initialized = true;
  }

  /**
   * Ensures that the RBAC system has been initialized before use.
   * 
   * @private
   * @throws {Error} If the system has not been initialized
   */
  private ensureInitialized(): void {
    if (!this.initialized || !this.config || !this.dbAdapter) {
      throw new Error("RBAC system not initialized. Call RBAC.init(config) first.");
    }
  }

  /**
   * Automatically infers the feature and permission from the HTTP request.
   * Uses the first path segment as the feature and HTTP method/path patterns for permission.
   * 
   * @private
   * @param {ExpressRequest} req - Express request object
   * @returns {{feature: string, permission: string}} Inferred feature and permission
   * 
   * @example
   * GET /billing/invoices -> { feature: 'billing', permission: 'read' }
   * POST /billing/create -> { feature: 'billing', permission: 'create' }
   * DELETE /billing/remove -> { feature: 'billing', permission: 'delete' }
   */
  private inferFeatureAndPermission(req: ExpressRequest): { feature: string; permission: string } {
    const pathSegments = req.path.split("/").filter(Boolean);
    const method = req.method.toLowerCase();

    const feature = pathSegments[0] || "default";

    let permission = "read";

    if (req.path.includes("/sudo")) {
      permission = "sudo";
    } else {
      switch (method) {
        case "get":
          permission = "read";
          break;
        case "post":
          if (req.path.includes("/delete") || req.path.includes("/remove")) {
            permission = "delete";
          } else if (req.path.includes("/update") || req.path.includes("/edit")) {
            permission = "update";
          } else if (req.path.includes("/create") || req.path.includes("/add")) {
            permission = "create";
          } else {
            permission = "create";
          }
          break;
        case "put":
        case "patch":
          permission = "update";
          break;
        case "delete":
          permission = "delete";
          break;
        default:
          permission = "read";
      }
    }

    return { feature, permission };
  }

  /**
   * Extracts user identity from the request using authAdapter or fallback properties.
   * 
   * @private
   * @param {ExpressRequest} req - Express request object
   * @returns {Promise<{user_id: string, email?: string}>} User identity object
   * @throws {Error} If user identity cannot be determined
   */
  private async getUserIdentity(req: ExpressRequest): Promise<{ user_id: string; email?: string }> {
    this.ensureInitialized();

    if (this.config!.authAdapter) {
      return await this.config!.authAdapter(req);
    }

    const user_id = (req as any).user_id || (req as any).userId;
    const email = (req as any).email;

    if (!user_id) {
      throw new Error("Unable to determine user identity. Provide authAdapter or attach user_id to request.");
    }

    return { user_id, email };
  }

  /**
   * Express middleware that checks if the current user has the required permissions.
   * Can auto-infer permissions from the route or use explicitly provided options.
   * 
   * @param {PermissionCheckOptions} options - Optional feature and permission specification
   * @returns {Function} Express middleware function
   * 
   * @example
   * // Auto-inferred permissions
   * app.get('/billing/invoices', RBAC.checkPermissions(), handler);
   * 
   * // Explicit permissions
   * app.post('/admin/reset', RBAC.checkPermissions({
   *   feature: 'admin',
   *   permission: 'sudo'
   * }), handler);
   */
  checkPermissions(options: PermissionCheckOptions = {}) {
    return async (req: ExpressRequest, res: ExpressResponse, next: ExpressNextFunction) => {
      try {
        this.ensureInitialized();

        const { user_id } = await this.getUserIdentity(req);

        const { feature, permission } = options.feature && options.permission ? { feature: options.feature, permission: options.permission } : this.inferFeatureAndPermission(req);

        const user = await this.dbAdapter!.findUserByUserIdWithRole(user_id);

        if (!user) {
          return res.status(401).json({ error: "User not found in RBAC system" });
        }

        const role = user.role as any;
        if (!role || !role.features) {
          return res.status(403).json({ error: "No role or features assigned" });
        }

        const userFeature = role.features.find((f: any) => f.feature.name === feature);
        if (!userFeature) {
          return res.status(403).json({ error: `Access denied to feature: ${feature}` });
        }

        const hasPermission = userFeature.permissions.some((p: any) => p.name === permission);
        if (!hasPermission) {
          return res.status(403).json({ error: `Permission denied: ${permission} on ${feature}` });
        }

        next();
      } catch (error) {
        res.status(500).json({ error: "Internal server error" });
      }
    };
  }

  /**
   * Express middleware that registers a new user in the RBAC system.
   * Automatically assigns default role if configured and calls registration hooks.
   * 
   * @param {RegisterUserOptions} options - Optional user data extractor function
   * @returns {Function} Express middleware function
   * 
   * @example
   * // Default extraction from req.body
   * app.post('/signup', RBAC.registerUser(), handler);
   * 
   * // Custom user data extraction
   * app.post('/signup', RBAC.registerUser({
   *   userExtractor: (req) => ({
   *     user_id: req.body.id,
   *     name: req.body.fullName,
   *     email: req.body.emailAddress
   *   })
   * }), handler);
   */
  registerUser(options: RegisterUserOptions = {}) {
    return async (req: ExpressRequest, res: ExpressResponse, next: ExpressNextFunction) => {
      try {
        this.ensureInitialized();

        const userData = options.userExtractor
          ? options.userExtractor(req)
          : {
              user_id: req.body.user_id || req.body.id,
              name: req.body.name,
              email: req.body.email,
            };

        if (!userData.user_id) {
          return res.status(400).json({ error: "user_id is required" });
        }

        const existingUser = await this.dbAdapter!.findUserByUserId(userData.user_id);
        if (existingUser) {
          return res.status(409).json({ error: "User already registered in RBAC system" });
        }

        let defaultRoleId = undefined;
        if (this.config!.defaultRole) {
          const role = await this.dbAdapter!.findRoleByName(this.config!.defaultRole);
          if (role) {
            defaultRoleId = role.id;
          }
        }

        await this.dbAdapter!.createUser({
          user_id: userData.user_id,
          name: userData.name || "",
          email: userData.email || "",
          role_id: defaultRoleId,
        });

        if (this.config!.onUserRegister) {
          await this.config!.onUserRegister(userData);
        }

        next();
      } catch (error) {
        res.status(500).json({ error: "Internal server error" });
      }
    };
  }

  /**
   * Manually register a user in the RBAC system without using middleware.
   * Useful for programmatic user registration outside of HTTP requests.
   * 
   * @param {string} user_id - Unique identifier for the user
   * @param {Object} userData - User data object
   * @param {string} [userData.name] - User's display name
   * @param {string} [userData.email] - User's email address
   * @returns {Promise<void>} Promise that resolves when user is registered
   * @throws {Error} If user already exists or registration fails
   * 
   * @example
   * ```typescript
   * await RBAC.registerUserManual('user123', {
   *   name: 'John Doe',
   *   email: 'john@example.com'
   * });
   * ```
   */
  async registerUserManual(user_id: string, userData: { name?: string; email?: string }): Promise<void> {
    this.ensureInitialized();

    const existingUser = await this.dbAdapter!.findUserByUserId(user_id);
    if (existingUser) {
      throw new Error("User already exists");
    }

    let defaultRoleId = undefined;
    if (this.config!.defaultRole) {
      const role = await this.dbAdapter!.findRoleByName(this.config!.defaultRole);
      if (role) {
        defaultRoleId = role.id;
      }
    }

    await this.dbAdapter!.createUser({
      user_id,
      name: userData.name || "",
      email: userData.email || "",
      role_id: defaultRoleId,
    });

    if (this.config!.onUserRegister) {
      await this.config!.onUserRegister({ user_id, ...userData });
    }
  }

  /**
   * Update user information in the RBAC system.
   * 
   * @param {string} user_id - Unique identifier for the user
   * @param {Object} userData - User data to update
   * @param {string} [userData.name] - New display name
   * @param {string} [userData.email] - New email address
   * @returns {Promise<void>} Promise that resolves when user is updated
   * @throws {Error} If user is not found
   * 
   * @example
   * ```typescript
   * await RBAC.updateUser('user123', {
   *   name: 'John Smith',
   *   email: 'johnsmith@example.com'
   * });
   * ```
   */
  async updateUser(user_id: string, userData: { name?: string; email?: string }): Promise<void> {
    this.ensureInitialized();

    const user = await this.dbAdapter!.findUserByUserId(user_id);
    if (!user) {
      throw new Error("User not found");
    }

    const updates: any = {};
    if (userData.name !== undefined) updates.name = userData.name;
    if (userData.email !== undefined) updates.email = userData.email;

    await this.dbAdapter!.updateUser(user_id, updates);
  }

  /**
   * Assign a role to a user in the RBAC system.
   * 
   * @param {string} user_id - Unique identifier for the user
   * @param {string} roleName - Name of the role to assign
   * @returns {Promise<void>} Promise that resolves when role is assigned
   * @throws {Error} If user or role is not found
   * 
   * @example
   * ```typescript
   * await RBAC.assignRole('user123', 'admin');
   * ```
   */
  async assignRole(user_id: string, roleName: string): Promise<void> {
    this.ensureInitialized();

    const user = await this.dbAdapter!.findUserByUserId(user_id);
    if (!user) {
      throw new Error("User not found");
    }

    const role = await this.dbAdapter!.findRoleByName(roleName);
    if (!role) {
      throw new Error("Role not found");
    }

    await this.dbAdapter!.updateUser(user_id, { role_id: role.id });

    if (this.config!.onRoleUpdate) {
      await this.config!.onRoleUpdate({ user_id, role: roleName });
    }
  }

  /**
   * Get the role name assigned to a user.
   * 
   * @param {string} user_id - Unique identifier for the user
   * @returns {Promise<string | null>} Promise that resolves to the role name or null if no role assigned
   * 
   * @example
   * ```typescript
   * const role = await RBAC.getUserRole('user123');
   * console.log(role); // 'admin' or null
   * ```
   */
  async getUserRole(user_id: string): Promise<string | null> {
    this.ensureInitialized();

    const user = await this.dbAdapter!.findUserByUserIdWithRole(user_id);
    if (!user || !user.role) {
      return null;
    }

    return (user.role as any).name;
  }

  /**
   * Get all permissions a user has for a specific feature.
   * 
   * @param {string} user_id - Unique identifier for the user
   * @param {string} featureName - Name of the feature to check permissions for
   * @returns {Promise<string[]>} Promise that resolves to an array of permission names
   * 
   * @example
   * ```typescript
   * const permissions = await RBAC.getFeaturePermissions('user123', 'billing');
   * console.log(permissions); // ['read', 'create', 'update']
   * ```
   */
  async getFeaturePermissions(user_id: string, featureName: string): Promise<string[]> {
    this.ensureInitialized();

    return await this.dbAdapter!.getUserFeaturePermissions(user_id, featureName);
  }

  /**
   * Creates an Express router for the RBAC admin dashboard.
   * Provides a complete web interface for managing users, roles, features, and permissions.
   * 
   * @param {AdminDashboardOptions} options - Dashboard configuration options
   * @param {string} options.user - Admin username for authentication
   * @param {string} options.pass - Admin password for authentication
   * @param {string} [options.sessionSecret] - Secret key for session encryption
   * @param {string} [options.sessionName] - Custom session cookie name
   * @returns {express.Router} Express router instance for the admin dashboard
   * 
   * @example
   * ```typescript
   * app.use('/rbac-admin', RBAC.adminDashboard({
   *   user: 'admin',
   *   pass: 'secure-password',
   *   sessionSecret: 'your-secret-key',
   *   sessionName: 'rbac.admin.sid'
   * }));
   * ```
   */
  adminDashboard(options: AdminDashboardOptions) {
    // Check if Express is available
    try {
      require.resolve('express');
      require.resolve('express-session');
    } catch (error) {
      throw new Error(
        'Express dependencies not found. Please install express and express-session to use the admin dashboard:\n\n' +
        'npm install express express-session\n\n' +
        'Or if using yarn:\n' +
        'yarn add express express-session'
      );
    }

    const express = require('express');
    const session = require('express-session');
    const { createAdminRouter } = require('./admin/router');
    const { getLoginView } = require('./admin/views/login');
    
    const dashboardRouter = express.Router();
    
    dashboardRouter.use(session({
      secret: options.sessionSecret || 'rbac-admin-secret-key',
      name: options.sessionName || 'rbac.admin.sid',
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: false,
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000,
      }
    }));
    
    dashboardRouter.use(express.json());
    dashboardRouter.use(express.urlencoded({ extended: true }));
    
    dashboardRouter.get('/login', (req: ExpressRequest, res: ExpressResponse) => {
      if ((req.session as any)?.authenticated) {
        return res.redirect(req.baseUrl + '/');
      }
      res.send(getLoginView(req.baseUrl));
    });
    
    dashboardRouter.post('/login', (req: ExpressRequest, res: ExpressResponse) => {
      const { username, password } = req.body;
      
      if (username === options.user && password === options.pass) {
        (req.session as any).authenticated = true;
        (req.session as any).username = username;
        (req.session as any).loginTime = new Date().toISOString();
        
        res.redirect(req.baseUrl + '/');
      } else {
        res.redirect(req.baseUrl + '/login?error=1');
      }
    });
    
    dashboardRouter.post('/logout', (req: ExpressRequest, res: ExpressResponse) => {
      req.session.destroy((err: any) => {
        res.redirect(req.baseUrl + '/login');
      });
    });
    
    dashboardRouter.use((req: ExpressRequest, res: ExpressResponse, next: ExpressNextFunction) => {
      if (req.path === '/login' || req.path.startsWith('/login')) {
        return next();
      }
      
      // Check if RBAC is initialized only when accessing protected routes
      if (!this.initialized || !this.dbAdapter) {
        return res.status(500).send(`
          <html>
            <body style="font-family: Arial, sans-serif; padding: 40px; text-align: center;">
              <h1 style="color: #e74c3c;">RBAC System Not Initialized</h1>
              <p>Please call <code>RBAC.init(config)</code> before accessing the admin dashboard.</p>
              <p style="color: #7f8c8d;">The dashboard will be available once RBAC is properly initialized.</p>
            </body>
          </html>
        `);
      }
      
      if (!(req.session as any)?.authenticated) {
        return res.redirect(req.baseUrl + '/login');
      }
      
      next();
    });
    
    // Create a lazy-loaded admin router that gets the dbAdapter when needed
    dashboardRouter.use('/', (req: ExpressRequest, res: ExpressResponse, next: ExpressNextFunction) => {
      if (!this.dbAdapter) {
        return res.status(500).send('RBAC system not initialized');
      }
      const adminRouter = createAdminRouter(this.dbAdapter);
      adminRouter(req, res, next);
    });
    
    return dashboardRouter;
  }

  /**
   * Provides access to internal controllers for advanced database operations.
   * These controllers offer direct database access for complex RBAC operations.
   * 
   * @returns {Object} Object containing controller instances
   * @returns {Object} controllers.userRole - User role management controller
   * @returns {Object} controllers.feature - Feature management controller
   * 
   * @example
   * ```typescript
   * const { userRole, feature } = RBAC.controllers;
   * const allRoles = await userRole.getAllRoles();
   * const allFeatures = await feature.getAllFeatures();
   * ```
   */
  get controllers() {
    return {
      userRole: userRoleController,
      feature: featureController,
    };
  }
}

/**
 * Singleton instance of the RBACSystem class.
 * This is the main export that applications should use for all RBAC operations.
 * 
 * @example
 * ```typescript
 * import { RBAC } from '@sheikh295/rbac';
 * 
 * // Initialize the system
 * await RBAC.init({
 *   db: mongoose.connection,
 *   authAdapter: async (req) => ({ user_id: req.user.id }),
 *   defaultRole: 'user'
 * });
 * 
 * // Use middleware
 * app.get('/protected', RBAC.checkPermissions(), handler);
 * app.use('/admin', RBAC.adminDashboard({ user: 'admin', pass: 'secret' }));
 * ```
 */
export const RBAC = new RBACSystem();
