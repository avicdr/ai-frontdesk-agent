'use client';

// src/app/admin/users/page.tsx
// Platform Super-Admin Users Management Console — View, edit, assign clinics, reset passwords, ban, and delete accounts
// Redesigned with Cinematic Obsidian × Phoenix Ember Design System

import React, { useState, useEffect, useMemo } from 'react';

interface ClinicMembership {
  membershipId: string;
  organizationId: string;
  organizationName: string;
  organizationSlug: string;
  organizationStatus: string;
  businessType: string;
  role: 'owner' | 'admin' | 'staff' | 'viewer';
  acceptedAt: string | null;
  createdAt: string;
}

interface AdminUser {
  id: string;
  email: string;
  fullName: string;
  phone: string;
  avatarUrl: string | null;
  isSuperAdmin: boolean;
  isBanned: boolean;
  bannedUntil: string | null;
  emailConfirmed: boolean;
  emailConfirmedAt: string | null;
  createdAt: string;
  lastSignInAt: string | null;
  displayRole: string;
  memberships: ClinicMembership[];
}

interface OrganizationOption {
  id: string;
  name: string;
  slug: string;
  status: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [organizations, setOrganizations] = useState<OrganizationOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'super_admin' | 'owner' | 'staff' | 'no_clinic' | 'banned'>('all');

  // Modals state
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [deletingUser, setDeletingUser] = useState<AdminUser | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Edit form state
  const [editFullName, setEditFullName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editIsSuperAdmin, setEditIsSuperAdmin] = useState(false);
  const [editEmailConfirm, setEditEmailConfirm] = useState(true);
  const [editIsBanned, setEditIsBanned] = useState(false);
  const [editOrgId, setEditOrgId] = useState<string>('');
  const [editOrgRole, setEditOrgRole] = useState<'owner' | 'admin' | 'staff' | 'viewer'>('staff');

