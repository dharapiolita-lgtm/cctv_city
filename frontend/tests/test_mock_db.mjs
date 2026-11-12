import test from 'node:test';
import assert from 'node:assert/strict';
import { executeMockQuery } from '../lib/mock-db.ts';

test('1. Mock DB - User lookup by username', async () => {
  const res = await executeMockQuery('SELECT * FROM users WHERE LOWER(username) = $1', ['admin']);
  assert.equal(res.rows.length, 1);
  assert.equal(res.rows[0].username, 'admin');
  assert.equal(res.rows[0].role, 'admin');
  assert.match(res.rows[0].password_hash, /^\$argon2id/);
});

test('2. Mock DB - Camera list and random online camera', async () => {
  const allCams = await executeMockQuery('SELECT * FROM cameras WHERE 1=1');
  assert.equal(allCams.rows.length, 7);

  const randCam = await executeMockQuery("SELECT id, nama, alamat FROM cameras WHERE status = 'online' ORDER BY RANDOM() LIMIT 1");
  assert.equal(randCam.rows.length, 1);
  assert.ok(randCam.rows[0].nama);
});

test('3. Mock DB - Event simulation and single validation', async () => {
  const insertEv = await executeMockQuery(
    'INSERT INTO detection_events (id, camera_id, jenis, skor, snapshot_path, clip_path) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
    ['aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'crowd', 0.85, '/demo/s.jpg', '/demo/c.mp4']
  );
  assert.equal(insertEv.rows.length, 1);
  const eventId = insertEv.rows[0].id;

  // Validate as valid
  const valRes = await executeMockQuery(
    'UPDATE detection_events SET validasi = $1, divalidasi_oleh = $2, divalidasi_pada = NOW() WHERE id = $3 AND validasi IS NULL RETURNING id, validasi',
    ['valid', '22222222-2222-2222-2222-222222222222', eventId]
  );
  assert.equal(valRes.rows.length, 1);
  assert.equal(valRes.rows[0].validasi, 'valid');

  // Second validation must return empty (prevent double validation)
  const doubleVal = await executeMockQuery(
    'UPDATE detection_events SET validasi = $1, divalidasi_oleh = $2, divalidasi_pada = NOW() WHERE id = $3 AND validasi IS NULL RETURNING id, validasi',
    ['false_alarm', '22222222-2222-2222-2222-222222222222', eventId]
  );
  assert.equal(doubleVal.rows.length, 0, 'Double validation must be rejected');
});

test('4. Mock DB - Incident creation and status progression', async () => {
  const insertInc = await executeMockQuery(
    'INSERT INTO incidents (id, event_id, jenis, keparahan, status, lokasi, deskripsi, dibuat_oleh, ditugaskan_ke) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
    ['e-test-123', 'Kerumunan', 'tinggi', 'ditugaskan', 'Simpang Barat', 'Massa berkumpul', 'op-1', 'petugas-1']
  );
  assert.equal(insertInc.rows.length, 1);
  const incId = insertInc.rows[0].id;

  // Progress status to diterima
  const updRes = await executeMockQuery(
    'UPDATE incidents SET status = $1, selesai_pada = COALESCE(selesai_pada, $2), updated_at = NOW() WHERE id = $3 RETURNING *',
    ['diterima', null, incId]
  );
  assert.equal(updRes.rows.length, 1);
  assert.equal(updRes.rows[0].status, 'diterima');
});

test('5. Mock DB - Dashboard Summary metrics', async () => {
  const camRes = await executeMockQuery("SELECT COUNT(*) FILTER (WHERE status = 'online')::int as online FROM cameras");
  assert.ok(camRes.rows[0].total >= 7);
  assert.ok(camRes.rows[0].online >= 5);

  const incRes = await executeMockQuery("SELECT COUNT(*)::int as count FROM incidents WHERE status != 'ditutup'");
  assert.ok(incRes.rows[0].count >= 2);
});

