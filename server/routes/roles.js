const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const authMiddleware = require('../middleware/auth');

// 获取角色列表
router.get('/', authMiddleware, async (req, res) => {
  try {
    const [roles] = await pool.execute('SELECT * FROM role ORDER BY id');
    res.json({ code: 200, data: roles });
  } catch (error) {
    console.error('获取角色列表错误:', error);
    res.status(500).json({ code: 500, message: '服务器错误', error: error.message });
  }
});

// 创建角色
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { name, description, permissions } = req.body;
    const permissionsJson = typeof permissions === 'object' ? JSON.stringify(permissions) : permissions;

    const [result] = await pool.execute(
      'INSERT INTO role (name, description, permissions) VALUES (?, ?, ?)',
      [name, description, permissionsJson]
    );

    res.json({ code: 200, message: '创建成功', data: { id: result.insertId } });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ code: 400, message: '角色名称已存在' });
    }
    console.error('创建角色错误:', error);
    res.status(500).json({ code: 500, message: '服务器错误', error: error.message });
  }
});

// 更新角色
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, permissions } = req.body;

    const updates = [];
    const params = [];

    if (name !== undefined) {
      updates.push('name = ?');
      params.push(name);
    }
    if (description !== undefined) {
      updates.push('description = ?');
      params.push(description);
    }
    if (permissions !== undefined) {
      const permissionsJson = typeof permissions === 'object' ? JSON.stringify(permissions) : permissions;
      updates.push('permissions = ?');
      params.push(permissionsJson);
    }

    if (updates.length === 0) {
      return res.status(400).json({ code: 400, message: '没有要更新的字段' });
    }

    params.push(id);
    await pool.execute(`UPDATE role SET ${updates.join(', ')} WHERE id = ?`, params);

    res.json({ code: 200, message: '更新成功' });
  } catch (error) {
    console.error('更新角色错误:', error);
    res.status(500).json({ code: 500, message: '服务器错误', error: error.message });
  }
});

// 删除角色
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    await pool.execute('DELETE FROM role WHERE id = ?', [id]);
    res.json({ code: 200, message: '删除成功' });
  } catch (error) {
    console.error('删除角色错误:', error);
    res.status(500).json({ code: 500, message: '服务器错误', error: error.message });
  }
});

module.exports = router;

