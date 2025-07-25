import { Connection } from 'mongoose';
import { DatabaseAdapter, DatabaseUser, DatabaseRole, DatabaseFeature, DatabasePermission, FeaturePermissions, PaginatedResult } from './DatabaseAdapter';
import { User } from '../mongo/models/User';
import { UserRole } from '../mongo/models/UserRole';
import { Feature } from '../mongo/models/Feature';
import { Permission } from '../mongo/models/Permission';

export class MongoAdapter extends DatabaseAdapter {
  constructor(private connection: Connection) {
    super();
  }

  async init(): Promise<void> {
    await this.createStandardPermissions();
  }

  async createStandardPermissions(): Promise<void> {
    const standardPermissions = [
      { name: 'read', description: 'View and access resources' },
      { name: 'create', description: 'Add new resources' },
      { name: 'update', description: 'Modify existing resources' },
      { name: 'delete', description: 'Remove resources' },
      { name: 'sudo', description: 'Full administrative access' }
    ];

    for (const permissionData of standardPermissions) {
      const existingPermission = await Permission.findOne({ name: permissionData.name });
      if (!existingPermission) {
        const permission = new Permission(permissionData);
        await permission.save();
      }
    }
  }

  // User operations
  async createUser(userData: DatabaseUser): Promise<DatabaseUser> {
    const user = new User(userData);
    await user.save();
    return user.toObject();
  }

  async findUserByUserId(user_id: string): Promise<DatabaseUser | null> {
    const user = await User.findOne({ user_id });
    return user ? user.toObject() : null;
  }

  async findUserByUserIdWithRole(user_id: string): Promise<DatabaseUser | null> {
    const user = await User.findOne({ user_id })
      .populate({
        path: "role",
        populate: {
          path: "features.feature features.permissions",
        },
      })
      .exec();
    return user ? user.toObject() : null;
  }

  async updateUser(user_id: string, updates: Partial<DatabaseUser>): Promise<void> {
    // Handle role_id to role field mapping for MongoDB
    const mongoUpdates: any = { ...updates };
    if (updates.role_id !== undefined) {
      mongoUpdates.role = updates.role_id;
      delete mongoUpdates.role_id;
    }
    await User.updateOne({ user_id }, mongoUpdates);
  }

  async deleteUser(user_id: string): Promise<void> {
    await User.deleteOne({ user_id });
  }

  async getAllUsers(limit?: number, offset?: number, search?: string): Promise<PaginatedResult<DatabaseUser>> {
    let query: any = {};
    if (search) {
      query = {
        $or: [
          { user_id: { $regex: search, $options: 'i' } },
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ]
      };
    }

    const total = await User.countDocuments(query);
    let userQuery = User.find(query).populate('role', 'name').sort({ createdAt: -1 });
    
    if (limit) userQuery = userQuery.limit(limit);
    if (offset) userQuery = userQuery.skip(offset);
    
    const users = await userQuery.exec();
    return { items: users.map(u => u.toObject()), total };
  }

  // Role operations
  async createRole(roleData: DatabaseRole): Promise<DatabaseRole> {
    const role = new UserRole(roleData);
    await role.save();
    return role.toObject();
  }

  async findRoleByName(name: string): Promise<DatabaseRole | null> {
    const role = await UserRole.findOne({ name });
    return role ? role.toObject() : null;
  }

  async findRoleById(id: string): Promise<DatabaseRole | null> {
    const role = await UserRole.findById(id);
    return role ? role.toObject() : null;
  }

  async findRoleByIdWithFeatures(id: string): Promise<DatabaseRole | null> {
    const role = await UserRole.findById(id)
      .populate({
        path: "features.feature features.permissions",
      })
      .exec();
    return role ? role.toObject() : null;
  }

  async updateRole(id: string, updates: Partial<DatabaseRole>): Promise<void> {
    await UserRole.updateOne({ _id: id }, updates);
  }

  async deleteRole(id: string): Promise<void> {
    await User.updateMany({ role: id }, { $unset: { role: 1 } });
    await UserRole.deleteOne({ _id: id });
  }

