import { query } from './db.js';

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { username, password } = req.body || {};
    const cleanUsername = String(username || '').trim();
    const cleanPassword = String(password || '').trim();

    if (!cleanUsername || !cleanPassword) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const result = await query(
      'SELECT id, username, role FROM staff_accounts WHERE LOWER(username) = LOWER($1) AND password = $2 LIMIT 1',
      [cleanUsername, cleanPassword]
    );

    if (result.rows.length === 0) {
      // Diagnostic check: check if any accounts exist
      const countCheck = await query('SELECT COUNT(*) as count FROM staff_accounts');
      const totalAccounts = parseInt(countCheck.rows[0]?.count || '0', 10);
      if (totalAccounts === 0) {
        return res.status(404).json({ error: 'No staff accounts exist in database. Please run the setup/seed script.' });
      }
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    return res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error('[API /api/auth Error]', error);
    return res.status(500).json({ error: error.message || 'Database error' });
  }
}

