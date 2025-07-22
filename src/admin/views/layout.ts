export const getBaseLayout = (title: string, content: string): string => {
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
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
            background: #f5f5f5; 
            color: #333;
        }
        .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
        .header { 
            background: #2c3e50; 
            color: white; 
            padding: 1rem 0; 
            margin-bottom: 2rem;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .header h1 { text-align: center; font-weight: 300; }
        .nav { 
            background: white; 
            padding: 1rem; 
            border-radius: 8px; 
            margin-bottom: 2rem;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .nav a { 
            display: inline-block; 
            padding: 8px 16px; 
            margin: 0 8px; 
            text-decoration: none; 
            color: #2c3e50; 
            border-radius: 4px;
            transition: background-color 0.2s;
        }
        .nav a:hover { background: #ecf0f1; }
        .nav a.active { background: #3498db; color: white; }
        .content { 
            background: white; 
            padding: 2rem; 
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .btn { 
            background: #3498db; 
            color: white; 
            padding: 10px 20px; 
            border: none; 
            border-radius: 4px; 
            cursor: pointer;
            text-decoration: none;
            display: inline-block;
            transition: background-color 0.2s;
        }
        .btn:hover { background: #2980b9; }
        .btn-danger { background: #e74c3c; }
        .btn-danger:hover { background: #c0392b; }
        .btn-success { background: #27ae60; }
        .btn-success:hover { background: #229954; }
        .table { 
            width: 100%; 
            border-collapse: collapse; 
            margin-top: 1rem; 
        }
        .table th, .table td { 
            padding: 12px; 
            text-align: left; 
            border-bottom: 1px solid #ddd; 
        }
        .table th { 
            background: #f8f9fa; 
            font-weight: 600;
        }
        .table tr:hover { background: #f8f9fa; }
        .form-group { margin-bottom: 1rem; }
        .form-group label { 
            display: block; 
            margin-bottom: 5px; 
            font-weight: 500; 
        }
        .form-control { 
            width: 100%; 
            padding: 10px; 
            border: 1px solid #ddd; 
            border-radius: 4px; 
            font-size: 14px;
        }
        .form-control:focus { 
            outline: none; 
            border-color: #3498db; 
            box-shadow: 0 0 5px rgba(52, 152, 219, 0.3); 
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
            border-radius: 8px; 
            box-shadow: 0 2px 4px rgba(0,0,0,0.1); 
            margin-bottom: 1rem; 
            overflow: hidden;
        }
        .card-header { 
            background: #f8f9fa; 
            padding: 1rem; 
            border-bottom: 1px solid #ddd; 
            font-weight: 600;
        }
        .card-body { padding: 1rem; }
        .badge { 
            display: inline-block; 
            padding: 4px 8px; 
            font-size: 12px; 
            border-radius: 12px; 
            background: #6c757d; 
            color: white; 
            margin: 2px;
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
    </style>
</head>
<body>
    <div class="header">
        <div class="container">
            <h1>RBAC Admin Dashboard</h1>
        </div>
    </div>
    
    <div class="container">
        <nav class="nav">
            <a href="/rbac-admin">Dashboard</a>
            <a href="/rbac-admin/users">Users</a>
            <a href="/rbac-admin/roles">Roles</a>
            <a href="/rbac-admin/features">Features</a>
            <a href="/rbac-admin/permissions">Permissions</a>
        </nav>
        
        <div class="content">
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
    </script>
</body>
</html>
  `;
};