import { Request } from "express";
import { Connection } from "mongoose";

/**
 * Configuration object for initializing the RBAC system.
 */
export interface RBACConfig {
  /** MongoDB connection instance */
  db: Connection;
  /** Function to extract user identity from Express request */
  authAdapter?: (req: Request) => Promise<{ user_id: string; email?: string }> | { user_id: string; email?: string };
  /** Hook called when a new user is registered */
  onUserRegister?: (user: { user_id: string; name?: string; email?: string }) => void | Promise<void>;
  /** Hook called when a user's role is updated */
  onRoleUpdate?: (payload: { user_id: string; role: string }) => void | Promise<void>;
  /** Default role name to assign to new users automatically */
  defaultRole?: string;
}

/**
 * Options for explicitly specifying feature and permission in checkPermissions middleware.
 * If not provided, feature and permission will be auto-inferred from the request.
 */
export interface PermissionCheckOptions {
  /** Name of the feature/module to check access for */
  feature?: string;
  /** Type of permission required (read, create, update, delete, sudo) */
  permission?: string;
}

/**
 * Function type for extracting user data from Express request during registration.
 */
export interface UserExtractor {
  /** Extract user data from request object */
  (req: Request): { user_id: string; name?: string; email?: string };
}

/**
 * Options for the registerUser middleware.
 */
export interface RegisterUserOptions {
  /** Custom function to extract user data from the request */
  userExtractor?: UserExtractor;
}

/**
 * Configuration options for the admin dashboard.
 */
export interface AdminDashboardOptions {
  /** Admin username for dashboard authentication */
  user: string;
  /** Admin password for dashboard authentication */
  pass: string;
  /** Theme configuration (reserved for future use) */
  theme?: string;
  /** Secret key for session encryption and security */
  sessionSecret?: string;
  /** Custom name for the session cookie */
  sessionName?: string;
}

/**
 * Represents a user reference in the RBAC system.
 * This is a lightweight reference, not the full user object from your main application.
 */
export interface UserReference {
  /** Unique identifier for the user */
  user_id: string;
  /** Display name of the user */
  name?: string;
  /** Email address of the user */
  email?: string;
  /** Currently assigned role name */
  role?: string;
}