import { Request, Response } from "express";
import { IFeaturePermission, UserRole } from "../models/UserRole";
import { User } from "../models/User";
import { Types } from "mongoose";
import { Permission } from "../models/Permission";

/**
 * Retrieves all user roles from the database.
 * Roles define collections of features with specific permissions that can be assigned to users.
 * 
 * @returns {Promise<{message: string, userRoles: any[]} | {error: string}>} 
 *   Success response with roles array or error response
 * 
 * @example
 * ```typescript
 * const { userRoleController } = RBAC.controllers;
 * const result = await userRoleController.getAllRoles();
 * 
 * if (result.error) {
 *   console.error('Failed to fetch roles:', result.error);
 * } else {
 *   console.log('Available roles:', result.userRoles);
 *   // result.userRoles = [{ _id: '...', name: 'admin', description: '...', features: [...] }, ...]
 * }
 * ```
 */
const getAllRoles = async (): Promise<any> => {
  try {
    const userRoles = await UserRole.find().exec();
    return { message: "User Roles fetched successfully", userRoles };
  } catch (error) {
    return { error: "Internal server error" };
  }
};

/**
 * Creates a new role in the RBAC system.
 * Roles define collections of features with specific permissions that can be assigned to users.
 * 
 * @param {string} name - Unique name for the role (e.g., 'admin', 'manager', 'editor')
 * @param {string} description - Human-readable description of the role
 * @param {IFeaturePermission[]} features - Array of feature-permission mappings
 * @param {string} features[].feature - MongoDB ObjectId of the feature
 * @param {string[]} features[].permissions - Array of MongoDB ObjectIds of permissions
 * @returns {Promise<{message: string, userRole: any} | {error: string}>} 
 *   Success response with created role or error response
 * 
 * @example
 * ```typescript
 * const { userRoleController, featureController } = RBAC.controllers;
 * 
 * // Get feature and permission IDs first
 * const { features } = await featureController.getAllFeatures();
 * const { permissions } = await userRoleController.getPermissions();
 * 
 * const billingFeature = features.find(f => f.name === 'billing');
 * const readPerm = permissions.find(p => p.name === 'read');
 * const createPerm = permissions.find(p => p.name === 'create');
 * 
 * const roleFeatures = [{
 *   feature: billingFeature._id,
 *   permissions: [readPerm._id, createPerm._id]
 * }];
 * 
 * const result = await userRoleController.createRole(
 *   'billing-manager',
 *   'Manager for billing operations',
 *   roleFeatures
 * );
 * 
 * if (result.error) {
 *   console.error('Failed to create role:', result.error);
 * } else {
 *   console.log('Role created:', result.userRole);
 * }
 * ```
 */
const createRole = async (name: string, description: string, features: IFeaturePermission[]): Promise<any> => {
  try {
    const existingRole = await UserRole.findOne({ name }).exec();
    if (existingRole) {
      return { error: "Role with this name already exists" };
    }

    const newRole = new UserRole({
      name,
      description,
      features: features,
    });

    const savedRole = await newRole.save();
    return { message: "User Role created successfully", userRole: savedRole };
  } catch (error) {
    return { error: "Internal server error" };
  }
};

/**
 * Deletes a role from the RBAC system.
 * Prevents deletion if the role is currently assigned to any users.
 * 
 * @param {string} roleId - MongoDB ObjectId of the role to delete
 * @returns {Promise<{message: string} | {error: string}>} 
 *   Success message or error response
 * 
 * @example
 * ```typescript
 * const { userRoleController } = RBAC.controllers;
 * 
 * const result = await userRoleController.deleteRole('507f1f77bcf86cd799439011');
 * 
 * if (result.error) {
 *   console.error('Failed to delete role:', result.error);
 *   // Could be: "User role can not be deleted as it is assigned to one or more users"
 * } else {
 *   console.log(result.message); // "User Role deleted successfully"
 * }
 * ```
 * 
 * @warning This function checks for users assigned to the role before deletion.
 *          Roles assigned to users cannot be deleted.
 */
