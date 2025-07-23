import { Pool } from 'pg';

export interface IPostgresPermission {
  id?: string;
  name: string;
  description: string;
  created_at?: Date;
  updated_at?: Date;
}

export class PostgresPermission {
  constructor(private pool: Pool) {}

  async create(permissionData: IPostgresPermission): Promise<IPostgresPermission> {
    const query = `
      INSERT INTO rbac_permissions (name, description)
      VALUES ($1, $2)
      RETURNING *
    `;
    const values = [permissionData.name, permissionData.description];
    const result = await this.pool.query(query, values);
    return result.rows[0];
  }

  async findByName(name: string): Promise<IPostgresPermission | null> {
    const query = 'SELECT * FROM rbac_permissions WHERE name = $1';
    const result = await this.pool.query(query, [name]);
    return result.rows[0] || null;
  }

  async findById(id: string): Promise<IPostgresPermission | null> {
    const query = 'SELECT * FROM rbac_permissions WHERE id = $1';
    const result = await this.pool.query(query, [id]);
    return result.rows[0] || null;
  }

  async update(id: string, updates: Partial<IPostgresPermission>): Promise<void> {
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
      UPDATE rbac_permissions 
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
      await client.query('DELETE FROM rbac_role_feature_permissions WHERE permission_id = $1', [id]);
      
      // Delete the permission
      await client.query('DELETE FROM rbac_permissions WHERE id = $1', [id]);
      
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async getAll(limit?: number, offset?: number): Promise<{ permissions: IPostgresPermission[], total: number }> {
    // Get total count
    const countQuery = 'SELECT COUNT(*) FROM rbac_permissions';
    const countResult = await this.pool.query(countQuery);
    const total = parseInt(countResult.rows[0].count);

    // Get permissions with pagination and usage count
    let query = `
      SELECT p.*, 
             COUNT(DISTINCT rfp.role_id) as role_count
      FROM rbac_permissions p
      LEFT JOIN rbac_role_feature_permissions rfp ON p.id = rfp.permission_id
      GROUP BY p.id, p.name, p.description, p.created_at, p.updated_at
      ORDER BY p.created_at DESC
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
    return { permissions: result.rows, total };
  }

  async createStandard(): Promise<void> {
    const standardPermissions = [
      { name: 'read', description: 'View and access resources' },
      { name: 'create', description: 'Add new resources' },
      { name: 'update', description: 'Modify existing resources' },
      { name: 'delete', description: 'Remove resources' },
      { name: 'sudo', description: 'Full administrative access' }
    ];

    for (const permissionData of standardPermissions) {
      const existing = await this.findByName(permissionData.name);
      if (!existing) {
        await this.create(permissionData);
      }
    }
  }
}