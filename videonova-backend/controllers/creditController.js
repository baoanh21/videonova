const db = require('../db');

// Trừ credit khi tạo video
exports.deductCredit = async (req, res) => {
  const userId = req.user.id; 
  const { amount, description } = req.body;

  try {
    // 1. Kiểm tra số dư hiện tại
    const userRes = await db.query('SELECT credits FROM users WHERE id = $1', [userId]);
    const currentCredits = userRes.rows[0].credits;

    if (currentCredits < amount) {
      return res.status(400).json({ message: 'Không đủ credit để thực hiện' });
    }

    await db.query('BEGIN'); // Bắt đầu chuỗi giao dịch an toàn

    // 2. Trừ credit trong bảng users
    await db.query('UPDATE users SET credits = credits - $1 WHERE id = $2', [amount, userId]);

    // 3. Ghi log vào bảng transactions
    await db.query(
      'INSERT INTO transactions (user_id, type, amount, description) VALUES ($1, $2, $3, $4)',
      [userId, 'deduct', amount, description || 'Tạo video AI']
    );

    await db.query('COMMIT'); // Xác nhận lưu
    res.json({ success: true, deducted: amount, remaining: currentCredits - amount });
  } catch (err) {
    await db.query('ROLLBACK'); // Hoàn tác nếu có lỗi
    res.status(500).json({ error: err.message });
  }
};

// Nạp thêm credit
exports.addCredit = async (req, res) => {
  const userId = req.user.id;
  const { amount, description } = req.body;

  try {
    await db.query('BEGIN');

    // 1. Cộng credit vào bảng users
    await db.query('UPDATE users SET credits = credits + $1 WHERE id = $2', [amount, userId]);

    // 2. Ghi log nạp tiền
    await db.query(
      'INSERT INTO transactions (user_id, type, amount, description) VALUES ($1, $2, $3, $4)',
      [userId, 'add', amount, description || 'Nạp thêm credit']
    );

    await db.query('COMMIT');
    res.json({ success: true, message: 'Nạp credit thành công' });
  } catch (err) {
    await db.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  }
};

// Lấy danh sách lịch sử giao dịch
exports.getTransactions = async (req, res) => {
  const userId = req.user.id;
  
  try {
    const result = await db.query(
      'SELECT * FROM transactions WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};