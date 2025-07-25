import { Injectable, CanActivate, ExecutionContext, ConflictException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { REGISTER_USER_KEY, RegisterUserOptions } from '../decorators/register-user.decorator';
import { CoreRBAC } from '../../core';

/**
 * NestJS guard that automatically registers users in the RBAC system.
 * Uses the @RegisterUser decorator to determine user extraction logic.
 * Automatically assigns default role if configured and calls registration hooks.
 * 
 * @example
 * ```typescript
 * // Apply to specific routes
 * @Post('signup')
 * @UseGuards(RegisterUserGuard)
 * @RegisterUser()
 * createUser(@Body() userData: CreateUserDto) { ... }
 * 
 * // With custom user extraction
 * @Post('signup')
 * @UseGuards(RegisterUserGuard)
 * @RegisterUser({
 *   userExtractor: (body) => ({
 *     user_id: body.id,
 *     name: body.fullName,
 *     email: body.emailAddress
 *   })
 * })
 * createUser(@Body() userData: CreateUserDto) { ... }
 * ```
 */
@Injectable()
export class RegisterUserGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const registerOptions = this.reflector.getAllAndOverride<RegisterUserOptions>(
      REGISTER_USER_KEY,
      [context.getHandler(), context.getClass()]
    );

    if (!registerOptions) {
      return true;
    }

    const request = context.switchToHttp().getRequest();

    try {
      if (!CoreRBAC.config || !CoreRBAC.initialized || !CoreRBAC.dbAdapter) {
        throw new InternalServerErrorException('RBAC system not initialized');
      }

      const userData = registerOptions.userExtractor
        ? registerOptions.userExtractor(request.body, request.user)
        : {
            user_id: request.body.user_id || request.body.id,
            name: request.body.name,
            email: request.body.email,
          };

      if (!userData.user_id) {
        throw new BadRequestException('user_id is required');
      }

      const existingUser = await CoreRBAC.dbAdapter.findUserByUserId(userData.user_id);
      if (existingUser) {
        throw new ConflictException('User already registered in RBAC system');
      }

      let defaultRoleId = undefined;
      if (CoreRBAC.config.defaultRole) {
        const role = await CoreRBAC.dbAdapter.findRoleByName(CoreRBAC.config.defaultRole);
        if (role) {
          defaultRoleId = role.id;
        }
      }

      await CoreRBAC.dbAdapter.createUser({
        user_id: userData.user_id,
        name: userData.name || '',
        email: userData.email || '',
        role_id: defaultRoleId,
      });

      if (CoreRBAC.config.onUserRegister) {
        await CoreRBAC.config.onUserRegister(userData);
      }

      // Attach user info to request for downstream handlers
      request.rbacUser = userData;

      return true;
    } catch (error) {
      if (error instanceof ConflictException || error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('Internal server error during user registration');
    }
  }
}