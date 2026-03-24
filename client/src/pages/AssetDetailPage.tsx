import { useEffect, useState, type FormEvent } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../utils/api.ts';
import { ArrowLeft, Package } from 'lucide-react';

export default function AssetDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [asset, setAsset] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [locations, setLocations] = useState<any[]>([]);
  const [locationLoadError, setLocationLoadError] = useState('');
  const [owners, setOwners] = useState<any[]>([]);

  const [changeType, setChangeType] = useState<'status' | 'owner' | 'location'>('status');
  const [newStatus, setNewStatus] = useState('');
  const [newOwnerId, setNewOwnerId] = useState('');
  const [newLocationId, setNewLocationId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchAsset();
    fetchLocationOptions();
    api.get('/users/owners').then((r) => setOwners(r.data)).catch(() => {});
  }, [id]);

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

  const fetchAsset = async () => {
    try {
      const res = await api.get(`/assets/${id}`);
      setAsset(res.data);
    } catch (err) {
      console.error('Failed to load asset:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestChange = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage('');

    let new_value: any;
    if (changeType === 'status') {
      new_value = { status: newStatus };
    } else if (changeType === 'owner') {
      new_value = { owner_id: newOwnerId };
    } else {
      new_value = { location_id: newLocationId };
    }

    try {
      await api.post('/changes', { asset_id: id, change_type: changeType, new_value });
      setMessage(changeType === 'location' ? 'Location updated!' : 'Change request submitted!');
      fetchAsset();
    } catch (err: unknown) {
      const msg = (err as any)?.response?.data?.error;
      setMessage(msg || 'Failed to submit change');
    } finally {
      setSubmitting(false);
    }
  };

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      active: 'bg-octonary/10 text-octonary',
      notactive: 'bg-tertiary/20 text-tertiary',
      pending: 'bg-nonary/10 text-nonary',
      approved: 'bg-senary/10 text-senary',
      rejected: 'bg-denary/10 text-denary',
      done: 'bg-octonary/10 text-octonary',
    };
    return map[status] || 'bg-quaternary text-tertiary';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-senary" />
      </div>
    );
  }

  if (!asset) {
    return <div className="text-center text-tertiary">Asset not found</div>;
  }

  return (
    <div>
      <Link to="/assets" className="inline-flex items-center gap-2 text-sm text-tertiary hover:text-senary transition-colors mb-6">
        <ArrowLeft size={16} />
        Back to Assets
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Asset Info */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border border-quaternary/50 p-6 mb-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-senary/10">
                  <Package size={24} className="text-senary" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-primary">{asset.name}</h1>
                  {asset.description && <p className="text-sm text-tertiary mt-1">{asset.description}</p>}
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusBadge(asset.status)}`}>
                {asset.status}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-6">
              <div>
                <p className="text-xs text-tertiary">Owner</p>
                <p className="text-sm font-medium text-primary mt-0.5">{asset.owner_name || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-tertiary">Location</p>
                <p className="text-sm font-medium text-primary mt-0.5">{asset.location_name || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-tertiary">Created</p>
                <p className="text-sm font-medium text-primary mt-0.5">
                  {new Date(asset.created_at).toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-xs text-tertiary">Updated</p>
                <p className="text-sm font-medium text-primary mt-0.5">
                  {new Date(asset.updated_at).toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          {/* Change History */}
          <div className="bg-white rounded-xl border border-quaternary/50">
            <div className="p-6 border-b border-quaternary/50">
              <h2 className="text-lg font-semibold text-primary">Change History</h2>
            </div>
            {!asset.changes || asset.changes.length === 0 ? (
              <div className="p-6 text-center text-tertiary">No changes yet</div>
            ) : (
              <div className="divide-y divide-quaternary/50">
                {asset.changes.map((change: any) => (
                  <div key={change.id} className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-primary capitalize">{change.change_type}</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusBadge(change.status)}`}>
                          {change.status}
                        </span>
                      </div>
                      <span className="text-xs text-tertiary">
                        {new Date(change.created_at).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-xs text-tertiary">
                      Requested by {change.requested_by_name}
                    </p>
                    <div className="flex gap-4 mt-2 text-xs">
                      <span className="text-tertiary">
                        From: <code className="bg-quinary px-1 rounded">{JSON.stringify(change.old_value)}</code>
                      </span>
                      <span className="text-tertiary">
                        To: <code className="bg-quinary px-1 rounded">{JSON.stringify(change.new_value)}</code>
                      </span>
                    </div>
                    {change.approvals && change.approvals.length > 0 && (
                      <div className="mt-2 flex gap-2">
                        {change.approvals.map((a: any) => (
                          <span
                            key={a.id}
                            className={`text-xs px-2 py-0.5 rounded-full ${statusBadge(a.status)}`}
                          >
                            {a.approver_role}: {a.approver_name} ({a.status})
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Request Change Form */}
        <div>
          <div className="bg-white rounded-xl border border-quaternary/50 p-6 sticky top-8">
            <h2 className="text-lg font-semibold text-primary mb-4">Request Change</h2>

            {message && (
              <div className="mb-4 p-3 rounded-lg bg-senary/10 text-senary text-sm">{message}</div>
            )}

            <form onSubmit={handleRequestChange}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-tertiary mb-2">Change Type</label>
                <select
                  value={changeType}
                  onChange={(e) => setChangeType(e.target.value as any)}
                  className="w-full px-4 py-2.5 rounded-lg border border-quaternary/50 text-sm focus:outline-none focus:border-senary"
                >
                  <option value="status">Status</option>
                  <option value="owner">Owner</option>
                  <option value="location">Location</option>
                </select>
              </div>

              {changeType === 'status' && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-tertiary mb-2">New Status</label>
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
                  <p className="text-xs text-tertiary mt-1">Requires owner approval</p>
                </div>
              )}

              {changeType === 'owner' && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-tertiary mb-2">New Owner</label>
                  <select
                    value={newOwnerId}
                    onChange={(e) => setNewOwnerId(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 rounded-lg border border-quaternary/50 text-sm focus:outline-none focus:border-senary"
                  >
                    <option value="">Select owner</option>
                    {owners
                      .filter((o) => o.id !== asset.owner_id)
                      .map((o: any) => (
                        <option key={o.id} value={o.id}>{o.name}</option>
                      ))}
                  </select>
                  <p className="text-xs text-tertiary mt-1">Requires approval from both old and new owner</p>
                </div>
              )}

              {changeType === 'location' && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-tertiary mb-2">New Location</label>
                  <select
                    value={newLocationId}
                    onChange={(e) => setNewLocationId(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 rounded-lg border border-quaternary/50 text-sm focus:outline-none focus:border-senary"
                  >
                    <option value="">Select location</option>
                    {locations.map((l: any) => (
                      <option key={l.id} value={l.id}>{l.name}</option>
                    ))}
                  </select>
                  <p className="text-xs text-octonary mt-1">Applied immediately (no approval needed)</p>
                  {locationLoadError && (
                    <p className="text-xs text-denary mt-1">{locationLoadError}</p>
                  )}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting || (changeType === 'location' && locations.length === 0)}
                className="w-full py-2.5 rounded-lg bg-senary text-white text-sm font-medium hover:bg-senary/90 transition-colors disabled:opacity-50"
              >
                {submitting ? 'Submitting...' : changeType === 'location' ? 'Update Location' : 'Submit Request'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
