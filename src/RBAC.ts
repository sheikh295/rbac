import { Request, Response, NextFunction } from "express";
import { Connection } from "mongoose";
import { RBACConfig, PermissionCheckOptions, RegisterUserOptions, AdminDashboardOptions, UserReference } from "./types";
import { User } from "./mongo/models/User";
import { UserRole } from "./mongo/models/UserRole";
import { Feature } from "./mongo/models/Feature";
import { Permission } from "./mongo/models/Permission";
import { userRoleController } from "./mongo/controllers/userrole.controller";
import { featureController } from "./mongo/controllers/feature.controller";

class RBACSystem {
  private config: RBACConfig | null = null;
  private initialized = false;

  async init(config: RBACConfig): Promise<void> {
    this.config = config;
    this.initialized = true;

    // Set up mongoose connection
    if (config.db) {
      // Use the provided connection
      console.log("RBAC initialized with provided MongoDB connection");
      
      // Auto-create standard permissions if they don't exist
      await this.createStandardPermissions();
    }
  }

  private async createStandardPermissions(): Promise<void> {
    try {
      const standardPermissions = [
        { name: 'read', description: 'View and access resources' },
        { name: 'create', description: 'Add new resources' },
        { name: 'update', description: 'Modify existing resources' },
        { name: 'delete', description: 'Remove resources' },
        { name: 'sudo', description: 'Full administrative access' }
      ];

      for (const permissionData of standardPermissions) {
        const existingPermission = await Permission.findOne({ name: permissionData.name });
        
        if (!existingPermission) {
          const permission = new Permission(permissionData);
          await permission.save();
          console.log(`✅ Created standard permission: ${permissionData.name}`);
        }
      }
    } catch (error) {
      console.warn('Warning: Could not auto-create standard permissions:', (error as Error).message);
    }
  }

  private ensureInitialized(): void {
    if (!this.initialized || !this.config) {
      throw new Error("RBAC system not initialized. Call RBAC.init(config) first.");
    }
  }

