import { Pool } from 'pg';

export interface IPostgresUser {
  id?: string;
  user_id: string;
  name: string;
  email: string;
  role_id?: string;
  created_at?: Date;
  updated_at?: Date;
}

export interface IPostgresUserWithRole extends IPostgresUser {
  role?: {
    id: string;
    name: string;
    description: string;
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
  };
}

export class PostgresUser {
  constructor(private pool: Pool) {}

  async create(userData: IPostgresUser): Promise<IPostgresUser> {
    const query = `
      INSERT INTO rbac_users (user_id, name, email, role_id)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;
    const values = [userData.user_id, userData.name, userData.email, userData.role_id];
    const result = await this.pool.query(query, values);
    return result.rows[0];
  }

  async findByUserId(user_id: string): Promise<IPostgresUser | null> {
    const query = 'SELECT * FROM rbac_users WHERE user_id = $1';
    const result = await this.pool.query(query, [user_id]);
    return result.rows[0] || null;
  }

  async findByUserIdWithRole(user_id: string): Promise<IPostgresUserWithRole | null> {
    const query = `
      SELECT 
        u.*,
        r.id as role_id,
        r.name as role_name,
        r.description as role_description,
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
      FROM rbac_users u
      LEFT JOIN rbac_roles r ON u.role_id = r.id
      LEFT JOIN rbac_role_feature_permissions rfp ON r.id = rfp.role_id
      LEFT JOIN rbac_features f ON rfp.feature_id = f.id
      WHERE u.user_id = $1
      GROUP BY u.id, u.user_id, u.name, u.email, u.role_id, u.created_at, u.updated_at, 
               r.id, r.name, r.description
    `;
    
    const result = await this.pool.query(query, [user_id]);
    const row = result.rows[0];
    
    if (!row) return null;

    return {
      id: row.id,
      user_id: row.user_id,
      name: row.name,
      email: row.email,
      role_id: row.role_id,
      created_at: row.created_at,
      updated_at: row.updated_at,
      role: row.role_id ? {
        id: row.role_id,
        name: row.role_name,
        description: row.role_description,
        features: row.features || []
      } : undefined
    };
  }

  async update(user_id: string, updates: Partial<IPostgresUser>): Promise<void> {
    const setClause = [];
    const values = [];
    let paramCount = 1;

    if (updates.name !== undefined) {
      setClause.push(`name = $${paramCount++}`);
      values.push(updates.name);
    }
    if (updates.email !== undefined) {
      setClause.push(`email = $${paramCount++}`);
      values.push(updates.email);
    }
    if (updates.role_id !== undefined) {
      setClause.push(`role_id = $${paramCount++}`);
      values.push(updates.role_id);
    }

    if (setClause.length === 0) return;

    values.push(user_id);
    const query = `
      UPDATE rbac_users 
      SET ${setClause.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE user_id = $${paramCount}
    `;
    
    await this.pool.query(query, values);
  }

  async delete(user_id: string): Promise<void> {
    const query = 'DELETE FROM rbac_users WHERE user_id = $1';
    await this.pool.query(query, [user_id]);
  }

  async getAll(limit?: number, offset?: number, search?: string): Promise<{ users: IPostgresUser[], total: number }> {
    let whereClause = '';
    let params: any[] = [];
    let paramCount = 1;

    if (search) {
      whereClause = `WHERE (user_id ILIKE $${paramCount} OR name ILIKE $${paramCount} OR email ILIKE $${paramCount})`;
      params.push(`%${search}%`);
      paramCount++;
    }

    // Get total count
    const countQuery = `SELECT COUNT(*) FROM rbac_users ${whereClause}`;
    const countResult = await this.pool.query(countQuery, params);
    const total = parseInt(countResult.rows[0].count);

    // Get users with pagination
    let query = `
      SELECT u.*, r.name as role_name 
      FROM rbac_users u
      LEFT JOIN rbac_roles r ON u.role_id = r.id
      ${whereClause}
      ORDER BY u.created_at DESC
    `;

    if (limit) {
      query += ` LIMIT $${paramCount++}`;
      params.push(limit);
    }
    if (offset) {
      query += ` OFFSET $${paramCount}`;
      params.push(offset);
    }

    const result = await this.pool.query(query, params);
    return { users: result.rows, total };
  }
}