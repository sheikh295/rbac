import { getBaseLayout } from './layout';

export const getDashboardView = (stats?: {users: number, roles: number, features: number, permissions: number}): string => {
  const content = `
    <div style="margin-bottom: 32px;">
      <h2 style="color: #2d3748; font-size: 28px; margin-bottom: 8px;">Welcome to RBAC Admin</h2>
      <p style="color: #718096; font-size: 16px;">Manage your application's role-based access control system from here.</p>
    </div>
    
    <!-- Stats Grid -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-value">${stats?.users ?? 0}</div>
        <div class="stat-label">👥 Total Users</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${stats?.roles ?? 0}</div>
        <div class="stat-label">🎭 Active Roles</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${stats?.features ?? 0}</div>
        <div class="stat-label">⚙️ Features</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${stats?.permissions ?? 5}</div>
        <div class="stat-label">🔐 Permissions</div>
      </div>
    </div>
    
    <!-- Management Cards -->
    <div class="content-card" style="margin-bottom: 24px;">
      <div class="content-card-header">
        <div class="content-card-title">Management Tools</div>
      </div>
      <div class="content-card-body">
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 24px;">
          <div class="card">
            <div class="card-header">
              <h4 style="display: flex; align-items: center; gap: 8px;">👥 Users</h4>
            </div>
            <div class="card-body">
              <p style="color: #718096; margin-bottom: 16px;">Manage user registrations and role assignments</p>
              <a href="/rbac-admin/users" class="btn">Manage Users</a>
            </div>
          </div>
          
          <div class="card">
            <div class="card-header">
              <h4 style="display: flex; align-items: center; gap: 8px;">🎭 Roles</h4>
            </div>
            <div class="card-body">
              <p style="color: #718096; margin-bottom: 16px;">Create and manage user roles with feature permissions</p>
              <a href="/rbac-admin/roles" class="btn">Manage Roles</a>
            </div>
          </div>
          
          <div class="card">
            <div class="card-header">
              <h4 style="display: flex; align-items: center; gap: 8px;">⚙️ Features</h4>
            </div>
            <div class="card-body">
              <p style="color: #718096; margin-bottom: 16px;">Define application features for permission control</p>
              <a href="/rbac-admin/features" class="btn">Manage Features</a>
            </div>
          </div>
          
          <div class="card">
            <div class="card-header">
              <h4 style="display: flex; align-items: center; gap: 8px;">🔐 Permissions</h4>
            </div>
            <div class="card-body">
              <p style="color: #718096; margin-bottom: 16px;">Configure granular permissions (read, create, update, delete)</p>
              <a href="/rbac-admin/permissions" class="btn">Manage Permissions</a>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Quick Actions -->
    <div class="content-card">
      <div class="content-card-header">
        <div class="content-card-title">Quick Actions</div>
      </div>
      <div class="content-card-body">
        <div style="display: flex; gap: 12px; flex-wrap: wrap;">
          <a href="/rbac-admin/users" class="btn btn-success">➕ Add New User</a>
          <a href="/rbac-admin/roles" class="btn btn-success">🎭 Create New Role</a>
          <a href="/rbac-admin/features" class="btn btn-success">⚙️ Create New Feature</a>
          <a href="/rbac-admin/permissions" class="btn btn-secondary">🔐 Manage Permissions</a>
        </div>
      </div>
    </div>
  `;
  
  return getBaseLayout('Dashboard', content, '/');
};