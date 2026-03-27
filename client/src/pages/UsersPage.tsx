import { useEffect, useState, type FormEvent } from 'react';
import api from '../utils/api.ts';
import { Users, Shield, Plus, UserCheck, UserX } from 'lucide-react';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  is_active: boolean;
  created_at: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'user' as 'user' | 'owner' | 'admin',
  });
  const [addSubmitting, setAddSubmitting] = useState(false);
  const [addMessage, setAddMessage] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await api.get('/users');
      setUsers(res.data);
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      await api.patch(`/users/${userId}`, { role: newRole });
      fetchUsers();
    } catch (err) {
      console.error('Failed to update role:', err);
    }
  };

  const handleAddUser = async (e: FormEvent) => {
    e.preventDefault();
    setAddSubmitting(true);
    setAddMessage('');
    try {
      await api.post('/users', {
        name: addForm.name.trim(),
        email: addForm.email.trim(),
        password: addForm.password,
        role: addForm.role,
      });
      setAddForm({ name: '', email: '', password: '', role: 'user' });
      setShowAddForm(false);
      await fetchUsers();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setAddMessage(msg || 'Failed to create user');
    } finally {
      setAddSubmitting(false);
    }
  };

  const handleToggleActive = async (userId: string, currentActive: boolean) => {
    try {
      await api.patch(`/users/${userId}`, { is_active: !currentActive });
      fetchUsers();
    } catch (err) {
      console.error('Failed to toggle active:', err);
    }
  };

  const roleBadge = (role: string) => {
    const map: Record<string, string> = {
      admin: 'bg-denary/10 text-denary',
      owner: 'bg-senary/10 text-senary',
      user: 'bg-tertiary/20 text-tertiary',
    };
    return map[role] || '';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-senary" />
      </div>
    );
  }

  const pendingUsers = users.filter((u) => !u.is_active);
  const activeUsers = users.filter((u) => u.is_active);

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-senary/10">
            <Shield size={24} className="text-senary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-primary">User Management</h1>
            <p className="text-tertiary mt-1">{users.length} users</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            setShowAddForm((v) => !v);
            setAddMessage('');
          }}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-senary text-white text-sm font-medium hover:bg-senary/90 transition-colors"
        >
          <Plus size={16} />
          Add user
        </button>
      </div>

      {showAddForm && (
        <form onSubmit={handleAddUser} className="bg-white rounded-xl border border-quaternary/50 p-6 mb-6">
          <h2 className="text-lg font-semibold text-primary mb-4">New user</h2>
          {addMessage && (
            <div className="mb-4 p-3 rounded-lg bg-denary/10 text-denary text-sm">{addMessage}</div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-tertiary uppercase mb-2">Name</label>
              <input
                type="text"
                value={addForm.name}
                onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                required
                className="w-full px-4 py-2.5 rounded-lg border border-quaternary/50 text-sm focus:outline-none focus:border-senary"
                placeholder="Full name"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-tertiary uppercase mb-2">Email</label>
              <input
                type="email"
                value={addForm.email}
                onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                required
                className="w-full px-4 py-2.5 rounded-lg border border-quaternary/50 text-sm focus:outline-none focus:border-senary"
                placeholder="email@example.com"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-tertiary uppercase mb-2">Password</label>
              <input
                type="password"
                value={addForm.password}
                onChange={(e) => setAddForm({ ...addForm, password: e.target.value })}
                required
                minLength={6}
                className="w-full px-4 py-2.5 rounded-lg border border-quaternary/50 text-sm focus:outline-none focus:border-senary"
                placeholder="At least 6 characters"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-tertiary uppercase mb-2">Role</label>
              <select
                value={addForm.role}
                onChange={(e) =>
                  setAddForm({
                    ...addForm,
                    role: e.target.value as 'user' | 'owner' | 'admin',
                  })
                }
                className="w-full px-4 py-2.5 rounded-lg border border-quaternary/50 text-sm focus:outline-none focus:border-senary"
              >
                <option value="user">user</option>
                <option value="owner">owner</option>
                <option value="admin">admin</option>
              </select>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button
              type="submit"
              disabled={addSubmitting}
              className="px-4 py-2 rounded-lg bg-senary text-white text-sm font-medium hover:bg-senary/90 disabled:opacity-50"
            >
              {addSubmitting ? 'Creating...' : 'Create user'}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowAddForm(false);
                setAddMessage('');
                setAddForm({ name: '', email: '', password: '', role: 'user' });
              }}
              className="px-4 py-2 rounded-lg bg-quaternary/30 text-tertiary text-sm font-medium hover:bg-quaternary/50"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {pendingUsers.length > 0 && (
        <div className="bg-white rounded-xl border-2 border-nonary/40 mb-6">
          <div className="px-6 py-4 border-b border-nonary/20 bg-nonary/5 rounded-t-xl flex items-center gap-2">
            <UserCheck size={18} className="text-nonary" />
            <h2 className="text-base font-semibold text-primary">
              Pending Registrations
            </h2>
            <span className="ml-auto px-2.5 py-0.5 rounded-full text-xs font-medium bg-nonary/10 text-nonary">
              {pendingUsers.length}
            </span>
          </div>
          <div className="divide-y divide-quaternary/30">
            {pendingUsers.map((u) => (
              <div key={u.id} className="px-6 py-4 flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-9 h-9 rounded-full bg-nonary/10 flex items-center justify-center shrink-0">
                    <Users size={16} className="text-nonary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-primary truncate">{u.name}</p>
                    <p className="text-xs text-tertiary truncate">{u.email}</p>
                  </div>
                  <span className="text-xs text-tertiary whitespace-nowrap ml-auto sm:ml-4">
                    {new Date(u.created_at).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => handleToggleActive(u.id, false)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-octonary text-white text-xs font-medium hover:bg-octonary/90 transition-colors"
                  >
                    <UserCheck size={14} />
                    Approve
                  </button>
                  <button
                    onClick={async () => {
                      try {
                        await api.delete(`/users/${u.id}`);
                        fetchUsers();
                      } catch (err) {
                        console.error('Failed to reject user:', err);
                      }
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-denary/10 text-denary text-xs font-medium hover:bg-denary/20 transition-colors"
                  >
                    <UserX size={14} />
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Mobile card layout */}
      <div className="space-y-3 md:hidden">
        {activeUsers.map((u) => (
          <div key={u.id} className="bg-white rounded-xl border border-quaternary/50 p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-full bg-senary/10 flex items-center justify-center shrink-0">
                <Users size={14} className="text-senary" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-primary truncate">{u.name}</p>
                <p className="text-xs text-tertiary truncate">{u.email}</p>
              </div>
              <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-octonary/10 text-octonary shrink-0">
                Active
              </span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <select
                  value={u.role}
                  onChange={(e) => handleRoleChange(u.id, e.target.value)}
                  className={`px-3 py-1 rounded-full text-xs font-medium border-0 cursor-pointer ${roleBadge(u.role)}`}
                >
                  <option value="user">user</option>
                  <option value="owner">owner</option>
                  <option value="admin">admin</option>
                </select>
                <span className="text-xs text-tertiary">{new Date(u.created_at).toLocaleDateString()}</span>
              </div>
              <button
                onClick={() => handleToggleActive(u.id, u.is_active)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors bg-denary/10 text-denary hover:bg-denary/20 shrink-0"
              >
                Deactivate
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop table layout */}
      <div className="bg-white rounded-xl border border-quaternary/50 overflow-hidden hidden md:block">
        <table className="w-full">
          <thead>
            <tr className="border-b border-quaternary/50 bg-quinary">
              <th className="text-left px-6 py-3 text-xs font-semibold text-tertiary uppercase">User</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-tertiary uppercase">Role</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-tertiary uppercase">Status</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-tertiary uppercase">Joined</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-tertiary uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-quaternary/50">
            {activeUsers.map((u) => (
              <tr key={u.id} className="hover:bg-quinary transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-senary/10 flex items-center justify-center">
                      <Users size={14} className="text-senary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-primary">{u.name}</p>
                      <p className="text-xs text-tertiary">{u.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <select
                    value={u.role}
                    onChange={(e) => handleRoleChange(u.id, e.target.value)}
                    className={`px-3 py-1 rounded-full text-xs font-medium border-0 cursor-pointer ${roleBadge(u.role)}`}
                  >
                    <option value="user">user</option>
                    <option value="owner">owner</option>
                    <option value="admin">admin</option>
                  </select>
                </td>
                <td className="px-6 py-4">
                  <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-octonary/10 text-octonary">
                    Active
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-tertiary">
                  {new Date(u.created_at).toLocaleDateString()}
                </td>
                <td className="px-6 py-4">
                  <button
                    onClick={() => handleToggleActive(u.id, u.is_active)}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors bg-denary/10 text-denary hover:bg-denary/20"
                  >
                    Deactivate
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
