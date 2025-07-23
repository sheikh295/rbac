import { Pool } from 'pg';
import { DatabaseAdapter, DatabaseUser, DatabaseRole, DatabaseFeature, DatabasePermission, FeaturePermissions, PaginatedResult } from './DatabaseAdapter';
import { PostgresUser } from '../postgres/models/User';
import { PostgresUserRole } from '../postgres/models/UserRole';
import { PostgresFeature } from '../postgres/models/Feature';
import { PostgresPermission } from '../postgres/models/Permission';
import * as fs from 'fs';
import * as path from 'path';

export class PostgresAdapter extends DatabaseAdapter {
  private userModel: PostgresUser;
  private roleModel: PostgresUserRole;
  private featureModel: PostgresFeature;
  private permissionModel: PostgresPermission;

  constructor(private pool: Pool) {
    super();
    this.userModel = new PostgresUser(pool);
    this.roleModel = new PostgresUserRole(pool);
    this.featureModel = new PostgresFeature(pool);
    this.permissionModel = new PostgresPermission(pool);
  }

  async init(): Promise<void> {
    // Run schema initialization
    await this.initializeSchema();
    await this.createStandardPermissions();
  }

  private async initializeSchema(): Promise<void> {
    // Inline schema to avoid file path issues
    const schema = `
      -- RBAC PostgreSQL Schema
      CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

      -- RbacPermissions table
      CREATE TABLE IF NOT EXISTS rbac_permissions (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          name VARCHAR(100) NOT NULL UNIQUE,
          description TEXT NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      -- RbacFeatures table
      CREATE TABLE IF NOT EXISTS rbac_features (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          name VARCHAR(100) NOT NULL UNIQUE,
          description TEXT NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      -- RbacRoles table
      CREATE TABLE IF NOT EXISTS rbac_roles (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          name VARCHAR(100) NOT NULL UNIQUE,
          description TEXT NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      -- RbacUsers table
      CREATE TABLE IF NOT EXISTS rbac_users (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          user_id VARCHAR(255) NOT NULL UNIQUE,
          name VARCHAR(255) NOT NULL,
          email VARCHAR(255) NOT NULL UNIQUE,
          role_id UUID REFERENCES rbac_roles(id) ON DELETE SET NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      -- Junction table for role-feature-permissions
      CREATE TABLE IF NOT EXISTS rbac_role_feature_permissions (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          role_id UUID NOT NULL REFERENCES rbac_roles(id) ON DELETE CASCADE,
          feature_id UUID NOT NULL REFERENCES rbac_features(id) ON DELETE CASCADE,
          permission_id UUID NOT NULL REFERENCES rbac_permissions(id) ON DELETE CASCADE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(role_id, feature_id, permission_id)
      );

      -- Indexes for performance
      CREATE INDEX IF NOT EXISTS idx_rbac_users_user_id ON rbac_users(user_id);
      CREATE INDEX IF NOT EXISTS idx_rbac_users_email ON rbac_users(email);
      CREATE INDEX IF NOT EXISTS idx_rbac_users_role_id ON rbac_users(role_id);
      CREATE INDEX IF NOT EXISTS idx_rbac_role_feature_permissions_role_id ON rbac_role_feature_permissions(role_id);
      CREATE INDEX IF NOT EXISTS idx_rbac_role_feature_permissions_feature_id ON rbac_role_feature_permissions(feature_id);
      CREATE INDEX IF NOT EXISTS idx_rbac_permissions_name ON rbac_permissions(name);
      CREATE INDEX IF NOT EXISTS idx_rbac_features_name ON rbac_features(name);
      CREATE INDEX IF NOT EXISTS idx_rbac_roles_name ON rbac_roles(name);

      -- Update trigger function
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
          NEW.updated_at = CURRENT_TIMESTAMP;
          RETURN NEW;
      END;
      $$ language 'plpgsql';

      -- Apply update triggers
      DROP TRIGGER IF EXISTS update_rbac_permissions_updated_at ON rbac_permissions;
      CREATE TRIGGER update_rbac_permissions_updated_at BEFORE UPDATE ON rbac_permissions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
      
      DROP TRIGGER IF EXISTS update_rbac_features_updated_at ON rbac_features;
      CREATE TRIGGER update_rbac_features_updated_at BEFORE UPDATE ON rbac_features FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
      
      DROP TRIGGER IF EXISTS update_rbac_roles_updated_at ON rbac_roles;
      CREATE TRIGGER update_rbac_roles_updated_at BEFORE UPDATE ON rbac_roles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
      
      DROP TRIGGER IF EXISTS update_rbac_users_updated_at ON rbac_users;
      CREATE TRIGGER update_rbac_users_updated_at BEFORE UPDATE ON rbac_users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
      
      DROP TRIGGER IF EXISTS update_rbac_role_feature_permissions_updated_at ON rbac_role_feature_permissions;
      CREATE TRIGGER update_rbac_role_feature_permissions_updated_at BEFORE UPDATE ON rbac_role_feature_permissions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

      -- Insert standard permissions
      INSERT INTO rbac_permissions (name, description) VALUES
          ('read', 'View and access resources'),
          ('create', 'Add new resources'),
          ('update', 'Modify existing resources'),
          ('delete', 'Remove resources'),
          ('sudo', 'Full administrative access')
      ON CONFLICT (name) DO NOTHING;
    `;
    
    await this.pool.query(schema);
  }

