const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// 登录
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ code: 400, message: '用户名和密码不能为空' });
    }

    const [users] = await pool.execute(
      'SELECT u.*, r.name as role_name, r.permissions FROM user u LEFT JOIN role r ON u.role_id = r.id WHERE u.username = ? AND u.is_active = true',
      [username]
    );

    if (users.length === 0) {
      return res.status(401).json({ code: 401, message: '用户名或密码错误' });
    }

    const user = users[0];
    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      // 记录登录失败
      await pool.execute(
        'INSERT INTO login_log (user_id, username, ip_address, status) VALUES (?, ?, ?, ?)',
        [user.id, username, req.ip || req.connection.remoteAddress, 'failed']
      );
      return res.status(401).json({ code: 401, message: '用户名或密码错误' });
    }

    // 记录登录成功
    await pool.execute(
      'INSERT INTO login_log (user_id, username, ip_address, status) VALUES (?, ?, ?, ?)',
      [user.id, username, req.ip || req.connection.remoteAddress, 'success']
    );

    const token = jwt.sign(
      { 
        id: user.id, 
        username: user.username, 
        role_id: user.role_id, 
        role_name: user.role_name,
        permissions: user.permissions ? JSON.parse(user.permissions) : {}
      },
      'your-super-secret-jwt-key-change-in-production-which-is-long-enough-for-security',
      { expiresIn: '24h' }
    );

    res.json({
      code: 200,
      message: '登录成功',
      data: {
        token,
        user: {
          id: user.id,
          username: user.username,
          real_name: user.real_name,
          role_id: user.role_id,
          role_name: user.role_name,
          permissions: user.permissions ? JSON.parse(user.permissions) : {}
        }
      }
    });
  } catch (error) {
    console.error('登录错误:', error);
    res.status(500).json({ code: 500, message: '服务器错误', error: error.message });
  }
});

// 获取当前用户信息
router.get('/me', require('../middleware/auth'), async (req, res) => {
  try {
    const [users] = await pool.execute(
      'SELECT u.*, r.name as role_name, r.permissions FROM user u LEFT JOIN role r ON u.role_id = r.id WHERE u.id = ?',
      [req.user.id]
    );

    if (users.length === 0) {
      return res.status(404).json({ code: 404, message: '用户不存在' });
    }

    const user = users[0];
    res.json({
      code: 200,
      data: {
        id: user.id,
        username: user.username,
        real_name: user.real_name,
        role_id: user.role_id,
        role_name: user.role_name,
        permissions: user.permissions ? JSON.parse(user.permissions) : {}
      }
    });
  } catch (error) {
    console.error('获取用户信息错误:', error);
    res.status(500).json({ code: 500, message: '服务器错误', error: error.message });
  }
});

// 登出
router.post('/logout', require('../middleware/auth'), async (req, res) => {
  try {
    // 在实际应用中，可以将token加入黑名单或存储在Redis中进行管理
    // 这里简单返回成功信息
    res.json({
      code: 200,
      message: '登出成功'
    });
  } catch (error) {
    console.error('登出错误:', error);
    res.status(500).json({ code: 500, message: '服务器错误', error: error.message });
  }
});

module.exports = router;

