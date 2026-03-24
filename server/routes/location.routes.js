const express = require('express');
const sql = require('../configs/db');
const verifyToken = require('../middleware/auth');
const requireRole = require('../middleware/role');

const router = express.Router();

router.use(verifyToken);

router.get('/', async (req, res) => {
  try {
    const rows = await sql`SELECT * FROM locations ORDER BY name`;
    res.json(rows);
  } catch (err) {
    console.error('Get locations error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.use(requireRole('admin'));

router.post('/', async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'name is required' });
    }
    const rows = await sql`
      INSERT INTO locations (name, description)
      VALUES (${name}, ${description || null})
      RETURNING *
    `;
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('Create location error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;
    const rows = await sql`
      UPDATE locations
      SET name = COALESCE(${name ?? null}, name),
          description = COALESCE(${description ?? null}, description)
      WHERE id = ${id}
      RETURNING *
    `;
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Location not found' });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error('Update location error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await sql`DELETE FROM locations WHERE id = ${id}`;
    res.json({ message: 'Location deleted' });
  } catch (err) {
    console.error('Delete location error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
