import { getBaseLayout } from './layout';

export const getDashboardView = (): string => {
  const content = `
    <h2>Welcome to RBAC Admin Dashboard</h2>
    <p class="lead">Manage your application's role-based access control system from here.</p>
    
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1rem; margin-top: 2rem;">
        <div class="card">
            <div class="card-header">
                <h4>👥 Users</h4>
            </div>
            <div class="card-body">
                <p>Manage user registrations and role assignments</p>
                <a href="/rbac-admin/users" class="btn">Manage Users</a>
            </div>
        </div>
        
        <div class="card">
            <div class="card-header">
                <h4>🎭 Roles</h4>
            </div>
            <div class="card-body">
                <p>Create and manage user roles with feature permissions</p>
                <a href="/rbac-admin/roles" class="btn">Manage Roles</a>
            </div>
        </div>
        
        <div class="card">
            <div class="card-header">
                <h4>⚙️ Features</h4>
            </div>
            <div class="card-body">
                <p>Define application features for permission control</p>
                <a href="/rbac-admin/features" class="btn">Manage Features</a>
            </div>
        </div>
        
        <div class="card">
            <div class="card-header">
                <h4>🔐 Permissions</h4>
            </div>
            <div class="card-body">
                <p>Configure granular permissions (read, create, update, delete)</p>
                <a href="/rbac-admin/permissions" class="btn">Manage Permissions</a>
            </div>
        </div>
    </div>
    
    <div style="margin-top: 3rem;">
        <h3>Quick Actions</h3>
        <div style="margin-top: 1rem;">
            <a href="/rbac-admin/roles/create" class="btn btn-success">Create New Role</a>
            <a href="/rbac-admin/features/create" class="btn btn-success" style="margin-left: 10px;">Create New Feature</a>
        </div>
    </div>
  `;
  
  return getBaseLayout('Dashboard', content);
};