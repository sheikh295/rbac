-- RBAC PostgreSQL Schema
-- This schema mirrors the MongoDB collections with proper relational constraints

-- Enable UUID extension for primary keys
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- RbacPermissions table (equivalent to RbacPermissions collection)
CREATE TABLE IF NOT EXISTS rbac_permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- RbacFeatures table (equivalent to RbacFeatures collection)
CREATE TABLE IF NOT EXISTS rbac_features (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- RbacRoles table (equivalent to RbacRoles collection)
CREATE TABLE IF NOT EXISTS rbac_roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- RbacUsers table (equivalent to RbacUsers collection)
CREATE TABLE IF NOT EXISTS rbac_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    role_id UUID REFERENCES rbac_roles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Junction table for role-feature-permissions (replaces nested features array in MongoDB)
CREATE TABLE IF NOT EXISTS rbac_role_feature_permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    role_id UUID NOT NULL REFERENCES rbac_roles(id) ON DELETE CASCADE,
    feature_id UUID NOT NULL REFERENCES rbac_features(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES rbac_permissions(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(role_id, feature_id, permission_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_rbac_users_user_id ON rbac_users(user_id);
CREATE INDEX IF NOT EXISTS idx_rbac_users_email ON rbac_users(email);
CREATE INDEX IF NOT EXISTS idx_rbac_users_role_id ON rbac_users(role_id);
CREATE INDEX IF NOT EXISTS idx_rbac_role_feature_permissions_role_id ON rbac_role_feature_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_rbac_role_feature_permissions_feature_id ON rbac_role_feature_permissions(feature_id);
CREATE INDEX IF NOT EXISTS idx_rbac_permissions_name ON rbac_permissions(name);
CREATE INDEX IF NOT EXISTS idx_rbac_features_name ON rbac_features(name);
CREATE INDEX IF NOT EXISTS idx_rbac_roles_name ON rbac_roles(name);

-- Update trigger for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply update triggers to all tables
CREATE TRIGGER update_rbac_permissions_updated_at BEFORE UPDATE ON rbac_permissions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_rbac_features_updated_at BEFORE UPDATE ON rbac_features FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_rbac_roles_updated_at BEFORE UPDATE ON rbac_roles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_rbac_users_updated_at BEFORE UPDATE ON rbac_users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_rbac_role_feature_permissions_updated_at BEFORE UPDATE ON rbac_role_feature_permissions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert standard permissions
INSERT INTO rbac_permissions (name, description) VALUES
    ('read', 'View and access resources'),
    ('create', 'Add new resources'),
    ('update', 'Modify existing resources'),
    ('delete', 'Remove resources'),
    ('sudo', 'Full administrative access')
ON CONFLICT (name) DO NOTHING;