import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Request, Response } from 'express';

/**
 * NestJS Guard for Admin Dashboard Authentication
 * Protects admin routes by checking for valid authentication session.
 * Redirects to login page if user is not authenticated.
 * 
 * Features:
 * - Session-based authentication
 * - Automatic redirect to login for unauthenticated requests
 * - Compatible with NestJS guard system
 * 
 * @example
 * ```typescript
 * @Controller('rbac-admin')
 * export class RbacAdminController {
 *   @Get('dashboard')
 *   @UseGuards(AdminAuthGuard)
 *   async getDashboard() {
 *     // This route is protected by admin authentication
 *     return { message: 'Welcome to admin dashboard' };
 *   }
 * }
 * ```
 */
@Injectable()
export class AdminAuthGuard implements CanActivate {
  /**
   * Determines if the current request is authorized to access admin routes
   * @param context - ExecutionContext containing request/response objects
   * @returns boolean - True if authenticated, false otherwise
   */
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request & { session?: any }>();
    const response = context.switchToHttp().getResponse<Response>();

    // Check if user is authenticated via session
    if (request.session && request.session.authenticated === true) {
      return true;
    }

    // For HTML requests, redirect to login page
    const acceptHeader = request.headers.accept || '';
    if (acceptHeader.includes('text/html')) {
      response.redirect('/rbac-admin/login');
      return false;
    }

    // For API requests, throw unauthorized exception
    throw new UnauthorizedException({
      error: 'Authentication required',
      message: 'Please log in to access the admin dashboard',
      loginUrl: '/rbac-admin/login'
    });
  }
}