import { SetMetadata } from '@nestjs/common';

export const REGISTER_USER_KEY = 'rbac_register_user';

export interface RegisterUserOptions {
  userExtractor?: (body: any, user?: any) => {
    user_id: string;
    name?: string;
    email?: string;
  };
}

/**
 * NestJS decorator that marks a route for automatic user registration in the RBAC system.
 * Automatically assigns default role if configured and calls registration hooks.
 * 
 * @param options - Optional user data extractor function
 * @returns Method decorator
 * 
 * @example
 * ```typescript
 * // Default extraction from request body
 * @Post('signup')
 * @RegisterUser()
 * createUser(@Body() userData: CreateUserDto) { ... }
 * 
 * // Custom user data extraction
 * @Post('signup')
 * @RegisterUser({
 *   userExtractor: (body, user) => ({
 *     user_id: body.id,
 *     name: body.fullName,
 *     email: body.emailAddress
 *   })
 * })
 * createUser(@Body() userData: CreateUserDto) { ... }
 * ```
 */
export const RegisterUser = (options: RegisterUserOptions = {}) => {
  return SetMetadata(REGISTER_USER_KEY, options);
};