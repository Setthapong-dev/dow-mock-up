import { useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.tsx';
import api from '../utils/api.ts';
import { Plus, Search, Package, Send } from 'lucide-react';

interface Asset {
  id: string;
  name: string;
  description: string;
  status: string;
  owner_id: string;
  owner_name: string;
  location_name: string;
  created_at: string;
}

interface OwnerOption {
  id: string;
  name: string;
}

interface LocationOption {
  id: string;
  name: string;
}

export default function AssetsPage() {
  const { user } = useAuth();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', location_id: '' });
  const [locations, setLocations] = useState<LocationOption[]>([]);
  const [owners, setOwners] = useState<OwnerOption[]>([]);
  const [locationLoadError, setLocationLoadError] = useState('');
  const [requestAsset, setRequestAsset] = useState<Asset | null>(null);
  const [changeType, setChangeType] = useState<'status' | 'owner' | 'location'>('status');
  const [newStatus, setNewStatus] = useState('');
  const [newOwnerId, setNewOwnerId] = useState('');
  const [newLocationId, setNewLocationId] = useState('');
  const [requesting, setRequesting] = useState(false);
  const [requestMessage, setRequestMessage] = useState('');

  useEffect(() => {
    fetchAssets();
    fetchLocationOptions();
    api.get('/users/owners').then((r) => setOwners(r.data)).catch(() => {});
  }, []);

  const fetchLocationOptions = async () => {
    setLocationLoadError('');
    try {
      const res = await api.get('/locations');
      setLocations(res.data || []);
    } catch (err: unknown) {
      const msg = (err as any)?.response?.data?.error;
      setLocations([]);
      setLocationLoadError(msg || 'Failed to load location options');
    }
  };

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

  const openRequestForm = (asset: Asset) => {
    setRequestAsset(asset);
    setChangeType('status');
    setNewStatus('');
    setNewOwnerId('');
    setNewLocationId('');
    setRequestMessage('');
  };

  const handleRequestChange = async (e: FormEvent) => {
    e.preventDefault();
    if (!requestAsset) return;

    setRequesting(true);
    setRequestMessage('');

    let newValue: Record<string, string>;
    if (changeType === 'status') {
      newValue = { status: newStatus };
    } else if (changeType === 'owner') {
      newValue = { owner_id: newOwnerId };
    } else {
      newValue = { location_id: newLocationId };
    }

    try {
      await api.post('/changes', {
        asset_id: requestAsset.id,
        change_type: changeType,
        new_value: newValue,
      });

      setRequestMessage(
        changeType === 'location'
          ? 'Location updated immediately.'
          : 'Request submitted successfully.'
      );
      await fetchAssets();
    } catch (err: unknown) {
      const msg = (err as any)?.response?.data?.error;
      setRequestMessage(msg || 'Failed to submit request');
    } finally {
      setRequesting(false);
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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-primary">Manage Status</h1>
          <p className="text-tertiary mt-1">{assets.length} total assets</p>
        </div>
        {(user?.role === 'admin' || user?.role === 'owner') && (
          <button
            onClick={() => setShowCreate(!showCreate)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-senary text-white text-sm font-medium hover:bg-senary/90 transition-colors"
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
              {locations.map((l) => (
                <option key={l.id} value={l.id}>{l.name}</option>
              ))}
            </select>
          </div>
          {locationLoadError && (
            <p className="mt-3 text-xs text-denary">
              {locationLoadError}
            </p>
          )}
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

      {requestAsset && (
        <form onSubmit={handleRequestChange} className="bg-white rounded-xl border border-quaternary/50 p-6 mb-6">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <h3 className="text-lg font-semibold text-primary">Request Change</h3>
              <p className="text-sm text-tertiary mt-1">
                Asset: <span className="font-medium text-primary">{requestAsset.name}</span>
              </p>
            </div>
            <button
              type="button"
              onClick={() => setRequestAsset(null)}
              className="px-3 py-1.5 rounded-lg bg-quaternary/30 text-tertiary text-sm font-medium hover:bg-quaternary/50"
            >
              Close
            </button>
          </div>

          {requestMessage && (
            <div className="mb-4 p-3 rounded-lg bg-senary/10 text-senary text-sm">
              {requestMessage}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-tertiary uppercase mb-2">Change Type</label>
              <select
                value={changeType}
                onChange={(e) => setChangeType(e.target.value as 'status' | 'owner' | 'location')}
                className="w-full px-4 py-2.5 rounded-lg border border-quaternary/50 text-sm focus:outline-none focus:border-senary"
              >
                <option value="status">Status</option>
                <option value="owner">Owner</option>
                <option value="location">Location</option>
              </select>
            </div>

            {changeType === 'status' && (
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-tertiary uppercase mb-2">New Status</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 rounded-lg border border-quaternary/50 text-sm focus:outline-none focus:border-senary"
                >
                  <option value="">Select status</option>
                  <option value="active">Active</option>
                  <option value="notactive">Not Active</option>
                </select>
                <p className="text-xs text-tertiary mt-1">Status changes require owner approval.</p>
              </div>
            )}

            {changeType === 'owner' && (
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-tertiary uppercase mb-2">New Owner</label>
                <select
                  value={newOwnerId}
                  onChange={(e) => setNewOwnerId(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 rounded-lg border border-quaternary/50 text-sm focus:outline-none focus:border-senary"
                >
                  <option value="">Select owner</option>
                  {owners
                    .filter((o) => o.id !== requestAsset.owner_id)
                    .map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.name}
                      </option>
                    ))}
                </select>
                <p className="text-xs text-tertiary mt-1">Owner changes require approval from old and new owners.</p>
              </div>
            )}

            {changeType === 'location' && (
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-tertiary uppercase mb-2">New Location</label>
                <select
                  value={newLocationId}
                  onChange={(e) => setNewLocationId(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 rounded-lg border border-quaternary/50 text-sm focus:outline-none focus:border-senary"
                >
                  <option value="">Select location</option>
                  {locations.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-octonary mt-1">Location changes are applied immediately.</p>
                {locationLoadError && (
                  <p className="text-xs text-denary mt-1">{locationLoadError}</p>
                )}
              </div>
            )}

            <div className="flex items-end">
              <button
                type="submit"
                disabled={requesting || (changeType === 'location' && locations.length === 0)}
                className="w-full px-4 py-2.5 rounded-lg bg-senary text-white text-sm font-medium hover:bg-senary/90 transition-colors disabled:opacity-50"
              >
                {requesting ? 'Submitting...' : changeType === 'location' ? 'Update Location' : 'Submit Request'}
              </button>
            </div>
          </div>
        </form>
      )}

      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-quaternary/50 p-12 text-center">
          <Package size={48} className="mx-auto text-quaternary mb-4" />
          <p className="text-tertiary">No assets found</p>
        </div>
      ) : (
        <>
          {/* Mobile card layout */}
          <div className="space-y-3 md:hidden">
            {filtered.map((asset) => (
              <div key={asset.id} className="bg-white rounded-xl border border-quaternary/50 p-4">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="min-w-0">
                    <Link to={`/assets/${asset.id}`} className="font-medium text-primary hover:text-senary transition-colors">
                      {asset.name}
                    </Link>
                    {asset.description && (
                      <p className="text-xs text-tertiary mt-0.5 truncate">{asset.description}</p>
                    )}
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium shrink-0 ${statusBadge(asset.status)}`}>
                    {asset.status}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                  <div>
                    <p className="text-xs text-tertiary">Owner</p>
                    <p className="text-primary truncate">{asset.owner_name || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-tertiary">Location</p>
                    <p className="text-primary truncate">{asset.location_name || '-'}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-tertiary">{new Date(asset.created_at).toLocaleDateString()}</span>
                  <button
                    type="button"
                    onClick={() => openRequestForm(asset)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-senary/10 text-senary text-xs font-medium hover:bg-senary/20 transition-colors"
                  >
                    <Send size={14} />
                    Request
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
                  <th className="text-left px-6 py-3 text-xs font-semibold text-tertiary uppercase">Name</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-tertiary uppercase">Owner</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-tertiary uppercase">Location</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-tertiary uppercase">Status</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-tertiary uppercase">Created</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-tertiary uppercase">Action</th>
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
                    <td className="px-6 py-4">
                      <button
                        type="button"
                        onClick={() => openRequestForm(asset)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-senary/10 text-senary text-xs font-medium hover:bg-senary/20 transition-colors"
                      >
                        <Send size={14} />
                        Request
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
