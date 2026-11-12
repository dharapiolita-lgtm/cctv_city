'use client';

import React, { useEffect, useState, useCallback } from 'react';
import AppShell from '@/components/layout/AppShell';
import StatusBadge from '@/components/ui/StatusBadge';
import { api } from '@/lib/api';
import { UserProfile } from '@/types';
import {
  Users,
  Plus,
  Edit2,
  KeyRound,
  ShieldCheck,
  PowerOff,
  Search,
  Filter,
  X,
  UserCheck,
} from 'lucide-react';

export default function UserManagementPage() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [search, setSearch] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  // Modal Create/Edit
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [formNama, setFormNama] = useState<string>('');
  const [formUsername, setFormUsername] = useState<string>('');
  const [formEmail, setFormEmail] = useState<string>('');
  const [formPassword, setFormPassword] = useState<string>('');
  const [formRole, setFormRole] = useState<string>('operator');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Reset Password Modal
  const [resetModalUser, setResetModalUser] = useState<UserProfile | null>(null);
  const [newPassword, setNewPassword] = useState<string>('');
  const [resetting, setResetting] = useState<boolean>(false);

  const fetchUsers = useCallback(async () => {
    try {
      let url = '/users?per_page=100';
      if (roleFilter !== 'all') url += `&role=${roleFilter}`;
      if (search.trim()) url += `&q=${encodeURIComponent(search.trim())}`;
      const res = await api.get<{ data: UserProfile[] }>(url);
      setUsers(res.data || []);
    } catch (err) {
      console.error('Gagal mengambil daftar pengguna:', err);
    } finally {
      setLoading(false);
    }
  }, [roleFilter, search]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const openCreateModal = () => {
    setEditingUser(null);
    setFormNama('');
    setFormUsername('');
    setFormEmail('');
    setFormPassword('password123');
    setFormRole('operator');
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  const openEditModal = (u: UserProfile) => {
    setEditingUser(u);
    setFormNama(u.nama);
    setFormUsername(u.username);
    setFormEmail(u.email || '');
    setFormPassword('');
    setFormRole(u.role);
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg(null);

    try {
      if (editingUser) {
        await api.put(`/users/${editingUser.id}`, {
          nama: formNama.trim(),
          email: formEmail.trim() || null,
          role: formRole,
        });
      } else {
        await api.post('/users', {
          nama: formNama.trim(),
          username: formUsername.trim().toLowerCase(),
          email: formEmail.trim() || null,
          password: formPassword,
          role: formRole,
        });
      }
      setIsModalOpen(false);
      await fetchUsers();
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal menyimpan data pengguna.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (u: UserProfile) => {
    try {
      await api.patch(`/users/${u.id}/active`);
      await fetchUsers();
    } catch (err: any) {
      alert(`Gagal mengubah status aktif: ${err.message}`);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetModalUser || newPassword.length < 6) return;
    setResetting(true);
    try {
      await api.post(`/users/${resetModalUser.id}/reset-password`, {
        new_password: newPassword,
      });
      alert(`Kata sandi untuk @${resetModalUser.username} berhasil diatur ulang.`);
      setResetModalUser(null);
      setNewPassword('');
    } catch (err: any) {
      alert(`Gagal mereset kata sandi: ${err.message}`);
    } finally {
      setResetting(false);
    }
  };

  return (
    <AppShell
      title="Manajemen Pengguna & Otorisasi RBAC"
      subtitle="Pengaturan Hak Akses Akun: Admin, Operator, Petugas Lapangan, dan Pimpinan"
      onRefresh={fetchUsers}
      allowedRoles={['admin']}
    >
      <div className="space-y-6">
        {/* Toolbar */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 flex-wrap w-full md:w-auto">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mr-1 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" /> Peran (Role):
            </span>
            {['all', 'admin', 'operator', 'petugas', 'pimpinan'].map((r) => (
              <button
                key={r}
                onClick={() => setRoleFilter(r)}
                className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition-all ${
                  roleFilter === r
                    ? 'bg-teal-700 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {r === 'all' ? 'Semua Peran' : r.toUpperCase()}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari nama atau username..."
                className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:bg-white"
              />
            </div>

            <button
              onClick={openCreateModal}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold shadow-sm transition-colors shrink-0"
            >
              <Plus className="w-4 h-4" />
              Tambah Pengguna
            </button>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200/80 text-slate-600 uppercase font-bold tracking-wider">
                <tr>
                  <th className="py-3.5 px-5">Nama Lengkap</th>
                  <th className="py-3.5 px-5">Username</th>
                  <th className="py-3.5 px-5">Email Resmi</th>
                  <th className="py-3.5 px-5">Hak Akses (Role)</th>
                  <th className="py-3.5 px-5">Status Akun</th>
                  <th className="py-3.5 px-5">Login Terakhir</th>
                  <th className="py-3.5 px-5 text-right">Aksi Kelola</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-4 px-5 font-bold text-slate-900">{u.nama}</td>
                    <td className="py-4 px-5 text-slate-600 font-mono text-[11px]">@{u.username}</td>
                    <td className="py-4 px-5 text-slate-600">{u.email || '-'}</td>
                    <td className="py-4 px-5">
                      <StatusBadge type="role" value={u.role} />
                    </td>
                    <td className="py-4 px-5">
                      <StatusBadge type="active" value={u.aktif} />
                    </td>
                    <td className="py-4 px-5 text-slate-500 text-[11px]">
                      {u.last_login_at ? new Date(u.last_login_at).toLocaleString('id-ID') : 'Belum pernah'}
                    </td>
                    <td className="py-4 px-5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleToggleActive(u)}
                          className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600"
                          title={u.aktif ? 'Nonaktifkan Akun' : 'Aktifkan Akun'}
                        >
                          <PowerOff className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setResetModalUser(u)}
                          className="p-1.5 rounded-lg border border-amber-200 hover:bg-amber-50 text-amber-700"
                          title="Reset Kata Sandi"
                        >
                          <KeyRound className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => openEditModal(u)}
                          className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600"
                          title="Ubah Profil"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal Create/Edit User */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
                <h3 className="font-extrabold text-base text-slate-900">
                  {editingUser ? 'Ubah Data Pengguna' : 'Tambah Pengguna Baru'}
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {errorMsg && (
                <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs">
                  {errorMsg}
                </div>
              )}

              <form onSubmit={handleSaveUser} className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Nama Lengkap
                  </label>
                  <input
                    type="text"
                    value={formNama}
                    onChange={(e) => setFormNama(e.target.value)}
                    required
                    placeholder="Contoh: Rina Oktaviani"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:bg-white"
                  />
                </div>

                {!editingUser && (
                  <div>
                    <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Username / NIP
                    </label>
                    <input
                      type="text"
                      value={formUsername}
                      onChange={(e) => setFormUsername(e.target.value)}
                      required
                      placeholder="Contoh: rina.operator"
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:bg-white"
                    />
                  </div>
                )}

                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Email Resmi (Opsional)
                  </label>
                  <input
                    type="email"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    placeholder="nama@waterwatch.go.id"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:bg-white"
                  />
                </div>

                {!editingUser && (
                  <div>
                    <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Kata Sandi Awal
                    </label>
                    <input
                      type="password"
                      value={formPassword}
                      onChange={(e) => setFormPassword(e.target.value)}
                      required
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:bg-white"
                    />
                  </div>
                )}

                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Peran Otorisasi (Role)
                  </label>
                  <select
                    value={formRole}
                    onChange={(e) => setFormRole(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-teal-600"
                  >
                    <option value="operator">OPERATOR COMMAND CENTER</option>
                    <option value="admin">ADMINISTRATOR SISTEM</option>
                    <option value="petugas">PETUGAS LAPANGAN (SATPOL PP / URC)</option>
                    <option value="pimpinan">PIMPINAN PEMDA (EKSEKUTIF)</option>
                  </select>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-semibold hover:bg-slate-100"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold disabled:opacity-60"
                  >
                    {submitting ? 'Menyimpan...' : 'Simpan Akun'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal Reset Password */}
        {resetModalUser && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
            <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                <h3 className="font-extrabold text-sm text-slate-900">
                  Reset Password: @{resetModalUser.username}
                </h3>
                <button
                  onClick={() => setResetModalUser(null)}
                  className="p-1 rounded text-slate-400 hover:text-slate-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleResetPassword} className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Kata Sandi Baru (Min. 6 Karakter)
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={6}
                    placeholder="Masukkan kata sandi baru"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:bg-white"
                  />
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setResetModalUser(null)}
                    className="px-3.5 py-1.5 rounded-xl border border-slate-300 text-slate-700 font-semibold"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={resetting || newPassword.length < 6}
                    className="px-4 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold disabled:opacity-50"
                  >
                    {resetting ? 'Menyimpan...' : 'Perbarui Password'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}

