import { Request, Response } from "express";
import { IFeaturePermission, UserRole } from "../models/UserRole";
import { User } from "../models/User";
import { Types } from "mongoose";
import { Permission } from "../models/Permission";

const getAllRoles = async (): Promise<any> => {
  try {
    const userRoles = await UserRole.find().exec();
    return { message: "User Roles fetched successfully", userRoles };
  } catch (error) {
    console.error("Error in getAllRoles:", error);
    return { error: "Internal server error" };
  }
};

const createRole = async (name: string, description: string, features: IFeaturePermission[]): Promise<any> => {
  try {
    // payload to be received:
    // name: string, description: string
    // features: [{feature: string, permissions: [permissionIds]}]: IFeaturePermission[]

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
    console.error("Error in createRole:", error);
    return { error: "Internal server error" };
  }
};

const deleteRole = async (roleId: string): Promise<any> => {
  try {
    const usersWithRole = await User.find({ role: new Types.ObjectId(roleId) }).exec();
    if (usersWithRole.length > 0) return { error: "User role can not be deleted as it is assigned to one or more users" };
    const deletedRole = await UserRole.findByIdAndDelete(roleId).exec();
    return { message: "User Role deleted successfully" };
  } catch (error) {
    console.error("Error in deleteRole:", error);
    return { error: "Internal server error" };
  }
};

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
    console.error("Error in addFeatureToUserRole:", error);
    return { error: "Internal server error" };
  }
};

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
    console.error("Error in removeFeatureFromUserRole:", error);
    return { error: "Internal server error" };
  }
};

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
    console.error("Error in addPermissionToFeatureInUserRole:", error);
    return { error: "Internal server error" };
  }
};

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
    console.error("Error in removePermissionToFeatureInUserRole:", error);
    return { error: "Internal server error" };
  }
};

const getPermissions = async (): Promise<any> => {
  try {
    const permissions = await Permission.find().exec();
    return { message: "Permissions fetched successfully", permissions };
  } catch (error) {
    console.error("Error in getPermissions:", error);
    return { error: "Internal server error" };
  }
};

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
