import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api.ts';
import { ClipboardCheck, Check, X } from 'lucide-react';

interface Approval {
  id: string;
  change_id: string;
  asset_id: string;
  asset_name: string;
  change_type: string;
  old_value: any;
  new_value: any;
  approver_role: string;
  requested_by_name: string;
  change_created_at: string;
}

export default function ApprovalsPage() {
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchApprovals();
  }, []);

  const fetchApprovals = async () => {
    try {
      const res = await api.get('/changes/pending');
      setApprovals(res.data);
    } catch (err) {
      console.error('Failed to load approvals:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (changeId: string, action: 'approve' | 'reject') => {
    setActionLoading(changeId);
    try {
      await api.post(`/changes/${changeId}/${action}`);
      fetchApprovals();
    } catch (err) {
      console.error(`Failed to ${action}:`, err);
    } finally {
      setActionLoading(null);
    }
  };

  const changeTypeLabel = (type: string) => {
    const map: Record<string, string> = {
      status: 'Status Change',
      owner: 'Owner Transfer',
      location: 'Location Change',
    };
    return map[type] || type;
  };

  const formatChangeValue = (type: string, value: any) => {
    if (!value || typeof value !== 'object') return '-';

    if (type === 'status') {
      return value.status || '-';
    }

    if (type === 'owner') {
      return value.owner_name || value.owner_id || '-';
    }

    if (type === 'location') {
      return value.location_name || value.location_id || '-';
    }

    return JSON.stringify(value);
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
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-primary">Approval</h1>
        <p className="text-tertiary mt-1">{approvals.length} awaiting your action</p>
      </div>

      {approvals.length === 0 ? (
        <div className="bg-white rounded-xl border border-quaternary/50 p-12 text-center">
          <ClipboardCheck size={48} className="mx-auto text-quaternary mb-4" />
          <p className="text-tertiary">No pending approvals</p>
        </div>
      ) : (
        <div className="space-y-4">
          {approvals.map((approval) => (
            <div key={approval.id} className="bg-white rounded-xl border border-quaternary/50 p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-nonary/10 text-nonary">
                      {changeTypeLabel(approval.change_type)}
                    </span>
                    <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-senary/10 text-senary capitalize">
                      {approval.approver_role.replace('_', ' ')}
                    </span>
                  </div>

                  <Link
                    to={`/assets/${approval.asset_id}`}
                    className="text-lg font-semibold text-primary hover:text-senary transition-colors"
                  >
                    {approval.asset_name}
                  </Link>

                  <p className="text-sm text-tertiary mt-1">
                    Requested by <span className="font-medium">{approval.requested_by_name}</span>
                    {' '}&middot;{' '}
                    {new Date(approval.change_created_at).toLocaleString()}
                  </p>

                  <div className="flex flex-col gap-1 sm:flex-row sm:gap-6 mt-3 text-sm">
                    <div>
                      <span className="text-tertiary">From: </span>
                      <code className="bg-quinary px-2 py-0.5 rounded text-xs">
                        {formatChangeValue(approval.change_type, approval.old_value)}
                      </code>
                    </div>
                    <div>
                      <span className="text-tertiary">To: </span>
                      <code className="bg-quinary px-2 py-0.5 rounded text-xs">
                        {formatChangeValue(approval.change_type, approval.new_value)}
                      </code>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => handleAction(approval.change_id, 'approve')}
                    disabled={actionLoading === approval.change_id}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-octonary text-white text-sm font-medium hover:bg-octonary/90 transition-colors disabled:opacity-50"
                  >
                    <Check size={14} />
                    Approve
                  </button>
                  <button
                    onClick={() => handleAction(approval.change_id, 'reject')}
                    disabled={actionLoading === approval.change_id}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-denary text-white text-sm font-medium hover:bg-denary/90 transition-colors disabled:opacity-50"
                  >
                    <X size={14} />
                    Reject
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
