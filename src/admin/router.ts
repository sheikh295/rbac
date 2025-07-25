import { Request, Response, Router } from 'express';
import express from 'express';
import { DatabaseAdapter } from '../adapters/DatabaseAdapter';

import { getDashboardView } from './views/dashboard';
import { getUsersListView, getUserDetailsView } from './views/users';
import { getRolesListView, getRoleDetailsView } from './views/roles';
import { getFeaturesListView, getFeatureDetailsView } from './views/features';
import { getPermissionsListView, getPermissionDetailsView } from './views/permissions';

export const createAdminRouter = (dbAdapter: DatabaseAdapter): Router => {
  const router = Router();

  router.get('/', async (req: Request, res: Response) => {
    try {
      const stats = await dbAdapter.getDashboardStats();
      res.send(getDashboardView(stats));
    } catch (error) {
      const stats = { users: 0, roles: 0, features: 0, permissions: 5 };
      res.send(getDashboardView(stats));
    }
  });

  router.get('/api/stats', async (req: Request, res: Response) => {
    try {
      const stats = await dbAdapter.getDashboardStats();
      res.json({
        ...stats,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({ 
        error: 'Failed to fetch stats',
        message: (error as Error).message 
      });
    }
  });

  router.get('/users', async (req: Request, res: Response) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const search = req.query.search as string || '';
      const skip = (page - 1) * limit;

      const usersResult = await dbAdapter.getAllUsers(limit, skip, search);
      const rolesResult = await dbAdapter.getAllRoles();
      
      const pagination = {
        currentPage: page,
        totalPages: Math.ceil(usersResult.total / limit),
        totalUsers: usersResult.total,
        hasNext: page < Math.ceil(usersResult.total / limit),
        hasPrev: page > 1,
        limit,
        search
      };
      
      res.send(getUsersListView(usersResult.items, rolesResult.items, pagination));
    } catch (error) {
      res.status(500).send('Error loading users: ' + (error as Error).message);
    }
  });

  router.get('/users/:userId', async (req: Request, res: Response) => {
    try {
      const user = await dbAdapter.findUserByUserIdWithRole(req.params.userId);
      
      if (!user) {
        return res.status(404).send('User not found');
      }
      
      const rolesResult = await dbAdapter.getAllRoles();
      res.send(getUserDetailsView(user, rolesResult.items));
    } catch (error) {
      res.status(500).send('Error loading user: ' + (error as Error).message);
    }
  });

  router.post('/users/create', async (req: Request, res: Response) => {
    try {
      const { user_id, name, email } = req.body;
      
      const existingUser = await dbAdapter.findUserByUserId(user_id);
      if (existingUser) {
        return res.status(400).json({ error: 'User already exists' });
      }
      
      await dbAdapter.createUser({ user_id, name, email });
      res.redirect('/rbac-admin/users');
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  router.post('/users/:userId/update', async (req: Request, res: Response) => {
    try {
      const { name, email } = req.body;
      await dbAdapter.updateUser(req.params.userId, { name, email });
      res.redirect(`/rbac-admin/users/${req.params.userId}`);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  router.post('/users/:userId/assign-role', async (req: Request, res: Response) => {
    try {
      const { roleName } = req.body;
      const user = await dbAdapter.findUserByUserId(req.params.userId);
      
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      if (roleName) {
        const role = await dbAdapter.findRoleByName(roleName);
        if (!role) {
          return res.status(404).json({ error: 'Role not found' });
        }
        // Handle both MongoDB (_id) and PostgreSQL (id)
        const roleId = (role as any)._id || role.id;
        await dbAdapter.updateUser(req.params.userId, { role_id: roleId });
      } else {
        return res.status(404).json({ error: 'Role not found' });
      }
      
      res.redirect(req.get('Referer') || '/rbac-admin/users');
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  router.post('/users/:userId/delete', async (req: Request, res: Response) => {
    try {
      await dbAdapter.deleteUser(req.params.userId);
      res.json({ message: 'User deleted successfully' });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  router.get('/roles', async (req: Request, res: Response) => {
    try {
      const rolesResult = await dbAdapter.getAllRoles();
      const featuresResult = await dbAdapter.getAllFeatures();
      const permissionsResult = await dbAdapter.getAllPermissions();
      res.send(getRolesListView(rolesResult.items, featuresResult.items, permissionsResult.items));
    } catch (error) {
      res.status(500).send('Error loading roles: ' + (error as Error).message);
    }
  });

  router.get('/roles/:roleId', async (req: Request, res: Response) => {
    try {
      const role = await dbAdapter.findRoleByIdWithFeatures(req.params.roleId);
      if (!role) {
        return res.status(404).send('Role not found');
      }
      
      const featuresResult = await dbAdapter.getAllFeatures();
      const permissionsResult = await dbAdapter.getAllPermissions();
      res.send(getRoleDetailsView(role, featuresResult.items, permissionsResult.items));
    } catch (error) {
      res.status(500).send('Error loading role: ' + (error as Error).message);
    }
  });

  router.post('/roles/create', async (req: Request, res: Response) => {
    try {
      const { name, description, features } = req.body;
      
      const existingRole = await dbAdapter.findRoleByName(name);
      if (existingRole) {
        return res.status(400).json({ error: 'Role already exists' });
      }
      
      const newRole = await dbAdapter.createRole({ name, description });
      
      // If features are provided, assign them to the role
      if (features && features.length > 0) {
        const roleId = (newRole as any)._id || newRole.id;
        const featurePermissions = features.map((f: any) => ({
          feature_id: f.feature,
          permission_ids: f.permissions
        }));
        
        await dbAdapter.assignRoleFeaturePermissions(roleId, featurePermissions);
      }
      
      res.json({ success: true, message: 'Role created successfully' });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  router.post('/roles/:roleId/delete', async (req: Request, res: Response) => {
    try {
      await dbAdapter.deleteRole(req.params.roleId);
      res.json({ success: true, message: 'Role deleted successfully' });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // TODO: Implement complex role management routes for both MongoDB and PostgreSQL
  // These routes need specialized implementation for role-feature-permission relationships
  
  router.post('/roles/:roleId/assign-features', async (req: Request, res: Response) => {
    try {
      let { featurePermissions, featureIds } = req.body;
      
      // Handle form data: convert featureIds to featurePermissions with all permissions
      if (!featurePermissions && featureIds) {
        const featureIdArray = Array.isArray(featureIds) ? featureIds : [featureIds];
        const allPermissions = await dbAdapter.getAllPermissions();
        
        featurePermissions = featureIdArray.map(featureId => ({
          feature_id: featureId,
          permission_ids: allPermissions.items.map(p => (p as any)._id || p.id)
        }));
      }
      
      if (!featurePermissions || featurePermissions.length === 0) {
        return res.status(400).json({ error: 'No features or permissions provided' });
      }
      
      await dbAdapter.assignRoleFeaturePermissions(req.params.roleId, featurePermissions);
      res.redirect(`/rbac-admin/roles/${req.params.roleId}`);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // Remove permissions from a specific feature within a role
  router.post('/roles/:roleId/remove-permissions', async (req: Request, res: Response) => {
    try {
      const { featureIds, permissionIds } = req.body;
      const featureId = Array.isArray(featureIds) ? featureIds[0] : featureIds;
      const permissionsToRemove = Array.isArray(permissionIds) ? permissionIds : [permissionIds];
      
      // Get current role features
      const role = await dbAdapter.findRoleByIdWithFeatures(req.params.roleId);
      if (!role) {
        return res.status(404).json({ error: 'Role not found' });
      }

      // Find the existing feature assignment
      const existingFeature = role.features?.find((f: any) => {
        const fId = f.feature_id?.toString() || f.feature?._id?.toString() || f._id?.toString();
        return fId === featureId;
      });
      
      if (!existingFeature || !existingFeature.permissions) {
        return res.status(404).json({ error: 'Feature or permissions not found' });
      }

      // Remove specified permissions
      const existingPermissionIds = Array.isArray(existingFeature.permissions) 
        ? existingFeature.permissions.map((p: any) => (p._id || p.id || p).toString()) 
        : [];
      
      const updatedPermissions = existingPermissionIds.filter((pId: string) => 
        !permissionsToRemove.includes(pId)
      );

      const featurePermissions = [{
        feature_id: featureId,
        permission_ids: updatedPermissions
      }];

      await dbAdapter.assignRoleFeaturePermissions(req.params.roleId, featurePermissions);
      res.json({ success: true, message: 'Permission removed successfully' });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // Add permissions to a specific feature within a role
  router.post('/roles/:roleId/add-permissions', async (req: Request, res: Response) => {
    try {
      const { featureIds, permissionIds } = req.body;
      const featureId = Array.isArray(featureIds) ? featureIds[0] : featureIds;
      const permissions = Array.isArray(permissionIds) ? permissionIds : [permissionIds];
      
      // Get current role features to merge with new permissions
      const role = await dbAdapter.findRoleByIdWithFeatures(req.params.roleId);
      if (!role) {
        return res.status(404).json({ error: 'Role not found' });
      }

      // Find the existing feature assignment (handle undefined features array)
      const existingFeature = role.features?.find((f: any) => {
        const fId = f.feature_id?.toString() || f.feature?._id?.toString() || f._id?.toString();
        return fId === featureId;
      });
      
      let updatedPermissions = permissions;
      if (existingFeature && existingFeature.permissions) {
        // Merge existing permissions with new ones (handle undefined permissions array)
        const existingPermissionIds = Array.isArray(existingFeature.permissions) 
          ? existingFeature.permissions.map((p: any) => (p._id || p.id || p).toString()) 
          : [];
        updatedPermissions = [...new Set([...existingPermissionIds, ...permissions])];
      }

      const featurePermissions = [{
        feature_id: featureId,
        permission_ids: updatedPermissions
      }];

      await dbAdapter.assignRoleFeaturePermissions(req.params.roleId, featurePermissions);
      res.redirect(`/rbac-admin/roles/${req.params.roleId}`);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  router.get('/features', async (req: Request, res: Response) => {
    try {
      const featuresResult = await dbAdapter.getAllFeatures();
      res.send(getFeaturesListView(featuresResult.items));
    } catch (error) {
      res.status(500).send('Error loading features: ' + (error as Error).message);
    }
  });

  router.get('/features/:featureId', async (req: Request, res: Response) => {
    try {
      const feature = await dbAdapter.findFeatureById(req.params.featureId);
      if (!feature) {
        return res.status(404).send('Feature not found');
      }
      
      const rolesResult = await dbAdapter.getAllRoles();
      res.send(getFeatureDetailsView(feature, rolesResult.items));
    } catch (error) {
      res.status(500).send('Error loading feature: ' + (error as Error).message);
    }
  });

  router.post('/features/create', async (req: Request, res: Response) => {
    try {
      const { name, description } = req.body;
      
      const existing = await dbAdapter.findFeatureByName(name);
      if (existing) {
        return res.status(400).json({ error: 'Feature already exists' });
      }
      
      await dbAdapter.createFeature({ name, description });
      res.redirect('/rbac-admin/features');
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  router.post('/features/:featureId/update', async (req: Request, res: Response) => {
    try {
      const { name, description } = req.body;
      await dbAdapter.updateFeature(req.params.featureId, { name, description });
      res.json({ success: true, message: 'Feature updated successfully' });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  router.post('/features/:featureId/delete', async (req: Request, res: Response) => {
    try {
      await dbAdapter.deleteFeature(req.params.featureId);
      res.json({ success: true, message: 'Feature deleted successfully' });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  router.get('/permissions', async (req: Request, res: Response) => {
    try {
      const permissionsResult = await dbAdapter.getAllPermissions();
      res.send(getPermissionsListView(permissionsResult.items));
    } catch (error) {
      res.status(500).send('Error loading permissions: ' + (error as Error).message);
    }
  });

  router.get('/permissions/:permissionId', async (req: Request, res: Response) => {
    try {
      const permission = await dbAdapter.findPermissionById(req.params.permissionId);
      if (!permission) {
        return res.status(404).send('Permission not found');
      }
      
      const rolesResult = await dbAdapter.getAllRoles();
      res.send(getPermissionDetailsView(permission, rolesResult.items));
    } catch (error) {
      res.status(500).send('Error loading permission: ' + (error as Error).message);
    }
  });

  router.post('/permissions/create', async (req: Request, res: Response) => {
    try {
      const { name, description } = req.body;
      
      const existingPermission = await dbAdapter.findPermissionByName(name);
      if (existingPermission) {
        return res.status(400).json({ error: 'Permission already exists' });
      }
      
      await dbAdapter.createPermission({ name, description });
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
        const existingPermission = await dbAdapter.findPermissionByName(perm.name);
        if (!existingPermission) {
          const created = await dbAdapter.createPermission(perm);
          createdPermissions.push(created);
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
      await dbAdapter.updatePermission(req.params.permissionId, { name, description });
      res.json({ message: 'Permission updated successfully' });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  router.post('/permissions/:permissionId/delete', async (req: Request, res: Response) => {
    try {
      await dbAdapter.deletePermission(req.params.permissionId);
      res.json({ message: 'Permission deleted successfully' });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  return router;
};