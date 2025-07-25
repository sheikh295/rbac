import { RBAC } from '../../RBAC';

export interface User {
  id: string;
  user_id: string;
  name: string;
  email: string;
  role?: Role;
}

export interface Role {
  id: string;
  name: string;
  features?: FeaturePermission[];
}

export interface Feature {
  id: string;
  name: string;
  permissions?: Permission[];
}

export interface Permission {
  id: string;
  name: string;
}

export interface FeaturePermission {
  feature: Feature;
  permissions: Permission[];
}

export interface CreateUserInput {
  user_id: string;
  name?: string;
  email?: string;
  role_id?: string;
}

export interface UpdateUserInput {
  name?: string;
  email?: string;
}

export interface CreateRoleInput {
  name: string;
  features?: FeaturePermissionInput[];
}

export interface FeaturePermissionInput {
  feature_id: string;
  permission_ids: string[];
}

export interface CreateFeatureInput {
  name: string;
}

export interface CreatePermissionInput {
  name: string;
}

/**
 * GraphQL resolvers for RBAC operations.
 * Provides full CRUD operations for users, roles, features, and permissions.
 * 
 * @example
 * Usage with Apollo Server:
 * const server = new ApolloServer({ typeDefs, resolvers: rbacResolvers, ... });
 */
export const rbacResolvers = {
  Query: {
    /**
     * Get all users with pagination support
     */
    async users(_: any, args: { page?: number; limit?: number; search?: string }) {
      const { page = 1, limit = 10, search } = args;
      
      if (!RBAC['dbAdapter']) {
        throw new Error('RBAC system not initialized');
      }

      const offset = (page - 1) * limit;
      const result = await RBAC['dbAdapter'].getAllUsers(limit, offset, search);

      return {
        data: result.items,
        pagination: {
          page,
          limit,
          total: result.total,
          pages: Math.ceil(result.total / limit)
        }
      };
    },

    /**
     * Get user by ID
     */
    async user(_: any, args: { user_id: string }) {
      if (!RBAC['dbAdapter']) {
        throw new Error('RBAC system not initialized');
      }

      return await RBAC['dbAdapter'].findUserByUserIdWithRole(args.user_id);
    },

    /**
     * Get all roles
     */
    async roles() {
      if (!RBAC['dbAdapter']) {
        throw new Error('RBAC system not initialized');
      }

      const result = await RBAC['dbAdapter'].getAllRoles();
      return result.items;
    },

    /**
     * Get role by ID
     */
    async role(_: any, args: { id: string }) {
      if (!RBAC['dbAdapter']) {
        throw new Error('RBAC system not initialized');
      }

      return await RBAC['dbAdapter'].findRoleByIdWithFeatures(args.id);
    },

    /**
     * Get all features
     */
    async features() {
      if (!RBAC['dbAdapter']) {
        throw new Error('RBAC system not initialized');
      }

      const result = await RBAC['dbAdapter'].getAllFeatures();
      return result.items;
    },

    /**
     * Get all permissions
     */
    async permissions() {
      if (!RBAC['dbAdapter']) {
        throw new Error('RBAC system not initialized');
      }

      const result = await RBAC['dbAdapter'].getAllPermissions();
      return result.items;
    },

    /**
     * Get user permissions for a specific feature
     */
    async userFeaturePermissions(_: any, args: { user_id: string; feature: string }) {
      return await RBAC.getFeaturePermissions(args.user_id, args.feature);
    },

    /**
     * Get dashboard statistics
     */
    async rbacStats() {
      if (!RBAC['dbAdapter']) {
        throw new Error('RBAC system not initialized');
      }

      return await RBAC['dbAdapter'].getDashboardStats();
    }
  },

  Mutation: {
    /**
     * Create a new user
     */
    async createUser(_: any, args: { input: CreateUserInput }) {
      const { input } = args;
      
      if (!RBAC['dbAdapter']) {
        throw new Error('RBAC system not initialized');
      }

      // Check if user already exists
      const existingUser = await RBAC['dbAdapter'].findUserByUserId(input.user_id);
      if (existingUser) {
        throw new Error('User already exists');
      }

      await RBAC['dbAdapter'].createUser({
        user_id: input.user_id,
        name: input.name || '',
        email: input.email || '',
        role_id: input.role_id
      });

      return await RBAC['dbAdapter'].findUserByUserIdWithRole(input.user_id);
    },

    /**
     * Update a user
     */
    async updateUser(_: any, args: { user_id: string; input: UpdateUserInput }) {
      await RBAC.updateUser(args.user_id, args.input);
      return await RBAC['dbAdapter']!.findUserByUserIdWithRole(args.user_id);
    },

    /**
     * Delete a user
     */
    async deleteUser(_: any, args: { user_id: string }) {
      if (!RBAC['dbAdapter']) {
        throw new Error('RBAC system not initialized');
      }

      await RBAC['dbAdapter'].deleteUser(args.user_id);
      return true;
    },

    /**
     * Assign role to user
     */
    async assignRole(_: any, args: { user_id: string; role_name: string }) {
      await RBAC.assignRole(args.user_id, args.role_name);
      return await RBAC['dbAdapter']!.findUserByUserIdWithRole(args.user_id);
    },

    /**
     * Create a new role
     */
    async createRole(_: any, args: { input: CreateRoleInput }) {
      const { input } = args;
      
      if (!RBAC['dbAdapter']) {
        throw new Error('RBAC system not initialized');
      }

      const role = await RBAC['dbAdapter'].createRole({
        name: input.name,
        description: ''
      });

      if (input.features && input.features.length > 0) {
        await RBAC['dbAdapter'].assignRoleFeaturePermissions(role.id!, input.features);
      }

      return await RBAC['dbAdapter'].findRoleByIdWithFeatures(role.id!);
    },

    /**
     * Update a role
     */
    async updateRole(_: any, args: { id: string; input: CreateRoleInput }) {
      if (!RBAC['dbAdapter']) {
        throw new Error('RBAC system not initialized');
      }

      await RBAC['dbAdapter'].updateRole(args.id, {
        name: args.input.name
      });

      if (args.input.features) {
        await RBAC['dbAdapter'].assignRoleFeaturePermissions(args.id, args.input.features);
      }

      return await RBAC['dbAdapter'].findRoleByIdWithFeatures(args.id);
    },

    /**
     * Delete a role
     */
    async deleteRole(_: any, args: { id: string }) {
      if (!RBAC['dbAdapter']) {
        throw new Error('RBAC system not initialized');
      }

      await RBAC['dbAdapter'].deleteRole(args.id);
      return true;
    },

    /**
     * Create a new feature
     */
    async createFeature(_: any, args: { input: CreateFeatureInput }) {
      if (!RBAC['dbAdapter']) {
        throw new Error('RBAC system not initialized');
      }

      const feature = await RBAC['dbAdapter'].createFeature({
        name: args.input.name,
        description: ''
      });
      return feature;
    },

    /**
     * Update a feature
     */
    async updateFeature(_: any, args: { id: string; input: CreateFeatureInput }) {
      if (!RBAC['dbAdapter']) {
        throw new Error('RBAC system not initialized');
      }

      await RBAC['dbAdapter'].updateFeature(args.id, {
        name: args.input.name
      });
      return await RBAC['dbAdapter'].findFeatureById(args.id);
    },

    /**
     * Delete a feature
     */
    async deleteFeature(_: any, args: { id: string }) {
      if (!RBAC['dbAdapter']) {
        throw new Error('RBAC system not initialized');
      }

      await RBAC['dbAdapter'].deleteFeature(args.id);
      return true;
    },

    /**
     * Create a new permission
     */
    async createPermission(_: any, args: { input: CreatePermissionInput }) {
      if (!RBAC['dbAdapter']) {
        throw new Error('RBAC system not initialized');
      }

      const permission = await RBAC['dbAdapter'].createPermission({
        name: args.input.name,
        description: ''
      });
      return permission;
    },

    /**
     * Update a permission
     */
    async updatePermission(_: any, args: { id: string; input: CreatePermissionInput }) {
      if (!RBAC['dbAdapter']) {
        throw new Error('RBAC system not initialized');
      }

      await RBAC['dbAdapter'].updatePermission(args.id, {
        name: args.input.name
      });
      return await RBAC['dbAdapter'].findPermissionById(args.id);
    },

    /**
     * Delete a permission
     */
    async deletePermission(_: any, args: { id: string }) {
      if (!RBAC['dbAdapter']) {
        throw new Error('RBAC system not initialized');
      }

      await RBAC['dbAdapter'].deletePermission(args.id);
      return true;
    }
  }
};