  // Add form state
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newFullName, setNewFullName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newIsSuperAdmin, setNewIsSuperAdmin] = useState(false);
  const [newOrgId, setNewOrgId] = useState<string>('');
  const [newOrgRole, setNewOrgRole] = useState<'owner' | 'admin' | 'staff' | 'viewer'>('owner');

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/v1/admin/users');
      const json = await res.json();
      if (json.success && json.data) {
        setUsers(json.data.users || []);
        setOrganizations(json.data.organizations || []);
      } else {
        setToastMessage({ type: 'error', text: json.error?.message || 'Failed to fetch users' });
      }
    } catch (err: any) {
      console.error('Fetch users error:', err);
      setToastMessage({ type: 'error', text: err?.message || 'Network error fetching users' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Filtered users calculation
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      // 1. Role filter
      if (roleFilter === 'super_admin' && !user.isSuperAdmin) return false;
      if (roleFilter === 'banned' && !user.isBanned) return false;
      if (roleFilter === 'no_clinic' && user.memberships.length > 0) return false;
      if (roleFilter === 'owner' && !user.memberships.some(m => m.role === 'owner')) return false;
      if (roleFilter === 'staff' && !user.memberships.some(m => m.role === 'staff' || m.role === 'admin')) return false;

      // 2. Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = (user.fullName || '').toLowerCase().includes(q);
        const matchesEmail = user.email.toLowerCase().includes(q);
        const matchesPhone = (user.phone || '').toLowerCase().includes(q);
        const matchesClinic = user.memberships.some(m =>
          m.organizationName.toLowerCase().includes(q) || m.organizationSlug.toLowerCase().includes(q)
        );
        return matchesName || matchesEmail || matchesPhone || matchesClinic;
      }

      return true;
    });
  }, [users, roleFilter, searchQuery]);

  // Statistics
  const stats = useMemo(() => {
    return {
      total: users.length,
      superAdmins: users.filter(u => u.isSuperAdmin).length,
      owners: users.filter(u => u.memberships.some(m => m.role === 'owner')).length,
      staff: users.filter(u => u.memberships.some(m => m.role === 'staff' || m.role === 'admin')).length,
      unassigned: users.filter(u => u.memberships.length === 0).length,
      banned: users.filter(u => u.isBanned).length,
    };
  }, [users]);

  // Handle open edit modal
  const handleOpenEdit = (user: AdminUser) => {
    setEditingUser(user);
    setEditFullName(user.fullName || '');
    setEditPhone(user.phone || '');
    setEditPassword('');
    setEditIsSuperAdmin(user.isSuperAdmin);
    setEditEmailConfirm(user.emailConfirmed);
    setEditIsBanned(user.isBanned);

    if (user.memberships.length > 0) {
      setEditOrgId(user.memberships[0].organizationId);
      setEditOrgRole(user.memberships[0].role);
    } else {
      setEditOrgId('');
      setEditOrgRole('staff');
    }
  };

  // Submit edit user
  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setIsSubmitting(true);
    setToastMessage(null);

    try {
      const payload: any = {
        userId: editingUser.id,
        fullName: editFullName.trim(),
        phone: editPhone.trim(),
        isSuperAdmin: editIsSuperAdmin,
        emailConfirmed: editEmailConfirm,
        isBanned: editIsBanned,
        organizationId: editOrgId || null,
        organizationRole: editOrgId ? editOrgRole : null,
      };

      if (editPassword.trim()) {
        payload.password = editPassword.trim();
      }

      const res = await fetch('/api/v1/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || 'Failed to update user profile');
      }

      setToastMessage({ type: 'success', text: `User ${editingUser.email} updated successfully!` });
      setEditingUser(null);
      fetchUsers();
    } catch (err: any) {
      console.error('Update user error:', err);
      setToastMessage({ type: 'error', text: err?.message || 'Error updating user' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit create user
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim() || !newPassword.trim()) return;
    setIsSubmitting(true);
    setToastMessage(null);

    try {
      const payload = {
        email: newEmail.trim().toLowerCase(),
        password: newPassword.trim(),
        fullName: newFullName.trim(),
        phone: newPhone.trim(),
        isSuperAdmin: newIsSuperAdmin,
        organizationId: newOrgId || null,
        organizationRole: newOrgId ? newOrgRole : null,
      };

      const res = await fetch('/api/v1/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || 'Failed to create user account');
      }

      setToastMessage({ type: 'success', text: `User ${newEmail} created successfully!` });
      setShowAddModal(false);
      setNewEmail('');
      setNewPassword('');
      setNewFullName('');
      setNewPhone('');
      setNewIsSuperAdmin(false);
      setNewOrgId('');
      fetchUsers();
    } catch (err: any) {
      console.error('Create user error:', err);
      setToastMessage({ type: 'error', text: err?.message || 'Error creating user' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete user
  const handleDeleteUser = async () => {
    if (!deletingUser) return;
    setIsSubmitting(true);
    setToastMessage(null);

    try {
      const res = await fetch(`/api/v1/admin/users?userId=${deletingUser.id}`, {
        method: 'DELETE',
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || 'Failed to delete user');
      }

      setToastMessage({ type: 'success', text: `User ${deletingUser.email} deleted permanently.` });
      setDeletingUser(null);
      fetchUsers();
    } catch (err: any) {
      console.error('Delete user error:', err);
      setToastMessage({ type: 'error', text: err?.message || 'Error deleting user' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[var(--color-border-subtle)] pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-2 h-2 rounded-full bg-[#E84B2C] shadow-[0_0_8px_#E84B2C]" />
            <span className="text-[11px] font-mono tracking-widest text-[#E87A38] uppercase font-semibold">
              Identity &amp; Access Governance
            </span>
          </div>
          <h1 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-[var(--color-text-primary)] flex items-center gap-2">
            <span>Users &amp; Staff Console</span>
          </h1>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">
            Global directory of clinic owners, reception staff, and platform super-administrators.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            className="btn btn-secondary text-xs font-mono"
            onClick={fetchUsers}
            disabled={loading}
          >
            {loading ? 'Refreshing...' : '🔄 Refresh'}
          </button>
          <button
            type="button"
            className="btn btn-primary text-xs font-medium"
            onClick={() => setShowAddModal(true)}
          >
            + Create New User
          </button>
        </div>
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div className={`p-4 rounded-xl text-xs flex items-center justify-between border ${
          toastMessage.type === 'success'
            ? 'bg-[#63C7A2]/10 border-[#63C7A2]/30 text-[#63C7A2]'
            : 'bg-[#E84B2C]/10 border-[#E84B2C]/30 text-[#E84B2C]'
        }`}>
          <div className="flex items-center gap-2 font-medium">
            <span>{toastMessage.type === 'success' ? '✓' : '⚠️'}</span>
            <span>{toastMessage.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="text-inherit hover:opacity-75 transition-opacity"
          >
            ✕
          </button>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <div className="card p-4">
          <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--color-text-muted)]">Total Accounts</div>
          <div className="font-mono text-2xl font-bold text-[var(--color-text-primary)] mt-1">{stats.total}</div>
        </div>

        <div className="card p-4 border-[#D4AF37]/35 bg-[var(--color-surface-elevated)] shadow-[0_0_14px_rgba(212,175,55,0.08)]">
          <div className="text-[10px] font-mono uppercase tracking-wider text-[#D4AF37] font-semibold flex items-center justify-between">
            <span>Super Admins</span>
            <span>👑</span>
          </div>
          <div className="font-mono text-2xl font-bold text-[#D4AF37] mt-1">{stats.superAdmins}</div>
        </div>

        <div className="card p-4">
          <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--color-text-muted)]">Clinic Owners</div>
          <div className="font-mono text-2xl font-bold text-[#E87A38] mt-1">{stats.owners}</div>
        </div>

        <div className="card p-4">
          <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--color-text-muted)]">Clinic Staff</div>
          <div className="font-mono text-2xl font-bold text-[#63C7A2] mt-1">{stats.staff}</div>
        </div>

        <div className={`card p-4 transition-all ${
          stats.unassigned > 0 ? 'border-[#E84B2C]/40 bg-[#E84B2C]/05' : ''
        }`}>
          <div className="text-[10px] font-mono uppercase tracking-wider text-[var(--color-text-muted)]">Pending Onboarding</div>
          <div className={`font-mono text-2xl font-bold mt-1 ${
            stats.unassigned > 0 ? 'text-[#E84B2C]' : 'text-[var(--color-text-muted)]'
          }`}>
            {stats.unassigned}
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="card p-4 flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs text-[var(--color-text-muted)]">
            🔍
          </span>
          <input
            type="text"
            className="input text-xs w-full"
            style={{ paddingLeft: '2.25rem' }}
            placeholder="Search by name, email, phone, or clinic slug..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
            >
              ✕
            </button>
          )}
        </div>

        {/* Role Pills (Fixed styling) */}
        <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap', alignItems: 'center' }}>
          {[
            { id: 'all', name: 'All', count: users.length },
            { id: 'super_admin', name: 'Super Admin', count: stats.superAdmins },
            { id: 'owner', name: 'Owners', count: stats.owners },
            { id: 'staff', name: 'Staff', count: stats.staff },
            { id: 'no_clinic', name: 'No Clinic', count: stats.unassigned },
            { id: 'banned', name: 'Banned', count: stats.banned },
          ].map(tab => {
            const isActive = roleFilter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setRoleFilter(tab.id as any)}
                style={{
                  padding: '0.35rem 0.75rem',
                  borderRadius: '9999px',
                  fontSize: '0.75rem',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  background: isActive
                    ? 'linear-gradient(135deg, #E84B2C, #C86938)'
                    : 'var(--color-surface-secondary, #1C1916)',
                  color: isActive ? '#FFFFFF' : 'var(--color-text-muted, #9E9B93)',
                  border: isActive
                    ? '1px solid rgba(232, 75, 44, 0.5)'
                    : '1px solid var(--color-border-standard)',
                  boxShadow: isActive ? '0 0 12px rgba(232, 75, 44, 0.35)' : 'none',
                }}
              >
                <span>{tab.name}</span>
                <span
                  style={{
                    fontSize: '0.65rem',
                    padding: '0.05rem 0.4rem',
                    borderRadius: '9999px',
                    background: isActive ? 'rgba(255, 255, 255, 0.25)' : 'var(--color-surface-raised, #211B17)',
                    color: isActive ? '#FFFFFF' : 'var(--color-text-secondary)',
                  }}
                >
                  ({tab.count})
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Users Table */}
      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Identity &amp; Account</th>
                <th>Role Tier</th>
                <th>Assigned Clinic</th>
                <th>Phone</th>
                <th>Status</th>
                <th>Registration</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-[var(--color-text-muted)]">
                    <div className="text-2xl mb-1">⏳</div>
                    <div className="text-xs font-mono">Querying multi-tenant directory...</div>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-[var(--color-text-muted)]">
                    <div className="text-2xl mb-1">👥</div>
                    <div className="text-sm font-medium text-[var(--color-text-primary)]">No user accounts found</div>
                    <div className="text-xs mt-1 text-[var(--color-text-muted)]">
                      {searchQuery ? 'Adjust your search terms to match active accounts.' : 'No users match this role filter.'}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredUsers.map(user => {
                  const primaryOrg = user.memberships[0];

                  return (
                    <tr key={user.id} className="hover:bg-[var(--color-surface-hover,#26201B)] transition-colors">
                      {/* Identity - Fixed Avatar Layout */}
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div
                            style={{
                              width: '38px',
                              height: '38px',
                              minWidth: '38px',
                              borderRadius: '10px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 700,
                              fontSize: '0.875rem',
                              flexShrink: 0,
                              background: user.isSuperAdmin
                                ? 'linear-gradient(135deg, #E84B2C, #C86938)'
                                : 'var(--color-surface-raised, #211B17)',
                              color: user.isSuperAdmin ? '#FFFFFF' : 'var(--color-text-primary, #F3F0E8)',
                              border: user.isSuperAdmin ? '1px solid #D4AF37' : '1px solid var(--color-border-standard)',
                              boxShadow: user.isSuperAdmin ? '0 0 12px rgba(232, 75, 44, 0.3)' : 'none',
                            }}
                          >
                            {user.fullName ? user.fullName.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
                          </div>
                          <div style={{ minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                              <span className="truncate">{user.fullName || 'Anonymous User'}</span>
                              {user.isSuperAdmin && (
                                <span title="Super Admin Privilege" style={{ fontSize: '0.8rem' }}>👑</span>
                              )}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--color-text-muted)' }}>
                              <span className="truncate">{user.email}</span>
                              {user.emailConfirmed ? (
                                <span title="Verified Email" style={{ color: '#63C7A2' }}>✓</span>
                              ) : (
                                <span title="Unverified" style={{ color: '#E87A38', fontSize: '0.65rem' }}>• unverified</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Role */}
                      <td>
                        {user.isSuperAdmin ? (
                          <span className="badge bg-[#D4AF37]/15 border border-[#D4AF37]/40 text-[#D4AF37] font-mono text-[10px]">
                            SUPER ADMIN
                          </span>
                        ) : primaryOrg ? (
                          <span className={`badge font-mono text-[10px] ${
                            primaryOrg.role === 'owner'
                              ? 'badge-primary'
                              : primaryOrg.role === 'admin'
                              ? 'badge-warning'
                              : 'badge-neutral'
                          }`}>
                            {primaryOrg.role.toUpperCase()}
                          </span>
                        ) : (
                          <span className="badge badge-warning text-[10px]">
                            NO CLINIC
                          </span>
                        )}
                      </td>

                      {/* Clinic */}
                      <td>
                        {primaryOrg ? (
                          <div>
                            <div className="font-medium text-xs text-[var(--color-text-primary)]">{primaryOrg.organizationName}</div>
                            <div className="text-[10px] font-mono text-[var(--color-text-muted)]">
                              slug: {primaryOrg.organizationSlug}
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs font-mono text-[var(--color-text-muted)] italic">
                            Pending Onboarding
                          </span>
                        )}
                      </td>

                      {/* Phone */}
                      <td className="font-mono text-xs text-[var(--color-text-secondary)]">
                        {user.phone ? user.phone : <span className="text-[var(--color-text-muted)]">—</span>}
                      </td>

                      {/* Status */}
                      <td>
                        {user.isBanned ? (
                          <span className="badge badge-danger">Banned</span>
                        ) : (
                          <span className="badge badge-success">Active</span>
                        )}
                      </td>

                      {/* Joined Date */}
                      <td>
                        <div className="font-mono text-xs text-[var(--color-text-secondary)]">
                          {new Date(user.createdAt).toLocaleDateString('en-IN')}
                        </div>
                        <div className="text-[10px] font-mono text-[var(--color-text-muted)]">
                          {user.lastSignInAt
                            ? `Active ${new Date(user.lastSignInAt).toLocaleDateString('en-IN')}`
                            : 'Never signed in'}
                        </div>
                      </td>

                      {/* Actions */}
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            style={{ fontSize: '0.75rem', padding: '0.35rem 0.65rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                            onClick={() => handleOpenEdit(user)}
                          >
                            <span>✏️</span>
                            <span>Manage</span>
                          </button>
                          <button
                            type="button"
                            className="text-[#E84B2C] hover:text-[#E87A38] transition-colors p-1.5 rounded hover:bg-[#E84B2C]/10"
                            title="Delete user"
                            onClick={() => setDeletingUser(user)}
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ============================================================ */}
      {/* MANAGE / EDIT USER MODAL */}
      {/* ============================================================ */}
      {editingUser && (
        <div className="fixed inset-0 bg-[#080505]/85 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-in" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="card max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 bg-[#171614] border border-[#F3F0E8]/12 shadow-[0_20px_50px_rgba(0,0,0,0.8)] animate-scale-in" style={{ maxWidth: '520px', width: '100%' }}>
            <div className="flex justify-between items-center mb-5 pb-3 border-b border-[#F3F0E8]/08">
              <div>
                <h2 className="font-heading text-lg font-semibold text-[#F3F0E8]">Manage Account</h2>
                <div className="font-mono text-xs text-[#9E9B93] mt-0.5">{editingUser.email}</div>
              </div>
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="text-[#9E9B93] hover:text-[#F3F0E8] text-lg p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label text-xs">Full Name</label>
                  <input
                    type="text"
                    className="input text-xs"
                    value={editFullName}
                    onChange={e => setEditFullName(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="label text-xs">Phone Number</label>
                  <input
                    type="text"
                    className="input text-xs font-mono"
                    value={editPhone}
                    onChange={e => setEditPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                  />
                </div>
              </div>

              <div>
                <label className="label text-xs">Reset Password (leave empty to retain)</label>
                <input
                  type="password"
                  className="input text-xs"
                  value={editPassword}
                  onChange={e => setEditPassword(e.target.value)}
                  placeholder="Enter new credential (min 6 chars)"
                  minLength={6}
                />
              </div>

              {/* Clinic Assignment */}
              <div className="p-4 rounded-xl bg-[#111110] border border-[#F3F0E8]/08 space-y-3">
                <div className="font-heading text-xs font-semibold text-[#F3F0E8] flex items-center gap-1.5">
                  <span className="text-[#E87A38]">🏥</span> Clinic Tenant Assignment
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label text-[11px]">Clinic</label>
                    <select
                      className="input text-xs"
                      value={editOrgId}
                      onChange={e => setEditOrgId(e.target.value)}
                    >
                      <option value="">-- No Clinic / Detach --</option>
                      {organizations.map(org => (
                        <option key={org.id} value={org.id}>
                          {org.name} ({org.slug})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="label text-[11px]">Role</label>
                    <select
                      className="input text-xs"
                      value={editOrgRole}
                      onChange={e => setEditOrgRole(e.target.value as any)}
                      disabled={!editOrgId}
                    >
                      <option value="owner">Owner</option>
                      <option value="admin">Admin</option>
                      <option value="staff">Staff</option>
                      <option value="viewer">Viewer</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Security & Permissions */}
              <div className="p-4 rounded-xl bg-[#111110] border border-[#F3F0E8]/08 space-y-3">
                <div className="font-heading text-xs font-semibold text-[#F3F0E8] flex items-center gap-1.5">
                  <span className="text-[#E84B2C]">🛡️</span> Security &amp; Platform Privileges
                </div>

                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editIsSuperAdmin}
                    onChange={e => setEditIsSuperAdmin(e.target.checked)}
                    className="mt-0.5"
                  />
                  <div>
                    <div className="text-xs font-semibold text-[#D4AF37]">👑 Platform Super Admin</div>
                    <div className="text-[11px] text-[#9E9B93]">
                      Grants root multi-tenant management, ledger inspection, and system reconfiguration.
                    </div>
                  </div>
                </label>

                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editEmailConfirm}
                    onChange={e => setEditEmailConfirm(e.target.checked)}
                    className="mt-0.5"
                  />
                  <div>
                    <div className="text-xs font-semibold text-[#F3F0E8]">Email Verified</div>
                    <div className="text-[11px] text-[#9E9B93]">
                      Mark user email as verified immediately.
                    </div>
                  </div>
                </label>

                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editIsBanned}
                    onChange={e => setEditIsBanned(e.target.checked)}
                    className="mt-0.5"
                  />
                  <div>
                    <div className={`text-xs font-semibold ${editIsBanned ? 'text-[#E84B2C]' : 'text-[#F3F0E8]'}`}>
                      🚫 Suspend Account Access
                    </div>
                    <div className="text-[11px] text-[#9E9B93]">
                      Revokes active sessions and blocks sign-in.
                    </div>
                  </div>
                </label>
              </div>

              <div className="flex justify-between items-center pt-2">
                <button
                  type="button"
                  className="text-xs font-mono text-[#E84B2C] hover:underline"
                  onClick={() => {
                    const u = editingUser;
                    setEditingUser(null);
                    setDeletingUser(u);
                  }}
                >
                  Delete Account...
                </button>

                <div className="flex gap-2">
                  <button
                    type="button"
                    className="btn btn-secondary text-xs"
                    onClick={() => setEditingUser(null)}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary text-xs"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* CREATE NEW USER MODAL */}
      {/* ============================================================ */}
      {showAddModal && (
        <div className="fixed inset-0 bg-[#080505]/85 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-in" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="card max-w-md w-full max-h-[90vh] overflow-y-auto p-6 bg-[#171614] border border-[#F3F0E8]/12 shadow-[0_20px_50px_rgba(0,0,0,0.8)] animate-scale-in" style={{ maxWidth: '480px', width: '100%' }}>
            <div className="flex justify-between items-center mb-5 pb-3 border-b border-[#F3F0E8]/08">
              <div>
                <h2 className="font-heading text-lg font-semibold text-[#F3F0E8]">Create Platform User</h2>
                <div className="text-xs text-[#9E9B93]">Add a clinic owner, staff, or super-admin.</div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-[#9E9B93] hover:text-[#F3F0E8] text-lg p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="label text-xs">Email Address *</label>
                <input
                  type="email"
                  className="input text-xs"
                  required
                  value={newEmail}
                  onChange={e => setNewEmail(e.target.value)}
                  placeholder="doctor@practice.com"
                />
              </div>

              <div>
                <label className="label text-xs">Password * (min 6 characters)</label>
                <input
                  type="password"
                  className="input text-xs"
                  required
                  minLength={6}
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="••••••••••••"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label text-xs">Full Name</label>
                  <input
                    type="text"
                    className="input text-xs"
                    value={newFullName}
                    onChange={e => setNewFullName(e.target.value)}
                    placeholder="Dr. Sarah Johnson"
                  />
                </div>
                <div>
                  <label className="label text-xs">Phone</label>
                  <input
                    type="text"
                    className="input text-xs font-mono"
                    value={newPhone}
                    onChange={e => setNewPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                  />
                </div>
              </div>

              {/* Clinic Assignment */}
              <div className="p-3.5 rounded-xl bg-[#111110] border border-[#F3F0E8]/08 space-y-2.5">
                <div className="text-xs font-semibold text-[#F3F0E8]">🏥 Clinic Assignment (Optional)</div>
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="label text-[11px]">Clinic</label>
                    <select
                      className="input text-xs"
                      value={newOrgId}
                      onChange={e => setNewOrgId(e.target.value)}
                    >
                      <option value="">-- None (Pending) --</option>
                      {organizations.map(org => (
                        <option key={org.id} value={org.id}>
                          {org.name} ({org.slug})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="label text-[11px]">Role</label>
                    <select
                      className="input text-xs"
                      value={newOrgRole}
                      onChange={e => setNewOrgRole(e.target.value as any)}
                      disabled={!newOrgId}
                    >
                      <option value="owner">Owner</option>
                      <option value="admin">Admin</option>
                      <option value="staff">Staff</option>
                      <option value="viewer">Viewer</option>
                    </select>
                  </div>
                </div>
              </div>

              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={newIsSuperAdmin}
                  onChange={e => setNewIsSuperAdmin(e.target.checked)}
                  className="mt-0.5"
                />
                <div>
                  <div className="text-xs font-semibold text-[#D4AF37]">👑 Grant Super Admin Privileges</div>
                  <div className="text-[11px] text-[#9E9B93]">Full multi-tenant access and database administration.</div>
                </div>
              </label>

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  className="btn btn-secondary text-xs"
                  onClick={() => setShowAddModal(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary text-xs"
                  disabled={isSubmitting || !newEmail.trim() || !newPassword.trim()}
                >
                  {isSubmitting ? 'Creating...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* DELETE CONFIRMATION MODAL */}
      {/* ============================================================ */}
      {deletingUser && (
        <div className="fixed inset-0 bg-[#080505]/85 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="card max-w-sm w-full p-6 bg-[#171614] border border-[#E84B2C]/40 shadow-[0_20px_50px_rgba(232,75,44,0.2)] text-center animate-scale-in">
            <div className="text-3xl mb-2">⚠️</div>
            <h2 className="font-heading text-lg font-bold text-[#E84B2C]">Delete Account?</h2>
            <p className="text-xs text-[#9E9B93] mt-2 leading-relaxed">
              Are you sure you want to permanently delete <strong className="text-[#F3F0E8]">{deletingUser.email}</strong>?
            </p>
            <div className="my-4 p-3 rounded-xl bg-[#E84B2C]/10 border border-[#E84B2C]/20 text-[11px] text-[#D0CBC1] text-left leading-relaxed">
              • Removes Supabase authentication credentials<br />
              • Dissolves clinic memberships and profiles<br />
              • Irreversible action
            </div>

            <div className="flex justify-center gap-2.5">
              <button
                type="button"
                className="btn btn-secondary text-xs"
                onClick={() => setDeletingUser(null)}
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-danger text-xs"
                onClick={handleDeleteUser}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Deleting...' : 'Permanently Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
