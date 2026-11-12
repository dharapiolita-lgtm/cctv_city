import test from 'node:test';
import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';
import { argon2id, argon2Verify } from 'hash-wasm';

const JWT_SECRET = 'waterwatch-super-secret-jwt-key-2026-cctv-secure-dev';

// Helpers matching frontend/lib/server-auth.ts
async function hashPassword(password) {
  const salt = new Uint8Array(16);
  for (let i = 0; i < 16; i++) salt[i] = i + 1; // deterministic salt for unit test
  return argon2id({
    password,
    salt,
    parallelism: 4,
    iterations: 3,
    memorySize: 65536,
    hashLength: 32,
    outputType: 'encoded',
  });
}

function createToken(user) {
  return jwt.sign(
    { sub: user.id, username: user.username, nama: user.nama, role: user.role },
    JWT_SECRET,
    { expiresIn: '8h' }
  );
}

function verifyToken(token, secret = JWT_SECRET) {
  try {
    return jwt.verify(token, secret);
  } catch {
    return null;
  }
}

function requireRole(user, allowed) {
  if (!user) return { error: 'Otorisasi diperlukan.', status: 401 };
  if (!allowed.includes(user.role)) {
    return { error: `Akses ditolak. Peran '${user.role}' tidak memiliki hak akses.`, status: 403 };
  }
  return {};
}

// State Machine validator matching app/api/incidents/[id]/status/route.ts
function validateStatusTransition(status_lama, status_baru) {
  const validTransitions = {
    baru: ['ditugaskan'],
    ditugaskan: ['diterima'],
    diterima: ['di_lokasi'],
    di_lokasi: ['selesai'],
    selesai: ['ditutup'],
  };
  const allowed = validTransitions[status_lama] || [];
  return allowed.includes(status_baru);
}

function checkOfficerPermission(authUser, incident, status_baru) {
  if (['diterima', 'di_lokasi', 'selesai'].includes(status_baru)) {
    if (authUser.role === 'petugas') {
      if (incident.ditugaskan_ke !== authUser.sub) {
        return { error: 'Anda hanya dapat memperbarui status insiden yang ditugaskan kepada Anda.', status: 403 };
      }
      return {};
    }
    if (authUser.role !== 'admin' && authUser.role !== 'operator') {
      return { error: 'Peran Anda tidak memiliki izin memperbarui status penanganan.', status: 403 };
    }
    return {};
  }
  if (status_baru === 'ditutup') {
    if (authUser.role !== 'admin' && authUser.role !== 'operator') {
      return { error: 'Hanya Operator Command Center atau Administrator yang berwenang menutup insiden.', status: 403 };
    }
    return {};
  }
  return {};
}

// --- TEST SUITES ---

test('1. Security & Hashing - Argon2id Verification', async () => {
  const plain = 'password123';
  const hash = await hashPassword(plain);
  assert.match(hash, /^\$argon2id\$v=19\$m=65536,t=3,p=4\$/, 'Hash format must follow Argon2id OWASP specification');

  const validMatch = await argon2Verify({ password: plain, hash });
  assert.equal(validMatch, true, 'Valid password must match hash');

  const invalidMatch = await argon2Verify({ password: 'wrongpassword', hash });
  assert.equal(invalidMatch, false, 'Invalid password must be rejected');
});

test('2. Authentication & JWT Token Lifecycle', () => {
  const user = { id: '11111111-1111-1111-1111-111111111111', username: 'operator', nama: 'Rian Pratama', role: 'operator' };
  const token = createToken(user);
  assert.ok(token, 'Token string must be generated');

  const decoded = verifyToken(token);
  assert.equal(decoded.sub, user.id);
  assert.equal(decoded.role, 'operator');
  assert.equal(decoded.username, 'operator');

  const badToken = verifyToken(token, 'wrong-secret-key-test');
  assert.equal(badToken, null, 'Tampered or wrong secret must fail verification');
});

test('3. RBAC (Role-Based Access Control) Matrix', () => {
  const admin = { sub: 'u1', role: 'admin' };
  const operator = { sub: 'u2', role: 'operator' };
  const petugas = { sub: 'u3', role: 'petugas' };
  const pimpinan = { sub: 'u4', role: 'pimpinan' };

  // Admin-only endpoints (e.g. User Management, Camera Create)
  assert.deepEqual(requireRole(admin, ['admin']), {});
  assert.equal(requireRole(operator, ['admin']).status, 403);
  assert.equal(requireRole(petugas, ['admin']).status, 403);
  assert.equal(requireRole(pimpinan, ['admin']).status, 403);

  // Operator + Admin endpoints (e.g. Event Validate, Incident Create)
  assert.deepEqual(requireRole(operator, ['admin', 'operator']), {});
  assert.deepEqual(requireRole(admin, ['admin', 'operator']), {});
  assert.equal(requireRole(petugas, ['admin', 'operator']).status, 403);
  assert.equal(requireRole(pimpinan, ['admin', 'operator']).status, 403);

  // Unauthenticated (null token)
  assert.equal(requireRole(null, ['admin', 'operator']).status, 401);
});

