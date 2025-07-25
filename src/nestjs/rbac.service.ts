import { Injectable, Inject } from '@nestjs/common';
import { CoreRBAC } from '../core';
import { RbacModuleOptions } from './rbac.module';

/**
 * NestJS service that provides RBAC functionality.
 * Wraps the main RBAC system methods for use in NestJS applications.
 * 
 * @example
 * ```typescript
 * @Injectable()
 * export class UserService {
 *   constructor(private rbacService: RbacService) {}
 * 
 *   async createUser(userData: CreateUserDto) {
 *     // Create user in your main database
 *     const user = await this.userRepository.create(userData);
 * 
 *     // Register user in RBAC system
 *     await this.rbacService.registerUser(user.id, {
 *       name: user.name,
 *       email: user.email
 *     });
 * 
 *     return user;
 *   }
 * 
 *   async assignRole(userId: string, roleName: string) {
 *     await this.rbacService.assignRole(userId, roleName);
 *   }
 * 
 *   async checkUserPermissions(userId: string, feature: string) {
 *     return await this.rbacService.getFeaturePermissions(userId, feature);
 *   }
 * }
 * ```
 */
@Injectable()
export class RbacService {
  constructor(
    @Inject('RBAC_CONFIG') private config: RbacModuleOptions,
    @Inject('RBAC_INITIALIZED') private initialized: boolean
  ) {}

  /**
   * Manually register a user in the RBAC system.
   * Useful for programmatic user registration outside of HTTP requests.
   * 
   * @param user_id - Unique identifier for the user
   * @param userData - User data object
   * @returns Promise that resolves when user is registered
   * @throws Error if user already exists or registration fails
   * 
   * @example
   * ```typescript
   * await this.rbacService.registerUser('user123', {
   *   name: 'John Doe',
   *   email: 'john@example.com'
   * });
   * ```
   */
  async registerUser(user_id: string, userData: { name?: string; email?: string }): Promise<void> {
    return await CoreRBAC.registerUserManual(user_id, userData);
  }

  /**
   * Update user information in the RBAC system.
   * 
   * @param user_id - Unique identifier for the user
   * @param userData - User data to update
   * @returns Promise that resolves when user is updated
   * @throws Error if user is not found
   * 
   * @example
   * ```typescript
   * await this.rbacService.updateUser('user123', {
   *   name: 'John Smith',
   *   email: 'johnsmith@example.com'
   * });
   * ```
   */
  async updateUser(user_id: string, userData: { name?: string; email?: string }): Promise<void> {
    return await CoreRBAC.updateUser(user_id, userData);
  }

  /**
   * Assign a role to a user in the RBAC system.
   * 
   * @param user_id - Unique identifier for the user
   * @param roleName - Name of the role to assign
   * @returns Promise that resolves when role is assigned
   * @throws Error if user or role is not found
   * 
   * @example
   * ```typescript
   * await this.rbacService.assignRole('user123', 'admin');
   * ```
   */
  async assignRole(user_id: string, roleName: string): Promise<void> {
    return await CoreRBAC.assignRole(user_id, roleName);
  }

  /**
   * Get the role name assigned to a user.
   * 
   * @param user_id - Unique identifier for the user
   * @returns Promise that resolves to the role name or null if no role assigned
   * 
   * @example
   * ```typescript
   * const role = await this.rbacService.getUserRole('user123');
   * console.log(role); // 'admin' or null
   * ```
   */
  async getUserRole(user_id: string): Promise<string | null> {
    return await CoreRBAC.getUserRole(user_id);
  }

  /**
   * Get all permissions a user has for a specific feature.
   * 
   * @param user_id - Unique identifier for the user
   * @param featureName - Name of the feature to check permissions for
   * @returns Promise that resolves to an array of permission names
   * 
   * @example
   * ```typescript
   * const permissions = await this.rbacService.getFeaturePermissions('user123', 'billing');
   * console.log(permissions); // ['read', 'create', 'update']
   * ```
   */
  async getFeaturePermissions(user_id: string, featureName: string): Promise<string[]> {
    return await CoreRBAC.getFeaturePermissions(user_id, featureName);
  }

  /**
   * Check if a user has a specific permission for a feature.
   * 
   * @param user_id - Unique identifier for the user
   * @param feature - Feature name
   * @param permission - Permission name
   * @returns Promise that resolves to boolean indicating if user has permission
   * 
   * @example
   * ```typescript
   * const canDelete = await this.rbacService.hasPermission('user123', 'billing', 'delete');
   * if (canDelete) {
   *   // User can delete billing records
   * }
   * ```
   */
  async hasPermission(user_id: string, feature: string, permission: string): Promise<boolean> {
    const permissions = await this.getFeaturePermissions(user_id, feature);
    return permissions.includes(permission);
  }

  /**
   * Get access to the underlying RBAC controllers for advanced operations.
   * 
   * @returns Object containing controller instances
   * 
   * @example
   * ```typescript
   * const { userRole, feature } = this.rbacService.getControllers();
   * const allRoles = await userRole.getAllRoles();
   * const allFeatures = await feature.getAllFeatures();
   * ```
   */
  getControllers() {
    // Note: Controllers are Express-specific, not available in NestJS-only mode
    throw new Error('Controllers are not available in NestJS-only mode. Use the service methods instead.');
  }
}