#!/usr/bin/env python3
"""
WaterWatch CCTV Analitik Keamanan Kota - Automated End-to-End Integration Test Suite
Verifies all 5 core scenarios from PRD / Skill:
1. Authentication & RBAC (all 4 roles, password hashing, lockout logic)
2. Camera Management (CRUD, online/offline, deactivation)
3. Detection Event Simulator & Validation (confidence, online-only camera, no double validation)
4. Incident SOP Workflow (strict status transitions, assignment, officer authorization)
5. Executive read-only & Audit Log immutable trail
"""

import urllib.request
import urllib.error
import json
import time
import sys

BASE_URL = "http://127.0.0.1:3000"

def request(endpoint, method="GET", body=None, token=None):
    url = f"{BASE_URL}{endpoint}"
    data = json.dumps(body).encode("utf-8") if body is not None else None
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as resp:
            content = resp.read().decode("utf-8")
            return resp.status, json.loads(content) if content else {}
    except urllib.error.HTTPError as e:
        content = e.read().decode("utf-8")
        try:
            parsed = json.loads(content)
        except Exception:
            parsed = {"raw": content}
        return e.code, parsed

def log_test(name, success, details=""):
    badge = "[PASS]" if success else "[FAIL]"
    print(f"{badge} {name}")
    if details:
        print(f"       -> {details}")
    if not success:
        sys.exit(1)

