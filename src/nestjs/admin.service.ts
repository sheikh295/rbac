import { Injectable, Inject } from '@nestjs/common';
import { DatabaseAdapter } from '../adapters/DatabaseAdapter';
import { RbacModuleOptions } from './rbac.module';

/**
 * Admin service interface for defining user data structure
 */
export interface UserData {
  user_id: string;
  name?: string;
  email?: string;
  role_id?: string;
}

/**
 * Admin service interface for defining role data structure
 */
export interface RoleData {
  name: string;
  description?: string;
}

/**
 * Admin service interface for defining feature data structure
 */
export interface FeatureData {
  name: string;
  description?: string;
}

/**
 * Admin service interface for defining permission data structure
 */
export interface PermissionData {
  name: string;
  description?: string;
}

/**
 * Admin service interface for dashboard statistics
 */
export interface DashboardStats {
  users: number;
  roles: number;
  features: number;
  permissions: number;
}

/**
 * NestJS Admin Service for RBAC Dashboard
 * Provides business logic for the admin dashboard operations.
 * Handles all database operations through the DatabaseAdapter.
 * 
 * Features:
 * - User management (CRUD operations)
 * - Role management with feature assignments
 * - Feature and permission management
 * - Dashboard statistics
 * - Admin authentication validation
 * 
 * @example
 * ```typescript
 * @Injectable()
 * export class MyAdminService {
 *   constructor(private adminService: RbacAdminService) {}
 * 
 *   async getAdminStats() {
 *     return await this.adminService.getDashboardStats();
 *   }
 * 
 *   async manageUsers() {
 *     const users = await this.adminService.getAllUsers(10, 0, '');
 *     return users;
 *   }
 * }
 * ```
 */
@Injectable()
export class RbacAdminService {
  private dbAdapter: DatabaseAdapter;
  private adminCredentials: { username: string; password: string };

  constructor(
    @Inject('RBAC_CONFIG') private config: RbacModuleOptions,
    @Inject('RBAC_DB_ADAPTER') dbAdapter: DatabaseAdapter,
    @Inject('RBAC_ADMIN_CONFIG') adminConfig: { 
      adminCredentials: { username: string; password: string };
      sessionSecret: string;
    }
  ) {
    this.dbAdapter = dbAdapter;
    this.adminCredentials = adminConfig.adminCredentials;
  }

  // =====================================
  // AUTHENTICATION METHODS
  // =====================================

  /**
   * Validate admin credentials for authentication
   * @param username - Admin username
   * @param password - Admin password
   * @returns Promise<boolean> - True if credentials are valid
   */
  async validateAdmin(username: string, password: string): Promise<boolean> {
    return (
      username === this.adminCredentials.username &&
      password === this.adminCredentials.password
    );
  }

  // =====================================
  // DASHBOARD STATISTICS
  // =====================================

  /**
   * Get dashboard statistics including counts of users, roles, features, and permissions
   * @returns Promise<DashboardStats> - Dashboard statistics object
   */
  async getDashboardStats(): Promise<DashboardStats> {
    return await this.dbAdapter.getDashboardStats();
  }

  // =====================================
  // USER MANAGEMENT METHODS
  // =====================================

  /**
   * Get all users with pagination and search functionality
   * @param limit - Number of users per page
   * @param skip - Number of users to skip (for pagination)
   * @param search - Search query for filtering users
   * @returns Promise with users array and total count
   */
  async getAllUsers(
    limit: number, 
    skip: number, 
    search: string = ''
  ): Promise<{ items: any[]; total: number }> {
    return await this.dbAdapter.getAllUsers(limit, skip, search);
  }

  /**
   * Find user by user ID
   * @param userId - Unique user identifier
   * @returns Promise<any | null> - User object or null if not found
   */
  async findUserByUserId(userId: string): Promise<any | null> {
    return await this.dbAdapter.findUserByUserId(userId);
  }

  /**
   * Find user by user ID with role information
   * @param userId - Unique user identifier
   * @returns Promise<any | null> - User object with role or null if not found
   */
  async findUserByUserIdWithRole(userId: string): Promise<any | null> {
    return await this.dbAdapter.findUserByUserIdWithRole(userId);
  }

  /**
   * Create a new user in the RBAC system
   * @param userData - User data object
   * @returns Promise<any> - Created user object
   */
  async createUser(userData: UserData): Promise<any> {
    const dbUserData = {
      ...userData,
      name: userData.name || '',
      email: userData.email || ''
    };
    return await this.dbAdapter.createUser(dbUserData);
  }

  /**
   * Update user information
   * @param userId - Unique user identifier
   * @param updateData - Data to update
   * @returns Promise<any> - Updated user object
   */
  async updateUser(userId: string, updateData: Partial<UserData>): Promise<any> {
    return await this.dbAdapter.updateUser(userId, updateData);
  }

  /**
   * Delete user from the RBAC system
   * @param userId - Unique user identifier
   * @returns Promise<void>
   */
  async deleteUser(userId: string): Promise<void> {
    return await this.dbAdapter.deleteUser(userId);
  }

  // =====================================
  // ROLE MANAGEMENT METHODS
  // =====================================

  /**
   * Get all roles in the system
   * @returns Promise with roles array and total count
   */
  async getAllRoles(): Promise<{ items: any[]; total: number }> {
    return await this.dbAdapter.getAllRoles();
  }

  /**
   * Find role by name
   * @param roleName - Role name
   * @returns Promise<any | null> - Role object or null if not found
   */
  async findRoleByName(roleName: string): Promise<any | null> {
    return await this.dbAdapter.findRoleByName(roleName);
  }

