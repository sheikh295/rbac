import { DynamicModule, Module, Provider } from '@nestjs/common';
import { RbacAdminController } from './admin.controller';
import { RbacAdminService } from './admin.service';
import { AdminAuthGuard } from './guards/admin-auth.guard';
import { DatabaseAdapter } from '../adapters/DatabaseAdapter';
import { MongoAdapter } from '../adapters/MongoAdapter';
import { PostgresAdapter } from '../adapters/PostgresAdapter';
import { RbacModuleOptions, RbacModule } from './rbac.module';

/**
 * Configuration options for the RBAC Admin Module
 */
export interface RbacAdminModuleOptions {
  /**
   * Admin login credentials
   */
  adminCredentials: {
    username: string;
    password: string;
  };
  
  /**
   * Secret key for session encryption
   */
  sessionSecret: string;
  
  /**
   * Optional session configuration
   */
  sessionOptions?: {
    name?: string;
    maxAge?: number;  
    secure?: boolean;
    httpOnly?: boolean;
  };
}

/**
 * Async configuration options for the RBAC Admin Module
 */
export interface RbacAdminModuleAsyncOptions {
  useFactory: (...args: any[]) => Promise<RbacAdminModuleOptions> | RbacAdminModuleOptions;
  inject?: any[];
}

/**
 * NestJS Admin Dashboard Module for RBAC System
 * 
 * Provides a complete web-based admin interface for managing RBAC entities.
 * Includes session-based authentication, user management, role management,
 * feature management, and permission management.
 * 
 * Features:
 * - Beautiful web-based admin dashboard
 * - Session-based authentication with configurable credentials
 * - User management with pagination and search
 * - Role and permission management
 * - Feature management
 * - Real-time dashboard statistics
 * - Multi-database support (MongoDB/PostgreSQL)
 * 
 * @example
 * ```typescript
 * // STEP 1: Setup session middleware in main.ts (REQUIRED!)
 * // main.ts
 * import { NestFactory } from '@nestjs/core';
 * import { AppModule } from './app.module';
 * import * as session from 'express-session';
 * 
 * async function bootstrap() {
 *   const app = await NestFactory.create(AppModule);
 *   
 *   // REQUIRED: Setup session middleware for admin dashboard
 *   app.use(
 *     session({
 *       secret: 'your-session-secret-key-here',
 *       resave: false,
 *       saveUninitialized: false,
 *       cookie: {
 *         maxAge: 24 * 60 * 60 * 1000, // 24 hours
 *         httpOnly: true,
 *         secure: false // Set to true in production with HTTPS
 *       }
 *     })
 *   );
 *   
 *   await app.listen(3000);
 * }
 * bootstrap();
 * 
 * // STEP 2: Setup modules in app.module.ts
 * @Module({
 *   imports: [
 *     // 1. First import the main RBAC module (REQUIRED)
 *     RbacModule.forRoot({
 *       global: true, // Make it global so admin module can access providers
 *       database: {
 *         type: 'mongodb',
 *         connection: mongooseConnection
 *       },
 *       authAdapter: async (req) => ({ user_id: req.user.id }),
 *       defaultRole: 'user'
 *     }),
 *     
 *     // 2. Then import the admin dashboard module
 *     RbacAdminModule.forRoot({
 *       adminCredentials: {
 *         username: 'admin',
 *         password: 'secure-password-123'
 *       },
 *       sessionSecret: 'your-session-secret-key-here' // Same as main.ts
 *     })
 *   ],
 *   controllers: [AppController],
 *   providers: [AppService]
 * })
 * export class AppModule {}
 * ```
 * 
 * @example
 * ```typescript
 * // Async configuration with environment variables
 * @Module({
 *   imports: [
 *     // 1. Main RBAC module first (REQUIRED) 
 *     RbacModule.forRoot({
 *       global: true, // Make it global for admin module access
 *       database: {
 *         type: 'postgresql',
 *         connection: pgPool
 *       },
 *       authAdapter: async (req) => ({ user_id: req.user.id }),
 *       defaultRole: 'user'
 *     }),
 *     
 *     // 2. Admin module second
 *     RbacAdminModule.forRootAsync({
 *       useFactory: async (configService: ConfigService) => ({
 *         adminCredentials: {
 *           username: configService.get('ADMIN_USERNAME', 'admin'),
 *           password: configService.get('ADMIN_PASSWORD')
 *         },
 *         sessionSecret: configService.get('SESSION_SECRET'),
 *         sessionOptions: {
 *           name: 'rbac.admin.sid',
 *           maxAge: 24 * 60 * 60 * 1000, // 24 hours
 *           secure: configService.get('NODE_ENV') === 'production',
 *           httpOnly: true
 *         }
 *       }),
 *       inject: [ConfigService]
 *     })
 *   ]
 * })
 * export class AppModule {}
 * ```
 * 
 * @example
 * ```typescript
 * // Access admin service in your own services
 * @Injectable()
 * export class MyCustomAdminService {
 *   constructor(private rbacAdminService: RbacAdminService) {}
 *   
 *   async getAdminDashboardData() {
 *     const stats = await this.rbacAdminService.getDashboardStats();
 *     const users = await this.rbacAdminService.getAllUsers(10, 0, '');
 *     
 *     return {
 *       statistics: stats,
 *       recentUsers: users.items
 *     };
 *   }
 *   
 *   async bulkUserOperations(userIds: string[], operation: string) {
 *     for (const userId of userIds) {
 *       if (operation === 'delete') {
 *         await this.rbacAdminService.deleteUser(userId);
 *       }
 *       // Add more bulk operations as needed
 *     }
 *   }
 * }
 * ```
 */
@Module({})
export class RbacAdminModule {
  /**
   * Configure the RBAC Admin Module with static options
   * 
   * @param options - Configuration options for admin dashboard
   * @returns DynamicModule - Configured module
   */
  static forRoot(options: RbacAdminModuleOptions): DynamicModule {
    const providers: Provider[] = [
      {
        provide: 'RBAC_ADMIN_CONFIG',
        useValue: options
      },
      RbacAdminService,
      AdminAuthGuard
    ];

    return {
      module: RbacAdminModule,
      controllers: [RbacAdminController],
      providers,
      exports: [RbacAdminService, AdminAuthGuard]
    };
  }

  /**
   * Configure the RBAC Admin Module with async options
   * 
   * @param options - Async configuration options
   * @returns DynamicModule - Configured module
   */
  static forRootAsync(options: RbacAdminModuleAsyncOptions): DynamicModule {
    const providers: Provider[] = [
      {
        provide: 'RBAC_ADMIN_CONFIG',
        useFactory: options.useFactory,
        inject: options.inject || []
      },
      RbacAdminService,
      AdminAuthGuard
    ];

    return {
      module: RbacAdminModule,
      controllers: [RbacAdminController],
      providers,
      exports: [RbacAdminService, AdminAuthGuard]
    };
  }
}