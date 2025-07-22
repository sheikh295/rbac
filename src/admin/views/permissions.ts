import { getBaseLayout } from './layout';

export const getPermissionsListView = (permissions: any[]): string => {
  const permissionsRows = permissions.map(permission => `
    <tr>
      <td>
        <strong>${permission.name}</strong><br>
        <small style="color: #666;">${permission.description}</small>
      </td>
      <td>
        <span class="badge">${permission.name}</span>
      </td>
      <td>${permission.createdAt ? new Date(permission.createdAt).toLocaleDateString() : 'N/A'}</td>
      <td>
        <button class="btn" onclick="editPermission('${permission._id}', '${permission.name}', '${permission.description}')">Edit</button>
        <button class="btn btn-danger" onclick="confirmDeletePermission('${permission._id}', '${permission.name}')">Delete</button>
      </td>
    </tr>
  `).join('');

  const content = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
      <h2>Permission Management</h2>
      <button class="btn btn-success" onclick="openModal('createPermissionModal')">Create New Permission</button>
    </div>
    
    <div class="card" style="margin-bottom: 2rem;">
      <div class="card-header">
        <h4>Common Permission Types</h4>
      </div>
      <div class="card-body">
        <p style="color: #666;">Standard RBAC permissions you might want to create:</p>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-top: 1rem;">
          <div style="padding: 1rem; background: #f8f9fa; border-radius: 4px; text-align: center;">
            <strong>read</strong><br>
            <small>View/access resources</small>
          </div>
          <div style="padding: 1rem; background: #f8f9fa; border-radius: 4px; text-align: center;">
            <strong>create</strong><br>
            <small>Add new resources</small>
          </div>
          <div style="padding: 1rem; background: #f8f9fa; border-radius: 4px; text-align: center;">
            <strong>update</strong><br>
            <small>Modify existing resources</small>
          </div>
          <div style="padding: 1rem; background: #f8f9fa; border-radius: 4px; text-align: center;">
            <strong>delete</strong><br>
            <small>Remove resources</small>
          </div>
          <div style="padding: 1rem; background: #f8f9fa; border-radius: 4px; text-align: center;">
            <strong>sudo</strong><br>
            <small>Administrative access</small>
          </div>
        </div>
      </div>
    </div>
    
    <div class="card">
      <div class="card-header">
        <h4>All Permissions (${permissions.length})</h4>
      </div>
      <div class="card-body">
        <table class="table">
          <thead>
            <tr>
              <th>Permission</th>
              <th>Type</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${permissionsRows}
          </tbody>
        </table>
        
        ${permissions.length === 0 ? '<p style="text-align: center; color: #666;">No permissions created yet.</p>' : ''}
      </div>
    </div>

    <!-- Create Permission Modal -->
    <div id="createPermissionModal" class="modal">
      <div class="modal-content">
        <span class="close" onclick="closeModal('createPermissionModal')">&times;</span>
        <h3>Create New Permission</h3>
        <form method="POST" action="/rbac-admin/permissions/create">
          <div class="form-group">
            <label>Permission Name:</label>
            <input type="text" name="name" class="form-control" required placeholder="e.g., read, create, update, delete">
            <small style="color: #666;">Use lowercase names that match HTTP methods or actions</small>
          </div>
          <div class="form-group">
            <label>Description:</label>
            <textarea name="description" class="form-control" rows="3" required placeholder="Describe what this permission allows..."></textarea>
          </div>
          <button type="submit" class="btn btn-success">Create Permission</button>
          <button type="button" class="btn" onclick="closeModal('createPermissionModal')">Cancel</button>
        </form>
      </div>
    </div>

    <!-- Edit Permission Modal -->
    <div id="editPermissionModal" class="modal">
      <div class="modal-content">
        <span class="close" onclick="closeModal('editPermissionModal')">&times;</span>
        <h3>Edit Permission</h3>
        <form id="editPermissionForm" method="POST">
          <div class="form-group">
            <label>Permission Name:</label>
            <input type="text" name="name" id="editPermissionName" class="form-control" required>
          </div>
          <div class="form-group">
            <label>Description:</label>
            <textarea name="description" id="editPermissionDescription" class="form-control" rows="3" required></textarea>
          </div>
          <button type="submit" class="btn btn-success">Update Permission</button>
          <button type="button" class="btn" onclick="closeModal('editPermissionModal')">Cancel</button>
        </form>
      </div>
    </div>

    <!-- Quick Create Common Permissions -->
    <div class="card" style="margin-top: 2rem;">
      <div class="card-header">
        <h4>Quick Setup</h4>
      </div>
      <div class="card-body">
        <p>Create all standard RBAC permissions at once:</p>
        <button class="btn btn-success" onclick="createStandardPermissions()">Create Standard Permissions</button>
        <small style="display: block; margin-top: 5px; color: #666;">
          This will create: read, create, update, delete, and sudo permissions
        </small>
      </div>
    </div>

    <script>
      function editPermission(permissionId, name, description) {
        document.getElementById('editPermissionName').value = name;
        document.getElementById('editPermissionDescription').value = description;
        document.getElementById('editPermissionForm').action = '/rbac-admin/permissions/' + permissionId + '/update';
        openModal('editPermissionModal');
      }
      
      function confirmDeletePermission(permissionId, permissionName) {
        if (confirm('Are you sure you want to delete permission: ' + permissionName + '?\\n\\nThis will remove the permission from all roles that use it.')) {
          fetch('/rbac-admin/permissions/' + permissionId + '/delete', { 
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
          })
          .then(response => response.json())
          .then(data => {
            if (data.error) {
              alert('Error: ' + data.error);
            } else {
              window.location.reload();
            }
          })
          .catch(err => alert('Error deleting permission: ' + err.message));
        }
      }
      
      function createStandardPermissions() {
        if (confirm('Create standard RBAC permissions?\\n\\nThis will create: read, create, update, delete, sudo')) {
          const standardPermissions = [
            { name: 'read', description: 'View and access resources' },
            { name: 'create', description: 'Add new resources' },
            { name: 'update', description: 'Modify existing resources' },
            { name: 'delete', description: 'Remove resources' },
            { name: 'sudo', description: 'Full administrative access' }
          ];
          
          fetch('/rbac-admin/permissions/create-standard', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ permissions: standardPermissions })
          })
          .then(response => response.json())
          .then(data => {
            if (data.error) {
              alert('Error: ' + data.error);
            } else {
              alert('Standard permissions created successfully!');
              window.location.reload();
            }
          })
          .catch(err => alert('Error: ' + err.message));
        }
      }
    </script>
  `;
  
  return getBaseLayout('Permissions', content);
};

export const getPermissionDetailsView = (permission: any, relatedRoles: any[]): string => {
  const rolesUsingPermission = relatedRoles.filter(role => 
    role.features && role.features.some((f: any) => 
      f.permissions && f.permissions.some((p: any) => p._id.toString() === permission._id.toString())
    )
  );

  const rolesHtml = rolesUsingPermission.map(role => {
    const featuresWithPermission = role.features.filter((f: any) => 
      f.permissions && f.permissions.some((p: any) => p._id.toString() === permission._id.toString())
    );
    
    return `
      <div class="card" style="margin-bottom: 1rem;">
        <div class="card-header">
          <h5>${role.name}</h5>
        </div>
        <div class="card-body">
          <p>${role.description}</p>
          <strong>Features using this permission:</strong>
          ${featuresWithPermission.map((f: any) => `<span class="badge">${f.feature.name}</span>`).join(' ')}
          <div style="margin-top: 10px;">
            <a href="/rbac-admin/roles/${role._id}" class="btn">View Role Details</a>
          </div>
        </div>
      </div>
    `;
  }).join('');

  const totalFeatures = rolesUsingPermission.reduce((acc, role) => {
    const featuresWithPermission = role.features.filter((f: any) => 
      f.permissions && f.permissions.some((p: any) => p._id.toString() === permission._id.toString())
    );
    return acc + featuresWithPermission.length;
  }, 0);

  const content = `
    <div style="margin-bottom: 1rem;">
      <a href="/rbac-admin/permissions" class="btn">← Back to Permissions</a>
    </div>
    
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
      <div>
        <h2>${permission.name}</h2>
        <p style="color: #666;">${permission.description}</p>
      </div>
      <button class="btn" onclick="editPermission('${permission._id}', '${permission.name}', '${permission.description}')">Edit Permission</button>
    </div>
    
    <div class="card">
      <div class="card-header">
        <h4>Roles Using This Permission (${rolesUsingPermission.length})</h4>
      </div>
      <div class="card-body">
        ${rolesUsingPermission.length > 0 ? rolesHtml : '<p>This permission is not currently assigned to any roles.</p>'}
      </div>
    </div>
    
    <div class="card" style="margin-top: 2rem;">
      <div class="card-header">
        <h4>Permission Statistics</h4>
      </div>
      <div class="card-body">
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
          <div style="text-align: center; padding: 1rem; background: #f8f9fa; border-radius: 4px;">
            <h3 style="color: #3498db; margin-bottom: 5px;">${rolesUsingPermission.length}</h3>
            <p style="margin: 0; color: #666;">Roles Using</p>
          </div>
          <div style="text-align: center; padding: 1rem; background: #f8f9fa; border-radius: 4px;">
            <h3 style="color: #27ae60; margin-bottom: 5px;">${totalFeatures}</h3>
            <p style="margin: 0; color: #666;">Feature Assignments</p>
          </div>
          <div style="text-align: center; padding: 1rem; background: #f8f9fa; border-radius: 4px;">
            <h3 style="color: #e74c3c; margin-bottom: 5px;">${permission.createdAt ? new Date(permission.createdAt).toLocaleDateString() : 'N/A'}</h3>
            <p style="margin: 0; color: #666;">Created On</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Edit Permission Modal -->
    <div id="editPermissionModal" class="modal">
      <div class="modal-content">
        <span class="close" onclick="closeModal('editPermissionModal')">&times;</span>
        <h3>Edit Permission</h3>
        <form id="editPermissionForm" method="POST">
          <div class="form-group">
            <label>Permission Name:</label>
            <input type="text" name="name" id="editPermissionName" class="form-control" required>
          </div>
          <div class="form-group">
            <label>Description:</label>
            <textarea name="description" id="editPermissionDescription" class="form-control" rows="3" required></textarea>
          </div>
          <button type="submit" class="btn btn-success">Update Permission</button>
          <button type="button" class="btn" onclick="closeModal('editPermissionModal')">Cancel</button>
        </form>
      </div>
    </div>

    <script>
      function editPermission(permissionId, name, description) {
        document.getElementById('editPermissionName').value = name;
        document.getElementById('editPermissionDescription').value = description;
        document.getElementById('editPermissionForm').action = '/rbac-admin/permissions/' + permissionId + '/update';
        openModal('editPermissionModal');
      }
    </script>
  `;
  
  return getBaseLayout('Permission Details', content);
};