const express = require('express');
const sql = require('../configs/db');
const verifyToken = require('../middleware/auth');

const router = express.Router();

router.use(verifyToken);

router.post('/', async (req, res) => {
  try {
    const { asset_id, change_type, new_value } = req.body;
    if (!asset_id || !change_type || !new_value) {
      return res.status(400).json({ error: 'asset_id, change_type, new_value are required' });
    }

    const assetRows = await sql`
      SELECT * FROM assets WHERE id = ${asset_id}
    `;
    if (assetRows.length === 0) {
      return res.status(404).json({ error: 'Asset not found' });
    }
    const asset = assetRows[0];

    let old_value;
    if (change_type === 'status') {
      old_value = { status: asset.status };
    } else if (change_type === 'owner') {
      old_value = { owner_id: asset.owner_id };
    } else if (change_type === 'location') {
      old_value = { location_id: asset.location_id };
    } else {
      return res.status(400).json({ error: 'Invalid change_type' });
    }

    const requires_approval = change_type !== 'location';
    const status = requires_approval ? 'pending' : 'done';

    const changeRows = await sql`
      INSERT INTO asset_changes (asset_id, requested_by, change_type, old_value, new_value, status, requires_approval)
      VALUES (${asset_id}, ${req.user.id}, ${change_type}, ${JSON.stringify(old_value)}, ${JSON.stringify(new_value)}, ${status}, ${requires_approval})
      RETURNING *
    `;
    const change = changeRows[0];

    if (change_type === 'location') {
      await sql`
        UPDATE assets SET location_id = ${new_value.location_id} WHERE id = ${asset_id}
      `;
      return res.status(201).json({ ...change, message: 'Location updated immediately' });
    }

    if (change_type === 'status') {
      await sql`
        INSERT INTO change_approvals (change_id, approver_id, approver_role)
        VALUES (${change.id}, ${asset.owner_id}, 'owner')
      `;
    } else if (change_type === 'owner') {
      await sql`
        INSERT INTO change_approvals (change_id, approver_id, approver_role)
        VALUES
          (${change.id}, ${asset.owner_id}, 'old_owner'),
          (${change.id}, ${new_value.owner_id}, 'new_owner')
      `;
    }

    res.status(201).json(change);
  } catch (err) {
    console.error('Create change error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/pending', async (req, res) => {
  try {
    const { id: userId, role } = req.user;
    let rows;

    if (role === 'admin') {
      rows = await sql`
        SELECT ca.*, ac.asset_id, ac.change_type, ac.old_value, ac.new_value,
               a.name as asset_name, requester.name as requested_by_name,
               ac.created_at as change_created_at
        FROM change_approvals ca
        JOIN asset_changes ac ON ca.change_id = ac.id
        JOIN assets a ON ac.asset_id = a.id
        JOIN users requester ON ac.requested_by = requester.id
        WHERE ca.status = 'pending'
        ORDER BY ac.created_at DESC
      `;
    } else {
      rows = await sql`
        SELECT ca.*, ac.asset_id, ac.change_type, ac.old_value, ac.new_value,
               a.name as asset_name, requester.name as requested_by_name,
               ac.created_at as change_created_at
        FROM change_approvals ca
        JOIN asset_changes ac ON ca.change_id = ac.id
        JOIN assets a ON ac.asset_id = a.id
        JOIN users requester ON ac.requested_by = requester.id
        WHERE ca.approver_id = ${userId} AND ca.status = 'pending'
        ORDER BY ac.created_at DESC
      `;
    }

    res.json(rows);
  } catch (err) {
    console.error('Get pending approvals error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/', async (req, res) => {
  try {
    const { role, id: userId } = req.user;
    let rows;

    if (role === 'admin') {
      rows = await sql`
        SELECT ac.*, a.name as asset_name, u.name as requested_by_name
        FROM asset_changes ac
        JOIN assets a ON ac.asset_id = a.id
        JOIN users u ON ac.requested_by = u.id
        ORDER BY ac.created_at DESC
      `;
    } else if (role === 'owner') {
      rows = await sql`
        SELECT ac.*, a.name as asset_name, u.name as requested_by_name
        FROM asset_changes ac
        JOIN assets a ON ac.asset_id = a.id
        JOIN users u ON ac.requested_by = u.id
        WHERE ac.requested_by = ${userId} OR a.owner_id = ${userId}
        ORDER BY ac.created_at DESC
      `;
    } else {
      rows = await sql`
        SELECT ac.*, a.name as asset_name, u.name as requested_by_name
        FROM asset_changes ac
        JOIN assets a ON ac.asset_id = a.id
        JOIN users u ON ac.requested_by = u.id
        WHERE ac.requested_by = ${userId}
        ORDER BY ac.created_at DESC
      `;
    }

    res.json(rows);
  } catch (err) {
    console.error('Get changes error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/:id/approve', async (req, res) => {
  try {
    const { id } = req.params;
    const { id: userId, role } = req.user;

    let approvalRows;

    if (role === 'admin') {
      approvalRows = await sql`
        UPDATE change_approvals
        SET status = 'approved', responded_at = now()
        WHERE change_id = ${id} AND status = 'pending'
        RETURNING *
      `;
    } else {
      approvalRows = await sql`
        UPDATE change_approvals
        SET status = 'approved', responded_at = now()
        WHERE change_id = ${id} AND approver_id = ${userId} AND status = 'pending'
        RETURNING *
      `;
    }

    if (approvalRows.length === 0) {
      return res.status(404).json({ error: 'No pending approval found' });
    }

    const pending = await sql`
      SELECT COUNT(*) as count FROM change_approvals
      WHERE change_id = ${id} AND status = 'pending'
    `;

    if (parseInt(pending[0].count) === 0) {
      const changeRows = await sql`
        UPDATE asset_changes SET status = 'approved' WHERE id = ${id} RETURNING *
      `;
      const change = changeRows[0];

      if (change.change_type === 'status') {
        await sql`
          UPDATE assets SET status = ${change.new_value.status}::asset_status WHERE id = ${change.asset_id}
        `;
      } else if (change.change_type === 'owner') {
        await sql`
          UPDATE assets SET owner_id = ${change.new_value.owner_id} WHERE id = ${change.asset_id}
        `;
      }

      await sql`UPDATE asset_changes SET status = 'done' WHERE id = ${id}`;
      return res.json({ message: 'Approved and applied', change });
    }

    res.json({ message: 'Approved, waiting for other approvers' });
  } catch (err) {
    console.error('Approve error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/:id/reject', async (req, res) => {
  try {
    const { id } = req.params;
    const { id: userId, role } = req.user;

    let approvalRows;

    if (role === 'admin') {
      approvalRows = await sql`
        UPDATE change_approvals
        SET status = 'rejected', responded_at = now()
        WHERE change_id = ${id} AND status = 'pending'
        RETURNING *
      `;
    } else {
      approvalRows = await sql`
        UPDATE change_approvals
        SET status = 'rejected', responded_at = now()
        WHERE change_id = ${id} AND approver_id = ${userId} AND status = 'pending'
        RETURNING *
      `;
    }

    if (approvalRows.length === 0) {
      return res.status(404).json({ error: 'No pending approval found' });
    }

    await sql`UPDATE asset_changes SET status = 'rejected' WHERE id = ${id}`;

    await sql`
      UPDATE change_approvals SET status = 'rejected', responded_at = now()
      WHERE change_id = ${id} AND status = 'pending'
    `;

    res.json({ message: 'Rejected' });
  } catch (err) {
    console.error('Reject error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
