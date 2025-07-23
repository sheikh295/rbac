import { Pool } from 'pg';

export interface IPostgresUserRole {
  id?: string;
  name: string;
  description: string;
  created_at?: Date;
  updated_at?: Date;
}

export interface IPostgresFeaturePermission {
  feature_id: string;
  permission_ids: string[];
}

export interface IPostgresUserRoleWithFeatures extends IPostgresUserRole {
  features?: {
    feature: {
      id: string;
      name: string;
      description: string;
    };
    permissions: {
      id: string;
      name: string;
      description: string;
    }[];
  }[];
}

export class PostgresUserRole {
  constructor(private pool: Pool) {}

  async create(roleData: IPostgresUserRole): Promise<IPostgresUserRole> {
    const query = `
      INSERT INTO rbac_roles (name, description)
      VALUES ($1, $2)
      RETURNING *
    `;
    const values = [roleData.name, roleData.description];
    const result = await this.pool.query(query, values);
    return result.rows[0];
  }

  async findByName(name: string): Promise<IPostgresUserRole | null> {
    const query = 'SELECT * FROM rbac_roles WHERE name = $1';
    const result = await this.pool.query(query, [name]);
    return result.rows[0] || null;
  }

  async findById(id: string): Promise<IPostgresUserRole | null> {
    const query = 'SELECT * FROM rbac_roles WHERE id = $1';
    const result = await this.pool.query(query, [id]);
    return result.rows[0] || null;
  }

  async findByIdWithFeatures(id: string): Promise<IPostgresUserRoleWithFeatures | null> {
    const query = `
      SELECT 
        r.*,
        json_agg(
          CASE 
            WHEN f.id IS NOT NULL THEN
              json_build_object(
                'feature', json_build_object(
                  'id', f.id,
                  'name', f.name,
                  'description', f.description
                ),
                'permissions', COALESCE(
                  (
                    SELECT json_agg(
                      json_build_object(
                        'id', p.id,
                        'name', p.name,
                        'description', p.description
                      )
                    )
                    FROM rbac_role_feature_permissions rfp2
                    JOIN rbac_permissions p ON p.id = rfp2.permission_id
                    WHERE rfp2.role_id = r.id AND rfp2.feature_id = f.id
                  ), 
                  '[]'::json
                )
              )
            ELSE NULL
          END
        ) FILTER (WHERE f.id IS NOT NULL) as features
      FROM rbac_roles r
      LEFT JOIN rbac_role_feature_permissions rfp ON r.id = rfp.role_id
      LEFT JOIN rbac_features f ON rfp.feature_id = f.id
      WHERE r.id = $1
      GROUP BY r.id, r.name, r.description, r.created_at, r.updated_at
    `;
    
    const result = await this.pool.query(query, [id]);
    const row = result.rows[0];
    
    if (!row) return null;

    return {
      id: row.id,
      name: row.name,
      description: row.description,
      created_at: row.created_at,
      updated_at: row.updated_at,
      features: row.features || []
    };
  }

  async update(id: string, updates: Partial<IPostgresUserRole>): Promise<void> {
    const setClause = [];
    const values = [];
    let paramCount = 1;

    if (updates.name !== undefined) {
      setClause.push(`name = $${paramCount++}`);
      values.push(updates.name);
    }
    if (updates.description !== undefined) {
      setClause.push(`description = $${paramCount++}`);
      values.push(updates.description);
    }

    if (setClause.length === 0) return;

    values.push(id);
    const query = `
      UPDATE rbac_roles 
      SET ${setClause.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${paramCount}
    `;
    
    await this.pool.query(query, values);
  }

  async delete(id: string): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      
      // Delete role-feature-permission relationships
      await client.query('DELETE FROM rbac_role_feature_permissions WHERE role_id = $1', [id]);
      
      // Update users to remove this role
      await client.query('UPDATE rbac_users SET role_id = NULL WHERE role_id = $1', [id]);
      
      // Delete the role
      await client.query('DELETE FROM rbac_roles WHERE id = $1', [id]);
      
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async assignFeaturePermissions(roleId: string, featurePermissions: IPostgresFeaturePermission[]): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      
      // Remove existing feature permissions for this role
      await client.query('DELETE FROM rbac_role_feature_permissions WHERE role_id = $1', [roleId]);
      
      // Add new feature permissions
      for (const fp of featurePermissions) {
        for (const permissionId of fp.permission_ids) {
          await client.query(
            'INSERT INTO rbac_role_feature_permissions (role_id, feature_id, permission_id) VALUES ($1, $2, $3)',
            [roleId, fp.feature_id, permissionId]
          );
        }
      }
      
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async getAll(limit?: number, offset?: number): Promise<{ roles: IPostgresUserRole[], total: number }> {
    // Get total count
    const countQuery = 'SELECT COUNT(*) FROM rbac_roles';
    const countResult = await this.pool.query(countQuery);
    const total = parseInt(countResult.rows[0].count);

    // Get roles with pagination
    let query = `
      SELECT r.*, 
             COUNT(DISTINCT u.id) as user_count,
             COUNT(DISTINCT rfp.feature_id) as feature_count
      FROM rbac_roles r
      LEFT JOIN rbac_users u ON r.id = u.role_id
      LEFT JOIN rbac_role_feature_permissions rfp ON r.id = rfp.role_id
      GROUP BY r.id, r.name, r.description, r.created_at, r.updated_at
      ORDER BY r.created_at DESC
    `;

    const params: any[] = [];
    let paramCount = 1;

    if (limit) {
      query += ` LIMIT $${paramCount++}`;
      params.push(limit);
    }
    if (offset) {
      query += ` OFFSET $${paramCount}`;
      params.push(offset);
    }

    const result = await this.pool.query(query, params);
    return { roles: result.rows, total };
  }
}