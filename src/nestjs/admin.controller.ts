import { 
  Controller, 
  Get, 
  Post, 
  Put, 
  Delete, 
  Param, 
  Query, 
  Body, 
  Res, 
  Req, 
  HttpStatus,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
  UseGuards,
  Session
} from '@nestjs/common';
import { Request, Response } from 'express';
import { RbacAdminService } from './admin.service';
import { AdminAuthGuard } from './guards/admin-auth.guard';

import { getDashboardView } from '../admin/views/dashboard';
import { getUsersListView, getUserDetailsView } from '../admin/views/users';
import { getRolesListView, getRoleDetailsView } from '../admin/views/roles';
import { getFeaturesListView, getFeatureDetailsView } from '../admin/views/features';
import { getPermissionsListView, getPermissionDetailsView } from '../admin/views/permissions';
import { getLoginView } from '../admin/views/login';

/**
 * NestJS Admin Controller for RBAC Dashboard
 * Provides web-based admin interface for managing users, roles, features, and permissions.
 * 
 * Features:
 * - Session-based authentication
 * - User management with pagination and search
 * - Role and permission management
 * - Feature management
 * - Real-time dashboard statistics
 * 
 * @example
 * ```typescript
 * // In your app.module.ts
 * @Module({
 *   imports: [
 *     RbacModule.forRoot({
 *       database: { type: 'mongodb', connection: mongooseConnection },
 *       authAdapter: async (req) => ({ user_id: req.user.id }),
 *       defaultRole: 'user'
 *     }),
 *     RbacAdminModule.forRoot({
 *       adminCredentials: {
 *         username: 'admin',
 *         password: 'secure-password'
 *       },
 *       sessionSecret: 'your-secret-key'
 *     })
 *   ],
 *   controllers: [RbacAdminController]
 * })
 * export class AppModule {}
 * ```
 */
@Controller('rbac-admin')
export class RbacAdminController {
  constructor(private readonly adminService: RbacAdminService) {}

  /**
   * Display login page for admin authentication
   */
  @Get('login')
  getLogin(@Res() res: Response, @Query('error') error?: string) {
    res.send(getLoginView('/rbac-admin'));
  }

  /**
   * Handle admin login authentication
   */
  @Post('login')
  async postLogin(
    @Body() body: { username: string; password: string },
    @Session() session: any,
    @Res() res: Response
  ) {
    try {
      if (!session) {
        throw new Error('Session middleware not configured. Please set up express-session middleware in your main.ts file. See documentation for setup instructions.');
      }
      
      const isValid = await this.adminService.validateAdmin(body.username, body.password);
      
      if (isValid) {
        session.authenticated = true;
        session.username = body.username;
        res.redirect('/rbac-admin');
      } else {
        res.redirect('/rbac-admin/login?error=Invalid credentials');
      }
    } catch (error) {
      res.redirect('/rbac-admin/login?error=Session setup required');
    }
  }

  /**
   * Handle admin logout
   */
  @Post('logout')
  logout(@Session() session: any, @Res() res: Response) {
    session.destroy((err: any) => {
      if (err) {
        console.error('Session destruction error:', err);
      }
      res.redirect('/rbac-admin/login');
    });
  }

  /**
   * Dashboard home page with statistics
   */
  @Get()
  @UseGuards(AdminAuthGuard)
  async getDashboard(@Res() res: Response) {
    try {
      const stats = await this.adminService.getDashboardStats();
      res.send(getDashboardView(stats));
    } catch (error) {
      const fallbackStats = { users: 0, roles: 0, features: 0, permissions: 5 };
      res.send(getDashboardView(fallbackStats));
    }
  }

