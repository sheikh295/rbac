import { SetMetadata } from '@nestjs/common';

export const PERMISSIONS_KEY = 'rbac_permissions';

export interface PermissionOptions {
  feature?: string;
  permission?: string;
}

/**
 * NestJS decorator that marks a route or class for RBAC permission checking.
 * Can auto-infer permissions from the route path or use explicitly provided options.
 * 
 * @param options - Optional feature and permission specification
 * @returns Method decorator
 * 
 * @example
 * ```typescript
 * // Auto-inferred permissions from route path
 * @Get('billing/invoices')
 * @CheckPermissions()
 * getInvoices() { ... }
 * 
 * // Explicit permissions
 * @Post('admin/reset')
 * @CheckPermissions({ feature: 'admin', permission: 'sudo' })
 * resetSystem() { ... }
 * 
 * // Class-level permissions (applied to all methods)
 * @Controller('billing')
 * @CheckPermissions({ feature: 'billing' })
 * export class BillingController { ... }
 * ```
 */
export const CheckPermissions = (options: PermissionOptions = {}) => {
  return SetMetadata(PERMISSIONS_KEY, options);
};