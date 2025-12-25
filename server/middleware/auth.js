const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1] || req.headers['x-token'];
  
  if (!token) {
    return res.status(401).json({ code: 401, message: '未提供认证令牌' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ code: 401, message: '无效的认证令牌' });
  }
};

module.exports = authMiddleware;

