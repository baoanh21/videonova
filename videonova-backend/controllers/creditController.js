const db = require('../db');

exports.deductCredit = async (req, res) => {
  const userId = req.user.id;
  try {
    const result = await db.query('UPDATE users SET credits = credits - 1 WHERE id = $1 AND credits > 0 RETURNING credits', [userId]);
    if (result.rowCount === 0) return res.status(400).json({ message: 'Not enough credits' });
    
    await db.query('INSERT INTO transactions (user_id, type, amount, description) VALUES ($1, $2, $3, $4)', [userId, 'deduct', -1, 'Create video']);
    res.json({ credits: result.rows[0].credits });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.addCredit = async (req, res) => {
  const { amount, planName } = req.body;
  try {
    const result = await db.query('UPDATE users SET credits = credits + $1 WHERE id = $2 RETURNING credits', [amount, req.user.id]);
    await db.query('INSERT INTO transactions (user_id, type, amount, description) VALUES ($1, $2, $3, $4)', [req.user.id, 'add', amount, `Buy ${planName}`]);
    res.json({ credits: result.rows[0].credits });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getTransactions = async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM transactions WHERE user_id = $1 ORDER BY created_at DESC', [req.user.id]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};