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
      const result = await query('SELECT * FROM inventory ORDER BY name ASC');
      // Format price, stock, threshold as numbers
      const formatted = result.rows.map((row) => ({
        ...row,
        price: parseFloat(row.price),
        stock: parseInt(row.stock, 10),
        threshold: parseInt(row.threshold, 10),
      }));
      return res.status(200).json(formatted);
    }

    if (req.method === 'POST') {
      const { id, name, category, price, stock = 0, threshold = 5 } = req.body || {};

      if (!id || !name) {
        return res.status(400).json({ error: 'id and name are required' });
      }

      // Check for duplicate name (case-insensitive)
      const existing = await query('SELECT id FROM inventory WHERE LOWER(name) = LOWER($1) LIMIT 1', [name.trim()]);
      if (existing.rows.length > 0) {
        return res.status(400).json({ error: `A product named "${name.trim()}" already exists!` });
      }

      const result = await query(
        `INSERT INTO inventory (id, name, category, price, stock, threshold)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [id, name.trim(), category, parseFloat(price), parseInt(stock, 10), parseInt(threshold, 10)]
      );

      const item = result.rows[0];
      return res.status(201).json({
        ...item,
        price: parseFloat(item.price),
        stock: parseInt(item.stock, 10),
        threshold: parseInt(item.threshold, 10),
      });
    }

    if (req.method === 'PUT') {
      const { id, stock, price, threshold, name, category } = req.body || {};
      if (!id) {
        return res.status(400).json({ error: 'Inventory item ID is required' });
      }

      const updates = [];
      const values = [];
      let index = 1;

      if (stock !== undefined) {
        updates.push(`stock = $${index++}`);
        values.push(parseInt(stock, 10));
      }
      if (price !== undefined) {
        updates.push(`price = $${index++}`);
        values.push(parseFloat(price));
      }
      if (threshold !== undefined) {
        updates.push(`threshold = $${index++}`);
        values.push(parseInt(threshold, 10));
      }
      if (name !== undefined) {
        updates.push(`name = $${index++}`);
        values.push(name.trim());
      }
      if (category !== undefined) {
        updates.push(`category = $${index++}`);
        values.push(category);
      }

      if (updates.length === 0) {
        return res.status(400).json({ error: 'No fields provided for update' });
      }

      values.push(id);
      const sql = `UPDATE inventory SET ${updates.join(', ')} WHERE id = $${index} RETURNING *`;
      const result = await query(sql, values);

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Inventory item not found' });
      }

      const item = result.rows[0];
      return res.status(200).json({
        ...item,
        price: parseFloat(item.price),
        stock: parseInt(item.stock, 10),
        threshold: parseInt(item.threshold, 10),
      });
    }

    if (req.method === 'DELETE') {
      const id = req.query?.id || req.body?.id;
      if (!id) {
        return res.status(400).json({ error: 'Item ID is required' });
      }

      await query('DELETE FROM inventory WHERE id = $1', [id]);
      return res.status(200).json({ success: true, id });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('[API /api/inventory Error]', error);
    return res.status(500).json({ error: error.message || 'Database error' });
  }
}