const deleteRole = async (roleId: string): Promise<any> => {
  try {
    const usersWithRole = await User.find({ role: new Types.ObjectId(roleId) }).exec();
    if (usersWithRole.length > 0) return { error: "User role can not be deleted as it is assigned to one or more users" };
    const deletedRole = await UserRole.findByIdAndDelete(roleId).exec();
    return { message: "User Role deleted successfully" };
  } catch (error) {
    return { error: "Internal server error" };
  }
};

/**
 * Adds features to an existing role.
 * Features are added with empty permissions - use addPermissionToFeatureInUserRole to add permissions.
 * 
 * @param {string} roleId - MongoDB ObjectId of the role to modify
 * @param {string[]} featureIds - Array of MongoDB ObjectIds of features to add
 * @returns {Promise<{message: string, userRole: any} | {error: string}>} 
 *   Success response with updated role or error response
 * 
 * @example
 * ```typescript
 * const { userRoleController, featureController } = RBAC.controllers;
 * 
 * // Get available features
 * const { features } = await featureController.getAllFeatures();
 * const billingFeature = features.find(f => f.name === 'billing');
 * const reportsFeature = features.find(f => f.name === 'reports');
 * 
 * const result = await userRoleController.addFeatureToUserRole(
 *   '507f1f77bcf86cd799439011', // roleId
 *   [billingFeature._id, reportsFeature._id]
 * );
 * 
 * if (result.error) {
 *   console.error('Failed to add features:', result.error);
 * } else {
 *   console.log('Features added successfully:', result.userRole);
 * }
 * ```
 * 
 * @note Features are added with empty permissions. Use addPermissionToFeatureInUserRole
 *       to assign specific permissions to the newly added features.
 */
const addFeatureToUserRole = async (roleId: string, featureIds: string[]): Promise<any> => {
  try {
    const role = await UserRole.findById(roleId).exec();
    if (!role) {
      return { error: "Role not found" };
    }

    const existingFeatureIds = role.features?.map((f) => f.feature?.toString()) || [];

    const newFeatures = featureIds
      .filter((featureId) => !existingFeatureIds.includes(featureId))
      .map((featureId) => ({
        feature: new Types.ObjectId(featureId),
        permissions: [],
      }));

    if (newFeatures.length === 0) {
      return { error: "All features already exist in this role" };
    }

    role.features = [...(role.features || []), ...newFeatures];
    await role.save();

    return { message: "Features added to user role successfully", userRole: role };
  } catch (error) {
    return { error: "Internal server error" };
  }
};

/**
 * Removes features from an existing role.
 * Removes the features and all their associated permissions from the role.
 * 
 * @param {string} roleId - MongoDB ObjectId of the role to modify
 * @param {string[]} featureIds - Array of MongoDB ObjectIds of features to remove
 * @returns {Promise<{message: string, userRole: any} | {error: string}>} 
 *   Success response with updated role or error response
 * 
 * @example
 * ```typescript
 * const { userRoleController, featureController } = RBAC.controllers;
 * 
 * // Get feature to remove
 * const { features } = await featureController.getAllFeatures();
 * const billingFeature = features.find(f => f.name === 'billing');
 * 
 * const result = await userRoleController.removeFeatureFromUserRole(
 *   '507f1f77bcf86cd799439011', // roleId
 *   [billingFeature._id]
 * );
 * 
 * if (result.error) {
 *   console.error('Failed to remove features:', result.error);
 * } else {
 *   console.log('Features removed successfully:', result.userRole);
 * }
 * ```
 * 
 * @warning This completely removes the feature and all its permissions from the role.
 *          Users with this role will lose access to the removed features.
 */