  /**
   * API endpoint for real-time dashboard statistics
   */
  @Get('api/stats')
  @UseGuards(AdminAuthGuard)
  async getStats() {
    try {
      const stats = await this.adminService.getDashboardStats();
      return {
        ...stats,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      throw new InternalServerErrorException({
        error: 'Failed to fetch stats',
        message: (error as Error).message
      });
    }
  }

  // =====================================
  // USER MANAGEMENT ROUTES
  // =====================================

  /**
   * Display users list with pagination and search
   */
  @Get('users')
  @UseGuards(AdminAuthGuard)
  async getUsers(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('search') search: string = '',
    @Res() res: Response
  ) {
    try {
      const pageNum = parseInt(page) || 1;
      const limitNum = parseInt(limit) || 10;
      const skip = (pageNum - 1) * limitNum;

      const usersResult = await this.adminService.getAllUsers(limitNum, skip, search);
      const rolesResult = await this.adminService.getAllRoles();

      const pagination = {
        currentPage: pageNum,
        totalPages: Math.ceil(usersResult.total / limitNum),
        totalUsers: usersResult.total,
        hasNext: pageNum < Math.ceil(usersResult.total / limitNum),
        hasPrev: pageNum > 1,
        limit: limitNum,
        search
      };

      res.send(getUsersListView(usersResult.items, rolesResult.items, pagination));
    } catch (error) {
      throw new InternalServerErrorException('Error loading users: ' + (error as Error).message);
    }
  }

  /**
   * Display specific user details
   */
  @Get('users/:userId')
  @UseGuards(AdminAuthGuard)
  async getUserDetails(@Param('userId') userId: string, @Res() res: Response) {
    try {
      const user = await this.adminService.findUserByUserIdWithRole(userId);

      if (!user) {
        throw new NotFoundException('User not found');
      }

      const rolesResult = await this.adminService.getAllRoles();
      res.send(getUserDetailsView(user, rolesResult.items));
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Error loading user: ' + (error as Error).message);
    }
  }

  /**
   * Create a new user
   */
  @Post('users/create')
  @UseGuards(AdminAuthGuard)
  async createUser(
    @Body() body: { user_id: string; name: string; email: string },
    @Res() res: Response
  ) {
    try {
      const { user_id, name, email } = body;

      const existingUser = await this.adminService.findUserByUserId(user_id);
      if (existingUser) {
        throw new BadRequestException('User already exists');
      }

      await this.adminService.createUser({ user_id, name, email });
      res.redirect('/rbac-admin/users');
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException((error as Error).message);
    }
  }

  /**
   * Update user information
   */
  @Post('users/:userId/update')
  @UseGuards(AdminAuthGuard)
  async updateUser(
    @Param('userId') userId: string,
    @Body() body: { name: string; email: string },
    @Res() res: Response
  ) {
    try {
      const { name, email } = body;
      await this.adminService.updateUser(userId, { name, email });
      res.redirect(`/rbac-admin/users/${userId}`);
    } catch (error) {
      throw new InternalServerErrorException((error as Error).message);
    }
  }

  /**
   * Assign role to user
   */
  @Post('users/:userId/assign-role')
  @UseGuards(AdminAuthGuard)
  async assignRole(
    @Param('userId') userId: string,
    @Body() body: { roleName: string },
    @Req() req: Request,
    @Res() res: Response
  ) {
    try {
      const { roleName } = body;
      const user = await this.adminService.findUserByUserId(userId);

      if (!user) {
        throw new NotFoundException('User not found');
      }

      if (roleName) {
        const role = await this.adminService.findRoleByName(roleName);
        if (!role) {
          throw new NotFoundException('Role not found');
        }
        
        // Handle both MongoDB (_id) and PostgreSQL (id) 
        const roleId = (role as any)._id || role.id;
        await this.adminService.updateUser(userId, { role_id: roleId });
      } else {
        throw new BadRequestException('Role not found');
      }

      const referer = req.get('Referer') || '/rbac-admin/users';
      res.redirect(referer);
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException((error as Error).message);
    }
  }

  /**
   * Delete user
   */
  @Post('users/:userId/delete')
  @UseGuards(AdminAuthGuard)
  async deleteUser(@Param('userId') userId: string) {
    try {
      await this.adminService.deleteUser(userId);
      return { message: 'User deleted successfully' };
    } catch (error) {
      throw new InternalServerErrorException((error as Error).message);
    }
  }

  // =====================================
  // ROLE MANAGEMENT ROUTES
  // =====================================

  /**
   * Display roles list
   */
  @Get('roles')
  @UseGuards(AdminAuthGuard)
  async getRoles(@Res() res: Response) {
    try {
      const rolesResult = await this.adminService.getAllRoles();
      const featuresResult = await this.adminService.getAllFeatures();
      const permissionsResult = await this.adminService.getAllPermissions();
      res.send(getRolesListView(rolesResult.items, featuresResult.items, permissionsResult.items));
    } catch (error) {
      throw new InternalServerErrorException('Error loading roles: ' + (error as Error).message);
    }
  }

  /**
   * Display specific role details
   */
  @Get('roles/:roleId')
  @UseGuards(AdminAuthGuard)
  async getRoleDetails(@Param('roleId') roleId: string, @Res() res: Response) {
    try {
      const role = await this.adminService.findRoleByIdWithFeatures(roleId);
      if (!role) {
        throw new NotFoundException('Role not found');
      }

      const featuresResult = await this.adminService.getAllFeatures();
      const permissionsResult = await this.adminService.getAllPermissions();
      res.send(getRoleDetailsView(role, featuresResult.items, permissionsResult.items));
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Error loading role: ' + (error as Error).message);
    }
  }

  /**
   * Create a new role
   */
  @Post('roles/create')
  @UseGuards(AdminAuthGuard)
  async createRole(
    @Body() body: { 
      name: string; 
      description: string; 
      features?: Array<{ feature: string; permissions: string[] }> 
    },
    @Res() res: Response
  ) {
    try {
      const { name, description, features } = body;

      const existingRole = await this.adminService.findRoleByName(name);
      if (existingRole) {
        return res.status(400).json({ error: 'Role already exists' });
      }

      const newRole = await this.adminService.createRole({ name, description });
      
      // If features are provided, assign them to the role
      if (features && features.length > 0) {
        const roleId = (newRole as any)._id || newRole.id;
        const featurePermissions = features.map(f => ({
          feature_id: f.feature,
          permission_ids: f.permissions
        }));
        
        await this.adminService.assignRoleFeaturePermissions(roleId, featurePermissions);
      }
      
      res.json({ success: true, message: 'Role created successfully' });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  }

  /**
   * Delete role
   */
  @Post('roles/:roleId/delete')
  @UseGuards(AdminAuthGuard)
  async deleteRole(@Param('roleId') roleId: string) {
    try {
      await this.adminService.deleteRole(roleId);
      return { success: true, message: 'Role deleted successfully' };
    } catch (error) {
      throw new InternalServerErrorException((error as Error).message);
    }
  }

  /**
   * Assign features and permissions to role
   */
  @Post('roles/:roleId/assign-features')
  @UseGuards(AdminAuthGuard)
  async assignRoleFeatures(
    @Param('roleId') roleId: string,
    @Body() body: { 
      featurePermissions?: Array<{ feature_id: string; permission_ids: string[] }>;
      featureIds?: string | string[];
    },
    @Res() res: Response
  ) {
    try {
      let featurePermissions = body.featurePermissions;
      
      // Handle form data: convert featureIds to featurePermissions with all permissions
      if (!featurePermissions && body.featureIds) {
        const featureIds = Array.isArray(body.featureIds) ? body.featureIds : [body.featureIds];
        const allPermissions = await this.adminService.getAllPermissions();
        
        featurePermissions = featureIds.map(featureId => ({
          feature_id: featureId,
          permission_ids: allPermissions.items.map(p => (p as any)._id || p.id)
        }));
      }
      
      if (!featurePermissions || featurePermissions.length === 0) {
        throw new BadRequestException('No features or permissions provided');
      }
      
      await this.adminService.assignRoleFeaturePermissions(roleId, featurePermissions);
      res.redirect(`/rbac-admin/roles/${roleId}`);
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException((error as Error).message);
    }
  }

  /**
   * Remove permissions from a specific feature within a role
   */
  @Post('roles/:roleId/remove-permissions')
  @UseGuards(AdminAuthGuard)
  async removeRolePermissions(
    @Param('roleId') roleId: string,
    @Body() body: { featureIds: string | string[]; permissionIds: string | string[] }
  ) {
    try {
      const { featureIds, permissionIds } = body;
      const featureId = Array.isArray(featureIds) ? featureIds[0] : featureIds;
      const permissionsToRemove = Array.isArray(permissionIds) ? permissionIds : [permissionIds];
      
      // Get current role features
      const role = await this.adminService.findRoleByIdWithFeatures(roleId);
      if (!role) {
        throw new NotFoundException('Role not found');
      }

      // Find the existing feature assignment
      const existingFeature = role.features?.find((f: any) => {
        const fId = f.feature_id?.toString() || f.feature?._id?.toString() || f._id?.toString();
        return fId === featureId;
      });
      
      if (!existingFeature || !existingFeature.permissions) {
        throw new NotFoundException('Feature or permissions not found');
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

      await this.adminService.assignRoleFeaturePermissions(roleId, featurePermissions);
      return { success: true, message: 'Permission removed successfully' };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException((error as Error).message);
    }
  }

  /**
   * Add permissions to a specific feature within a role
   */
  @Post('roles/:roleId/add-permissions')
  @UseGuards(AdminAuthGuard)
  async addRolePermissions(
    @Param('roleId') roleId: string,
    @Body() body: { featureIds: string | string[]; permissionIds: string | string[] },
    @Res() res: Response
  ) {
    try {
      const { featureIds, permissionIds } = body;
      const featureId = Array.isArray(featureIds) ? featureIds[0] : featureIds;
      const permissions = Array.isArray(permissionIds) ? permissionIds : [permissionIds];
      
      // Get current role features to merge with new permissions
      const role = await this.adminService.findRoleByIdWithFeatures(roleId);
      if (!role) {
        throw new NotFoundException('Role not found');
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

      await this.adminService.assignRoleFeaturePermissions(roleId, featurePermissions);
      res.redirect(`/rbac-admin/roles/${roleId}`);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException((error as Error).message);
    }
  }

  // =====================================
  // FEATURE MANAGEMENT ROUTES
  // =====================================

  /**
   * Display features list
   */
  @Get('features')
  @UseGuards(AdminAuthGuard)
  async getFeatures(@Res() res: Response) {
    try {
      const featuresResult = await this.adminService.getAllFeatures();
      res.send(getFeaturesListView(featuresResult.items));
    } catch (error) {
      throw new InternalServerErrorException('Error loading features: ' + (error as Error).message);
    }
  }

  /**
   * Display specific feature details
   */
  @Get('features/:featureId')
  @UseGuards(AdminAuthGuard)
  async getFeatureDetails(@Param('featureId') featureId: string, @Res() res: Response) {
    try {
      const feature = await this.adminService.findFeatureById(featureId);
      if (!feature) {
        throw new NotFoundException('Feature not found');
      }

      const rolesResult = await this.adminService.getAllRoles();
      res.send(getFeatureDetailsView(feature, rolesResult.items));
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Error loading feature: ' + (error as Error).message);
    }
  }

  /**
   * Create a new feature
   */
  @Post('features/create')
  @UseGuards(AdminAuthGuard)
  async createFeature(
    @Body() body: { name: string; description: string },
    @Res() res: Response
  ) {
    try {
      const { name, description } = body;

      const existing = await this.adminService.findFeatureByName(name);
      if (existing) {
        throw new BadRequestException('Feature already exists');
      }

      await this.adminService.createFeature({ name, description });
      res.redirect('/rbac-admin/features');
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException((error as Error).message);
    }
  }

  /**
   * Update feature information
   */
  @Post('features/:featureId/update')
  @UseGuards(AdminAuthGuard)
  async updateFeature(
    @Param('featureId') featureId: string,
    @Body() body: { name: string; description: string }
  ) {
    try {
      const { name, description } = body;
      await this.adminService.updateFeature(featureId, { name, description });
      return { success: true, message: 'Feature updated successfully' };
    } catch (error) {
      throw new InternalServerErrorException((error as Error).message);
    }
  }

  /**
   * Delete feature
   */
  @Post('features/:featureId/delete')
  @UseGuards(AdminAuthGuard)
  async deleteFeature(@Param('featureId') featureId: string) {
    try {
      await this.adminService.deleteFeature(featureId);
      return { success: true, message: 'Feature deleted successfully' };
    } catch (error) {
      throw new InternalServerErrorException((error as Error).message);
    }
  }

  // =====================================
  // PERMISSION MANAGEMENT ROUTES
  // =====================================

  /**
   * Display permissions list
   */
  @Get('permissions')
  @UseGuards(AdminAuthGuard)
  async getPermissions(@Res() res: Response) {
    try {
      const permissionsResult = await this.adminService.getAllPermissions();
      res.send(getPermissionsListView(permissionsResult.items));
    } catch (error) {
      throw new InternalServerErrorException('Error loading permissions: ' + (error as Error).message);
    }
  }

  /**
   * Display specific permission details
   */
  @Get('permissions/:permissionId')
  @UseGuards(AdminAuthGuard)
  async getPermissionDetails(@Param('permissionId') permissionId: string, @Res() res: Response) {
    try {
      const permission = await this.adminService.findPermissionById(permissionId);
      if (!permission) {
        throw new NotFoundException('Permission not found');
      }

      const rolesResult = await this.adminService.getAllRoles();
      res.send(getPermissionDetailsView(permission, rolesResult.items));
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Error loading permission: ' + (error as Error).message);
    }
  }

  /**
   * Create a new permission
   */
  @Post('permissions/create')
  @UseGuards(AdminAuthGuard)
  async createPermission(
    @Body() body: { name: string; description: string },
    @Res() res: Response
  ) {
    try {
      const { name, description } = body;

      const existingPermission = await this.adminService.findPermissionByName(name);
      if (existingPermission) {
        throw new BadRequestException('Permission already exists');
      }

      await this.adminService.createPermission({ name, description });
      res.redirect('/rbac-admin/permissions');
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException((error as Error).message);
    }
  }

  /**
   * Create standard permissions (read, create, update, delete, sudo)
   */
  @Post('permissions/create-standard')
  @UseGuards(AdminAuthGuard)
  async createStandardPermissions(@Body() body: { permissions: Array<{ name: string; description: string }> }) {
    try {
      const { permissions } = body;
      const createdPermissions = [];

      for (const perm of permissions) {
        const existingPermission = await this.adminService.findPermissionByName(perm.name);
        if (!existingPermission) {
          const created = await this.adminService.createPermission(perm);
          createdPermissions.push(created);
        }
      }

      return {
        message: `Created ${createdPermissions.length} standard permissions`,
        permissions: createdPermissions
      };
    } catch (error) {
      throw new InternalServerErrorException((error as Error).message);
    }
  }

  /**
   * Update permission information
   */
  @Post('permissions/:permissionId/update')
  @UseGuards(AdminAuthGuard)
  async updatePermission(
    @Param('permissionId') permissionId: string,
    @Body() body: { name: string; description: string }
  ) {
    try {
      const { name, description } = body;
      await this.adminService.updatePermission(permissionId, { name, description });
      return { message: 'Permission updated successfully' };
    } catch (error) {
      throw new InternalServerErrorException((error as Error).message);
    }
  }

  /**
   * Delete permission
   */
  @Post('permissions/:permissionId/delete')
  @UseGuards(AdminAuthGuard)
  async deletePermission(@Param('permissionId') permissionId: string) {
    try {
      await this.adminService.deletePermission(permissionId);
      return { message: 'Permission deleted successfully' };
    } catch (error) {
      throw new InternalServerErrorException((error as Error).message);
    }
  }
}