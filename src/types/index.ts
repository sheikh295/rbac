// Optional Express types - only available if Express is installed
type ExpressRequest = any;

import { Connection } from "mongoose";
import { Pool } from "pg";

/**
 * Supported database types for the RBAC system.
 */
export type DatabaseType = 'mongodb' | 'postgresql';

/**
 * Database configuration for MongoDB.
 */
export interface MongoDBConfig {
  /** Database type identifier */
  type: 'mongodb';
  /** MongoDB connection instance */
  connection: Connection;
}

/**
 * Database configuration for PostgreSQL.
 */
export interface PostgreSQLConfig {
  /** Database type identifier */
  type: 'postgresql';
  /** PostgreSQL connection pool instance */
  connection: Pool;
}

/**
 * Union type for all supported database configurations.
 */
export type DatabaseConfig = MongoDBConfig | PostgreSQLConfig;

/**
 * Configuration object for initializing the RBAC system.
 */
export interface RBACConfig {
  /** Database configuration object */
  database: DatabaseConfig;
  /** Function to extract user identity from Express request or NestJS ExecutionContext */
  authAdapter?: (req: ExpressRequest | any) => Promise<{ user_id: string; email?: string }> | { user_id: string; email?: string };
  /** Hook called when a new user is registered */
  onUserRegister?: (user: { user_id: string; name?: string; email?: string }) => void | Promise<void>;
  /** Hook called when a user's role is updated */
  onRoleUpdate?: (payload: { user_id: string; role: string }) => void | Promise<void>;
  /** Default role name to assign to new users automatically */
  defaultRole?: string;

  /** @deprecated Use database.connection instead */
  db?: Connection;
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
  (req: ExpressRequest): { user_id: string; name?: string; email?: string };
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

// NestJS-specific types

/**
 * Configuration options for NestJS RBAC decorators.
 */
export interface NestJSPermissionOptions {
  /** Name of the feature/module to check access for */
  feature?: string;
  /** Type of permission required (read, create, update, delete, sudo) */
  permission?: string;
}

/**
 * Configuration options for NestJS user registration decorator.
 */
export interface NestJSRegisterUserOptions {
  /** Custom function to extract user data from request body and user context */
  userExtractor?: (body: any, user?: any) => {
    user_id: string;
    name?: string;
    email?: string;
  };
}

// GraphQL-specific types

/**
 * Configuration options for GraphQL auth directive.
 */
export interface GraphQLAuthDirectiveArgs {
  /** Name of the feature/module to check access for */
  feature?: string;
  /** Type of permission required (read, create, update, delete, sudo) */
  permission?: string;
}

/**
 * Configuration options for GraphQL register user directive.
 */
export interface GraphQLRegisterUserDirectiveArgs {
  /** Field name containing user ID (default: 'id') */
  userIdField?: string;
  /** Field name containing user name (default: 'name') */
  nameField?: string;
  /** Field name containing user email (default: 'email') */
  emailField?: string;
}

/**
 * GraphQL context type for user identity extraction.
 */
export interface GraphQLUserContext {
  /** User information attached to GraphQL context */
  user?: {
    id?: string;
    user_id?: string;
    email?: string;
    [key: string]: any;
  };
  /** Express request object (if available) */
  req?: ExpressRequest;
  /** Alternative request object name */
  request?: ExpressRequest;
  /** Direct user ID attachment */
  user_id?: string;
  /** Direct user ID attachment (alternative) */
  userId?: string;
  /** Direct email attachment */
  email?: string;
  /** RBAC user info (attached by register directive) */
  rbacUser?: {
    user_id: string;
    name?: string;
    email?: string;
  };
}