import { Module, DynamicModule, Global } from '@nestjs/common';
import { CoreRBAC } from '../core';
import { RBACConfig } from '../types';
import { PermissionsGuard } from './guards/permissions.guard';
import { RegisterUserGuard } from './guards/register-user.guard';
import { RbacService } from './rbac.service';

export interface RbacModuleOptions extends RBACConfig {
  global?: boolean;
}

/**
 * NestJS module for RBAC integration.
 * Provides guards, services, and configuration for role-based access control.
 * 
 * @example
 * ```typescript
 * // Basic configuration
 * @Module({
 *   imports: [
 *     RbacModule.forRoot({
 *       database: {
 *         type: 'mongodb',
 *         connection: mongooseConnection
 *       },
 *       authAdapter: async (req) => ({ user_id: req.user.id }),
 *       defaultRole: 'user'
 *     })
 *   ]
 * })
 * export class AppModule {}
 * 
 * // Global configuration (available in all modules)
 * @Module({
 *   imports: [
 *     RbacModule.forRoot({
 *       global: true,
 *       database: {
 *         type: 'postgresql',
 *         connection: pgPool
 *       },
 *       authAdapter: async (req) => ({ user_id: req.user.id }),
 *       defaultRole: 'user'
 *     })
 *   ]
 * })
 * export class AppModule {}
 * 
 * // Async configuration
 * @Module({
 *   imports: [
 *     RbacModule.forRootAsync({
 *       useFactory: async (configService: ConfigService) => ({
 *         database: {
 *           type: 'mongodb',
 *           connection: await createMongoConnection(configService.get('MONGO_URL'))
 *         },
 *         authAdapter: async (req) => ({ user_id: req.user.id }),
 *         defaultRole: configService.get('DEFAULT_ROLE', 'user')
 *       }),
 *       inject: [ConfigService]
 *     })
 *   ]
 * })
 * export class AppModule {}
 * ```
 */
@Module({})
export class RbacModule {
  /**
   * Creates a dynamic module with RBAC configuration.
   * Initializes the RBAC system and provides guards and services.
   */
  static forRoot(options: RbacModuleOptions): DynamicModule {
    const providers = [
      {
        provide: 'RBAC_CONFIG',
        useValue: options,
      },
      {
        provide: 'RBAC_INITIALIZED',
        useFactory: async (config: RbacModuleOptions) => {
          await CoreRBAC.init(config);
          return true;
        },
        inject: ['RBAC_CONFIG'],
      },
      {
        provide: 'RBAC_DB_ADAPTER',
        useFactory: () => {
          if (!CoreRBAC.dbAdapter) {
            throw new Error('RBAC system not initialized. Database adapter not available.');
          }
          return CoreRBAC.dbAdapter;
        },
        inject: ['RBAC_INITIALIZED'],
      },
      RbacService,
      PermissionsGuard,
      RegisterUserGuard,
    ];

    return {
      module: RbacModule,
      global: options.global || false,
      providers,
      exports: [RbacService, PermissionsGuard, RegisterUserGuard, 'RBAC_CONFIG', 'RBAC_DB_ADAPTER'],
    };
  }

  /**
   * Creates a dynamic module with async RBAC configuration.
   * Useful when configuration depends on other services or external resources.
   */
  static forRootAsync(options: {
    useFactory: (...args: any[]) => Promise<RbacModuleOptions> | RbacModuleOptions;
    inject?: any[];
    global?: boolean;
  }): DynamicModule {
    const providers = [
      {
        provide: 'RBAC_CONFIG',
        useFactory: options.useFactory,
        inject: options.inject || [],
      },
      {
        provide: 'RBAC_INITIALIZED',
        useFactory: async (config: RbacModuleOptions) => {
          await CoreRBAC.init(config);
          return true;
        },
        inject: ['RBAC_CONFIG'],
      },
      {
        provide: 'RBAC_DB_ADAPTER',
        useFactory: () => {
          if (!CoreRBAC.dbAdapter) {
            throw new Error('RBAC system not initialized. Database adapter not available.');
          }
          return CoreRBAC.dbAdapter;
        },
        inject: ['RBAC_INITIALIZED'],
      },
      RbacService,
      PermissionsGuard,
      RegisterUserGuard,
    ];

    return {
      module: RbacModule,
      global: options.global || false,
      providers,
      exports: [RbacService, PermissionsGuard, RegisterUserGuard, 'RBAC_CONFIG', 'RBAC_DB_ADAPTER'],
    };
  }
}