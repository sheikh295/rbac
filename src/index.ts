/**
 * @fileoverview Role-Based Access Control (RBAC) system for Node.js applications.
 * 
 * This package provides a complete RBAC solution with:
 * - Express middleware for authentication and authorization
 * - Automatic permission inference from routes
 * - Admin dashboard for user and role management
 * - MongoDB integration with conflict-free collections
 * - TypeScript support with full type definitions
 * 
 * @author Muhammad Mamoor Ali - sheikh295
 * @version 1.0.0
 * @license MIT
 * 
 * @example
 * ```typescript
 * import { RBAC } from '@sheikh295/rbac';
 * 
 * // Initialize the system
 * RBAC.init({
 *   db: mongoose.connection,
 *   authAdapter: async (req) => ({ user_id: req.user.id }),
 *   defaultRole: 'user'
 * }).then((val) => {
 *  app.listen(3000, '0.0.0.0')
 * });
 * 
 * // Use middleware for route protection
 * app.get('/api/billing', RBAC.checkPermissions(), handler);
 * 
 * // Mount admin dashboard
 * app.use('/rbac-admin', RBAC.adminDashboard({
 *   user: 'admin',
 *   pass: 'secret'
 * }));
 * ```
 */

/** Main RBAC system instance */
export { RBAC } from './RBAC';

/** TypeScript type definitions */
export * from './types';

/** Database controllers for safe advanced operations */
export { userRoleController } from './mongo/controllers/userrole.controller';
export { featureController } from './mongo/controllers/feature.controller';

/** Default export - RBAC system instance */
import { RBAC } from './RBAC';
export default RBAC;