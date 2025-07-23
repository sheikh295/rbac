import { Pool } from 'pg';

export interface IPostgresFeature {
  id?: string;
  name: string;
  description: string;
  created_at?: Date;
  updated_at?: Date;
}

export class PostgresFeature {
  constructor(private pool: Pool) {}

  async create(featureData: IPostgresFeature): Promise<IPostgresFeature> {
    const query = `
      INSERT INTO rbac_features (name, description)
      VALUES ($1, $2)
      RETURNING *
    `;
    const values = [featureData.name, featureData.description];
    const result = await this.pool.query(query, values);
    return result.rows[0];
  }

  async findByName(name: string): Promise<IPostgresFeature | null> {
    const query = 'SELECT * FROM rbac_features WHERE name = $1';
    const result = await this.pool.query(query, [name]);
    return result.rows[0] || null;
  }

  async findById(id: string): Promise<IPostgresFeature | null> {
    const query = 'SELECT * FROM rbac_features WHERE id = $1';
    const result = await this.pool.query(query, [id]);
    return result.rows[0] || null;
  }

  async update(id: string, updates: Partial<IPostgresFeature>): Promise<void> {
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
      UPDATE rbac_features 
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
      await client.query('DELETE FROM rbac_role_feature_permissions WHERE feature_id = $1', [id]);
      
      // Delete the feature
      await client.query('DELETE FROM rbac_features WHERE id = $1', [id]);
      
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async getAll(limit?: number, offset?: number): Promise<{ features: IPostgresFeature[], total: number }> {
    // Get total count
    const countQuery = 'SELECT COUNT(*) FROM rbac_features';
    const countResult = await this.pool.query(countQuery);
    const total = parseInt(countResult.rows[0].count);

    // Get features with pagination and role count
    let query = `
      SELECT f.*, 
             COUNT(DISTINCT rfp.role_id) as role_count
      FROM rbac_features f
      LEFT JOIN rbac_role_feature_permissions rfp ON f.id = rfp.feature_id
      GROUP BY f.id, f.name, f.description, f.created_at, f.updated_at
      ORDER BY f.created_at DESC
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
    return { features: result.rows, total };
  }
}