  private inferFeatureAndPermission(req: Request): { feature: string; permission: string } {
    const pathSegments = req.path.split("/").filter(Boolean);
    const method = req.method.toLowerCase();

    // Extract feature from first path segment
    const feature = pathSegments[0] || "default";

    // Infer permission from method and path
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
            permission = "create"; // Default for POST
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

  private async getUserIdentity(req: Request): Promise<{ user_id: string; email?: string }> {
    this.ensureInitialized();

    if (this.config!.authAdapter) {
      return await this.config!.authAdapter(req);
    }

    // Fallback to req properties
    const user_id = (req as any).user_id || (req as any).userId;
    const email = (req as any).email;

    if (!user_id) {
      throw new Error("Unable to determine user identity. Provide authAdapter or attach user_id to request.");
    }

    return { user_id, email };
  }

  checkPermissions(options: PermissionCheckOptions = {}) {
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        this.ensureInitialized();

        // Get user identity
        const { user_id } = await this.getUserIdentity(req);

        // Get feature and permission
        const { feature, permission } = options.feature && options.permission ? { feature: options.feature, permission: options.permission } : this.inferFeatureAndPermission(req);

        // Find user with role
        const user = await User.findOne({ user_id })
          .populate({
            path: "role",
            populate: {
              path: "features.feature features.permissions",
            },
          })
          .exec();

        if (!user) {
          return res.status(401).json({ error: "User not found in RBAC system" });
        }

        const role = user.role as any;
        if (!role || !role.features) {
          return res.status(403).json({ error: "No role or features assigned" });
        }

        // Check if user has access to feature
        const userFeature = role.features.find((f: any) => f.feature.name === feature);
        if (!userFeature) {
          return res.status(403).json({ error: `Access denied to feature: ${feature}` });
        }

        // Check if user has required permission
        const hasPermission = userFeature.permissions.some((p: any) => p.name === permission);
        if (!hasPermission) {
          return res.status(403).json({ error: `Permission denied: ${permission} on ${feature}` });
        }

        next();
      } catch (error) {
        console.error("Error in checkPermissions middleware:", error);
        res.status(500).json({ error: "Internal server error" });
      }
    };
  }

  registerUser(options: RegisterUserOptions = {}) {
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        this.ensureInitialized();

        // Extract user data
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

        // Check if user already exists
        const existingUser = await User.findOne({ user_id: userData.user_id });
        if (existingUser) {
          return res.status(409).json({ error: "User already registered in RBAC system" });
        }

        // Try to find default role if configured
        let defaultRole = null;
        if (this.config!.defaultRole) {
          const role = await UserRole.findOne({ name: this.config!.defaultRole });
          if (role) {
            defaultRole = role._id;
          }
        }

        // Create user reference with default role if available
        const newUser = new User({
          user_id: userData.user_id,
          name: userData.name || "",
          email: userData.email || "",
          role: defaultRole, // Assign default role if found, null otherwise
        });

        await newUser.save();

        // Call hook if provided
        if (this.config!.onUserRegister) {
          await this.config!.onUserRegister(userData);
        }

        next();
      } catch (error) {
        console.error("Error in registerUser middleware:", error);
        res.status(500).json({ error: "Internal server error" });
      }
    };
  }

  // Utility functions
  async registerUserManual(user_id: string, userData: { name?: string; email?: string }): Promise<void> {
    this.ensureInitialized();

    const existingUser = await User.findOne({ user_id });
    if (existingUser) {
      throw new Error("User already exists");
    }

    // Try to find default role if configured
    let defaultRole = null;
    if (this.config!.defaultRole) {
      const role = await UserRole.findOne({ name: this.config!.defaultRole });
      if (role) {
        defaultRole = role._id;
      }
    }

    const newUser = new User({
      user_id,
      name: userData.name || "",
      email: userData.email || "",
      role: defaultRole, // Assign default role if found, null otherwise
    });

    await newUser.save();

    if (this.config!.onUserRegister) {
      await this.config!.onUserRegister({ user_id, ...userData });
    }
  }

  async updateUser(user_id: string, userData: { name?: string; email?: string }): Promise<void> {
    this.ensureInitialized();

    const user = await User.findOne({ user_id });
    if (!user) {
      throw new Error("User not found");
    }

    if (userData.name !== undefined) user.name = userData.name;
    if (userData.email !== undefined) user.email = userData.email;

    await user.save();
  }

  async assignRole(user_id: string, roleName: string): Promise<void> {
    this.ensureInitialized();

    const user = await User.findOne({ user_id });
    if (!user) {
      throw new Error("User not found");
    }

    const role = await UserRole.findOne({ name: roleName });
    if (!role) {
      throw new Error("Role not found");
    }

    user.role = role.id;
    await user.save();

    if (this.config!.onRoleUpdate) {
      await this.config!.onRoleUpdate({ user_id, role: roleName });
    }
  }

  async getUserRole(user_id: string): Promise<string | null> {
    this.ensureInitialized();

    const user = await User.findOne({ user_id }).populate("role");
    if (!user || !user.role) {
      return null;
    }

    return (user.role as any).name;
  }

  async getFeaturePermissions(user_id: string, featureName: string): Promise<string[]> {
    this.ensureInitialized();

    const user = await User.findOne({ user_id }).populate({
      path: "role",
      populate: {
        path: "features.feature features.permissions",
      },
    });

    if (!user || !user.role) {
      return [];
    }

    const role = user.role as any;
    const feature = role.features?.find((f: any) => f.feature.name === featureName);

    if (!feature) {
      return [];
    }

    return feature.permissions.map((p: any) => p.name);
  }

  adminDashboard(options: AdminDashboardOptions) {
    const express = require('express');
    const { createAdminRouter } = require('./admin/router');
    
    // Create a new router for the admin dashboard
    const dashboardRouter = express.Router();
    
    // Add body parsing middleware first
    dashboardRouter.use(express.json());
    dashboardRouter.use(express.urlencoded({ extended: true }));
    
    // Add authentication middleware
    dashboardRouter.use((req: Request, res: Response, next: NextFunction) => {
      // Basic auth check
      const auth = req.headers.authorization;

      if (!auth) {
        res.setHeader("WWW-Authenticate", 'Basic realm="RBAC Admin"');
        return res.status(401).send("Authentication required");
      }

      const credentials = Buffer.from(auth.split(" ")[1], "base64").toString().split(":");
      const [username, password] = credentials;

      if (username !== options.user || password !== options.pass) {
        return res.status(403).send("Invalid credentials");
      }

      next();
    });
    
    // Mount the admin routes
    const adminRouter = createAdminRouter();
    dashboardRouter.use('/', adminRouter);
    
    return dashboardRouter;
  }

  // Expose controllers for advanced usage
  get controllers() {
    return {
      userRole: userRoleController,
      feature: featureController,
    };
  }
}

export const RBAC = new RBACSystem();