  async assignRoleFeaturePermissions(roleId: string, featurePermissions: FeaturePermissions[]): Promise<void> {
    const features = featurePermissions.map(fp => ({
      feature: fp.feature_id,
      permissions: fp.permission_ids
    }));
    
    await UserRole.updateOne({ _id: roleId }, { features });
  }

  async getAllRoles(limit?: number, offset?: number): Promise<PaginatedResult<DatabaseRole>> {
    const total = await UserRole.countDocuments();
    let roleQuery = UserRole.find().sort({ createdAt: -1 });
    
    if (limit) roleQuery = roleQuery.limit(limit);
    if (offset) roleQuery = roleQuery.skip(offset);
    
    const roles = await roleQuery.exec();
    return { items: roles.map(r => r.toObject()), total };
  }

  // Feature operations
  async createFeature(featureData: DatabaseFeature): Promise<DatabaseFeature> {
    const feature = new Feature(featureData);
    await feature.save();
    return feature.toObject();
  }

  async findFeatureByName(name: string): Promise<DatabaseFeature | null> {
    const feature = await Feature.findOne({ name });
    return feature ? feature.toObject() : null;
  }

  async findFeatureById(id: string): Promise<DatabaseFeature | null> {
    const feature = await Feature.findById(id);
    return feature ? feature.toObject() : null;
  }

  async updateFeature(id: string, updates: Partial<DatabaseFeature>): Promise<void> {
    await Feature.updateOne({ _id: id }, updates);
  }

  async deleteFeature(id: string): Promise<void> {
    await UserRole.updateMany(
      {},
      { $pull: { features: { feature: id } } }
    );
    await Feature.deleteOne({ _id: id });
  }

  async getAllFeatures(limit?: number, offset?: number): Promise<PaginatedResult<DatabaseFeature>> {
    const total = await Feature.countDocuments();
    let featureQuery = Feature.find().sort({ createdAt: -1 });
    
    if (limit) featureQuery = featureQuery.limit(limit);
    if (offset) featureQuery = featureQuery.skip(offset);
    
    const features = await featureQuery.exec();
    return { items: features.map(f => f.toObject()), total };
  }

  // Permission operations
  async createPermission(permissionData: DatabasePermission): Promise<DatabasePermission> {
    const permission = new Permission(permissionData);
    await permission.save();
    return permission.toObject();
  }

  async findPermissionByName(name: string): Promise<DatabasePermission | null> {
    const permission = await Permission.findOne({ name });
    return permission ? permission.toObject() : null;
  }

  async findPermissionById(id: string): Promise<DatabasePermission | null> {
    const permission = await Permission.findById(id);
    return permission ? permission.toObject() : null;
  }

  async updatePermission(id: string, updates: Partial<DatabasePermission>): Promise<void> {
    await Permission.updateOne({ _id: id }, updates);
  }

  async deletePermission(id: string): Promise<void> {
    await UserRole.updateMany(
      {},
      { $pull: { "features.$[].permissions": id } }
    );
    await Permission.deleteOne({ _id: id });
  }

  async getAllPermissions(limit?: number, offset?: number): Promise<PaginatedResult<DatabasePermission>> {
    const total = await Permission.countDocuments();
    let permissionQuery = Permission.find().sort({ createdAt: -1 });
    
    if (limit) permissionQuery = permissionQuery.limit(limit);
    if (offset) permissionQuery = permissionQuery.skip(offset);
    
    const permissions = await permissionQuery.exec();
    return { items: permissions.map(p => p.toObject()), total };
  }

  async getUserFeaturePermissions(user_id: string, featureName: string): Promise<string[]> {
    const user = await User.findOne({ user_id }).populate({
      path: "role",
      populate: {
        path: "features.feature features.permissions",
      },
    });

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
    const [users, roles, features, permissions] = await Promise.all([
      User.countDocuments(),
      UserRole.countDocuments(),
      Feature.countDocuments(),
      Permission.countDocuments()
    ]);

    return { users, roles, features, permissions };
  }
}