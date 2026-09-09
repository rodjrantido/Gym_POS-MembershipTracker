import { query } from './db.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (req.method === 'GET') {
      const result = await query('SELECT * FROM members ORDER BY created_at DESC');
      return res.status(200).json(result.rows);
    }

    if (req.method === 'POST') {
      const {
        id,
        name,
        phone,
        plan = 'Monthly (₱500)',
        status = 'ACTIVE',
        start_date = new Date().toISOString().split('T')[0],
        expires_at,
        photo_url = null,
      } = req.body || {};

      if (!id || !name) {
        return res.status(400).json({ error: 'id and name are required' });
      }

      const result = await query(
        `INSERT INTO members (id, name, phone, plan, status, start_date, expires_at, photo_url)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING *`,
        [id, name, phone, plan, status, start_date, expires_at, photo_url]
      );
      return res.status(201).json(result.rows[0]);
    }

    if (req.method === 'PUT') {
      const { id, status, expires_at, photo_url, name, phone, plan } = req.body || {};
      if (!id) {
        return res.status(400).json({ error: 'Member ID is required' });
      }

      // Build dynamic update query
      const updates = [];
      const values = [];
      let index = 1;

      if (status !== undefined) {
        updates.push(`status = $${index++}`);
        values.push(status);
      }
      if (expires_at !== undefined) {
        updates.push(`expires_at = $${index++}`);
        values.push(expires_at);
      }
      if (photo_url !== undefined) {
        updates.push(`photo_url = $${index++}`);
        values.push(photo_url);
      }
      if (name !== undefined) {
        updates.push(`name = $${index++}`);
        values.push(name);
      }
      if (phone !== undefined) {
        updates.push(`phone = $${index++}`);
        values.push(phone);
      }
      if (plan !== undefined) {
        updates.push(`plan = $${index++}`);
        values.push(plan);
      }

      if (updates.length === 0) {
        return res.status(400).json({ error: 'No fields provided for update' });
      }

      values.push(id);
      const sql = `UPDATE members SET ${updates.join(', ')} WHERE id = $${index} RETURNING *`;
      const result = await query(sql, values);

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Member not found' });
      }

      return res.status(200).json(result.rows[0]);
    }

    if (req.method === 'DELETE') {
      const id = req.query?.id || req.body?.id;
      if (!id) {
        return res.status(400).json({ error: 'Member ID is required' });
      }

      await query('DELETE FROM members WHERE id = $1', [id]);
      return res.status(200).json({ success: true, id });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('[API /api/members Error]', error);
    return res.status(500).json({ error: error.message || 'Database error' });
  }
}

