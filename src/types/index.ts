import { Request } from "express";
import { Connection } from "mongoose";

export interface RBACConfig {
  db: Connection;
  authAdapter?: (req: Request) => Promise<{ user_id: string; email?: string }> | { user_id: string; email?: string };
  onUserRegister?: (user: { user_id: string; name?: string; email?: string }) => void | Promise<void>;
  onRoleUpdate?: (payload: { user_id: string; role: string }) => void | Promise<void>;
  defaultRole?: string; // Default role name to assign to new users
}

export interface PermissionCheckOptions {
  feature?: string;
  permission?: string;
}

export interface UserExtractor {
  (req: Request): { user_id: string; name?: string; email?: string };
}

export interface RegisterUserOptions {
  userExtractor?: UserExtractor;
}

export interface AdminDashboardOptions {
  user: string;
  pass: string;
  theme?: string;
}

export interface UserReference {
  user_id: string;
  name?: string;
  email?: string;
  role?: string;
}