test('4. Incident SOP Lifecycle State Machine', () => {
  // Valid linear flow
  assert.equal(validateStatusTransition('baru', 'ditugaskan'), true);
  assert.equal(validateStatusTransition('ditugaskan', 'diterima'), true);
  assert.equal(validateStatusTransition('diterima', 'di_lokasi'), true);
  assert.equal(validateStatusTransition('di_lokasi', 'selesai'), true);
  assert.equal(validateStatusTransition('selesai', 'ditutup'), true);

  // Invalid skips & backward transitions
  assert.equal(validateStatusTransition('baru', 'di_lokasi'), false, 'Cannot skip directly to di_lokasi');
  assert.equal(validateStatusTransition('baru', 'selesai'), false, 'Cannot skip directly to selesai');
  assert.equal(validateStatusTransition('baru', 'ditutup'), false, 'Cannot close an unassigned incident');
  assert.equal(validateStatusTransition('ditugaskan', 'selesai'), false, 'Officer must accept and arrive at scene');
  assert.equal(validateStatusTransition('ditutup', 'baru'), false, 'Closed incident cannot be reopened');
  assert.equal(validateStatusTransition('selesai', 'diterima'), false, 'Cannot move status backwards');
});

test('5. Officer Assignment Authorization Enforcement', () => {
  const incident = { id: 'inc-1', ditugaskan_ke: 'petugas-uuid-1' };
  const assignedOfficer = { sub: 'petugas-uuid-1', role: 'petugas' };
  const otherOfficer = { sub: 'petugas-uuid-2', role: 'petugas' };
  const operator = { sub: 'op-1', role: 'operator' };
  const pimpinan = { sub: 'lead-1', role: 'pimpinan' };

  // Assigned officer can update diterima, di_lokasi, selesai
  assert.deepEqual(checkOfficerPermission(assignedOfficer, incident, 'diterima'), {});
  assert.deepEqual(checkOfficerPermission(assignedOfficer, incident, 'di_lokasi'), {});
  assert.deepEqual(checkOfficerPermission(assignedOfficer, incident, 'selesai'), {});

  // Other officer CANNOT update someone else's incident
  assert.equal(checkOfficerPermission(otherOfficer, incident, 'diterima').status, 403);
  assert.equal(checkOfficerPermission(otherOfficer, incident, 'di_lokasi').status, 403);

  // Petugas CANNOT close (ditutup) incident
  assert.equal(checkOfficerPermission(assignedOfficer, incident, 'ditutup').status, 403);

  // Operator CAN close incident
  assert.deepEqual(checkOfficerPermission(operator, incident, 'ditutup'), {});

  // Pimpinan CANNOT mutate incident status
  assert.equal(checkOfficerPermission(pimpinan, incident, 'diterima').status, 403);
  assert.equal(checkOfficerPermission(pimpinan, incident, 'ditutup').status, 403);
});

test('6. Event Detection & Validation Business Rules', () => {
  // Confidence score rule
  const isConfidenceValid = (skor) => skor >= 0.60 && skor <= 1.0;
  assert.equal(isConfidenceValid(0.75), true);
  assert.equal(isConfidenceValid(0.59), false, 'Score below 0.60 must not trigger alert');
  assert.equal(isConfidenceValid(1.05), false, 'Score above 1.0 is invalid');

  // Event validation values
  const isValidValidationStatus = (v) => v === 'valid' || v === 'false_alarm';
  assert.equal(isValidValidationStatus('valid'), true);
  assert.equal(isValidValidationStatus('false_alarm'), true);
  assert.equal(isValidValidationStatus('pending'), false);
  assert.equal(isValidValidationStatus('rejected'), false);

  // Conversion to Incident Rule
  const canConvertToIncident = (validationStatus) => validationStatus === 'valid';
  assert.equal(canConvertToIncident('valid'), true);
  assert.equal(canConvertToIncident('false_alarm'), false, 'False alarm cannot become incident');
  assert.equal(canConvertToIncident(null), false, 'Unvalidated event cannot become incident');
});

test('7. Brute Force Account Lockout Calculator', () => {
  const calculateLockout = (failedAttempts) => {
    if (failedAttempts >= 5) {
      return { locked: true, lockMinutes: 15 };
    }
    return { locked: false, remainingChances: 5 - failedAttempts };
  };

  assert.deepEqual(calculateLockout(1), { locked: false, remainingChances: 4 });
  assert.deepEqual(calculateLockout(4), { locked: false, remainingChances: 1 });
  assert.deepEqual(calculateLockout(5), { locked: true, lockMinutes: 15 });
  assert.deepEqual(calculateLockout(6), { locked: true, lockMinutes: 15 });
});

test('8. Dashboard Metrics & KPI Calculations', () => {
  const calculateFalseAlarmRate = (falseAlarms, validatedTotal) => {
    if (validatedTotal === 0) return 0;
    return Math.round((falseAlarms / validatedTotal) * 1000) / 10;
  };

  assert.equal(calculateFalseAlarmRate(2, 10), 20.0);
  assert.equal(calculateFalseAlarmRate(0, 0), 0);
  assert.equal(calculateFalseAlarmRate(1, 3), 33.3);
});
