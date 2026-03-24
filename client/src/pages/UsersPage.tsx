import { useEffect, useState } from 'react';
import api from '../utils/api.ts';
import { Users, Shield } from 'lucide-react';

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

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 rounded-xl bg-senary/10">
          <Shield size={24} className="text-senary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-primary">User Management</h1>
          <p className="text-tertiary mt-1">{users.length} users</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-quaternary/50 overflow-hidden">
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
            {users.map((u) => (
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
                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                      u.is_active ? 'bg-octonary/10 text-octonary' : 'bg-denary/10 text-denary'
                    }`}
                  >
                    {u.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-tertiary">
                  {new Date(u.created_at).toLocaleDateString()}
                </td>
                <td className="px-6 py-4">
                  <button
                    onClick={() => handleToggleActive(u.id, u.is_active)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      u.is_active
                        ? 'bg-denary/10 text-denary hover:bg-denary/20'
                        : 'bg-octonary/10 text-octonary hover:bg-octonary/20'
                    }`}
                  >
                    {u.is_active ? 'Deactivate' : 'Activate'}
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
