/**
 * @fileoverview Role-Based Access Control (RBAC) system for Node.js applications.
 * 
 * This package provides a complete RBAC solution with:
 * - Express middleware for authentication and authorization
 * - NestJS decorators, guards, and modules for framework integration
 * - GraphQL directives and resolvers for GraphQL APIs
 * - Automatic permission inference from routes
 * - Admin dashboard for user and role management
 * - Multi-database support (MongoDB & PostgreSQL)
 * - TypeScript support with full type definitions
 * 
 * @author Muhammad Mamoor Ali - sheikh295
 * @version 2.0.0
 * @license MIT
 * 
 * @example
 * ```typescript
 * // Express usage
 * import { RBAC } from '@mamoorali295/rbac';
 * 
 * RBAC.init({
 *   database: { type: 'mongodb', connection: mongoose.connection },
 *   authAdapter: async (req) => ({ user_id: req.user.id }),
 *   defaultRole: 'user'
 * });
 * 
 * app.get('/api/billing', RBAC.checkPermissions(), handler);
 * 
 * // NestJS usage
 * import { RbacModule, CheckPermissions, PermissionsGuard } from '@mamoorali295/rbac/nestjs';
 * 
 * @Module({
 *   imports: [RbacModule.forRoot({ database: { type: 'mongodb', connection: mongooseConnection } })]
 * })
 * export class AppModule {}
 * 
 * @Controller('billing')
 * @UseGuards(PermissionsGuard)
 * export class BillingController {
 *   @Get('invoices')
 *   @CheckPermissions()
 *   getInvoices() { ... }
 * }
 * 
 * // GraphQL usage
 * import { AuthDirective, rbacResolvers } from '@mamoorali295/rbac/graphql';
 * 
 * const server = new ApolloServer({
 *   typeDefs,
 *   resolvers: rbacResolvers,
 *   schemaDirectives: { auth: AuthDirective }
 * });
 * ```
 */

/** Main RBAC system instance */
export { RBAC } from './RBAC';

/** TypeScript type definitions */
export * from './types';

/** Database controllers for safe advanced operations */
export { userRoleController } from './mongo/controllers/userrole.controller';
export { featureController } from './mongo/controllers/feature.controller';

/** NestJS integration - Import from '@mamoorali295/rbac/nestjs' */
// Note: NestJS integration is available via separate import: require('@mamoorali295/rbac/nestjs')

/** GraphQL integration - Import from '@mamoorali295/rbac/graphql' */  
// Note: GraphQL integration is available via separate import: require('@mamoorali295/rbac/graphql')

/** Default export - RBAC system instance */
import { RBAC } from './RBAC';
export default RBAC;