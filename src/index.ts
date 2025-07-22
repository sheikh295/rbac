// Main package exports
export { RBAC } from './RBAC';
export * from './types';

// Export models for advanced usage
export { User } from './mongo/models/User';
export { UserRole } from './mongo/models/UserRole';
export { Feature } from './mongo/models/Feature';
export { Permission } from './mongo/models/Permission';

// Export controllers for advanced usage
export { userRoleController } from './mongo/controllers/userrole.controller';
export { featureController } from './mongo/controllers/feature.controller';

// Default export
import { RBAC } from './RBAC';
export default RBAC;