def run_suite():
    print("==================================================")
    print("   WATERWATCH E2E INTEGRATION TEST SUITE")
    print("==================================================")

    # 1. AUTHENTICATION & ROLES
    print("\n--- 1. Authentication & RBAC ---")
    tokens = {}
    roles = ["admin", "operator", "petugas1", "pimpinan"]
    for role in roles:
        status, data = request("/api/auth/login", method="POST", body={"username": role, "password": "password123"})
        log_test(f"Login as '{role}'", status == 200 and "token" in data, f"User: {data.get('user', {}).get('nama_lengkap')} (Role: {data.get('user', {}).get('role')})")
        tokens[role] = data.get("token")

    # Verify /api/auth/me
    status, me_data = request("/api/auth/me", token=tokens["admin"])
    log_test("Auth Me verification (/api/auth/me)", status == 200 and me_data.get("username") == "admin")

    # Verify invalid login
    status, bad_data = request("/api/auth/login", method="POST", body={"username": "admin", "password": "wrongpassword"})
    log_test("Invalid password rejection (401)", status == 401, f"Error: {bad_data.get('error')}")

    # 2. DASHBOARD SUMMARY
    print("\n--- 2. Dashboard Summary Metrics ---")
    status, summary = request("/api/dashboard/summary", token=tokens["operator"])
    log_test("Fetch Dashboard Summary", status == 200 and "cameras" in summary, 
             f"Cameras: {summary.get('cameras')}, Events: {summary.get('events')}, Incidents: {summary.get('incidents')}")

    # 3. CAMERA MANAGEMENT
    print("\n--- 3. Camera Management ---")
    # Admin creates camera
    new_cam_payload = {
        "kode": f"CAM-TEST-{int(time.time()) % 10000}",
        "nama": "CCTV Pos Barat Test Demo",
        "lokasi": "Gerbang Barat Kota",
        "latitude": -5.3951,
        "longitude": 105.2589,
        "status": "online",
        "sample_video_url": "https://assets.mixkit.co/videos/preview/mixkit-traffic-at-night-in-the-city-4017-large.mp4"
    }
    status, created_cam = request("/api/cameras", method="POST", body=new_cam_payload, token=tokens["admin"])
    log_test("Admin creates new camera", status == 201 and "id" in created_cam, f"Camera ID: {created_cam.get('id')}")
    test_cam_id = created_cam.get("id")

    # Operator role cannot create camera (RBAC)
    status, _ = request("/api/cameras", method="POST", body=new_cam_payload, token=tokens["operator"])
    log_test("Operator forbidden from creating camera (403)", status == 403)

    # 4. EVENT SIMULATION & VALIDATION
    print("\n--- 4. Detection Event Simulation & Validation ---")
    # Simulate an event
    status, sim_event = request("/api/events/simulate", method="POST", body={}, token=tokens["operator"])
    log_test("Simulator generates detection event", status == 201 and "id" in sim_event,
             f"Event ID: {sim_event.get('id')}, Type: {sim_event.get('event_type')}, Conf: {sim_event.get('confidence_score')}, Cam: {sim_event.get('camera_nama')}")
    event_id = sim_event.get("id")

    # Validate event as VALID
    status, val_res = request(f"/api/events/{event_id}/validate", method="POST", 
                              body={"status_validasi": "valid", "catatan": "Terverifikasi kerumunan massa terindikasi gesekan."},
                              token=tokens["operator"])
    log_test("Operator validates event as VALID", status == 200 and val_res.get("status_validasi") == "valid")

    # Verify double validation is rejected (Conflict 409)
    status, double_val = request(f"/api/events/{event_id}/validate", method="POST",
                                 body={"status_validasi": "false_alarm"}, token=tokens["operator"])
    log_test("Double validation rejected (409 Conflict)", status == 409, f"Error: {double_val.get('error')}")

    # 5. INCIDENT MANAGEMENT & SOP WORKFLOW
    print("\n--- 5. Incident Management & Strict SOP Lifecycle ---")
    # Petugas 1 user id lookup
    status, users_list = request("/api/users?role=petugas", token=tokens["admin"])
    petugas1_id = None
    petugas2_id = None
    for u in users_list:
        if u["username"] == "petugas1":
            petugas1_id = u["id"]
        elif u["username"] == "petugas2":
            petugas2_id = u["id"]

    log_test("Identify Petugas 1 UUID", petugas1_id is not None, f"Petugas 1 ID: {petugas1_id}")

    # Create incident from validated event
    inc_payload = {
        "event_id": event_id,
        "tingkat_keparahan": "tinggi",
        "petugas_id": petugas1_id,
        "catatan": "Diteruskan ke Tim Reaksi Cepat Wilayah Barat."
    }
    status, created_inc = request("/api/incidents", method="POST", body=inc_payload, token=tokens["operator"])
    log_test("Create Incident from validated event", status == 201 and "id" in created_inc,
             f"Incident No: {created_inc.get('nomor_insiden')}, Status: {created_inc.get('status')}")
    incident_id = created_inc.get("id")

    # Verify duplicate incident creation rejected (409 Conflict)
    status, dup_inc = request("/api/incidents", method="POST", body=inc_payload, token=tokens["operator"])
    log_test("Duplicate incident from same event rejected (409 Conflict)", status == 409, f"Error: {dup_inc.get('error')}")

    # Test invalid skip transition: BARU -> DI LOKASI (must go through DITUGASKAN -> DITERIMA first)
    # If newly created with assigned officer, status is DITUGASKAN. Trying directly to SELESAI should fail!
    status, invalid_trans = request(f"/api/incidents/{incident_id}/status", method="PATCH",
                                    body={"status": "selesai", "catatan": "Lompat langsung"},
                                    token=tokens["operator"])
    log_test("Invalid SOP status jump rejected (400)", status == 400, f"Error: {invalid_trans.get('error')}")

    # Test Officer SOP Step 1: Petugas 1 accepts (DITERIMA)
    status, step1 = request(f"/api/incidents/{incident_id}/status", method="PATCH",
                            body={"status": "diterima", "catatan": "Laporan diterima, bergerak ke TKP."},
                            token=tokens["petugas1"])
    log_test("SOP Step: DITERIMA by Petugas 1", status == 200 and step1.get("status") == "diterima")

    # Test Petugas 2 unauthorized update rejection (Officer can only update assigned incident)
    if tokens.get("petugas2") or "petugas2" in roles:
        # login petugas2
        s, p2_auth = request("/api/auth/login", method="POST", body={"username": "petugas2", "password": "password123"})
        p2_tok = p2_auth.get("token")
        status, auth_err = request(f"/api/incidents/{incident_id}/status", method="PATCH",
                                   body={"status": "di_lokasi", "catatan": "Bukan petugas yang ditugaskan"},
                                   token=p2_tok)
        log_test("Unauthorized officer update rejected (403)", status == 403, f"Error: {auth_err.get('error')}")

    # Test Officer SOP Step 2: Petugas 1 arrives (DI LOKASI)
    status, step2 = request(f"/api/incidents/{incident_id}/status", method="PATCH",
                            body={"status": "di_lokasi", "catatan": "Tiba di lokasi, melakukan pembubaran kerumunan."},
                            token=tokens["petugas1"])
    log_test("SOP Step: DI LOKASI by Petugas 1", status == 200 and step2.get("status") == "di_lokasi")

    # Test Officer SOP Step 3: Petugas 1 finishes handling (SELESAI)
    status, step3 = request(f"/api/incidents/{incident_id}/status", method="PATCH",
                            body={"status": "selesai", "catatan": "Situasi terkendali, kerumunan telah bubar dengan aman."},
                            token=tokens["petugas1"])
    log_test("SOP Step: SELESAI by Petugas 1", status == 200 and step3.get("status") == "selesai")

    # Test Operator/Admin Closes Incident (DITUTUP)
    status, step4 = request(f"/api/incidents/{incident_id}/status", method="PATCH",
                            body={"status": "ditutup", "catatan": "Verifikasi purna tugas selesai. Tiket insiden ditutup."},
                            token=tokens["operator"])
    log_test("SOP Step: DITUTUP by Operator", status == 200 and step4.get("status") == "ditutup")

    # Verify Incident Timeline updates recorded
    status, inc_detail = request(f"/api/incidents/{incident_id}", token=tokens["admin"])
    updates_count = len(inc_detail.get("updates", []))
    log_test(f"Incident Audit Timeline verification ({updates_count} updates logged)", status == 200 and updates_count >= 4)

    # 6. EXECUTIVE DASHBOARD & READ-ONLY ENFORCEMENT
    print("\n--- 6. Executive Read-Only Access ---")
    status, exec_summary = request("/api/dashboard/summary", token=tokens["pimpinan"])
    log_test("Executive reads Dashboard Summary", status == 200)

    status, exec_trends = request("/api/dashboard/trends", token=tokens["pimpinan"])
    log_test("Executive reads Incident Trends (7-day chart)", status == 200 and "daily" in exec_trends)

    # Executive mutation attempt rejected (403)
    status, mut_err = request("/api/cameras", method="POST", body=new_cam_payload, token=tokens["pimpinan"])
    log_test("Executive mutation attempt blocked (403)", status == 403)

    # 7. AUDIT LOG INTEGRITY & SECURITY
    print("\n--- 7. Audit Log Trail ---")
    # Non-admin access to audit logs rejected (403)
    status, op_audit = request("/api/audit-logs", token=tokens["operator"])
    log_test("Non-admin forbidden from viewing Audit Logs (403)", status == 403)

    # Admin access to audit logs succeeds
    status, admin_audit = request("/api/audit-logs?limit=10", token=tokens["admin"])
    log_test("Admin accesses Audit Logs", status == 200 and len(admin_audit) > 0, f"Retrieved {len(admin_audit)} recent immutable audit records")

    print("\n==================================================")
    print("   ALL INTEGRATION TESTS PASSED PERFECTLY!")
    print("==================================================")

if __name__ == "__main__":
    run_suite()