  /**
   * Find role by ID with associated features
   * @param roleId - Role identifier
   * @returns Promise<any | null> - Role object with features or null if not found
   */
  async findRoleByIdWithFeatures(roleId: string): Promise<any | null> {
    return await this.dbAdapter.findRoleByIdWithFeatures(roleId);
  }

  /**
   * Create a new role
   * @param roleData - Role data object
   * @returns Promise<any> - Created role object
   */
  async createRole(roleData: RoleData): Promise<any> {
    const dbRoleData = {
      ...roleData,
      description: roleData.description || ''
    };
    return await this.dbAdapter.createRole(dbRoleData);
  }

  /**
   * Update role information
   * @param roleId - Role identifier
   * @param updateData - Data to update
   * @returns Promise<any> - Updated role object
   */
  async updateRole(roleId: string, updateData: Partial<RoleData>): Promise<any> {
    return await this.dbAdapter.updateRole(roleId, updateData);
  }

  /**
   * Delete role from the system
   * @param roleId - Role identifier
   * @returns Promise<void>
   */
  async deleteRole(roleId: string): Promise<void> {
    return await this.dbAdapter.deleteRole(roleId);
  }

  /**
   * Assign features and permissions to a role
   * @param roleId - Role identifier
   * @param featurePermissions - Array of feature-permission mappings
   * @returns Promise<void>
   */
  async assignRoleFeaturePermissions(
    roleId: string, 
    featurePermissions: Array<{ feature_id: string; permission_ids: string[] }>
  ): Promise<void> {
    return await this.dbAdapter.assignRoleFeaturePermissions(roleId, featurePermissions);
  }

  // =====================================
  // FEATURE MANAGEMENT METHODS
  // =====================================

  /**
   * Get all features in the system
   * @returns Promise with features array and total count
   */
  async getAllFeatures(): Promise<{ items: any[]; total: number }> {
    return await this.dbAdapter.getAllFeatures();
  }

  /**
   * Find feature by name
   * @param featureName - Feature name
   * @returns Promise<any | null> - Feature object or null if not found
   */
  async findFeatureByName(featureName: string): Promise<any | null> {
    return await this.dbAdapter.findFeatureByName(featureName);
  }

  /**
   * Find feature by ID
   * @param featureId - Feature identifier
   * @returns Promise<any | null> - Feature object or null if not found
   */
  async findFeatureById(featureId: string): Promise<any | null> {
    return await this.dbAdapter.findFeatureById(featureId);
  }

  /**
   * Create a new feature
   * @param featureData - Feature data object
   * @returns Promise<any> - Created feature object
   */
  async createFeature(featureData: FeatureData): Promise<any> {
    const dbFeatureData = {
      ...featureData,
      description: featureData.description || ''
    };
    return await this.dbAdapter.createFeature(dbFeatureData);
  }

  /**
   * Update feature information
   * @param featureId - Feature identifier
   * @param updateData - Data to update
   * @returns Promise<any> - Updated feature object
   */
  async updateFeature(featureId: string, updateData: Partial<FeatureData>): Promise<any> {
    return await this.dbAdapter.updateFeature(featureId, updateData);
  }

  /**
   * Delete feature from the system
   * @param featureId - Feature identifier
   * @returns Promise<void>
   */
  async deleteFeature(featureId: string): Promise<void> {
    return await this.dbAdapter.deleteFeature(featureId);
  }

  // =====================================
  // PERMISSION MANAGEMENT METHODS
  // =====================================

  /**
   * Get all permissions in the system
   * @returns Promise with permissions array and total count
   */
  async getAllPermissions(): Promise<{ items: any[]; total: number }> {
    return await this.dbAdapter.getAllPermissions();
  }

  /**
   * Find permission by name
   * @param permissionName - Permission name
   * @returns Promise<any | null> - Permission object or null if not found
   */
  async findPermissionByName(permissionName: string): Promise<any | null> {
    return await this.dbAdapter.findPermissionByName(permissionName);
  }

  /**
   * Find permission by ID
   * @param permissionId - Permission identifier
   * @returns Promise<any | null> - Permission object or null if not found
   */
  async findPermissionById(permissionId: string): Promise<any | null> {
    return await this.dbAdapter.findPermissionById(permissionId);
  }

  /**
   * Create a new permission
   * @param permissionData - Permission data object
   * @returns Promise<any> - Created permission object
   */
  async createPermission(permissionData: PermissionData): Promise<any> {
    const dbPermissionData = {
      ...permissionData,
      description: permissionData.description || ''
    };
    return await this.dbAdapter.createPermission(dbPermissionData);
  }

  /**
   * Update permission information
   * @param permissionId - Permission identifier  
   * @param updateData - Data to update
   * @returns Promise<any> - Updated permission object
   */
  async updatePermission(permissionId: string, updateData: Partial<PermissionData>): Promise<any> {
    return await this.dbAdapter.updatePermission(permissionId, updateData);
  }

  /**
   * Delete permission from the system
   * @param permissionId - Permission identifier
   * @returns Promise<void>
   */
  async deletePermission(permissionId: string): Promise<void> {
    return await this.dbAdapter.deletePermission(permissionId);
  }

  // =====================================
  // UTILITY METHODS
  // =====================================

  /**
   * Get the underlying database adapter for advanced operations
   * @returns DatabaseAdapter - The database adapter instance
   */
  getDbAdapter(): DatabaseAdapter {
    return this.dbAdapter;
  }

  /**
   * Check if the admin service is properly configured and initialized
   * @returns boolean - True if service is ready
   */
  isReady(): boolean {
    return !!(this.dbAdapter && this.adminCredentials);
  }
}