  async createStandardPermissions(): Promise<void> {
    await this.permissionModel.createStandard();
  }

  // User operations
  async createUser(userData: DatabaseUser): Promise<DatabaseUser> {
    return await this.userModel.create(userData);
  }

  async findUserByUserId(user_id: string): Promise<DatabaseUser | null> {
    return await this.userModel.findByUserId(user_id);
  }

  async findUserByUserIdWithRole(user_id: string): Promise<DatabaseUser | null> {
    return await this.userModel.findByUserIdWithRole(user_id);
  }

  async updateUser(user_id: string, updates: Partial<DatabaseUser>): Promise<void> {
    await this.userModel.update(user_id, updates);
  }

  async deleteUser(user_id: string): Promise<void> {
    await this.userModel.delete(user_id);
  }

  async getAllUsers(limit?: number, offset?: number, search?: string): Promise<PaginatedResult<DatabaseUser>> {
    const result = await this.userModel.getAll(limit, offset, search);
    return { items: result.users, total: result.total };
  }

  // Role operations
  async createRole(roleData: DatabaseRole): Promise<DatabaseRole> {
    return await this.roleModel.create(roleData);
  }

  async findRoleByName(name: string): Promise<DatabaseRole | null> {
    return await this.roleModel.findByName(name);
  }

  async findRoleById(id: string): Promise<DatabaseRole | null> {
    return await this.roleModel.findById(id);
  }

  async findRoleByIdWithFeatures(id: string): Promise<DatabaseRole | null> {
    return await this.roleModel.findByIdWithFeatures(id);
  }

  async updateRole(id: string, updates: Partial<DatabaseRole>): Promise<void> {
    await this.roleModel.update(id, updates);
  }

  async deleteRole(id: string): Promise<void> {
    await this.roleModel.delete(id);
  }

  async assignRoleFeaturePermissions(roleId: string, featurePermissions: FeaturePermissions[]): Promise<void> {
    await this.roleModel.assignFeaturePermissions(roleId, featurePermissions);
  }

  async getAllRoles(limit?: number, offset?: number): Promise<PaginatedResult<DatabaseRole>> {
    const result = await this.roleModel.getAll(limit, offset);
    return { items: result.roles, total: result.total };
  }

  // Feature operations
  async createFeature(featureData: DatabaseFeature): Promise<DatabaseFeature> {
    return await this.featureModel.create(featureData);
  }

  async findFeatureByName(name: string): Promise<DatabaseFeature | null> {
    return await this.featureModel.findByName(name);
  }

  async findFeatureById(id: string): Promise<DatabaseFeature | null> {
    return await this.featureModel.findById(id);
  }

  async updateFeature(id: string, updates: Partial<DatabaseFeature>): Promise<void> {
    await this.featureModel.update(id, updates);
  }

  async deleteFeature(id: string): Promise<void> {
    await this.featureModel.delete(id);
  }

  async getAllFeatures(limit?: number, offset?: number): Promise<PaginatedResult<DatabaseFeature>> {
    const result = await this.featureModel.getAll(limit, offset);
    return { items: result.features, total: result.total };
  }

  // Permission operations
  async createPermission(permissionData: DatabasePermission): Promise<DatabasePermission> {
    return await this.permissionModel.create(permissionData);
  }

  async findPermissionByName(name: string): Promise<DatabasePermission | null> {
    return await this.permissionModel.findByName(name);
  }

  async findPermissionById(id: string): Promise<DatabasePermission | null> {
    return await this.permissionModel.findById(id);
  }

  async updatePermission(id: string, updates: Partial<DatabasePermission>): Promise<void> {
    await this.permissionModel.update(id, updates);
  }

  async deletePermission(id: string): Promise<void> {
    await this.permissionModel.delete(id);
  }

  async getAllPermissions(limit?: number, offset?: number): Promise<PaginatedResult<DatabasePermission>> {
    const result = await this.permissionModel.getAll(limit, offset);
    return { items: result.permissions, total: result.total };
  }

  async getUserFeaturePermissions(user_id: string, featureName: string): Promise<string[]> {
    const user = await this.userModel.findByUserIdWithRole(user_id);

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

  async getDashboardStats(): Promise<{ users: number; roles: number; features: number; permissions: number }> {
    const queries = [
      'SELECT COUNT(*) FROM rbac_users',
      'SELECT COUNT(*) FROM rbac_roles',
      'SELECT COUNT(*) FROM rbac_features',
      'SELECT COUNT(*) FROM rbac_permissions'
    ];

    const results = await Promise.all(queries.map(query => this.pool.query(query)));

    return {
      users: parseInt(results[0].rows[0].count),
      roles: parseInt(results[1].rows[0].count),
      features: parseInt(results[2].rows[0].count),
      permissions: parseInt(results[3].rows[0].count)
    };
  }
}