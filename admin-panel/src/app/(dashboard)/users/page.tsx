'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  PlusIcon,
  PencilSquareIcon,
} from '@heroicons/react/24/outline';
import Modal from '@/components/Modal';
import Pagination from '@/components/Pagination';
import StatusBadge from '@/components/StatusBadge';
import { getUsers, createUser, updateUser, toggleUserActive } from '@/lib/api';
import { User, PaginatedResponse, AdminRole, assignableRoles, canManageUsers } from '@/lib/types';
import { formatDate, getInitials, capitalize } from '@/lib/utils';

function getCurrentUserRole(): AdminRole {
  if (typeof window === 'undefined') return 'operational';
  try {
    const userData = localStorage.getItem('admin_user');
    if (userData) {
      const user = JSON.parse(userData);
      return user.role || 'operational';
    }
  } catch { /* ignore */ }
  return 'operational';
}

export default function UsersPage() {
  const [data, setData] = useState<PaginatedResponse<User> | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [roleFilter, setRoleFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [currentRole, setCurrentRole] = useState<AdminRole>('operational');

  // Form state
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formRole, setFormRole] = useState('user');
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    setCurrentRole(getCurrentUserRole());
  }, []);

  const allowedRoles = assignableRoles(currentRole);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getUsers({
        page,
        per_page: 10,
        role: roleFilter || undefined,
      });
      setData(result);
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setLoading(false);
    }
  }, [page, roleFilter]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  function openAddModal() {
    setEditingUser(null);
    setFormName('');
    setFormEmail('');
    setFormPassword('');
    setFormRole(allowedRoles[0] || 'user');
    setFormError('');
    setShowModal(true);
  }

  function openEditModal(user: User) {
    setEditingUser(user);
    setFormName(user.full_name);
    setFormEmail(user.email);
    setFormPassword('');
    setFormRole(user.role);
    setFormError('');
    setShowModal(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError('');
    setFormLoading(true);

    try {
      if (editingUser) {
        await updateUser(editingUser.id, {
          full_name: formName,
          email: formEmail,
          role: formRole,
        });
      } else {
        await createUser({
          full_name: formName,
          email: formEmail,
          password: formPassword,
          role: formRole,
        });
      }
      setShowModal(false);
      loadUsers();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Operation failed');
    } finally {
      setFormLoading(false);
    }
  }

  async function handleToggleActive(userId: string) {
    try {
      await toggleUserActive(userId);
      loadUsers();
    } catch (err) {
      console.error('Failed to toggle user active state:', err);
    }
  }

  /** Whether the current user can edit/deactivate a target user based on role hierarchy. */
  function canModifyUser(targetRole: string): boolean {
    if (currentRole === 'super_admin') return true;
    if (currentRole === 'admin') {
      return targetRole === 'operational' || targetRole === 'agent' || targetRole === 'user';
    }
    return false;
  }

  if (!canManageUsers(currentRole)) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-slate-700">Access Denied</h2>
          <p className="mt-2 text-slate-500">You do not have permission to manage users.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-slate-900">Users</h1>
        <button onClick={openAddModal} className="btn-primary gap-2">
          <PlusIcon className="h-4 w-4" />
          Add User
        </button>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex gap-3">
          <select
            value={roleFilter}
            onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
            className="select-field sm:w-48"
          >
            <option value="">All Roles</option>
            <option value="super_admin">Super Admin</option>
            <option value="admin">Admin</option>
            <option value="operational">Operational</option>
            <option value="agent">Agent</option>
            <option value="user">User</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-admin-border">
            <thead>
              <tr className="bg-slate-50">
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">User</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Email</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Role</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Created</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-admin-border">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    {Array.from({ length: 6 }).map((_, j) => (
                      <td key={j} className="px-6 py-4">
                        <div className="h-4 bg-slate-200 rounded w-3/4" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : data && data.items.length > 0 ? (
                data.items.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-sm font-semibold flex-shrink-0">
                          {user.avatar_url ? (
                            <img src={user.avatar_url} alt={user.full_name} className="h-full w-full rounded-full object-cover" />
                          ) : (
                            getInitials(user.full_name)
                          )}
                        </div>
                        <span className="text-sm font-medium text-slate-900">{user.full_name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">{user.email}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        user.role === 'super_admin'
                          ? 'bg-purple-100 text-purple-700'
                          : user.role === 'admin'
                          ? 'bg-indigo-100 text-indigo-700'
                          : user.role === 'operational'
                          ? 'bg-teal-100 text-teal-700'
                          : 'bg-slate-100 text-slate-700'
                      }`}>
                        {capitalize(user.role)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={String(user.is_active)} variant="active" />
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">{formatDate(user.created_at)}</td>
                    <td className="px-6 py-4">
                      {canModifyUser(user.role) ? (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleToggleActive(user.id)}
                            className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors ${
                              user.is_active
                                ? 'text-red-600 hover:bg-red-50'
                                : 'text-green-600 hover:bg-green-50'
                            }`}
                          >
                            {user.is_active ? 'Deactivate' : 'Activate'}
                          </button>
                          <button
                            onClick={() => openEditModal(user)}
                            className="p-1.5 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <PencilSquareIcon className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">--</span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-sm text-slate-400">
                    No users found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {data && data.total_pages > 1 && (
          <Pagination
            currentPage={data.page}
            totalPages={data.total_pages}
            onPageChange={setPage}
          />
        )}
      </div>

      {/* Add/Edit User Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingUser ? 'Edit User' : 'Add New User'}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
              {formError}
            </div>
          )}

          <div>
            <label className="label-field">Name</label>
            <input
              type="text"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              className="input-field"
              placeholder="Full name"
              required
            />
          </div>

          <div>
            <label className="label-field">Email</label>
            <input
              type="email"
              value={formEmail}
              onChange={(e) => setFormEmail(e.target.value)}
              className="input-field"
              placeholder="user@example.com"
              required
            />
          </div>

          {!editingUser && (
            <div>
              <label className="label-field">Password</label>
              <input
                type="password"
                value={formPassword}
                onChange={(e) => setFormPassword(e.target.value)}
                className="input-field"
                placeholder="Minimum 8 characters"
                required
                minLength={8}
              />
            </div>
          )}

          <div>
            <label className="label-field">Role</label>
            <select
              value={formRole}
              onChange={(e) => setFormRole(e.target.value)}
              className="select-field"
            >
              {allowedRoles.map((role) => (
                <option key={role} value={role}>
                  {capitalize(role)}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button type="submit" disabled={formLoading} className="btn-primary">
              {formLoading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Saving...
                </span>
              ) : editingUser ? (
                'Update User'
              ) : (
                'Create User'
              )}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
