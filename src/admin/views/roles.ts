import { getBaseLayout } from './layout';

export const getRolesListView = (roles: any[], features: any[], permissions: any[]): string => {
  const rolesRows = roles.map(role => {
    const roleId = role._id || role.id; // Handle both MongoDB and PostgreSQL
    return `
    <tr>
      <td>
        <strong>${role.name}</strong><br>
        <small style="color: #666;">${role.description}</small>
      </td>
      <td>${role.features?.length || 0} features</td>
      <td>
        <a href="/rbac-admin/roles/${roleId}" class="btn">View Details</a>
        <button class="btn btn-danger" onclick="confirmDeleteRole('${roleId}', '${role.name}')">Delete</button>
      </td>
    </tr>
  `}).join('');

  const featureCheckboxes = features.map(feature => {
    const featureId = feature._id || feature.id; // Handle both MongoDB and PostgreSQL
    return `
    <div style="margin: 10px 0; padding: 10px; border: 1px solid #ddd; border-radius: 4px;">
      <div>
        <input type="checkbox" name="features" value="${featureId}" id="feature-${featureId}" onchange="togglePermissions('${featureId}')">
        <label for="feature-${featureId}" style="margin-left: 8px; font-weight: bold;">${feature.name}</label>
        <p style="margin: 5px 0; color: #666; font-size: 14px;">${feature.description}</p>
      </div>
      <div id="permissions-${featureId}" style="display: none; margin-top: 10px; padding: 10px; background: #f8f9fa; border-radius: 4px;">
        <strong>Select Permissions:</strong>
        <div style="margin-top: 8px;">
          ${permissions.map(permission => {
            const permissionId = permission._id || permission.id;
            return `
            <label style="display: inline-block; margin-right: 15px; font-weight: normal;">
              <input type="checkbox" name="feature-${featureId}-permissions" value="${permissionId}">
              ${permission.name}
            </label>
          `}).join('')}
        </div>
      </div>
    </div>
  `}).join('');

  const content = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
      <h2>Role Management</h2>
      <button class="btn btn-success" onclick="openModal('createRoleModal')">Create New Role</button>
    </div>
    
    <div class="card">
      <div class="card-header">
        <h4>All Roles (${roles.length})</h4>
      </div>
      <div class="card-body">
        <table class="table">
          <thead>
            <tr>
              <th>Role</th>
              <th>Features</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${rolesRows}
          </tbody>
        </table>
        
        ${roles.length === 0 ? '<p style="text-align: center; color: #666;">No roles created yet.</p>' : ''}
      </div>
    </div>

    <!-- Create Role Modal -->
    <div id="createRoleModal" class="modal">
      <div class="modal-content" style="max-width: 800px; max-height: 80vh; overflow-y: auto;">
        <span class="close" onclick="closeModal('createRoleModal')">&times;</span>
        <h3>Create New Role</h3>
        <form method="POST" action="/rbac-admin/roles/create">
          <div class="form-group">
            <label>Role Name:</label>
            <input type="text" name="name" class="form-control" required>
          </div>
          <div class="form-group">
            <label>Description:</label>
            <textarea name="description" class="form-control" rows="3" required></textarea>
          </div>
          
          <div class="form-group">
            <label>Features & Permissions:</label>
            <div style="max-height: 400px; overflow-y: auto; border: 1px solid #ddd; padding: 10px; border-radius: 4px;">
              ${featureCheckboxes}
            </div>
          </div>
          
          <button type="submit" class="btn btn-success">Create Role</button>
          <button type="button" class="btn" onclick="closeModal('createRoleModal')">Cancel</button>
        </form>
      </div>
    </div>

    <script>
      function togglePermissions(featureId) {
        const checkbox = document.getElementById('feature-' + featureId);
        const permissionsDiv = document.getElementById('permissions-' + featureId);
        
        if (checkbox.checked) {
          permissionsDiv.style.display = 'block';
        } else {
          permissionsDiv.style.display = 'none';
          // Uncheck all permissions for this feature
          const permissionCheckboxes = permissionsDiv.querySelectorAll('input[type="checkbox"]');
          permissionCheckboxes.forEach(cb => cb.checked = false);
        }
      }
      
      function confirmDeleteRole(roleId, roleName) {
        if (confirm('Are you sure you want to delete role: ' + roleName + '?\\n\\nThis action cannot be undone and may affect users assigned to this role.')) {
          fetch('/rbac-admin/roles/' + roleId + '/delete', { 
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
          .catch(err => alert('Error deleting role: ' + err.message));
        }
      }
      
      // Handle form submission to format feature permissions correctly
      document.addEventListener('DOMContentLoaded', function() {
        const form = document.querySelector('#createRoleModal form');
        if (form) {
          form.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const formData = new FormData(form);
            const selectedFeatures = [];
            
            // Get all selected features
            const featureCheckboxes = document.querySelectorAll('input[name="features"]:checked');
            featureCheckboxes.forEach(featureCheckbox => {
              const featureId = featureCheckbox.value;
              const permissionCheckboxes = document.querySelectorAll('input[name="feature-' + featureId + '-permissions"]:checked');
              const permissions = Array.from(permissionCheckboxes).map(cb => cb.value);
              
              if (permissions.length > 0) {
                selectedFeatures.push({
                  feature: featureId,
                  permissions: permissions
                });
              }
            });
            
            // Create JSON payload with formatted features
            const payload = {
              name: formData.get('name'),
              description: formData.get('description'),
              features: selectedFeatures
            };
            
            fetch('/rbac-admin/roles/create', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload)
            })
            .then(response => response.json())
            .then(data => {
              if (data.error) {
                alert('Error: ' + data.error);
              } else {
                window.location.reload();
              }
            })
            .catch(err => alert('Error creating role: ' + err.message));
          });
        }
      });
    </script>
  `;
  
  return getBaseLayout('Roles', content);
};

export const getRoleDetailsView = (role: any, allFeatures: any[], allPermissions: any[]): string => {
  const roleFeatures = role.features || [];
  
  const assignedFeaturesHtml = roleFeatures.map((rf: any) => `
    <div class="card" style="margin-bottom: 1rem;">
      <div class="card-header" style="display: flex; justify-content: space-between; align-items: center;">
        <h5>${rf.feature.name}</h5>
        <button class="btn btn-danger" onclick="removeFeatureFromRole('${role._id || role.id}', '${rf.feature._id || rf.feature.id}')">Remove</button>
      </div>
      <div class="card-body">
        <p>${rf.feature.description}</p>
        <strong>Permissions:</strong>
        ${rf.permissions.map((p: any) => `
          <span class="badge" style="margin: 2px;">
            ${p.name}
            <button onclick="removePermissionFromFeature('${role._id || role.id}', '${rf.feature._id || rf.feature.id}', '${p._id || p.id}')" style="background: none; border: none; color: white; margin-left: 5px; cursor: pointer;">&times;</button>
          </span>
        `).join('')}
        
        <div style="margin-top: 10px;">
          <button class="btn" onclick="openModal('addPermissionModal-${rf.feature._id || rf.feature.id}')">Add Permissions</button>
        </div>
      </div>
    </div>
  `).join('');

  const unassignedFeatures = allFeatures.filter(f => {
    const fId = f._id || f.id;
    return !roleFeatures.some((rf: any) => {
      const rfId = rf.feature._id || rf.feature.id;
      return rfId.toString() === fId.toString();
    });
  });

  const unassignedFeaturesOptions = unassignedFeatures.map(f => 
    `<option value="${f._id || f.id}">${f.name}</option>`
  ).join('');

  const permissionModals = roleFeatures.map((rf: any) => {
    const availablePermissions = allPermissions.filter(p => {
      const pId = p._id || p.id;
      return !rf.permissions.some((rp: any) => {
        const rpId = rp._id || rp.id;
        return rpId.toString() === pId.toString();
      });
    });

    return `
      <div id="addPermissionModal-${rf.feature._id || rf.feature.id}" class="modal">
        <div class="modal-content">
          <span class="close" onclick="closeModal('addPermissionModal-${rf.feature._id || rf.feature.id}')">&times;</span>
          <h3>Add Permissions to ${rf.feature.name}</h3>
          <form method="POST" action="/rbac-admin/roles/${role._id || role.id}/add-permissions">
            <input type="hidden" name="featureIds" value="${rf.feature._id || rf.feature.id}">
            <div class="form-group">
              <label>Select Permissions to Add:</label>
              ${availablePermissions.map(p => `
                <label style="display: block; margin: 5px 0;">
                  <input type="checkbox" name="permissionIds" value="${p._id || p.id}">
                  ${p.name} - ${p.description}
                </label>
              `).join('')}
            </div>
            <button type="submit" class="btn btn-success">Add Selected Permissions</button>
            <button type="button" class="btn" onclick="closeModal('addPermissionModal-${rf.feature._id || rf.feature.id}')">Cancel</button>
          </form>
        </div>
      </div>
    `;
  }).join('');

  const content = `
    <div style="margin-bottom: 1rem;">
      <a href="/rbac-admin/roles" class="btn">← Back to Roles</a>
    </div>
    
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
      <div>
        <h2>${role.name}</h2>
        <p style="color: #666;">${role.description}</p>
      </div>
      <button class="btn btn-success" onclick="openModal('addFeatureModal')">Add Feature</button>
    </div>
    
    <div class="card">
      <div class="card-header">
        <h4>Assigned Features & Permissions (${roleFeatures.length})</h4>
      </div>
      <div class="card-body">
        ${roleFeatures.length > 0 ? assignedFeaturesHtml : '<p>No features assigned to this role yet.</p>'}
      </div>
    </div>

    <!-- Add Feature Modal -->
    <div id="addFeatureModal" class="modal">
      <div class="modal-content">
        <span class="close" onclick="closeModal('addFeatureModal')">&times;</span>
        <h3>Add Features to Role</h3>
        <form method="POST" action="/rbac-admin/roles/${role._id || role.id}/assign-features">
          <div class="form-group">
            <label>Select Features:</label>
            ${unassignedFeatures.length > 0 ? 
              unassignedFeatures.map(f => `
                <label style="display: block; margin: 5px 0;">
                  <input type="checkbox" name="featureIds" value="${f._id || f.id}">
                  ${f.name} - ${f.description}
                </label>
              `).join('') : 
              '<p>All features are already assigned to this role.</p>'
            }
          </div>
          ${unassignedFeatures.length > 0 ? 
            '<button type="submit" class="btn btn-success">Add Selected Features</button>' : ''
          }
          <button type="button" class="btn" onclick="closeModal('addFeatureModal')">Cancel</button>
        </form>
      </div>
    </div>

    ${permissionModals}

    <script>
      function removeFeatureFromRole(roleId, featureId) {
        if (confirm('Remove this feature from the role?')) {
          fetch('/rbac-admin/roles/' + roleId + '/remove-features', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ featureIds: [featureId] })
          })
          .then(response => response.json())
          .then(data => {
            if (data.error) {
              alert('Error: ' + data.error);
            } else {
              window.location.reload();
            }
          })
          .catch(err => alert('Error: ' + err.message));
        }
      }
      
      function removePermissionFromFeature(roleId, featureId, permissionId) {
        if (confirm('Remove this permission?')) {
          fetch('/rbac-admin/roles/' + roleId + '/remove-permissions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ featureIds: [featureId], permissionIds: [permissionId] })
          })
          .then(response => response.json())
          .then(data => {
            if (data.error) {
              alert('Error: ' + data.error);
            } else {
              window.location.reload();
            }
          })
          .catch(err => alert('Error: ' + err.message));
        }
      }
    </script>
  `;
  
  return getBaseLayout('Role Details', content);
};