const removeFeatureFromUserRole = async (roleId: string, featureIds: string[]): Promise<any> => {
  try {
    const role = await UserRole.findById(roleId).exec();
    if (!role) {
      return { error: "Role not found" };
    }

    const initialFeatureCount = role.features?.length || 0;

    role.features = role.features?.filter((f) => !featureIds.includes(f.feature?.toString() || "")) || [];

    if (role.features.length === initialFeatureCount) {
      return { error: "No matching features found to remove" };
    }

    await role.save();

    return { message: "Features removed from user role successfully", userRole: role };
  } catch (error) {
    return { error: "Internal server error" };
  }
};

/**
 * Adds permissions to specific features within a role.
 * Allows granular control over what actions a role can perform on each feature.
 * 
 * @param {string} roleId - MongoDB ObjectId of the role to modify
 * @param {string[]} featureIds - Array of MongoDB ObjectIds of features to modify
 * @param {string[]} permissionIds - Array of MongoDB ObjectIds of permissions to add
 * @returns {Promise<{message: string, userRole: any} | {error: string}>} 
 *   Success response with updated role or error response
 * 
 * @example
 * ```typescript
 * const { userRoleController, featureController } = RBAC.controllers;
 * 
 * // Get features and permissions
 * const { features } = await featureController.getAllFeatures();
 * const { permissions } = await userRoleController.getPermissions();
 * 
 * const billingFeature = features.find(f => f.name === 'billing');
 * const readPerm = permissions.find(p => p.name === 'read');
 * const createPerm = permissions.find(p => p.name === 'create');
 * 
 * const result = await userRoleController.addPermissionToFeatureInUserRole(
 *   '507f1f77bcf86cd799439011', // roleId
 *   [billingFeature._id], // features to modify
 *   [readPerm._id, createPerm._id] // permissions to add
 * );
 * 
 * if (result.error) {
 *   console.error('Failed to add permissions:', result.error);
 * } else {
 *   console.log('Permissions added successfully:', result.userRole);
 * }
 * ```
 * 
 * @note Only adds permissions that don't already exist on the features.
 *       Duplicate permissions are automatically filtered out.
 */
const addPermissionToFeatureInUserRole = async (roleId: string, featureIds: string[], permissionIds: string[]): Promise<any> => {
  try {
    const role = await UserRole.findById(roleId).exec();
    if (!role) {
      return { error: "Role not found" };
    }

    if (!role.features || role.features.length === 0) {
      return { error: "No features found in this role" };
    }

    let updated = false;

    role.features.forEach((feature) => {
      if (featureIds.includes(feature.feature?.toString() || "")) {
        const existingPermissionIds = (feature.permissions || []).map((p) => p.toString());

        const newPermissions = permissionIds.filter((permId) => !existingPermissionIds.includes(permId)).map((permId) => new Types.ObjectId(permId));

        if (newPermissions.length > 0) {
          // @ts-ignore
          feature.permissions = [...(feature?.permissions || []), ...newPermissions];
          updated = true;
        }
      }
    });

    if (!updated) {
      return { error: "No new permissions to add or features not found" };
    }

    await role.save();

    return { message: "Permissions added successfully", userRole: role };
  } catch (error) {
    return { error: "Internal server error" };
  }
};

/**
 * Removes permissions from specific features within a role.
 * Allows fine-grained control by removing specific permissions while keeping the feature.
 * 
 * @param {string} roleId - MongoDB ObjectId of the role to modify
 * @param {string[]} featureIds - Array of MongoDB ObjectIds of features to modify
 * @param {string[]} permissionIds - Array of MongoDB ObjectIds of permissions to remove
 * @returns {Promise<{message: string, userRole: any} | {error: string}>} 
 *   Success response with updated role or error response
 * 
 * @example
 * ```typescript
 * const { userRoleController, featureController } = RBAC.controllers;
 * 
 * // Get features and permissions
 * const { features } = await featureController.getAllFeatures();
 * const { permissions } = await userRoleController.getPermissions();
 * 
 * const billingFeature = features.find(f => f.name === 'billing');
 * const deletePerm = permissions.find(p => p.name === 'delete');
 * const sudoPerm = permissions.find(p => p.name === 'sudo');
 * 
 * const result = await userRoleController.removePermissionToFeatureInUserRole(
 *   '507f1f77bcf86cd799439011', // roleId
 *   [billingFeature._id], // features to modify
 *   [deletePerm._id, sudoPerm._id] // permissions to remove
 * );
 * 
 * if (result.error) {
 *   console.error('Failed to remove permissions:', result.error);
 * } else {
 *   console.log('Permissions removed successfully:', result.userRole);
 * }
 * ```
 * 
 * @note This removes specific permissions while keeping the feature in the role.
 *       To remove the entire feature, use removeFeatureFromUserRole instead.
 */
