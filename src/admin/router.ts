import { Request, Response, Router } from 'express';
import express from 'express';
import { User } from '../mongo/models/User';
import { UserRole } from '../mongo/models/UserRole';
import { Feature } from '../mongo/models/Feature';
import { Permission } from '../mongo/models/Permission';
import { userRoleController } from '../mongo/controllers/userrole.controller';
import { featureController } from '../mongo/controllers/feature.controller';
import { Types } from 'mongoose';

// Import views
import { getDashboardView } from './views/dashboard';
import { getUsersListView, getUserDetailsView } from './views/users';
import { getRolesListView, getRoleDetailsView } from './views/roles';
import { getFeaturesListView, getFeatureDetailsView } from './views/features';
import { getPermissionsListView, getPermissionDetailsView } from './views/permissions';

export const createAdminRouter = (): Router => {
  const router = Router();

  // Dashboard
  router.get('/', async (req: Request, res: Response) => {
    try {
      // Get counts for dashboard stats
      const [usersCount, rolesCount, featuresCount, permissionsCount] = await Promise.all([
        User.countDocuments(),
        UserRole.countDocuments(),
        Feature.countDocuments(),
        Permission.countDocuments()
      ]);

      const stats = {
        users: usersCount,
        roles: rolesCount,
        features: featuresCount,
        permissions: permissionsCount
      };

      res.send(getDashboardView(stats));
    } catch (error) {
      console.error('Error loading dashboard stats:', error);
      // Fallback with default stats
      const stats = { users: 0, roles: 0, features: 0, permissions: 5 };
      res.send(getDashboardView(stats));
    }
  });

  // Stats API endpoint for real-time updates
  router.get('/api/stats', async (req: Request, res: Response) => {
    try {
      const [usersCount, rolesCount, featuresCount, permissionsCount] = await Promise.all([
        User.countDocuments(),
        UserRole.countDocuments(),
        Feature.countDocuments(),
        Permission.countDocuments()
      ]);

      res.json({
        users: usersCount,
        roles: rolesCount,
        features: featuresCount,
        permissions: permissionsCount,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({ 
        error: 'Failed to fetch stats',
        message: (error as Error).message 
      });
    }
  });

  // USERS ROUTES
  router.get('/users', async (req: Request, res: Response) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const search = req.query.search as string || '';
      const skip = (page - 1) * limit;

      // Build search query
      const searchQuery: any = {};
      if (search) {
        searchQuery.$or = [
          { user_id: { $regex: search, $options: 'i' } },
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ];
      }

      const totalUsers = await User.countDocuments(searchQuery);
      const users = await User.find(searchQuery)
        .populate('role')
        .skip(skip)
        .limit(limit)
        .exec();
      
      const roles = await UserRole.find().exec();
      
      const pagination = {
        currentPage: page,
        totalPages: Math.ceil(totalUsers / limit),
        totalUsers,
        hasNext: page < Math.ceil(totalUsers / limit),
        hasPrev: page > 1,
        limit,
        search
      };
      
      res.send(getUsersListView(users, roles, pagination));
    } catch (error) {
      res.status(500).send('Error loading users: ' + (error as Error).message);
    }
  });

  router.get('/users/:userId', async (req: Request, res: Response) => {
    try {
      const user = await User.findOne({ user_id: req.params.userId }).populate({
        path: 'role',
        populate: {
          path: 'features.feature features.permissions'
        }
      }).exec();
      
      if (!user) {
        return res.status(404).send('User not found');
      }
      
      const roles = await UserRole.find().exec();
      res.send(getUserDetailsView(user, roles));
    } catch (error) {
      res.status(500).send('Error loading user: ' + (error as Error).message);
    }
  });

  router.post('/users/create', async (req: Request, res: Response) => {
    try {
      const { user_id, name, email } = req.body;
      
      const existingUser = await User.findOne({ user_id });
      if (existingUser) {
        return res.status(400).json({ error: 'User already exists' });
      }
      
      const user = new User({ user_id, name, email });
      await user.save();
      res.redirect('/rbac-admin/users');
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  router.post('/users/:userId/update', async (req: Request, res: Response) => {
    try {
      const { name, email } = req.body;
      await User.findOneAndUpdate(
        { user_id: req.params.userId },
        { name, email }
      );
      res.redirect(`/rbac-admin/users/${req.params.userId}`);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  router.post('/users/:userId/assign-role', async (req: Request, res: Response) => {
    try {
      const { roleName } = req.body;
      const user = await User.findOne({ user_id: req.params.userId });
      
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      if (roleName) {
        const role = await UserRole.findOne({ name: roleName });
        if (!role) {
          return res.status(404).json({ error: 'Role not found' });
        }
        user.role = role.id;
      } else {
        return res.status(404).json({ error: 'Role not found' });
      }
      
      await user.save();
      res.redirect(req.get('Referer') || '/rbac-admin/users');
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  router.post('/users/:userId/delete', async (req: Request, res: Response) => {
    try {
      await User.findByIdAndDelete(req.params.userId);
      res.json({ message: 'User deleted successfully' });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // ROLES ROUTES
  router.get('/roles', async (req: Request, res: Response) => {
    try {
      const roles = await UserRole.find().populate('features.feature features.permissions').exec();
      const features = await Feature.find().exec();
      const permissions = await Permission.find().exec();
      res.send(getRolesListView(roles, features, permissions));
    } catch (error) {
      res.status(500).send('Error loading roles: ' + (error as Error).message);
    }
  });

  router.get('/roles/:roleId', async (req: Request, res: Response) => {
    try {
      const role = await UserRole.findById(req.params.roleId).populate('features.feature features.permissions').exec();
      if (!role) {
        return res.status(404).send('Role not found');
      }
      
      const features = await Feature.find().exec();
      const permissions = await Permission.find().exec();
      res.send(getRoleDetailsView(role, features, permissions));
    } catch (error) {
      res.status(500).send('Error loading role: ' + (error as Error).message);
    }
  });

  router.post('/roles/create', async (req: Request, res: Response) => {
    try {
      const { name, description, features } = req.body;
      
      // Features should already be an array from JSON payload
      const featuresArray = features || [];
      
      const result = await userRoleController.createRole(name, description, featuresArray);
      if (result.error) {
        return res.status(400).json(result);
      }
      
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  router.post('/roles/:roleId/delete', async (req: Request, res: Response) => {
    try {
      const result = await userRoleController.deleteRole(req.params.roleId);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  router.post('/roles/:roleId/add-features', async (req: Request, res: Response) => {
    try {
      const { featureIds } = req.body;
      
      // Ensure array - single values become single-item arrays
      const featureIdsArray = Array.isArray(featureIds) ? featureIds : [featureIds];
      
      const result = await userRoleController.addFeatureToUserRole(req.params.roleId, featureIdsArray);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  router.post('/roles/:roleId/remove-features', async (req: Request, res: Response) => {
    try {
      const { featureIds } = req.body;
      
      // Ensure array - single values become single-item arrays
      const featureIdsArray = Array.isArray(featureIds) ? featureIds : [featureIds];
      
      const result = await userRoleController.removeFeatureFromUserRole(req.params.roleId, featureIdsArray);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  router.post('/roles/:roleId/add-permissions', async (req: Request, res: Response) => {
    try {
      const { featureIds, permissionIds } = req.body;
      
      // Ensure arrays - single values become single-item arrays
      const featureIdsArray = Array.isArray(featureIds) ? featureIds : [featureIds];
      const permissionIdsArray = Array.isArray(permissionIds) ? permissionIds : [permissionIds];
      
      const result = await userRoleController.addPermissionToFeatureInUserRole(req.params.roleId, featureIdsArray, permissionIdsArray);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  router.post('/roles/:roleId/remove-permissions', async (req: Request, res: Response) => {
    try {
      const { featureIds, permissionIds } = req.body;
      
      // Ensure arrays - single values become single-item arrays
      const featureIdsArray = Array.isArray(featureIds) ? featureIds : [featureIds];
      const permissionIdsArray = Array.isArray(permissionIds) ? permissionIds : [permissionIds];
      
      const result = await userRoleController.removePermissionToFeatureInUserRole(req.params.roleId, featureIdsArray, permissionIdsArray);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // FEATURES ROUTES
  router.get('/features', async (req: Request, res: Response) => {
    try {
      const features = await Feature.find().exec();
      res.send(getFeaturesListView(features));
    } catch (error) {
      res.status(500).send('Error loading features: ' + (error as Error).message);
    }
  });

  router.get('/features/:featureId', async (req: Request, res: Response) => {
    try {
      const feature = await Feature.findById(req.params.featureId).exec();
      if (!feature) {
        return res.status(404).send('Feature not found');
      }
      
      const roles = await UserRole.find().populate('features.feature features.permissions').exec();
      res.send(getFeatureDetailsView(feature, roles));
    } catch (error) {
      res.status(500).send('Error loading feature: ' + (error as Error).message);
    }
  });

  router.post('/features/create', async (req: Request, res: Response) => {
    try {
      const { name, description } = req.body;
      const result = await featureController.createFeature(name, description);
      
      if (result.error) {
        return res.status(400).json(result);
      }
      
      res.redirect('/rbac-admin/features');
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  router.post('/features/:featureId/update', async (req: Request, res: Response) => {
    try {
      const { name, description } = req.body;
      const result = await featureController.updateFeature(req.params.featureId, name, description);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  router.post('/features/:featureId/delete', async (req: Request, res: Response) => {
    try {
      const result = await featureController.deleteFeature(req.params.featureId);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // PERMISSIONS ROUTES
  router.get('/permissions', async (req: Request, res: Response) => {
    try {
      const permissions = await Permission.find().exec();
      res.send(getPermissionsListView(permissions));
    } catch (error) {
      res.status(500).send('Error loading permissions: ' + (error as Error).message);
    }
  });

  router.get('/permissions/:permissionId', async (req: Request, res: Response) => {
    try {
      const permission = await Permission.findById(req.params.permissionId).exec();
      if (!permission) {
        return res.status(404).send('Permission not found');
      }
      
      const roles = await UserRole.find().populate('features.feature features.permissions').exec();
      res.send(getPermissionDetailsView(permission, roles));
    } catch (error) {
      res.status(500).send('Error loading permission: ' + (error as Error).message);
    }
  });

  router.post('/permissions/create', async (req: Request, res: Response) => {
    try {
      const { name, description } = req.body;
      
      const existingPermission = await Permission.findOne({ name });
      if (existingPermission) {
        return res.status(400).json({ error: 'Permission already exists' });
      }
      
      const permission = new Permission({ name, description });
      await permission.save();
      res.redirect('/rbac-admin/permissions');
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  router.post('/permissions/create-standard', async (req: Request, res: Response) => {
    try {
      const { permissions } = req.body;
      const createdPermissions = [];
      
      for (const perm of permissions) {
        const existingPermission = await Permission.findOne({ name: perm.name });
        if (!existingPermission) {
          const permission = new Permission(perm);
          await permission.save();
          createdPermissions.push(permission);
        }
      }
      
      res.json({ 
        message: `Created ${createdPermissions.length} standard permissions`,
        permissions: createdPermissions 
      });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  router.post('/permissions/:permissionId/update', async (req: Request, res: Response) => {
    try {
      const { name, description } = req.body;
      await Permission.findByIdAndUpdate(req.params.permissionId, { name, description });
      res.json({ message: 'Permission updated successfully' });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  router.post('/permissions/:permissionId/delete', async (req: Request, res: Response) => {
    try {
      await Permission.findByIdAndDelete(req.params.permissionId);
      res.json({ message: 'Permission deleted successfully' });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  return router;
};