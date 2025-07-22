import { getBaseLayout } from './layout';

export const getFeaturesListView = (features: any[]): string => {
  const featuresRows = features.map(feature => `
    <tr>
      <td>
        <strong>${feature.name}</strong><br>
        <small style="color: #666;">${feature.description}</small>
      </td>
      <td>${feature.createdAt ? new Date(feature.createdAt).toLocaleDateString() : 'N/A'}</td>
      <td>
        <button class="btn" onclick="editFeature('${feature._id}', '${feature.name}', '${feature.description}')">Edit</button>
        <button class="btn btn-danger" onclick="confirmDeleteFeature('${feature._id}', '${feature.name}')">Delete</button>
      </td>
    </tr>
  `).join('');

  const content = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
      <h2>Feature Management</h2>
      <button class="btn btn-success" onclick="openModal('createFeatureModal')">Create New Feature</button>
    </div>
    
    <div class="card">
      <div class="card-header">
        <h4>All Features (${features.length})</h4>
      </div>
      <div class="card-body">
        <p style="margin-bottom: 1rem; color: #666;">
          Features represent different parts or modules of your application that can have permissions assigned to them.
        </p>
        
        <table class="table">
          <thead>
            <tr>
              <th>Feature</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${featuresRows}
          </tbody>
        </table>
        
        ${features.length === 0 ? '<p style="text-align: center; color: #666;">No features created yet.</p>' : ''}
      </div>
    </div>

    <!-- Create Feature Modal -->
    <div id="createFeatureModal" class="modal">
      <div class="modal-content">
        <span class="close" onclick="closeModal('createFeatureModal')">&times;</span>
        <h3>Create New Feature</h3>
        <form method="POST" action="/rbac-admin/features/create">
          <div class="form-group">
            <label>Feature Name:</label>
            <input type="text" name="name" class="form-control" required placeholder="e.g., billing, users, reports">
            <small style="color: #666;">Use lowercase names that match your route segments (e.g., /billing/invoices)</small>
          </div>
          <div class="form-group">
            <label>Description:</label>
            <textarea name="description" class="form-control" rows="3" required placeholder="Describe what this feature controls..."></textarea>
          </div>
          <button type="submit" class="btn btn-success">Create Feature</button>
          <button type="button" class="btn" onclick="closeModal('createFeatureModal')">Cancel</button>
        </form>
      </div>
    </div>

    <!-- Edit Feature Modal -->
    <div id="editFeatureModal" class="modal">
      <div class="modal-content">
        <span class="close" onclick="closeModal('editFeatureModal')">&times;</span>
        <h3>Edit Feature</h3>
        <form id="editFeatureForm" method="POST">
          <div class="form-group">
            <label>Feature Name:</label>
            <input type="text" name="name" id="editFeatureName" class="form-control" required>
          </div>
          <div class="form-group">
            <label>Description:</label>
            <textarea name="description" id="editFeatureDescription" class="form-control" rows="3" required></textarea>
          </div>
          <button type="submit" class="btn btn-success">Update Feature</button>
          <button type="button" class="btn" onclick="closeModal('editFeatureModal')">Cancel</button>
        </form>
      </div>
    </div>

    <script>
      function editFeature(featureId, name, description) {
        document.getElementById('editFeatureName').value = name;
        document.getElementById('editFeatureDescription').value = description;
        document.getElementById('editFeatureForm').action = '/rbac-admin/features/' + featureId + '/update';
        openModal('editFeatureModal');
      }
      
      function confirmDeleteFeature(featureId, featureName) {
        if (confirm('Are you sure you want to delete feature: ' + featureName + '?\\n\\nThis will remove the feature from all roles that use it.')) {
          fetch('/rbac-admin/features/' + featureId + '/delete', { 
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
          .catch(err => alert('Error deleting feature: ' + err.message));
        }
      }
    </script>
  `;
  
  return getBaseLayout('Features', content);
};

export const getFeatureDetailsView = (feature: any, relatedRoles: any[]): string => {
  const rolesUsingFeature = relatedRoles.filter(role => 
    role.features && role.features.some((f: any) => f.feature._id.toString() === feature._id.toString())
  );

  const rolesHtml = rolesUsingFeature.map(role => {
    const roleFeature = role.features.find((f: any) => f.feature._id.toString() === feature._id.toString());
    return `
      <div class="card" style="margin-bottom: 1rem;">
        <div class="card-header">
          <h5>${role.name}</h5>
        </div>
        <div class="card-body">
          <p>${role.description}</p>
          <strong>Permissions for this feature:</strong>
          ${roleFeature.permissions.map((p: any) => `<span class="badge">${p.name}</span>`).join(' ')}
          <div style="margin-top: 10px;">
            <a href="/rbac-admin/roles/${role._id}" class="btn">View Role Details</a>
          </div>
        </div>
      </div>
    `;
  }).join('');

  const content = `
    <div style="margin-bottom: 1rem;">
      <a href="/rbac-admin/features" class="btn">← Back to Features</a>
    </div>
    
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
      <div>
        <h2>${feature.name}</h2>
        <p style="color: #666;">${feature.description}</p>
      </div>
      <button class="btn" onclick="editFeature('${feature._id}', '${feature.name}', '${feature.description}')">Edit Feature</button>
    </div>
    
    <div class="card">
      <div class="card-header">
        <h4>Roles Using This Feature (${rolesUsingFeature.length})</h4>
      </div>
      <div class="card-body">
        ${rolesUsingFeature.length > 0 ? rolesHtml : '<p>This feature is not currently assigned to any roles.</p>'}
      </div>
    </div>
    
    <div class="card" style="margin-top: 2rem;">
      <div class="card-header">
        <h4>Feature Statistics</h4>
      </div>
      <div class="card-body">
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
          <div style="text-align: center; padding: 1rem; background: #f8f9fa; border-radius: 4px;">
            <h3 style="color: #3498db; margin-bottom: 5px;">${rolesUsingFeature.length}</h3>
            <p style="margin: 0; color: #666;">Roles Using</p>
          </div>
          <div style="text-align: center; padding: 1rem; background: #f8f9fa; border-radius: 4px;">
            <h3 style="color: #27ae60; margin-bottom: 5px;">${feature.createdAt ? new Date(feature.createdAt).toLocaleDateString() : 'N/A'}</h3>
            <p style="margin: 0; color: #666;">Created On</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Edit Feature Modal -->
    <div id="editFeatureModal" class="modal">
      <div class="modal-content">
        <span class="close" onclick="closeModal('editFeatureModal')">&times;</span>
        <h3>Edit Feature</h3>
        <form id="editFeatureForm" method="POST">
          <div class="form-group">
            <label>Feature Name:</label>
            <input type="text" name="name" id="editFeatureName" class="form-control" required>
          </div>
          <div class="form-group">
            <label>Description:</label>
            <textarea name="description" id="editFeatureDescription" class="form-control" rows="3" required></textarea>
          </div>
          <button type="submit" class="btn btn-success">Update Feature</button>
          <button type="button" class="btn" onclick="closeModal('editFeatureModal')">Cancel</button>
        </form>
      </div>
    </div>

    <script>
      function editFeature(featureId, name, description) {
        document.getElementById('editFeatureName').value = name;
        document.getElementById('editFeatureDescription').value = description;
        document.getElementById('editFeatureForm').action = '/rbac-admin/features/' + featureId + '/update';
        openModal('editFeatureModal');
      }
    </script>
  `;
  
  return getBaseLayout('Feature Details', content);
};