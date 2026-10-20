'use client';

// src/app/admin/users/page.tsx
// Platform Super-Admin Users Management Console — View, edit, assign clinics, reset passwords, ban, and delete accounts

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
      // Search text match
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q || (
        user.email.toLowerCase().includes(q) ||
        user.fullName.toLowerCase().includes(q) ||
        user.phone.toLowerCase().includes(q) ||
        user.memberships.some(m => m.organizationName.toLowerCase().includes(q))
      );

      if (!matchesSearch) return false;

      // Role filter match
      if (roleFilter === 'super_admin') return user.isSuperAdmin;
      if (roleFilter === 'owner') return user.memberships.some(m => m.role === 'owner');
      if (roleFilter === 'staff') return user.memberships.some(m => m.role === 'staff' || m.role === 'admin' || m.role === 'viewer');
      if (roleFilter === 'no_clinic') return user.memberships.length === 0;
      if (roleFilter === 'banned') return user.isBanned;

      return true;
    });
  }, [users, searchQuery, roleFilter]);

  // Metrics
  const stats = useMemo(() => {
    return {
      total: users.length,
      superAdmins: users.filter(u => u.isSuperAdmin).length,
      owners: users.filter(u => u.memberships.some(m => m.role === 'owner')).length,
      staff: users.filter(u => u.memberships.some(m => m.role !== 'owner')).length,
      unassigned: users.filter(u => u.memberships.length === 0 && !u.isSuperAdmin).length,
      banned: users.filter(u => u.isBanned).length,
    };
  }, [users]);

  // Open edit modal for user
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
      setEditOrgRole('owner');
    }
  };

  // Save updated user
  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setIsSubmitting(true);
    setToastMessage(null);

    try {
      const payload: Record<string, any> = {
        userId: editingUser.id,
        fullName: editFullName.trim(),
        phone: editPhone.trim(),
        isSuperAdmin: editIsSuperAdmin,
        emailConfirm: editEmailConfirm,
        isBanned: editIsBanned,
        organizationId: editOrgId ? editOrgId : null,
        role: editOrgRole,
      };

      if (editPassword.trim()) {
        payload.password = editPassword.trim();
      }

      const res = await fetch('/api/v1/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || 'Failed to update user');
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

  // Create new user
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim() || !newPassword.trim()) return;
    setIsSubmitting(true);
    setToastMessage(null);

    try {
      const payload: Record<string, any> = {
        email: newEmail.trim(),
        password: newPassword.trim(),
        fullName: newFullName.trim() || newEmail.split('@')[0],
        phone: newPhone.trim(),
        isSuperAdmin: newIsSuperAdmin,
        organizationId: newOrgId ? newOrgId : null,
        role: newOrgRole,
      };

      const res = await fetch('/api/v1/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || 'Failed to create user');
      }

      setToastMessage({ type: 'success', text: `User ${newEmail} created successfully!` });
      setShowAddModal(false);
      // Reset form
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
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            👥 Users & Staff Management
          </h1>
          <p style={{ color: 'hsl(var(--color-text-muted))', fontSize: '0.85rem' }}>
            View, search, edit roles, assign clinics, reset passwords, and manage all accounts across the platform.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={fetchUsers}
            disabled={loading}
            style={{ fontSize: '0.85rem' }}
          >
            🔄 Refresh
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setShowAddModal(true)}
            style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <span>+</span>
            <span>Create User</span>
          </button>
        </div>
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div style={{
          marginBottom: '1.5rem',
          padding: '0.85rem 1.25rem',
          borderRadius: '8px',
          fontSize: '0.875rem',
          fontWeight: 600,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: toastMessage.type === 'success' ? 'hsl(142 71% 45% / 0.15)' : 'hsl(0 84% 60% / 0.15)',
          border: toastMessage.type === 'success' ? '1px solid hsl(142 71% 45% / 0.3)' : '1px solid hsl(0 84% 60% / 0.3)',
          color: toastMessage.type === 'success' ? 'hsl(142 71% 65%)' : 'hsl(0 84% 75%)',
        }}>
          <div>{toastMessage.type === 'success' ? '✅' : '⚠️'} {toastMessage.text}</div>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontSize: '1.1rem' }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Metrics Row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '1rem',
        marginBottom: '1.75rem',
      }}>
        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ fontSize: '0.75rem', color: 'hsl(var(--color-text-muted))', fontWeight: 600 }}>Total Users</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, marginTop: '0.25rem', color: 'white' }}>{stats.total}</div>
        </div>

        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ fontSize: '0.75rem', color: 'hsl(var(--color-text-muted))', fontWeight: 600 }}>Super Admins</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, marginTop: '0.25rem', color: 'hsl(265 83% 70%)' }}>{stats.superAdmins}</div>
        </div>

        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ fontSize: '0.75rem', color: 'hsl(var(--color-text-muted))', fontWeight: 600 }}>Clinic Owners</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, marginTop: '0.25rem', color: 'hsl(221 83% 65%)' }}>{stats.owners}</div>
        </div>

        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ fontSize: '0.75rem', color: 'hsl(var(--color-text-muted))', fontWeight: 600 }}>Clinic Staff / Admins</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, marginTop: '0.25rem', color: 'hsl(142 71% 55%)' }}>{stats.staff}</div>
        </div>

        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ fontSize: '0.75rem', color: 'hsl(var(--color-text-muted))', fontWeight: 600 }}>Pending Onboarding / No Clinic</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, marginTop: '0.25rem', color: stats.unassigned > 0 ? 'hsl(45 93% 58%)' : 'hsl(var(--color-text-muted))' }}>
            {stats.unassigned}
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="card" style={{ padding: '1.25rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'space-between', alignItems: 'center' }}>
          {/* Search box */}
          <div style={{ position: 'relative', flex: '1 1 300px' }}>
            <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5, fontSize: '0.9rem' }}>
              🔍
            </span>
            <input
              type="text"
              className="input"
              placeholder="Search by name, email, phone, or clinic..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ paddingLeft: '2.5rem', width: '100%' }}
            />
          </div>

          {/* Role pills */}
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
            {[
              { id: 'all', label: `All (${users.length})` },
              { id: 'super_admin', label: `Super Admin (${stats.superAdmins})` },
              { id: 'owner', label: `Owners (${stats.owners})` },
              { id: 'staff', label: `Staff (${stats.staff})` },
              { id: 'no_clinic', label: `No Clinic (${stats.unassigned})` },
              { id: 'banned', label: `Banned (${stats.banned})` },
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setRoleFilter(tab.id as any)}
                style={{
                  padding: '0.4rem 0.85rem',
                  borderRadius: '9999px',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  border: roleFilter === tab.id ? '1px solid hsl(var(--color-primary))' : '1px solid hsl(var(--color-border))',
                  background: roleFilter === tab.id ? 'hsl(var(--color-primary) / 0.15)' : 'hsl(var(--color-surface))',
                  color: roleFilter === tab.id ? 'white' : 'hsl(var(--color-text-muted))',
                  transition: 'all 0.15s ease',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>User</th>
              <th>System Role</th>
              <th>Assigned Clinic</th>
              <th>Phone</th>
              <th>Status</th>
              <th>Joined Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '3rem', color: 'hsl(var(--color-text-muted))' }}>
                  <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>⏳</div>
                  <div>Loading platform users...</div>
                </td>
              </tr>
            ) : filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '3rem', color: 'hsl(var(--color-text-muted))' }}>
                  <div style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>👥</div>
                  <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>No users found</div>
                  <div style={{ fontSize: '0.8rem', marginTop: '0.25rem' }}>
                    {searchQuery ? 'Try clearing or modifying your search query.' : 'No users match this filter.'}
                  </div>
                </td>
              </tr>
            ) : (
              filteredUsers.map(user => {
                const primaryOrg = user.memberships[0];

                return (
                  <tr key={user.id}>
                    {/* User Identity */}
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{
                          width: 36,
                          height: 36,
                          borderRadius: '50%',
                          background: user.isSuperAdmin
                            ? 'linear-gradient(135deg, hsl(265 83% 60%), hsl(221 83% 55%))'
                            : 'hsl(var(--color-surface-hover))',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 700,
                          fontSize: '0.9rem',
                          color: 'white',
                          flexShrink: 0,
                          border: user.isSuperAdmin ? '2px solid hsl(265 83% 75%)' : '1px solid hsl(var(--color-border))',
                        }}>
                          {user.fullName ? user.fullName.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            <span>{user.fullName}</span>
                            {user.isSuperAdmin && (
                              <span title="Super Admin" style={{ fontSize: '0.85rem' }}>👑</span>
                            )}
                          </div>
                          <div style={{ fontSize: '0.78rem', color: 'hsl(var(--color-text-muted))', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            <span>{user.email}</span>
                            {user.emailConfirmed ? (
                              <span title="Email verified" style={{ color: 'hsl(142 71% 45%)', fontSize: '0.75rem' }}>✓</span>
                            ) : (
                              <span title="Email unverified" style={{ color: 'hsl(45 93% 58%)', fontSize: '0.75rem' }}>• unverified</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Role Badges */}
                    <td>
                      {user.isSuperAdmin ? (
                        <span className="badge" style={{
                          background: 'linear-gradient(135deg, hsl(265 83% 55% / 0.25), hsl(221 83% 55% / 0.25))',
                          color: 'hsl(265 83% 75%)',
                          border: '1px solid hsl(265 83% 65% / 0.4)',
                          fontWeight: 700,
                        }}>
                          Super Admin
                        </span>
                      ) : primaryOrg ? (
                        <span className={`badge ${
                          primaryOrg.role === 'owner'
                            ? 'badge-primary'
                            : primaryOrg.role === 'admin'
                            ? 'badge-info'
                            : 'badge-secondary'
                        }`}>
                          {primaryOrg.role.toUpperCase()}
                        </span>
                      ) : (
                        <span className="badge badge-warning" style={{ opacity: 0.85 }}>
                          No Clinic
                        </span>
                      )}
                    </td>

                    {/* Clinic / Organization */}
                    <td>
                      {primaryOrg ? (
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{primaryOrg.organizationName}</div>
                          <div style={{ fontSize: '0.72rem', color: 'hsl(var(--color-text-muted))' }}>
                            slug: {primaryOrg.organizationSlug}
                          </div>
                        </div>
                      ) : (
                        <span style={{ fontSize: '0.8rem', color: 'hsl(var(--color-text-muted))', fontStyle: 'italic' }}>
                          Pending Onboarding
                        </span>
                      )}
                    </td>

                    {/* Phone */}
                    <td style={{ fontSize: '0.82rem' }}>
                      {user.phone ? user.phone : <span style={{ color: 'hsl(var(--color-text-muted))' }}>—</span>}
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
                      <div style={{ fontSize: '0.8rem' }}>
                        {new Date(user.createdAt).toLocaleDateString('en-IN')}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'hsl(var(--color-text-muted))' }}>
                        {user.lastSignInAt
                          ? `Active ${new Date(user.lastSignInAt).toLocaleDateString('en-IN')}`
                          : 'Never signed in'}
                      </div>
                    </td>

                    {/* Actions */}
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <button
                          type="button"
                          className="btn btn-secondary"
                          style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem', fontWeight: 600 }}
                          onClick={() => handleOpenEdit(user)}
                        >
                          ✏️ Manage
                        </button>
                        <button
                          type="button"
                          style={{
                            background: 'none',
                            border: 'none',
                            color: 'hsl(0 84% 65%)',
                            cursor: 'pointer',
                            fontSize: '0.85rem',
                            padding: '0.35rem',
                            borderRadius: '4px',
                          }}
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

      {/* ============================================================ */}
      {/* MANAGE / EDIT USER MODAL */}
      {/* ============================================================ */}
      {editingUser && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem',
        }}>
          <div className="card" style={{ maxWidth: 560, width: '100%', maxHeight: '90vh', overflowY: 'auto', padding: '1.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Manage User Account</h2>
                <div style={{ fontSize: '0.8rem', color: 'hsl(var(--color-text-muted))' }}>{editingUser.email}</div>
              </div>
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: '1.25rem' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveUser} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Profile Details */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label className="label">Full Name</label>
                  <input
                    type="text"
                    className="input"
                    value={editFullName}
                    onChange={e => setEditFullName(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="label">Phone Number</label>
                  <input
                    type="text"
                    className="input"
                    value={editPhone}
                    onChange={e => setEditPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                  />
                </div>
              </div>

              {/* Password Override */}
              <div>
                <label className="label">Reset Password (leave empty to keep current)</label>
                <input
                  type="password"
                  className="input"
                  value={editPassword}
                  onChange={e => setEditPassword(e.target.value)}
                  placeholder="Enter new password (min. 6 chars)"
                  minLength={6}
                />
              </div>

              {/* Clinic Assignment */}
              <div style={{
                padding: '1rem',
                borderRadius: '8px',
                background: 'hsl(var(--color-surface))',
                border: '1px solid hsl(var(--color-border))',
              }}>
                <div style={{ fontWeight: 700, fontSize: '0.875rem', marginBottom: '0.75rem' }}>
                  🏥 Clinic Organization Assignment
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <label className="label" style={{ fontSize: '0.75rem' }}>Clinic / Tenant</label>
                    <select
                      className="input"
                      value={editOrgId}
                      onChange={e => setEditOrgId(e.target.value)}
                    >
                      <option value="">-- No Clinic / Remove from Clinic --</option>
                      {organizations.map(org => (
                        <option key={org.id} value={org.id}>
                          {org.name} ({org.slug})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="label" style={{ fontSize: '0.75rem' }}>Clinic Role</label>
                    <select
                      className="input"
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

              {/* Permissions & Security Toggles */}
              <div style={{
                padding: '1rem',
                borderRadius: '8px',
                background: 'hsl(var(--color-surface))',
                border: '1px solid hsl(var(--color-border))',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
              }}>
                <div style={{ fontWeight: 700, fontSize: '0.875rem' }}>
                  🛡️ Security & Platform Permissions
                </div>

                {/* Super Admin Toggle */}
                <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={editIsSuperAdmin}
                    onChange={e => setEditIsSuperAdmin(e.target.checked)}
                    style={{ marginTop: '3px' }}
                  />
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>👑 Platform Super Admin</div>
                    <div style={{ fontSize: '0.75rem', color: 'hsl(var(--color-text-muted))' }}>
                      Grants full unrestricted platform management, financial telemetry, subscriber administration, and database overrides.
                    </div>
                  </div>
                </label>

                {/* Email Verified Toggle */}
                <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={editEmailConfirm}
                    onChange={e => setEditEmailConfirm(e.target.checked)}
                    style={{ marginTop: '3px' }}
                  />
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>Email Verified</div>
                    <div style={{ fontSize: '0.75rem', color: 'hsl(var(--color-text-muted))' }}>
                      Mark this user&apos;s email address as verified without requiring verification link.
                    </div>
                  </div>
                </label>

                {/* Banned Toggle */}
                <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={editIsBanned}
                    onChange={e => setEditIsBanned(e.target.checked)}
                    style={{ marginTop: '3px' }}
                  />
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.85rem', color: editIsBanned ? 'hsl(0 84% 65%)' : 'inherit' }}>
                      🚫 Ban / Suspend User Account
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'hsl(var(--color-text-muted))' }}>
                      Blocks the user from signing in and revokes active authentication tokens.
                    </div>
                  </div>
                </label>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  style={{
                    background: 'none',
                    border: '1px solid hsl(0 84% 60% / 0.4)',
                    color: 'hsl(0 84% 70%)',
                    padding: '0.5rem 1rem',
                    borderRadius: '6px',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                  onClick={() => {
                    const u = editingUser;
                    setEditingUser(null);
                    setDeletingUser(u);
                  }}
                >
                  Delete Account...
                </button>

                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setEditingUser(null)}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
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
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem',
        }}>
          <div className="card" style={{ maxWidth: 520, width: '100%', maxHeight: '90vh', overflowY: 'auto', padding: '1.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Create New User</h2>
                <div style={{ fontSize: '0.8rem', color: 'hsl(var(--color-text-muted))' }}>
                  Add a platform user, clinic owner, or super administrator.
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: '1.25rem' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateUser} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label className="label">Email Address *</label>
                <input
                  type="email"
                  className="input"
                  required
                  value={newEmail}
                  onChange={e => setNewEmail(e.target.value)}
                  placeholder="doctor@example.com"
                />
              </div>

              <div>
                <label className="label">Initial Password * (min. 6 characters)</label>
                <input
                  type="password"
                  className="input"
                  required
                  minLength={6}
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="••••••••••••"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label className="label">Full Name</label>
                  <input
                    type="text"
                    className="input"
                    value={newFullName}
                    onChange={e => setNewFullName(e.target.value)}
                    placeholder="Dr. Sarah Johnson"
                  />
                </div>
                <div>
                  <label className="label">Phone</label>
                  <input
                    type="text"
                    className="input"
                    value={newPhone}
                    onChange={e => setNewPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                  />
                </div>
              </div>

              {/* Clinic Assignment */}
              <div style={{
                padding: '1rem',
                borderRadius: '8px',
                background: 'hsl(var(--color-surface))',
                border: '1px solid hsl(var(--color-border))',
              }}>
                <div style={{ fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.75rem' }}>
                  🏥 Assign to Clinic (Optional)
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <label className="label" style={{ fontSize: '0.75rem' }}>Clinic</label>
                    <select
                      className="input"
                      value={newOrgId}
                      onChange={e => setNewOrgId(e.target.value)}
                    >
                      <option value="">-- None (Pending Onboarding) --</option>
                      {organizations.map(org => (
                        <option key={org.id} value={org.id}>
                          {org.name} ({org.slug})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="label" style={{ fontSize: '0.75rem' }}>Role</label>
                    <select
                      className="input"
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

              {/* Super Admin Checkbox */}
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={newIsSuperAdmin}
                  onChange={e => setNewIsSuperAdmin(e.target.checked)}
                  style={{ marginTop: '3px' }}
                />
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>👑 Grant Super Admin Privileges</div>
                  <div style={{ fontSize: '0.75rem', color: 'hsl(var(--color-text-muted))' }}>
                    User will have full access to platform revenue, user management, and system administration.
                  </div>
                </div>
              </label>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowAddModal(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
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
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.85)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem',
        }}>
          <div className="card" style={{ maxWidth: 450, width: '100%', padding: '1.75rem', border: '1px solid hsl(0 84% 60% / 0.5)' }}>
            <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>⚠️</div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'hsl(0 84% 75%)' }}>Delete User Account?</h2>
              <p style={{ fontSize: '0.85rem', color: 'hsl(var(--color-text-muted))', marginTop: '0.5rem' }}>
                Are you sure you want to permanently delete <strong>{deletingUser.email}</strong>?
              </p>
              <div style={{
                marginTop: '1rem',
                padding: '0.75rem',
                borderRadius: '6px',
                background: 'hsl(0 84% 60% / 0.1)',
                color: 'hsl(0 84% 80%)',
                fontSize: '0.78rem',
                textAlign: 'left',
              }}>
                • Removes their Supabase authentication record<br />
                • Deletes their profile and clinic memberships<br />
                • This action cannot be undone.
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setDeletingUser(null)}
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={handleDeleteUser}
                disabled={isSubmitting}
                style={{ background: 'hsl(0 84% 50%)', color: 'white' }}
              >
                {isSubmitting ? 'Deleting...' : 'Yes, Permanently Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
