const jwt = require('jsonwebtoken');

exports.verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader) return res.status(403).json({ message: 'Không tìm thấy token' });

  // Token thường có dạng "Bearer <token>"
  const token = authHeader.split(' ')[1];
  
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) return res.status(401).json({ message: 'Token hết hạn hoặc không hợp lệ' });
    
    // Lưu thông tin user vào request để các controller sau sử dụng
    req.user = decoded; 
    next();
  });
};