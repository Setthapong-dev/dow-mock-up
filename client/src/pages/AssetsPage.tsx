import { useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.tsx';
import api from '../utils/api.ts';
import { Plus, Search, Package } from 'lucide-react';

interface Asset {
  id: string;
  name: string;
  description: string;
  status: string;
  owner_name: string;
  location_name: string;
  created_at: string;
}

export default function AssetsPage() {
  const { user } = useAuth();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', location_id: '' });
  const [locations, setLocations] = useState<any[]>([]);

  useEffect(() => {
    fetchAssets();
    api.get('/locations').then((r) => setLocations(r.data)).catch(() => {});
  }, []);

  const fetchAssets = async () => {
    try {
      const res = await api.get('/assets');
      setAssets(res.data);
    } catch (err) {
      console.error('Failed to load assets:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/assets', {
        name: form.name,
        description: form.description || null,
        location_id: form.location_id || null,
      });
      setForm({ name: '', description: '', location_id: '' });
      setShowCreate(false);
      fetchAssets();
    } catch (err) {
      console.error('Failed to create asset:', err);
    }
  };

  const filtered = assets.filter(
    (a) =>
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.owner_name?.toLowerCase().includes(search.toLowerCase()) ||
      a.location_name?.toLowerCase().includes(search.toLowerCase())
  );

  const statusBadge = (status: string) =>
    status === 'active'
      ? 'bg-octonary/10 text-octonary'
      : 'bg-tertiary/20 text-tertiary';

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-senary" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-primary">Assets</h1>
          <p className="text-tertiary mt-1">{assets.length} total assets</p>
        </div>
        {(user?.role === 'admin' || user?.role === 'owner') && (
          <button
            onClick={() => setShowCreate(!showCreate)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-senary text-white text-sm font-medium hover:bg-senary/90 transition-colors"
          >
            <Plus size={16} />
            New Asset
          </button>
        )}
      </div>

      {showCreate && (
        <form onSubmit={handleCreate} className="bg-white rounded-xl border border-quaternary/50 p-6 mb-6">
          <h3 className="text-lg font-semibold text-primary mb-4">Create Asset</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input
              type="text"
              placeholder="Asset name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
              className="px-4 py-2.5 rounded-lg border border-quaternary/50 text-sm focus:outline-none focus:border-senary"
            />
            <input
              type="text"
              placeholder="Description (optional)"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="px-4 py-2.5 rounded-lg border border-quaternary/50 text-sm focus:outline-none focus:border-senary"
            />
            <select
              value={form.location_id}
              onChange={(e) => setForm({ ...form, location_id: e.target.value })}
              className="px-4 py-2.5 rounded-lg border border-quaternary/50 text-sm focus:outline-none focus:border-senary"
            >
              <option value="">No location</option>
              {locations.map((l: any) => (
                <option key={l.id} value={l.id}>{l.name}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-2 mt-4">
            <button type="submit" className="px-4 py-2 rounded-lg bg-senary text-white text-sm font-medium hover:bg-senary/90">
              Create
            </button>
            <button type="button" onClick={() => setShowCreate(false)} className="px-4 py-2 rounded-lg bg-quaternary/30 text-tertiary text-sm font-medium hover:bg-quaternary/50">
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="relative mb-4">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-tertiary" />
        <input
          type="text"
          placeholder="Search assets..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-quaternary/50 text-sm focus:outline-none focus:border-senary"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-quaternary/50 p-12 text-center">
          <Package size={48} className="mx-auto text-quaternary mb-4" />
          <p className="text-tertiary">No assets found</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-quaternary/50 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-quaternary/50 bg-quinary">
                <th className="text-left px-6 py-3 text-xs font-semibold text-tertiary uppercase">Name</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-tertiary uppercase">Owner</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-tertiary uppercase">Location</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-tertiary uppercase">Status</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-tertiary uppercase">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-quaternary/50">
              {filtered.map((asset) => (
                <tr key={asset.id} className="hover:bg-quinary transition-colors">
                  <td className="px-6 py-4">
                    <Link to={`/assets/${asset.id}`} className="font-medium text-primary hover:text-senary transition-colors">
                      {asset.name}
                    </Link>
                    {asset.description && (
                      <p className="text-xs text-tertiary mt-0.5 truncate max-w-xs">{asset.description}</p>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-tertiary">{asset.owner_name || '-'}</td>
                  <td className="px-6 py-4 text-sm text-tertiary">{asset.location_name || '-'}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusBadge(asset.status)}`}>
                      {asset.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-tertiary">
                    {new Date(asset.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
