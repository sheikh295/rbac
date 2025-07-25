/**
 * @fileoverview Core RBAC functionality without Express dependencies
 * 
 * This module provides the core RBAC functionality that works with any framework,
 * including the database operations and user management without Express middleware.
 */

import { RBACConfig } from './types';
import { DatabaseAdapter } from './adapters/DatabaseAdapter';
import { MongoAdapter } from './adapters/MongoAdapter';
import { PostgresAdapter } from './adapters/PostgresAdapter';

/**
 * Core RBAC system without Express dependencies.
 * Provides database operations and user management for any framework.
 */
class CoreRBACSystem {
  private _config: RBACConfig | null = null;
  private _initialized = false;
  private _dbAdapter: DatabaseAdapter | null = null;

  /**
   * Initialize the RBAC system with the provided configuration.
   */
  async init(config: RBACConfig): Promise<void> {
    this._config = config;
    
    // Handle legacy configuration format
    if ((config as any).db && !config.database) {
      config.database = {
        type: 'mongodb',
        connection: (config as any).db
      };
    }

    // Initialize database adapter based on configuration
    if (config.database) {
      switch (config.database.type) {
        case 'mongodb':
          this._dbAdapter = new MongoAdapter(config.database.connection);
          break;
        case 'postgresql':
          this._dbAdapter = new PostgresAdapter(config.database.connection);
          break;
        default:
          throw new Error(`Unsupported database type: ${(config.database as any).type}`);
      }

      await this._dbAdapter.init();
    } else {
      throw new Error("Database configuration is required. Please provide either 'database' or 'db' in config.");
    }

    this._initialized = true;
  }

  private ensureInitialized(): void {
    if (!this._initialized || !this._config || !this._dbAdapter) {
      throw new Error("RBAC system not initialized. Call CoreRBAC.init(config) first.");
    }
  }

  /**
   * Manually register a user in the RBAC system.
   */
  async registerUserManual(user_id: string, userData: { name?: string; email?: string }): Promise<void> {
    this.ensureInitialized();

    const existingUser = await this._dbAdapter!.findUserByUserId(user_id);
    if (existingUser) {
      throw new Error("User already exists");
    }

    let defaultRoleId = undefined;
    if (this._config!.defaultRole) {
      const role = await this._dbAdapter!.findRoleByName(this._config!.defaultRole);
      if (role) {
        defaultRoleId = role.id;
      }
    }

    await this._dbAdapter!.createUser({
      user_id,
      name: userData.name || "",
      email: userData.email || "",
      role_id: defaultRoleId,
    });

    if (this._config!.onUserRegister) {
      await this._config!.onUserRegister({ user_id, ...userData });
    }
  }

  /**
   * Update user information in the RBAC system.
   */
  async updateUser(user_id: string, userData: { name?: string; email?: string }): Promise<void> {
    this.ensureInitialized();

    const user = await this._dbAdapter!.findUserByUserId(user_id);
    if (!user) {
      throw new Error("User not found");
    }

    const updates: any = {};
    if (userData.name !== undefined) updates.name = userData.name;
    if (userData.email !== undefined) updates.email = userData.email;

    await this._dbAdapter!.updateUser(user_id, updates);
  }

  /**
   * Assign a role to a user in the RBAC system.
   */
  async assignRole(user_id: string, roleName: string): Promise<void> {
    this.ensureInitialized();

    const user = await this._dbAdapter!.findUserByUserId(user_id);
    if (!user) {
      throw new Error("User not found");
    }

    const role = await this._dbAdapter!.findRoleByName(roleName);
    if (!role) {
      throw new Error("Role not found");
    }

    await this._dbAdapter!.updateUser(user_id, { role_id: role.id });

    if (this._config!.onRoleUpdate) {
      await this._config!.onRoleUpdate({ user_id, role: roleName });
    }
  }

  /**
   * Get the role name assigned to a user.
   */
  async getUserRole(user_id: string): Promise<string | null> {
    this.ensureInitialized();

    const user = await this._dbAdapter!.findUserByUserIdWithRole(user_id);
    if (!user || !user.role) {
      return null;
    }

    return (user.role as any).name;
  }

  /**
   * Get all permissions a user has for a specific feature.
   */
  async getFeaturePermissions(user_id: string, featureName: string): Promise<string[]> {
    this.ensureInitialized();

    return await this._dbAdapter!.getUserFeaturePermissions(user_id, featureName);
  }

  /**
   * Get access to the database adapter for advanced operations.
   */
  get dbAdapter(): DatabaseAdapter | null {
    return this._dbAdapter;
  }

  /**
   * Get configuration
   */
  get config(): RBACConfig | null {
    return this._config;
  }

  /**
   * Check if system is initialized
   */
  get initialized(): boolean {
    return this._initialized;
  }
}

/**
 * Core RBAC instance for framework-agnostic usage
 */
export const CoreRBAC = new CoreRBACSystem();