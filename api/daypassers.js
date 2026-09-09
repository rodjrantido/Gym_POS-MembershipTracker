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
      const result = await query('SELECT * FROM day_passers ORDER BY created_at DESC');
      return res.status(200).json(result.rows);
    }

    if (req.method === 'POST') {
      const { id, name, status = 'ACTIVE', raw_date, date, time } = req.body || {};

      if (!id || !name) {
        return res.status(400).json({ error: 'id and name are required' });
      }

      const result = await query(
        `INSERT INTO day_passers (id, name, status, raw_date, date, time)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [id, name, status, raw_date, date, time]
      );
      return res.status(201).json(result.rows[0]);
    }

    if (req.method === 'DELETE') {
      const id = req.query?.id || req.body?.id;
      if (!id) {
        return res.status(400).json({ error: 'Passer ID is required' });
      }

      await query('DELETE FROM day_passers WHERE id = $1', [id]);
      return res.status(200).json({ success: true, id });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('[API /api/daypassers Error]', error);
    return res.status(500).json({ error: error.message || 'Database error' });
  }
}

