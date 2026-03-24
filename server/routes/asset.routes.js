const express = require('express');
const sql = require('../configs/db');
const verifyToken = require('../middleware/auth');

const router = express.Router();

router.use(verifyToken);

router.get('/', async (req, res) => {
  try {
    const rows = await sql`
      SELECT a.*, u.name as owner_name, l.name as location_name
      FROM assets a
      LEFT JOIN users u ON a.owner_id = u.id
      LEFT JOIN locations l ON a.location_id = l.id
      ORDER BY a.created_at DESC
    `;
    res.json(rows);
  } catch (err) {
    console.error('Get assets error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const assetRows = await sql`
      SELECT a.*, u.name as owner_name, l.name as location_name
      FROM assets a
      LEFT JOIN users u ON a.owner_id = u.id
      LEFT JOIN locations l ON a.location_id = l.id
      WHERE a.id = ${id}
    `;
    if (assetRows.length === 0) {
      return res.status(404).json({ error: 'Asset not found' });
    }

    const changes = await sql`
      SELECT ac.*, u.name as requested_by_name
      FROM asset_changes ac
      LEFT JOIN users u ON ac.requested_by = u.id
      WHERE ac.asset_id = ${id}
      ORDER BY ac.created_at DESC
    `;

    const changeIds = changes.map(c => c.id);
    let approvals = [];
    if (changeIds.length > 0) {
      approvals = await sql`
        SELECT ca.*, u.name as approver_name
        FROM change_approvals ca
        LEFT JOIN users u ON ca.approver_id = u.id
        WHERE ca.change_id = ANY(${changeIds})
        ORDER BY ca.approver_role
      `;
    }

    const changesWithApprovals = changes.map(c => ({
      ...c,
      approvals: approvals.filter(a => a.change_id === c.id)
    }));

    res.json({ ...assetRows[0], changes: changesWithApprovals });
  } catch (err) {
    console.error('Get asset error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { name, description, location_id } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'name is required' });
    }

    const owner_id = req.user.id;
    const rows = await sql`
      INSERT INTO assets (name, description, owner_id, location_id)
      VALUES (${name}, ${description || null}, ${owner_id}, ${location_id || null})
      RETURNING *
    `;
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('Create asset error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    const rows = await sql`
      UPDATE assets
      SET name = COALESCE(${name ?? null}, name),
          description = COALESCE(${description ?? null}, description)
      WHERE id = ${id}
      RETURNING *
    `;
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Asset not found' });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error('Update asset error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
