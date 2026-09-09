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
      const result = await query('SELECT * FROM transactions ORDER BY created_at DESC');
      const formatted = result.rows.map((row) => ({
        ...row,
        total_amount: parseFloat(row.total_amount),
        items: typeof row.items === 'string' ? JSON.parse(row.items) : row.items,
      }));
      return res.status(200).json(formatted);
    }

    if (req.method === 'POST') {
      const {
        transactionId,
        customerId,
        customerType,
        totalAmount,
        status = 'PAID',
        items = [],
        date,
        time,
        paidDate = null,
        paidTime = null,
        wasUnpaid = false,
      } = req.body || {};

      if (!transactionId) {
        return res.status(400).json({ error: 'transactionId is required' });
      }

      const itemsJson = typeof items === 'string' ? items : JSON.stringify(items);

      const result = await query(
        `INSERT INTO transactions (
          transaction_id, customer_id, customer_type, total_amount,
          status, items, date, time, paid_date, paid_time, was_unpaid
        ) VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7, $8, $9, $10, $11)
        RETURNING *`,
        [
          transactionId,
          customerId,
          customerType,
          parseFloat(totalAmount),
          status,
          itemsJson,
          date,
          time,
          paidDate,
          paidTime,
          wasUnpaid || status === 'UNPAID',
        ]
      );

      const row = result.rows[0];
      return res.status(201).json({
        ...row,
        total_amount: parseFloat(row.total_amount),
        items: typeof row.items === 'string' ? JSON.parse(row.items) : row.items,
      });
    }

    if (req.method === 'PUT') {
      const { transactionId, paidDate, paidTime } = req.body || {};
      if (!transactionId) {
        return res.status(400).json({ error: 'transactionId is required' });
      }

      const result = await query(
        `UPDATE transactions
         SET status = 'PAID', paid_date = $1, paid_time = $2, was_unpaid = TRUE
         WHERE transaction_id = $3
         RETURNING *`,
        [paidDate, paidTime, transactionId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Transaction not found' });
      }

      const row = result.rows[0];
      return res.status(200).json({
        ...row,
        total_amount: parseFloat(row.total_amount),
        items: typeof row.items === 'string' ? JSON.parse(row.items) : row.items,
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('[API /api/transactions Error]', error);
    return res.status(500).json({ error: error.message || 'Database error' });
  }
}

