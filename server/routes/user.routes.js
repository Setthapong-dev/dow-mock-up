const express = require('express');
const bcrypt = require('bcryptjs');
const sql = require('../configs/db');
const verifyToken = require('../middleware/auth');
const requireRole = require('../middleware/role');

const router = express.Router();

router.use(verifyToken);

router.get('/', requireRole('admin'), async (req, res) => {
  try {
    const rows = await sql`
      SELECT id, name, email, role, is_active, created_at, updated_at
      FROM users ORDER BY created_at DESC
    `;
    res.json(rows);
  } catch (err) {
    console.error('Get users error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/', requireRole('admin'), async (req, res) => {
  try {
    const { name, email, password, role: bodyRole } = req.body;
    const role = bodyRole || 'user';

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'name, email, password are required' });
    }

    if (!['admin', 'owner', 'user'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    const existing = await sql`SELECT id FROM users WHERE email = ${email}`;
    if (existing.length > 0) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const password_hash = await bcrypt.hash(password, 10);
    const rows = await sql`
      INSERT INTO users (name, email, password_hash, role)
      VALUES (${name}, ${email}, ${password_hash}, ${role}::user_role)
      RETURNING id, name, email, role, is_active, created_at, updated_at
    `;

    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('Create user error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/owners', async (req, res) => {
  try {
    const rows = await sql`
      SELECT id, name, email FROM users
      WHERE role IN ('owner', 'admin') AND is_active = true
      ORDER BY name
    `;
    res.json(rows);
  } catch (err) {
    console.error('Get owners error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.patch('/:id', requireRole('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { role, is_active } = req.body;

    const updates = [];
    const values = {};
    if (role !== undefined) values.role = role;
    if (is_active !== undefined) values.is_active = is_active;

    if (Object.keys(values).length === 0) {
      return res.status(400).json({ error: 'Nothing to update' });
    }

    const rows = await sql`
      UPDATE users
      SET role = COALESCE(${role ?? null}::user_role, role),
          is_active = COALESCE(${is_active ?? null}::boolean, is_active)
      WHERE id = ${id}
      RETURNING id, name, email, role, is_active, created_at, updated_at
    `;

    if (rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error('Update user error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:id', requireRole('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const rows = await sql`
      UPDATE users SET is_active = false WHERE id = ${id}
      RETURNING id, name, email, role, is_active
    `;
    if (rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ message: 'User deactivated', user: rows[0] });
  } catch (err) {
    console.error('Delete user error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