const removePermissionToFeatureInUserRole = async (roleId: string, featureIds: string[], permissionIds: string[]): Promise<any> => {
  try {
    const role = await UserRole.findById(roleId).exec();
    if (!role) {
      return { error: "Role not found" };
    }

    if (!role.features || role.features.length === 0) {
      return { error: "No features found in this role" };
    }

    let updated = false;

    role.features.forEach((feature) => {
      if (featureIds.includes(feature.feature?.toString() || "")) {
        const initialPermissionCount = feature.permissions?.length || 0;

        // @ts-ignore
        feature.permissions = (feature?.permissions || []).filter((permission) => !permissionIds.includes(permission.toString()));

        // @ts-ignore
        if (feature?.permissions?.length < initialPermissionCount) {
          updated = true;
        }
      }
    });

    if (!updated) {
      return { error: "No matching permissions found to remove" };
    }

    await role.save();

    return { message: "Permissions removed successfully", userRole: role };
  } catch (error) {
    return { error: "Internal server error" };
  }
};

/**
 * Retrieves all available permissions from the database.
 * Permissions define the granular actions that can be performed (read, create, update, delete, sudo).
 * 
 * @returns {Promise<{message: string, permissions: any[]} | {error: string}>} 
 *   Success response with permissions array or error response
 * 
 * @example
 * ```typescript
 * const { userRoleController } = RBAC.controllers;
 * const result = await userRoleController.getPermissions();
 * 
 * if (result.error) {
 *   console.error('Failed to fetch permissions:', result.error);
 * } else {
 *   console.log('Available permissions:', result.permissions);
 *   // result.permissions = [
 *   //   { _id: '...', name: 'read', description: 'View and access resources' },
 *   //   { _id: '...', name: 'create', description: 'Add new resources' },
 *   //   { _id: '...', name: 'update', description: 'Modify existing resources' },
 *   //   { _id: '...', name: 'delete', description: 'Remove resources' },
 *   //   { _id: '...', name: 'sudo', description: 'Full administrative access' }
 *   // ]
 * }
 * ```
 * 
 * @note Standard permissions (read, create, update, delete, sudo) are auto-created during RBAC initialization.
 */
const getPermissions = async (): Promise<any> => {
  try {
    const permissions = await Permission.find().exec();
    return { message: "Permissions fetched successfully", permissions };
  } catch (error) {
    return { error: "Internal server error" };
  }
};

/**
 * User role controller providing comprehensive CRUD operations for RBAC roles and permissions.
 * Manages the complex relationships between roles, features, and permissions.
 * 
 * @namespace userRoleController
 * 
 * @example
 * ```typescript
 * import { RBAC } from '@sheikh295/rbac';
 * const { userRoleController } = RBAC.controllers;
 * 
 * // Get all roles
 * const { userRoles } = await userRoleController.getAllRoles();
 * 
 * // Get all permissions
 * const { permissions } = await userRoleController.getPermissions();
 * 
 * // Create a new role with features and permissions
 * const roleFeatures = [{ feature: featureId, permissions: [permissionId1, permissionId2] }];
 * await userRoleController.createRole('manager', 'Department manager', roleFeatures);
 * ```
 */
export const userRoleController = {
  getAllRoles,
  createRole,
  deleteRole,
  addFeatureToUserRole,
  removeFeatureFromUserRole,
  addPermissionToFeatureInUserRole,
  removePermissionToFeatureInUserRole,
  getPermissions,
};
