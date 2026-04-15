import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

const applyApprovedTransactionsForUser = async (userId) => {
  const approvedRes = await pool.query(
    `SELECT id, type, amount
     FROM transactions
     WHERE user_id = $1 AND status = 'approved' AND processed = false`,
    [userId]
  );

  if (approvedRes.rowCount === 0) return;

  let balanceChange = 0;
  approvedRes.rows.forEach((tx) => {
    balanceChange += tx.type === 'deposit' ? parseFloat(tx.amount) : -parseFloat(tx.amount);
  });

  await pool.query(
    'UPDATE account_balances SET real_balance = real_balance + $1, updated_at = now() WHERE user_id = $2',
    [balanceChange, userId]
  );

  await pool.query(
    `UPDATE transactions
     SET processed = true, updated_at = now()
     WHERE user_id = $1 AND status = 'approved' AND processed = false`,
    [userId]
  );
};

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,DELETE,PATCH,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { userId } = req.query;

  try {
    await applyApprovedTransactionsForUser(userId);

    const result = await pool.query(
      `SELECT id, type, amount, status, reference, created_at, updated_at
       FROM transactions
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 20`,
      [userId]
    );

    res.status(200).json({ transactions: result.rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
}