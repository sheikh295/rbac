import { Injectable, CanActivate, ExecutionContext, ForbiddenException, UnauthorizedException, InternalServerErrorException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY, PermissionOptions } from '../decorators/check-permissions.decorator';
import { CoreRBAC } from '../../core';

/**
 * NestJS guard that checks RBAC permissions for protected routes.
 * Uses the @CheckPermissions decorator to determine required permissions.
 * Can auto-infer permissions from route paths or use explicit configuration.
 * 
 * @example
 * ```typescript
 * // Apply globally
 * app.useGlobalGuards(new PermissionsGuard(reflector));
 * 
 * // Apply to specific controllers
 * @Controller('billing')
 * @UseGuards(PermissionsGuard)
 * export class BillingController { ... }
 * 
 * // Apply to specific routes
 * @Get('invoices')
 * @UseGuards(PermissionsGuard)
 * @CheckPermissions()
 * getInvoices() { ... }
 * ```
 */
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const permissionOptions = this.reflector.getAllAndOverride<PermissionOptions>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()]
    );

    if (!permissionOptions) {
      return true;
    }

    const request = context.switchToHttp().getRequest();

    try {
      const userIdentity = await this.getUserIdentity(request);
      const { feature, permission } = this.getFeatureAndPermission(request, permissionOptions);

      const user = await CoreRBAC.dbAdapter!.findUserByUserIdWithRole(userIdentity.user_id);

      if (!user) {
        throw new UnauthorizedException('User not found in RBAC system');
      }

      const role = user.role as any;
      if (!role || !role.features) {
        throw new ForbiddenException('No role or features assigned');
      }

      const userFeature = role.features.find((f: any) => f.feature.name === feature);
      if (!userFeature) {
        throw new ForbiddenException(`Access denied to feature: ${feature}`);
      }

      const hasPermission = userFeature.permissions.some((p: any) => p.name === permission);
      if (!hasPermission) {
        throw new ForbiddenException(`Permission denied: ${permission} on ${feature}`);
      }

      return true;
    } catch (error) {
      if (error instanceof UnauthorizedException || error instanceof ForbiddenException) {
        throw error;
      }
      throw new InternalServerErrorException('Internal server error during permission check');
    }
  }

  private async getUserIdentity(request: any): Promise<{ user_id: string; email?: string }> {
    if (!CoreRBAC.config || !CoreRBAC.initialized) {
      throw new InternalServerErrorException('RBAC system not initialized');
    }

    if (CoreRBAC.config.authAdapter) {
      return await CoreRBAC.config.authAdapter(request);
    }

    const user_id = request.user?.id || request.user?.user_id || request.user_id || request.userId;
    const email = request.user?.email || request.email;

    if (!user_id) {
      throw new UnauthorizedException('Unable to determine user identity. Provide authAdapter or attach user info to request.');
    }

    return { user_id, email };
  }

  private getFeatureAndPermission(request: any, options: PermissionOptions): { feature: string; permission: string } {
    if (options.feature && options.permission) {
      return { feature: options.feature, permission: options.permission };
    }

    return this.inferFeatureAndPermission(request);
  }

  private inferFeatureAndPermission(request: any): { feature: string; permission: string } {
    const pathSegments = request.url.split('/').filter(Boolean);
    const method = request.method.toLowerCase();

    const feature = pathSegments[0] || 'default';

    let permission = 'read';

    if (request.url.includes('/sudo')) {
      permission = 'sudo';
    } else {
      switch (method) {
        case 'get':
          permission = 'read';
          break;
        case 'post':
          if (request.url.includes('/delete') || request.url.includes('/remove')) {
            permission = 'delete';
          } else if (request.url.includes('/update') || request.url.includes('/edit')) {
            permission = 'update';
          } else if (request.url.includes('/create') || request.url.includes('/add')) {
            permission = 'create';
          } else {
            permission = 'create';
          }
          break;
        case 'put':
        case 'patch':
          permission = 'update';
          break;
        case 'delete':
          permission = 'delete';
          break;
        default:
          permission = 'read';
      }
    }

    return { feature, permission };
  }
}