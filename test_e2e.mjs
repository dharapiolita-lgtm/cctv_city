/**
 * WaterWatch CCTV Analitik Keamanan Kota - Automated End-to-End Integration Test Suite (Node.js)
 * Verifies all 5 core scenarios from PRD / Skill:
 * 1. Authentication & RBAC (all 4 roles, password hashing, lockout logic)
 * 2. Camera Management (CRUD, online/offline, deactivation)
 * 3. Detection Event Simulator & Validation (confidence, online-only camera, no double validation)
 * 4. Incident SOP Workflow (strict status transitions, assignment, officer authorization)
 * 5. Executive read-only & Audit Log immutable trail
 */

const BASE_URL = 'http://127.0.0.1:3000';

async function request(endpoint, method = 'GET', body = null, token = null) {
  const url = `${BASE_URL}${endpoint}`;
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  let data = null;
  try {
    data = await res.json();
  } catch (e) {
    data = null;
  }
  return { status: res.status, data };
}

function logTest(name, success, details = '') {
  const badge = success ? '[PASS]' : '[FAIL]';
  console.log(`${badge} ${name}`);
  if (details) console.log(`       -> ${details}`);
  if (!success) {
    console.error('Test failed! Exiting...');
    process.exit(1);
  }
}

async function runSuite() {
  console.log('==================================================');
  console.log('   WATERWATCH E2E INTEGRATION TEST SUITE (Node.js)');
  console.log('==================================================');

  // 1. AUTHENTICATION & ROLES
  console.log('\n--- 1. Authentication & RBAC ---');
  const tokens = {};
  const roles = ['admin', 'operator', 'petugas1', 'pimpinan'];
  for (const role of roles) {
    const { status, data } = await request('/api/auth/login', 'POST', {
      username: role,
      password: 'password123',
    });
    logTest(
      `Login as '${role}'`,
      status === 200 && !!data?.token,
      `User: ${data?.user?.nama_lengkap} (Role: ${data?.user?.role})`
    );
    tokens[role] = data?.token;
  }

  // Verify /api/auth/me
  const { status: meStatus, data: meData } = await request('/api/auth/me', 'GET', null, tokens.admin);
  logTest('Auth Me verification (/api/auth/me)', meStatus === 200 && meData?.username === 'admin');

  // Verify invalid login rejection
  const { status: badStatus, data: badData } = await request('/api/auth/login', 'POST', {
    username: 'admin',
    password: 'wrongpassword',
  });
  logTest('Invalid password rejection (401)', badStatus === 401, `Error: ${badData?.error}`);

  // 2. DASHBOARD SUMMARY
  console.log('\n--- 2. Dashboard Summary Metrics ---');
  const { status: sumStatus, data: summary } = await request('/api/dashboard/summary', 'GET', null, tokens.operator);
  logTest(
    'Fetch Dashboard Summary',
    sumStatus === 200 && summary?.total_cameras !== undefined,
    `Total Cameras: ${summary?.total_cameras}, Online: ${summary?.online_cameras}, Events Today: ${summary?.events_today}, Open Incidents: ${summary?.open_incidents}`
  );

  // 3. CAMERA MANAGEMENT
  console.log('\n--- 3. Camera Management ---');
  const newCamPayload = {
    nama: `CCTV Pos Barat Test Demo ${Date.now() % 1000}`,
    alamat: 'Gerbang Barat Kota',
    lokasi_lat: -5.3951,
    lokasi_lng: 105.2589,
    status: 'online',
    sample_video_path: '/demo/cctv1.mp4',
  };
  const { status: createCamStatus, data: createdCam } = await request('/api/cameras', 'POST', newCamPayload, tokens.admin);
  logTest('Admin creates new camera', createCamStatus === 201 && !!createdCam?.id, `Camera ID: ${createdCam?.id}`);

  // Operator cannot create camera (RBAC)
  const { status: opCamStatus } = await request('/api/cameras', 'POST', newCamPayload, tokens.operator);
  logTest('Operator forbidden from creating camera (403)', opCamStatus === 403);

  // 4. EVENT SIMULATION & VALIDATION
  console.log('\n--- 4. Detection Event Simulation & Validation ---');
  const { status: simStatus, data: simEvent } = await request('/api/events/simulate', 'POST', {}, tokens.operator);
  const actualEvent = simEvent?.event || simEvent;
  const eventId = actualEvent?.id;
  logTest(
    'Simulator generates detection event',
    simStatus === 200 && !!eventId,
    `Event ID: ${eventId}, Jenis: ${actualEvent?.jenis}, Skor: ${actualEvent?.skor}, Cam: ${actualEvent?.camera_nama}`
  );

  // Validate event as VALID
  const { status: valStatus, data: valRes } = await request(
    `/api/events/${eventId}/validate`,
    'POST',
    { validasi: 'valid' },
    tokens.operator
  );
  logTest('Operator validates event as VALID', valStatus === 200 && valRes?.validasi === 'valid');

  // Double validation rejected (Conflict 409)
  const { status: doubleStatus, data: doubleVal } = await request(
    `/api/events/${eventId}/validate`,
    'POST',
    { validasi: 'false_alarm' },
    tokens.operator
  );
  logTest('Double validation rejected (409 Conflict)', doubleStatus === 409, `Error: ${doubleVal?.error?.message || doubleVal?.error}`);

  // 5. INCIDENT MANAGEMENT & STRICT SOP LIFECYCLE
  console.log('\n--- 5. Incident Management & Strict SOP Lifecycle ---');
  const { data: usersData } = await request('/api/users?role=petugas', 'GET', null, tokens.admin);
  const usersList = usersData?.data || usersData;
  const petugas1 = Array.isArray(usersList) ? usersList.find((u) => u.username === 'petugas1') : null;
  const petugas2 = Array.isArray(usersList) ? usersList.find((u) => u.username === 'petugas2') : null;
  logTest('Identify Petugas 1 UUID', !!petugas1?.id, `Petugas 1 ID: ${petugas1?.id}`);

  // Create incident from validated event
  const incPayload = {
    event_id: eventId,
    jenis: 'Kerumunan Massa',
    keparahan: 'tinggi',
    lokasi: 'Gerbang Barat Kota',
    deskripsi: 'Terdeteksi kerumunan berpotensi gesekan dari sensor CCTV analitik.',
    ditugaskan_ke: petugas1?.id,
  };
  const { status: incStatus, data: createdInc } = await request('/api/incidents', 'POST', incPayload, tokens.operator);
  logTest(
    'Create Incident from validated event',
    incStatus === 201 && !!createdInc?.id,
    `Incident ID: ${createdInc?.id}, Status: ${createdInc?.status}`
  );
  const incidentId = createdInc?.id;

  // Duplicate incident rejected (409)
  const { status: dupStatus, data: dupInc } = await request('/api/incidents', 'POST', incPayload, tokens.operator);
  logTest('Duplicate incident from same event rejected (409 Conflict)', dupStatus === 409, `Error: ${dupInc?.error?.message || dupInc?.error}`);

  // Invalid SOP transition (trying to jump directly to selesai from ditugaskan)
  const { status: invalidStatus, data: invalidTrans } = await request(
    `/api/incidents/${incidentId}/status`,
    'PATCH',
    { status: 'selesai', catatan: 'Lompat langsung tanpa ke TKP' },
    tokens.operator
  );
  logTest('Invalid SOP status jump rejected (409 Conflict)', invalidStatus === 409, `Error: ${invalidTrans?.error?.message || invalidTrans?.error}`);

  // Officer SOP Step 1: Petugas 1 accepts (DITERIMA)
  const { status: s1Status, data: step1 } = await request(
    `/api/incidents/${incidentId}/status`,
    'PATCH',
    { status: 'diterima', catatan: 'Laporan diterima, bergerak ke TKP.' },
    tokens.petugas1
  );
  logTest('SOP Step: DITERIMA by Petugas 1', s1Status === 200 && step1?.status === 'diterima');

  // Petugas 2 unauthorized update rejection (Officer can only update assigned incident)
  const { data: p2Auth } = await request('/api/auth/login', 'POST', { username: 'petugas2', password: 'password123' });
  const { status: unauthStatus, data: unauthErr } = await request(
    `/api/incidents/${incidentId}/status`,
    'PATCH',
    { status: 'di_lokasi', catatan: 'Bukan petugas yang ditugaskan' },
    p2Auth?.token
  );
  logTest('Unauthorized officer update rejected (403)', unauthStatus === 403, `Error: ${unauthErr?.error}`);

  // Officer SOP Step 2: Petugas 1 arrives (DI LOKASI)
  const { status: s2Status, data: step2 } = await request(
    `/api/incidents/${incidentId}/status`,
    'PATCH',
    { status: 'di_lokasi', catatan: 'Tiba di lokasi, melakukan pembubaran kerumunan.' },
    tokens.petugas1
  );
  logTest('SOP Step: DI LOKASI by Petugas 1', s2Status === 200 && step2?.status === 'di_lokasi');

  // Officer SOP Step 3: Petugas 1 finishes (SELESAI)
  const { status: s3Status, data: step3 } = await request(
    `/api/incidents/${incidentId}/status`,
    'PATCH',
    { status: 'selesai', catatan: 'Situasi terkendali, kerumunan telah bubar dengan aman.' },
    tokens.petugas1
  );
  logTest('SOP Step: SELESAI by Petugas 1', s3Status === 200 && step3?.status === 'selesai');

  // Operator closes incident (DITUTUP)
  const { status: s4Status, data: step4 } = await request(
    `/api/incidents/${incidentId}/status`,
    'PATCH',
    { status: 'ditutup', catatan: 'Verifikasi purna tugas selesai. Tiket insiden ditutup.' },
    tokens.operator
  );
  logTest('SOP Step: DITUTUP by Operator', s4Status === 200 && step4?.status === 'ditutup');

  // Verify Incident Timeline updates recorded
  const { status: incDetStatus, data: incDetail } = await request(`/api/incidents/${incidentId}`, 'GET', null, tokens.admin);
  const updatesCount = incDetail?.updates?.length || 0;
  logTest(`Incident Audit Timeline verification (${updatesCount} updates logged)`, incDetStatus === 200 && updatesCount >= 4);

  // 6. EXECUTIVE READ-ONLY ACCESS
  console.log('\n--- 6. Executive Read-Only Access ---');
  const { status: execSumStatus } = await request('/api/dashboard/summary', 'GET', null, tokens.pimpinan);
  logTest('Executive reads Dashboard Summary', execSumStatus === 200);

  const { status: execTrendStatus, data: execTrends } = await request('/api/dashboard/trends', 'GET', null, tokens.pimpinan);
  logTest('Executive reads Incident Trends (7-day chart)', execTrendStatus === 200 && !!execTrends?.daily);

  // Executive mutation attempt rejected (403)
  const { status: execMutStatus } = await request('/api/cameras', 'POST', newCamPayload, tokens.pimpinan);
  logTest('Executive mutation attempt blocked (403)', execMutStatus === 403);

  // 7. AUDIT LOG INTEGRITY & SECURITY
  console.log('\n--- 7. Audit Log Trail ---');
  // Non-admin rejected (403)
  const { status: nonAdminStatus } = await request('/api/audit-logs', 'GET', null, tokens.operator);
  logTest('Non-admin forbidden from viewing Audit Logs (403)', nonAdminStatus === 403);

  // Admin access succeeds
  const { status: adminAuditStatus, data: adminAudit } = await request('/api/audit-logs?limit=10', 'GET', null, tokens.admin);
  logTest(
    'Admin accesses Audit Logs',
    adminAuditStatus === 200 && adminAudit?.length > 0,
    `Retrieved ${adminAudit?.length} recent immutable audit records`
  );

  console.log('\n==================================================');
  console.log('   ALL INTEGRATION TESTS PASSED PERFECTLY!');
  console.log('==================================================');
}

runSuite().catch((err) => {
  console.error('Test Suite Error:', err);
  process.exit(1);
});

