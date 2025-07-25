/**
 * Complete NestJS Example with RBAC Admin Dashboard
 * 
 * This example demonstrates how to integrate the RBAC system with NestJS
 * including the new admin dashboard functionality.
 * 
 * Features demonstrated:
 * - NestJS module setup with RBAC
 * - Admin dashboard integration
 * - Controller with permission decorators
 * - Service integration
 * - Session management setup
 * - Multi-database support examples
 */

import { Module, Controller, Get, Post, UseGuards, Injectable, Body, Param } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { Connection } from 'mongoose';
import * as session from 'express-session';

// RBAC imports
import { 
  RbacModule, 
  RbacService, 
  CheckPermissions, 
  PermissionsGuard,
  RegisterUser,
  RegisterUserGuard
} from '@mamoorali295/rbac/nestjs';

// NEW: Admin dashboard imports
import { 
  RbacAdminModule, 
  RbacAdminService 
} from '@mamoorali295/rbac/nestjs';

// =====================================
// 1. NESTJS APP WITH MONGODB
// =====================================

@Injectable()
class UserService {
  constructor(
    private rbacService: RbacService,
    private adminService: RbacAdminService  // NEW: Admin service injection
  ) {}

  // Regular RBAC operations
  async createUser(userData: any) {
    await this.rbacService.registerUser(userData.id, {
      name: userData.name,
      email: userData.email
    });
    return userData;
  }

  async assignRole(userId: string, roleName: string) {
    return await this.rbacService.assignRole(userId, roleName);
  }

  // NEW: Admin dashboard operations
  async getAdminDashboardStats() {
    return await this.adminService.getDashboardStats();
  }

  async getAllUsersForAdmin(page: number = 1, limit: number = 10, search: string = '') {
    const skip = (page - 1) * limit;
    return await this.adminService.getAllUsers(limit, skip, search);
  }

  async bulkDeleteUsers(userIds: string[]) {
    for (const userId of userIds) {
      await this.adminService.deleteUser(userId);
    }
    return { deleted: userIds.length };
  }
}

@Controller('billing')
@UseGuards(PermissionsGuard)
class BillingController {
  constructor(private userService: UserService) {}

  @Get('invoices')
  @CheckPermissions() // Auto-infers: feature="billing", permission="read"
  async getInvoices() {
    return { invoices: ['Invoice 1', 'Invoice 2'] };
  }

  @Post('create')
  @CheckPermissions({ feature: 'billing', permission: 'create' })
  async createInvoice(@Body() data: any) {
    return { invoice: data, id: Date.now() };
  }

  @Post('users')
  @UseGuards(RegisterUserGuard)
  @RegisterUser()
  async createBillingUser(@Body() userData: any) {
    return await this.userService.createUser(userData);
  }
}

// NEW: Custom admin controller (optional - extends default functionality)
@Controller('custom-admin')
export class CustomAdminController {
  constructor(private adminService: RbacAdminService) {}

  @Get('stats')
  async getCustomStats() {
    const stats = await this.adminService.getDashboardStats();
    const users = await this.adminService.getAllUsers(5, 0, '');
    
    return {
      ...stats,
      recentUsers: users.items,
      customMetric: 'Additional data'
    };
  }

  @Post('bulk-operations')
  async bulkOperations(@Body() body: { operation: string; userIds: string[] }) {
    const { operation, userIds } = body;
    
    if (operation === 'delete') {
      for (const userId of userIds) {
        await this.adminService.deleteUser(userId);
      }
      return { message: `Deleted ${userIds.length} users` };
    }
    
    return { message: 'Operation not supported' };
  }
}

@Module({
  imports: [
    // Main RBAC module setup
    RbacModule.forRoot({
      database: {
        type: 'mongodb',
        connection: {} as Connection // Your mongoose connection
      },
      authAdapter: async (req) => ({ user_id: req.user?.id }),
      defaultRole: 'user',
      onUserRegister: (user) => console.log('User registered:', user.user_id),
      onRoleUpdate: (data) => console.log('Role updated:', data)
    }),

    // NEW: Admin dashboard module
    RbacAdminModule.forRoot({
      adminCredentials: {
        username: 'admin',
        password: 'secure-password-123'
      },
      sessionSecret: 'your-secret-session-key-here',
      sessionOptions: {
        name: 'rbac.admin.sid',
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        httpOnly: true,
        secure: false // Set to true in production with HTTPS
      }
    })
  ],
  controllers: [BillingController, CustomAdminController],
  providers: [UserService]
})
class AppModule {}

// =====================================
// 2. NESTJS APP WITH POSTGRESQL
// =====================================

@Module({
  imports: [
    RbacModule.forRoot({
      database: {
        type: 'postgresql',
        connection: {} // Your PostgreSQL pool connection
      },
      authAdapter: async (req) => ({ user_id: req.user?.id }),
      defaultRole: 'user'
    }),

    // Admin dashboard with PostgreSQL
    RbacAdminModule.forRoot({
      adminCredentials: {
        username: 'admin',
        password: 'postgres-admin-pass'
      },
      sessionSecret: 'postgres-session-secret'
    })
  ],
  controllers: [BillingController, CustomAdminController],
  providers: [UserService]
})
class PostgresAppModule {}

