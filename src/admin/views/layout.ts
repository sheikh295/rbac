export const getBaseLayout = (title: string, content: string, currentPath: string = ""): string => {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title} - RBAC Admin</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
            min-height: 100vh;
            color: #2d3748;
        }
        
        .sidebar {
            position: fixed;
            top: 0;
            left: 0;
            width: 250px;
            height: 100vh;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            box-shadow: 2px 0 10px rgba(0,0,0,0.1);
            z-index: 1000;
            overflow-y: auto;
        }
        
        .sidebar-header {
            padding: 24px 20px;
            border-bottom: 1px solid rgba(255,255,255,0.1);
        }
        
        .sidebar-title {
            color: white;
            font-size: 20px;
            font-weight: 700;
            margin-bottom: 4px;
        }
        
        .sidebar-subtitle {
            color: rgba(255,255,255,0.8);
            font-size: 14px;
        }
        
        .sidebar-nav {
            padding: 20px 0;
        }
        
        .nav-item {
            display: block;
            padding: 12px 24px;
            color: rgba(255,255,255,0.9);
            text-decoration: none;
            transition: all 0.2s ease;
            border-left: 3px solid transparent;
        }
        
        .nav-item:hover {
            background: rgba(255,255,255,0.1);
            color: white;
            border-left-color: rgba(255,255,255,0.3);
        }
        
        .nav-item.active {
            background: rgba(255,255,255,0.15);
            color: white;
            border-left-color: #fff;
        }
        
        .sidebar-footer {
            position: absolute;
            bottom: 20px;
            left: 0;
            right: 0;
            padding: 0 20px;
        }
        
        .logout-btn {
            display: block;
            width: 100%;
            padding: 12px;
            background: rgba(255,255,255,0.1);
            color: white;
            border: 1px solid rgba(255,255,255,0.2);
            border-radius: 6px;
            text-decoration: none;
            text-align: center;
            font-weight: 500;
            transition: all 0.2s ease;
        }
        
        .logout-btn:hover {
            background: rgba(255,255,255,0.2);
            transform: translateY(-1px);
        }
        
        .main-content {
            margin-left: 250px;
            min-height: 100vh;
        }
        
        .top-bar {
            background: white;
            padding: 16px 32px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.05);
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .page-title {
            font-size: 24px;
            font-weight: 600;
            color: #2d3748;
        }
        
        .user-info {
            display: flex;
            align-items: center;
            color: #718096;
            font-size: 14px;
        }
        
        .content-area {
            padding: 32px;
        }
        .content-card { 
            background: white; 
            border-radius: 12px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
            overflow: hidden;
        }
        
        .content-card-header {
            padding: 24px 32px;
            border-bottom: 1px solid #e2e8f0;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .content-card-title {
            font-size: 18px;
            font-weight: 600;
            color: #2d3748;
        }
        
        .content-card-body {
            padding: 32px;
        }
        .btn { 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white; 
            padding: 12px 24px; 
            border: none; 
            border-radius: 8px; 
            cursor: pointer;
            text-decoration: none;
            display: inline-flex;
            align-items: center;
            font-weight: 500;
            font-size: 14px;
            transition: all 0.2s ease;
            box-shadow: 0 2px 4px rgba(102, 126, 234, 0.2);
        }
        .btn:hover { 
            transform: translateY(-1px);
            box-shadow: 0 4px 8px rgba(102, 126, 234, 0.3);
        }
        .btn-sm {
            padding: 8px 16px;
            font-size: 12px;
        }
        .btn-danger { 
            background: linear-gradient(135deg, #f56565 0%, #e53e3e 100%);
            box-shadow: 0 2px 4px rgba(229, 62, 62, 0.2);
        }
        .btn-danger:hover { 
            box-shadow: 0 4px 8px rgba(229, 62, 62, 0.3);
        }
        .btn-success { 
            background: linear-gradient(135deg, #48bb78 0%, #38a169 100%);
            box-shadow: 0 2px 4px rgba(56, 161, 105, 0.2);
        }
        .btn-success:hover { 
            box-shadow: 0 4px 8px rgba(56, 161, 105, 0.3);
        }
        .btn-secondary {
            background: linear-gradient(135deg, #718096 0%, #4a5568 100%);
            box-shadow: 0 2px 4px rgba(113, 128, 150, 0.2);
        }
        .btn-secondary:hover {
            box-shadow: 0 4px 8px rgba(113, 128, 150, 0.3);
        }
        .table { 
            width: 100%; 
            border-collapse: collapse; 
        }
        .table th, .table td { 
            padding: 16px; 
            text-align: left; 
            border-bottom: 1px solid #e2e8f0; 
        }
        .table th { 
            background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%); 
            font-weight: 600;
            color: #4a5568;
            font-size: 14px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .table tr:hover { 
            background: #f7fafc; 
            transform: scale(1.001);
            transition: all 0.2s ease;
        }
        .table td {
            color: #2d3748;
        }
        .form-group { margin-bottom: 1rem; }
        .form-group label { 
            display: block; 
            margin-bottom: 5px; 
            font-weight: 500; 
        }
        .form-control { 
            width: 100%; 
            padding: 12px 16px; 
            border: 2px solid #e2e8f0; 
            border-radius: 8px; 
            font-size: 14px;
            background: #f8fafc;
            transition: all 0.2s ease;
        }
        .form-control:focus { 
            outline: none; 
            border-color: #667eea; 
            background: white;
            box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1); 
        }
        .alert { 
            padding: 12px; 
            border-radius: 4px; 
            margin-bottom: 1rem; 
        }
        .alert-success { 
            background: #d4edda; 
            color: #155724; 
            border: 1px solid #c3e6cb; 
        }
        .alert-error { 
            background: #f8d7da; 
            color: #721c24; 
            border: 1px solid #f5c6cb; 
        }
        .card { 
            background: white; 
            border-radius: 12px; 
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05); 
            margin-bottom: 24px; 
            overflow: hidden;
            border: 1px solid #e2e8f0;
        }
        .card-header { 
            background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%); 
            padding: 20px 24px; 
            border-bottom: 1px solid #e2e8f0; 
            font-weight: 600;
            color: #2d3748;
        }
        .card-body { padding: 24px; }
        .badge { 
            display: inline-block; 
            padding: 4px 12px; 
            font-size: 11px; 
            font-weight: 500;
            border-radius: 16px; 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
            color: white; 
            margin: 2px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .badge-success {
            background: linear-gradient(135deg, #48bb78 0%, #38a169 100%);
        }
        .badge-danger {
            background: linear-gradient(135deg, #f56565 0%, #e53e3e 100%);
        }
        .badge-warning {
            background: linear-gradient(135deg, #ed8936 0%, #dd6b20 100%);
        }
        .badge-secondary {
            background: linear-gradient(135deg, #718096 0%, #4a5568 100%);
        }
        .modal { 
            display: none; 
            position: fixed; 
            top: 0; 
            left: 0; 
            width: 100%; 
            height: 100%; 
            background: rgba(0,0,0,0.5); 
            z-index: 1000;
        }
        .modal-content { 
            background: white; 
            margin: 10% auto; 
            padding: 20px; 
            width: 80%; 
            max-width: 500px; 
            border-radius: 8px;
        }
        .close { 
            float: right; 
            font-size: 28px; 
            font-weight: bold; 
            cursor: pointer;
        }
        .close:hover { color: #e74c3c; }
        
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 24px;
            margin-bottom: 32px;
        }
        
        .stat-card {
            background: white;
            padding: 24px;
            border-radius: 12px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
            border-left: 4px solid #667eea;
        }
        
        .stat-value {
            font-size: 32px;
            font-weight: 700;
            color: #2d3748;
            margin-bottom: 4px;
        }
        
        .stat-label {
            color: #718096;
            font-size: 14px;
            font-weight: 500;
        }
        
        .pagination {
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 8px;
            margin: 24px 0;
        }
        
        .pagination-btn {
            padding: 8px 12px;
            border: 1px solid #e2e8f0;
            background: white;
            color: #4a5568;
            border-radius: 6px;
            text-decoration: none;
            transition: all 0.2s ease;
        }
        
        .pagination-btn:hover {
            background: #f7fafc;
            border-color: #cbd5e0;
        }
        
        .pagination-btn.active {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border-color: #667eea;
        }
        
        @media (max-width: 768px) {
            .sidebar {
                transform: translateX(-100%);
                transition: transform 0.3s ease;
            }
            
            .sidebar.open {
                transform: translateX(0);
            }
            
            .main-content {
                margin-left: 0;
            }
            
            .content-area {
                padding: 16px;
            }
            
            .stats-grid {
                grid-template-columns: 1fr;
            }
        }
    </style>
</head>
<body>
    <div class="sidebar">
        <div class="sidebar-header">
            <div class="sidebar-title">RBAC Admin</div>
            <div class="sidebar-subtitle">Management Panel</div>
        </div>
        
        <nav class="sidebar-nav">
            <a href="/rbac-admin" class="nav-item ${currentPath === "/" ? "active" : ""}">
                📊 Dashboard
            </a>
            <a href="/rbac-admin/users" class="nav-item ${currentPath.includes("/users") ? "active" : ""}">
                👥 Users
            </a>
            <a href="/rbac-admin/roles" class="nav-item ${currentPath.includes("/roles") ? "active" : ""}">
                🎭 Roles
            </a>
            <a href="/rbac-admin/features" class="nav-item ${currentPath.includes("/features") ? "active" : ""}">
                ⚙️ Features
            </a>
            <a href="/rbac-admin/permissions" class="nav-item ${currentPath.includes("/permissions") ? "active" : ""}">
                🔐 Permissions
            </a>
        </nav>
        
        <div class="sidebar-footer">
            <button onclick="handleLogout()" class="logout-btn" style="border: none; cursor: pointer;">
                🚪 Logout
            </button>
        </div>
    </div>
    
    <div class="main-content">
        <div class="top-bar">
            <h1 class="page-title">${title}</h1>
            <div class="user-info">
                👤 Admin User
            </div>
        </div>
        
        <div class="content-area">
            ${content}
        </div>
    </div>

    <script>
        // Simple modal functionality
        function openModal(id) {
            document.getElementById(id).style.display = 'block';
        }
        
        function closeModal(id) {
            document.getElementById(id).style.display = 'none';
        }
        
        // Close modal when clicking outside
        window.onclick = function(event) {
            const modals = document.querySelectorAll('.modal');
            modals.forEach(modal => {
                if (event.target === modal) {
                    modal.style.display = 'none';
                }
            });
        }
        
        // Handle logout
        function handleLogout() {
            if (confirm('Are you sure you want to logout?')) {
                const form = document.createElement('form');
                form.method = 'POST';
                form.action = '/rbac-admin/logout';
                document.body.appendChild(form);
                form.submit();
            }
        }
    </script>
</body>
</html>
  `;
};
