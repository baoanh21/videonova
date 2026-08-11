const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../db');

exports.register = async (req, res) => {
  const { username, email, password } = req.body;
  const hash = await bcrypt.hash(password, 10);
  try {
    await db.query('INSERT INTO users (username, email, password) VALUES ($1, $2, $3)', [username, email, hash]);
    res.status(201).json({ message: 'Success' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0];
    
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: 'Wrong credentials' });
    }

    const today = new Date().toISOString().split('T')[0];
    const lastLogin = new Date(user.last_login).toISOString().split('T')[0];
    if (today !== lastLogin) {
        await db.query('UPDATE users SET credits = 20, last_login = CURRENT_DATE WHERE id = $1', [user.id]);
        user.credits = 20;
    }

    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1d' });
    res.json({ token, user: { id: user.id, username: user.username, role: user.role, credits: user.credits } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};