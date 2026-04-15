import { Pool } from 'pg';
import bcrypt from 'bcryptjs';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,DELETE,PATCH,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { userId, amount, pin } = req.body;

  if (!userId || !amount || amount <= 0 || !pin) {
    return res.status(400).json({ error: 'Invalid withdrawal request' });
  }

  try {
    const userResult = await pool.query('SELECT full_name, phone_number, withdraw_pin_hash FROM users WHERE id = $1', [userId]);
    if (userResult.rowCount === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userResult.rows[0];
    const validPin = await bcrypt.compare(pin, user.withdraw_pin_hash);
    if (!validPin) {
      return res.status(401).json({ error: 'Invalid withdraw PIN' });
    }

    const result = await pool.query(
      `INSERT INTO transactions (user_id, type, name, phone_number, amount, status, reference)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, user_id, type, amount, status, reference, created_at`,
      [userId, 'withdraw', user.full_name, user.phone_number, amount, 'pending', null]
    );

    res.status(201).json({ transaction: result.rows[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
}