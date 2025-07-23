# PostgreSQL Troubleshooting Guide

This guide helps resolve common issues when using the RBAC package with PostgreSQL.

## Common Errors and Solutions

### 1. "there is no unique or exclusion constraint matching the ON CONFLICT specification"

**Error Message:**
```
ERROR: there is no unique or exclusion constraint matching the ON CONFLICT specification
```

**Cause:** This error occurs when the schema tries to use `ON CONFLICT (name) DO NOTHING` but the table doesn't have a unique constraint on the `name` column.

**Solution:** This has been fixed in the latest version. The schema now includes `UNIQUE` constraints on all necessary columns:

```sql
-- Fixed schema includes UNIQUE constraints
CREATE TABLE rbac_permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,  -- ✅ UNIQUE constraint added
    description TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

**If you're still getting this error:**
1. Update to the latest version of the package
2. Drop existing tables and let RBAC recreate them:
   ```sql
   DROP TABLE IF EXISTS rbac_role_feature_permissions;
   DROP TABLE IF EXISTS rbac_users;
   DROP TABLE IF EXISTS rbac_roles;
   DROP TABLE IF EXISTS rbac_features; 
   DROP TABLE IF EXISTS rbac_permissions;
   ```
3. Restart your application to trigger schema recreation

### 2. "permission denied for schema public"

**Error Message:**
```
ERROR: permission denied for schema public
```

**Cause:** The PostgreSQL user doesn't have sufficient permissions to create tables.

**Solution:** Grant necessary permissions to your PostgreSQL user:

```sql
-- Connect as superuser (postgres) and run:
GRANT CREATE, USAGE ON SCHEMA public TO your_username;
GRANT CREATE ON DATABASE your_database TO your_username;

-- Or create a dedicated schema for RBAC:
CREATE SCHEMA rbac_schema;
GRANT ALL ON SCHEMA rbac_schema TO your_username;
```

### 3. "database does not exist"

**Error Message:**
```
FATAL: database "your_database" does not exist
```

**Solution:** Create the database first:

```sql
-- Connect to PostgreSQL as superuser and run:
CREATE DATABASE your_database;
GRANT ALL PRIVILEGES ON DATABASE your_database TO your_username;
```

### 4. "relation already exists" errors

**Error Message:**
```
ERROR: relation "rbac_permissions" already exists
```

**Cause:** Tables exist but with incorrect schema (missing UNIQUE constraints).

**Solution:** The schema uses `CREATE TABLE IF NOT EXISTS`, so this shouldn't normally happen. If it does:

1. **Option A - Clean recreation (recommended):**
   ```sql
   DROP TABLE IF EXISTS rbac_role_feature_permissions;
   DROP TABLE IF EXISTS rbac_users;
   DROP TABLE IF EXISTS rbac_roles;
   DROP TABLE IF EXISTS rbac_features;
   DROP TABLE IF EXISTS rbac_permissions;
   ```

2. **Option B - Add missing constraints manually:**
   ```sql
   ALTER TABLE rbac_permissions ADD CONSTRAINT rbac_permissions_name_unique UNIQUE (name);
   ALTER TABLE rbac_features ADD CONSTRAINT rbac_features_name_unique UNIQUE (name);
   ALTER TABLE rbac_roles ADD CONSTRAINT rbac_roles_name_unique UNIQUE (name);
   ```

### 5. Connection issues

**Error Message:**
```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

**Solution:** Verify PostgreSQL is running and connection settings:

```javascript
const pgPool = new Pool({
  user: 'your_username',
  host: 'localhost',        // Verify host
  database: 'your_database', // Verify database exists
  password: 'your_password', // Verify password
  port: 5432,               // Verify port (default 5432)
});

// Test connection before initializing RBAC
pgPool.connect()
  .then(client => {
    console.log('PostgreSQL connected successfully');
    client.release();
  })
  .catch(err => {
    console.error('PostgreSQL connection failed:', err.message);
  });
```

## Validation Steps

### 1. Test PostgreSQL Connection

```javascript
const { Pool } = require('pg');

const pool = new Pool({
  user: 'your_username',
  host: 'localhost',
  database: 'your_database', 
  password: 'your_password',
  port: 5432,
});

// Test basic connection
pool.query('SELECT NOW()', (err, result) => {
  if (err) {
    console.error('Connection failed:', err.message);
  } else {
    console.log('Connection successful:', result.rows[0]);
  }
  pool.end();
});
```

### 2. Validate Schema Creation

```javascript
const { RBAC } = require('@mamoorali295/rbac');

async function testRBACInit() {
  try {
    await RBAC.init({
      database: {
        type: 'postgresql',
        connection: pool
      },
      authAdapter: async (req) => ({
        user_id: 'test-user-123'
      })
    });
    
    console.log('✅ RBAC initialization successful');
    
    // Test creating a user
    await RBAC.registerUserManual('test-user-123', {
      name: 'Test User',
      email: 'test@example.com'
    });
    
    console.log('✅ User registration successful');
    
  } catch (error) {
    console.error('❌ RBAC initialization failed:', error.message);
  }
}

testRBACInit();
```

### 3. Verify Table Structure

Connect to your PostgreSQL database and run:

```sql
-- Check if tables exist with correct structure
\dt rbac_*

-- Check table structure
\d rbac_permissions
\d rbac_features  
\d rbac_roles
\d rbac_users
\d rbac_role_feature_permissions

-- Verify standard permissions were created
SELECT * FROM rbac_permissions ORDER BY name;
```

## Best Practices

### 1. Environment Configuration

Create a `.env` file for database settings:

```env
POSTGRES_USER=your_username
POSTGRES_HOST=localhost
POSTGRES_DATABASE=your_database
POSTGRES_PASSWORD=your_password
POSTGRES_PORT=5432
```

Use in your application:
```javascript
require('dotenv').config();

const pgPool = new Pool({
  user: process.env.POSTGRES_USER,
  host: process.env.POSTGRES_HOST,
  database: process.env.POSTGRES_DATABASE,
  password: process.env.POSTGRES_PASSWORD,
  port: process.env.POSTGRES_PORT,
});
```

### 2. Connection Pooling

Use proper connection pool settings for production:

```javascript
const pgPool = new Pool({
  // ... connection settings
  max: 20,                // Maximum number of connections
  idleTimeoutMillis: 30000, // Close idle connections after 30s
  connectionTimeoutMillis: 2000, // Return error after 2s if can't connect
});
```

### 3. Error Handling

Always handle database errors gracefully:

```javascript
try {
  await RBAC.init({ /* config */ });
} catch (error) {
  if (error.message.includes('permission denied')) {
    console.error('Database permissions issue. Check user privileges.');
  } else if (error.message.includes('does not exist')) {
    console.error('Database or table does not exist. Check configuration.');
  } else {
    console.error('RBAC initialization failed:', error.message);
  }
  process.exit(1);
}
```

## Getting Help

If you're still experiencing issues:

1. Check the main [DATABASE_COMPARISON.md](./DATABASE_COMPARISON.md) guide
2. Review the [PostgreSQL example](../examples/postgresql-example.js)
3. Run the schema test: `psql -f test/postgres-schema-test.sql your_database`
4. Open an issue with:
   - Your PostgreSQL version (`SELECT version();`)
   - Your Node.js version (`node --version`)
   - Complete error message and stack trace
   - Your database configuration (without passwords)