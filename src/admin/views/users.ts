import { getBaseLayout } from './layout';

export const getUsersListView = (users: any[], roles: any[]): string => {
  const usersRows = users.map(user => `
    <tr>
      <td>${user.user_id}</td>
      <td>${user.name || 'N/A'}</td>
      <td>${user.email || 'N/A'}</td>
      <td>${user.role ? (user.role as any).name : 'No Role'}</td>
      <td>
        <button class="btn" onclick="openModal('assignRoleModal-${user.user_id}')">Assign Role</button>
        <button class="btn btn-danger" onclick="confirmDelete('${user._id}', '${user.user_id}')">Delete</button>
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

  const content = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
      <h2>User Management</h2>
      <button class="btn btn-success" onclick="openModal('createUserModal')">Register New User</button>
    </div>
    
    <div class="card">
      <div class="card-header">
        <h4>All Users (${users.length})</h4>
      </div>
      <div class="card-body">
        <table class="table">
          <thead>
            <tr>
              <th>User ID</th>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${usersRows}
          </tbody>
        </table>
        
        ${users.length === 0 ? '<p style="text-align: center; color: #666;">No users registered yet.</p>' : ''}
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
          .then(() => window.location.reload())
          .catch(err => alert('Error deleting user: ' + err.message));
        }
      }
    </script>
  `;
  
  return getBaseLayout('Users', content);
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
  
  return getBaseLayout('User Details', content);
};