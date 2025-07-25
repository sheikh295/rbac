// Express types removed - DatabaseAdapter should be framework-agnostic

export interface DatabaseUser {
  id?: string;
  user_id: string;
  name: string;
  email: string;
  role_id?: string;
  role?: any;
  created_at?: Date;
  updated_at?: Date;
}

export interface DatabaseRole {
  id?: string;
  name: string;
  description: string;
  features?: any[];
  created_at?: Date;
  updated_at?: Date;
}

export interface DatabaseFeature {
  id?: string;
  name: string;
  description: string;
  created_at?: Date;
  updated_at?: Date;
}

export interface DatabasePermission {
  id?: string;
  name: string;
  description: string;
  created_at?: Date;
  updated_at?: Date;
}

export interface FeaturePermissions {
  feature_id: string;
  permission_ids: string[];
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
}

/**
 * Abstract database adapter interface that all database implementations must follow.
 * This allows the RBAC system to work with different databases (MongoDB, PostgreSQL, etc.)
 */
export abstract class DatabaseAdapter {
  /**
   * Initialize the database connection and create standard permissions
   */
  abstract init(): Promise<void>;

  /**
   * Create standard RBAC permissions if they don't exist
   */
  abstract createStandardPermissions(): Promise<void>;

  // User operations
  abstract createUser(userData: DatabaseUser): Promise<DatabaseUser>;
  abstract findUserByUserId(user_id: string): Promise<DatabaseUser | null>;
  abstract findUserByUserIdWithRole(user_id: string): Promise<DatabaseUser | null>;
  abstract updateUser(user_id: string, updates: Partial<DatabaseUser>): Promise<void>;
  abstract deleteUser(user_id: string): Promise<void>;
  abstract getAllUsers(limit?: number, offset?: number, search?: string): Promise<PaginatedResult<DatabaseUser>>;

  // Role operations
  abstract createRole(roleData: DatabaseRole): Promise<DatabaseRole>;
  abstract findRoleByName(name: string): Promise<DatabaseRole | null>;
  abstract findRoleById(id: string): Promise<DatabaseRole | null>;
  abstract findRoleByIdWithFeatures(id: string): Promise<DatabaseRole | null>;
  abstract updateRole(id: string, updates: Partial<DatabaseRole>): Promise<void>;
  abstract deleteRole(id: string): Promise<void>;
  abstract assignRoleFeaturePermissions(roleId: string, featurePermissions: FeaturePermissions[]): Promise<void>;
  abstract getAllRoles(limit?: number, offset?: number): Promise<PaginatedResult<DatabaseRole>>;

  // Feature operations
  abstract createFeature(featureData: DatabaseFeature): Promise<DatabaseFeature>;
  abstract findFeatureByName(name: string): Promise<DatabaseFeature | null>;
  abstract findFeatureById(id: string): Promise<DatabaseFeature | null>;
  abstract updateFeature(id: string, updates: Partial<DatabaseFeature>): Promise<void>;
  abstract deleteFeature(id: string): Promise<void>;
  abstract getAllFeatures(limit?: number, offset?: number): Promise<PaginatedResult<DatabaseFeature>>;

  // Permission operations
  abstract createPermission(permissionData: DatabasePermission): Promise<DatabasePermission>;
  abstract findPermissionByName(name: string): Promise<DatabasePermission | null>;
  abstract findPermissionById(id: string): Promise<DatabasePermission | null>;
  abstract updatePermission(id: string, updates: Partial<DatabasePermission>): Promise<void>;
  abstract deletePermission(id: string): Promise<void>;
  abstract getAllPermissions(limit?: number, offset?: number): Promise<PaginatedResult<DatabasePermission>>;

  // Utility methods
  abstract getUserFeaturePermissions(user_id: string, featureName: string): Promise<string[]>;
  abstract getDashboardStats(): Promise<{
    users: number;
    roles: number;
    features: number;
    permissions: number;
  }>;
}