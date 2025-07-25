import { getBaseLayout } from './layout';

export const getUsersListView = (users: any[], roles: any[], pagination?: any): string => {
  const usersRows = users.map(user => `
    <tr>
      <td>
        <div style="font-weight: 500; color: #2d3748;">${user.user_id}</div>
      </td>
      <td>${user.name || '<span style="color: #a0aec0;">N/A</span>'}</td>
      <td>${user.email || '<span style="color: #a0aec0;">N/A</span>'}</td>
      <td>
        ${user.role ? `<span class="badge badge-success">${(user.role as any).name}</span>` : '<span class="badge badge-secondary">No Role</span>'}
      </td>
      <td>
        <div style="display: flex; gap: 8px;">
          <button class="btn btn-sm" onclick="openModal('assignRoleModal-${user.user_id}')" title="Assign Role">
            👤 Assign
          </button>
          <button class="btn btn-sm btn-danger" onclick="confirmDelete('${user.user_id}', '${user.user_id}')" title="Delete User">
            🗑️ Delete
          </button>
        </div>
      </td>
    </tr>
  `).join('');

  const roleOptions = roles.map(role => `<option value="${role.name}">${role.name}</option>`).join('');
  
  const roleModals = users.map(user => `
    <div id="assignRoleModal-${user.user_id}" class="modal">
      <div class="modal-content">
        <span class="close" onclick="closeModal('assignRoleModal-${user.user_id}')">&times;</span>
        <h3>Assign Role to ${user.user_id}</h3>
        <form method="POST" action="/rbac-admin/users/${user.user_id}/assign-role">
          <div class="form-group">
            <label>Select Role:</label>
            <select name="roleName" class="form-control" required>
              <option value="">Select a role...</option>
              ${roleOptions}
            </select>
          </div>
          <button type="submit" class="btn btn-success">Assign Role</button>
          <button type="button" class="btn" onclick="closeModal('assignRoleModal-${user.user_id}')">Cancel</button>
        </form>
      </div>
    </div>
  `).join('');

  // Enhanced pagination HTML
  let paginationHtml = '';
  if (pagination && pagination.totalPages > 1) {
    const searchParam = pagination.search || '';
    let pageNumbers = '';
    
    // Generate page numbers with smart truncation
    const currentPage = pagination.currentPage;
    const totalPages = pagination.totalPages;
    
    // Always show first page
    if (currentPage > 3) {
      pageNumbers += `<a href="/rbac-admin/users?page=1&search=${searchParam}" class="pagination-btn">1</a>`;
      if (currentPage > 4) {
        pageNumbers += `<span class="pagination-btn" style="cursor: default;">...</span>`;
      }
    }
    
    // Show pages around current page
    const startPage = Math.max(1, currentPage - 2);
    const endPage = Math.min(totalPages, currentPage + 2);
    
    for (let i = startPage; i <= endPage; i++) {
      if (i === currentPage) {
        pageNumbers += `<span class="pagination-btn active">${i}</span>`;
      } else {
        pageNumbers += `<a href="/rbac-admin/users?page=${i}&search=${searchParam}" class="pagination-btn">${i}</a>`;
      }
    }
    
    // Always show last page
    if (currentPage < totalPages - 2) {
      if (currentPage < totalPages - 3) {
        pageNumbers += `<span class="pagination-btn" style="cursor: default;">...</span>`;
      }
      pageNumbers += `<a href="/rbac-admin/users?page=${totalPages}&search=${searchParam}" class="pagination-btn">${totalPages}</a>`;
    }
    
    paginationHtml = `
    <div class="pagination">
      ${pagination.hasPrev ? `<a href="/rbac-admin/users?page=${currentPage - 1}&search=${searchParam}" class="pagination-btn">← Previous</a>` : ''}
      ${pageNumbers}
      ${pagination.hasNext ? `<a href="/rbac-admin/users?page=${currentPage + 1}&search=${searchParam}" class="pagination-btn">Next →</a>` : ''}
    </div>
    <div style="text-align: center; color: #718096; font-size: 14px; margin-top: 16px;">
      Showing ${((currentPage - 1) * pagination.limit) + 1} - ${Math.min(currentPage * pagination.limit, pagination.totalUsers)} of ${pagination.totalUsers} users
    </div>
    `;
  }

  const content = `
    <div class="content-card">
      <div class="content-card-header">
        <div class="content-card-title">User Management</div>
        <button class="btn btn-success" onclick="openModal('createUserModal')">
          ➕ Add User
        </button>
      </div>
      
      <div class="content-card-body">
        <!-- Search and Controls -->
        ${pagination ? `
        <div style="margin-bottom: 24px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
            <form method="GET" action="/rbac-admin/users" style="display: flex; gap: 12px; align-items: center;">
              <input type="hidden" name="page" value="1">
              <input type="hidden" name="limit" value="${pagination.limit}">
              <div style="position: relative; flex: 1; max-width: 400px;">
                <input 
                  type="text" 
                  name="search" 
                  value="${pagination.search || ''}"
                  placeholder="Search users by ID, name, or email..." 
                  class="form-control"
                  style="padding-left: 40px;"
                >
                <span style="position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: #718096;">🔍</span>
              </div>
              <button type="submit" class="btn">Search</button>
              ${pagination.search ? `<a href="/rbac-admin/users" class="btn btn-secondary">Clear</a>` : ''}
            </form>
            
            <form method="GET" action="/rbac-admin/users" style="display: flex; gap: 8px; align-items: center;">
              <input type="hidden" name="page" value="1">
              <input type="hidden" name="search" value="${pagination.search || ''}">
              <label style="font-size: 14px; color: #4a5568;">Show:</label>
              <select name="limit" class="form-control" style="width: auto; padding: 6px 12px;" onchange="this.form.submit()">
                <option value="5" ${pagination.limit === 5 ? 'selected' : ''}>5</option>
                <option value="10" ${pagination.limit === 10 ? 'selected' : ''}>10</option>
                <option value="25" ${pagination.limit === 25 ? 'selected' : ''}>25</option>
                <option value="50" ${pagination.limit === 50 ? 'selected' : ''}>50</option>
              </select>
              <span style="font-size: 14px; color: #4a5568;">per page</span>
            </form>
          </div>
        </div>
        ` : ''}

        <!-- Users Table -->
        <div class="responsive-table">
          <table class="table">
            <thead>
              <tr>
                <th>User ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th style="text-align: center;">Actions</th>
              </tr>
            </thead>
            <tbody>
              ${users.length > 0 ? usersRows : `
                <tr>
                  <td colspan="5" style="text-align: center; padding: 48px; color: #a0aec0;">
                    ${pagination?.search ? '🔍 No users found matching your search.' : '👥 No users registered yet.'}
                  </td>
                </tr>
              `}
            </tbody>
          </table>
        </div>
        
        ${paginationHtml}
      </div>
    </div>

    <!-- Create User Modal -->
    <div id="createUserModal" class="modal">
      <div class="modal-content">
        <span class="close" onclick="closeModal('createUserModal')">&times;</span>
        <h3>Register New User</h3>
        <form method="POST" action="/rbac-admin/users/create">
          <div class="form-group">
            <label>User ID:</label>
            <input type="text" name="user_id" class="form-control" required>
          </div>
          <div class="form-group">
            <label>Name:</label>
            <input type="text" name="name" class="form-control">
          </div>
          <div class="form-group">
            <label>Email:</label>
            <input type="email" name="email" class="form-control">
          </div>
          <button type="submit" class="btn btn-success">Create User</button>
          <button type="button" class="btn" onclick="closeModal('createUserModal')">Cancel</button>
        </form>
      </div>
    </div>

    ${roleModals}

    <script>
      function confirmDelete(userId, userIdDisplay) {
        if (confirm('Are you sure you want to delete user: ' + userIdDisplay + '?')) {
          fetch('/rbac-admin/users/' + userId + '/delete', { 
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
          })
          .then(response => {
            if (response.ok) {
              window.location.reload();
            } else {
              throw new Error('Delete failed');
            }
          })
          .catch(err => {
            alert('Error deleting user: ' + err.message);
          });
        }
      }
    </script>
  `;
  
  return getBaseLayout('Users', content, '/users');
};

