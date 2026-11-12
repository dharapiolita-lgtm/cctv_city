'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import AppShell from '@/components/layout/AppShell';
import StatusBadge from '@/components/ui/StatusBadge';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';
import { Incident, IncidentUpdate, UserProfile } from '@/types';
import {
  ClipboardList,
  MapPin,
  Calendar,
  Clock,
  UserCheck,
  ArrowLeft,
  CheckCircle,
  AlertTriangle,
  Send,
  Lock,
  MessageSquare,
} from 'lucide-react';

export default function IncidentDetailPage({ params }: { params: { id: string } }) {
  const { user } = useAuth();
  const [incident, setIncident] = useState<Incident | null>(null);
  const [updates, setUpdates] = useState<IncidentUpdate[]>([]);
  const [officers, setOfficers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Transition form
  const [nextStatus, setNextStatus] = useState<string>('');
  const [catatan, setCatatan] = useState<string>('');
  const [reassignPetugasId, setReassignPetugasId] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchIncidentDetails = useCallback(async () => {
    try {
      const [incRes, offRes] = await Promise.all([
        api.get<{ incident: Incident; updates: IncidentUpdate[] }>(`/incidents/${params.id}`),
        api.get<{ data: UserProfile[] }>('/users?role=petugas&aktif=true'),
      ]);

      setIncident(incRes.incident);
      setUpdates(incRes.updates || []);
      setOfficers(offRes.data || []);

      // Default next status in workflow
      const workflowMap: Record<string, string> = {
        baru: 'ditugaskan',
        ditugaskan: 'diterima',
        diterima: 'di_lokasi',
        di_lokasi: 'selesai',
        selesai: 'ditutup',
      };
      setNextStatus(workflowMap[incRes.incident.status] || '');
    } catch (err: any) {
      console.error('Gagal memuat detail insiden:', err);
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    fetchIncidentDetails();
  }, [fetchIncidentDetails]);

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catatan.trim()) {
      setErrorMsg('Catatan pembaruan status wajib diisi.');
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);

    try {
      await api.patch(`/incidents/${params.id}/status`, {
        status: nextStatus,
        catatan: catatan.trim(),
      });
      setCatatan('');
      await fetchIncidentDetails();
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal memperbarui status insiden.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReassign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reassignPetugasId) return;

    setSubmitting(true);
    setErrorMsg(null);

    try {
      await api.patch(`/incidents/${params.id}/assign`, {
        ditugaskan_ke: reassignPetugasId,
        catatan: 'Penugasan ulang oleh Operator Command Center.',
      });
      await fetchIncidentDetails();
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal menugaskan ulang.');
    } finally {
      setSubmitting(false);
    }
  };

  const workflowSteps = ['baru', 'ditugaskan', 'diterima', 'di_lokasi', 'selesai', 'ditutup'];

  if (loading || !incident) {
    return (
      <AppShell title="Detail & Timeline Insiden" allowedRoles={['admin', 'operator', 'petugas', 'pimpinan']}>
        <div className="py-20 text-center">
          <div className="w-10 h-10 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-slate-500 font-semibold">Memuat timeline penanganan...</p>
        </div>
      </AppShell>
    );
  }

  const currentStepIndex = workflowSteps.indexOf(incident.status);

  return (
    <AppShell
      title={`Insiden: ${incident.jenis}`}
      subtitle={`ID Tiket: ${incident.id}`}
      onRefresh={fetchIncidentDetails}
      allowedRoles={['admin', 'operator', 'petugas', 'pimpinan']}
    >
      <div className="space-y-6">
        {/* Back Link */}
        <Link
          href={user?.role === 'petugas' ? '/officer/dashboard' : '/incidents'}
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-teal-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Kembali
        </Link>

        {/* Workflow Progression Stepper */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-sm">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">
            Alur Penanganan Standar Operasional Prosedur (SOP)
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            {workflowSteps.map((step, idx) => {
              const isPassed = idx < currentStepIndex;
              const isCurrent = idx === currentStepIndex;
              return (
                <div
                  key={step}
                  className={`p-3 rounded-xl border text-center transition-all ${
                    isCurrent
                      ? 'bg-teal-700 text-white border-teal-800 shadow-md ring-2 ring-teal-400'
                      : isPassed
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                      : 'bg-slate-50 text-slate-400 border-slate-200'
                  }`}
                >
                  <span className="text-[10px] font-bold block opacity-75">TAHAP {idx + 1}</span>
                  <span className="text-xs font-extrabold capitalize">{step.replace('_', ' ')}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Panel: Incident Details & Timeline (8 Cols) */}
          <div className="lg:col-span-8 space-y-6">
            {/* Meta Card */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <ClipboardList className="w-5 h-5 text-teal-700" />
                  <h3 className="font-extrabold text-base text-[#0B1C30]">{incident.jenis}</h3>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge type="severity" value={incident.keparahan} />
                  <StatusBadge type="incident" value={incident.status} />
                </div>
              </div>

              <div className="text-xs space-y-2">
                <p className="text-slate-600 leading-relaxed font-medium bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                  {incident.deskripsi}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div className="flex items-center gap-2 text-slate-600">
                    <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                    <span className="font-semibold">{incident.lokasi}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-600">
                    <UserCheck className="w-4 h-4 text-teal-600 shrink-0" />
                    <span>
                      Petugas: <strong className="text-slate-900">{incident.petugas_nama || 'Belum ditugaskan'}</strong>
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-500 text-[11px]">
                    <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>Dibuat: {new Date(incident.dibuat_pada).toLocaleString('id-ID')}</span>
                  </div>
                  {incident.selesai_pada && (
                    <div className="flex items-center gap-2 text-emerald-700 text-[11px] font-semibold">
                      <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Selesai: {new Date(incident.selesai_pada).toLocaleString('id-ID')}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Timeline of Updates */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-sm">
              <h3 className="font-extrabold text-base text-[#0B1C30] pb-4 border-b border-slate-100 mb-6 flex items-center gap-2">
                <Clock className="w-5 h-5 text-teal-700" />
                Riwayat Tindak Lanjut & Timeline Penanganan
              </h3>

              <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                {updates.map((upd) => (
                  <div key={upd.id} className="relative group">
                    <div className="absolute -left-[27px] top-1 w-4 h-4 rounded-full bg-teal-600 border-2 border-white shadow-sm" />
                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/80 hover:bg-slate-100/60 transition-colors">
                      <div className="flex items-center justify-between mb-1.5 flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-slate-900">{upd.oleh_nama}</span>
                          <StatusBadge type="role" value={upd.oleh_role} />
                        </div>
                        <span className="text-[11px] font-medium text-slate-400">
                          {new Date(upd.waktu).toLocaleString('id-ID')}
                        </span>
                      </div>

                      <div className="mb-2 flex items-center gap-1.5 text-[11px] font-bold">
                        <span className="text-slate-500 uppercase">{upd.status_lama || 'Mulai'}</span>
                        <span className="text-slate-400">→</span>
                        <span className="text-teal-700 uppercase">{upd.status_baru}</span>
                      </div>

                      <p className="text-xs text-slate-700 leading-relaxed font-medium">
                        {upd.catatan}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Panel: Action Controls (4 Cols) */}
          <div className="lg:col-span-4 space-y-6">
            {incident.status === 'ditutup' ? (
              <div className="bg-white rounded-2xl border border-slate-200/90 p-6 text-center shadow-sm">
                <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center mx-auto mb-3">
                  <Lock className="w-6 h-6" />
                </div>
                <h4 className="font-extrabold text-sm text-slate-900 mb-1">Tiket Insiden Ditutup</h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Penanganan insiden telah selesai dan divalidasi oleh Command Center. Data diarsipkan secara permanen.
                </p>
              </div>
            ) : (
              <>
                {/* Form Update Status */}
                <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-sm">
                  <h4 className="font-extrabold text-sm text-[#0B1C30] pb-3 border-b border-slate-100 mb-4 flex items-center gap-2">
                    <Send className="w-4 h-4 text-teal-700" />
                    Pembaruan Status Penanganan
                  </h4>

                  {errorMsg && (
                    <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">
                      {errorMsg}
                    </div>
                  )}

                  <form onSubmit={handleUpdateStatus} className="space-y-4 text-xs">
                    <div>
                      <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Transisi Status Berikutnya
                      </label>
                      <input
                        type="text"
                        readOnly
                        value={nextStatus ? nextStatus.toUpperCase().replace('_', ' ') : 'Tidak ada transisi'}
                        className="w-full px-3 py-2 text-xs bg-slate-100 border border-slate-200 rounded-xl text-teal-800 font-extrabold"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Catatan Tindak Lanjut / Kondisi Lapangan
                      </label>
                      <textarea
                        value={catatan}
                        onChange={(e) => setCatatan(e.target.value)}
                        required
                        rows={3}
                        placeholder="Tuliskan laporan tindakan..."
                        className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:bg-white"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={submitting || !nextStatus}
                      className="w-full py-2.5 px-4 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-colors disabled:opacity-50"
                    >
                      <Send className="w-4 h-4" />
                      {submitting ? 'Memproses...' : 'Kirim Pembaruan Status'}
                    </button>
                  </form>
                </div>

                {/* Re-assign Officer Form (Operator/Admin only) */}
                {user && ['admin', 'operator'].includes(user.role) && (
                  <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-sm">
                    <h4 className="font-extrabold text-sm text-[#0B1C30] pb-3 border-b border-slate-100 mb-4 flex items-center gap-2">
                      <UserCheck className="w-4 h-4 text-teal-700" />
                      Tugaskan Ulang Petugas
                    </h4>

                    <form onSubmit={handleReassign} className="space-y-3 text-xs">
                      <select
                        value={reassignPetugasId}
                        onChange={(e) => setReassignPetugasId(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-teal-600"
                      >
                        <option value="">Pilih Petugas Lapangan Baru...</option>
                        {officers.map((off) => (
                          <option key={off.id} value={off.id}>
                            {off.nama}
                          </option>
                        ))}
                      </select>

                      <button
                        type="submit"
                        disabled={submitting || !reassignPetugasId}
                        className="w-full py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition-colors disabled:opacity-50"
                      >
                        Tugaskan Ulang
                      </button>
                    </form>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}

