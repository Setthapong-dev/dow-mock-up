require('dotenv').config();
const bcrypt = require('bcryptjs');
const sql = require('./configs/db');

async function seed() {
  console.log('Seeding database...\n');

  const pw = await bcrypt.hash('123456', 10);

  // ── Users ──────────────────────────────────────────────
  console.log('Creating users...');
  await sql`DELETE FROM change_approvals`;
  await sql`DELETE FROM asset_changes`;
  await sql`DELETE FROM assets`;
  await sql`DELETE FROM locations`;
  await sql`DELETE FROM users`;

  const users = await sql`
    INSERT INTO users (name, email, password_hash, role) VALUES
      ('Admin Somchai',  'admin@example.com',   ${pw}, 'admin'),
      ('Owner Anong',    'owner1@example.com',  ${pw}, 'owner'),
      ('Owner Prasert',  'owner2@example.com',  ${pw}, 'owner'),
      ('User Kanya',     'user1@example.com',   ${pw}, 'user'),
      ('User Danai',     'user2@example.com',   ${pw}, 'user')
    RETURNING id, name, role
  `;

  const admin   = users.find(u => u.role === 'admin');
  const owner1  = users.find(u => u.name === 'Owner Anong');
  const owner2  = users.find(u => u.name === 'Owner Prasert');
  const userA   = users.find(u => u.name === 'User Kanya');
  const userB   = users.find(u => u.name === 'User Danai');

  console.log(`  ✓ ${users.length} users created`);
  console.log('    Login: any email above / password: 123456\n');

  // ── Locations ──────────────────────────────────────────
  console.log('Creating locations...');
  const locations = await sql`
    INSERT INTO locations (name, description) VALUES
      ('Building A - Floor 1', 'Main office building, ground floor'),
      ('Building A - Floor 2', 'Main office building, second floor'),
      ('Building B - Lab',     'Research laboratory'),
      ('Warehouse 1',          'Main storage warehouse'),
      ('Server Room',          'IT infrastructure room'),
      ('Conference Room 3A',   'Large meeting room, Building A')
    RETURNING id, name
  `;
  console.log(`  ✓ ${locations.length} locations created\n`);

  const loc = (name) => locations.find(l => l.name.includes(name));

  // ── Assets ─────────────────────────────────────────────
  console.log('Creating assets...');
  const assets = await sql`
    INSERT INTO assets (name, description, owner_id, location_id, status) VALUES
      ('Laptop Dell XPS 15',        'Intel i9, 32GB RAM, 1TB SSD',             ${owner1.id}, ${loc('Floor 1').id}, 'active'),
      ('Laptop MacBook Pro 14"',    'M3 Pro, 18GB RAM, 512GB SSD',             ${owner1.id}, ${loc('Floor 2').id}, 'active'),
      ('Monitor LG 27" 4K',         'UltraFine 27UN850-W',                     ${owner1.id}, ${loc('Floor 1').id}, 'active'),
      ('Projector Epson EB-L260F',  'Laser projector, 4600 lumens',            ${owner2.id}, ${loc('Conference').id}, 'active'),
      ('Server HPE ProLiant DL380', 'Dual Xeon, 128GB RAM, RAID',             ${owner2.id}, ${loc('Server Room').id}, 'active'),
      ('Printer Canon imageCLASS',  'MF269dw II, wireless laser',             ${owner2.id}, ${loc('Floor 1').id}, 'active'),
      ('iPad Pro 12.9"',            'M2 chip, 256GB, Wi-Fi + Cellular',       ${owner1.id}, ${loc('Lab').id}, 'active'),
      ('UPS APC Smart-UPS 3000',    '3000VA, rack mount, LCD',                ${owner2.id}, ${loc('Server Room').id}, 'active'),
      ('Desktop PC Custom Build',   'Ryzen 9, RTX 4090, 64GB RAM',           ${owner1.id}, ${loc('Lab').id}, 'notactive'),
      ('Network Switch Cisco 48p',  'Catalyst 9300, 48-port PoE+',           ${owner2.id}, ${loc('Server Room').id}, 'active'),
      ('Webcam Logitech Brio 4K',   'Ultra HD webcam with HDR',              ${owner1.id}, ${loc('Floor 2').id}, 'active'),
      ('Air Purifier Dyson TP07',   'HEPA+Carbon filter, Wi-Fi enabled',     ${owner2.id}, ${loc('Conference').id}, 'notactive')
    RETURNING id, name, owner_id, status
  `;
  console.log(`  ✓ ${assets.length} assets created\n`);

  const asset = (keyword) => assets.find(a => a.name.includes(keyword));

  // ── Asset Changes ──────────────────────────────────────
  console.log('Creating asset changes...');

  // 1) Location change (done, no approval needed)
  const [chg1] = await sql`
    INSERT INTO asset_changes (asset_id, requested_by, change_type, old_value, new_value, status, requires_approval)
    VALUES (
      ${asset('Laptop Dell').id}, ${userA.id}, 'location',
      ${JSON.stringify({ location_id: loc('Floor 1').id, location_name: 'Building A - Floor 1' })},
      ${JSON.stringify({ location_id: loc('Floor 2').id, location_name: 'Building A - Floor 2' })},
      'done', false
    ) RETURNING id
  `;

  // 2) Status change (approved & done)
  const [chg2] = await sql`
    INSERT INTO asset_changes (asset_id, requested_by, change_type, old_value, new_value, status, requires_approval)
    VALUES (
      ${asset('Desktop PC').id}, ${userB.id}, 'status',
      ${JSON.stringify({ status: 'active' })},
      ${JSON.stringify({ status: 'notactive' })},
      'done', true
    ) RETURNING id
  `;

  // 3) Owner change (approved & done)
  const [chg3] = await sql`
    INSERT INTO asset_changes (asset_id, requested_by, change_type, old_value, new_value, status, requires_approval)
    VALUES (
      ${asset('Monitor LG').id}, ${userA.id}, 'owner',
      ${JSON.stringify({ owner_id: owner1.id, owner_name: 'Owner Anong' })},
      ${JSON.stringify({ owner_id: owner2.id, owner_name: 'Owner Prasert' })},
      'done', true
    ) RETURNING id
  `;

  // 4) Status change (pending — waiting owner approval)
  const [chg4] = await sql`
    INSERT INTO asset_changes (asset_id, requested_by, change_type, old_value, new_value, status, requires_approval)
    VALUES (
      ${asset('Air Purifier').id}, ${userA.id}, 'status',
      ${JSON.stringify({ status: 'notactive' })},
      ${JSON.stringify({ status: 'active' })},
      'pending', true
    ) RETURNING id
  `;

  // 5) Owner change (pending — waiting both owners)
  const [chg5] = await sql`
    INSERT INTO asset_changes (asset_id, requested_by, change_type, old_value, new_value, status, requires_approval)
    VALUES (
      ${asset('iPad Pro').id}, ${userB.id}, 'owner',
      ${JSON.stringify({ owner_id: owner1.id, owner_name: 'Owner Anong' })},
      ${JSON.stringify({ owner_id: owner2.id, owner_name: 'Owner Prasert' })},
      'pending', true
    ) RETURNING id
  `;

  // 6) Status change (pending)
  const [chg6] = await sql`
    INSERT INTO asset_changes (asset_id, requested_by, change_type, old_value, new_value, status, requires_approval)
    VALUES (
      ${asset('Webcam').id}, ${userB.id}, 'status',
      ${JSON.stringify({ status: 'active' })},
      ${JSON.stringify({ status: 'notactive' })},
      'pending', true
    ) RETURNING id
  `;

  // 7) Owner change (rejected)
  const [chg7] = await sql`
    INSERT INTO asset_changes (asset_id, requested_by, change_type, old_value, new_value, status, requires_approval)
    VALUES (
      ${asset('Printer Canon').id}, ${userA.id}, 'owner',
      ${JSON.stringify({ owner_id: owner2.id, owner_name: 'Owner Prasert' })},
      ${JSON.stringify({ owner_id: owner1.id, owner_name: 'Owner Anong' })},
      'rejected', true
    ) RETURNING id
  `;

  // 8) Location change (done, no approval)
  const [chg8] = await sql`
    INSERT INTO asset_changes (asset_id, requested_by, change_type, old_value, new_value, status, requires_approval)
    VALUES (
      ${asset('Projector').id}, ${userA.id}, 'location',
      ${JSON.stringify({ location_id: loc('Conference').id, location_name: 'Conference Room 3A' })},
      ${JSON.stringify({ location_id: loc('Floor 2').id, location_name: 'Building A - Floor 2' })},
      'done', false
    ) RETURNING id
  `;

  // 9) Status change (pending) — from owner1
  const [chg9] = await sql`
    INSERT INTO asset_changes (asset_id, requested_by, change_type, old_value, new_value, status, requires_approval)
    VALUES (
      ${asset('Network Switch').id}, ${owner1.id}, 'status',
      ${JSON.stringify({ status: 'active' })},
      ${JSON.stringify({ status: 'notactive' })},
      'pending', true
    ) RETURNING id
  `;

  console.log('  ✓ 9 asset changes created\n');

  // ── Change Approvals ───────────────────────────────────
  console.log('Creating change approvals...');

  // chg2 (status done) — owner approved
  await sql`
    INSERT INTO change_approvals (change_id, approver_id, approver_role, status, responded_at)
    VALUES (${chg2.id}, ${owner1.id}, 'owner', 'approved', now() - interval '3 days')
  `;

  // chg3 (owner change done) — old_owner & new_owner approved
  await sql`
    INSERT INTO change_approvals (change_id, approver_id, approver_role, status, responded_at) VALUES
      (${chg3.id}, ${owner1.id}, 'old_owner', 'approved', now() - interval '2 days'),
      (${chg3.id}, ${owner2.id}, 'new_owner', 'approved', now() - interval '1 day')
  `;

  // chg4 (status pending) — owner pending
  await sql`
    INSERT INTO change_approvals (change_id, approver_id, approver_role, status)
    VALUES (${chg4.id}, ${owner2.id}, 'owner', 'pending')
  `;

  // chg5 (owner change pending) — old_owner approved, new_owner pending
  await sql`
    INSERT INTO change_approvals (change_id, approver_id, approver_role, status, responded_at) VALUES
      (${chg5.id}, ${owner1.id}, 'old_owner', 'approved', now() - interval '12 hours')
  `;
  await sql`
    INSERT INTO change_approvals (change_id, approver_id, approver_role, status)
    VALUES (${chg5.id}, ${owner2.id}, 'new_owner', 'pending')
  `;

  // chg6 (status pending) — owner pending
  await sql`
    INSERT INTO change_approvals (change_id, approver_id, approver_role, status)
    VALUES (${chg6.id}, ${owner1.id}, 'owner', 'pending')
  `;

  // chg7 (owner change rejected) — old_owner rejected
  await sql`
    INSERT INTO change_approvals (change_id, approver_id, approver_role, status, responded_at)
    VALUES (${chg7.id}, ${owner2.id}, 'old_owner', 'rejected', now() - interval '5 days')
  `;

  // chg9 (status pending) — owner pending
  await sql`
    INSERT INTO change_approvals (change_id, approver_id, approver_role, status)
    VALUES (${chg9.id}, ${owner2.id}, 'owner', 'pending')
  `;

  console.log('  ✓ 9 change approvals created\n');

  // ── Summary ────────────────────────────────────────────
  console.log('════════════════════════════════════════════');
  console.log('  Seed complete!');
  console.log('════════════════════════════════════════════');
  console.log('');
  console.log('  Test accounts (password: 123456):');
  console.log('  ┌────────────────────────┬───────┐');
  console.log('  │ Email                  │ Role  │');
  console.log('  ├────────────────────────┼───────┤');
  console.log('  │ admin@example.com      │ admin │');
  console.log('  │ owner1@example.com     │ owner │');
  console.log('  │ owner2@example.com     │ owner │');
  console.log('  │ user1@example.com      │ user  │');
  console.log('  │ user2@example.com      │ user  │');
  console.log('  └────────────────────────┴───────┘');
  console.log('');
  console.log('  Data summary:');
  console.log('   • 5 users (1 admin, 2 owners, 2 users)');
  console.log('   • 6 locations');
  console.log('   • 12 assets (10 active, 2 notactive)');
  console.log('   • 9 asset changes (3 done, 3 pending, 1 rejected, 2 location-auto)');
  console.log('   • 9 change approvals');
  console.log('');
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
