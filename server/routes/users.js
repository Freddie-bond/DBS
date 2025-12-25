const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const bcrypt = require('bcryptjs');
const authMiddleware = require('../middleware/auth');

// 获取用户列表
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { page = 1, pageSize = 10, keyword = '' } = req.query;
    const offset = (page - 1) * pageSize;

    let sql = `
      SELECT u.*, r.name as role_name 
      FROM user u 
      LEFT JOIN role r ON u.role_id = r.id 
      WHERE 1=1
    `;
    const params = [];

    if (keyword) {
      sql += ' AND (u.username LIKE ? OR u.real_name LIKE ?)';
      params.push(`%${keyword}%`, `%${keyword}%`);
    }

    sql += ' ORDER BY u.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(pageSize), offset);

    const [users] = await pool.execute(sql, params);
    
    // 构建COUNT查询
    let countSql = `
      SELECT COUNT(DISTINCT u.id) as total
      FROM user u
      LEFT JOIN role r ON u.role_id = r.id
      WHERE 1=1
    `;
    const countParams = [];
    if (keyword) {
      countSql += ' AND (u.username LIKE ? OR u.real_name LIKE ?)';
      countParams.push(`%${keyword}%`, `%${keyword}%`);
    }
    const [countResult] = await pool.execute(countSql, countParams);

    res.json({
      code: 200,
      data: {
        list: users,
        total: countResult[0].total,
        page: parseInt(page),
        pageSize: parseInt(pageSize)
      }
    });
  } catch (error) {
    console.error('获取用户列表错误:', error);
    res.status(500).json({ code: 500, message: '服务器错误', error: error.message });
  }
});

// 创建用户
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { username, password, real_name, role_id, is_active = true } = req.body;

    if (!username || !password) {
      return res.status(400).json({ code: 400, message: '用户名和密码不能为空' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const [result] = await pool.execute(
      'INSERT INTO user (username, password, real_name, role_id, is_active) VALUES (?, ?, ?, ?, ?)',
      [username, hashedPassword, real_name, role_id, is_active]
    );

    res.json({ code: 200, message: '创建成功', data: { id: result.insertId } });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ code: 400, message: '用户名已存在' });
    }
    console.error('创建用户错误:', error);
    res.status(500).json({ code: 500, message: '服务器错误', error: error.message });
  }
});

// 更新用户
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { real_name, role_id, is_active, password } = req.body;

    const updates = [];
    const params = [];

    if (real_name !== undefined) {
      updates.push('real_name = ?');
      params.push(real_name);
    }
    if (role_id !== undefined) {
      updates.push('role_id = ?');
      params.push(role_id);
    }
    if (is_active !== undefined) {
      updates.push('is_active = ?');
      params.push(is_active);
    }
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      updates.push('password = ?');
      params.push(hashedPassword);
    }

    if (updates.length === 0) {
      return res.status(400).json({ code: 400, message: '没有要更新的字段' });
    }

    params.push(id);
    await pool.execute(
      `UPDATE user SET ${updates.join(', ')} WHERE id = ?`,
      params
    );

    res.json({ code: 200, message: '更新成功' });
  } catch (error) {
    console.error('更新用户错误:', error);
    res.status(500).json({ code: 500, message: '服务器错误', error: error.message });
  }
});

// 删除用户
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    await pool.execute('DELETE FROM user WHERE id = ?', [id]);
    res.json({ code: 200, message: '删除成功' });
  } catch (error) {
    console.error('删除用户错误:', error);
    res.status(500).json({ code: 500, message: '服务器错误', error: error.message });
  }
});

module.exports = router;

