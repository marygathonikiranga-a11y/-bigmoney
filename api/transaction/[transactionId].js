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

  const { transactionId } = req.query;

  try {
    const result = await pool.query(
      'SELECT id, user_id, type, amount, status, processed, reference, created_at, updated_at FROM transactions WHERE id = $1',
      [transactionId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    const transaction = result.rows[0];
    if (transaction.status === 'approved' && !transaction.processed) {
      await applyApprovedTransactionsForUser(transaction.user_id);
      const updatedResult = await pool.query(
        'SELECT id, user_id, type, amount, status, processed, reference, created_at, updated_at FROM transactions WHERE id = $1',
        [transactionId]
      );
      return res.status(200).json({ transaction: updatedResult.rows[0] });
    }

    res.status(200).json({ transaction });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
}