// =====================================
// 3. ASYNC CONFIGURATION EXAMPLE
// =====================================

import { ConfigService } from '@nestjs/config';

@Module({
  imports: [
    // Async RBAC configuration
    RbacModule.forRootAsync({
      useFactory: async (configService: ConfigService) => ({
        database: {
          type: configService.get('DB_TYPE', 'mongodb'),
          connection: {} // Dynamic connection based on config
        },
        authAdapter: async (req) => ({ user_id: req.user?.id }),
        defaultRole: configService.get('DEFAULT_ROLE', 'user')
      }),
      inject: [ConfigService]
    }),

    // Async admin dashboard configuration
    RbacAdminModule.forRootAsync({
      useFactory: async (configService: ConfigService) => ({
        adminCredentials: {
          username: configService.get('ADMIN_USERNAME', 'admin'),
          password: configService.get('ADMIN_PASSWORD', 'changeme')
        },
        sessionSecret: configService.get('SESSION_SECRET', 'fallback-secret'),
        sessionOptions: {
          name: 'rbac.admin.sid',
          maxAge: parseInt(configService.get('SESSION_MAX_AGE', '86400000')),
          secure: configService.get('NODE_ENV') === 'production',
          httpOnly: true
        }
      }),
      inject: [ConfigService]
    })
  ],
  controllers: [BillingController, CustomAdminController],
  providers: [UserService]
})
class AsyncConfigAppModule {}

// =====================================
// 4. APPLICATION BOOTSTRAP
// =====================================

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Session middleware setup (required for admin dashboard)
  app.use(session({
    secret: 'your-secret-session-key-here',
    resave: false,
    saveUninitialized: false,
    name: 'rbac.admin.sid',
    cookie: {
      maxAge: 24 * 60 * 60 * 1000,  // 24 hours
      httpOnly: true,
      secure: false  // Set to true in production with HTTPS
    }
  }));

  await app.listen(3000);
  
  console.log('🚀 NestJS app with RBAC Admin Dashboard running on http://localhost:3000');
  console.log('📊 Admin Dashboard: http://localhost:3000/rbac-admin');
  console.log('🔐 Admin Login: username=admin, password=secure-password-123');
}

// =====================================
// 5. USAGE EXAMPLES
// =====================================

/**
 * Admin Dashboard Features Available:
 * 
 * 1. Dashboard Home: http://localhost:3000/rbac-admin
 *    - Real-time statistics
 *    - Database counts
 *    - Quick navigation
 * 
 * 2. User Management: http://localhost:3000/rbac-admin/users
 *    - Paginated user list
 *    - Search functionality
 *    - Create, update, delete users
 *    - Role assignment
 * 
 * 3. Role Management: http://localhost:3000/rbac-admin/roles
 *    - Create and manage roles
 *    - Assign features and permissions
 *    - Role-based access control
 * 
 * 4. Feature Management: http://localhost:3000/rbac-admin/features
 *    - Application feature management
 *    - Feature descriptions
 *    - Feature-role relationships
 * 
 * 5. Permission Management: http://localhost:3000/rbac-admin/permissions
 *    - Granular permission control
 *    - Standard permissions (read, create, update, delete, sudo)
 *    - Custom permission creation
 * 
 * API Endpoints:
 * - GET /rbac-admin/api/stats - Real-time dashboard statistics
 * - All CRUD operations available via the admin interface
 */

/**
 * Environment Variables (.env):
 * 
 * # Database Configuration
 * DB_TYPE=mongodb  # or postgresql
 * MONGODB_URI=mongodb://localhost:27017/rbac
 * POSTGRES_URL=postgresql://user:pass@localhost:5432/rbac
 * 
 * # Admin Dashboard Configuration
 * ADMIN_USERNAME=admin
 * ADMIN_PASSWORD=your-secure-password
 * SESSION_SECRET=your-super-secure-session-secret
 * SESSION_MAX_AGE=86400000  # 24 hours in milliseconds
 * 
 * # Security
 * NODE_ENV=production  # Enables secure cookies
 */

/**
 * Package.json dependencies:
 * 
 * {
 *   "dependencies": {
 *     "@nestjs/common": "^10.0.0",
 *     "@nestjs/core": "^10.0.0",
 *     "@nestjs/config": "^3.0.0",
 *     "@mamoorali295/rbac": "latest",
 *     "express-session": "^1.17.3",
 *     "mongoose": "^7.0.0",  // For MongoDB
 *     "pg": "^8.8.0"         // For PostgreSQL
 *   },
 *   "devDependencies": {
 *     "@types/express-session": "^1.17.7"
 *   }
 * }
 */

export { AppModule, PostgresAppModule, AsyncConfigAppModule, bootstrap };