export const getUserDetailsView = (user: any, availableRoles: any[]): string => {
  const roleOptions = availableRoles.map(role => 
    `<option value="${role.name}" ${user.role && (user.role as any).name === role.name ? 'selected' : ''}>${role.name}</option>`
  ).join('');

  const content = `
    <div style="margin-bottom: 1rem;">
      <a href="/rbac-admin/users" class="btn">← Back to Users</a>
    </div>
    
    <h2>User Details: ${user.user_id}</h2>
    
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; margin-top: 2rem;">
      <div class="card">
        <div class="card-header">
          <h4>Basic Information</h4>
        </div>
        <div class="card-body">
          <form method="POST" action="/rbac-admin/users/${user.user_id}/update">
            <div class="form-group">
              <label>User ID:</label>
              <input type="text" value="${user.user_id}" class="form-control" disabled>
            </div>
            <div class="form-group">
              <label>Name:</label>
              <input type="text" name="name" value="${user.name || ''}" class="form-control">
            </div>
            <div class="form-group">
              <label>Email:</label>
              <input type="email" name="email" value="${user.email || ''}" class="form-control">
            </div>
            <button type="submit" class="btn btn-success">Update Info</button>
          </form>
        </div>
      </div>
      
      <div class="card">
        <div class="card-header">
          <h4>Role Assignment</h4>
        </div>
        <div class="card-body">
          <p><strong>Current Role:</strong> ${user.role ? (user.role as any).name : 'No Role Assigned'}</p>
          
          <form method="POST" action="/rbac-admin/users/${user.user_id}/assign-role" style="margin-top: 1rem;">
            <div class="form-group">
              <label>Assign New Role:</label>
              <select name="roleName" class="form-control">
                <option value="">No Role</option>
                ${roleOptions}
              </select>
            </div>
            <button type="submit" class="btn btn-success">Update Role</button>
          </form>
        </div>
      </div>
    </div>
    
    ${user.role ? `
    <div class="card" style="margin-top: 2rem;">
      <div class="card-header">
        <h4>Current Permissions</h4>
      </div>
      <div class="card-body">
        <p><strong>Role:</strong> ${(user.role as any).name}</p>
        <p><strong>Description:</strong> ${(user.role as any).description}</p>
        
        ${(user.role as any).features && (user.role as any).features.length > 0 ? `
          <h5 style="margin-top: 1rem;">Features & Permissions:</h5>
          ${(user.role as any).features.map((f: any) => `
            <div style="margin: 10px 0; padding: 10px; background: #f8f9fa; border-radius: 4px;">
              <strong>${f.feature.name}:</strong> ${f.feature.description}<br>
              <strong>Permissions:</strong> 
              ${f.permissions.map((p: any) => `<span class="badge">${p.name}</span>`).join(' ')}
            </div>
          `).join('')}
        ` : '<p>No features assigned to this role.</p>'}
      </div>
    </div>
    ` : ''}
  `;
  
  return getBaseLayout('User Details', content, '/users');
};